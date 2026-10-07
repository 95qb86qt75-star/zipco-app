import { X } from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";

type ViewProps = {
  photoUrl: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function ProposalPhotoAttachmentView({
  photoUrl,
  isOpen,
  onOpen,
  onClose,
}: ViewProps) {
  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
        className="mt-2.5 flex min-h-16 w-full items-center gap-3 overflow-hidden rounded-[16px] border border-violet-300 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-cyan-50 p-2.5 text-left shadow-[0_7px_20px_rgba(124,58,237,0.13)] dark:border-violet-500/60 dark:from-violet-950/80 dark:via-fuchsia-950/70 dark:to-cyan-950/70"
      >
        <ImageWithFallback
          src={photoUrl}
          alt="Foto de la propuesta"
          className="h-14 w-14 shrink-0 rounded-xl object-cover"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-violet-950 dark:text-violet-100">
            Foto de la propuesta
          </span>
          <span className="mt-0.5 block text-[11px] leading-4 text-violet-700 dark:text-violet-200">
            El negocio adjuntó una imagen de su alternativa
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-black text-violet-700 shadow-sm dark:bg-slate-900/80 dark:text-violet-200">
          Abrir
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto de la propuesta"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative flex max-h-full w-full max-w-lg items-center justify-center"
          >
            <ImageWithFallback
              src={photoUrl}
              alt="Foto ampliada de la propuesta"
              className="max-h-[82vh] w-auto max-w-full rounded-[20px] object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
              className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/75 text-white shadow-lg backdrop-blur"
              aria-label="Cerrar foto de la propuesta"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function ProposalPhotoAttachment({
  photoUrl,
}: {
  photoUrl: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!photoUrl) return null;

  return (
    <ProposalPhotoAttachmentView
      photoUrl={photoUrl}
      isOpen={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
    />
  );
}
