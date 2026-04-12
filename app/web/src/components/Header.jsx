import React from 'react';
import { Bell, Search, ChevronDown, RefreshCw, Menu, ArrowLeft } from 'lucide-react';

const Header = ({ pnlStats, pnlLoading, onToggleSidebar, sidebarOpen, onCloseSidebar }) => {
  return (
    <header className="h-20 border-b border-border px-6 flex items-center justify-between bg-surface/20 backdrop-blur-xl sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* Si sidebar abierto, mostrar botón cerrar, si no mostrar menu */}
        {sidebarOpen ? (
          <button 
            onClick={onCloseSidebar}
            className="p-2.5 rounded-lg bg-surface-elevated border border-border hover:bg-surface-highlight transition-colors"
          >
            <ArrowLeft size={20} className="text-textSecondary" />
          </button>
        ) : (
          <button 
            onClick={onToggleSidebar}
            className="p-2.5 rounded-lg bg-surface-elevated border border-border hover:bg-surface-highlight transition-colors"
          >
            <Menu size={20} className="text-textSecondary" />
          </button>
        )}

        {/* Logo - solo visible cuando sidebar cerrado */}
        {!sidebarOpen && (
          <div className="hidden lg:flex items-center gap-3">
            <img src="/favicon.svg" alt="CoinEx Trader" className="w-8 h-8 rounded-lg" />
            <h1 className="text-lg font-bold text-textPrimary">CoinEx Trader</h1>
          </div>
        )}

        {/* Buscador */}
        <div className="hidden md:flex items-center gap-4 bg-surface/50 border border-border px-4 py-2 rounded-xl w-80">
          <Search size={18} className="text-neutral" />
          <input 
            type="text" 
            placeholder="Buscar pares, estrategias..." 
            className="bg-transparent border-none outline-none text-sm w-full text-textPrimary placeholder-text-muted"
          />
        </div>

        {/* PnL */}
        <div className="hidden lg:flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
            (pnlStats?.total_pnl || 0) >= 0 ? 'bg-long-bg border-long/20 text-long' : 'bg-short-bg border-short/20 text-short'
          }`}>
            <span className="text-[10px] font-semibold uppercase tracking-wider">PnL:</span>
            {pnlLoading ? (
              <RefreshCw size={12} className="animate-spin text-accent" />
            ) : (
              <span className="text-xs font-mono font-bold">
                {(pnlStats?.total_pnl || 0) >= 0 ? '+' : ''}{(pnlStats?.total_pnl || 0).toFixed(2)} USDT
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-textSecondary hover:text-textPrimary transition-colors p-2">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-long rounded-full"></span>
        </button>
        
        <div className="h-8 w-px bg-border"></div>
        
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-textPrimary">Alex Trader</p>
            <p className="text-[10px] text-accent uppercase font-bold tracking-wider">Pro</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-long to-blue-600 rounded-lg flex items-center justify-center font-bold text-background">
            A
          </div>
          <ChevronDown size={14} className="text-neutral group-hover:text-textPrimary transition-colors" />
        </div>
      </div>
    </header>
  );
};

export default Header;