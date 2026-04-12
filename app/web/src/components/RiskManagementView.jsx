import React from 'react';
import { ShieldCheck, AlertTriangle, Scale, Lock, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const RiskManagementView = () => {
  const rules = [
    {
      title: "Riesgo por Trade",
      value: "1-2%",
      description: "Capital en riesgo por operación",
      icon: ShieldCheck,
      color: "text-long"
    },
    {
      title: "Drawdown Diario",
      value: "5%",
      description: "Límite de pérdida diario",
      icon: AlertTriangle,
      color: "text-short"
    },
    {
      title: "Ratio R:R Mínimo",
      value: "1:1.5",
      description: "Take Profit mínimo vs Stop Loss",
      icon: Scale,
      color: "text-accent"
    },
    {
      title: "Apalancamiento",
      value: "≤20x",
      description: "Máximo permitido",
      icon: TrendingUp,
      color: "text-yellow-400"
    },
    {
      title: "Margen de Liquidación",
      value: ">30%",
      description: "Buffer sobre stop loss",
      icon: Lock,
      color: "text-red-400"
    },
    {
      title: "Stop Loss",
      value: "2x ATR",
      description: "Basado en Average True Range",
      icon: DollarSign,
      color: "text-orange-400"
    }
  ];

  const takeProfits = [
    { level: "TP1", rr: "1.5R", desc: "Primera toma de ganancias" },
    { level: "TP2", rr: "2.5R", desc: "Segunda toma de ganancias" },
    { level: "TP3", rr: "4.0R", desc: "Tercera toma de ganancias" }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-short/20 rounded-2xl flex items-center justify-center text-short">
          <Lock size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestión de Riesgo</h2>
          <p className="text-gray-400 text-sm">Parámetros de protección de capital</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {rules.map((rule, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="glass p-4 text-center border-white/5"
          >
            <rule.icon className={`mx-auto mb-2 ${rule.color}`} size={24} />
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">{rule.title}</p>
            <p className="text-xl font-bold mb-1">{rule.value}</p>
            <p className="text-[9px] text-gray-400">{rule.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass p-6 space-y-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldCheck size={200} />
        </div>
        
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <ShieldCheck className="text-long" size={20} /> Take Profits
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Niveles de salida basados en múltiplos del riesgo
        </p>

        <div className="grid grid-cols-3 gap-3">
          {takeProfits.map((tp, i) => (
            <div key={i} className="p-3 bg-white/5 rounded-lg border border-border text-center">
              <p className="text-xs font-bold text-accent">{tp.level}</p>
              <p className="text-lg font-bold text-white">{tp.rr}</p>
              <p className="text-[9px] text-gray-500">{tp.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-6 space-y-4 border-accent/20">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Scale className="text-accent" size={20} /> Modelo de Ejecución
        </h3>
        <p className="text-sm text-gray-400">
          Este terminal opera bajo un modelo de confirmación obligatoria. Ninguna orden será enviada a CoinEx sin revisión previa.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 bg-white/5 rounded-xl border border-border">
            <h4 className="text-xs font-bold uppercase mb-2 text-gray-300">Ejecución en Vivo</h4>
            <p className="text-[11px] text-gray-500">Todas las operaciones se ejecutan directamente en CoinEx. Verifica siempre SL y apalancamiento.</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-border">
            <h4 className="text-xs font-bold uppercase mb-2 text-gray-300">Human-in-the-Loop</h4>
            <p className="text-[11px] text-gray-500">Tu confirmas cada orden antes de ser enviada. El sistema solo analiza y recomienda.</p>
          </div>
        </div>
      </div>

      <div className="glass p-4 bg-short/5 border border-short/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-short shrink-0 mt-1" size={16} />
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="font-bold text-short">Advertencia:</span> El apalancamiento amplify las ganancias y pérdidas. 
            Un 20x significa que un movimiento del 5% contra tu posición resulta en pérdida total del margen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiskManagementView;
