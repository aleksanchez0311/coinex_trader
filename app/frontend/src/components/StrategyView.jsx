import React from 'react';
import { Zap, Target, BarChart3, Info, TrendingUp, ShieldAlert, Volume2, CheckCircle, AlertCircle, LineChart } from 'lucide-react';
import { motion } from 'framer-motion';

const StrategyView = () => {
  const sections = [
    {
      title: "1. Estructura de Mercado (SMC)",
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      items: [
        { label: "Swings", desc: "Highs y Lows del precio" },
        { label: "BOS", desc: "Break of Structure → Continuidad" },
        { label: "CHOCH", desc: "Change of Character → Giro" }
      ]
    },
    {
      title: "2. Liquidez",
      icon: Zap,
      color: "text-accent",
      bg: "bg-accent/10",
      items: [
        { label: "Equal Highs", desc: "Máximos iguales" },
        { label: "Equal Lows", desc: "Mínimos iguales" },
        { label: "Stop Clusters", desc: "Agrupaciones de stops" }
      ]
    },
    {
      title: "3. Zonas de Entrada",
      icon: Target,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      items: [
        { label: "OB Alcista", desc: "Bloque de ordenes bullish" },
        { label: "OB Bajista", desc: "Bloque de ordenes bearish" },
        { label: "FVG", desc: "Fair Value Gap (brecha)" }
      ]
    },
    {
      title: "4. Tendencia EMA",
      icon: LineChart,
      color: "text-green-400",
      bg: "bg-green-500/10",
      items: [
        { label: "EMA20", desc: "Media móvil rápida" },
        { label: "EMA50", desc: "Media móvil media" },
        { label: "EMA200", desc: "Media móvil lenta" }
      ]
    },
    {
      title: "5. RSI",
      icon: BarChart3,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      items: [
        { label: "Zona neutra", desc: "40-60" },
        { label: "Sobrecompra", desc: ">70" },
        { label: "Sobreventa", desc: "<30" }
      ]
    },
    {
      title: "6. ATR (Stop Loss)",
      icon: ShieldAlert,
      color: "text-red-400",
      bg: "bg-red-500/10",
      items: [
        { label: "SL basado en ATR", desc: "Average True Range" },
        { label: "Distancia", desc: "2xATR del precio" },
        { label: "Liquidation buffer", desc: ">30% del SL" }
      ]
    },
    {
      title: "7. Ratio R:R",
      icon: Target,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      items: [
        { label: "TP1", desc: "1.5R" },
        { label: "TP2", desc: "2.5R" },
        { label: "TP3", desc: "4.0R" }
      ]
    },
    {
      title: "8. Volumen",
      icon: Volume2,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      items: [
        { label: "Alto volumen", desc: "Ruptura válida" },
        { label: "Bajo volumen", desc: "Posible fakeout" }
      ]
    }
  ];

  const checklist = [
    "Tendencia EMA (stack alineado: EMA20 > EMA50 > EMA200)",
    "Estructura BOS validada",
    "Liquidez identificada y barrida",
    "OB o FVG presente en zona de interés",
    "RSI en zona neutra (40-60)",
    "Volumen confirmado en movimiento",
    "R:R mínimo 1:1.5"
  ];

  const psychologyRules = [
    "No sobreoperar - calidad sobre cantidad",
    "No vengarse del mercado después de pérdidas",
    "Máximo 2-3 trades por día",
    "Respetar el plan siempre"
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
          <BarChart3 size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Estrategia SMC + EMA + RSI + ATR</h2>
          <p className="text-gray-400 text-sm">Metodología de análisis intradía</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((section, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i} 
            className="glass p-4 border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex items-center gap-2 mb-3">
              <section.icon className={section.color} size={18} />
              <h3 className="font-bold text-sm">{section.title}</h3>
            </div>
            <div className="space-y-2">
              {section.items.map((item, j) => (
                <div key={j} className="text-[10px]">
                  <span className="text-gray-300 font-medium">{item.label}</span>
                  <span className="text-gray-500 block">{item.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass p-6 border-accent/20">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="text-accent" size={20} />
          <h3 className="font-bold text-lg">Checklist Pre-Trade (ORO)</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">Si falta 1 → NO ENTRAS</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-surface/50 rounded-lg">
              <div className="w-4 h-4 rounded-full border border-accent/30 flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-accent rounded-full opacity-50" />
              </div>
              <span className="text-xs text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass p-5 border-red-500/20">
          <h4 className="text-sm font-bold text-red-400 mb-3">🧠 Psicología</h4>
          <ul className="space-y-2">
            {psychologyRules.map((rule, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-center gap-2">
                <span className="w-1 h-1 bg-red-400 rounded-full" />
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass p-5 border-short/20">
          <h4 className="text-sm font-bold text-short mb-3">⚠️ La verdad directa</h4>
          <ul className="space-y-2">
            <li className="text-xs text-gray-400">• El edge NO está en los indicadores</li>
            <li className="text-xs text-gray-400">• Está en la EJECUCIÓN del plan</li>
            <li className="text-xs text-gray-400">• No respetan liquidez → pierden</li>
            <li className="text-xs text-gray-400">• No esperan confirmación → pierden</li>
          </ul>
        </div>
      </div>

      <div className="glass p-4 bg-accent/5 border-dashed border-accent/20">
        <div className="flex items-start gap-3">
          <Info className="text-accent shrink-0 mt-1" size={16} />
          <p className="text-xs text-gray-400 leading-relaxed">
            El motor de análisis aplica esta metodología completa. Score &lt; 60 = especulativo, requiere confirmación manual. 
            Score ≥ 60 con todas las confluencias = setup de alta probabilidad.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StrategyView;
