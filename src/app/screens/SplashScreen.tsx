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
    <div className="size-full overflow-hidden bg-[#0B1A2E] flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,200,184,0.14),transparent_38%),radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_42%)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center px-8 text-center"
      >
        <img
          src={ZIPCO_LOGO_URL}
          alt="ZIPCO"
          className="w-[240px] max-w-[68vw] h-auto drop-shadow-[0_24px_48px_rgba(20,200,184,0.24)]"
        />

        <h1 className="mt-10 text-[42px] font-bold leading-none tracking-[0.18em] text-white">
          ZIPCO
        </h1>
        <p className="mt-5 text-[20px] font-medium text-[#14C8B8]">
          Cerca de ti
        </p>

        <div className="mt-20 h-14 w-14 rounded-full border-4 border-[#14C8B8]/20 border-t-[#14C8B8] animate-spin" />
      </motion.div>
    </div>
  );
}
