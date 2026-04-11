import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, ShieldAlert, Settings, Activity, Zap, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MarketList from './components/MarketList';
import AnalysisBoard from './components/AnalysisBoard';

import StrategyView from './components/StrategyView';
import RiskManagementView from './components/RiskManagementView';
import PositionsTable from './components/PositionsTable';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [pnlStats, setPnlStats] = useState({ total_pnl: 0, count: 0 });
  
  // Estado para Risk Management
  const [capital, setCapital] = useState(100);
  const [riskPct, setRiskPct] = useState(1);
  const [leverage, setLeverage] = useState(10);
  const [slPrice, setSlPrice] = useState(0);
  const [tpPrice, setTpPrice] = useState(0);
  const [riskResult, setRiskResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [marginMode, setMarginMode] = useState('isolated');
  const [orderType, setOrderType] = useState('limit');
  const [entryPrice, setEntryPrice] = useState(null);
  
  // Gestión de credenciales
  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem('trader_creds');
    return saved ? JSON.parse(saved) : { apiKey: '', apiSecret: '' };
  });

  const fetchPnlStats = async () => {
    if (!credentials.apiKey || !credentials.apiSecret) {
      console.log("No credentials, skipping PnL fetch");
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/pnl-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          api_key: credentials.apiKey,
          secret: credentials.apiSecret
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("PnL stats error:", errorData);
        return;
      }
      const data = await response.json();
      if (data && !data.error) setPnlStats(data);
    } catch (e) {
      console.error("Error fetching PnL stats:", e);
    }
  };

  useEffect(() => {
    const hasCredentials = credentials.apiKey && credentials.apiSecret;
    if (hasCredentials) {
      fetchPnlStats();
    }
    
    const handleVisibilityChange = () => {
      if (!document.hidden && hasCredentials) {
        fetchPnlStats();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [credentials]);

  const saveCredentials = (newCreds) => {
    setCredentials(newCreds);
    localStorage.setItem('trader_creds', JSON.stringify(newCreds));
  };

  const fetchAnalysis = async (symbol) => {
    setIsLoading(true);
    setAnalysisStep(`Conectando con OKX • Descargando velas 1h de ${symbol}...`);
    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol,
          api_key: credentials.apiKey,
          secret: credentials.apiSecret
        })
      });
      
      setAnalysisStep(`Procesando ${symbol} • Estructura SMC + EMA + RSI + ATR...`);
      const data = await response.json();
      
      setAnalysisData(data);
      setAnalysisStep(`Análisis completo • Score: ${data?.scoring?.total_score || '...'}/100`);
    } catch (error) {
      console.error("Error fetching analysis:", error);
    } finally {
      setIsLoading(false);
      setAnalysisStep('');
    }
  };

  const handleSymbolSelect = (symbol) => {
    setSelectedSymbol(symbol);
  };

  const calculateRisk = async () => {
    if (!analysisData?.analysis) {
      console.log("No hay analysisData aún");
      return;
    }
    try {
      console.log(">>> Calculando riesgo...");
      console.log("Parámetros:", { 
        capital: capital, 
        riskPct: riskPct, 
        leverage: leverage, 
        slPrice: slPrice,
        entry_price: analysisData.analysis.last_price 
      });
      
      const response = await fetch('http://localhost:8000/risk-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capital,
          risk_pct: riskPct,
          entry_price: analysisData.analysis.last_price,
          stop_loss: slPrice || analysisData.risk_recommendations?.stop_loss,
          take_profit: tpPrice || null,
          leverage
        })
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        alert(`Error: ${errorData.detail || 'Error en el cálculo'}`);
        return;
      }
      
      const data = await response.json();
      console.log(">>> Risk result received:", data);
      console.log(">>> plan.tp1:", data.plan?.tp1);
      console.log(">>> current tpPrice state:", tpPrice);
      
      if (data.error) {
        alert(`Error: ${data.error}`);
        return;
      }

      console.log(">>> Actualizando riskResult state...");
      setRiskResult(data);
      
      if (data.plan?.tp1) {
        console.log(">>> Setting tpPrice to:", data.plan.tp1);
        setTpPrice(data.plan.tp1);
      }
      
      console.log(">>> Cálculo completado");
    } catch (e) {
      console.error(">>> Error calculating risk:", e);
      alert(`Error de conexión: ${e.message}`);
    }
  };

  const executeTrade = async () => {
    if (!riskResult || !analysisData) return;
    setExecuting(true);
    try {
      const response = await fetch('http://localhost:8000/execute-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          side: analysisData.analysis.bias === "Alcista" ? 'buy' : 'sell',
          amount: riskResult.position.position_size,
          entry_price: orderType === 'market' ? null : (entryPrice || analysisData.analysis.last_price),
          stop_loss: slPrice,
          take_profit: tpPrice || riskResult.plan?.tp1 || null,
          leverage: leverage,
          margin_mode: marginMode,
          order_type: orderType,
          api_key: credentials.apiKey,
          secret: credentials.apiSecret
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Éxito: Orden ${data.clientOrderId || data.order_id} enviada (${data.side})`);
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (e) {
      console.error(e);
      alert(`Error de ejecución: ${e.message || "Error de conexión"}`);
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    if (selectedSymbol) {
      fetchAnalysis(selectedSymbol);
      setTpPrice(0);
      setSlPrice(0);
      setRiskResult(null);
      setCapital(100);
      setRiskPct(1);
      setLeverage(10);
      setEntryPrice(null);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    if (analysisData?.risk_recommendations) {
      const recs = analysisData.risk_recommendations;
      setSlPrice(recs.stop_loss);
      setRiskPct(recs.risk_pct);
      setLeverage(recs.leverage);
    } else if (analysisData?.analysis) {
      const currentPrice = analysisData.analysis.last_price;
      const dist = currentPrice * 0.02; 
      setSlPrice(analysisData.analysis.bias === "Alcista" ? currentPrice - dist : currentPrice + dist);
    }
    
    if (analysisData?.position?.tp1) {
      setTpPrice(analysisData.position.tp1);
    }
  }, [analysisData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedSymbol) {
        fetchAnalysis(selectedSymbol);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedSymbol]);

  const handleOpenTrade = () => {
    if (analysisData?.analysis?.bias !== 'Neutral') {
      setEntryPrice(analysisData.analysis.last_price);
      setShowConfirmModal(true);
    }
  };

  return (
    <div className="flex h-screen bg-background text-white font-sans overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onOpenTrade={handleOpenTrade}
        canOpenTrade={analysisData?.analysis?.bias !== 'Neutral'}
        hasRiskResult={!!riskResult}
        bias={analysisData?.analysis?.bias || 'Neutral'}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header pnlStats={pnlStats} />
        
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-12 gap-6">
                {/* Left: Market List */}
                <div className="col-span-12 lg:col-span-4">
                  <MarketList 
                    selected={selectedSymbol} 
                    setSelected={setSelectedSymbol}
                    onSymbolSelect={handleSymbolSelect}
                    analysis={analysisData}
                    result={riskResult}
                    slPrice={slPrice}
                    tpPrice={tpPrice}
                    leverage={leverage}
                    setLeverage={setLeverage}
                    capital={capital}
                    setCapital={setCapital}
                    riskPct={riskPct}
                    setRiskPct={setRiskPct}
                    calculateRisk={calculateRisk}
                    onOpenTrade={handleOpenTrade}
                    canOpenTrade={analysisData?.analysis?.bias !== 'Neutral'}
                    bias={analysisData?.analysis?.bias || 'Neutral'}
                  />
                </div>

                {/* Middle: Analysis */}
                <div className="col-span-12 lg:col-span-8">
                  <AnalysisBoard 
                    symbol={selectedSymbol} 
                    data={analysisData} 
                    loading={isLoading}
                    analysisStep={analysisStep}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'strategy' && <StrategyView />}
          {activeTab === 'risk' && <RiskManagementView />}
          
          {activeTab === 'positions' && (
            <div className="w-full">
              <PositionsTable 
                credentials={credentials}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            // ... settings code ...
            <div className="glass p-8 max-w-2xl mx-auto mt-10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Settings className="text-accent" /> Configuración de API
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CoinEx API Key</label>
                  <input 
                    type="password" 
                    value={credentials.apiKey}
                    onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
                    placeholder="Tu API Key" 
                    className="w-full bg-surface border border-border p-3 rounded-lg outline-none focus:border-accent" 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CoinEx API Secret</label>
                  <input 
                    type="password" 
                    value={credentials.apiSecret}
                    onChange={(e) => setCredentials({...credentials, apiSecret: e.target.value})}
                    placeholder="Tu API Secret" 
                    className="w-full bg-surface border border-border p-3 rounded-lg outline-none focus:border-accent" 
                  />
                </div>
                <button 
                  onClick={() => {
                    const saved = localStorage.getItem('trader_creds');
                    if (saved) {
                      setCredentials(JSON.parse(saved));
                    } else {
                      alert('No hay credenciales guardadas');
                    }
                  }}
                  className="bg-surface border border-accent text-accent font-bold px-6 py-3 rounded-lg hover:bg-accent/10 transition-opacity"
                >
                  Actualizar desde LocalStorage
                </button>
                <button 
                  onClick={() => saveCredentials(credentials)}
                  className="bg-accent text-black font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Guardar Credenciales
                </button>
                <button 
                  onClick={() => {
                    localStorage.removeItem('trader_creds');
                    setCredentials({ apiKey: '', apiSecret: '' });
                  }}
                  className="bg-transparent border border-short text-short font-bold px-6 py-3 rounded-lg hover:bg-short/10 transition-opacity"
                >
                  Borrar Credenciales
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass border border-border p-4 w-[350px] max-w-[90%]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-white">Confirmar Orden</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-gray-400">Par:</span>
                <span className="font-mono text-white">{selectedSymbol}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-gray-400">Orden:</span>
                <select 
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="bg-surface border border-border rounded px-2 py-0.5 text-white text-xs"
                >
                  <option value="limit">Limit</option>
                  <option value="market">Market</option>
                </select>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-gray-400">Margen:</span>
                <select 
                  value={marginMode}
                  onChange={(e) => setMarginMode(e.target.value)}
                  className="bg-surface border border-border rounded px-2 py-0.5 text-white text-xs"
                >
                  <option value="isolated">Aislado</option>
                  <option value="cross">Cruzado</option>
                </select>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-gray-400">Apalancamiento:</span>
                <span className="font-mono text-accent">{leverage}x</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-gray-400">Entrada:</span>
                <input 
                  type="number"
                  value={entryPrice || analysisData?.analysis?.last_price || ''}
                  onChange={(e) => setEntryPrice(Number(e.target.value))}
                  className="bg-surface border border-border rounded px-2 py-0.5 text-white font-mono text-xs w-28 text-right"
                />
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-gray-400">Entrada Sugerida:</span>
                <span className="font-mono text-green-400">${analysisData?.analysis?.last_price?.toLocaleString() || '---'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-gray-400">Zonas de Entrada:</span>
                <span className="font-mono text-yellow-400 text-xs">
                  {analysisData?.analysis?.entry_zones?.map(z => z.toFixed(2)).join(' / ') || '---'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-gray-400">Stop Loss:</span>
                <span className="font-mono text-short">${slPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-gray-400">Take Profit:</span>
                <span className="font-mono text-long">${tpPrice?.toLocaleString() || riskResult?.plan?.tp1 || '---'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-gray-400">Cantidad:</span>
                <span className="font-mono text-white">{riskResult?.position?.position_size?.toFixed(4) || '---'} {selectedSymbol?.split('/')[0]}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-gray-400">Modo:</span>
                <span className="text-short text-xs font-bold">REAL</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 bg-white/5 border border-border rounded-lg text-xs font-medium hover:bg-white/10"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  executeTrade();
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                  analysisData?.analysis?.bias === 'Alcista' 
                    ? 'bg-long text-black hover:opacity-90' 
                    : 'bg-short text-white hover:opacity-90'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
