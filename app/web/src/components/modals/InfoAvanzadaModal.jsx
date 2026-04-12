import React from 'react';
import { X } from 'lucide-react';

const InfoAvanzadaModal = ({ isOpen, onClose, analysisData }) => {
  if (!isOpen || !analysisData) return null;

  const { analysis } = analysisData;

  return (
    <div style={{ backgroundColor: 'transparent', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div style={{ backgroundColor: '#1a1a1f', border: '1px solid #374151', padding: '1.25rem', width: '100%', maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto', borderRadius: '0.75rem' }}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M3 3v16a2 2 0 0 0 2 2h16"/>
              <path d="M18 17V9"/>
              <path d="M13 17V5"/>
              <path d="M8 17v-3"/>
            </svg>
            <h3 className="text-base font-bold text-white uppercase">Información Avanzada</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {analysis?.sl_data && (
          <div className="mb-4 p-3 rounded-lg" style={{ border: '1px solid rgba(6,182,212,0.2)' }}>
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Stop Loss (ATR)</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div><span className="text-gray-500">Precio:</span> <span className="text-red-400">${analysis.sl_data.sl_price}</span></div>
              <div><span className="text-gray-500">Dist:</span> <span className="text-white">${analysis.sl_data.sl_distance}</span></div>
              <div><span className="text-gray-500">%:</span> <span className="text-white">{analysis.sl_data.sl_pct}%</span></div>
            </div>
          </div>
        )}

        {analysis?.fvgs && analysis.fvgs.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Fair Value Gaps</p>
            {analysis.fvgs.map((fvg, i) => (
              <div key={i} className={`p-2 mb-1 rounded border ${fvg.type === 'Alcista' ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                <span className={`text-[10px] font-bold ${fvg.type === 'Alcista' ? 'text-green-400' : 'text-red-400'}`}>FVG {fvg.type}</span>
                <span className="text-[10px] text-gray-400 ml-2">${fvg.bottom?.toFixed(2)} - ${fvg.top?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {analysis?.order_blocks && analysis.order_blocks.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Order Blocks</p>
            {analysis.order_blocks.map((ob, i) => (
              <div key={i} className="p-2 mb-1 rounded border border-gray-700 bg-white/5">
                <span className="text-[10px] text-white">{ob.type}</span>
                <span className="text-[10px] text-cyan-400 ml-2">{ob.zone}</span>
              </div>
            ))}
          </div>
        )}

        {analysis?.liquidity && (
          <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #374151' }}>
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Zonas de Liquidez</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Resistencias:</span>
                {analysis.liquidity.highs?.map((h, i) => (
                  <span key={i} className="block text-red-400">${h.toFixed(2)}</span>
                ))}
              </div>
              <div>
                <span className="text-gray-500">Soportes:</span>
                {analysis.liquidity.lows?.map((l, i) => (
                  <span key={i} className="block text-green-400">${l.toFixed(2)}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {analysis?.volume && (
          <div className="mb-4 p-3 rounded-lg" style={{ border: '1px solid #374151' }}>
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Volumen</p>
            <p className={`text-sm ${analysis.volume.signal === 'Bajo' ? 'text-red-400' : analysis.volume.signal === 'Alto' ? 'text-green-400' : 'text-gray-400'}`}>
              {analysis.volume.signal} | Ratio: {analysis.volume.ratio} | Prom: {analysis.volume.avg_volume}
            </p>
          </div>
        )}

        {analysisData.derivatives?.funding && (
          <div className="p-3 rounded-lg" style={{ border: '1px solid rgba(6,182,212,0.2)' }}>
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Derivados (CoinEx)</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div><span className="text-gray-500">Funding:</span> <span className={analysisData.derivatives.funding.current > 0 ? 'text-red-400' : 'text-green-400'}>{(analysisData.derivatives.funding.current * 100).toFixed(4)}%</span></div>
              <div><span className="text-gray-500">Next:</span> <span className="text-gray-400">{(analysisData.derivatives.funding.next * 100).toFixed(4)}%</span></div>
              <div><span className="text-gray-500">Mark:</span> <span className="text-white">${analysisData.derivatives.funding.mark_price?.toLocaleString()}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoAvanzadaModal;