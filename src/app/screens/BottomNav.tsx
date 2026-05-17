import { FileText, Heart, Home, User } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onNavigate }: { activeTab: string; setActiveTab: (tab: string) => void; onNavigate?: (tab: string) => void }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 shadow-lg">
      <div className="flex items-center justify-around">
        {[
          { id: 'home', icon: Home, label: 'Inicio' },
          { id: 'profile', icon: User, label: 'Perfil' },
          { id: 'favorites', icon: Heart, label: 'Favoritos' },
          { id: 'requests', icon: FileText, label: 'Solicitudes' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (onNavigate) onNavigate(tab.id);
              }}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all ${
                isActive ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
