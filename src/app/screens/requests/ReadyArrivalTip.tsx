import { PackageCheck } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Globo "Tu pedido pasó a Listos" con flecha hacia arriba. Renderízalo COMO HIJO del chip "Listos" (el chip debe tener `position: relative`)
 * solo mientras `arrival.tip` sea true (ver useReadyTransitions). Queda centrado bajo el chip y se desvanece solo (CSS).
 *   <button className={`zipco-chip …${arrival.chipBump ? ' zipco-chip-bump' : ''}`}>Listos … {arrival.tip && <ReadyArrivalTip />}</button>
 * Si los chips están dentro de un contenedor con `overflow: hidden`, ponle `overflow: visible` o renderiza el globo en el contenedor de los chips.
 */
export default function ReadyArrivalTip() {
  const ref = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const position = () => {
      const tip = ref.current, parent = tip?.parentElement; if (!tip || !parent) return;
      const rect = parent.getBoundingClientRect(), center = rect.left + rect.width / 2;
      const half = tip.offsetWidth / 2;
      setShift(Math.min(Math.max(center, 8 + half), window.innerWidth - 8 - half) - center);
    };
    position(); window.addEventListener('resize', position);
    return () => window.removeEventListener('resize', position);
  }, []);
  return <span ref={ref} className="zipco-cp-tip" role="status" style={{ marginLeft:shift, ['--tip-shift' as string]:`${shift}px` }}><span className="tp"><PackageCheck size={13} strokeWidth={2.6} aria-hidden="true" /></span>Tu pedido pasó a <b>Listos</b></span>;
}
