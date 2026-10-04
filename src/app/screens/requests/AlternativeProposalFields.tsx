import {
  CalendarClock,
  Check,
  DollarSign,
  Hash,
  ImagePlus,
  Package,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { getCloudinarySecureImageUrl } from "../profile/business-config/catalogValidation";

type ChangeKey = "item" | "price" | "quantity" | "schedule";

type Props = {
  original: string;
  item: string;
  setItem: (value: string) => void;
  price: string;
  setPrice: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  time: string;
  setTime: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  photo: string;
  setPhoto: (value: string) => void;
  priceRequired?: boolean;
  customerName?: string | null;
};

const choices: Array<{
  key: ChangeKey;
  label: string;
  hint: string;
  icon: typeof Package;
}> = [
  {
    key: "item",
    label: "Producto o servicio",
    hint: "Propón una opción diferente.",
    icon: Package,
  },
  {
    key: "price",
    label: "Precio",
    hint: "Indica el nuevo precio que se enviará al cliente.",
    icon: DollarSign,
  },
  {
    key: "quantity",
    label: "Cantidad",
    hint: "Indica la nueva cantidad propuesta.",
    icon: Hash,
  },
  {
    key: "schedule",
    label: "Fecha y hora",
    hint: "Selecciona una nueva fecha y horario.",
    icon: CalendarClock,
  },
];

export default function AlternativeProposalFields(props: Props) {
  const [selected, setSelected] = useState<Set<ChangeKey>>(
    () => new Set(props.priceRequired ? ["price"] : []),
  );
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggle = (key: ChangeKey) =>
    setSelected((current) => {
      if (key === "price" && props.priceRequired) return current;
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", "zipco_products");
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dr6xu5xr9/image/upload",
        { method: "POST", body },
      );
      if (!response.ok) throw new Error();
      const url = getCloudinarySecureImageUrl(await response.json());
      if (!url) throw new Error();
      props.setPhoto(url);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/70">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
          Solicitud original
        </p>
        <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
          {props.original}
        </p>
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-900 dark:text-white">
          Define qué necesitas ajustar
        </h4>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {choices.map(({ key, label, hint, icon: Icon }) => {
            const active = selected.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={`min-h-[82px] rounded-2xl border p-3 text-left transition-all ${active ? "border-violet-400 bg-violet-500/15 text-violet-700 ring-1 ring-violet-300 dark:text-violet-200" : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}
              >
                <span className="flex items-center justify-between">
                  <Icon className="h-5 w-5" />
                  {active && <Check className="h-4 w-4" />}
                </span>
                <span className="mt-2 block text-xs font-black">
                  {key === "price" && props.priceRequired
                    ? "Precio final"
                    : label}
                </span>
                <span className="mt-0.5 block text-[10px] leading-3 opacity-70">
                  {key === "price" && props.priceRequired
                    ? `Indica el precio final para la solicitud de ${props.customerName || "tu cliente"}.`
                    : key === "quantity" && props.customerName
                      ? `Mantén la cantidad solicitada por ${props.customerName} o propón una nueva.`
                      : key === "schedule" && props.customerName
                        ? "Conserva el horario solicitado o indica cuándo tienes disponibilidad."
                        : hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {selected.has("item") && (
        <input
          value={props.item}
          onChange={(e) => props.setItem(e.target.value)}
          placeholder="Nueva opción propuesta"
          className="zipco-readable-field w-full rounded-xl border p-3 text-sm"
        />
      )}
      {selected.has("price") && (
        <input
          inputMode="numeric"
          value={props.price}
          onChange={(e) => props.setPrice(e.target.value.replace(/\D/g, ""))}
          placeholder="Nuevo precio"
          className="zipco-readable-field w-full rounded-xl border p-3 text-sm"
        />
      )}
      {selected.has("quantity") && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2 dark:border-slate-700">
          <span className="text-sm font-bold">Nueva cantidad</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                props.setQuantity(
                  String(Math.max(1, Number(props.quantity || 1) - 1)),
                )
              }
              className="h-9 w-9 rounded-full bg-slate-100 font-black dark:bg-slate-800"
            >
              −
            </button>
            <span className="min-w-5 text-center font-black">
              {props.quantity || "1"}
            </span>
            <button
              type="button"
              onClick={() =>
                props.setQuantity(String(Number(props.quantity || 1) + 1))
              }
              className="h-9 w-9 rounded-full bg-violet-600 font-black text-white"
            >
              +
            </button>
          </div>
        </div>
      )}
      {selected.has("schedule") && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={props.date}
            onChange={(e) => props.setDate(e.target.value)}
            className="zipco-readable-field w-full rounded-xl border p-3 text-sm"
          />
          <input
            type="time"
            value={props.time}
            onChange={(e) => props.setTime(e.target.value)}
            className="zipco-readable-field w-full rounded-xl border p-3 text-sm"
          />
        </div>
      )}
      <label className="block text-sm font-black text-slate-900 dark:text-white">
        Explícale tu respuesta al cliente
        <span className="mt-1 block text-xs font-normal text-slate-500">
          Deja un comentario breve para que comprenda el precio o cualquier
          cambio.
        </span>
        <textarea
          value={props.message}
          onChange={(e) => props.setMessage(e.target.value)}
          rows={3}
          placeholder="Ej: Puedo ofrecerte esta alternativa porque…"
          className="zipco-readable-field mt-2 w-full rounded-xl border p-3 text-sm font-normal"
        />
      </label>
      {props.photo ? (
        <div className="relative overflow-hidden rounded-2xl border border-violet-300">
          <ImageWithFallback
            src={props.photo}
            alt="Referencia de la alternativa"
            className="h-36 w-full object-cover"
          />
          <button
            type="button"
            onClick={() => props.setPhoto("")}
            className="absolute right-2 top-2 rounded-full bg-slate-950/75 p-2 text-white"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-violet-400 bg-violet-500/5 p-4 text-left text-violet-700 dark:text-violet-200"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
            <ImagePlus className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-black">
              {uploading ? "Subiendo foto…" : "Agregar foto de referencia"}
            </span>
            <span className="block text-xs opacity-70">
              Opcional, úsala si ayuda a explicar la propuesta.
            </span>
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => void upload(e.target.files?.[0])}
      />
    </div>
  );
}
