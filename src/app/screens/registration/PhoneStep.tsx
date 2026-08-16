type PhoneStepProps = {
  phone: string;
  error: string;
  isRequestingCode: boolean;
  onPhoneChange: (value: string) => void;
  onContinue: () => void;
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').replace(/^56/, '').replace(/^9?/, '9').slice(0, 9);
  const firstBlock = digits.slice(1, 5);
  const secondBlock = digits.slice(5, 9);
  return `+56 9${firstBlock ? ` ${firstBlock}` : ''}${secondBlock ? ` ${secondBlock}` : ''}`;
};

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
      <input
        type="tel"
        value={phone}
        onChange={(event) => onPhoneChange(formatPhone(event.target.value))}
        placeholder="+56 9 XXXX XXXX"
        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-[#00BFA5] transition-all text-gray-900 placeholder:text-gray-400 caret-[#00BFA5]"
      />
      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      <button
        type="button"
        onClick={onContinue}
        disabled={isRequestingCode}
        className="w-full mt-8 bg-[#00BFA5] text-white py-4 px-6 rounded-full font-semibold shadow-lg shadow-teal-500/30 hover:bg-teal-600 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
      >
        {isRequestingCode ? 'Enviando código...' : 'Continuar'}
      </button>
    </div>
  );
}
