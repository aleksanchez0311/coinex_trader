import React, { useState } from 'react';
import { Target, Activity, Zap, Info, BarChart3, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, TrendingUp, AlertTriangle, Play, Shield, Layers, ExternalLink, X, FileBarChart } from 'lucide-react';
import { motion } from 'framer-motion';

const AnalysisBoard = ({ symbol, data, loading, analysisStep, onOpenTrade }) => {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);

  if (loading) return (
    <div className="glass p-10 flex flex-col items-center justify-center gap-4 min-h-[500px]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
      ></motion.div>
      <p className="text-accent animate-pulse font-bold tracking-widest uppercase text-xs">Analizando mercado...</p>
      {analysisStep && (
        <p className="text-gray-500 text-[10px] mt-2">{analysisStep}</p>
      )}
    </div>
  );

  if (!data || data.detail) return (
    <div className="glass p-6 text-center border-short/20">
      <p className="text-short font-bold uppercase text-xs">Error en los datos de análisis</p>
      <p className="text-gray-500 text-[10px] mt-1">{data?.detail || "No se pudo obtener información del mercado."}</p>
    </div>
  );

  const { analysis = {}, scoring = {} } = data;
  const isAlcista = analysis?.bias === "Alcista";
  const preTradeChecks = analysis?.pre_trade_checks || {};
  const checksPassed = analysis?.checks_passed || 0;
  const totalChecks = analysis?.total_checks || 6;
  const recommendation = analysis?.recommendation || scoring?.recommendation || "SIN DATOS";

  const checkItems = [
    { key: "tendencia_ema", label: "Tendencia EMA" },
    { key: "estructura_bos", label: "Estructura BOS" },
    { key: "liquidez_presente", label: "Liquidez" },
    { key: "ob_fvg_presente", label: "OB/FVG" },
    { key: "rsi_en_zona", label: "RSI zona" },
    { key: "volumen_ok", label: "Volumen" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Score Header */}
      <div className="grid grid-cols-12 gap-6">
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="col-span-12 lg:col-span-5 glass p-6 flex flex-col items-center justify-center relative overflow-hidden"
        >
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Setup Quality Score</span>
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
              <motion.circle 
                initial={{ strokeDashoffset: 364.4 }}
                animate={{ strokeDashoffset: 364.4 - (364.4 * (scoring?.total_score || 0)) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={364.4}
                className={(scoring?.total_score || 0) > 70 ? 'text-long' : (scoring?.total_score || 0) > 50 ? 'text-accent' : 'text-short'}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold">{scoring?.total_score || 0}</span>
            </div>
          </div>
          <div className={`mt-3 font-bold text-center px-4 py-1 rounded-full text-xs uppercase ${
            recommendation.includes("ALTA") ? 'bg-long/20 text-long' : 
            recommendation.includes("MEDIA") ? 'bg-accent/20 text-accent' : 'bg-short/20 text-short'
          }`}>
            {recommendation}
          </div>
          <p className="text-[10px] text-gray-500 mt-2">Checks: {checksPassed}/{totalChecks}</p>
        </motion.div>

        <div className="col-span-12 lg:col-span-7 glass p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
              <Zap size={14} className="text-accent" /> Bias & Confluencias
            </h3>
            <span className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded text-gray-400 border border-border">
              {symbol}
            </span>
          </div>
          <div className={`absolute top-0 right-0 p-4 opacity-10 ${isAlcista ? 'text-long' : 'text-short'}`}>
            <Activity size={120} />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
              isAlcista ? 'bg-long/10 border-long/20 text-long' : 'bg-short/10 border-short/20 text-short'
            }`}>
              {isAlcista ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
              <span className="text-xl font-bold uppercase">{analysis?.bias || "Indefinido"}</span>
            </div>
            <div className="h-10 w-px bg-border"></div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Precio</p>
              <p className="text-xl font-mono">${analysis?.last_price?.toLocaleString() || "0.00"}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">RSI</p>
              <p className="text-xl font-mono">{analysis?.rsi || "---"}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">ATR</p>
              <p className="text-xl font-mono">${analysis?.atr || "---"}</p>
            </div>
          </div>
          
          {/* Pre-Trade Checklist */}
          <div className="mt-4 p-3 bg-surface/50 rounded-lg">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Checklist ORO</p>
            <div className="grid grid-cols-3 gap-2">
              {checkItems.map((item, i) => (
                <div key={i} className={`flex items-center gap-1 text-[10px] ${preTradeChecks[item.key] ? 'text-long' : 'text-gray-500'}`}>
                  {preTradeChecks[item.key] ? <CheckCircle size={10} /> : <XCircle size={10} />}
                  {item.label}
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            {scoring?.confluences?.map((conf, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="flex items-center gap-2 text-sm text-gray-300"
              >
                <div className="w-1 h-1 rounded-full bg-accent"></div>
                {conf}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTÓN PLAN OPERATIVO */}
      {analysis?.trading_plan && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass border-2 border-accent/30 p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Layers className="text-accent" size={20} />
            <div>
              <h3 className="text-sm font-bold text-white uppercase">Plan Operativo (12-24h)</h3>
              <p className="text-[10px] text-gray-500">{analysis.trading_plan.sesgo_principal} • {analysis.trading_plan.riesgo_beneficio || 'Sin setup'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowPlanModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg text-xs font-bold text-accent hover:bg-accent/20"
          >
            <ExternalLink size={14} />
            Ver Plan
          </button>

          {/* MODAL PLAN OPERATIVO */}
          {showPlanModal && (
            <div style={{ backgroundColor: 'rgba(0,0,0,1)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
              <div style={{ backgroundColor: '#1a1a1f', border: '2px solid rgba(0,242,255,0.3)', padding: '1.25rem', width: '100%', maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto', borderRadius: '0.75rem' }}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <Layers className="text-accent" size={20} />
                    <h3 className="text-base font-bold text-white uppercase">Plan Operativo (12-24h)</h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      analysis.trading_plan.sesgo_principal === 'LONG' ? 'bg-long/20 text-long' :
                      analysis.trading_plan.sesgo_principal === 'SHORT' ? 'bg-short/20 text-short' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {analysis.trading_plan.sesgo_principal}
                    </span>
                  </div>
                  <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-4 p-3 bg-surface/50 rounded-lg">
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Por qué:</p>
                  <p className="text-xs text-gray-300">{analysis.trading_plan.por_que}</p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-2 bg-long/5 border border-long/20 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase">Soporte</p>
                    <p className="text-sm font-mono text-long">${analysis.trading_plan.soporte?.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-short/5 border border-short/20 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase">Resistencia</p>
                    <p className="text-sm font-mono text-short">${analysis.trading_plan.resistencia?.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-accent/5 border border-accent/20 rounded-lg">
                    <p className="text-[10px] text-gray-500 uppercase">Invalidación</p>
                    <p className="text-sm font-mono text-accent">${analysis.trading_plan.invalidation?.toLocaleString()}</p>
                  </div>
                </div>

                {analysis.trading_plan.zonas_liquidez && (
                  <div className="mb-4 p-3 bg-surface/30 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase mb-2">Zonas de Liquidez</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] text-gray-500">Soportes:</p>
                        <div className="flex gap-1 flex-wrap">
                          {analysis.trading_plan.zonas_liquidez.soportes?.map((s, i) => (
                            <span key={i} className="text-[10px] text-long bg-long/10 px-1 rounded">${s.toLocaleString()}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500">Resistencias:</p>
                        <div className="flex gap-1 flex-wrap">
                          {analysis.trading_plan.zonas_liquidez.resistencias?.map((r, i) => (
                            <span key={i} className="text-[10px] text-short bg-short/10 px-1 rounded">${r.toLocaleString()}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {analysis.trading_plan.sesgo_principal !== 'NO TRADE' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-2 bg-accent/5 border border-accent/20 rounded-lg">
                        <p className="text-[10px] text-gray-500 uppercase">Entry Ideal (Limit)</p>
                        <p className="text-lg font-mono text-white">${analysis.trading_plan.entry_ideal?.toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-accent/5 border border-accent/20 rounded-lg">
                        <p className="text-[10px] text-gray-500 uppercase">Entry Alternativa (Market)</p>
                        <p className="text-lg font-mono text-white">${analysis.trading_plan.entry_alternativa?.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="p-2 bg-short/10 border border-short/30 rounded-lg">
                        <p className="text-[10px] text-gray-500 uppercase">Stop Loss</p>
                        <p className="text-sm font-mono text-short">${analysis.trading_plan.stop_loss?.nivel?.toLocaleString()}</p>
                        <p className="text-[9px] text-gray-400">{analysis.trading_plan.stop_loss?.logica}</p>
                        <p className="text-[9px] text-short">{analysis.trading_plan.stop_loss?.distancia_pct}</p>
                      </div>
                      {analysis.trading_plan.take_profits?.map((tp, i) => (
                        <div key={i} className={`p-2 ${i === 0 ? 'bg-long/10 border-long/30' : 'bg-green-900/20 border-green-700/30'} border rounded-lg`}>
                          <p className="text-[10px] text-gray-500 uppercase">{tp.tp}</p>
                          <p className="text-sm font-mono text-long">${tp.nivel?.toLocaleString()}</p>
                          <p className="text-[9px] text-long">R:R {tp.rr}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-accent/10 border border-accent/20 rounded-lg">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Riesgo:Beneficio</p>
                        <p className="text-lg font-bold text-accent">{analysis.trading_plan.riesgo_beneficio}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase">Condiciones Mínimas</p>
                        <p className="text-xs text-gray-300">{analysis.trading_plan.condiciones_minimas}</p>
                      </div>
                    </div>

                    {onOpenTrade && (
                      <button
                        onClick={() => {
                          setShowPlanModal(false);
                          onOpenTrade(analysis.trading_plan);
                        }}
                        className={`w-full mt-4 py-3 rounded-lg font-bold text-sm uppercase flex items-center justify-center gap-2 ${
                          analysis.trading_plan.sesgo_principal === 'LONG'
                            ? 'bg-long text-black hover:opacity-90'
                            : 'bg-short text-white hover:opacity-90'
                        }`}
                      >
                        <Play size={16} />
                        Abrir Posición {analysis.trading_plan.sesgo_principal}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-gray-500/10 border border-gray-500/30 rounded-lg text-center mb-4">
                    <AlertTriangle className="mx-auto mb-2 text-gray-400" size={24} />
                    <p className="text-sm font-bold text-gray-400 uppercase">No Operar</p>
                    <p className="text-xs text-gray-500 mt-1">{analysis.trading_plan.condiciones_minimas}</p>
                  </div>
                )}

                {analysis.trading_plan.escenarios_alternativos && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 pt-4 border-t border-border"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="text-gray-400" size={14} />
                      <p className="text-xs font-bold text-gray-400 uppercase">Escenarios Alternativos</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className={`p-3 rounded-lg border ${
                        analysis.trading_plan.escenarios_alternativos.long?.activo 
                          ? 'bg-long/5 border-long/20' : 'bg-gray-500/5 border-gray-500/20 opacity-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-long uppercase">LONG</span>
                          {analysis.trading_plan.escenarios_alternativos.long?.activo && (
                            <span className="text-[9px] text-long bg-long/20 px-2 py-0.5 rounded">Activo</span>
                          )}
                        </div>
                        <div className="space-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Entry:</span>
                            <span className="font-mono text-white">${analysis.trading_plan.escenarios_alternativos.long?.entry?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">SL:</span>
                            <span className="font-mono text-short">${analysis.trading_plan.escenarios_alternativos.long?.sl?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">TP1:</span>
                            <span className="font-mono text-long">${analysis.trading_plan.escenarios_alternativos.long?.tp1?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">R:R:</span>
                            <span className="font-mono text-accent">{analysis.trading_plan.escenarios_alternativos.long?.rr}</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-2 italic">{analysis.trading_plan.escenarios_alternativos.long?.condiciones}</p>
                        {onOpenTrade && analysis.trading_plan.escenarios_alternativos.long?.activo && (
                          <button
                            onClick={() => {
                              setShowPlanModal(false);
                              onOpenTrade({...analysis.trading_plan.escenarios_alternativos.long, sesgo_principal: 'LONG', por_que: 'Escenario LONG alternativo'});
                            }}
                            className="w-full mt-2 py-1.5 bg-long text-black text-[10px] font-bold rounded uppercase hover:opacity-90"
                          >
                            Abrir LONG
                          </button>
                        )}
                      </div>

                      <div className={`p-3 rounded-lg border ${
                        analysis.trading_plan.escenarios_alternativos.short?.activo 
                          ? 'bg-short/5 border-short/20' : 'bg-gray-500/5 border-gray-500/20 opacity-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-short uppercase">SHORT</span>
                          {analysis.trading_plan.escenarios_alternativos.short?.activo && (
                            <span className="text-[9px] text-short bg-short/20 px-2 py-0.5 rounded">Activo</span>
                          )}
                        </div>
                        <div className="space-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Entry:</span>
                            <span className="font-mono text-white">${analysis.trading_plan.escenarios_alternativos.short?.entry?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">SL:</span>
                            <span className="font-mono text-long">${analysis.trading_plan.escenarios_alternativos.short?.sl?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">TP1:</span>
                            <span className="font-mono text-short">${analysis.trading_plan.escenarios_alternativos.short?.tp1?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">R:R:</span>
                            <span className="font-mono text-accent">{analysis.trading_plan.escenarios_alternativos.short?.rr}</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-2 italic">{analysis.trading_plan.escenarios_alternativos.short?.condiciones}</p>
                        {onOpenTrade && analysis.trading_plan.escenarios_alternativos.short?.activo && (
                          <button
                            onClick={() => {
                              setShowPlanModal(false);
                              onOpenTrade({...analysis.trading_plan.escenarios_alternativos.short, sesgo_principal: 'SHORT', por_que: 'Escenario SHORT alternativo'});
                            }}
                            className="w-full mt-2 py-1.5 bg-short text-white text-[10px] font-bold rounded uppercase hover:opacity-90"
                          >
                            Abrir SHORT
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* BOTÓN INFORMACIÓN AVANZADA */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass border border-border p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <FileBarChart className="text-gray-400" size={20} />
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase">Información Avanzada</h3>
            <p className="text-[10px] text-gray-500">SL • FVG • OB • Liquidez • Volumen • Derivados</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdvancedModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border rounded-lg text-xs font-bold text-gray-400 hover:bg-white/10 hover:text-white"
        >
          <ExternalLink size={14} />
          Ver Detalles
        </button>

        {/* MODAL INFORMACIÓN AVANZADA */}
        {showAdvancedModal && (
          <div style={{ backgroundColor: 'rgba(0,0,0,1)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
            <div style={{ backgroundColor: '#1a1a1f', border: '1px solid var(--color-border)', padding: '1.25rem', width: '100%', maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto', borderRadius: '0.75rem' }}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <FileBarChart className="text-gray-400" size={20} />
                  <h3 className="text-base font-bold text-white uppercase">Información Avanzada</h3>
                </div>
                <button onClick={() => setShowAdvancedModal(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {analysis?.sl_data && (
                <div className="glass p-4 border-accent/20 mb-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-accent" size={16} />
                    <span className="text-xs font-bold text-gray-400 uppercase">Stop Loss (ATR)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <p className="text-[10px] text-gray-500">Precio SL</p>
                      <p className="text-lg font-mono text-short">${analysis.sl_data.sl_price}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Distancia</p>
                      <p className="text-lg font-mono">{analysis.sl_data.sl_distance}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">% Distancia</p>
                      <p className="text-lg font-mono">{analysis.sl_data.sl_pct}%</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="glass p-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <BarChart3 size={14} /> Fair Value Gaps (FVG)
                  </h4>
                  <div className="space-y-2">
                    {analysis?.fvgs?.length > 0 ? analysis.fvgs.map((fvg, i) => (
                      <div key={i} className={`p-2 rounded-lg border flex justify-between items-center ${
                        fvg.type === 'Alcista' ? 'bg-long/5 border-long/10' : 'bg-short/5 border-short/10'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase ${fvg.type === 'Alcista' ? 'text-long' : 'text-short'}`}>
                          FVG {fvg.type}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          ${fvg.bottom?.toFixed(2)} - ${fvg.top?.toFixed(2)}
                        </span>
                      </div>
                    )) : <p className="text-xs text-gray-500 italic">Sin FVG detectados</p>}
                  </div>
                </div>

                <div className="glass p-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <Target size={14} /> Order Blocks (SMC)
                  </h4>
                  <div className="space-y-2">
                    {analysis?.order_blocks?.length > 0 ? analysis.order_blocks.map((ob, i) => (
                      <div key={i} className="p-2 rounded-lg border border-border bg-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-medium uppercase">{ob.type}</span>
                        <span className="text-[10px] font-mono text-accent">{ob.zone || `$${ob.price?.toFixed(2)}`}</span>
                      </div>
                    )) : <p className="text-xs text-gray-500 italic">Sin OB detectados</p>}
                  </div>
                </div>
              </div>

              {analysis?.liquidity && (
                <div className="glass p-4 mb-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <Info size={14} /> Zonas de Liquidez
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-2">Resistencias (Equal Highs)</p>
                      {analysis.liquidity.highs?.length > 0 ? analysis.liquidity.highs.map((h, i) => (
                        <span key={i} className="text-xs font-mono text-short block">${h.toFixed(2)}</span>
                      )) : <span className="text-xs text-gray-500">Sin detectado</span>}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-2">Soportes (Equal Lows)</p>
                      {analysis.liquidity.lows?.length > 0 ? analysis.liquidity.lows.map((l, i) => (
                        <span key={i} className="text-xs font-mono text-long block">${l.toFixed(2)}</span>
                      )) : <span className="text-xs text-gray-500">Sin detectado</span>}
                    </div>
                  </div>
                </div>
              )}

              {analysis?.volume && (
                <div className="glass p-3 mb-4 border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">Análisis de Volumen</span>
                    <span className={`text-xs font-bold ${analysis.volume.signal === 'Alto' ? 'text-long' : analysis.volume.signal === 'Bajo' ? 'text-short' : 'text-accent'}`}>
                      {analysis.volume.signal}
                    </span>
                  </div>
                  <div className="flex gap-6 mt-2 text-[10px] text-gray-400">
                    <span>Ratio: {analysis.volume.ratio}</span>
                    <span>Promedio: {analysis.volume.avg_volume}</span>
                  </div>
                </div>
              )}

              {data?.derivatives?.funding && (
                <div className="glass p-4 border-accent/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity size={14} className="text-accent" />
                    <span className="text-xs font-bold text-gray-500 uppercase">Datos de Derivados (CoinEx)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-500">Funding Rate</p>
                      <p className={`text-lg font-mono ${data.derivatives.funding.current > 0 ? 'text-short' : data.derivatives.funding.current < 0 ? 'text-long' : 'text-gray-400'}`}>
                        {data.derivatives.funding.current > 0 ? '+' : ''}{(data.derivatives.funding.current * 100).toFixed(4)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Next Funding</p>
                      <p className="text-lg font-mono text-gray-400">{(data.derivatives.funding.next * 100).toFixed(4)}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Mark Price</p>
                      <p className="text-lg font-mono">${data.derivatives.funding.mark_price?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-[10px] text-gray-500">
                      {data.derivatives.funding.current > 0 
                        ? 'Longs pagan - Sesgo hacia cortos' 
                        : data.derivatives.funding.current < 0 
                          ? 'Shorts pagan - Sesgo hacia largos' 
                          : 'Funding neutro - Sin sesgo claro'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AnalysisBoard;