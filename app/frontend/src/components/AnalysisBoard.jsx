import React from 'react';
import { Target, Activity, Zap, ArrowUpRight, ArrowDownRight, RotateCw, Play, ShieldAlert } from 'lucide-react';

const AnalysisBoard = ({ symbol, data, loading, analysisStep, onAnalyze, hasAnalyzed, isFromCache }) => {
  if (!hasAnalyzed) return (
    <div className="glass p-8 flex flex-col items-center justify-center gap-6 min-h-[400px]">
      <div className="p-4 bg-accent/10 rounded-full">
        <Zap size={48} className="text-accent animate-pulse" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">Quant Trader ready</h2>
        <p className="text-gray-500 text-xs uppercase tracking-widest font-medium">Selecciona un activo para comenzar el flujo de análisis</p>
      </div>
      <button 
        onClick={onAnalyze}
        disabled={loading}
        className="flex items-center gap-3 px-8 py-4 bg-accent hover:bg-accent/90 disabled:opacity-50 rounded-xl font-black text-sm uppercase tracking-tighter transition-all transform hover:scale-105"
      >
        <Play size={18} fill="currentColor" />
        Analizar {symbol}
      </button>
    </div>
  );

  if (loading) return (
    <div className="glass p-10 flex flex-col items-center justify-center gap-6 min-h-[400px]">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
        <Zap size={24} className="text-accent absolute inset-0 m-auto animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-accent font-black tracking-[0.2em] uppercase text-xs mb-2">Escaneando Estructura</p>
        {analysisStep && (
          <p className="text-gray-500 text-[10px] uppercase font-mono">{analysisStep}</p>
        )}
      </div>
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
  const isBajista = analysis?.bias === "Bajista";
  const recommendation = analysis?.trading_plan?.sesgo_principal || "NO TRADE";
  const trapAnalysis = analysis?.analisis_trap || {};
  const trapRisk = trapAnalysis?.riesgo_trap?.trap_riesgo === 'ALTO' || (trapAnalysis?.probabilidad_trap || 0) > 40;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Score & recommendation - Minimalista */}
        <div className="glass p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[220px]">
          <div className="relative z-10 text-center">
            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
              <circle 
                cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={364.4}
                strokeDashoffset={364.4 - (364.4 * (scoring?.total_score || 0)) / 100}
                strokeLinecap="round"
                className={(scoring?.total_score || 0) > 75 ? 'text-long' : (scoring?.total_score || 0) > 50 ? 'text-accent' : 'text-short'}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
              <span className="text-3xl font-black text-white">{scoring?.total_score || 0}</span>
              <span className="text-[9px] uppercase font-bold text-gray-500 tracking-tighter">Setup Score</span>
            </div>
          </div>
          
          <div className={`mt-6 font-black px-6 py-2 rounded-xl text-sm tracking-wide ${
            recommendation === 'LONG' ? 'bg-long/10 text-long border border-long/20' : 
            recommendation === 'SHORT' ? 'bg-short/10 text-short border border-short/20' :
            'bg-surface-elevated text-gray-400 border border-border'
          }`}>
            {recommendation}
          </div>
        </div>

        {/* Bias & Price - Hero Section */}
        <div className="glass p-6 flex flex-col justify-center relative overflow-hidden min-h-[220px]">
          <div className="flex justify-between items-start mb-6">
            <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{symbol}</span>
            {isFromCache && <span className="text-[10px] text-amber-500 font-bold px-2 py-0.5 bg-amber-500/5 rounded border border-amber-500/10">CACHE</span>}
          </div>
          
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isAlcista ? 'bg-long/10 text-long' : isBajista ? 'bg-short/10 text-short' : 'bg-gray-500/10 text-gray-500'}`}>
                    {isAlcista ? <ArrowUpRight size={28} /> : isBajista ? <ArrowDownRight size={28} /> : <Activity size={28} />}
                </div>
                <div>
                   <h2 className={`text-4xl font-black uppercase tracking-tight ${isAlcista ? 'text-long' : isBajista ? 'text-short' : 'text-gray-400'}`}>
                    {analysis?.bias || "Rango"}
                   </h2>
                   <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">Efectividad Alta Probabilidad</p>
                </div>
             </div>
             
             <div className="mt-4 pt-4 border-t border-border/50">
               <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-1">Precio Actual</span>
               <span className="text-3xl font-mono font-bold text-white tabular-nums">${analysis?.last_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) || "0.00"}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Alerta de Trap - Solo si hay riesgo significativo */}
      {trapRisk && (
        <div className="bg-short/5 border border-short/20 rounded-xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="p-2 bg-short/10 rounded-lg shrink-0">
                <ShieldAlert className="text-short" size={20} />
            </div>
            <div>
                <h4 className="text-short font-bold text-xs uppercase mb-1">Peligro: {trapAnalysis?.riesgo_trap?.trap_riesgo === 'ALTO' ? 'Trap de Alta Probabilidad' : 'Aviso de Trampa'}</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                  {trapAnalysis?.recomendacion_trap?.justificacion || 'Riesgo inminente detectado en liquidez cercana. Se recomienda extremar precauciones.'}
                </p>
            </div>
        </div>
      )}

      {/* Botón de actualizar - Discreto */}
      <div className="flex justify-center pt-2">
        <button 
          onClick={onAnalyze}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-border"
        >
          <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Sincronizando...' : 'Recalibrar Análisis'}
        </button>
      </div>
    </div>
  );
};

export default AnalysisBoard;
