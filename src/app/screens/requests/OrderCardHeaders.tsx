import type { ReactNode } from 'react';
import { Image as ImageIcon, PackageCheck } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import type { NormalizedProducts } from './types';

type IdentityProps = { name: string; image: string; products: NormalizedProducts; isUnread?: boolean; unavailableText?: string };

// Extracted from the pre-2A business header; state/actions stay in each card.
export function BusinessOrderHeader({ name, image, products, isUnread = false, statusLabel, badgeClass, attention = false, unavailableText = "Producto no disponible" }:
  IdentityProps & { statusLabel: string; badgeClass: string; attention?: boolean }) {
  return (
    <div className="grid grid-cols-[62px_minmax(0,1fr)_auto] items-start gap-2.5">
      {image ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <ImageWithFallback
            src={image}
            alt={name || "Cliente"}
            className="h-[62px] w-[62px] rounded-[14px] border border-cyan-300/50 object-cover shadow-[0_0_16px_rgba(34,211,238,0.16)]"
          />
        </button>
      ) : (
        <span className="zipco-image-placeholder flex h-[62px] w-[62px] items-center justify-center rounded-[14px] bg-slate-100 text-slate-400">
          <ImageIcon className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="truncate text-[15px] font-black leading-[18px] text-slate-950">
            {name || "Cliente"}
          </h4>
          {isUnread && (
            <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[9px] font-black text-white">
              Nueva
            </span>
          )}
        </div>
        {products.state === "available" ? (
          products.items.slice(0, 2).map((product, index) => (
            <p
              key={`${product.name}-${index}`}
              className="truncate text-xs text-slate-700"
            >
              <strong>{product.quantity}x</strong> {product.name}
            </p>
          ))
        ) : (
          <p className="text-xs text-red-600">{unavailableText}</p>
        )}
      </div>
      <span
        className={`inline-flex max-w-[104px] items-center justify-center gap-1 rounded-full px-2 py-1.5 text-center text-[10px] font-black leading-tight ${attention ? "zipco-new-badge" : ""} ${badgeClass}`}
      >
        {attention && (
          <PackageCheck className="zipco-attention-bell h-3.5 w-3.5 shrink-0" />
        )}
        {statusLabel}
      </span>
    </div>
  );
}

// Extracted from the pre-2A customer header, with slots for schedule and state.
export function CustomerOrderHeader({ name, image, products, isUnread = false, total, status, children, statusInCorner = false, unavailableText = "Producto no disponible" }:
  IdentityProps & { total: number | null; status: ReactNode; children?: ReactNode; statusInCorner?: boolean }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-3">
      <ImageWithFallback
        src={image}
        alt={name}
        className="h-[72px] w-[72px] rounded-xl object-cover"
      />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="line-clamp-2 text-sm font-black leading-tight text-slate-950">
            {name}
          </h4>
          {statusInCorner ? <span className="inline-flex max-w-[104px] shrink-0 justify-end">{status}</span> : <span className="shrink-0 whitespace-nowrap text-base font-black text-emerald-600">
            {total === null
              ? "—"
              : `$${total.toLocaleString("es-CL")}`}
          </span>}
        </div>
        {products.state === "available" ? (
          products.items.map((product, index) => (
            <p
              key={`${product.name}-${index}`}
              className="line-clamp-2 text-xs leading-4 text-slate-700"
            >
              <strong>{product.quantity}x</strong> {product.name}
            </p>
          ))
        ) : (
          <p className="text-xs text-red-600">{unavailableText}</p>
        )}
        {isUnread && (
          <span className="mt-1 inline-flex rounded-full bg-sky-500 px-2 py-0.5 text-[9px] font-black text-white">
            Nueva
          </span>
        )}
        {children}
      </div>
      {!statusInCorner && <div className="col-span-2 mt-1 flex items-center">
        {status}
        <span className="hidden whitespace-nowrap text-base font-black text-emerald-600">
          {total === null
            ? "—"
            : `$${total.toLocaleString("es-CL")}`}
        </span>
      </div>}
    </div>
  );
}
