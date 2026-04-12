import React from 'react';
import { Layers, FileBarChart, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const PlanOperativoButton = ({ analysisData, onOpenPlanModal, loading }) => {
  if (loading || !analysisData?.analysis?.trading_plan) return null;
  
  const { trading_plan } = analysisData.analysis;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass border-2 border-accent/30 p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <Layers className="text-accent" size={20} />
        <div>
          <h3 className="text-sm font-bold text-white uppercase">Plan Operativo (12-24h)</h3>
          <p className="text-[10px] text-gray-500">{trading_plan.sesgo_principal} • {trading_plan.riesgo_beneficio || 'Sin setup'}</p>
        </div>
      </div>
      <button
        onClick={() => onOpenPlanModal && onOpenPlanModal(trading_plan)}
        className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg text-xs font-bold text-accent hover:bg-accent/20"
      >
        <ExternalLink size={14} />
        Ver Detalles
      </button>
    </motion.div>
  );
};

const InfoAvanzadaButton = ({ analysisData, loading }) => {
  if (loading || !analysisData) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass border border-border p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <FileBarChart className="text-gray-400" size={20} />
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase">Información Avanzada</h3>
          <p className="text-[10px] text-gray-500">SL • FVG • OB • Liquidez • Volumen • Derivados</p>
        </div>
      </div>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('openAdvancedModal'))}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border rounded-lg text-xs font-bold text-gray-400 hover:bg-white/10 hover:text-white"
      >
        <ExternalLink size={14} />
        Ver Detalles
      </button>
    </motion.div>
  );
};

export { PlanOperativoButton, InfoAvanzadaButton };