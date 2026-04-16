import React from 'react';
import { X, Target, ShieldAlert, Zap, AlertTriangle } from 'lucide-react';

const ConfirmOrderModal = ({
  isOpen, onClose, selectedSymbol, orderType, setOrderType, marginMode, setMarginMode,
  leverage, entryPrice, setEntryPrice, slPrice, setSlPrice, tpPrice, setTpPrice,
  riskAmount, setRiskAmount, currentTradeSide, executing, onConfirm, tradingPlan, exchangeBalance
}) => {
  if (!isOpen) return null;

  const isLong = currentTradeSide === 'buy';
  const scenario = isLong ? tradingPlan?.escenarios_alternativos?.long : tradingPlan?.escenarios_alternativos?.short;
  const tps = scenario ? [scenario.tp1, scenario.tp2, scenario.tp3] : [];
  const sls = scenario ? [scenario.sl] : []; // Simplificamos a 1 SL principal

  const maxAvailableAmount = exchangeBalance ? Number(exchangeBalance) : 0;
  
  const projectedLoss = entryPrice && slPrice
    ? Math.abs(((entryPrice - slPrice) / entryPrice) * riskAmount * leverage).toFixed(2)
    : '0.00';
    
  const projectedProfit = entryPrice && tpPrice
    ? Math.abs(((tpPrice - entryPrice) / entryPrice) * riskAmount * leverage).toFixed(2)
    : '0.00';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="glass-elevated w-full max-w-md overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
        {/* Header - Identidad de Trade */}
        <div className={`p-6 flex items-center justify-between ${isLong ? 'bg-long/10 border-b border-long/20' : 'bg-short/10 border-b border-short/20'}`}>
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg ${isLong ? 'bg-long text-background' : 'bg-short text-white'}`}>
                <Zap size={20} fill="currentColor" />
             </div>
             <div>
                <h3 className="font-black text-lg text-white uppercase tracking-tighter">Ejecutar {selectedSymbol}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isLong ? 'Long' : 'Short'} • {leverage}x Aislado</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Riesgo Dinámico */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="text-[8px] text-gray-500 uppercase font-black block mb-2 tracking-widest">Riesgo Máx.</span>
                <span className="text-xl font-mono font-bold text-short">-{projectedLoss} USDT</span>
             </div>
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-right">
                <span className="text-[8px] text-gray-500 uppercase font-black block mb-2 tracking-widest">Beneficio Est.</span>
                <span className="text-xl font-mono font-bold text-long">+{projectedProfit} USDT</span>
             </div>
          </div>

          {/* Capital Input - Hero Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Capital a Utilizar (Margen)</label>
                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">Disp: {maxAvailableAmount.toFixed(2)}</span>
            </div>
            <div className="relative">
                <input
                type="number"
                value={riskAmount}
                onChange={(e) => setRiskAmount(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-mono text-2xl font-bold text-white focus:outline-none focus:border-accent hover:border-white/20 transition-all"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-gray-600 uppercase">USDT</span>
            </div>
          </div>

          {/* Niveles Rápidos */}
          <div className="space-y-3">
             <div className="flex items-center justify-between text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">
                <span>Niveles de Precisión</span>
                <div className="h-px bg-white/5 flex-1 ml-4"></div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <div className="flex items-center gap-1.5 text-short mb-1">
                      <AlertTriangle size={10} />
                      <span className="text-[8px] uppercase font-bold">Stop Loss</span>
                   </div>
                   <input
                    type="number"
                    value={slPrice || ''}
                    onChange={(e) => setSlPrice(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-short focus:outline-none focus:border-short/50"
                  />
                </div>
                <div className="space-y-1">
                   <div className="flex items-center gap-1.5 text-long mb-1">
                      <Target size={10} />
                      <span className="text-[8px] uppercase font-bold">Take Profit</span>
                   </div>
                   <input
                    type="number"
                    value={tpPrice || ''}
                    onChange={(e) => setTpPrice(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-long focus:outline-none focus:border-long/50"
                  />
                </div>
             </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all"
          >
            Abortar
          </button>
          <button
            onClick={onConfirm}
            disabled={executing || riskAmount <= 0}
            className={`flex-[2] py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${
                executing ? 'opacity-50 cursor-not-allowed' : 
                isLong ? 'bg-long text-background shadow-long/20 hover:brightness-110' : 
                'bg-short text-white shadow-short/20 hover:brightness-110'
            }`}
          >
            {executing ? 'Procesando...' : 'Lanzar Orden Live'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmOrderModal;
