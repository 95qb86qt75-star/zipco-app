import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

export default function DistanceInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, showBelow: false });
  const containerRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const buttonRect = buttonRef.current?.getBoundingClientRect();
      if (!buttonRect) return;

      const popoverWidth = 224;
      const viewportPadding = 12;
      const left = Math.min(
        Math.max(viewportPadding, buttonRect.right - popoverWidth),
        window.innerWidth - popoverWidth - viewportPadding
      );

      setPosition({
        left,
        top: buttonRect.top < 100 ? buttonRect.bottom + 8 : buttonRect.top - 8,
        showBelow: buttonRect.top < 100
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    updatePosition();
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const stopNavigation = (event: SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <span
      ref={containerRef}
      className="relative inline-flex shrink-0"
      onClick={stopNavigation}
      onPointerDown={stopNavigation}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label="Información sobre la distancia"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14C8B8]/50"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          role="tooltip"
          className={`fixed z-[100] w-56 rounded-lg bg-slate-950 px-3 py-2 text-left text-xs font-medium leading-relaxed text-white shadow-xl ${
            position.showBelow ? '' : '-translate-y-full'
          }`}
          style={{ left: position.left, top: position.top }}
          onClick={stopNavigation}
          onPointerDown={stopNavigation}
        >
          Distancia aproximada en línea recta. El trayecto real puede ser mayor.
        </div>,
        document.body
      )}
    </span>
  );
}
