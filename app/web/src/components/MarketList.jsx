import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Search, X, Calculator, Play, RefreshCw } from 'lucide-react';

const MarketList = ({ selected, setSelected, onSymbolSelect }) => {
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('trader_favorites');
    const defaultSymbols = saved ? JSON.parse(saved) : [];
    return defaultSymbols.map(sym => ({ symbol: sym, price: null, change: null, up: true }));
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    // Event listener para actualizar desde LocalStorage (lanzado por SettingsView)
    const updateFavoritesFromStorage = () => {
      const saved = localStorage.getItem('trader_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFavorites(current => {
          // Mantener los precios existentes si coinciden los símbolos
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
      const response = await fetch('http://localhost:8000/tickers', {
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
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPrices();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('reload_prices_now', loadPrices);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('reload_prices_now', loadPrices);
    };
  }, [favorites.length]); // Depend dependency on length so it re-triggers safely

  const handleSelect = (symbol) => {
    setSelected(symbol);
    if (onSymbolSelect) {
      onSymbolSelect(symbol);
    }
    loadPrices();
  };

  const formatPrice = (price) => {
    if (!price) return '---';
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    return price.toFixed(4);
  };

  const formatChange = (change) => {
    if (change === null) return '0.0%';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <div className="glass p-3 md:p-5 space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 text-sm md:text-base">
          <Clock size={16} className="text-accent" /> Favoritos
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-bold uppercase hidden sm:inline">Cambio 24h</span>
          <button 
            onClick={loadPrices}
            disabled={loading}
            className="p-1 hover:bg-white/10 rounded-md transition-colors disabled:opacity-50"
            title="Refrescar precios"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-accent" : "text-gray-400"} />
          </button>
        </div>
      </div>

      <div className="space-y-2 md:space-y-3 overflow-y-auto max-h-[280px] md:max-h-[350px] pr-2">
        {favorites.map((pair) => (
          <div
            key={pair.symbol}
            onClick={() => handleSelect(pair.symbol)}
            className={`p-2.5 md:p-3 rounded-lg cursor-pointer transition-all border ${
              selected === pair.symbol 
                ? 'bg-accent/5 border-accent/20' 
                : 'border-transparent hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">{pair.symbol}</span>
              <span className={`text-xs font-bold ${pair.up ? 'text-long' : 'text-short'}`}>
                {formatChange(pair.change)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base md:text-lg font-mono">${formatPrice(pair.price)}</span>
              {pair.up ? <TrendingUp size={14} className="text-long" /> : <TrendingDown size={14} className="text-short" />}
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
};

export default MarketList;
