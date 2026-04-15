import React from 'react';
import { X, Clock, Shield, Target, AlertTriangle, BarChart3 } from 'lucide-react';

const Section = ({ title, children, icon: Icon }) => (
  <div className="p-4 border-b" style={{ borderColor: '#2B3139' }}>
    <div className="flex items-center gap-2 mb-3">
      {Icon ? <Icon size={14} className="text-accent" /> : null}
      <p className="font-label text-neutral">{title}</p>
    </div>
    {children}
  </div>
);

const ValueCard = ({ label, value, className = '' }) => (
  <div className={`p-3 rounded-lg bg-surface-elevated ${className}`}>
    <p className="text-[10px] text-gray-500 uppercase mb-1">{label}</p>
    <p className="font-price text-sm text-textPrimary">{value ?? 'N/A'}</p>
  </div>
);

const PlanOperativoModal = ({ isOpen, onClose, tradingPlan, symbol, onOpenTrade }) => {
  if (!isOpen || !tradingPlan) return null;

  const isLong = tradingPlan.sesgo_principal === 'LONG';
  const isShort = tradingPlan.sesgo_principal === 'SHORT';
  const niveles = tradingPlan.niveles_clave || {};
  const entrada = tradingPlan.configuracion_entrada || {};
  const riesgo = tradingPlan.gestion_riesgo || {};
  const sizing = tradingPlan.calculo_posicion || {};
  const derivados = tradingPlan.derivados || {};
  const trampas = tradingPlan.trampas || {};
  const trampasMercado = tradingPlan.trampas_mercado || {};
  const contexto = tradingPlan.contexto_temporal || {};
  const estructura = tradingPlan.estructura_mercado || {};
  const liquidez = tradingPlan.liquidez_contexto || {};
  const contextoExterno = tradingPlan.contexto_externo || {};

  const openActiveTrade = () => {
    if (tradingPlan.sesgo_principal !== 'NO TRADE' && onOpenTrade) onOpenTrade(tradingPlan);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'transparent' }}>
      <div className="glass-elevated w-full max-w-4xl max-h-[92vh] overflow-y-auto">
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

        <Section title="Contexto" icon={Clock}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <ValueCard label="Fecha/Hora" value={contexto.fecha_hora} />
            <ValueCard label="Pais" value={contexto.pais} />
            <ValueCard label="Horizonte" value={contexto.horizonte} />
            <ValueCard label="Precio actual" value={contexto.precio_actual ? `$${contexto.precio_actual.toLocaleString()}` : 'N/A'} />
            <ValueCard label="Fuentes" value={contexto.fuentes} />
          </div>
        </Section>

        <Section title="Decision" icon={BarChart3}>
          <p className="text-sm text-textPrimary mb-3">{tradingPlan.por_que}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ValueCard label="Soporte" value={`$${niveles.soporte?.toLocaleString()}`} className="bg-long-bg" />
            <ValueCard label="Resistencia" value={`$${niveles.resistencia?.toLocaleString()}`} className="bg-short-bg" />
            <ValueCard label="Invalidacion" value={`$${niveles.invalidation?.toLocaleString()}`} />
            <ValueCard
              label="Sweep probable"
              value={
                niveles.sweep_probable
                  ? `BSL ${niveles.sweep_probable.buy_side ?? 'N/A'} / SSL ${niveles.sweep_probable.sell_side ?? 'N/A'}`
                  : 'N/A'
              }
            />
          </div>
        </Section>

        <Section title="Estructura y Liquidez" icon={BarChart3}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ValueCard label="Tendencia" value={estructura.tendencia || 'N/A'} />
            <ValueCard label="BOS" value={estructura.bos ? 'Confirmado' : 'No'} />
            <ValueCard label="MSS" value={estructura.mss ? 'Detectado' : 'No'} />
            <ValueCard label="ATR" value={estructura.atr ?? 'N/A'} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <ValueCard
              label="Buy Side Liquidity"
              value={(liquidez.buy_side_liquidity || []).length ? liquidez.buy_side_liquidity.join(' / ') : 'N/A'}
            />
            <ValueCard
              label="Sell Side Liquidity"
              value={(liquidez.sell_side_liquidity || []).length ? liquidez.sell_side_liquidity.join(' / ') : 'N/A'}
            />
          </div>
        </Section>

        <Section title="Entrada y Stop" icon={Shield}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ValueCard label="Entrada ideal" value={entrada.entry_ideal ? `$${entrada.entry_ideal.toLocaleString()}` : 'N/A'} className="bg-long-bg" />
            <ValueCard label="Entrada alternativa" value={entrada.entry_alternativa ? `$${entrada.entry_alternativa.toLocaleString()}` : 'N/A'} />
            <ValueCard label="Stop Loss" value={tradingPlan.stop_loss?.nivel ? `$${tradingPlan.stop_loss.nivel.toLocaleString()}` : 'N/A'} className="bg-short-bg" />
          </div>
          <p className="text-xs text-gray-500 mt-3">{entrada.logica_entry}</p>
          <p className="text-xs text-gray-500 mt-1">{tradingPlan.stop_loss?.logica}</p>
        </Section>

        <Section title="Objetivos" icon={Target}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(tradingPlan.take_profits || []).map((tp) => (
              <ValueCard
                key={tp.tp}
                label={`${tp.tp} • RR ${tp.rr}`}
                value={`$${tp.nivel?.toLocaleString()} • ${tp.accion}`}
                className="bg-surface-elevated"
              />
            ))}
          </div>
        </Section>

        <Section title="Riesgo y RR" icon={Shield}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ValueCard label="RR esperado" value={tradingPlan.riesgo_beneficio?.esperado || 'N/A'} />
            <ValueCard label="% riesgo real" value={`${riesgo.risk_pct_real ?? 'N/A'}%`} />
            <ValueCard label="Perdida SL" value={`${riesgo.perdida_monetaria_si_sl ?? 'N/A'} USDT`} className="bg-short-bg" />
            <ValueCard label="Invalidacion" value={`$${niveles.invalidation?.toLocaleString()}`} />
          </div>
        </Section>

        <Section title="Calculo de Posicion" icon={Shield}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <ValueCard label="Capital" value={`${sizing.capital ?? 'N/A'} USDT`} />
            <ValueCard label="Margen usado" value={`${sizing.margen_utilizado ?? 'N/A'} USDT`} />
            <ValueCard label="Exposicion" value={`${sizing.exposicion_total ?? 'N/A'} USDT`} />
            <ValueCard label="Tamano" value={sizing.tamano_posicion ?? 'N/A'} />
            <ValueCard label="Perdida max" value={`${sizing.escenario_perdida_maxima ?? 'N/A'} USDT`} className="bg-short-bg" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <ValueCard label="Leverage" value={`${riesgo.leverage ?? 20}x`} />
            <ValueCard label="Riesgo max" value={`${riesgo.risk_max_pct ?? 30}%`} />
            <ValueCard label="Operacion" value={`${riesgo.operation_size_pct ?? 70}%`} />
            <ValueCard label="Riesgo real" value={`${riesgo.risk_pct_real ?? 'N/A'}%`} />
          </div>
        </Section>

        <Section title="Derivados y Trampas" icon={AlertTriangle}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ValueCard label="Funding" value={derivados.funding_rate !== undefined ? `${(derivados.funding_rate * 100).toFixed(4)}%` : 'N/A'} />
            <ValueCard label="Open Interest" value={derivados.open_interest ?? 'N/A'} />
            <ValueCard label="Bull trap" value={trampas.bull_trap ? 'Detectado' : 'No'} className={trampas.bull_trap ? 'bg-short-bg' : ''} />
            <ValueCard label="Bear trap" value={trampas.bear_trap ? 'Detectado' : 'No'} className={trampas.bear_trap ? 'bg-short-bg' : ''} />
          </div>
          <p className="text-xs text-gray-500 mt-3">{tradingPlan.condiciones_minimas}</p>
          {(derivados.warnings || []).length > 0 && (
            <div className="mt-3 space-y-1">
              {derivados.warnings.map((warning, idx) => (
                <p key={`${warning}-${idx}`} className="text-xs text-amber-400">
                  {warning}
                </p>
              ))}
            </div>
          )}
        </Section>

        <Section title="Contingencias de Trampa" icon={AlertTriangle}>
          {[trampasMercado.bulltrap, trampasMercado.beartrap].filter(Boolean).map((trap) => (
            <div key={trap.tipo} className="mb-3 last:mb-0 rounded-lg bg-surface-elevated p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-sm font-semibold text-white uppercase">{trap.tipo}</p>
                <span className={`text-[10px] px-2 py-1 rounded ${trap.activa ? 'bg-short/20 text-short' : 'bg-white/10 text-gray-400'}`}>
                  {trap.activa ? 'Activa' : 'Monitorear'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{trap.senal_confirmacion}</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                <ValueCard label="Contra" value={trap.contra_operacion?.direccion} />
                <ValueCard label="Entry" value={trap.contra_operacion?.entry ? `$${trap.contra_operacion.entry}` : 'N/A'} />
                <ValueCard label="SL" value={trap.contra_operacion?.stop_loss ? `$${trap.contra_operacion.stop_loss}` : 'N/A'} />
                <ValueCard label="TP1" value={trap.contra_operacion?.tp1 ? `$${trap.contra_operacion.tp1}` : 'N/A'} />
                <ValueCard label="TP2" value={trap.contra_operacion?.tp2 ? `$${trap.contra_operacion.tp2}` : 'N/A'} />
              </div>
              <p className="text-xs text-gray-500">{trap.invalidacion_tesis_inicial}</p>
            </div>
          ))}
        </Section>

        <Section title="Contexto Externo" icon={Clock}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ValueCard
              label="Spot"
              value={contextoExterno.spot_context?.price ? `$${Number(contextoExterno.spot_context.price).toLocaleString()}` : 'N/A'}
            />
            <ValueCard
              label="Disponibilidad"
              value={contextoExterno.availability || 'partial'}
            />
          </div>
          {(contextoExterno.news || []).length > 0 && (
            <div className="mt-3 space-y-2">
              {contextoExterno.news.map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-lg bg-surface-elevated p-3">
                  <p className="text-xs text-white">{item.title}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{item.source || 'Fuente externa'}</p>
                </div>
              ))}
            </div>
          )}
          {(contextoExterno.notas || []).length > 0 && (
            <div className="mt-3 space-y-1">
              {contextoExterno.notas.map((note, index) => (
                <p key={`${note}-${index}`} className="text-xs text-gray-500">{note}</p>
              ))}
            </div>
          )}
        </Section>

        <div className="p-4">
          <button
            onClick={openActiveTrade}
            disabled={tradingPlan.sesgo_principal === 'NO TRADE'}
            className={`w-full py-3 rounded-md font-semibold transition-all ${
              tradingPlan.sesgo_principal === 'NO TRADE'
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : isLong
                ? 'bg-long text-background hover:brightness-110'
                : 'bg-short text-white hover:brightness-110'
            }`}
          >
            {tradingPlan.sesgo_principal === 'NO TRADE' ? 'Sin ejecucion habilitada' : `Abrir ${tradingPlan.sesgo_principal}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanOperativoModal;
