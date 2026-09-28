import { Home, MapPin } from "lucide-react";

type Props = {
  kind: "on-site" | "at-customer-location";
  value: boolean | null;
  onChange: (value: boolean) => void;
};

export default function ServiceAttendanceCard({
  kind,
  value,
  onChange,
}: Props) {
  const isOnSite = kind === "on-site";
  const Icon = isOnSite ? MapPin : Home;

  return (
    <section className="mb-2 rounded-2xl border border-white/50 bg-white/80 p-5 shadow-md backdrop-blur-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900">
            {isOnSite ? "Atención presencial" : "Servicio a domicilio"}
          </h4>
          <p className="mt-1 text-xs text-gray-500">
            {isOnSite
              ? "¿Los clientes pueden acudir al lugar donde prestas el servicio?"
              : "¿Te desplazas hasta la ubicación del cliente para prestar el servicio?"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
        {[
          { value: true, label: "Sí" },
          { value: false, label: "No" },
        ].map((option) => (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-xl py-3 text-sm font-semibold transition-all ${
              value === option.value
                ? "bg-white text-teal-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {value === null && (
        <p className="mt-3 text-xs font-medium text-amber-600">
          Debes confirmar Sí o No.
        </p>
      )}
    </section>
  );
}
