import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Image as ImageIcon, X } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

// Shared reference-photo CTA and viewer extracted from BusinessOrderCard.
// Profile images never enter this component.
export default function OrderReferencePhoto({ src, business = true }: { src: string | null; business?: boolean }) {
  const [showPhoto, setShowPhoto] = useState(false);
  if (!src) return null;
  return <>
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        setShowPhoto(true);
      }}
      className="group relative mt-3 flex min-h-14 w-full items-center gap-3 overflow-hidden rounded-[16px] border border-cyan-300/70 bg-gradient-to-r from-cyan-50 via-white to-teal-50 px-3 text-left shadow-[0_6px_18px_rgba(34,211,238,0.13)] transition active:scale-[0.98] dark:border-cyan-400/30 dark:from-cyan-400/10 dark:via-slate-900 dark:to-teal-400/10"
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
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white shadow-[0_0_16px_rgba(34,211,238,0.55)]"
      >
        <ImageIcon className="h-5 w-5" />
      </motion.span>
      <span className="relative min-w-0 flex-1">
        <strong className="block text-sm font-black text-slate-900 dark:text-white">
          Imagen adjunta
        </strong>
        <span className="block text-xs text-slate-500 dark:text-slate-300">
          {business ? 'El cliente agregó una foto de referencia.' : 'Agregaste una foto de referencia.'}
        </span>
      </span>
      <span className="relative shrink-0 rounded-full bg-teal-500 px-3 py-1.5 text-xs font-black text-white shadow-sm transition-transform group-hover:scale-105">
        Abrir
      </span>
    </button>
    <AnimatePresence>
      {showPhoto && src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 p-4 backdrop-blur-md"
          onClick={(event) => { event.stopPropagation(); setShowPhoto(false); }}
          role="dialog"
          aria-modal="true"
          aria-label={business ? 'Imagen adjunta por el cliente' : 'Imagen adjunta por ti'}
        >
          <div
            className="flex items-center justify-between gap-3 pb-3 text-white"
            style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
          >
            <div>
              <strong className="block text-base font-black">
                Imagen adjunta
              </strong>
              <span className="text-xs text-slate-300">
                {business ? 'Foto de referencia del cliente' : 'Tu foto de referencia'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPhoto(false)}
              aria-label="Cerrar imagen"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white active:scale-95"
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
              alt="Foto de referencia"
              className="max-h-full max-w-full object-contain"
            />
          </motion.div>
          <p className="pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-3 text-center text-xs text-slate-400">
            Toca fuera de la imagen para cerrar.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </>;
}
