import React from 'react';
import { ShieldCheck, AlertTriangle, Scale, Lock, TrendingUp, DollarSign, Zap, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const RiskManagementView = () => {
  const rules = [
    { title: 'Pérdida Máxima', value: '1.0% / Trade', description: 'Impacto total sobre balance si toca SL', icon: ShieldAlert, color: 'text-short' },
    { title: 'Asignación 70/30', value: '70% Cap.', description: 'Capital de operación frente a reserva', icon: DollarSign, color: 'text-accent' },
    { title: 'Umbral R:R', value: '1:1.5 Min', description: 'Requisito para habilitación de botón', icon: Scale, color: 'text-long' },
    { title: 'Apalancamiento', value: '20x Fixed', description: 'Protocolo de margen aislado inamovible', icon: TrendingUp, color: 'text-blue-400' },
    { title: 'Volatilidad ATR', value: '2.0x ATR', description: 'Stop Loss dinámico por volatilidad', icon: Lock, color: 'text-orange-400' },
    { title: 'Verificación Trap', value: '40% Máx.', description: 'Filtro de seguridad contra trampas', icon: Zap, color: 'text-yellow-400' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Header Estética Premium */}
      <div className="flex items-center gap-6 mb-10">
        <div className="p-4 bg-short/10 rounded-3xl border border-short/20">
          <ShieldCheck size={32} className="text-short" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Gestión de Riesgo Humano</h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">Protocolo de Preservación de Capital v3.0</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            key={i} 
            className="glass p-6 text-center border-white/5 hover:border-white/10 rounded-3xl"
          >
            <rule.icon className={`mx-auto mb-4 ${rule.color}`} size={28} />
            <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-2">{rule.title}</p>
            <p className="text-2xl font-black text-white mb-2">{rule.value}</p>
            <p className="text-[10px] text-gray-500 font-medium leading-tight">{rule.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card de Gestión Activa */}
        <div className="glass p-8 rounded-[2.5rem] border-accent/20 bg-accent/5">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-2 bg-accent/20 rounded-xl">
                    <Scale size={20} className="text-accent" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Modelo de Protección</h3>
            </div>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed uppercase tracking-wider font-medium">
                El sistema calcula dinámicamente el tamaño de tu posición para que NUNCA pierdas más del monto de riesgo configurado. A 20x, el margen se ajusta para resistir la volatilidad del ATR filtrada por estructura.
            </p>
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Apalancamiento Permitido</span>
                    <span className="text-xs font-mono font-bold text-accent">20.00x</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-accent h-full" style={{ width: '80%' }}></div>
                </div>
            </div>
        </div>

        {/* Card de Alerta de Mercado */}
        <div className="glass p-8 rounded-[2.5rem] border-short/20 bg-short/5">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-2 bg-short/20 rounded-xl">
                    <AlertTriangle size={20} className="text-short" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Advertencia Letal</h3>
            </div>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed uppercase tracking-wider font-medium">
                El trading con alto apalancamiento requiere disciplina militar. El motor de análisis inhibe la ejecución si el riesgo de trampa o la volatilidad extrema pueden liquidar la posición antes de llegar al SL técnico.
            </p>
            <div className="flex gap-2">
                <span className="text-[10px] font-black text-short bg-short/10 px-3 py-1.5 rounded-lg border border-short/20 uppercase tracking-widest">High Volatility Alert</span>
                <span className="text-[10px] font-black text-gray-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 uppercase tracking-widest">Isolated Margin</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RiskManagementView;
