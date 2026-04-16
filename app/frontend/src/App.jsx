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
import { BalanceProvider, useBalance } from './contexts/BalanceContext';
import API_URL from './config/api';

const AppContent = ({ exchangeBalance, balanceLoading, balanceError, refetchBalance, credentials, setCredentials }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [autoAnalyzeEnabled, setAutoAnalyzeEnabled] = useState(false);
  const [pnlStats, setPnlStats] = useState({ total_pnl: 0, count: 0 });
  const [pnlLoading, setPnlLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const analysisCountry = 'Cuba';
  const DEFAULT_CAPITAL = 10;
  
  // Estado para Risk Management
  const [capital, setCapital] = useState(DEFAULT_CAPITAL);
  const [riskPct, setRiskPct] = useState(30);
  const [leverage, setLeverage] = useState(20);
  const [slPrice, setSlPrice] = useState(0);
  const [tpPrice, setTpPrice] = useState(0);
  const [executing, setExecuting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [currentTradingPlan, setCurrentTradingPlan] = useState(null);
  const [marginMode, setMarginMode] = useState('isolated');
  const [orderType, setOrderType] = useState('limit');
  const [entryPrice, setEntryPrice] = useState(null);
  const [riskAmount, setRiskAmount] = useState(7);
  const [currentTradeSide, setCurrentTradeSide] = useState(null);

  const fetchPnlStats = async () => {
    if (!credentials.apiKey || !credentials.apiSecret) {
      console.log("No credentials, skipping PnL fetch");
      return;
    }
    setPnlLoading(true);
    try {
      const response = await fetch(`${API_URL}/pnl-stats`, {
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

  const saveAnalysisCache = (symbol, data) => {
    try {
      const cache = JSON.parse(localStorage.getItem('analysis_cache') || '{}');
      cache[symbol] = { data, timestamp: Date.now() };
      localStorage.setItem('analysis_cache', JSON.stringify(cache));
    } catch (e) {
      console.error("Error saving analysis cache:", e);
    }
  };

  const loadAnalysisCache = (symbol) => {
    try {
      const cache = JSON.parse(localStorage.getItem('analysis_cache') || '{}');
      return cache[symbol]?.data || null;
    } catch (e) {
      console.error("Error loading analysis cache:", e);
      return null;
    }
  };

  const fetchAnalysis = async (symbol) => {
    setIsLoading(true);
    setAnalysisStep(`Conectando con OKX • Descargando velas 1h de ${symbol}...`);
    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol,
          country: analysisCountry || 'Cuba',
          capital,
          api_key: credentials.apiKey,
          secret: credentials.apiSecret
        })
      });
      
      setAnalysisStep(`Procesando ${symbol} • Estructura SMC + EMA + RSI + ATR...`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error obteniendo análisis');
      }
      const data = await response.json();
      
      setAnalysisData(data);
      saveAnalysisCache(symbol, data);
      setAnalysisStep(`Análisis completo • Score: ${data?.scoring?.total_score || '...'}/100`);
    } catch (error) {
      console.error("Error fetching analysis:", error);
    } finally {
      setIsLoading(false);
      setAnalysisStep('');
        setIsFromCache(false);
      }
  };

  const resolvePositionSize = async () => {
    const resolvedEntryPrice = Number(entryPrice) || Number(analysisData?.analysis?.last_price);
    const resolvedStopLoss = Number(slPrice);

    if (!resolvedEntryPrice || !resolvedStopLoss) {
      throw new Error('Precio de entrada y stop loss son obligatorios');
    }

    const response = await fetch(`${API_URL}/risk-management`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capital,
          risk_pct: 30,
          entry_price: resolvedEntryPrice,
          stop_loss: resolvedStopLoss,
          take_profit: tpPrice || null,
          leverage: 20,
          operation_size_pct: 70
        })
      });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'No se pudo calcular el tamaño de posición');
    }

    const amount = data?.position?.position_size;
    if (!amount || Number(amount) <= 0) {
      throw new Error('El tamaño de posición calculado es inválido');
    }

    return Number(amount);
  };

  const handleSymbolSelect = (symbol) => {
    setSelectedSymbol(symbol);
  };

  const _calculateRisk = async () => {
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
      
      const response = await fetch(`${API_URL}/risk-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capital,
          risk_pct: 30,
          entry_price: analysisData.analysis.last_price,
          stop_loss: slPrice || analysisData.risk_recommendations?.stop_loss,
          take_profit: tpPrice || null,
          leverage: 20,
          operation_size_pct: 70
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
    console.log(">>> EXECUTE TRADE DEBUG <<<");
    console.log("entryPrice:", entryPrice);
    console.log("slPrice:", slPrice);
    console.log("tpPrice:", tpPrice);
    console.log("selectedSymbol:", selectedSymbol);
    console.log("currentTradeSide:", currentTradeSide);
    console.log("analysisData.analysis.bias:", analysisData?.analysis?.bias);
    console.log("orderType:", orderType);
    console.log("leverage:", leverage);
    console.log("marginMode:", marginMode);
    console.log("credentials.apiKey:", credentials?.apiKey ? "***" : "undefined");
    console.log("credentials.apiSecret:", credentials?.apiSecret ? "***" : "undefined");
    
    if (!entryPrice || !slPrice) {
      alert("Error: Necesitas especificar precio de entrada y stop loss");
      return;
    }
    setExecuting(true);

    try {
      const tokenAmount = await resolvePositionSize();
      console.log("tokenAmount:", tokenAmount);
      
      const requestBody = {
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
      };
      
      console.log(">>> Request body:", requestBody);
      
      const response = await fetch(`${API_URL}/execute-trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      console.log(">>> Response data:", data);
      if (response.ok) {
        const orderId = data.order?.id || data.order?.clientOrderId || data.clientOrderId || data.order_id || 'N/A';
        const side = data.order?.side || data.side || 'N/A';
        alert(`Éxito: Orden ${orderId} enviada (${side})`);
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (e) {
      console.error(e);
      alert(`Error de ejecución: ${e.message || "Error de conexión"}`);
    } finally {
      setExecuting(false);
      setShowConfirmModal(false);
    }
  };

  useEffect(() => {
    const cachedData = loadAnalysisCache(selectedSymbol);
    if (cachedData) {
      setAnalysisData(cachedData);
      setHasAnalyzed(true);
      setIsFromCache(true);
    } else {
      setAnalysisData(null);
      setHasAnalyzed(false);
      setIsFromCache(false);
    }
    setTpPrice(0);
    setSlPrice(0);
    setCapital(DEFAULT_CAPITAL);
    setRiskPct(30);
    setLeverage(20);
    setEntryPrice(null);
    setRiskAmount(7);
    setCurrentTradeSide(null);
  }, [selectedSymbol]);

  
  useEffect(() => {
    setRiskAmount(Math.round(capital * 0.7 * 100) / 100);
  }, [capital]);
  
  useEffect(() => {
    if (autoAnalyzeEnabled && !hasAnalyzed && analysisData) {
      fetchAnalysis(selectedSymbol);
    }
  }, [selectedSymbol, autoAnalyzeEnabled, hasAnalyzed, analysisData]);

  useEffect(() => {
    if (analysisData?.risk_recommendations) {
      const recs = analysisData.risk_recommendations;
      setSlPrice(recs.stop_loss);
      setRiskPct(30);
      setLeverage(20);
    } else if (analysisData?.analysis) {
      const currentPrice = analysisData.analysis.last_price;
      const dist = currentPrice * 0.02; 
      setSlPrice(analysisData.analysis.bias === "Alcista" ? currentPrice - dist : currentPrice + dist);
    }
    
    // El TP debe venir del trading plan o del cálculo de riesgo
    if (analysisData?.trading_plan?.objetivos?.tp1?.nivel) {
      setTpPrice(analysisData.trading_plan.objetivos.tp1.nivel);
    } else if (analysisData?.trading_plan?.escenarios_alternativos?.long?.tp1 && analysisData?.trading_plan?.sesgo_principal === 'LONG') {
      setTpPrice(analysisData.trading_plan.escenarios_alternativos.long.tp1);
    } else if (analysisData?.trading_plan?.escenarios_alternativos?.short?.tp1 && analysisData?.trading_plan?.sesgo_principal === 'SHORT') {
      setTpPrice(analysisData.trading_plan.escenarios_alternativos.short.tp1);
    }
  }, [analysisData]);

  const handleOpenTrade = (tradingPlan) => {
    if (tradingPlan && tradingPlan.sesgo_principal !== 'NO TRADE') {
      const isLong = tradingPlan.sesgo_principal === 'LONG';
      const scenario = isLong ? tradingPlan.escenarios_alternativos?.long : tradingPlan.escenarios_alternativos?.short;
      
      setCurrentTradeSide(isLong ? 'buy' : 'sell');
      setEntryPrice(tradingPlan.configuracion_entrada?.entry_ideal || tradingPlan.entry_ideal || tradingPlan.entry || analysisData.analysis.last_price);
      setSlPrice(scenario?.sl || tradingPlan.stop_loss?.nivel);
      setTpPrice(scenario?.tp1 || tradingPlan.take_profits?.[0]?.nivel);
      setLeverage(20);
      setRiskAmount(Math.round(capital * 0.7 * 100) / 100);
      setRiskPct(30);
      setShowConfirmModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} selected={selectedSymbol} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header 
          pnlStats={pnlStats} 
          pnlLoading={pnlLoading} 
          exchangeBalance={exchangeBalance}
          balanceLoading={balanceLoading}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          onCloseSidebar={() => setSidebarOpen(false)}
        />
      
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6">
                {/* Left: Market List */}
                <div className="col-span-1 md:col-span-12 lg:col-span-4">
                  <MarketList 
                    selected={selectedSymbol} 
                    setSelected={setSelectedSymbol}
                    onSymbolSelect={handleSymbolSelect}
                  />
                </div>

                {/* Middle: Analysis */}
                <div className="col-span-1 md:col-span-12 lg:col-span-8">
                  <AnalysisBoard 
                    symbol={selectedSymbol} 
                    data={analysisData} 
                    loading={isLoading}
                    analysisStep={analysisStep}
                    onOpenTrade={handleOpenTrade}
                    onAnalyze={() => {
                      setAutoAnalyzeEnabled(true);
                      setIsFromCache(false);
                      setHasAnalyzed(true);
                      fetchAnalysis(selectedSymbol);
                    }}
                    hasAnalyzed={hasAnalyzed}
                    isFromCache={isFromCache}
                  />
                </div>
              </div>

              {/* Botones de Plan Operativo e Información Avanzada */}
              {hasAnalyzed && (
                <>
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
                </>
              )}
            </div>
          )}

          {activeTab === 'positions' && (
            <div className="w-full">
              <PositionsTable 
                credentials={credentials}
              />
            </div>
          )}
          {activeTab === 'strategy' && <StrategyView />}
          {activeTab === 'risk' && <RiskManagementView />}
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

        {/* Modales */}
        <PlanOperativoModal 
          isOpen={showPlanModal}
          onClose={() => { setShowPlanModal(false); setCurrentTradingPlan(null); }}
          tradingPlan={currentTradingPlan}
          symbol={selectedSymbol}
          onOpenTrade={handleOpenTrade}
        />

        <InfoAvanzadaModal 
          isOpen={showAdvancedModal}
          onClose={() => setShowAdvancedModal(false)}
          analysisData={analysisData}
          symbol={selectedSymbol}
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
          tradingPlan={currentTradingPlan}
          exchangeBalance={exchangeBalance}
        />
      </main>
    </div>
  );
};

const AppWithBalance = ({ credentials, setCredentials }) => {
  const { exchangeBalance, balanceLoading, balanceError, refetchBalance } = useBalance();
  
  return <AppContent 
    exchangeBalance={exchangeBalance}
    balanceLoading={balanceLoading}
    balanceError={balanceError}
    refetchBalance={refetchBalance}
    credentials={credentials}
    setCredentials={setCredentials}
  />;
};

const App = () => {
  // Gestión de credenciales - nivel superior
  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem('trader_creds');
    return saved ? JSON.parse(saved) : { apiKey: '', apiSecret: '' };
  });
  
  return (
    <BalanceProvider credentials={credentials}>
      <AppWithBalance credentials={credentials} setCredentials={setCredentials} />
    </BalanceProvider>
  );
};

export default App;
