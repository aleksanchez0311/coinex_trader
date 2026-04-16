import React from 'react';
import { Bell, ChevronDown, RefreshCw, Menu, ArrowLeft } from 'lucide-react';

const Header = ({ pnlStats, pnlLoading, exchangeBalance, balanceLoading, onToggleSidebar, sidebarOpen, onCloseSidebar }) => {
  return (
    <header className="h-16 md:h-20 border-b border-border px-3 md:px-6 flex items-center justify-between bg-surface/20 backdrop-blur-xl sticky top-0 z-10">
      <div className="flex items-center gap-2 md:gap-4">
        {/* Si sidebar abierto, mostrar botón cerrar, si no mostrar menu */}
        {sidebarOpen ? (
          <button 
            onClick={onCloseSidebar}
            className="p-2 rounded-lg bg-surface-elevated border border-border hover:bg-surface-highlight transition-colors"
          >
            <ArrowLeft size={20} className="text-textSecondary" />
          </button>
        ) : (
          <button 
            onClick={onToggleSidebar}
            className="p-2 rounded-lg bg-surface-elevated border border-border hover:bg-surface-highlight transition-colors"
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
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Balance - visible en tablet+ */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border bg-surface/50 border-border">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Balance:</span>
          {balanceLoading ? (
            <RefreshCw size={12} className="animate-spin text-accent" />
          ) : (
            <span className={`text-xs font-mono font-bold ${
              exchangeBalance && exchangeBalance > 0 ? 'text-long' : 'text-short'
            }`}>
              {exchangeBalance ? `${exchangeBalance.toFixed(2)} USDT` : '0.00 USDT'}
            </span>
          )}
        </div>

        {/* PnL - visible en tablet+ */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border bg-surface/50 border-border">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">PnL Acumulado:</span>
          {pnlLoading ? (
            <RefreshCw size={12} className="animate-spin text-accent" />
          ) : (
            <span className={`text-xs font-mono font-bold ${
              (pnlStats?.total_pnl || 0) >= 0 ? 'text-long' : 'text-short'
            }`}>
              {(pnlStats?.total_pnl || 0) >= 0 ? '+' : ''}{(pnlStats?.total_pnl || 0).toFixed(2)} USDT
            </span>
          )}
        </div>

        <button className="relative text-textSecondary hover:text-textPrimary transition-colors p-2">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-long rounded-full"></span>
        </button>
        
        <div className="h-6 md:h-8 w-px bg-border"></div>
        
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-textPrimary">Alex Trader</p>
            <p className="text-[10px] text-accent uppercase font-bold tracking-wider">Pro</p>
          </div>
          <div className="w-8 md:w-10 h-8 md:h-10 bg-gradient-to-br from-long to-blue-600 rounded-lg flex items-center justify-center font-bold text-background text-sm md:text-base">
            A
          </div>
          <ChevronDown size={14} className="text-neutral group-hover:text-textPrimary transition-colors hidden sm:block" />
        </div>
      </div>
    </header>
  );
};

export default Header;