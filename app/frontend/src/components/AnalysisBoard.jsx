import React from 'react';
import { Target, Activity, Zap, ArrowUpRight, ArrowDownRight, RotateCw, Play, ShieldAlert } from 'lucide-react';
import AnalysisPulse from './AnalysisPulse';

const AnalysisBoard = ({ symbol, data, loading, analysisStep, onAnalyze, hasAnalyzed, isFromCache }) => {
  // Estado Inicial: Sin analizar
  if (!hasAnalyzed && !loading) return (
    <div className="glass p-8 flex flex-col items-center justify-center gap-6 min-h-[440px] relative overflow-hidden">
      {/* Fondo decorativo sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      
      <div className="p-5 bg-accent/10 rounded-[2rem] border border-accent/20 relative z-10 shadow-[0_0_50px_rgba(0,192,118,0.1)]">
        <Zap size={56} className="text-accent animate-pulse" fill="currentColor" />
      </div>
      
      <div className="text-center relative z-10 space-y-3">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Quant Intelligence Ready</h2>
        <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] font-black leading-relaxed max-w-[280px] mx-auto opacity-60">
          Activa el flujo de datos institucionales para {symbol}
        </p>
      </div>

      <button 
        onClick={onAnalyze}
        disabled={loading}
        className="relative z-10 flex items-center gap-4 px-10 py-5 bg-accent hover:brightness-110 disabled:opacity-50 rounded-2xl font-black text-xs uppercase tracking-widest text-background shadow-xl shadow-accent/20 transition-all hover:scale-[1.02] active:scale-95"
      >
        <Play size={20} fill="currentColor" />
        Iniciar Análisis
      </button>
    </div>
  );

  // Estado de Carga: Radar Premium
  if (loading) return (
    <div className="relative min-h-[440px] w-full">
        <AnalysisPulse step={analysisStep} />
    </div>
  );

  // Estado de Error
  if (!data || data.detail) return (
    <div className="glass p-8 text-center border-short/20 min-h-[440px] flex flex-col items-center justify-center space-y-4">
      <div className="p-4 bg-short/10 rounded-full">
        <ShieldAlert className="text-short" size={40} />
      </div>
      <div>
        <h3 className="text-short font-black uppercase tracking-widest text-sm">Fallo en la Sincronización</h3>
        <p className="text-gray-500 text-[10px] mt-2 font-bold uppercase tracking-tighter">{data?.detail || "No se pudo obtener información del mercado."}</p>
      </div>
      <button onClick={onAnalyze} className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline px-4 py-2">Reintentar Conexión</button>
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
        <div className="glass p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[220px] rounded-[2.5rem]">
          <div className="relative z-10 text-center">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
              <circle 
                cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" 
                strokeDasharray={364.4}
                strokeDashoffset={364.4 - (364.4 * (scoring?.total_score || 0)) / 100}
                strokeLinecap="round"
                className={(scoring?.total_score || 0) > 75 ? 'text-long' : (scoring?.total_score || 0) > 50 ? 'text-accent' : 'text-short'}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
              <span className="text-4xl font-black text-white">{scoring?.total_score || 0}</span>
              <span className="text-[9px] uppercase font-black text-gray-500 tracking-[0.2em]">Rating</span>
            </div>
          </div>
          
          <div className={`mt-6 font-black px-8 py-2 rounded-2xl text-xs tracking-[0.2em] ${
            recommendation === 'LONG' ? 'bg-long/10 text-long border border-long/20' : 
            recommendation === 'SHORT' ? 'bg-short/10 text-short border border-short/20' :
            'bg-white/5 text-gray-500 border border-white/5'
          }`}>
            {recommendation}
          </div>
        </div>

        {/* Bias & Price - Hero Section */}
        <div className="glass p-6 md:p-8 flex flex-col justify-center relative overflow-hidden min-h-[220px] rounded-[2.5rem]">
          <div className="flex justify-between items-start mb-6">
            <span className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em] ml-1">{symbol}</span>
            {isFromCache && <span className="text-[9px] text-amber-500 font-black px-2 py-0.5 bg-amber-500/5 rounded-lg border border-amber-500/10 tracking-widest">CACHE</span>}
          </div>
          
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${isAlcista ? 'bg-long/10 text-long' : isBajista ? 'bg-short/10 text-short' : 'bg-gray-500/10 text-gray-500'}`}>
                    {isAlcista ? <ArrowUpRight size={32} /> : isBajista ? <ArrowDownRight size={32} /> : <Activity size={32} />}
                </div>
                <div>
                   <h2 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter ${isAlcista ? 'text-long' : isBajista ? 'text-short' : 'text-gray-400'}`}>
                    {analysis?.bias || "Rango"}
                   </h2>
                   <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.3em] mt-1 ml-1">Market Structure</p>
                </div>
             </div>
             
             <div className="mt-6 pt-6 border-t border-white/5">
               <span className="text-[9px] text-gray-600 uppercase font-black tracking-[0.4em] block mb-2 ml-1">Real-time Stream</span>
               <span className="text-4xl font-mono font-bold text-white tabular-nums tracking-tighter">${analysis?.last_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) || "0.00"}</span>
             </div>
          </div>
        </div>
      </div>

      {trapRisk && (
        <div className="bg-short/5 border border-short/20 rounded-[2rem] p-6 flex items-start gap-5 animate-in fade-in slide-in-from-top-2">
            <div className="p-3 bg-short/10 rounded-2xl shrink-0">
                <ShieldAlert className="text-short" size={24} />
            </div>
            <div>
                <h4 className="text-short font-black text-xs uppercase tracking-widest mb-1.5">Alerta de Trampa Detectada</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed font-bold">
                  {trapAnalysis?.recomendacion_trap?.justificacion || 'Inconsistencia en flujo de órdenes.'}
                </p>
            </div>
        </div>
      )}

      {/* Botón de actualizar - Discreto */}
      <div className="flex justify-center pt-4">
        <button 
          onClick={onAnalyze}
          disabled={loading}
          className="flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
        >
          <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Redimensionando Datos...' : 'Recalibrar Análisis'}
        </button>
      </div>
    </div>
  );
};

export default AnalysisBoard;
