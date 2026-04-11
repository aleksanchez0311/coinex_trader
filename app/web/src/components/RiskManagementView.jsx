import React from 'react';
import { ShieldCheck, AlertTriangle, Scale, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const RiskManagementView = () => {
  const rules = [
    {
      title: "Protección de Capital",
      value: "1-2%",
      description: "Riesgo máximo recomendado por operación.",
      icon: ShieldCheck,
      color: "text-long"
    },
    {
      title: "Drawdown Diario",
      value: "5%",
      description: "Cierre automático de operaciones al alcanzar el límite.",
      icon: AlertTriangle,
      color: "text-short"
    },
    {
      title: "Ratio R:R Mínimo",
      value: "1:2.5",
      description: "Relación Riesgo/Beneficio mínima aceptada por el motor.",
      icon: Scale,
      color: "text-accent"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-short/20 rounded-2xl flex items-center justify-center text-short">
          <Lock size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Protocolos de Gestión de Riesgo</h2>
          <p className="text-gray-400 text-sm">Configuración de seguridad y preservación de balance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rules.map((rule, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="glass p-6 text-center border-white/5"
          >
            <rule.icon className={`mx-auto mb-4 ${rule.color}`} size={32} />
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">{rule.title}</p>
            <p className="text-3xl font-bold mb-2">{rule.value}</p>
            <p className="text-[10px] text-gray-400 leading-relaxed">{rule.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass p-8 space-y-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldCheck size={200} />
        </div>
        
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ShieldCheck className="text-long" size={20} /> Modelo Human-in-the-Loop
        </h3>
        <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
          Este terminal opera bajo un modelo de confirmación obligatoria. Ninguna orden será enviada a CoinEx sin una revisión previa del Stop Loss y el Apalancamiento en el panel lateral.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-white/5 rounded-xl border border-border">
            <h4 className="text-xs font-bold uppercase mb-2 text-gray-300">Ejecución en Vivo (Live)</h4>
            <p className="text-[11px] text-gray-500">Todas las operaciones se ejecutan directamente en CoinEx. Verifica siempre el SL y apalancamiento antes de confirmar.</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-border">
            <h4 className="text-xs font-bold uppercase mb-2 text-gray-300">Límites de Apalancamiento</h4>
            <p className="text-[11px] text-gray-500">Restringido a un máximo de 20x para asegurar que el margen de liquidación sea siempre {'>'}30% del Stop Loss.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskManagementView;
