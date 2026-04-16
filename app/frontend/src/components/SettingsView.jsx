import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Settings, Search, Plus, Trash2, TrendingUp, ScanLine, X, Lock, ShieldCheck, Database, Globe, Filter } from 'lucide-react';
import API_URL from '../config/api';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsView = ({ credentials, setCredentials, saveCredentials }) => {
  const [allMarkets, setAllMarkets] = useState([]);
  const [topGainers, setTopGainers] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [loadingMarkets, setLoadingMarkets] = useState(false);
  const html5QrCodeRef = useRef(null);
  
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('trader_favorites');
    if (saved) return JSON.parse(saved);
    return ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
  });

  const fetchMarkets = async () => {
    setLoadingMarkets(true);
    try {
      const response = await fetch(`${API_URL}/top-gainers?limit=300&sort_by=volume&verified_only=true`);
      const data = await response.json();
      if (Array.isArray(data)) setAllMarkets(data);
    } catch (error) { console.error("Error fetching markets:", error); }
    finally { setLoadingMarkets(false); }
  };

  const fetchTopGainers = async () => {
    try {
      const response = await fetch(`${API_URL}/top-gainers?limit=30&verified_only=true`);
      const data = await response.json();
      if (Array.isArray(data)) setTopGainers(data);
    } catch (error) { console.error("Error fetching gainers:", error); }
  };

  useEffect(() => {
    fetchMarkets();
    fetchTopGainers();
  }, []);

  // FILTRO INTELIGENTE: Ignora barras y es insensible a mayúsculas
  const displayedMarkets = useMemo(() => {
    const source = activeTab === 'all' ? allMarkets : topGainers;
    if (!searchTerm.trim()) return source;

    const term = searchTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
    return source.filter(m => {
      const symbol = m.symbol.toLowerCase().replace(/[^a-z0-9]/g, '');
      return symbol.includes(term);
    }).sort((a, b) => (b.volume || 0) - (a.volume || 0));
  }, [searchTerm, allMarkets, topGainers, activeTab]);

  const startScanner = async () => {
    setShowScanner(true);
    setTimeout(async () => {
      try {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            try {
              const parsed = JSON.parse(decodedText);
              setCredentials({ 
                apiKey: parsed.apiKey || parsed.key || decodedText, 
                apiSecret: parsed.apiSecret || parsed.secret || '' 
              });
            } catch { setCredentials({ apiKey: decodedText, apiSecret: '' }); }
            stopScanner();
          },
          () => {}
        );
      } catch (err) { setShowScanner(false); }
    }, 100);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop(); html5QrCodeRef.current = null; } catch {}
    }
    setShowScanner(false);
  };

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

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      {/* Header Seccion */}
      <div className="flex items-center gap-6 mb-10">
        <div className="p-4 bg-accent/10 rounded-3xl border border-accent/20">
          <Settings size={32} className="text-accent" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Configuración</h2>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em]">Gestión de Seguridad & Activos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Izquierdo: Configuración API (Bóveda) */}
        <div className="lg:col-span-1 space-y-6">
            <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Lock size={120} />
                </div>
                
                <h3 className="font-black text-xs text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-accent" /> Credenciales CoinEx
                </h3>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">API Key</label>
                        <div className="relative">
                            <input 
                            type="password" 
                            value={credentials.apiKey}
                            onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-accent text-sm font-mono text-white transition-all" 
                            placeholder="Ingrese su Key"
                            />
                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700" size={16} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">API Secret</label>
                        <div className="relative">
                            <input 
                            type="password" 
                            value={credentials.apiSecret}
                            onChange={(e) => setCredentials({...credentials, apiSecret: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-accent text-sm font-mono text-white transition-all" 
                            placeholder="Ingrese su Secret"
                            />
                            <Database className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700" size={16} />
                        </div>
                    </div>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => saveCredentials(credentials)}
                        className="col-span-2 bg-accent text-background font-black text-xs uppercase py-4 rounded-2xl hover:brightness-110 shadow-lg shadow-accent/20 transition-all"
                    >
                        Guardar Bóveda
                    </button>
                    {isAndroid && (
                        <button 
                            onClick={startScanner}
                            className="bg-white/5 text-gray-300 font-bold text-[10px] py-3 rounded-xl border border-white/10 flex items-center justify-center gap-2 uppercase tracking-widest"
                        >
                            <ScanLine size={14} /> Scanner
                        </button>
                    )}
                    <button 
                        onClick={() => { localStorage.removeItem('trader_creds'); setCredentials({ apiKey: '', apiSecret: '' }); }}
                        className="bg-short/5 text-short font-bold text-[10px] py-3 rounded-xl border border-short/10 uppercase tracking-widest"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>

        {/* Lado Derecho: Gestor de Favoritos (2 columnas) */}
        <div className="lg:col-span-2 space-y-6">
            <div className="glass p-8 rounded-[2.5rem] border-white/5 min-h-[500px] flex flex-col relative overflow-hidden">
                {loadingMarkets && (
                    <div className="absolute top-0 left-0 w-full h-1">
                        <div className="h-full bg-accent animate-progress origin-left"></div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h3 className="font-black text-xs text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Globe size={14} className="text-accent" /> Gestor de Mercado
                        </h3>
                        <p className="text-xs text-gray-400 font-medium">Controla los activos que fluyen a tu Dashboard.</p>
                    </div>
                    
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                        {[
                          { id: 'all', label: 'Todos', icon: Globe },
                          { id: 'gainers', label: 'Top Vol.', icon: TrendingUp }
                        ].map(t => (
                          <button 
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-accent text-background' : 'text-gray-500'}`}
                          >
                            <t.icon size={12} /> {t.label}
                          </button>
                        ))}
                    </div>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <input 
                        type="search" 
                        placeholder="BUSCAR PAR (BTC, ETH, SOL...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 p-4 pl-14 rounded-2xl outline-none focus:border-white/20 text-xs font-bold text-white uppercase tracking-widest"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                    {/* Explorador */}
                    <div className="space-y-4 flex flex-col">
                        <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest px-1">Resultados</span>
                        <div className="space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-2 flex-1">
                            {displayedMarkets.length > 0 ? displayedMarkets.map((m) => (
                                <div key={m.symbol} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/10 group transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-white">{m.symbol}</span>
                                        <span className="text-[8px] text-gray-600 uppercase font-bold">{m.volume?.toLocaleString() || '---'} Vol.</span>
                                    </div>
                                    <button 
                                        onClick={() => addFavorite(m.symbol)}
                                        disabled={favorites.includes(m.symbol)}
                                        className={`p-2 rounded-lg transition-all ${favorites.includes(m.symbol) ? 'text-long opacity-100' : 'bg-accent/10 text-accent hover:bg-accent hover:text-background'}`}
                                    >
                                        {favorites.includes(m.symbol) ? '✓' : <Plus size={16} />}
                                    </button>
                                </div>
                            )) : (
                                <div className="py-20 text-center">
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Sin coincidencias</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mi Watchlist */}
                    <div className="space-y-4 flex flex-col">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Mi Watchlist</span>
                            <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-md">{favorites.length}</span>
                        </div>
                        <div className="space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-2 flex-1">
                            {favorites.map((symbol) => (
                                <div key={symbol} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group transition-all">
                                    <span className="text-xs font-black text-white tracking-widest">{symbol}</span>
                                    <button 
                                        onClick={() => removeFavorite(symbol)}
                                        className="p-2 text-gray-600 hover:text-short transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Modal Scanner QR - Estética premium */}
      <AnimatePresence>
        {showScanner && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
            >
                <div className="glass p-8 w-full max-w-sm rounded-[3rem] border border-white/10 text-center">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-black text-xs text-white uppercase tracking-widest">Sincronización QR</h4>
                        <button onClick={stopScanner} className="p-2 bg-white/5 rounded-full"><X size={20} /></button>
                    </div>
                    <div id="qr-reader" className="w-full rounded-3xl overflow-hidden border-2 border-accent/20" />
                    <p className="mt-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                        Apunta la cámara al código QR de sesión de tu exchange para sincronizar credenciales instantáneamente
                    </p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsView;
