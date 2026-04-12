import React from 'react';
import { Target, Activity, Zap, BarChart3, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const AnalysisBoard = ({ symbol, data, loading, analysisStep }) => {
  if (loading) return (
    <div className="glass p-6 md:p-10 flex flex-col items-center justify-center gap-4 min-h-[400px] md:min-h-[500px]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-10 h-10 md:w-12 md:h-12 border-4 border-accent border-t-transparent rounded-full"
      ></motion.div>
      <p className="text-accent animate-pulse font-bold tracking-widest uppercase text-xs">Analizando mercado...</p>
      {analysisStep && (
        <p className="text-gray-500 text-[10px] mt-2 hidden md:inline">{analysisStep}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="col-span-1 md:col-span-5 glass p-4 md:p-6 flex flex-col items-center justify-center relative overflow-hidden"
        >
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 hidden md:inline">Setup Quality Score</span>
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2 md:hidden">Score</span>
          <div className="relative">
            <svg className="w-24 h-24 md:w-32 md:h-32 transform -rotate-90">
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
              <span className="text-3xl md:text-4xl font-bold">{scoring?.total_score || 0}</span>
            </div>
          </div>
          <div className={`mt-3 font-bold text-center px-3 md:px-4 py-1 rounded-full text-xs uppercase ${
            recommendation.includes("ALTA") ? 'bg-long/20 text-long' : 
            recommendation.includes("MEDIA") ? 'bg-accent/20 text-accent' : 'bg-short/20 text-short'
          }`}>
            {recommendation}
          </div>
          <p className="text-[10px] text-gray-500 mt-2">Checks: {checksPassed}/{totalChecks}</p>
        </motion.div>

        <div className="col-span-1 md:col-span-7 glass p-4 md:p-6">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
              <Zap size={14} className="text-accent" /> Bias & Confluencias
            </h3>
            <span className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded text-gray-400 border border-border">
              {symbol}
            </span>
          </div>
          <div className={`absolute top-0 right-0 p-4 opacity-10 ${isAlcista ? 'text-long' : 'text-short'}`}>
            <Activity size={80} md:size={120} />
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3 md:mb-4">
            <div className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl border ${
              isAlcista ? 'bg-long/10 border-long/20 text-long' : 'bg-short/10 border-short/20 text-short'
            }`}>
              {isAlcista ? <ArrowUpRight size={16} md:size={20} /> : <ArrowDownRight size={16} md:size={20} />}
              <span className="text-base md:text-xl font-bold uppercase">{analysis?.bias || "Indefinido"}</span>
            </div>
            <div className="h-8 md:h-10 w-px bg-border"></div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Precio</p>
              <p className="text-lg md:text-xl font-mono">${analysis?.last_price?.toLocaleString() || "0.00"}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">RSI</p>
              <p className="text-lg md:text-xl font-mono">{analysis?.rsi || "---"}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">ATR</p>
              <p className="text-lg md:text-xl font-mono">${analysis?.atr || "---"}</p>
            </div>
          </div>
          
          {/* Pre-Trade Checklist */}
          <div className="mt-3 md:mt-4 p-2 md:p-3 bg-surface/50 rounded-lg">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Checklist ORO</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {checkItems.map((item, i) => (
                <div key={i} className={`flex items-center gap-1 text-[10px] ${preTradeChecks[item.key] ? 'text-long' : 'text-gray-500'}`}>
                  {preTradeChecks[item.key] ? <CheckCircle size={10} /> : <XCircle size={10} />}
                  {item.label}
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2 mt-3 md:mt-4">
            {scoring?.confluences?.map((conf, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="flex items-center gap-2 text-xs md:text-sm text-gray-300"
              >
                <div className="w-1 h-1 rounded-full bg-accent"></div>
                {conf}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalysisBoard;