import React, { useState, useEffect } from 'react';
import { Briefcase, Clock, TrendingUp, TrendingDown, RefreshCw, X, AlertCircle } from 'lucide-react';
import API_URL from '../config/api';

const PositionsTable = ({ credentials }) => {
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [activeTab, setActiveTab] = useState('positions');

  const fetchPositions = async () => {
    setLoadingPositions(true);
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
      setLoadingPositions(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await fetch(`${API_URL}/open-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: credentials.apiKey,
          secret: credentials.apiSecret
        })
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
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

  const cancelOrder = async (order) => {
    if (!window.confirm(`¿Estás seguro de cancelar la orden ${order.id}?`)) return;
    
    setCancelingId(order.id);
    try {
      const response = await fetch(`${API_URL}/cancel-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: credentials.apiKey,
          secret: credentials.apiSecret,
          order_id: order.id,
          symbol: order.symbol
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        alert("Orden cancelada con éxito");
        fetchOrders(); // Refrescar la lista de órdenes
      } else {
        alert(`Error: ${result.error || result.detail || 'Error desconocido'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error al conectar con el servidor");
    } finally {
      setCancelingId(null);
    }
  };

  const refreshAll = () => {
    fetchPositions();
    fetchOrders();
  };

  useEffect(() => {
    refreshAll();
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshAll();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [credentials]);

  const formatPrice = (price) => {
    return price ? parseFloat(price).toFixed(4) : '---';
  };

  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toFixed(4);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '---';
    return new Date(timestamp).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="glass overflow-hidden border-border/40">
      {/* Header con tabs */}
      <div className="bg-white/5 border-b border-border/40">
        <div className="flex justify-between items-center p-3 md:p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Trading</h3>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-black/20 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('positions')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'positions'
                    ? 'bg-accent text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Posiciones ({positions.length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'orders'
                    ? 'bg-accent text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Órdenes ({orders.length})
              </button>
            </div>
          </div>
          
          <button 
            onClick={refreshAll}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
            title="Refrescar todo"
          >
            <RefreshCw size={14} className={(loadingPositions || loadingOrders) ? "animate-spin text-accent" : "text-gray-400"} />
          </button>
        </div>
      </div>

      {/* Contenido dinámico según tab */}
      <div className="overflow-x-auto">
        {activeTab === 'positions' ? (
          // Tabla de Posiciones Abiertas
          <div>
            {positions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Briefcase size={48} className="mb-3 opacity-30" />
                <p className="text-sm italic">No hay posiciones abiertas</p>
                <p className="text-xs mt-1 opacity-60">Las posiciones aparecerán aquí cuando se abran</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="text-gray-500 uppercase text-[10px] border-b border-border/20">
                    <th className="px-4 py-3 font-bold">Símbolo</th>
                    <th className="px-4 py-3 font-bold">Lado</th>
                    <th className="px-4 py-3 font-bold">Tamaño</th>
                    <th className="px-4 py-3 font-bold">Precio Entrada</th>
                    <th className="px-4 py-3 font-bold">Precio Mark</th>
                    <th className="px-4 py-3 font-bold">PnL Unr.</th>
                    <th className="px-4 py-3 font-bold">PnL %</th>
                    <th className="px-4 py-3 font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {positions.map((pos, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-4 font-bold">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span>{pos.symbol}</span>
                          <span className="text-[10px] text-gray-500 border border-border/40 px-1.5 py-0.5 rounded">
                            {pos.leverage}x
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 uppercase">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          pos.side === 'long' ? 'bg-long/20 text-long' : 'bg-short/20 text-short'
                        }`}>
                          {pos.side}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-sm">{formatAmount(pos.contracts)}</td>
                      <td className="px-4 py-4 font-mono text-gray-400 text-sm">{formatPrice(pos.entryPrice)}</td>
                      <td className="px-4 py-4 font-mono text-gray-400 text-sm">{formatPrice(pos.markPrice)}</td>
                      <td className={`px-4 py-4 font-mono font-bold text-sm ${
                        pos.unrealizedPnl >= 0 ? 'text-long' : 'text-short'
                      }`}>
                        {pos.unrealizedPnl >= 0 ? '+' : ''}{formatAmount(pos.unrealizedPnl)}
                      </td>
                      <td className={`px-4 py-4 font-bold flex items-center gap-1 text-sm ${
                        pos.percentage >= 0 ? 'text-long' : 'text-short'
                      }`}>
                        {pos.percentage >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {pos.percentage?.toFixed(2)}%
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => closePosition(pos)}
                          disabled={closingId === pos.symbol}
                          className="px-3 py-1.5 bg-short/10 text-short border border-short/30 rounded-md hover:bg-short hover:text-white transition-all font-bold text-[10px] disabled:opacity-50 disabled:grayscale"
                        >
                          {closingId === pos.symbol ? <RefreshCw size={12} className="animate-spin" /> : 'CERRAR'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          // Tabla de Órdenes Pendientes
          <div>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Clock size={48} className="mb-3 opacity-30" />
                <p className="text-sm italic">No hay órdenes pendientes</p>
                <p className="text-xs mt-1 opacity-60">Las órdenes limit y stop aparecerán aquí</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead>
                  <tr className="text-gray-500 uppercase text-[10px] border-b border-border/20">
                    <th className="px-4 py-3 font-bold">ID Orden</th>
                    <th className="px-4 py-3 font-bold">Símbolo</th>
                    <th className="px-4 py-3 font-bold">Lado</th>
                    <th className="px-4 py-3 font-bold">Tipo</th>
                    <th className="px-4 py-3 font-bold">Cantidad</th>
                    <th className="px-4 py-3 font-bold">Precio</th>
                    <th className="px-4 py-3 font-bold">Ejecutado</th>
                    <th className="px-4 py-3 font-bold">Restante</th>
                    <th className="px-4 py-3 font-bold">Hora</th>
                    <th className="px-4 py-3 font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {orders.map((order, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-4 font-mono text-[10px] text-gray-400">
                        {order.id?.slice(0, 12)}...
                      </td>
                      <td className="px-4 py-4 font-bold">{order.symbol}</td>
                      <td className="px-4 py-4 uppercase">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          order.side === 'buy' ? 'bg-long/20 text-long' : 'bg-short/20 text-short'
                        }`}>
                          {order.side}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-medium ${
                          order.type === 'market' ? 'bg-gray-600/20 text-gray-400' : 'bg-blue-600/20 text-blue-400'
                        }`}>
                          {order.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-sm">{formatAmount(order.amount)}</td>
                      <td className="px-4 py-4 font-mono text-sm">
                        {order.price ? formatPrice(order.price) : 'MARKET'}
                      </td>
                      <td className="px-4 py-4 font-mono text-sm text-gray-400">
                        {formatAmount(order.filled)}
                      </td>
                      <td className="px-4 py-4 font-mono text-sm text-gray-400">
                        {formatAmount(order.remaining)}
                      </td>
                      <td className="px-4 py-4 font-mono text-[10px] text-gray-400">
                        {formatTime(order.timestamp)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => cancelOrder(order)}
                          disabled={cancelingId === order.id}
                          className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-md hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 disabled:grayscale"
                          title="Cancelar orden"
                        >
                          {cancelingId === order.id ? <RefreshCw size={12} className="animate-spin" /> : <X size={12} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PositionsTable;
