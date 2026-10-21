import type { MouseEvent } from 'react';
import { Check } from 'lucide-react';

// Botón "aceptar" con efecto liquid glass verde. Solo presentación: la lógica queda en quien lo usa.
// size="compact": versión angosta para grillas de 2 columnas. flush: sin margen superior (dentro de diálogos).
export default function AcceptGlassButton({ label, price = null, onClick, disabled = false, size = 'full', flush = false }: {
  label: string; price?: number | null; onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean; size?: 'full' | 'compact'; flush?: boolean;
}) {
  return <span className={`zipco-accept-wrap${size === 'compact' ? ' zipco-accept-wrap--compact' : ''}${flush ? ' zipco-accept-wrap--flush' : ''}`}>
    <i className="zipco-accept-blob zipco-accept-b1" aria-hidden="true" />
    <i className="zipco-accept-blob zipco-accept-b2" aria-hidden="true" />
    <i className="zipco-accept-blob zipco-accept-b3" aria-hidden="true" />
    <button type="button" disabled={disabled} className="zipco-accept-btn" onClick={onClick}
      aria-label={price === null ? label : `${label} por $${price.toLocaleString('es-CL')}`}>
      <span className="zipco-accept-check" aria-hidden="true"><Check className="h-[18px] w-[18px]" strokeWidth={3} /></span>
      <span className="zipco-accept-label">{label}</span>
      {price !== null && <span className="zipco-accept-price">{`$${price.toLocaleString('es-CL')}`}</span>}
    </button>
  </span>;
}
