import React from 'react';
import { Zap, Target, BarChart3, Info, TrendingUp, ShieldAlert, Volume2, CheckCircle, AlertCircle, LineChart, Binary } from 'lucide-react';
import { motion } from 'framer-motion';

const StrategyView = () => {
  const sections = [
    {
      title: "Arquitectura SMC",
      icon: Binary,
      color: "text-accent",
      items: [
        { label: "BOS / CHOCH", desc: "Ruptura y giro estructural" },
        { label: "Order Blocks", desc: "Zonas de alta demanda/oferta" },
        { label: "FVG", desc: "Desequilibrio institucional" }
      ]
    },
    {
      title: "Liquidez Pro",
      icon: Zap,
      color: "text-long",
      items: [
        { label: "Sweep Liquidity", desc: "Barrido de stops detectado" },
        { label: "EQH / EQL", desc: "Máximos/mínimos iguales" },
        { label: "Liq. Pools", desc: "Zonas de liquidaciones masivas" }
      ]
    },
    {
      title: "Detección de Traps",
      icon: ShieldAlert,
      color: "text-short",
      items: [
        { label: "Bull Trap", desc: "Falsa ruptura en resistencia" },
        { label: "Bear Trap", desc: "Falso quiebre en soporte" },
        { label: "Funding Filter", desc: "Validación por derivados" }
      ]
    },
    {
      title: "Confluencia",
      icon: LineChart,
      color: "text-blue-400",
      items: [
        { label: "EMA Stack", desc: "Filtro tendencial 20/50/200" },
        { label: "RSI Zone", desc: "Control de momentum" },
        { label: "Volume Ratio", desc: "Confirmación de fuerza" }
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Header Estética Premium */}
      <div className="flex items-center gap-6 mb-10">
        <div className="p-4 bg-accent/10 rounded-3xl border border-accent/20">
          <Target size={32} className="text-accent" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Protocolo de Análisis</h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">Smart Money Concepts + Trap Detection v2.1</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((section, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="glass p-6 border-white/5 hover:border-accent/20 transition-all rounded-3xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl bg-white/5`}>
                <section.icon className={section.color} size={18} />
              </div>
              <h3 className="font-black text-xs uppercase tracking-widest text-white">{section.title}</h3>
            </div>
            <div className="space-y-4">
              {section.items.map((item, j) => (
                <div key={j} className="group">
                  <span className="text-[10px] text-gray-300 font-black uppercase block mb-1 group-hover:text-accent transition-colors">{item.label}</span>
                  <span className="text-[10px] text-gray-500 font-medium block leading-tight">{item.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Checklist ORO con estética de sistema */}
      <div className="glass p-8 border-long/20 rounded-[2.5rem] bg-long/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-2 bg-long/10 rounded-lg">
             <CheckCircle className="text-long" size={24} />
          </div>
          <h3 className="font-black text-xl text-white uppercase tracking-tighter">Checklist de Ejecución Institucional</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "Precio fuera de zona de TRAP (>40% probabilidad)",
            "Estructura BOS/CHOCH confirmada en vela cerrada",
            "Barrido de liquidez previo al movimiento (Inducement)",
            "RSI en zona de momentum (No sobre-extensión)",
            "Funding Rate no sobrecargado contra la posición",
            "R:R mínimo de 1:1.5 proyectado"
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
               <span className="text-accent font-mono text-xs">0{i+1}</span>
               <span className="text-xs text-gray-300 font-bold uppercase tracking-tight">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-4">
          <Info className="text-gray-500 shrink-0" size={16} />
          <p className="text-[10px] text-gray-500 leading-relaxed font-medium uppercase tracking-wider">
            Este protocolo automatiza la detección de rastros institucionales. El sistema busca la mayor confluencia de datos antes de habilitar el botón de ejecución. La disciplina institucional consiste en NO OPERAR cuando el checklist no está al 100%.
          </p>
      </div>
    </div>
  );
};

export default StrategyView;
