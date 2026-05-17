import { useState } from 'react';
import { MapPin, Phone, Store, User, Wrench } from 'lucide-react';

export default function RegistrationFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<'welcome' | 'phone' | 'verification' | 'name' | 'business' | 'businessDetails'>('welcome');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').replace(/^56/, '').replace(/^9?/, '9').slice(0, 9);
    const firstBlock = digits.slice(1, 5);
    const secondBlock = digits.slice(5, 9);
    return `+56 9${firstBlock ? ` ${firstBlock}` : ''}${secondBlock ? ` ${secondBlock}` : ''}`;
  };

  const handlePhoneChange = (value: string) => {
    setError('');
    setPhone(formatPhone(value));
  };

  const handlePhoneSubmit = () => {
    if (phone.replace(/\D/g, '').length !== 11) {
      setError('Ingresa un número celular válido.');
      return;
    }
    setError('');
    setStep('verification');
  };

  const handleVerificationSubmit = () => {
    if (code !== '123456') {
      setError('Código incorrecto. Usa 123456 para esta simulación.');
      return;
    }
    setError('');
    setStep('name');
  };

  const handleNameSubmit = () => {
    if (!name.trim()) {
      setError('Ingresa tu nombre para continuar.');
      return;
    }
    setError('');
    setStep('business');
  };

  const completeRegistration = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const password = cleanPhone.slice(0, 8);
    const email = `${cleanPhone}@zipco.cl`;
    const credentials = {
      name: name.trim(),
      phone,
      password,
      email
    };

    const saveAuthData = (data: any) => {
      const token = data.token ?? data.jwt ?? data.accessToken ?? data.access_token;
      const userId = data.user?.id ?? data.user?._id ?? data.id ?? data.userId;

      if (!token || !userId) {
        throw new Error('Invalid auth response');
      }

      localStorage.setItem('zipco-token', token);
      localStorage.setItem('zipco-user-id', String(userId));
      localStorage.setItem('zipco-registration-complete', 'true');
      onComplete();
    };

    try {
      setError('');

      const registerResponse = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (registerResponse.ok) {
        saveAuthData(await registerResponse.json());
        return;
      }

      const loginResponse = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (loginResponse.ok) {
        saveAuthData(await loginResponse.json());
        return;
      }

      setError('Hubo un problema al crear tu cuenta. Intenta de nuevo');
    } catch (error) {
      setError('Hubo un problema al crear tu cuenta. Intenta de nuevo');
    }
  };

  const progress = {
    welcome: 1,
    phone: 2,
    verification: 3,
    name: 4,
    business: 5,
    businessDetails: 6
  }[step];

  return (
    <div className="size-full bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center">
      <div className="w-full max-w-md h-full flex flex-col relative overflow-hidden bg-white">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-teal-500/20 to-transparent" />

        <div className="relative z-10 px-6 pt-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <MapPin className="w-8 h-8 text-teal-600" strokeWidth={2.5} />
            <h1 className="text-3xl font-bold tracking-tight text-teal-700">ZIPCO</h1>
          </div>

          {step !== 'welcome' && (
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
                <span>Paso {progress} de 6</span>
                <span>{Math.round((progress / 6) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00BFA5] rounded-full transition-all duration-300"
                  style={{ width: `${(progress / 6) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 flex-1 px-6 pb-8 flex flex-col justify-center">
          {step === 'welcome' && (
            <div className="text-center">
              <div className="w-24 h-24 bg-[#00BFA5] rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-xl shadow-teal-500/30">
                <MapPin className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Bienvenido a ZIPCO</h2>
              <p className="text-gray-600 mb-10 leading-relaxed">
                Encuentra negocios y servicios cerca de ti en segundos.
              </p>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Ingresar con número de celular
              </button>
            </div>
          )}

          {step === 'phone' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ingresa tu celular</h2>
              <p className="text-sm text-gray-600 mb-8">Te enviaremos un código de verificación.</p>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Número de celular</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+56 9 XXXX XXXX"
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00BFA5] transition-all"
              />
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
              <button
                type="button"
                onClick={handlePhoneSubmit}
                className="w-full mt-8 bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98]"
              >
                Continuar
              </button>
            </div>
          )}

          {step === 'verification' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifica tu número</h2>
              <p className="text-sm text-gray-600 mb-8">Ingresa el código de 6 dígitos enviado a {phone}.</p>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Código de verificación</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => {
                  setError('');
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                placeholder="123456"
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-2xl text-center tracking-[0.35em] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00BFA5] transition-all"
              />
              <p className="text-xs text-gray-400 mt-3">Código de prueba: 123456</p>
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
              <button
                type="button"
                onClick={handleVerificationSubmit}
                className="w-full mt-8 bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98]"
              >
                Verificar
              </button>
            </div>
          )}

          {step === 'name' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Cómo te llamas?</h2>
              <p className="text-sm text-gray-600 mb-8">Usaremos tu nombre para personalizar tu experiencia.</p>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setError('');
                  setName(e.target.value);
                }}
                placeholder="Tu nombre"
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00BFA5] transition-all"
              />
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
              <button
                type="button"
                onClick={handleNameSubmit}
                className="w-full mt-8 bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98]"
              >
                Continuar
              </button>
            </div>
          )}

          {step === 'business' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-teal-50 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <Store className="w-10 h-10 text-[#00BFA5]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">¿Ofreces un negocio o servicio?</h2>
              <p className="text-sm text-gray-600 mb-8">
                Elige la opcion que mejor describe lo que haras en ZIPCO.
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setStep('businessDetails')}
                  className="w-full bg-white border-2 border-teal-100 rounded-2xl p-4 text-left hover:border-[#00BFA5] hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Store className="w-6 h-6 text-[#00BFA5]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Tengo un Negocio</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Vendo productos que los clientes pueden comprar o encargar (tortas, ropa, comida, etc.).
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setStep('businessDetails')}
                  className="w-full bg-white border-2 border-teal-100 rounded-2xl p-4 text-left hover:border-[#00BFA5] hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-6 h-6 text-[#00BFA5]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Ofrezco un Servicio</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Realizo trabajos o actividades para los clientes (gasfiter, peluquero, profesor, etc.).
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={completeRegistration}
                  className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 text-left hover:border-gray-300 hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Solo busco negocios</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        No ofrezco nada, solo quiero encontrar lo que necesito.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
            </div>
          )}

          {step === 'businessDetails' && (
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
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej: Pasteleria Delicias"
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00BFA5] transition-all"
              />
              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
              <button
                type="button"
                onClick={completeRegistration}
                className="w-full mt-8 bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98]"
              >
                Comenzar
              </button>
            </div>
          )}

          {false && step === 'business' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-teal-50 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                <Store className="w-10 h-10 text-[#00BFA5]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">¿Tienes un negocio o servicio?</h2>
              <p className="text-sm text-gray-600 mb-8">
                Puedes activarlo ahora y configurarlo después desde tu perfil.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={completeRegistration}
                  className="bg-[#00BFA5] text-white py-4 px-5 rounded-2xl font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98]"
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={completeRegistration}
                  className="bg-gray-100 text-gray-800 py-4 px-5 rounded-2xl font-semibold hover:bg-gray-200 transition-all active:scale-[0.98]"
                >
                  No
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

