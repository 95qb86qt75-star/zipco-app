import React from 'react';

type SaveChangesBarProps = {
  hasUnsavedChanges: boolean;
  onSave: () => void;
};

export default function SaveChangesBar({ hasUnsavedChanges, onSave }: SaveChangesBarProps) {
  if (!hasUnsavedChanges) return null;

  return (
    <div
      className="absolute bottom-20 left-0 right-0 z-40 border-t border-gray-100 bg-white px-4 pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <button
        onClick={onSave}
        className="min-h-11 w-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-teal-500/25 transition-all active:scale-[0.98]"
      >
        Guardar cambios
      </button>
    </div>
  );
}
