import React from 'react';
import { X } from 'lucide-react';

const ConfirmOrderModal = ({ 
  isOpen, 
  onClose, 
  selectedSymbol,
  orderType,
  setOrderType,
  marginMode,
  setMarginMode,
  leverage,
  setLeverage,
  entryPrice,
  setEntryPrice,
  slPrice,
  setSlPrice,
  tpPrice,
  setTpPrice,
  riskAmount,
  setRiskAmount,
  currentTradeSide,
  executing,
  onConfirm
}) => {
  if (!isOpen) return null;

  const isLong = currentTradeSide === 'buy';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-3" style={{ backgroundColor: 'transparent' }}>
      <div className="glass-elevated w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b" style={{ borderColor: '#2B3139' }}>
          <div className="flex items-center gap-2 md:gap-3">
            <h3 className="font-semibold text-base md:text-lg text-white">Abrir Posición</h3>
            <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs font-semibold uppercase ${isLong ? 'state-long' : 'state-short'}`}>
              {isLong ? 'LONG' : 'SHORT'}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-elevated transition-colors">
            <X size={18} className="text-neutral" />
          </button>
        </div>

        {/* Parámetros editables */}
        <div className="p-4 md:p-5 space-y-3 md:space-y-4 border-b" style={{ borderColor: '#2B3139' }}>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="font-label text-neutral block mb-2 text-sm">Tipo Orden</label>
              <select 
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full bg-surface border border-border rounded-md px-3 py-2 md:py-2.5 text-textPrimary text-sm focus:border-long focus:outline-none"
              >
                <option value="limit">Limit</option>
                <option value="market">Market</option>
              </select>
            </div>
            <div>
              <label className="font-label text-neutral block mb-2 text-sm">Apalancamiento</label>
              <select 
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-md px-3 py-2 md:py-2.5 text-textPrimary text-sm focus:border-long focus:outline-none"
              >
                <option value="10">10x</option>
                <option value="20">20x</option>
                <option value="50">50x</option>
                <option value="100">100x</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-label text-neutral block mb-2 text-sm">Cantidad a Arriesgar (USDT)</label>
            <input 
              type="number"
              value={riskAmount}
              onChange={(e) => setRiskAmount(Number(e.target.value))}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 md:py-2.5 font-data text-textPrimary text-sm focus:border-long focus:outline-none"
            />
            <p className="text-xs text-neutral mt-2">
              Margen: <span className="text-textPrimary">{riskAmount} USDT</span> | Tamaño: <span className="text-textPrimary">{riskAmount * leverage} USDT</span>
            </p>
          </div>

          <div>
            <label className="font-label text-neutral block mb-2 text-sm">Modo Margen</label>
            <select 
              value={marginMode}
              onChange={(e) => setMarginMode(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 md:py-2.5 text-textPrimary text-sm focus:border-long focus:outline-none"
            >
              <option value="isolated">Aislado</option>
              <option value="cross">Cruzado</option>
            </select>
          </div>
        </div>

        {/* Valores del análisis */}
        <div className="p-4 md:p-5 space-y-2 md:space-y-3 border-b" style={{ borderColor: '#2B3139' }}>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-neutral">Par</span>
            <span className="font-data text-textPrimary text-sm">{selectedSymbol}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-neutral">Entrada</span>
            <input 
              type="number"
              value={entryPrice || ''}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              className="bg-surface border border-border rounded px-2 md:px-3 py-1.5 font-data text-textPrimary text-sm w-24 md:w-32 text-right focus:border-long focus:outline-none"
            />
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-neutral">Stop Loss</span>
            <input 
              type="number"
              value={slPrice || ''}
              onChange={(e) => setSlPrice(Number(e.target.value))}
              className="bg-surface border border-border rounded px-2 md:px-3 py-1.5 font-data text-short text-sm w-24 md:w-32 text-right focus:border-short focus:outline-none"
            />
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-neutral">Take Profit</span>
            <input 
              type="number"
              value={tpPrice || ''}
              onChange={(e) => setTpPrice(Number(e.target.value))}
              className="bg-surface border border-border rounded px-2 md:px-3 py-1.5 font-data text-long text-sm w-24 md:w-32 text-right focus:border-long focus:outline-none"
            />
          </div>
        </div>

        {/* Resumen de riesgo */}
        <div className="p-4 md:p-5 bg-surface-elevated rounded-b-lg">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral">Pérdida máx. si SL:</span>
            <span className="font-data text-short">
              {entryPrice && slPrice ? 
                Math.abs(((entryPrice - slPrice) / entryPrice) * riskAmount * leverage).toFixed(2) 
                : '---'} USDT
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral">Ganancia máx. si TP:</span>
            <span className="font-data text-long">
              {entryPrice && tpPrice ? 
                Math.abs(((tpPrice - entryPrice) / entryPrice) * riskAmount * leverage).toFixed(2) 
                : '---'} USDT
            </span>
          </div>
        </div>

        {/* Botones */}
        <div className="p-4 md:p-5 flex gap-2 md:gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 md:py-3 px-3 md:px-4 rounded-md font-semibold text-sm border border-border text-textSecondary hover:bg-surface-elevated transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            disabled={executing}
            className={`flex-1 py-2.5 md:py-3 px-3 md:px-4 rounded-md font-semibold text-sm transition-all ${executing ? 'opacity-50 cursor-not-allowed' : ''} ${isLong ? 'bg-long text-background hover:brightness-110' : 'bg-short text-white hover:brightness-110'}`}
          >
            {executing ? 'Ejecutando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmOrderModal;