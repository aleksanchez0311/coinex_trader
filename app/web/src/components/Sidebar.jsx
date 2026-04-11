import React from 'react';
import { LayoutDashboard, TrendingUp, ShieldAlert, Settings, Play, Layers, Calculator } from 'lucide-react';

const Sidebar = ({ 
  activeTab, setActiveTab, selected, analysis, result, slPrice, tpPrice, 
  leverage, setLeverage, capital, setCapital, riskPct, setRiskPct, 
  calculateRisk, onOpenTrade, canOpenTrade, bias 
}) => {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'positions', icon: Layers, label: 'Posiciones' },
    { id: 'strategy', icon: TrendingUp, label: 'Estrategias' },
    { id: 'risk', icon: ShieldAlert, label: 'Gestión de Riesgo' },
    { id: 'settings', icon: Settings, label: 'Configuración' },
  ];

  return (
    <aside className="w-64 bg-surface/50 border-r border-border flex flex-col">
      <div className="p-6 flex items-center gap-3 shrink-0">
        <img src="/favicon.svg" alt="CoinEx Trader" className="w-10 h-10 rounded-xl" />
        <h1 className="text-xl font-bold title-gradient">CoinEx Trader</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-premium flex flex-col">
        <nav className="px-4 py-6 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === item.id 
                ? 'bg-accent/10 text-accent border border-accent/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      
      {/* Formulario de Riesgo */}
      <div className="p-4 border-t border-border/40 bg-surface/30 mt-auto shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <Calculator size={12} />
            <span className="font-bold uppercase">Riesgo Rápido ({selected || '---'})</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="text-[9px] text-gray-500 uppercase block mb-1">Capital</label>
            <input 
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full bg-surface border border-border p-1.5 rounded text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[9px] text-gray-500 uppercase block mb-1">Riesgo %</label>
            <input 
              type="number"
              value={riskPct}
              onChange={(e) => setRiskPct(Number(e.target.value))}
              className="w-full bg-surface border border-border p-1.5 rounded text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[9px] text-gray-500 uppercase block mb-1">Apal.</label>
            <input 
              type="number"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="w-full bg-surface border border-border p-1.5 rounded text-xs font-mono"
            />
          </div>
        </div>

        <button 
          onClick={() => {
            console.log("Botón presionado, analysis:", analysis?.analysis);
            calculateRisk();
          }}
          disabled={!analysis?.analysis}
          className="w-full py-2 bg-white/5 border border-border rounded-lg text-xs font-medium hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed mb-2 transition-colors"
        >
          {!analysis?.analysis ? 'Cargando análisis...' : 'Calcular Posición'}
        </button>

        {result && (
          <div className="space-y-2 pt-2 border-t border-border/30">
            <div className="text-[10px] text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Entrada:</span>
                <span className="font-mono text-green-400">${result.plan?.entry?.toFixed(2) || analysis?.analysis?.last_price?.toFixed(2) || '---'}</span>
              </div>
              <div className="flex justify-between">
                <span>Posición:</span>
                <span className="font-mono text-white">{result.position?.position_size?.toFixed(4)} <span className="text-[8px]">{selected?.split('/')[0]}</span></span>
              </div>
              <div className="flex justify-between">
                <span>SL:</span>
                <span className="font-mono text-short">${slPrice?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>TP:</span>
                <span className="font-mono text-long">${tpPrice || result.plan?.tp1?.toFixed(2) || '---'}</span>
              </div>
              <div className="flex justify-between">
                <span>Margen:</span>
                <span className="font-mono">${result.position?.margin_required}</span>
              </div>
            </div>
            
            <button
              onClick={onOpenTrade}
              className={`w-full py-2 mt-1 rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                bias === 'Alcista' 
                  ? 'bg-long text-black hover:opacity-90 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                  : bias === 'Bajista' 
                    ? 'bg-short text-white hover:opacity-90 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                    : 'bg-gray-600 text-gray-300'
              }`}
            >
              <Play fill="currentColor" size={14} />
              {bias === 'Alcista' ? 'LONG' : bias === 'Bajista' ? 'SHORT' : 'TRADE'} REAL
            </button>
          </div>
        )}
      </div>

      </div>
    </aside>
  );
};

export default Sidebar;
