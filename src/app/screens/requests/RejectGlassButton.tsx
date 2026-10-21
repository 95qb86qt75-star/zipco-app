import type { MouseEvent } from 'react';
import { X } from 'lucide-react';

// Botón "Rechazar solicitud" con efecto liquid glass rojo. Solo presentación:
// la lógica (onClick, disabled, estados) sigue en quien lo usa.
export default function RejectGlassButton({ label = 'Rechazar solicitud', onClick, disabled = false }: {
  label?: string; onClick: (event: MouseEvent<HTMLButtonElement>) => void; disabled?: boolean;
}) {
  return <span className="zipco-reject-wrap">
    <i className="zipco-reject-blob zipco-reject-b1" aria-hidden="true" />
    <i className="zipco-reject-blob zipco-reject-b2" aria-hidden="true" />
    <i className="zipco-reject-blob zipco-reject-b3" aria-hidden="true" />
    <button type="button" disabled={disabled} className="zipco-reject-btn" onClick={onClick}>
      <span className="zipco-reject-icon" aria-hidden="true"><X className="h-[17px] w-[17px]" strokeWidth={3} /></span>
      <span className="zipco-reject-label">{label}</span>
    </button>
  </span>;
}
