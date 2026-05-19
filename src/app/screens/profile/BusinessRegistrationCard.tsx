import { Store } from 'lucide-react';

export default function BusinessRegistrationCard({
  profileTab,
  hasRegisteredBusiness,
  profileCardClass,
  showBusinessRegistrationForm,
  businessRegistrationForm,
  setBusinessRegistrationForm,
  isBusinessProfileTab,
  setShowBusinessRegistrationForm,
  handleRegisterBusiness
}: any) {
  if (profileTab !== 'negocio' || hasRegisteredBusiness) return null;

  return (
    <div className={`${profileCardClass} rounded-2xl p-5 border shadow-md mb-4`}>
      {showBusinessRegistrationForm ? (
        <div className="space-y-4">
          <div>
            <label className={`text-xs mb-1 block ${isBusinessProfileTab ? 'text-white/70' : 'text-gray-500'}`}>
              Nombre del negocio/servicio
            </label>
            <input
              type="text"
              value={businessRegistrationForm.name}
              onChange={(e) => setBusinessRegistrationForm({ ...businessRegistrationForm, name: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              placeholder="Ej: Pasteleria, gasfiteria, peluqueria"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['Negocio', 'Servicio'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBusinessRegistrationForm({ ...businessRegistrationForm, type })}
                className={`py-3 px-3 rounded-xl text-sm font-semibold border transition-all ${
                  businessRegistrationForm.type === type
                    ? 'bg-[#00BFA5] text-white border-[#00BFA5]'
                    : isBusinessProfileTab
                      ? 'bg-white/10 text-white border-white/20'
                      : 'bg-white text-gray-700 border-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowBusinessRegistrationForm(false)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold ${
                isBusinessProfileTab ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleRegisterBusiness}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-[#00BFA5] text-white hover:bg-teal-600 transition-all"
            >
              Confirmar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowBusinessRegistrationForm(true)}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-colors ${
            isBusinessProfileTab ? 'text-white hover:bg-white/10' : 'text-[#00BFA5] hover:bg-teal-50'
          }`}
        >
          <Store className={`w-5 h-5 ${isBusinessProfileTab ? 'text-white' : 'text-[#00BFA5]'}`} />
          Tienes un negocio o servicio? Registralo aqui
        </button>
      )}
    </div>
  );
}
