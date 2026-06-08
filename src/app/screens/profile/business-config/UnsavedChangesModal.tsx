type UnsavedChangesModalProps = {
  onSaveAndExit: () => void;
  onExitWithoutSaving: () => void;
  onContinueEditing: () => void;
};

export default function UnsavedChangesModal({
  onSaveAndExit,
  onExitWithoutSaving,
  onContinueEditing
}: UnsavedChangesModalProps) {
  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-6 w-full shadow-xl">
        <h3 className="font-bold text-gray-900 text-lg mb-2">Salir sin guardar?</h3>
        <p className="text-sm text-gray-500 mb-5">Tienes cambios sin guardar. Si sales ahora se perderan.</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onSaveAndExit}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl font-semibold text-white transition-all"
          >
            Guardar y salir
          </button>
          <button
            onClick={onExitWithoutSaving}
            className="w-full py-3 bg-red-50 rounded-xl font-semibold text-red-500 transition-all"
          >
            Salir sin guardar
          </button>
          <button
            onClick={onContinueEditing}
            className="w-full py-3 bg-gray-100 rounded-xl font-semibold text-gray-700 transition-all"
          >
            Seguir editando
          </button>
        </div>
      </div>
    </div>
  );
}
