type SaveChangesBarProps = {
  hasUnsavedChanges: boolean;
  onSave: () => void;
};

export default function SaveChangesBar({ hasUnsavedChanges, onSave }: SaveChangesBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 px-4 pt-4 pb-28 bg-gradient-to-t from-white via-white to-white">
      <button
        onClick={onSave}
        disabled={!hasUnsavedChanges}
        className={`w-full py-4 px-6 rounded-full font-semibold shadow-xl transition-all active:scale-[0.98] ${
          hasUnsavedChanges
            ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
        }`}
      >
        {hasUnsavedChanges ? 'Guardar Cambios' : 'Sin cambios pendientes'}
      </button>
    </div>
  );
}
