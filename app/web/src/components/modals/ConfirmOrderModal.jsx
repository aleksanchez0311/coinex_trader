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
    <div style={{ backgroundColor: 'transparent', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ backgroundColor: '#1a1a1f', border: '1px solid #374151', padding: '1rem', width: '400px', maxWidth: '95%', borderRadius: '0.75rem' }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Abrir Posición</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${isLong ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isLong ? 'LONG' : 'SHORT'}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Parámetros editables */}
        <div className="space-y-3 mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Tipo Orden</label>
              <select 
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full p-1.5 rounded text-white text-xs mt-1" style={{ backgroundColor: '#121216', border: '1px solid #374151' }}
              >
                <option value="limit">Limit</option>
                <option value="market">Market</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase">Apalancamiento</label>
              <select 
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full p-1.5 rounded text-white text-xs mt-1" style={{ backgroundColor: '#121216', border: '1px solid #374151' }}
              >
                <option value="10">10x</option>
                <option value="20">20x</option>
                <option value="50">50x</option>
                <option value="100">100x</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase">Cantidad a Arriesgar (USDT)</label>
            <input 
              type="number"
              value={riskAmount}
              onChange={(e) => setRiskAmount(Number(e.target.value))}
              className="w-full p-1.5 rounded text-white font-mono text-sm mt-1" style={{ backgroundColor: '#121216', border: '1px solid #374151' }}
            />
            <p className="text-[9px] text-gray-500 mt-1">Margen: {riskAmount} USDT | Tamaño: {riskAmount * leverage} USDT</p>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase">Modo Margen</label>
            <select 
              value={marginMode}
              onChange={(e) => setMarginMode(e.target.value)}
              className="w-full p-1.5 rounded text-white text-xs mt-1" style={{ backgroundColor: '#121216', border: '1px solid #374151' }}
            >
              <option value="isolated">Aislado</option>
              <option value="cross">Cruzado</option>
            </select>
          </div>
        </div>

        {/* Valores del análisis */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-gray-700">
            <span className="text-gray-400">Par:</span>
            <span className="font-mono text-white">{selectedSymbol}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-700">
            <span className="text-gray-400">Entrada:</span>
            <input 
              type="number"
              value={entryPrice || ''}
              onChange={(e) => setEntryPrice(Number(e.target.value))}
              className="bg-transparent border border-gray-600 rounded px-2 py-0.5 text-white font-mono text-xs w-24 text-right"
            />
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-700">
            <span className="text-gray-400">Stop Loss:</span>
            <input 
              type="number"
              value={slPrice || ''}
              onChange={(e) => setSlPrice(Number(e.target.value))}
              className="bg-transparent border border-gray-600 rounded px-2 py-0.5 text-red-400 font-mono text-xs w-24 text-right"
            />
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-700">
            <span className="text-gray-400">Take Profit:</span>
            <input 
              type="number"
              value={tpPrice || ''}
              onChange={(e) => setTpPrice(Number(e.target.value))}
              className="bg-transparent border border-gray-600 rounded px-2 py-0.5 text-green-400 font-mono text-xs w-24 text-right"
            />
          </div>
        </div>

        {/* Resumen de riesgo */}
        <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-500">Pérdida máx. si SL:</span>
            <span className="font-mono text-red-400">
              {entryPrice && slPrice ? 
                Math.abs(((entryPrice - slPrice) / entryPrice) * riskAmount * leverage).toFixed(2) 
                : '---'} USDT
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Ganancia máx. si TP:</span>
            <span className="font-mono text-green-400">
              {entryPrice && tpPrice ? 
                Math.abs(((tpPrice - entryPrice) / entryPrice) * riskAmount * leverage).toFixed(2) 
                : '---'} USDT
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-xs font-medium border border-gray-600 hover:bg-white/5"
            style={{ color: '#9ca3af' }}
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            disabled={executing}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold ${isLong ? 'bg-green-500 text-black' : 'bg-red-500 text-white'} ${executing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {executing ? 'Ejecutando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmOrderModal;