import { Store } from 'lucide-react';

type PhysicalAttendanceCardProps = {
  hasPhysicalStore: boolean;
  onChange: (value: boolean) => void;
};

export default function PhysicalAttendanceCard({ hasPhysicalStore, onChange }: PhysicalAttendanceCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-2">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
          <Store className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900">Atencion presencial</h4>
          <p className="text-xs text-gray-500 mt-1">Los clientes pueden comprar o retirar en un local fisico?</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
        {[
          { value: true, label: 'Si' },
          { value: false, label: 'No' }
        ].map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`py-3 rounded-xl text-sm font-semibold transition-all ${
              hasPhysicalStore === option.value
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-3">
        {hasPhysicalStore
          ? 'Mostraremos tus horarios y el estado del local a los clientes.'
          : 'Ocultaremos el estado de local abierto o cerrado para este negocio.'}
      </p>
    </div>
  );
}
