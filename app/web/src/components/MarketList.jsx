import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Search, X, Calculator, Play } from 'lucide-react';

const MarketList = ({ selected, setSelected, onSymbolSelect, analysis, result, slPrice, tpPrice, leverage, setLeverage, capital, setCapital, riskPct, setRiskPct, calculateRisk, onOpenTrade, canOpenTrade, bias }) => {
  const [showModal, setShowModal] = useState(false);
  const [allMarkets, setAllMarkets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState([
    { symbol: 'BTC/USDT', price: null, change: null, up: true },
    { symbol: 'ETH/USDT', price: null, change: null, up: true },
    { symbol: 'SOL/USDT', price: null, change: null, up: true },
    { symbol: 'BNB/USDT', price: null, change: null, up: true },
    { symbol: 'XRP/USDT', price: null, change: null, up: true },
  ]);

  const fetchTicker = async (symbol) => {
    try {
      const response = await fetch(`http://localhost:8000/ticker/${encodeURIComponent(symbol)}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error(`Error fetching ticker for ${symbol}:`, error);
    }
    return null;
  };

  const fetchAllTickers = async () => {
    const symbols = favorites.map(f => f.symbol);
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
    }
  };

  useEffect(() => {
    fetchAllTickers();
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAllTickers();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchAllMarkets = async () => {
    try {
      const response = await fetch('http://localhost:8000/markets');
      const data = await response.json();
      if (Array.isArray(data)) {
        setAllMarkets(data);
      }
    } catch (error) {
      console.error("Error fetching markets:", error);
    }
  };

  useEffect(() => {
    if (showModal && allMarkets.length === 0) {
      fetchAllMarkets();
    }
  }, [showModal]);

  const filteredMarkets = allMarkets.filter(m => 
    m.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (symbol) => {
    setSelected(symbol);
    setShowModal(false);
    if (!favorites.find(f => f.symbol === symbol)) {
      setFavorites([{ symbol, price: null, change: null, up: true }, ...favorites]);
    }
    if (onSymbolSelect) {
      onSymbolSelect(symbol);
    }
    fetchAllTickers();
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
    <div className="glass p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Clock size={16} className="text-accent" /> Favoritos
        </h3>
        <span className="text-[10px] text-gray-500 font-bold uppercase">Cambio 24h</span>
      </div>

      <div className="space-y-3">
        {favorites.map((pair) => (
          <div
            key={pair.symbol}
            onClick={() => handleSelect(pair.symbol)}
            className={`p-3 rounded-lg cursor-pointer transition-all border ${
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
              <span className="text-lg font-mono">${formatPrice(pair.price)}</span>
              {pair.up ? <TrendingUp size={14} className="text-long" /> : <TrendingDown size={14} className="text-short" />}
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => setShowModal(true)}
        className="w-full py-2 text-xs text-gray-400 hover:text-white transition-colors border-t border-border/40 mt-2 flex items-center justify-center gap-2"
      >
        <Search size={12} /> Explorar más mercados
      </button>

      {/* Formulario de Riesgo */}
      <div className="border-t border-border/40 pt-3 mt-3 space-y-2">
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-2">
          <Calculator size={12} />
          <span className="font-bold uppercase">Riesgo</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[9px] text-gray-500 uppercase">Capital</label>
            <input 
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full bg-surface border border-border p-1.5 rounded text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[9px] text-gray-500 uppercase">Riesgo %</label>
            <input 
              type="number"
              value={riskPct}
              onChange={(e) => setRiskPct(Number(e.target.value))}
              className="w-full bg-surface border border-border p-1.5 rounded text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[9px] text-gray-500 uppercase">Apal.</label>
            <input 
              type="number"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="w-full bg-surface border border-border p-1.5 rounded text-xs font-mono"
            />
          </div>
        </div>

        <button 
          onClick={() => {
            console.log("Botón presionado, analysis:", analysis?.analysis);
            calculateRisk();
          }}
          disabled={!analysis?.analysis}
          className="w-full py-2 bg-white/5 border border-border rounded-lg text-xs font-medium hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {!analysis?.analysis ? 'Cargando análisis...' : 'Calcular Posición'}
        </button>

        {result && (
          <div className="space-y-2 pt-2 border-t border-border/30">
            <div className="text-[10px] text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Entrada:</span>
                <span className="font-mono text-green-400">${result.plan?.entry?.toFixed(2) || analysis?.analysis?.last_price?.toFixed(2) || '---'}</span>
              </div>
              <div className="flex justify-between">
                <span>Posición:</span>
                <span className="font-mono text-white">{result.position?.position_size?.toFixed(4)} {selected?.split('/')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span>SL:</span>
                <span className="font-mono text-short">${slPrice?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>TP:</span>
                <span className="font-mono text-long">${tpPrice || result.plan?.tp1?.toFixed(2) || '---'}</span>
              </div>
              <div className="flex justify-between">
                <span>Apalanc.:</span>
                <span className="font-mono text-accent">{leverage}x</span>
              </div>
              <div className="flex justify-between">
                <span>Margen:</span>
                <span className="font-mono">${result.position?.margin_required}</span>
              </div>
            </div>
            
            <button
              onClick={onOpenTrade}
              className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                bias === 'Alcista' 
                  ? 'bg-long text-black hover:opacity-90' 
                  : bias === 'Bajista' 
                    ? 'bg-short text-white hover:opacity-90'
                    : 'bg-gray-600 text-gray-300'
              }`}
            >
              <Play fill="currentColor" size={14} />
              ABRIR {bias === 'Alcista' ? 'LONG' : bias === 'Bajista' ? 'SHORT' : 'TRADE'} REAL
            </button>
          </div>
        )}
      </div>

      {/* Explorador de Mercados (Modal) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl border-accent/20">
            <div className="p-4 border-b border-border/40 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2">
                <Search size={18} className="text-accent" /> Explorador de Activos
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Buscar símbolo (ej: SHIB, DOT, LINK)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface border border-border p-3 pl-10 rounded-xl outline-none focus:border-accent transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-premium">
              {allMarkets.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-gray-500">Cargando mercados desde CoinEx...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {filteredMarkets.length > 0 ? (
                    filteredMarkets.map((m) => (
                      <button
                        key={m.symbol}
                        onClick={() => handleSelect(m.symbol)}
                        className="flex items-center justify-between p-3 hover:bg-accent/10 rounded-lg transition-colors group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center font-bold text-[10px] text-accent">
                            {m.base.substring(0, 3)}
                          </div>
                          <div>
                            <p className="font-bold text-sm group-hover:text-accent transition-colors">{m.symbol}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{m.base} / {m.quote}</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-white/5 px-2 py-1 rounded border border-border/40 text-gray-400 group-hover:border-accent/40 group-hover:text-accent font-bold">
                          TRADE SWAP
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-10 text-center text-gray-500 italic">
                      No se encontraron mercados para "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border/40 bg-white/5 text-[10px] text-gray-500 text-center italic">
              Mostrando mercados perpetuos disponibles para ejecución institucional
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketList;
