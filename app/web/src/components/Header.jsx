import React from 'react';
import { Bell, Search, User, ChevronDown, RefreshCw } from 'lucide-react';

const Header = ({ pnlStats, pnlLoading }) => {
  return (
    <header className="h-20 border-b border-border px-8 flex items-center justify-between bg-surface/20 backdrop-blur-xl sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 bg-surface/50 border border-border px-4 py-2 rounded-xl w-96">
          <Search size={18} className="text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar pares, estrategias, noticias..." 
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
            (pnlStats?.total_pnl || 0) >= 0 ? 'bg-long/10 border-long/20 text-long' : 'bg-short/10 border-short/20 text-short'
          }`}>
            <span className="text-[9px] font-bold uppercase tracking-wider">PnL Acumulado:</span>
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


      <div className="flex items-center gap-6">
        <button className="relative text-gray-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"></span>
        </button>
        
        <div className="h-8 w-px bg-border"></div>
        
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right">
            <p className="text-sm font-semibold">Alex Trader</p>
            <p className="text-[10px] text-accent uppercase font-bold tracking-wider">Pro Account</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-blue-600 rounded-lg flex items-center justify-center font-bold">
            A
          </div>
          <ChevronDown size={14} className="text-gray-500 group-hover:text-white transition-colors" />
        </div>
      </div>
    </header>
  );
};

export default Header;
