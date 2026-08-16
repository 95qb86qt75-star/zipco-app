import { MapPin, Phone } from 'lucide-react';

type WelcomeStepProps = {
  onContinue: () => void;
};

export default function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
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
        onClick={onContinue}
        className="w-full bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <Phone className="w-5 h-5" />
        Ingresar con número de celular
      </button>
    </div>
  );
}
