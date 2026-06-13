import { useEffect } from 'react';
import { motion } from 'motion/react';

const ZIPCO_LOGO_URL =
  'https://res.cloudinary.com/dr6xu5xr9/image/upload/v1781393850/94FD7809-C5D5-4AC1-ADC5-74774F9CB447_nmps4i.png';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="size-full overflow-hidden bg-[#050D1A] flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0D2137_0%,#09172A_48%,#050D1A_100%)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 flex min-h-full flex-col items-center justify-center px-8 text-center"
      >
        <div className="flex flex-col items-center">
          <img
            src={ZIPCO_LOGO_URL}
            alt="ZIPCO"
            className="w-[220px] h-auto drop-shadow-[0_24px_48px_rgba(20,200,184,0.24)]"
          />

          <h1 className="mt-10 text-[48px] font-bold leading-none tracking-[0.22em] text-white">
            ZIPCO
          </h1>
          <p className="mt-4 text-[18px] font-medium text-[#14C8B8]">
            Cerca de ti
          </p>
        </div>

        <div
          className="absolute bottom-16 h-10 w-10 rounded-full border-4 border-[#14C8B8]/20 border-t-[#14C8B8] animate-spin"
          aria-label="Cargando"
        >
        </div>
      </motion.div>
    </div>
  );
}
