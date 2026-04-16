import React, { useState } from 'react';
import { X, Shield, Target, Info, ChevronDown, ChevronUp } from 'lucide-react';

const ValueCard = ({ label, value, className = '' }) => (
  <div className={`p-3 rounded-lg bg-surface-elevated ${className}`}>
    <p className="text-[10px] text-gray-500 uppercase mb-1">{label}</p>
    <p className="font-price text-sm text-textPrimary">{value ?? 'N/A'}</p>
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
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'transparent' }}>
      <div className="glass-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#2B3139' }}>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg text-white uppercase tracking-wide">
              Plan Operativo <span className="text-accent">{symbol}</span>
            </h3>
            <span className={`px-3 py-1 rounded-md text-xs font-semibold uppercase ${
              isLong ? 'state-long' : isShort ? 'state-short' : 'state-neutral'
            }`}>
              {tradingPlan.sesgo_principal}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-elevated transition-colors">
            <X size={20} className="text-neutral" />
          </button>
        </div>

        {/* Resumen Ejecutivo */}
        <div className="p-4">
          <p className="text-sm text-textPrimary mb-4 leading-relaxed">{tradingPlan.por_que}</p>
          
          {/* Niveles Clave */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <ValueCard 
              label="Entrada" 
              value={entrada.entry_ideal ? `$${entrada.entry_ideal.toLocaleString()}` : 'N/A'} 
              className="bg-long-bg" 
            />
            <ValueCard 
              label="Stop Loss" 
              value={tradingPlan.stop_loss?.nivel ? `$${tradingPlan.stop_loss.nivel.toLocaleString()}` : 'N/A'} 
              className="bg-short-bg" 
            />
            <ValueCard 
              label="R:R Esperado" 
              value={tradingPlan.riesgo_beneficio?.esperado || 'N/A'} 
            />
          </div>

          {/* Take Profits */}
          {(tradingPlan.take_profits || []).length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Objetivos</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {(tradingPlan.take_profits || []).map((tp) => (
                  <div key={tp.tp} className="p-2 rounded bg-surface-elevated">
                    <p className="text-[10px] text-gray-500">{tp.tp} • RR {tp.rr}</p>
                    <p className="text-sm font-price">${tp.nivel?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Riesgo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div className="p-2 rounded bg-surface-elevated">
              <p className="text-[10px] text-gray-500">Tamaño</p>
              <p className="text-sm font-price">{sizing.tamano_posicion ?? 'N/A'}</p>
            </div>
            <div className="p-2 rounded bg-surface-elevated">
              <p className="text-[10px] text-gray-500">Riesgo</p>
              <p className="text-sm font-price">{riesgo.risk_pct_real ?? 'N/A'}%</p>
            </div>
            <div className="p-2 rounded bg-surface-elevated">
              <p className="text-[10px] text-gray-500">Pérdida SL</p>
              <p className="text-sm font-price text-short">{riesgo.perdida_monetaria_si_sl ?? 'N/A'} USDT</p>
            </div>
            <div className="p-2 rounded bg-surface-elevated">
              <p className="text-[10px] text-gray-500">Leverage</p>
              <p className="text-sm font-price">{riesgo.leverage ?? 20}x</p>
            </div>
          </div>

          {/* Niveles Importantes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <ValueCard 
              label="Soporte" 
              value={`$${niveles.soporte?.toLocaleString()}`} 
              className="bg-long-bg" 
            />
            <ValueCard 
              label="Resistencia" 
              value={`$${niveles.resistencia?.toLocaleString()}`} 
              className="bg-short-bg" 
            />
            <ValueCard 
              label="Invalidación" 
              value={`$${niveles.invalidation?.toLocaleString()}`} 
            />
            <ValueCard 
              label="Precio Actual" 
              value={tradingPlan.contexto_temporal?.precio_actual ? `$${tradingPlan.contexto_temporal.precio_actual.toLocaleString()}` : 'N/A'} 
            />
          </div>

          {/* Botón de detalles avanzados */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm text-gray-400"
          >
            <Info size={16} />
            {showAdvanced ? 'Ocultar' : 'Ver'} detalles avanzados
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Detalles avanzados (colapsado) */}
          {showAdvanced && (
            <div className="mt-4 p-4 rounded-lg bg-surface-elevated space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Análisis Técnico</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-2 rounded bg-black/20">
                    <p className="text-[10px] text-gray-500">Tendencia</p>
                    <p className="text-xs">{tradingPlan.estructura_mercado?.tendencia || 'N/A'}</p>
                  </div>
                  <div className="p-2 rounded bg-black/20">
                    <p className="text-[10px] text-gray-500">BOS</p>
                    <p className="text-xs">{tradingPlan.estructura_mercado?.bos ? 'Confirmado' : 'No'}</p>
                  </div>
                  <div className="p-2 rounded bg-black/20">
                    <p className="text-[10px] text-gray-500">MSS</p>
                    <p className="text-xs">{tradingPlan.estructura_mercado?.mss ? 'Detectado' : 'No'}</p>
                  </div>
                  <div className="p-2 rounded bg-black/20">
                    <p className="text-[10px] text-gray-500">ATR</p>
                    <p className="text-xs">{tradingPlan.estructura_mercado?.atr ?? 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Liquidez</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-black/20">
                    <p className="text-[10px] text-gray-500">Buy Side</p>
                    <p className="text-xs">
                      {(tradingPlan.liquidez_contexto?.buy_side_liquidity || []).join(' / ') || 'N/A'}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-black/20">
                    <p className="text-[10px] text-gray-500">Sell Side</p>
                    <p className="text-xs">
                      {(tradingPlan.liquidez_contexto?.sell_side_liquidity || []).join(' / ') || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Mercado de Derivados</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-2 rounded bg-black/20">
                    <p className="text-[10px] text-gray-500">Funding</p>
                    <p className="text-xs">
                      {tradingPlan.derivados?.funding_rate !== undefined 
                        ? `${(tradingPlan.derivados.funding_rate * 100).toFixed(4)}%` 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-black/20">
                    <p className="text-[10px] text-gray-500">Open Interest</p>
                    <p className="text-xs">{tradingPlan.derivados?.open_interest ?? 'N/A'}</p>
                  </div>
                  <div className="p-2 rounded bg-black/20">
                    <p className="text-[10px] text-gray-500">Bull Trap</p>
                    <p className="text-xs">{tradingPlan.trampas?.bull_trap ? 'Detectado' : 'No'}</p>
                  </div>
                  <div className="p-2 rounded bg-black/20">
                    <p className="text-[10px] text-gray-500">Bear Trap</p>
                    <p className="text-xs">{tradingPlan.trampas?.bear_trap ? 'Detectado' : 'No'}</p>
                  </div>
                </div>
              </div>

              {/* Condiciones y advertencias */}
              {tradingPlan.condiciones_minimas && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Condiciones Mínimas</h4>
                  <p className="text-xs text-gray-400">{tradingPlan.condiciones_minimas}</p>
                </div>
              )}

              {(tradingPlan.derivados?.warnings || []).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Advertencias</h4>
                  <div className="space-y-1">
                    {tradingPlan.derivados.warnings.map((warning, idx) => (
                      <p key={idx} className="text-xs text-amber-400">⚠ {warning}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botón de ejecución */}
        <div className="p-4 border-t" style={{ borderColor: '#2B3139' }}>
          <div className="flex gap-2">
            <button
              onClick={openActiveTrade}
              disabled={tradingPlan.sesgo_principal === 'NO TRADE'}
              className={`flex-1 py-3 rounded-md font-semibold transition-all ${
                tradingPlan.sesgo_principal === 'NO TRADE'
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                  : isLong
                  ? 'bg-long text-background hover:brightness-110'
                  : 'bg-short text-white hover:brightness-110'
              }`}
            >
              {tradingPlan.sesgo_principal === 'NO TRADE' ? 'Sin ejecución habilitada' : `Abrir ${tradingPlan.sesgo_principal}`}
            </button>
            
            {onOpenAdvanced && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdvanced(tradingPlan);
                }}
                className="px-4 py-3 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white"
                title="Ver detalles avanzados"
              >
                <Info size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanOperativoModal;
