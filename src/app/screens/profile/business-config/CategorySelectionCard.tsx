import { Store } from 'lucide-react';
import type { BusinessCategory } from './types';

type CategorySelectionCardProps = {
  category: string;
  categories: BusinessCategory[];
  onOpenCategoryModal: () => void;
};

export default function CategorySelectionCard({
  category,
  categories,
  onOpenCategoryModal
}: CategorySelectionCardProps) {
  const selectedCategory = categories.find((cat) => cat.id === category);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-2">
      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Store className="w-5 h-5 text-teal-600" />
        Categoria del Negocio
      </h4>
      {!category ? (
        <button
          type="button"
          onClick={onOpenCategoryModal}
          className="w-full rounded-xl bg-gray-100 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-all"
        >
          Indica tu categoria →
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 p-3 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedCategory?.icon}</span>
              <span className="text-xs font-semibold">{selectedCategory?.name ?? category}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenCategoryModal}
            className="rounded-full bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-all"
          >
            Cambiar
          </button>
        </div>
      )}
    </div>
  );
}
