import * as React from 'react';
import { type CSSProperties, type ReactNode } from 'react';











import { BUTTON_SPARKS } from "./coordinationSparks";








import "../../customer/whatsapp/initial/customer-initial-coordination.css";

/**
 * Shared design O for both participants in COORDINATION_PENDING / COORDINATING.
 * The actor selects the existing coordination permissions and its own consent flag.
 * Estructura: cabecera compacta → franja "Condiciones aceptadas" (abre una hoja flotante) → mensaje + stepper de 3 pasos
 * → "Anular solicitud" (abre una hoja flotante, en un solo paso).
 */
export const TZ = 'America/Santiago';
export const when = (iso?: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  return `${date.toLocaleDateString('es-CL', { timeZone: TZ, day: 'numeric', month: 'short' }).replace('.', '')} · ${date.toLocaleTimeString('es-CL', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })}`;
};
export const vars = (values: Record<string, string | number>) => Object.fromEntries(Object.entries(values).map(([k, v]) => [`--${k}`, v])) as CSSProperties;
export const Sparks = () => <span className="zipco-co-us" aria-hidden="true">{BUTTON_SPARKS.map(([x, y, c, s], i) => <i key={i} style={vars({ x: `${x}px`, y: `${y}px`, c, s })} />)}</span>;
export const Step = ({ className = '', node, children }: { className?: string; node: ReactNode; children: ReactNode }) =>
  <div className={`zipco-co-st ${className}`.trim()}>{node}<div className="zipco-co-sb">{children}</div></div>;
