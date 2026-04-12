import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, ShieldAlert, Settings, Activity, Zap, X, Layers, FileBarChart } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MarketList from './components/MarketList';
import AnalysisBoard from './components/AnalysisBoard';
import { PlanOperativoButton, InfoAvanzadaButton } from './components/ActionButtons';
import PlanOperativoModal from './components/modals/PlanOperativoModal';
import InfoAvanzadaModal from './components/modals/InfoAvanzadaModal';
import ConfirmOrderModal from './components/modals/ConfirmOrderModal';

import StrategyView from './components/StrategyView';
import RiskManagementView from './components/RiskManagementView';
import PositionsTable from './components/PositionsTable';
import SettingsView from './components/SettingsView';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [pnlStats, setPnlStats] = useState({ total_pnl: 0, count: 0 });
  const [pnlLoading, setPnlLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Estado para Risk Management
  const [capital, setCapital] = useState(30);
  const [riskPct, setRiskPct] = useState(50);
  const [leverage, setLeverage] = useState(20);
  const [slPrice, setSlPrice] = useState(0);
  const [tpPrice, setTpPrice] = useState(0);
  const [riskResult, setRiskResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [currentTradingPlan, setCurrentTradingPlan] = useState(null);
  const [marginMode, setMarginMode] = useState('isolated');
  const [orderType, setOrderType] = useState('limit');
  const [entryPrice, setEntryPrice] = useState(null);
  const [riskAmount, setRiskAmount] = useState(21);
  const [currentTradeSide, setCurrentTradeSide] = useState(null);
  
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
    setPnlLoading(true);
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
    } finally {
      setPnlLoading(false);
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

  useEffect(() => {
    const handleAdvancedModal = () => setShowAdvancedModal(true);
    window.addEventListener('openAdvancedModal', handleAdvancedModal);
    return () => window.removeEventListener('openAdvancedModal', handleAdvancedModal);
  }, []);

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
    if (!entryPrice || !slPrice) {
      alert("Error: Necesitas especificar precio de entrada y stop loss");
      return;
    }
    setExecuting(true);
    
    const positionSize = riskAmount * leverage;
    const tokenAmount = positionSize / entryPrice;
    
    try {
      const response = await fetch('http://localhost:8000/execute-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          side: currentTradeSide || (analysisData.analysis.bias === "Alcista" ? 'buy' : 'sell'),
          amount: tokenAmount,
          entry_price: orderType === 'market' ? null : entryPrice,
          stop_loss: slPrice,
          take_profit: tpPrice || null,
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
      setCapital(30);
      setRiskPct(50);
      setLeverage(20);
      setEntryPrice(null);
      setRiskAmount(21);
      setCurrentTradeSide(null);
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

  const handleOpenTrade = (tradingPlan) => {
    if (tradingPlan && tradingPlan.sesgo_principal !== 'NO TRADE') {
      setCurrentTradeSide(tradingPlan.sesgo_principal === 'LONG' ? 'buy' : 'sell');
      setEntryPrice(tradingPlan.entry || tradingPlan.entry_ideal || analysisData.analysis.last_price);
      setSlPrice(tradingPlan.sl || tradingPlan.stop_loss?.nivel);
      if (tradingPlan.tp1) {
        setTpPrice(tradingPlan.tp1);
      } else if (tradingPlan.take_profits?.[0]?.nivel) {
        setTpPrice(tradingPlan.take_profits[0].nivel);
      }
      setLeverage(20);
      setRiskAmount(Math.round(capital * 0.7));
      setRiskPct(50);
      setShowConfirmModal(true);
    }
  };

  return (
    <div className="flex h-screen bg-background text-white font-sans overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        selected={selectedSymbol}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header 
          pnlStats={pnlStats} 
          pnlLoading={pnlLoading} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
        
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
                  />
                </div>

                {/* Middle: Analysis */}
                <div className="col-span-12 lg:col-span-8">
                  <AnalysisBoard 
                    symbol={selectedSymbol} 
                    data={analysisData} 
                    loading={isLoading}
                    analysisStep={analysisStep}
                    onOpenTrade={handleOpenTrade}
                  />
                </div>
              </div>

              {/* Botones de Plan Operativo e Información Avanzada */}
              <PlanOperativoButton 
                analysisData={analysisData}
                loading={isLoading}
                onOpenPlanModal={(plan) => {
                  setCurrentTradingPlan(plan);
                  setShowPlanModal(true);
                }}
              />
              
              <InfoAvanzadaButton 
                analysisData={analysisData}
                loading={isLoading}
              />
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
            <div className="w-full">
              <SettingsView 
                credentials={credentials} 
                setCredentials={setCredentials} 
                saveCredentials={saveCredentials} 
              />
            </div>
          )}
        </div>
      </main>

      {/* Modales */}
      <PlanOperativoModal 
        isOpen={showPlanModal}
        onClose={() => { setShowPlanModal(false); setCurrentTradingPlan(null); }}
        tradingPlan={currentTradingPlan}
        onOpenTrade={handleOpenTrade}
      />

      <InfoAvanzadaModal 
        isOpen={showAdvancedModal}
        onClose={() => setShowAdvancedModal(false)}
        analysisData={analysisData}
      />

      <ConfirmOrderModal 
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        selectedSymbol={selectedSymbol}
        orderType={orderType}
        setOrderType={setOrderType}
        marginMode={marginMode}
        setMarginMode={setMarginMode}
        leverage={leverage}
        setLeverage={setLeverage}
        entryPrice={entryPrice}
        setEntryPrice={setEntryPrice}
        slPrice={slPrice}
        setSlPrice={setSlPrice}
        tpPrice={tpPrice}
        setTpPrice={setTpPrice}
        riskAmount={riskAmount}
        setRiskAmount={setRiskAmount}
        currentTradeSide={currentTradeSide}
        executing={executing}
        onConfirm={executeTrade}
      />
    </div>
  );
};

export default App;
