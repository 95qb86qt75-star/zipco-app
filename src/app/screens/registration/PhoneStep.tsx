type PhoneStepProps = {
  phone: string;
  error: string;
  isRequestingCode: boolean;
  onPhoneChange: (value: string) => void;
  onContinue: () => void;
};

export const normalizeChileanMobileDigits = (value: string) => value.replace(/\D/g, '').slice(0, 8);

export default function PhoneStep({
  phone,
  error,
  isRequestingCode,
  onPhoneChange,
  onContinue
}: PhoneStepProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Ingresa tu celular</h2>
      <p className="text-sm text-gray-600 mb-8">Usaremos tu numero para crear tu cuenta.</p>
      <label className="text-sm font-semibold text-gray-700 mb-2 block">Número de celular</label>
      <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-white focus-within:border-[#00BFA5] focus-within:ring-2 focus-within:ring-teal-500/20">
        <span className="flex items-center bg-gray-100 px-4 text-lg font-semibold text-gray-700">+56 9</span>
        <input
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(event) => onPhoneChange(normalizeChileanMobileDigits(event.target.value))}
          placeholder="1234 5678"
          aria-label="Ocho dígitos del número celular"
          className="min-w-0 flex-1 px-4 py-4 text-lg text-gray-900 outline-none placeholder:text-gray-400 caret-[#00BFA5]"
        />
      </div>
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      <button
        type="button"
        onClick={onContinue}
        disabled={isRequestingCode || phone.length !== 8}
        className="w-full mt-8 bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
      >
        {isRequestingCode ? 'Enviando código...' : 'Continuar'}
      </button>
    </div>
  );
}
