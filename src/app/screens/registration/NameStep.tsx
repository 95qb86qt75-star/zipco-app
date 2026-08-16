type NameStepProps = {
  name: string;
  error: string;
  onNameChange: (value: string) => void;
  onContinue: () => void;
};

export default function NameStep({
  name,
  error,
  onNameChange,
  onContinue
}: NameStepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Cómo te llamas?</h2>
      <p className="text-sm text-gray-600 mb-8">Usaremos tu nombre para personalizar tu experiencia.</p>
      <label className="text-sm font-semibold text-gray-700 mb-2 block">Nombre</label>
      <input
        type="text"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="Tu nombre"
        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00BFA5] transition-all text-gray-900 placeholder:text-gray-400 caret-[#00BFA5]"
      />
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      <button
        type="button"
        onClick={onContinue}
        className="w-full mt-8 bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98]"
      >
        Continuar
      </button>
    </div>
  );
}
