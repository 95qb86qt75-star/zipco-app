import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Image as ImageIcon, X } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

// Shared reference-photo CTA and viewer extracted from BusinessOrderCard.
// Profile images never enter this component.
function renderPhotoPortal({ nested, open, setOpen, children }: { nested: boolean; open: boolean; setOpen: (open: boolean) => void; children: ReactNode }) {
  return nested ? <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal>{children}</Dialog.Portal></Dialog.Root> : createPortal(children, document.body);
}
function PhotoContent({ nested, children }: { nested: boolean; children: ReactNode }) {
  return nested ? <Dialog.Content asChild aria-describedby={undefined}>{children}</Dialog.Content> : <>{children}</>;
}
export default function OrderReferencePhoto({ src, business = true, title = 'Imagen adjunta', caption, nestedDialog = false, compact = false }: {
  src: string | null; business?: boolean; title?: string; caption?: string; nestedDialog?: boolean; compact?: boolean;
}) {
  const [showPhoto, setShowPhoto] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!showPhoto || !src) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Tab') return;
      event.preventDefault(); event.stopPropagation();
      if (event.key === 'Escape') setShowPhoto(false);
      else closeButton.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [showPhoto, src]);
  if (!src) return null;
  return <>
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        setShowPhoto(true);
      }}
      className={`group relative flex w-full items-center overflow-hidden rounded-[16px] border border-cyan-300/70 bg-gradient-to-r from-cyan-50 via-white to-teal-50 text-left shadow-[0_6px_18px_rgba(34,211,238,0.13)] transition active:scale-[0.98] dark:border-cyan-400/30 dark:from-cyan-400/10 dark:via-slate-900 dark:to-teal-400/10 ${compact ? 'mt-1 min-h-11 gap-2 px-2 py-1' : 'mt-3 min-h-14 gap-3 px-3'}`}
    >
      <span className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-cyan-200/20 to-transparent dark:via-cyan-300/5" />
      <motion.span
        aria-hidden="true"
        animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white shadow-[0_0_16px_rgba(34,211,238,0.55)] ${compact ? 'h-8 w-8' : 'h-10 w-10'}`}
      >
        <ImageIcon className="h-5 w-5" />
      </motion.span>
      <span className="relative min-w-0 flex-1">
        <strong className={`block font-black text-slate-900 dark:text-white ${compact ? 'text-xs' : 'text-sm'}`}>
          {title}
        </strong>
        <span className={`block text-slate-500 dark:text-slate-300 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {caption ?? (business ? 'El cliente agregó una foto de referencia.' : 'Agregaste una foto de referencia.')}
        </span>
      </span>
      <span className="relative shrink-0 rounded-full bg-teal-500 px-3 py-1.5 text-xs font-black text-white shadow-sm transition-transform group-hover:scale-105">
        Abrir
      </span>
    </button>
    {typeof document !== 'undefined' && renderPhotoPortal({ nested: nestedDialog, open: showPhoto, setOpen: setShowPhoto, children: <AnimatePresence>
      {showPhoto && src && (
        <PhotoContent nested={nestedDialog}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex h-[100dvh] flex-col bg-slate-950/95 px-4 backdrop-blur-md"
          style={{ ...(nestedDialog ? { zIndex: 1100 } : {}), paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          onClick={(event) => { event.stopPropagation(); setShowPhoto(false); }}
          role="dialog"
          aria-modal="true"
          aria-label={caption ? title : business ? 'Imagen adjunta por el cliente' : 'Imagen adjunta por ti'}
        >
          <div
            className="relative z-10 flex shrink-0 items-center justify-between gap-3 pb-3 text-white"
          >
            <div>
              <strong className="block text-base font-black">
                {nestedDialog ? <Dialog.Title asChild><span>{title}</span></Dialog.Title> : title}
              </strong>
              <span className="text-xs text-slate-300">
                {caption ?? (business ? 'Foto de referencia del cliente' : 'Tu foto de referencia')}
              </span>
            </div>
            <button
              type="button"
              ref={closeButton}
              onClick={(event) => { event.stopPropagation(); setShowPhoto(false); }}
              aria-label="Cerrar imagen"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-black/30"
            onClick={(event) => event.stopPropagation()}
          >
            <ImageWithFallback
              src={src}
              alt={caption ? title : 'Foto de referencia'}
              className="max-h-full max-w-full object-contain"
            />
          </motion.div>
          <p className="shrink-0 pt-3 text-center text-xs text-slate-400">
            Toca fuera de la imagen para cerrar.
          </p>
        </motion.div>
        </PhotoContent>
      )}
    </AnimatePresence> })}
  </>;
}
