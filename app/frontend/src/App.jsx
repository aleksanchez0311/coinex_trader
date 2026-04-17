import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Zap, Activity, ShieldAlert, Settings, FileBarChart, Layers } from 'lucide-react';

// Componentes
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
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';

// Contextos & Hooks
import { BalanceProvider, useBalance } from './contexts/BalanceContext';
import { useWebSocket } from './hooks/useWebSocket';
import API_URL from './config/api';

const AppContent = ({ exchangeBalance, balanceLoading, credentials, setCredentials }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Risk & Execution States
  const [capital, setCapital] = useState(10);
  const [slPrice, setSlPrice] = useState(0);
  const [tpPrice, setTpPrice] = useState(0);
  const [executing, setExecuting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [currentTradingPlan, setCurrentTradingPlan] = useState(null);
  const [entryPrice, setEntryPrice] = useState(null);
  const [riskAmount, setRiskAmount] = useState(7);
  const [currentTradeSide, setCurrentTradeSide] = useState(null);
  const [pnlStats, setPnlStats] = useState({ total_pnl: 0, count: 0 });

  // Stream de precios
  const { lastTicker } = useWebSocket([selectedSymbol]);

  useEffect(() => {
    if (lastTicker && lastTicker.symbol === selectedSymbol.split('/')[0]) {
      setAnalysisData(prev => {
        if (!prev || !prev.analysis) return prev;
        return {
          ...prev,
          analysis: { ...prev.analysis, last_price: lastTicker.last }
        };
      });
    }
  }, [lastTicker, selectedSymbol]);

  const fetchPnlStats = useCallback(async () => {
    if (!credentials.apiKey || !credentials.apiSecret) return;
    try {
      const response = await fetch(`${API_URL}/pnl-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: credentials.apiKey, secret: credentials.apiSecret })
      });
      const data = await response.json();
      if (data && !data.error) setPnlStats(data);
    } catch (e) { console.error("PnL Fetch Error:", e); }
  }, [credentials]);

  useEffect(() => {
    if (credentials.apiKey) fetchPnlStats();
  }, [credentials, fetchPnlStats]);

  const fetchAnalysis = async (symbol) => {
    setIsLoading(true);
    setAnalysisStep(`Conectando con motor OKX...`);
    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, capital, api_key: credentials.apiKey, secret: credentials.apiSecret })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Error en análisis');
      setAnalysisData(data);
      setHasAnalyzed(true);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); setAnalysisStep(''); }
  };

  const executeTrade = async () => {
    if (!entryPrice || !slPrice) { alert("Error: Entrada y SL obligatorios"); return; }
    setExecuting(true);
    try {
      const res = await fetch(`${API_URL}/execute-trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedSymbol,
          side: currentTradeSide || (analysisData.analysis.bias === "Alcista" ? 'buy' : 'sell'),
          amount: riskAmount / (Math.abs(entryPrice - slPrice) || 1), // Simplificado para cálculo rápido
          entry_price: entryPrice,
          stop_loss: slPrice,
          take_profit: tpPrice || null,
          leverage: 20,
          margin_mode: 'isolated',
          order_type: 'limit',
          api_key: credentials.apiKey,
          secret: credentials.apiSecret
        })
      });
      const data = await res.json();
      if (res.ok) alert(`Orden enviada: ${data.order?.id || 'OK'}`);
      else alert(`Error: ${data.detail}`);
    } catch (e) { alert("Fallo de ejecución"); }
    finally { setExecuting(false); setShowConfirmModal(false); }
  };

  useEffect(() => {
    setAnalysisData(null);
    setHasAnalyzed(false);
    setTpPrice(0);
    setSlPrice(0);
  }, [selectedSymbol]);
  
  useEffect(() => { setRiskAmount(Math.round(capital * 0.7 * 100) / 100); }, [capital]);

  const handleOpenTrade = (plan) => {
    if (plan && plan.sesgo_principal !== 'NO TRADE') {
      const isLong = plan.sesgo_principal === 'LONG';
      const scenario = isLong ? plan.escenarios_alternativos?.long : plan.escenarios_alternativos?.short;
      setCurrentTradeSide(isLong ? 'buy' : 'sell');
      setEntryPrice(plan.configuracion_entrada?.entry_ideal || analysisData.analysis.last_price);
      setSlPrice(scenario?.sl || plan.stop_loss?.nivel);
      setTpPrice(scenario?.tp1 || plan.take_profits?.[0]?.nivel);
      setShowConfirmModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary flex font-sans selection:bg-accent/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} selected={selectedSymbol} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          pnlStats={pnlStats} 
          exchangeBalance={exchangeBalance}
          balanceLoading={balanceLoading}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-4"><MarketList selected={selectedSymbol} setSelected={setSelectedSymbol} onSymbolSelect={setSelectedSymbol} /></div>
                <div className="xl:col-span-8 flex flex-col gap-8">
                  <AnalysisBoard symbol={selectedSymbol} data={analysisData} loading={isLoading} analysisStep={analysisStep} onOpenTrade={handleOpenTrade} onAnalyze={() => fetchAnalysis(selectedSymbol)} hasAnalyzed={hasAnalyzed} />
                  {hasAnalyzed && (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <PlanOperativoButton analysisData={analysisData} loading={isLoading} onOpenPlanModal={(p) => { setCurrentTradingPlan(p); setShowPlanModal(true); }} />
                      <InfoAvanzadaButton analysisData={analysisData} loading={isLoading} />
                    </div>
                  )}
                </div>
            </div>
          )}

          {activeTab === 'positions' && <PositionsTable credentials={credentials} />}
          {activeTab === 'history' && <HistoryView credentials={credentials} />}
          {activeTab === 'strategy' && <StrategyView />}
          {activeTab === 'risk' && <RiskManagementView />}
          {activeTab === 'settings' && <SettingsView credentials={credentials} setCredentials={setCredentials} saveCredentials={(c) => { setCredentials(c); localStorage.setItem('trader_creds', JSON.stringify(c)); }} />}
        </div>

        {/* MODALES CONSOLIDADOS */}
        <PlanOperativoModal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} tradingPlan={currentTradingPlan} symbol={selectedSymbol} onOpenTrade={handleOpenTrade} onOpenAdvanced={() => { setShowPlanModal(false); setShowAdvancedModal(true); }} />
        <InfoAvanzadaModal isOpen={showAdvancedModal} onClose={() => setShowAdvancedModal(false)} analysisData={analysisData} symbol={selectedSymbol} />
        <ConfirmOrderModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} selectedSymbol={selectedSymbol} entryPrice={entryPrice} setEntryPrice={setEntryPrice} slPrice={slPrice} setSlPrice={setSlPrice} tpPrice={tpPrice} setTpPrice={setTpPrice} riskAmount={riskAmount} currentTradeSide={currentTradeSide} executing={executing} onConfirm={executeTrade} exchangeBalance={exchangeBalance} />
      </main>
    </div>
  );
};

const App = () => {
  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem('trader_creds');
    return saved ? JSON.parse(saved) : { apiKey: '', apiSecret: '' };
  });
  
  return (
    <BalanceProvider credentials={credentials}>
      <AppContentWrapper credentials={credentials} setCredentials={setCredentials} />
    </BalanceProvider>
  );
};

const AppContentWrapper = (props) => {
  const { exchangeBalance, balanceLoading } = useBalance();
  return <AppContent {...props} exchangeBalance={exchangeBalance} balanceLoading={balanceLoading} />;
};

export default App;
