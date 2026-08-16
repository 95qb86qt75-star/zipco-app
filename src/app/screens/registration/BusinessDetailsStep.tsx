import { Store } from 'lucide-react';

type BusinessDetailsStepProps = {
  businessName: string;
  error: string;
  isCompletingRegistration: boolean;
  onBusinessNameChange: (value: string) => void;
  onComplete: () => void;
};

export default function BusinessDetailsStep({
  businessName,
  error,
  isCompletingRegistration,
  onBusinessNameChange,
  onComplete
}: BusinessDetailsStepProps) {
  return (
    <div>
      <div className="w-20 h-20 bg-teal-50 rounded-3xl mx-auto mb-6 flex items-center justify-center">
        <Store className="w-10 h-10 text-[#00BFA5]" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Nombre del negocio o servicio</h2>
      <p className="text-sm text-gray-600 mb-8 text-center">
        Tu perfil fue creado. Ve a la seccion Perfil para completar tu informacion y publicar tu negocio o servicio.
      </p>
      <label className="text-sm font-semibold text-gray-700 mb-2 block">Nombre del negocio</label>
      <input
        type="text"
        value={businessName}
        onChange={(event) => onBusinessNameChange(event.target.value)}
        placeholder="Ej: Pasteleria Delicias"
        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00BFA5] transition-all text-gray-900 placeholder:text-gray-400 caret-[#00BFA5]"
      />
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      <button
        type="button"
        onClick={onComplete}
        disabled={isCompletingRegistration}
        className="w-full mt-8 bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
      >
        {isCompletingRegistration ? 'Creando cuenta...' : 'Comenzar'}
      </button>
    </div>
  );
}
