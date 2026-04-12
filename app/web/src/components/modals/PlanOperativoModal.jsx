import React from 'react';
import { X } from 'lucide-react';

const PlanOperativoModal = ({ isOpen, onClose, tradingPlan, onOpenTrade }) => {
  if (!isOpen || !tradingPlan) return null;

  return (
    <div style={{ backgroundColor: 'transparent', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div style={{ backgroundColor: '#1a1a1f', border: '2px solid rgba(0,242,255,0.3)', padding: '1.25rem', width: '100%', maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto', borderRadius: '0.75rem' }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
              <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>
              <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>
              <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>
            </svg>
            <h3 className="text-base font-bold text-white uppercase">Plan Operativo (12-24h)</h3>
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
              tradingPlan.sesgo_principal === 'LONG' ? 'bg-green-500/20 text-green-400' :
              tradingPlan.sesgo_principal === 'SHORT' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {tradingPlan.sesgo_principal}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Por qué:</p>
          <p className="text-xs text-gray-300">{tradingPlan.por_que}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <p className="text-[10px] text-gray-500 uppercase">Soporte</p>
            <p className="text-sm font-mono text-green-400">${tradingPlan.soporte?.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-[10px] text-gray-500 uppercase">Resistencia</p>
            <p className="text-sm font-mono text-red-400">${tradingPlan.resistencia?.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <p className="text-[10px] text-gray-500 uppercase">Invalidación</p>
            <p className="text-sm font-mono text-cyan-400">${tradingPlan.invalidation?.toLocaleString()}</p>
          </div>
        </div>

        {tradingPlan.escenarios_alternativos && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">Escenarios Alternativos</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <p className="text-xs font-bold text-green-400 uppercase mb-2">LONG</p>
                <div className="text-[10px] space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Entry:</span><span className="text-white">${tradingPlan.escenarios_alternativos.long?.entry?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">SL:</span><span className="text-red-400">${tradingPlan.escenarios_alternativos.long?.sl?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">TP1:</span><span className="text-green-400">${tradingPlan.escenarios_alternativos.long?.tp1?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">R:R:</span><span className="text-cyan-400">{tradingPlan.escenarios_alternativos.long?.rr}</span></div>
                </div>
                {tradingPlan.escenarios_alternativos.long?.activo && (
                  <button onClick={() => { onClose(); onOpenTrade({...tradingPlan.escenarios_alternativos.long, sesgo_principal: 'LONG', por_que: 'Escenario LONG'}); }} className="w-full mt-2 py-1.5 bg-green-500 text-black text-[10px] font-bold rounded">Abrir LONG</button>
                )}
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-xs font-bold text-red-400 uppercase mb-2">SHORT</p>
                <div className="text-[10px] space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Entry:</span><span className="text-white">${tradingPlan.escenarios_alternativos.short?.entry?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">SL:</span><span className="text-green-400">${tradingPlan.escenarios_alternativos.short?.sl?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">TP1:</span><span className="text-red-400">${tradingPlan.escenarios_alternativos.short?.tp1?.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">R:R:</span><span className="text-cyan-400">{tradingPlan.escenarios_alternativos.short?.rr}</span></div>
                </div>
                {tradingPlan.escenarios_alternativos.short?.activo && (
                  <button onClick={() => { onClose(); onOpenTrade({...tradingPlan.escenarios_alternativos.short, sesgo_principal: 'SHORT', por_que: 'Escenario SHORT'}); }} className="w-full mt-2 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded">Abrir SHORT</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanOperativoModal;