import React from 'react';
import { X } from 'lucide-react';

const InfoAvanzadaModal = ({ isOpen, onClose, analysisData, symbol }) => {
  if (!isOpen || !analysisData) return null;

  const { analysis } = analysisData;
  const structure = analysis?.estructura_mercado || {};
  const trapPlans = analysis?.trampas_mercado || {};
  const externalContext = analysis?.external_context || {};

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'transparent' }}>
      <div className="glass-elevated w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#2B3139' }}>
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#848E9C" strokeWidth="2">
              <path d="M3 3v16a2 2 0 0 0 2 2h16"/>
              <path d="M18 17V9"/>
              <path d="M13 17V5"/>
              <path d="M8 17v-3"/>
            </svg>
            <h3 className="font-semibold text-lg text-white uppercase tracking-wide">Información Avanzada <span className="text-accent">{symbol}</span></h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-elevated transition-colors">
            <X size={20} className="text-neutral" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Stop Loss (ATR) */}
          {analysis?.sl_data && (
            <div className="card">
              <p className="font-label text-neutral mb-3">Stop Loss (ATR)</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-neutral mb-1">Precio SL</p>
                  <p className="font-price text-short">${analysis.sl_data.sl_price}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral mb-1">Distancia</p>
                  <p className="font-data text-textPrimary">${analysis.sl_data.sl_distance}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral mb-1">% Distancia</p>
                  <p className="font-data text-textPrimary">{analysis.sl_data.sl_pct}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Fair Value Gaps */}
          {analysis?.fvgs && analysis.fvgs.length > 0 && (
            <div className="card">
              <p className="font-label text-neutral mb-3">Fair Value Gaps</p>
              <div className="space-y-2">
                {analysis.fvgs.map((fvg, i) => (
                  <div key={i} className={`p-3 rounded-lg flex justify-between items-center ${fvg.type === 'Alcista' ? 'bg-long-bg' : 'bg-short-bg'}`}>
                    <span className={`text-xs font-semibold uppercase ${fvg.type === 'Alcista' ? 'text-long' : 'text-short'}`}>
                      FVG {fvg.type}
                    </span>
                    <span className="font-data text-sm text-textSecondary">
                      ${fvg.bottom?.toFixed(2)} - ${fvg.top?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Blocks */}
          {analysis?.order_blocks && analysis.order_blocks.length > 0 && (
            <div className="card">
              <p className="font-label text-neutral mb-3">Order Blocks</p>
              <div className="space-y-2">
                {analysis.order_blocks.map((ob, i) => (
                  <div key={i} className="p-3 rounded-lg bg-surface-elevated flex justify-between items-center">
                    <span className="text-sm text-textPrimary font-medium">{ob.type}</span>
                    <span className="font-data text-sm text-accent">{ob.zone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zonas de Liquidez */}
          {analysis?.liquidity && (
            <div className="card">
              <p className="font-label text-neutral mb-3">Zonas de Liquidez</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral mb-2">Resistencias</p>
                  {analysis.liquidity.highs?.map((h, i) => (
                    <span key={i} className="block font-data text-sm text-short">${h.toFixed(2)}</span>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-neutral mb-2">Soportes</p>
                  {analysis.liquidity.lows?.map((l, i) => (
                    <span key={i} className="block font-data text-sm text-long">${l.toFixed(2)}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {analysis?.probable_sweeps && (
            <div className="card">
              <p className="font-label text-neutral mb-3">Sweeps Probables</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral mb-1">Buy Side Sweep</p>
                  <p className="font-data text-short">
                    {analysis.probable_sweeps.buy_side ? `$${analysis.probable_sweeps.buy_side}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral mb-1">Sell Side Sweep</p>
                  <p className="font-data text-long">
                    {analysis.probable_sweeps.sell_side ? `$${analysis.probable_sweeps.sell_side}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Volumen */}
          {analysis?.volume && (
            <div className="card">
              <p className="font-label text-neutral mb-2">Análisis de Volumen</p>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-md text-sm font-semibold ${
                  analysis.volume.signal === 'Alto' ? 'text-long bg-long-bg' : 
                  analysis.volume.signal === 'Bajo' ? 'text-short bg-short-bg' : 
                  'text-neutral bg-neutral-bg'
                }`}>
                  {analysis.volume.signal}
                </span>
                <span className="font-data text-sm text-textSecondary">Ratio: {analysis.volume.ratio}</span>
                <span className="font-data text-sm text-textSecondary">Prom: {analysis.volume.avg_volume}</span>
              </div>
            </div>
          )}

          {/* Derivados */}
          {analysisData.derivatives?.funding && (
            <div className="card">
              <p className="font-label text-neutral mb-3">Datos de Derivados (OKX / Exchange activo)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-neutral mb-1">Funding Rate</p>
                  <p className={`font-data text-sm ${analysisData.derivatives.funding.current > 0 ? 'text-short' : 'text-long'}`}>
                    {analysisData.derivatives.funding.current > 0 ? '+' : ''}{(analysisData.derivatives.funding.current * 100).toFixed(4)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral mb-1">Next Funding</p>
                  <p className="font-data text-sm text-textSecondary">{(analysisData.derivatives.funding.next * 100).toFixed(4)}%</p>
                </div>
                <div>
                  <p className="text-xs text-neutral mb-1">Mark Price</p>
                  <p className="font-data text-sm text-textPrimary">${analysisData.derivatives.funding.mark_price?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral mb-1">Open Interest</p>
                  <p className="font-data text-sm text-textPrimary">
                    {analysisData.derivatives.open_interest?.value || analysisData.derivatives.open_interest?.amount || 'N/A'}
                  </p>
                </div>
              </div>
              {(analysis?.derivatives_summary?.warnings || []).length > 0 && (
                <div className="mt-3 space-y-1">
                  {analysis.derivatives_summary.warnings.map((warning, index) => (
                    <p key={`${warning}-${index}`} className="text-[10px] text-amber-400">
                      {warning}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {!analysisData.derivatives?.funding && (analysis?.derivatives_summary?.warnings || []).length > 0 && (
            <div className="card">
              <p className="font-label text-neutral mb-3">Derivados (disponibilidad)</p>
              <div className="space-y-1">
                {analysis.derivatives_summary.warnings.map((warning, index) => (
                  <p key={`${warning}-${index}`} className="text-[10px] text-amber-400">
                    {warning}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <p className="font-label text-neutral mb-3">Estructura y Trampas</p>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-neutral mb-1">Tendencia</p>
                <p className="font-data text-sm text-textPrimary">{structure.tendencia || analysis?.trend_detail || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-neutral mb-1">BOS</p>
                <p className="font-data text-sm text-textPrimary">{analysis?.bos ? 'Confirmado' : 'No'}</p>
              </div>
            </div>
            {[trapPlans.bulltrap, trapPlans.beartrap].filter(Boolean).map((trap) => (
              <div key={trap.tipo} className="mb-2 last:mb-0 rounded-lg bg-surface-elevated p-3">
                <p className="text-xs text-white uppercase mb-1">{trap.tipo}</p>
                <p className="text-[11px] text-gray-400">{trap.senal_confirmacion}</p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Contra-operacion: {trap.contra_operacion?.direccion} | Entry {trap.contra_operacion?.entry ?? 'N/A'} | SL {trap.contra_operacion?.stop_loss ?? 'N/A'}
                </p>
              </div>
            ))}
          </div>

          <div className="card">
            <p className="font-label text-neutral mb-3">Contexto Externo</p>
            {(externalContext.news || []).length > 0 ? (
              <div className="space-y-2">
                {externalContext.news.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-lg bg-surface-elevated p-3">
                    <p className="text-xs text-textPrimary">{item.title}</p>
                    <p className="text-[10px] text-neutral mt-1">{item.source || 'Fuente externa'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No hay news flow integrado disponible para este activo en este momento.</p>
            )}
            {(externalContext.notas || []).length > 0 && (
              <div className="mt-3 space-y-1">
                {externalContext.notas.map((note, index) => (
                  <p key={`${note}-${index}`} className="text-[10px] text-gray-500">{note}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoAvanzadaModal;
