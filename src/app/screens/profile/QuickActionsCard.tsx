import { useState } from 'react';
import { ChevronRight, LogOut, TrendingUp } from 'lucide-react';

export default function QuickActionsCard({ profileTab, onLogout }: { profileTab: string; onLogout: () => void }) {
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  return (
    <>
        {/* Quick Actions */}
        {profileTab === 'personal' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
          <h4 className="font-bold text-gray-900 mb-4">⚡ Acciones Rápidas</h4>
          <div className="space-y-2">
            <button onClick={() => setShowLogoutConfirmation(true)} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-red-600" />
                <span className="text-sm font-semibold text-red-600">Cerrar sesión</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        )}

        {showLogoutConfirmation && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-confirmation-title"
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <h3 id="logout-confirmation-title" className="font-bold text-gray-900 text-lg mb-2">
                ¿Estás seguro que quieres cerrar sesión?
              </h3>
              <div className="flex flex-col gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirmation(false)}
                  className="w-full py-3 bg-gray-100 rounded-xl font-semibold text-gray-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold text-white transition-all"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
