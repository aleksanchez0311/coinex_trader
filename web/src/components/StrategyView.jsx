import React from 'react';
import { Zap, Target, BarChart3, Info, Clock, TrendingUp, ShieldAlert, Volume2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const StrategyView = () => {
  const sections = [
    {
      title: "1. Contexto de Sesión",
      icon: Clock,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      items: [
        { label: "🟣 Asia", desc: "Movimiento lento, menor volatilidad" },
        { label: "🔵 Londres", desc: "Movimiento fuerte, alta liquidez" },
        { label: "🔴 New York", desc: "Máxima volatilidad y manipulación" },
        { label: "✅ Mejores setups", desc: "Apertura Londres + Apertura NY" }
      ]
    },
    {
      title: "2. Liquidez (SMC)",
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      items: [
        { label: "✓ Identificar stops", desc: "Máximos/mínimos anteriores" },
        { label: "✓ Zonas de liquidez", desc: "Equal highs/lows, stop clusters" },
        { label: "→ Regla clave", desc: "Precio va a liquidez primero, luego movimiento real" }
      ]
    },
    {
      title: "3. Estructura Real",
      icon: Zap,
      color: "text-accent",
      bg: "bg-accent/10",
      items: [
        { label: "BOS", desc: "Break of Structure → Continuación" },
        { label: "CHOCH", desc: "Change of Character → Posible giro" },
        { label: "Entrada PRO", desc: "Liquidez barrida + CHoCH + Order Block" }
      ]
    },
    {
      title: "4. Multi-Timeframe",
      icon: BarChart3,
      color: "text-green-400",
      bg: "bg-green-500/10",
      items: [
        { label: "1H o 15M", desc: "Determinar dirección de tendencia" },
        { label: "5M o 1M", desc: "Timing fino de entrada" },
        { label: "Ejemplo", desc: "15M alcista + retroceso a OB en 5M = entrada" }
      ]
    },
    {
      title: "5. Volumen",
      icon: Volume2,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      items: [
        { label: "✓ Volumen alto", desc: "Ruptura válida = movimiento real" },
        { label: "❌ Volumen bajo", desc: "Posible fakeout" }
      ]
    },
    {
      title: "6. Gestión de Riesgo",
      icon: ShieldAlert,
      color: "text-red-400",
      bg: "bg-red-500/10",
      items: [
        { label: "Riesgo máx", desc: "1-2% por trade" },
        { label: "SL obligatorio", desc: "Nunca operar sin stop loss" },
        { label: "SL basado en", desc: "ATR (Average True Range)" },
        { label: "TP mínimo", desc: "2R (el doble del riesgo)" }
      ]
    },
    {
      title: "7. Ratio Riesgo/Beneficio",
      icon: Target,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      items: [
        { label: "NO operar si", desc: "RR < 1:2" },
        { label: "Ideal", desc: "1:2 o 1:3" }
      ]
    },
    {
      title: "8. Filtros de NO Operación",
      icon: AlertCircle,
      color: "text-gray-400",
      bg: "bg-gray-500/10",
      items: [
        { label: "❌ EMAs enredadas", desc: "Sin tendencia clara" },
        { label: "❌ Mercado lateral", desc: "Sin estructura definida" },
        { label: "❌ Noticias fuertes", desc: "Alta volatilidad impredecible" },
        { label: "❌ Sin liquidez", desc: "No hay zonas claras de stops" }
      ]
    }
  ];

  const checklist = [
    "Tendencia clara (EMA + estructura)",
    "Liquidez identificada y validada",
    "OB o FVG válido en zona de interés",
    "Confirmación: BOS o CHoCH",
    "RSI en zona correcta (40-60)",
    "RR mínimo 1:2",
    "SL definido basado en ATR",
    "Volumen confirmado en ruptura"
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
          <h2 className="text-2xl font-bold">Estrategia Intradía Pro</h2>
          <p className="text-gray-400 text-sm">SMC + EMA + RSI + ATR</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((section, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i} 
            className={`glass p-4 border ${section.color.replace('text-', 'border-')}/20 hover:border-${section.color.replace('text-', '')}/40 transition-colors`}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            <li className="text-xs text-gray-400">• No gestionan riesgo → pierden</li>
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
