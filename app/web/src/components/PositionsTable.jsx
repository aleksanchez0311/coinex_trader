import React, { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, TrendingDown, RefreshCw, MoreVertical } from 'lucide-react';
import API_URL from '../config/api';

const PositionsTable = ({ credentials }) => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [closingId, setClosingId] = useState(null);

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: credentials.apiKey,
          secret: credentials.apiSecret
        })
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setPositions(data);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
    } finally {
      setLoading(false);
    }
  };

  const closePosition = async (pos) => {
    if (!window.confirm(`¿Estás seguro de cerrar la posición de ${pos.symbol}?`)) return;
    
    setClosingId(pos.symbol);
    try {
      const response = await fetch(`${API_URL}/close-position`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: credentials.apiKey,
          secret: credentials.apiSecret,
          symbol: pos.symbol,
          side: pos.side,
          amount: pos.contracts
        })
      });
      if (response.ok) {
        alert("Posición cerrada con éxito");
        fetchPositions();
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error al conectar con el servidor");
    } finally {
      setClosingId(null);
    }
  };

  useEffect(() => {
    fetchPositions();
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPositions();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [credentials]);

  return (
    <div className="glass overflow-hidden border-border/40">
      <div className="p-3 md:p-4 border-b border-border/40 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-2">
          <Briefcase size={16} className="text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Posiciones Abiertas</h3>
          <span className="bg-accent/20 text-accent text-[10px] px-2 py-0.5 rounded-full font-bold">
            {positions.length}
          </span>
        </div>
        <button 
          onClick={fetchPositions}
          className="p-1 hover:bg-white/10 rounded-md transition-colors"
          title="Refrescar"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-accent" : "text-gray-400"} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead>
            <tr className="text-gray-500 uppercase text-[10px] border-b border-border/20">
              <th className="px-4 py-3 font-bold">Símbolo</th>
              <th className="px-4 py-3 font-bold">Lado</th>
              <th className="px-4 py-3 font-bold">Tamaño</th>
              <th className="px-4 py-3 font-bold">Precio Entrada</th>
              <th className="px-4 py-3 font-bold">Precio Mark</th>
              <th className="px-4 py-3 font-bold">PnL Unr. (USDT)</th>
              <th className="px-4 py-3 font-bold">PnL %</th>
              <th className="px-4 py-3 font-bold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {positions.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-10 text-center text-gray-500 italic">
                  No hay posiciones abiertas en este momento.
                </td>
              </tr>
            ) : (
              positions.map((pos, idx) => (
            <tr className="hover:bg-white/5 transition-colors group">
                  <td className="px-3 md:px-4 py-3 md:py-4 font-bold flex items-center gap-2">
                    <div className="w-1 h-4 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {pos.symbol}
                    <span className="text-[10px] text-gray-500 border border-border/40 px-1 rounded">
                      {pos.leverage}x
                    </span>
                  </td>
                  <td className="px-3 md:px-4 py-3 md:py-4 uppercase">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      pos.side === 'long' ? 'bg-long/20 text-long' : 'bg-short/20 text-short'
                    }`}>
                      {pos.side}
                    </span>
                  </td>
                  <td className="px-3 md:px-4 py-3 md:py-4 font-mono text-xs md:text-sm">{pos.contracts}</td>
                  <td className="px-3 md:px-4 py-3 md:py-4 font-mono text-gray-400 text-xs md:text-sm">{pos.entryPrice?.toFixed(2)}</td>
                  <td className="px-3 md:px-4 py-3 md:py-4 font-mono text-gray-400 text-xs md:text-sm">{pos.markPrice?.toFixed(2)}</td>
                  <td className={`px-3 md:px-4 py-3 md:py-4 font-mono font-bold text-xs md:text-sm ${
                    pos.unrealizedPnl >= 0 ? 'text-long' : 'text-short'
                  }`}>
                    {pos.unrealizedPnl >= 0 ? '+' : ''}{pos.unrealizedPnl?.toFixed(2)}
                  </td>
                  <td className={`px-3 md:px-4 py-3 md:py-4 font-bold flex items-center gap-1 text-xs md:text-sm ${
                    pos.percentage >= 0 ? 'text-long' : 'text-short'
                  }`}>
                    {pos.percentage >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {pos.percentage?.toFixed(2)}%
                  </td>
                  <td className="px-3 md:px-4 py-3 md:py-4 text-center">
                    <button 
                      onClick={() => closePosition(pos)}
                      disabled={closingId === pos.symbol}
                      className="px-2 md:px-3 py-1 bg-short/10 text-short border border-short/30 rounded hover:bg-short hover:text-white transition-all font-bold text-[10px] disabled:opacity-50 disabled:grayscale"
                    >
                      {closingId === pos.symbol ? <RefreshCw size={12} className="animate-spin" /> : 'CERRAR'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PositionsTable;
