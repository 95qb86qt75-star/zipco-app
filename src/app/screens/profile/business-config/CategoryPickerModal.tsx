import type { BusinessCategory } from './types';

type CategoryPickerModalProps = {
  category: string;
  categories: BusinessCategory[];
  onSelectCategory: (category: string) => void;
  onClose: () => void;
};

export default function CategoryPickerModal({
  category,
  categories,
  onSelectCategory,
  onClose
}: CategoryPickerModalProps) {
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl p-5 max-h-[75vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-gray-900 text-lg mb-4 text-center">Elige tu categoria</h3>
        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  category === cat.id
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-xs font-semibold">{cat.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="mt-4 w-full py-3 bg-gray-100 rounded-xl font-semibold text-gray-700">
          Cancelar
        </button>
      </div>
    </div>
  );
}
