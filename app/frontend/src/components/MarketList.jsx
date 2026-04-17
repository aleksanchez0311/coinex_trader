import React, { useState, useEffect } from 'react';
import { Search, Star, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import API_URL from '../config/api';

const MarketList = ({ selected, setSelected, onSymbolSelect }) => {
  const [favorites, setFavorites] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(false);
  
  const loadFavs = () => {
    const saved = localStorage.getItem('trader_favorites');
    if (saved) setFavorites(JSON.parse(saved));
  };

  const fetchTickers = async () => {
    if (favorites.length === 0) return;
    try {
      const response = await fetch(`${API_URL}/tickers?symbols=${favorites.join(',')}`);
      const data = await response.json();
      setMarketData(prev => ({ ...prev, ...data }));
    } catch (e) {
      console.error("Error fetching list tickers:", e);
    }
  };

  useEffect(() => {
    loadFavs();
    window.addEventListener('favorites_updated', loadFavs);
    return () => window.removeEventListener('favorites_updated', loadFavs);
  }, []);

  useEffect(() => {
    if (favorites.length > 0) {
      fetchTickers();
      const interval = setInterval(fetchTickers, 10000); // Polling cada 10s para la lista secundaria
      return () => clearInterval(interval);
    }
  }, [favorites]);

  return (
    <div className="glass p-6 md:p-8 rounded-[2.5rem] border-white/5 flex flex-col h-full bg-gradient-to-br from-white/5 to-transparent min-h-[500px]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-2xl ring-1 ring-accent/20">
              <Star size={18} className="text-accent" fill="currentColor" />
            </div>
            <div>
              <h3 className="font-black text-[10px] text-white uppercase tracking-[0.3em]">Watchlist</h3>
              <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Live Stream</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-accent bg-accent/5 px-2 py-1 rounded-lg border border-accent/10">{favorites.length} Pares</span>
        </div>

        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          {favorites.map((symbol) => {
            const data = marketData[symbol] || {};
            const isUp = data.percentage >= 0;
            
            return (
              <button
                key={symbol}
                onClick={() => onSymbolSelect(symbol)}
                className={`w-full group relative flex items-center justify-between p-5 rounded-[2rem] transition-all duration-300 border ${
                  selected === symbol 
                  ? 'bg-white/10 border-white/20 shadow-2xl shadow-black/40 scale-[1.02]' 
                  : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/5'
                }`}
              >
                <div className="flex flex-col items-start min-w-0">
                  <span className={`text-sm font-black tracking-tighter transition-colors ${selected === symbol ? 'text-accent' : 'text-white'}`}>
                    {symbol}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                     <span className={`text-[10px] font-black uppercase tracking-widest ${isUp ? 'text-long' : 'text-short'}`}>
                        {isUp ? '+' : ''}{data.percentage?.toFixed(2) || '0.00'}%
                     </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-white block tracking-tighter">
                    ${data.last?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) || '0.00'}
                  </span>
                  <div className="flex items-center justify-end gap-1 mt-1 opacity-40">
                    <Activity size={10} className={isUp ? 'text-long' : 'text-short'} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Verified</span>
                  </div>
                </div>

                {selected === symbol && (
                  <div className="absolute left-0 w-1.5 h-10 bg-accent rounded-full -translate-x-1.5" />
                )}
              </button>
            );
          })}

          {favorites.length === 0 && (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 opacity-20">
                <Search size={32} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 leading-relaxed">
                Tu lista está vacía.<br/>Configura favoritos en ajustes.
              </p>
            </div>
          )}
        </div>
    </div>
  );
};

export default MarketList;
