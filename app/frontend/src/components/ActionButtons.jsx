import React from 'react';
import { Layers, FileBarChart, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const PlanOperativoButton = ({ analysisData, onOpenPlanModal, loading }) => {
  if (loading || !analysisData?.analysis?.trading_plan) return null;
  
  const { trading_plan } = analysisData.analysis;
  const rb = trading_plan.riesgo_beneficio || {};

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass border-2 border-accent/30 p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <Layers className="text-accent" size={18} md:size={20} />
        <div>
          <h3 className="text-sm font-bold text-white uppercase">Plan Operativo (12-24h)</h3>
          <p className="text-[10px] text-gray-500">
            {trading_plan.sesgo_principal} • {trading_plan.contexto_temporal?.apalancamiento_fijo || '20x'} • 
            {rb.esperado || 'Sin R:R'}
          </p>
        </div>
      </div>
      <button
        onClick={() => onOpenPlanModal && onOpenPlanModal(trading_plan)}
        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg text-xs font-bold text-accent hover:bg-accent/20"
      >
        <ExternalLink size={12} md:size={14} />
        <span className="hidden sm:inline">Ver Detalles</span>
        <span className="sm:hidden">Ver</span>
      </button>
    </motion.div>
  );
};

const InfoAvanzadaButton = ({ analysisData, loading }) => {
  // Solo mostrar cuando el análisis esté completo (tiene analysis con datos)
  if (loading || !analysisData?.analysis?.bias) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass border border-border p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <FileBarChart className="text-gray-400" size={18} md:size={20} />
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase">Información Avanzada</h3>
          <p className="text-[10px] text-gray-500">SL • FVG • OB • Liquidez</p>
        </div>
      </div>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('openAdvancedModal'))}
        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-white/5 border border-border rounded-lg text-xs font-bold text-gray-400 hover:bg-white/10 hover:text-white"
      >
        <ExternalLink size={12} md:size={14} />
        <span className="hidden sm:inline">Ver Detalles</span>
        <span className="sm:hidden">Ver</span>
      </button>
    </motion.div>
  );
};

export { PlanOperativoButton, InfoAvanzadaButton };