import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Settings, Search, Plus, Trash2, TrendingUp, ScanLine, X, Lock, ShieldCheck, Globe, BarChart3, DollarSign, Wallet, RefreshCw } from 'lucide-react';
import API_URL from '../config/api';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsView = ({ credentials, setCredentials, saveCredentials }) => {
  const [marketData, setMarketData] = useState({ volume: [], price: [], gainers: [], count: 0 });
  const [activeTab, setActiveTab] = useState('volume');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const html5QrCodeRef = useRef(null);
  
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('trader_favorites');
    return saved ? JSON.parse(saved) : ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
  });

  const fetchDiscovery = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/discover-markets`);
      const data = await response.json();
      if (data && !data.detail && data.volume) {
        setMarketData(data);
      } else {
        // Fallback: tratar de cargar markets simples si el descubrimiento cruzado falla
        const fallbackResp = await fetch(`${API_URL}/top-gainers?limit=50&verified_only=true`);
        const fallbackData = await fallbackResp.json();
        if (Array.isArray(fallbackData)) {
          setMarketData({ volume: fallbackData, price: fallbackData, gainers: fallbackData, count: fallbackData.length });
        }
      }
    } catch (error) { 
      console.error("Error en discovery:", error);
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDiscovery();
    const interval = setInterval(fetchTopGainersOnly, 30000); // Actualización silenciosa cada 30s
    return () => clearInterval(interval);
  }, []);

  const fetchTopGainersOnly = async () => {
    try {
      const resp = await fetch(`${API_URL}/discover-markets`);
      const data = await resp.json();
      if (data && data.volume) setMarketData(data);
    } catch (e) {}
  };

  // FILTRO MEJORADO: Más robusto y tolerante a falta de datos
  const displayedMarkets = useMemo(() => {
    const source = marketData[activeTab] || [];
    if (!searchTerm || !searchTerm.trim()) return source;

    const term = searchTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
    return source.filter(m => {
      if (!m || !m.symbol) return false;
      const cleanSymbol = m.symbol.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanBase = m.base ? m.base.toLowerCase() : '';
      return cleanSymbol.includes(term) || cleanBase.includes(term);
    });
  }, [searchTerm, marketData, activeTab]);

  const saveFavoritesList = (newList) => {
    setFavorites(newList);
    localStorage.setItem('trader_favorites', JSON.stringify(newList));
    window.dispatchEvent(new Event('favorites_updated'));
  };

  const addFavorite = (symbol) => {
    if (!favorites.includes(symbol)) saveFavoritesList([symbol, ...favorites]);
  };

  const removeFavorite = (symbol) => {
    saveFavoritesList(favorites.filter(s => s !== symbol));
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop(); html5QrCodeRef.current = null; } catch {}
    }
    setShowScanner(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 md:py-8 px-2 md:px-0 font-sans">
      {/* Sección Bóveda API */}
      <div className="glass p-6 md:p-10 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden ring-1 ring-white/5">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <Lock size={150} />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
            <div>
                <h3 className="font-black text-[10px] text-accent uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                    <ShieldCheck size={14} /> Bóveda de Seguridad
                </h3>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Credenciales CoinEx</h2>
            </div>
            
            <div className="flex gap-2">
                <button 
                  onClick={() => saveCredentials(credentials)} 
                  className="bg-accent text-background font-black text-[10px] uppercase px-8 py-3.5 rounded-2xl shadow-xl shadow-accent/10 hover:brightness-110 active:scale-95 transition-all"
                >
                  Sincronizar Bóveda
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
              <div className="space-y-2">
                <span className="text-[9px] text-gray-600 font-bold uppercase ml-2 tracking-widest">API Public Key</span>
                <input 
                    type="password" 
                    value={credentials.apiKey}
                    onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl outline-none focus:border-accent/50 text-xs font-mono text-white transition-all" 
                    placeholder="********************************"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[9px] text-gray-600 font-bold uppercase ml-2 tracking-widest">API Secret Signature</span>
                <input 
                    type="password" 
                    value={credentials.apiSecret}
                    onChange={(e) => setCredentials({...credentials, apiSecret: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl outline-none focus:border-accent/50 text-xs font-mono text-white transition-all" 
                    placeholder="********************************"
                />
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Explorador de Mercado */}
        <div className="lg:col-span-3 glass p-6 md:p-8 rounded-[2.5rem] border-white/5 flex flex-col min-h-[600px] ring-1 ring-white/5 bg-gradient-to-b from-white/5 to-transparent">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                   <h3 className="font-black text-[10px] text-gray-500 uppercase tracking-[0.3em] mb-1 flex items-center gap-2">
                      <Globe size={14} className="text-accent" /> Market Discovery
                   </h3>
                   <span className="text-xs text-white/50 font-medium">Sincronización CoinEx / OKX Activa</span>
                </div>
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 w-fit">
                    {[
                      { id: 'volume', label: 'Volumen', icon: BarChart3 },
                      { id: 'price', label: 'Precio', icon: DollarSign },
                      { id: 'gainers', label: 'Ganadores', icon: TrendingUp }
                    ].map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-accent text-background shadow-lg shadow-accent/20' : 'text-gray-500 hover:text-white/70'}`}
                      >
                        <t.icon size={12} /> {t.label}
                      </button>
                    ))}
                </div>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input 
                    type="text" 
                    placeholder="BUSCAR ACTIVO (BTC, ETH, SOL...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 p-5 pl-14 rounded-2xl outline-none focus:border-accent/40 text-xs font-black text-white uppercase tracking-[0.2em] transition-all placeholder:text-gray-700"
                />
            </div>

            {loading && marketData.count === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                        <RefreshCw className="text-accent animate-spin" size={40} />
                        <div className="absolute inset-0 blur-lg bg-accent/20 animate-pulse rounded-full"></div>
                    </div>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.4em] text-center">Verificando liquidez cruzada...</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-2.5">
                        {displayedMarkets.length > 0 ? displayedMarkets.map((m) => (
                            <div key={m.symbol} className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10 transition-all">
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-white tracking-tight">{m.symbol}</span>
                                    <div className="flex items-center gap-4 mt-1.5 ">
                                        <span className="text-[10px] text-gray-500 font-mono tracking-tight">${Number(m.last).toLocaleString()}</span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${m.percentage >= 0 ? 'bg-long/10 text-long' : 'bg-short/10 text-short'}`}>
                                            {m.percentage >= 0 ? '+' : ''}{m.percentage?.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => addFavorite(m.symbol)}
                                    className={`p-3 rounded-xl transition-all ${favorites.includes(m.symbol) ? 'text-long bg-long/5 border border-long/20' : 'bg-accent/10 text-accent hover:bg-accent hover:text-background shadow-lg shadow-accent/5'}`}
                                >
                                    {favorites.includes(m.symbol) ? <ShieldCheck size={18} /> : <Plus size={18} />}
                                </button>
                            </div>
                        )) : (
                            <div className="py-20 text-center opacity-30">
                                <Search size={40} className="mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Sin resultados para "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Mis Favoritos */}
        <div className="lg:col-span-2 glass p-6 md:p-8 rounded-[2.5rem] border-white/5 flex flex-col min-h-[600px] ring-1 ring-white/5 bg-gradient-to-b from-transparent to-white/5">
            <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="font-black text-[10px] text-short uppercase tracking-[0.3em] mb-1 flex items-center gap-2">
                      <Wallet size={14} className="text-short" /> Watchlist
                   </h3>
                   <span className="text-xs text-white/50 font-medium">Activos en Dashboard</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-accent bg-accent/10 px-3 py-1 rounded-xl ring-1 ring-accent/20">{favorites.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-3">
                {favorites.map((symbol) => (
                    <div key={symbol} className="flex items-center justify-between gap-4 p-5 rounded-3xl bg-black/40 border border-white/5 group hover:border-white/10 transition-all">
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black text-white tracking-widest truncate">{symbol}</span>
                            <span className="text-[9px] text-gray-600 font-bold uppercase mt-1 tracking-tighter">Verified Stream</span>
                        </div>
                        <button 
                            onClick={() => removeFavorite(symbol)}
                            className="shrink-0 p-4 bg-short/10 text-short rounded-2xl hover:bg-short hover:text-white transition-all shadow-xl active:scale-90"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
                {favorites.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-700 opacity-20">
                        <BarChart3 size={60} className="mb-6" />
                        <p className="text-xs font-black uppercase tracking-[0.3em]">Watchlist Vacía</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
