import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Zap, Layers, Search } from 'lucide-react';

const AnalysisPulse = ({ step }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
      <div className="relative w-full max-w-md p-8 text-center space-y-8">
        {/* Radar Animation */}
        <div className="relative w-48 h-48 mx-auto">
          {/* Circulos Concentricos */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 rounded-full border border-accent/30"
          />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            className="absolute inset-0 rounded-full border border-accent/10"
          />
          
          {/* Efecto de Escaneo */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-t-2 border-r-2 border-accent/40 bg-gradient-to-tr from-transparent via-transparent to-accent/5"
          />

          {/* Icono Central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="p-5 bg-accent/10 rounded-full border border-accent/20 shadow-[0_0_30px_rgba(0,192,118,0.2)]"
            >
              <Zap size={32} className="text-accent" fill="currentColor" />
            </motion.div>
          </div>
        </div>

        {/* Mensajes de Análisis */}
        <div className="space-y-3">
          <motion.h3 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-black text-white uppercase tracking-widest"
          >
            Motor de Análisis Activo
          </motion.h3>
          
          <div className="flex flex-col items-center gap-2">
            <div className="h-1 w-48 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ x: [-200, 200] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="h-full w-24 bg-gradient-to-r from-transparent via-accent to-transparent"
              />
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] max-w-[250px] leading-relaxed">
              {step || "Sincronizando flujo de órdenes institucionales..."}
            </p>
          </div>
        </div>

        {/* Indicadores Técnicos Flotantes */}
        <div className="flex justify-center gap-6 opacity-40">
           <div className="flex flex-col items-center gap-1">
              <Layers size={14} />
              <span className="text-[8px] font-black uppercase">SMC</span>
           </div>
           <div className="flex flex-col items-center gap-1">
              <Activity size={14} />
              <span className="text-[8px] font-black uppercase">TRIPS</span>
           </div>
           <div className="flex flex-col items-center gap-1">
              <ShieldCheck size={14} />
              <span className="text-[8px] font-black uppercase">RISK</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPulse;
