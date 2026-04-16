import React, { useState, useEffect } from 'react';
import { Briefcase, Clock, TrendingUp, TrendingDown, RefreshCw, X, AlertCircle, Zap } from 'lucide-react';
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
      if (Array.isArray(data)) setPositions(data);
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
      if (Array.isArray(data)) setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const closePosition = async (pos) => {
    if (!window.confirm(`¿Cerrar posición de ${pos.symbol}?`)) return;
    setClosingId(pos.symbol);
    try {
      await fetch(`${API_URL}/close-position`, {
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
      fetchPositions();
    } finally {
      setClosingId(null);
    }
  };

  const cancelOrder = async (order) => {
    setCancelingId(order.id);
    try {
      await fetch(`${API_URL}/cancel-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: credentials.apiKey,
          secret: credentials.apiSecret,
          order_id: order.id,
          symbol: order.symbol
        })
      });
      fetchOrders();
    } finally {
      setCancelingId(null);
    }
  };

  useEffect(() => {
    fetchPositions();
    fetchOrders();
  }, [credentials]);

  const PositionCard = ({ pos }) => (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="text-white font-black text-sm uppercase">{pos.symbol}</span>
            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${pos.side === 'long' ? 'bg-long/10 text-long' : 'bg-short/10 text-short'}`}>
                {pos.side} {pos.leverage}x
            </span>
        </div>
        <button 
          onClick={() => closePosition(pos)}
          className="text-short hover:text-white transition-colors p-1"
        >
          {closingId === pos.symbol ? <RefreshCw size={16} className="animate-spin" /> : <X size={20} />}
        </button>
      </div>

      <div className="flex justify-between items-end">
        <div className="space-y-1">
            <span className="text-[8px] text-gray-500 uppercase font-bold block tracking-widest">Beneficio / Pérdida</span>
            <div className={`text-2xl font-black font-mono flex items-center gap-1 ${pos.percentage >= 0 ? 'text-long' : 'text-short'}`}>
                {pos.percentage >= 0 ? '+' : ''}{pos.percentage?.toFixed(2)}%
            </div>
            <span className="text-[10px] text-gray-500 font-mono">
                {pos.unrealizedPnl >= 0 ? '+' : ''}{parseFloat(pos.unrealizedPnl).toFixed(2)} USDT
            </span>
        </div>
        <div className="text-right">
            <span className="text-[8px] text-gray-500 uppercase font-bold block mb-1">Entrada</span>
            <span className="text-xs font-mono text-gray-400">${parseFloat(pos.entryPrice).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tabs Minimalistas */}
      <div className="flex items-center justify-between">
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab('positions')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'positions' ? 'bg-accent text-white shadow-lg' : 'text-gray-500'}`}
            >
              En Vivo ({positions.length})
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-accent text-white shadow-lg' : 'text-gray-500'}`}
            >
              Pendientes ({orders.length})
            </button>
        </div>
        <button onClick={() => { fetchPositions(); fetchOrders(); }} className="p-2 text-gray-500 hover:text-white transition-colors">
            <RefreshCw size={16} className={(loadingPositions || loadingOrders) ? "animate-spin" : ""} />
        </button>
      </div>

      {activeTab === 'positions' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {positions.length > 0 ? (
            positions.map((pos, idx) => <PositionCard key={idx} pos={pos} />)
          ) : (
            <div className="col-span-full py-12 text-center glass rounded-2xl border-dashed border-white/10">
                <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">Sin posiciones activas</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
            {orders.map((order, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{order.symbol}</span>
                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${order.side === 'buy' ? 'bg-long/10 text-long' : 'bg-short/10 text-short'}`}>{order.side}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono mt-1">${parseFloat(order.price || 0).toLocaleString()} • {parseFloat(order.amount).toFixed(2)} unit.</p>
                    </div>
                    <button 
                        onClick={() => cancelOrder(order)}
                        className="p-2 bg-short/10 text-short rounded-lg hover:bg-short hover:text-white transition-all"
                    >
                        {cancelingId === order.id ? <RefreshCw size={14} className="animate-spin" /> : <X size={16} />}
                    </button>
                </div>
            ))}
            {orders.length === 0 && (
                <div className="py-12 text-center glass rounded-2xl border-dashed border-white/10">
                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">Sin órdenes en cola</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default PositionsTable;
