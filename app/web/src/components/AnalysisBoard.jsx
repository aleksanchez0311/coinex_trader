import React from 'react';
import { Target, Activity, Zap, Info, BarChart3, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const AnalysisBoard = ({ symbol, data, loading, analysisStep }) => {
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
          
          {/* Pre-Trade Checklist ORO */}
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

      {/* SL Data from ATR */}
      {analysis?.sl_data && (
        <div className="glass p-4 border-accent/20">
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

      {/* SMC Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-5">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <BarChart3 size={14} /> Fair Value Gaps (FVG)
          </h4>
          <div className="space-y-3">
            {analysis?.fvgs?.length > 0 ? analysis.fvgs.map((fvg, i) => (
              <div key={i} className={`p-3 rounded-lg border flex justify-between items-center ${
                fvg.type === 'Alcista' ? 'bg-long/5 border-long/10' : 'bg-short/5 border-short/10'
              }`}>
                <span className={`text-xs font-bold uppercase ${fvg.type === 'Alcista' ? 'text-long' : 'text-short'}`}>
                  FVG {fvg.type}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  ${fvg.bottom?.toFixed(2)} - ${fvg.top?.toFixed(2)}
                </span>
              </div>
            )) : <p className="text-xs text-gray-500 italic">Sin FVG detectados</p>}
          </div>
        </div>

        <div className="glass p-5">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <Target size={14} /> Order Blocks (SMC)
          </h4>
          <div className="space-y-3">
            {analysis?.order_blocks?.length > 0 ? analysis.order_blocks.map((ob, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-white/5 flex justify-between items-center">
                <span className="text-xs font-medium uppercase">{ob.type}</span>
                <span className="text-xs font-mono text-accent">{ob.zone || `$${ob.price?.toFixed(2)}`}</span>
              </div>
            )) : <p className="text-xs text-gray-500 italic">Sin OB detectados</p>}
          </div>
        </div>
      </div>

      {/* Liquidity Zones */}
      {analysis?.liquidity && (
        <div className="glass p-5">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
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

      {/* Volume Analysis */}
      {analysis?.volume && (
        <div className="glass p-4 border-border">
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

      {/* Derivatives / Funding Rate */}
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
              <p className={`text-lg font-mono ${data.derivatives.funding.next > 0 ? 'text-short' : data.derivatives.funding.next < 0 ? 'text-long' : 'text-gray-400'}`}>
                {data.derivatives.funding.next > 0 ? '+' : ''}{(data.derivatives.funding.next * 100).toFixed(4)}%
              </p>
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
    </motion.div>
  );
};

export default AnalysisBoard;