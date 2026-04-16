import React, { useState, useEffect } from 'react';
import { History, TrendingUp, TrendingDown, RefreshCcw, Calendar, DollarSign, Percent } from 'lucide-react';
import API_URL from '../config/api';

const HistoryView = ({ credentials }) => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    if (!credentials.apiKey || !credentials.apiSecret) {
      setError("Se requieren credenciales API para obtener el historial.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/trading-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          api_key: credentials.apiKey,
          secret: credentials.apiSecret
        })
      });
      
      if (!response.ok) {
        throw new Error('Error al sincronizar historial');
      }
      
      const data = await response.json();
      setHistory(data.history || []);
      setStats(data.stats);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [credentials]);

  const StatCard = ({ title, value, icon: Icon, colorClass, subValue }) => (
    <div className="bg-surface border border-border p-4 rounded-xl">
      <div className="flex justify-between items-start mb-2">
        <span className="text-textSecondary text-xs font-medium uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-lg ${colorClass.replace('text-', 'bg-')}/10`}>
          <Icon size={16} className={colorClass} />
        </div>
      </div>
      <div className="flex flex-col">
        <span className={`text-xl font-bold text-textPrimary`}>{value}</span>
        {subValue && <span className="text-xs text-neutral mt-0.5">{subValue}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-long/10 rounded-lg">
                <History size={24} className="text-long" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-textPrimary">Historial de Trading</h2>
                <p className="text-xs text-neutral">Análisis de rendimiento y trades cerrados</p>
            </div>
        </div>
        <button 
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 bg-surface hover:bg-surface-elevated border border-border text-textPrimary px-4 py-2 rounded-lg text-sm transition-all"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-short/10 border border-short/20 rounded-lg text-short text-sm">
          {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="PnL Total" 
            value={`${stats.total_pnl} USDT`}
            icon={DollarSign}
            colorClass={stats.total_pnl >= 0 ? 'text-long' : 'text-short'}
            subValue={`Promedio: ${stats.avg_pnl} / trade`}
          />
          <StatCard 
            title="Win Rate" 
            value={`${stats.win_rate}%`}
            icon={Percent}
            colorClass="text-long"
            subValue={`${stats.wins} victorias de ${stats.total_trades}`}
          />
          <StatCard 
            title="Trades" 
            value={stats.total_trades}
            icon={History}
            colorClass="text-neutral"
          />
          <StatCard 
            title="Performance" 
            value={`${stats.wins}W - ${stats.losses}L`}
            icon={stats.total_pnl >= 0 ? TrendingUp : TrendingDown}
            colorClass={stats.total_pnl >= 0 ? 'text-long' : 'text-short'}
          />
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl  overflow-hidden">
        <div className="p-4 border-b border-border bg-surface-elevated/50 flex justify-between items-center">
          <h3 className="font-semibold text-textPrimary flex items-center gap-2">
            <Calendar size={18} className="text-long" />
            Trades Recientes
          </h3>
          <span className="text-xs text-neutral">Mostrando últimos {history.length} trades</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-textSecondary bg-surface-elevated/30">
              <tr>
                <th className="px-6 py-3 font-medium">Símbolo</th>
                <th className="px-6 py-3 font-medium">Fecha</th>
                <th className="px-6 py-3 font-medium">Resultado (PnL)</th>
                <th className="px-6 py-3 font-medium">Fuente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history.length > 0 ? (
                history.map((trade, idx) => {
                  const isWin = float(trade.pnl) > 0;
                  return (
                    <tr key={idx} className="hover:bg-surface-elevated/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-textPrimary">{trade.symbol}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral">
                        {trade.time ? new Date(trade.time).toLocaleString('es-CU') : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 font-mono font-bold ${isWin ? 'text-long' : 'text-short'}`}>
                          {isWin ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {trade.pnl > 0 ? '+' : ''}{trade.pnl} USDT
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] uppercase tracking-tighter bg-neutral/10 text-neutral px-2 py-0.5 rounded border border-neutral/20">
                          {trade.source || 'Historical'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-neutral text-sm">
                    {loading ? 'Cargando datos...' : 'No se encontraron trades en el historial.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper para evitar errores con strings
const float = (val) => {
    try {
        return parseFloat(val) || 0;
    } catch(e) {
        return 0;
    }
};

export default HistoryView;
