import { FileText, Heart, Home, UserRound } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onNavigate }: { activeTab: string; setActiveTab: (tab: string) => void; onNavigate?: (tab: string) => void }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white px-6 pt-1.5 pb-1.5 shadow-[0_-6px_20px_rgba(15,23,42,0.07)]">
      <div className="flex items-center justify-around">
        {[
          { id: 'home', icon: Home, label: 'Inicio' },
          { id: 'profile', icon: UserRound, label: 'Perfil' },
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
              className="relative flex min-w-[64px] flex-col items-center rounded-xl px-2 py-0.5 transition-all"
            >
              <div
                className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                  isActive ? 'bg-white shadow-[0_8px_20px_rgba(0,191,165,0.18)] -translate-y-0.5' : ''
                }`}
              >
                <Icon
                  className={`h-[24px] w-[24px] transition-colors ${
                    isActive
                      ? tab.id === 'favorites'
                        ? 'fill-rose-400 text-rose-500 drop-shadow-[0_8px_10px_rgba(244,63,94,0.28)]'
                        : 'text-[#00BFA5]'
                      : tab.id === 'requests'
                        ? 'text-sky-300 drop-shadow-[0_3px_5px_rgba(59,130,246,0.18)]'
                        : 'text-slate-300'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {tab.id === 'home' && !isActive && (
                  <span className="absolute bottom-2.5 h-2.5 w-2 rounded-t-md bg-gradient-to-t from-[#00BFA5] to-emerald-300 opacity-90" />
                )}
              </div>
              <span className={`mt-0.5 text-[11px] font-semibold transition-colors ${isActive ? 'text-[#00BFA5]' : 'text-gray-500'}`}>{tab.label}</span>
              <span className={`mt-0.5 h-1.5 w-1.5 rounded-full bg-[#00BFA5] transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
