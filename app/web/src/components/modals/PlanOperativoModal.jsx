import React from 'react';
import { X } from 'lucide-react';

const PlanOperativoModal = ({ isOpen, onClose, tradingPlan, symbol, onOpenTrade }) => {
  if (!isOpen || !tradingPlan) return null;

  const isLong = tradingPlan.sesgo_principal === 'LONG';
  const isShort = tradingPlan.sesgo_principal === 'SHORT';
  const isNeutral = tradingPlan.sesgo_principal === 'NO TRADE';

  const getStateClass = () => {
    if (isLong) return 'state-long';
    if (isShort) return 'state-short';
    return 'state-neutral';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'transparent' }}>
      <div className="glass-elevated w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#2B3139' }}>
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C076" strokeWidth="2">
              <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>
              <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>
              <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>
            </svg>
            <h3 className="font-semibold text-lg text-white uppercase tracking-wide">Plan Operativo <span className="text-accent">{symbol}</span></h3>
            <span className={`px-3 py-1 rounded-md text-xs font-semibold uppercase ${getStateClass()}`}>
              {tradingPlan.sesgo_principal}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-elevated transition-colors">
            <X size={20} className="text-neutral" />
          </button>
        </div>

        {/* Por qué */}
        <div className="p-5 border-b" style={{ borderColor: '#2B3139' }}>
          <p className="font-label text-neutral mb-2">Por qué:</p>
          <p className="text-sm text-textPrimary">{tradingPlan.por_que}</p>
        </div>

        {/* Niveles clave */}
        <div className="p-5 grid grid-cols-3 gap-4 border-b" style={{ borderColor: '#2B3139' }}>
          <div className="p-3 rounded-lg bg-long-bg">
            <p className="font-label text-neutral mb-1">Soporte</p>
            <p className="font-price text-long">${tradingPlan.soporte?.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-short-bg">
            <p className="font-label text-neutral mb-1">Resistencia</p>
            <p className="font-price text-short">${tradingPlan.resistencia?.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-elevated">
            <p className="font-label text-neutral mb-1">Invalidación</p>
            <p className="font-price text-neutral">${tradingPlan.invalidation?.toLocaleString()}</p>
          </div>
        </div>

        {/* Escenarios alternativos */}
        {tradingPlan.escenarios_alternativos && (
          <div className="p-5">
            <p className="font-label text-neutral mb-4">Escenarios Alternativos</p>
            <div className="grid grid-cols-2 gap-4">
              {/* LONG */}
              <div className="p-4 rounded-lg bg-long-bg border border-transparent hover:border-long transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-long uppercase">LONG</span>
                  {tradingPlan.escenarios_alternativos.long?.activo && (
                    <span className="px-2 py-0.5 rounded text-xs bg-long text-background font-medium">Activo</span>
                  )}
                </div>
                <div className="space-y-2 font-data text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral">Entry:</span>
                    <span className="text-textPrimary">${tradingPlan.escenarios_alternativos.long?.entry?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral">SL:</span>
                    <span className="text-short">${tradingPlan.escenarios_alternativos.long?.sl?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral">TP1:</span>
                    <span className="text-long">${tradingPlan.escenarios_alternativos.long?.tp1?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral">R:R:</span>
                    <span className="text-accent font-semibold">{tradingPlan.escenarios_alternativos.long?.rr}</span>
                  </div>
                </div>
                {tradingPlan.escenarios_alternativos.long?.activo && (
                  <button 
                    onClick={() => { onOpenTrade({...tradingPlan.escenarios_alternativos.long, sesgo_principal: 'LONG', por_que: 'Escenario LONG'}); }} 
                    className="w-full mt-4 py-3 bg-long text-background font-semibold rounded-md hover:brightness-110 transition-all"
                  >
                    Abrir LONG
                  </button>
                )}
              </div>

              {/* SHORT */}
              <div className="p-4 rounded-lg bg-short-bg border border-transparent hover:border-short transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-short uppercase">SHORT</span>
                  {tradingPlan.escenarios_alternativos.short?.activo && (
                    <span className="px-2 py-0.5 rounded text-xs bg-short text-white font-medium">Activo</span>
                  )}
                </div>
                <div className="space-y-2 font-data text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral">Entry:</span>
                    <span className="text-textPrimary">${tradingPlan.escenarios_alternativos.short?.entry?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral">SL:</span>
                    <span className="text-long">${tradingPlan.escenarios_alternativos.short?.sl?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral">TP1:</span>
                    <span className="text-short">${tradingPlan.escenarios_alternativos.short?.tp1?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral">R:R:</span>
                    <span className="text-accent font-semibold">{tradingPlan.escenarios_alternativos.short?.rr}</span>
                  </div>
                </div>
                {tradingPlan.escenarios_alternativos.short?.activo && (
                  <button 
                    onClick={() => { onOpenTrade({...tradingPlan.escenarios_alternativos.short, sesgo_principal: 'SHORT', por_que: 'Escenario SHORT'}); }} 
                    className="w-full mt-4 py-3 bg-short text-white font-semibold rounded-md hover:brightness-110 transition-all"
                  >
                    Abrir SHORT
                  </button>
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