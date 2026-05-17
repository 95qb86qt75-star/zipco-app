import { Heart } from 'lucide-react';
import { motion } from 'motion/react';

export default function EmptyFavorites({ isDarkMode, onExplore }: { isDarkMode: boolean; onExplore: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex-1 flex items-center justify-center px-6"
    >
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg ${
              isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-rose-50 border border-rose-100'
            }`}
          >
            <Heart className={`w-12 h-12 ${isDarkMode ? 'text-rose-300' : 'text-rose-500'}`} />
          </motion.div>
        </div>

        <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Aún no tienes favoritos
        </h3>
        <p className={`text-sm mb-8 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
          Guarda negocios o servicios para encontrarlos rápido aquí
        </p>

        <button
          type="button"
          onClick={onExplore}
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3.5 px-5 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          Explorar ahora
        </button>
      </div>
    </motion.div>
  );
}

