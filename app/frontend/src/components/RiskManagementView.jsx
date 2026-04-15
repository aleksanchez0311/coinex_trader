import React from 'react';
import { ShieldCheck, AlertTriangle, Scale, Lock, TrendingUp, DollarSign } from 'lucide-react';

const RiskManagementView = () => {
  const rules = [
    { title: 'Riesgo Maximo', value: '30%', description: 'Perdida maxima permitida por operacion', icon: ShieldCheck, color: 'text-short' },
    { title: 'Tamano Operacion', value: '70%', description: 'Capital disponible asignado por setup', icon: DollarSign, color: 'text-accent' },
    { title: 'Ratio R:R Minimo', value: '1:1.5', description: 'Ningun plan se habilita por debajo de ese umbral', icon: Scale, color: 'text-long' },
    { title: 'Apalancamiento', value: '20x fijo', description: 'El modelo no permite variarlo', icon: TrendingUp, color: 'text-yellow-400' },
    { title: 'Stop Loss', value: 'Estructura + ATR', description: 'Invalidacion tecnica numerica y ejecutable', icon: Lock, color: 'text-orange-400' },
    { title: 'Decision', value: '1 sesgo', description: 'LONG, SHORT o NO TRADE', icon: AlertTriangle, color: 'text-neutral' },
  ];

  const takeProfits = [
    { level: 'TP1', rr: '1.5R', desc: 'Primer take profit obligatorio' },
    { level: 'TP2', rr: '2.2R', desc: 'Objetivo principal del plan' },
    { level: 'TP3', rr: '3.2R', desc: 'Extension si continua el desplazamiento' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-short/20 rounded-2xl flex items-center justify-center text-short">
          <Lock size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestion de Riesgo</h2>
          <p className="text-gray-400 text-sm">Reglas fijas del modelo institucional intradia</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {rules.map((rule, i) => (
          <div key={i} className="glass p-4 text-center border-white/5">
            <rule.icon className={`mx-auto mb-2 ${rule.color}`} size={24} />
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">{rule.title}</p>
            <p className="text-xl font-bold mb-1">{rule.value}</p>
            <p className="text-[9px] text-gray-400">{rule.description}</p>
          </div>
        ))}
      </div>

      <div className="glass p-6 space-y-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldCheck size={200} />
        </div>
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <ShieldCheck className="text-long" size={20} /> Objetivos
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          El motor devuelve objetivos cuantificados y compatibles con ejecucion real.
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
          <Scale className="text-accent" size={20} /> Modelo de Ejecucion
        </h3>
        <p className="text-sm text-gray-400">
          La app genera un unico sesgo operativo con precio actual, liquidez, derivados, niveles clave, exposicion, margen y perdida maxima.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 bg-white/5 rounded-xl border border-border">
            <h4 className="text-xs font-bold uppercase mb-2 text-gray-300">Ejecucion</h4>
            <p className="text-[11px] text-gray-500">El sizing usa 70% del capital y se ajusta para no superar una perdida maxima del 30% con 20x fijo.</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-border">
            <h4 className="text-xs font-bold uppercase mb-2 text-gray-300">Filtro</h4>
            <p className="text-[11px] text-gray-500">Si la estructura o los derivados no alinean, la salida obligatoria es NO TRADE en lugar de forzar una entrada.</p>
          </div>
        </div>
      </div>

      <div className="glass p-4 bg-short/5 border border-short/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-short shrink-0 mt-1" size={16} />
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="font-bold text-short">Advertencia:</span> a 20x, movimientos pequenos contra la posicion deterioran el margen muy rapido. El plan debe respetar estructura, ATR y limites de riesgo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiskManagementView;
