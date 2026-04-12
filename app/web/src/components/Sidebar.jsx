import React from 'react';
import { LayoutDashboard, TrendingUp, ShieldAlert, Settings, Layers } from 'lucide-react';

const Sidebar = ({ 
  activeTab, setActiveTab, selected
}) => {
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'positions', icon: Layers, label: 'Posiciones' },
    { id: 'strategy', icon: TrendingUp, label: 'Estrategias' },
    { id: 'risk', icon: ShieldAlert, label: 'Gestión de Riesgo' },
    { id: 'settings', icon: Settings, label: 'Configuración' },
  ];

  return (
    <aside className="w-64 bg-surface/50 border-r border-border flex flex-col">
      <div className="p-6 flex items-center gap-3 shrink-0">
        <img src="/favicon.svg" alt="CoinEx Trader" className="w-10 h-10 rounded-xl" />
        <h1 className="text-xl font-bold title-gradient">CoinEx Trader</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-premium flex flex-col">
        <nav className="px-4 py-6 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === item.id 
                ? 'bg-accent/10 text-accent border border-accent/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
