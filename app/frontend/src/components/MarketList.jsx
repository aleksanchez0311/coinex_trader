import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, RefreshCw, Zap } from 'lucide-react';
import API_URL from '../config/api';

const MarketList = ({ selected, setSelected, onSymbolSelect }) => {
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('trader_favorites');
    const defaultSymbols = saved ? JSON.parse(saved) : [];
    return defaultSymbols.map(sym => ({ symbol: sym, price: null, change: null, up: true }));
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const updateFavoritesFromStorage = () => {
      const saved = localStorage.getItem('trader_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFavorites(current => {
          return parsed.map(sym => {
            const existing = current.find(f => f.symbol === sym);
            return existing || { symbol: sym, price: null, change: null, up: true };
          });
        });
        setTimeout(() => window.dispatchEvent(new Event('reload_prices_now')), 100);
      }
    };

    window.addEventListener('favorites_updated', updateFavoritesFromStorage);
    return () => window.removeEventListener('favorites_updated', updateFavoritesFromStorage);
  }, []);

  const loadPrices = async () => {
    const symbols = favorites.map(f => f.symbol);
    if(symbols.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tickers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(prev => prev.map(fav => {
          const ticker = data[fav.symbol];
          if (ticker) {
            return {
              ...fav,
              price: ticker.last,
              change: ticker.percentage,
              up: ticker.up
            };
          }
          return fav;
        }));
      }
    } catch (error) {
      console.error("Error fetching tickers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
    const handleVisibilityChange = () => { if (!document.hidden) loadPrices(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('reload_prices_now', loadPrices);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('reload_prices_now', loadPrices);
    };
  }, [favorites.length]);

  const handleSelect = (symbol) => {
    setSelected(symbol);
    if (onSymbolSelect) onSymbolSelect(symbol);
  };

  const formatPrice = (price) => {
    if (!price) return '---';
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  return (
    <div className="glass p-5 space-y-5 rounded-[2rem]">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-black flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-gray-500">
          <Zap size={14} className="text-accent" fill="currentColor" /> Watchlist
        </h3>
        <button 
          onClick={loadPrices}
          disabled={loading}
          className="p-2 hover:bg-white/5 rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-accent" : "text-gray-500"} />
        </button>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
        {favorites.map((pair) => (
          <div
            key={pair.symbol}
            onClick={() => handleSelect(pair.symbol)}
            className={`p-4 rounded-2xl cursor-pointer transition-all border ${
              selected === pair.symbol 
                ? 'bg-accent/10 border-accent/20 ring-1 ring-accent/10' 
                : 'bg-white/5 border-transparent hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-black uppercase tracking-widest ${selected === pair.symbol ? 'text-white' : 'text-gray-400'}`}>
                {pair.symbol}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${pair.up ? 'bg-long/10 text-long' : 'bg-short/10 text-short'}`}>
                {pair.change >= 0 ? '+' : ''}{pair.change?.toFixed(1) || '0.0'}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-mono font-bold text-white tabular-nums">${formatPrice(pair.price)}</span>
              {pair.up ? <TrendingUp size={16} className="text-long" /> : <TrendingDown size={16} className="text-short" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketList;
