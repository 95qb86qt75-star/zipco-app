import { Store, User, Wrench } from 'lucide-react';

type BusinessChoiceStepProps = {
  error: string;
  isCompletingRegistration: boolean;
  onChooseBusiness: () => void;
  onChooseService: () => void;
  onSearchOnly: () => void;
};

export default function BusinessChoiceStep({
  error,
  isCompletingRegistration,
  onChooseBusiness,
  onChooseService,
  onSearchOnly
}: BusinessChoiceStepProps) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-teal-50 rounded-3xl mx-auto mb-4 flex items-center justify-center">
        <Store className="w-8 h-8 text-[#00BFA5]" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">¿Ofreces un negocio o servicio?</h2>
      <p className="text-sm text-gray-600 mb-5">
        Elige la opcion que mejor describe lo que haras en ZIPCO.
      </p>
      <div className="space-y-2">
        <button
          type="button"
          onClick={onChooseBusiness}
          className="w-full bg-white border-2 border-teal-100 rounded-2xl p-3 text-left hover:border-[#00BFA5] hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-[#00BFA5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Tengo un Negocio</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Vendo productos que los clientes pueden comprar o encargar (tortas, ropa, comida, etc.).
              </p>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={onChooseService}
          className="w-full bg-white border-2 border-teal-100 rounded-2xl p-3 text-left hover:border-[#00BFA5] hover:shadow-lg transition-all active:scale-[0.98]"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 text-[#00BFA5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Ofrezco un Servicio</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Realizo trabajos o actividades para los clientes (gasfiter, peluquero, profesor, etc.).
              </p>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={onSearchOnly}
          disabled={isCompletingRegistration}
          className="w-full bg-white border-2 border-gray-100 rounded-2xl p-3 text-left hover:border-gray-300 hover:shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                {isCompletingRegistration ? 'Creando cuenta...' : 'Solo quiero buscar'}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Encuentra negocios y servicios cerca de ti.
              </p>
            </div>
          </div>
        </button>
      </div>
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
    </div>
  );
}
