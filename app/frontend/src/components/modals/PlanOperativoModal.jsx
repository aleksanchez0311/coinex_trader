import React, { useState } from 'react';
import { X, Shield, Target, Info, ChevronDown, ChevronUp, Zap, BarChart3 } from 'lucide-react';

const SimpleValue = ({ label, value, colorClass = 'text-white' }) => (
  <div className="flex flex-col">
    <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">{label}</span>
    <span className={`text-xl font-mono font-bold ${colorClass}`}>{value}</span>
  </div>
);

const PlanOperativoModal = ({ isOpen, onClose, tradingPlan, symbol, onOpenTrade, onOpenAdvanced }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  if (!isOpen || !tradingPlan) return null;

  const isLong = tradingPlan.sesgo_principal === 'LONG';
  const isShort = tradingPlan.sesgo_principal === 'SHORT';
  const niveles = tradingPlan.niveles_clave || {};
  const entrada = tradingPlan.configuracion_entrada || {};
  const riesgo = tradingPlan.gestion_riesgo || {};
  const sizing = tradingPlan.calculo_posicion || {};

  const openActiveTrade = () => {
    if (tradingPlan.sesgo_principal !== 'NO TRADE' && onOpenTrade) onOpenTrade(tradingPlan);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="glass-elevated w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl">
        {/* Header - Compacto */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-xl ${isLong ? 'bg-long/10 text-long' : isShort ? 'bg-short/10 text-short' : 'bg-gray-500/10 text-gray-400'}`}>
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <h3 className="font-black text-xl text-white uppercase tracking-tighter">Plan {symbol}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Setup de Alta Probabilidad</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Main Direction Banner */}
          <div className={`p-4 rounded-2xl flex items-center justify-between ${isLong ? 'bg-long/10 border border-long/20' : 'bg-short/10 border border-short/20'}`}>
             <span className={`text-2xl font-black ${isLong ? 'text-long' : 'text-short'}`}>{tradingPlan.sesgo_principal}</span>
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">R:R {tradingPlan.riesgo_beneficio?.esperado || '1:2.0'}</span>
          </div>

          {/* Core Levels - Grilla Simple */}
          <div className="grid grid-cols-2 gap-8">
            <SimpleValue 
              label="Precio Entrada" 
              value={entrada.entry_ideal ? `$${entrada.entry_ideal.toLocaleString()}` : 'MKT'} 
              colorClass="text-white"
            />
            <SimpleValue 
              label="Invalidación (SL)" 
              value={tradingPlan.stop_loss?.nivel ? `$${tradingPlan.stop_loss.nivel.toLocaleString()}` : 'N/A'} 
              colorClass="text-short"
            />
          </div>

          {/* Take Profits - Visual Highlights */}
          <div>
            <div className="flex items-center justify-between mb-4">
               <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Objetivos de Salida</span>
               <span className="h-px bg-white/5 flex-1 ml-4"></span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(tradingPlan.take_profits || []).slice(0, 3).map((tp, i) => (
                <div key={tp.tp} className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <p className="text-[8px] text-gray-500 font-black uppercase mb-1">{tp.tp}</p>
                  <p className="text-sm font-mono font-bold text-long">${tp.nivel?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Managed Risk - Info Crítica */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 grid grid-cols-2 gap-4">
             <div>
                <span className="text-[8px] text-gray-500 uppercase font-black block mb-1">Pérdida Proyectada</span>
                <span className="text-sm font-bold text-short">-{riesgo.perdida_monetaria_si_sl || '0'} USDT</span>
             </div>
             <div>
                <span className="text-[8px] text-gray-500 uppercase font-black block mb-1">Tamaño Posición</span>
                <span className="text-sm font-bold text-white">{sizing.tamano_posicion || 'N/A'}</span>
             </div>
          </div>

          {/* Botón Detalles - Muy discreto */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showAdvanced ? 'Ocultar' : 'Ver'} Parámetros Técnicos
            {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showAdvanced && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] text-gray-600 block uppercase font-bold mb-1">Apalancamiento</span>
                    <span className="text-xs font-bold text-gray-400">{riesgo.leverage || 20}x (Aislado)</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[8px] text-gray-600 block uppercase font-bold mb-1">Riesgo Cuenta</span>
                    <span className="text-xs font-bold text-gray-400">{riesgo.risk_pct_real || '---'}%</span>
                  </div>
               </div>
               <p className="text-[10px] text-gray-500 leading-relaxed italic">
                 Justificación: {tradingPlan.por_que || 'Basado en estructura institucional y vacíos de liquidez.'}
               </p>
            </div>
          )}
        </div>

        {/* Footer CTAs */}
        <div className="p-6 pt-0">
          <button
            onClick={openActiveTrade}
            disabled={tradingPlan.sesgo_principal === 'NO TRADE'}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl ${
              tradingPlan.sesgo_principal === 'NO TRADE'
                ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                : isLong
                ? 'bg-long text-[#0B0E11] hover:brightness-110 shadow-long/20'
                : 'bg-short text-white hover:brightness-110 shadow-short/20'
            }`}
          >
            {tradingPlan.sesgo_principal === 'NO TRADE' ? 'Ejecución Bloqueada' : `Ejecutar ${tradingPlan.sesgo_principal}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanOperativoModal;
