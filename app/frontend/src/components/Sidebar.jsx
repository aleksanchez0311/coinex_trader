import React from 'react';
import { LayoutDashboard, TrendingUp, ShieldAlert, Settings, Layers, X } from 'lucide-react';

const Sidebar = ({ 
  activeTab, setActiveTab, selected, isOpen = true, onClose
}) => {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'positions', icon: Layers, label: 'Posiciones' },
    { id: 'strategy', icon: TrendingUp, label: 'Estrategias' },
    { id: 'risk', icon: ShieldAlert, label: 'Gestión de Riesgo' },
    { id: 'settings', icon: Settings, label: 'Configuración' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay para móviles */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      <aside className="fixed lg:relative z-50 w-64 h-screen bg-surface/95 backdrop-blur-lg border-r border-border flex flex-col shrink-0 transform transition-transform duration-300 lg:translate-x-0">
      {/* Header del sidebar */}
      <div className="p-4 border-b border-border shrink-0">
        <button 
          onClick={() => {
            setActiveTab('dashboard');
            if (window.innerWidth < 1024) onClose();
          }}
          className="flex items-center gap-3 w-full hover:bg-surface-elevated p-2 rounded-lg transition-colors"
        >
          <img src="/favicon.svg" alt="CoinEx Trader" className="w-8 h-8 rounded-lg" />
          <h1 className="text-lg font-bold text-textPrimary">CoinEx Trader</h1>
        </button>
      </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                  isActive 
                    ? 'bg-long/10 text-long border border-long/20' 
                    : 'text-textSecondary hover:bg-surface-elevated hover:text-textPrimary'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-long' : ''} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer opcional */}
        <div className="p-4 border-t border-border shrink-0">
          <div className="text-xs text-neutral text-center">
            v1.0.0 • CoinEx Trader
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;