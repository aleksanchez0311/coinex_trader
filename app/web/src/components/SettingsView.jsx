import React, { useState, useEffect } from 'react';
import { Settings, Search, Plus, Trash2, TrendingUp } from 'lucide-react';

const SettingsView = ({ credentials, setCredentials, saveCredentials }) => {
  const [allMarkets, setAllMarkets] = useState([]);
  const [topGainers, setTopGainers] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('trader_favorites');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 
      'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'LINK/USDT', 'DOT/USDT'
    ];
  });

  const fetchMarkets = async () => {
    try {
      const response = await fetch('http://localhost:8000/top-gainers?limit=100&sort_by=volume&verified_only=true');
      const data = await response.json();
      if (Array.isArray(data)) setAllMarkets(data);
    } catch (error) {
      console.error("Error fetching markets:", error);
    }
  };

  const fetchTopGainers = async () => {
    try {
      const response = await fetch('http://localhost:8000/top-gainers?limit=30&verified_only=true');
      const data = await response.json();
      if (Array.isArray(data)) setTopGainers(data);
    } catch (error) {
      console.error("Error fetching gainers:", error);
    }
  };

  useEffect(() => {
    fetchMarkets();
    fetchTopGainers();
  }, []);

  const saveFavoritesList = (newList) => {
    setFavorites(newList);
    localStorage.setItem('trader_favorites', JSON.stringify(newList));
    // Disparar evento para que MarketList se entere instantaneamente
    window.dispatchEvent(new Event('favorites_updated'));
  };

  const addFavorite = (symbol) => {
    if (!favorites.includes(symbol)) {
      saveFavoritesList([symbol, ...favorites]);
    }
  };

  const removeFavorite = (symbol) => {
    saveFavoritesList(favorites.filter(s => s !== symbol));
  };

  const displayedMarkets = activeTab === 'all' 
    ? allMarkets.filter(m => m.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    : topGainers.filter(m => m.symbol.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Configuración API */}
      <div className="glass p-4 md:p-8">
        <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
          <Settings className="text-accent" /> Configuración de API CoinEx
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">API Key</label>
            <input 
              type="password" 
              value={credentials.apiKey}
              onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
              placeholder="Tu API Key" 
              className="w-full bg-surface border border-border p-2 md:p-3 rounded-lg outline-none focus:border-accent text-sm" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">API Secret</label>
            <input 
              type="password" 
              value={credentials.apiSecret}
              onChange={(e) => setCredentials({...credentials, apiSecret: e.target.value})}
              placeholder="Tu API Secret" 
              className="w-full bg-surface border border-border p-2 md:p-3 rounded-lg outline-none focus:border-accent text-sm" 
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button 
            onClick={() => {
              const saved = localStorage.getItem('trader_creds');
              if (saved) setCredentials(JSON.parse(saved));
            }}
            className="bg-surface border border-accent text-accent font-bold px-4 md:px-6 py-2 md:py-2.5 rounded-lg hover:bg-accent/10 transition-colors text-sm"
          >
            Restaurar Local
          </button>
          <button 
            onClick={() => saveCredentials(credentials)}
            className="bg-accent text-black font-bold px-4 md:px-6 py-2 md:py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            Guardar
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('trader_creds');
              setCredentials({ apiKey: '', apiSecret: '' });
            }}
            className="bg-transparent border border-short text-short font-bold px-4 md:px-6 py-2 md:py-2.5 rounded-lg hover:bg-short/10 transition-colors ml-auto text-sm"
          >
            Borrar
          </button>
        </div>
      </div>

      {/* Editor de Favoritos */}
      <div className="glass p-4 md:p-8">
        <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
          <Search className="text-accent" /> Gestor de Pares Favoritos
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          
          {/* Explorador de Mercados */}
          <div className="flex flex-col border border-border/40 rounded-xl bg-surface/30 h-[400px] md:h-[500px]">
             <div className="p-3 md:p-4 border-b border-border/20">
              <div className="flex gap-2 mb-2 md:mb-3">
                <button 
                  onClick={() => setActiveTab('all')} 
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-accent text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setActiveTab('gainers')} 
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-1 ${activeTab === 'gainers' ? 'bg-long text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  <TrendingUp size={14} /> Ganadores
                </button>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Buscar símbolo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface border border-border p-2 md:p-2.5 pl-10 rounded-lg outline-none focus:border-accent transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-premium">
              {(activeTab === 'all' && allMarkets.length === 0) || (activeTab === 'gainers' && topGainers.length === 0) ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-gray-500">Cargando...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {displayedMarkets.length > 0 ? (
                    displayedMarkets.map((m) => {
                      const isFav = favorites.includes(m.symbol);
                      return (
                        <div key={m.symbol} className="flex items-center justify-between p-2 hover:bg-accent/5 rounded-lg transition-colors group">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className={`w-8 h-8 rounded bg-surface border flex items-center justify-center font-bold text-[10px] ${activeTab === 'gainers' ? 'border-long/30 text-long' : 'border-border text-accent'}`}>
                              {m.base.substring(0, 3)}
                            </div>
                            <div>
                              <p className="font-bold text-sm">
                                {m.symbol} {activeTab === 'gainers' && <span className="ml-2 text-long text-xs">{m.percentage > 0 ? '+' : ''}{m.percentage.toFixed(2)}%</span>}
                              </p>
                              <p className="text-[10px] text-gray-500 uppercase">{m.base} / {m.quote}</p>
                            </div>
                          </div>
                          {!isFav ? (
                            <button 
                              onClick={() => addFavorite(m.symbol)}
                              className="p-1.5 rounded-md bg-accent/10 text-accent hover:bg-accent hover:text-black transition-colors"
                              title="Agregar"
                            >
                              <Plus size={16} />
                            </button>
                          ) : (
                            <span className="text-[10px] bg-white/5 py-1 px-2 rounded text-gray-500">
                              ✓
                            </span>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-10 text-center text-gray-500 italic text-sm">
                      Sin resultados
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lista de Seleccionados */}
          <div className="flex flex-col border border-border/40 rounded-xl bg-surface/30 h-[400px] md:h-[500px]">
            <div className="p-3 md:p-4 border-b border-border/20 bg-white/5">
              <h3 className="font-bold text-sm flex items-center justify-between">
                Tus Favoritos
                <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full">{favorites.length}</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1 hidden md:block">Estos pares aparecerán en tu Dashboard.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 scrollbar-premium">
              {favorites.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-sm italic">
                  Sin favoritos.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {favorites.map(symbol => (
                    <div key={symbol} className="flex items-center justify-between p-2 md:p-3 bg-surface border border-border rounded-lg group">
                      <span className="font-bold text-sm">{symbol}</span>
                      <button 
                        onClick={() => removeFavorite(symbol)}
                        className="text-gray-500 hover:text-short p-1 rounded-md hover:bg-short/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsView;
