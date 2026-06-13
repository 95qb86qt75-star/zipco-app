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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,200,184,0.14),transparent_36%),radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_44%)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 flex -translate-y-2 flex-col items-center px-8 text-center"
      >
        <img
          src={ZIPCO_LOGO_URL}
          alt="ZIPCO"
          className="w-[360px] max-w-[86vw] h-auto drop-shadow-[0_30px_60px_rgba(20,200,184,0.28)]"
        />

        <h1 className="mt-2 text-[72px] font-extrabold leading-none tracking-[0.16em] text-white drop-shadow-[0_8px_18px_rgba(255,255,255,0.16)]">
          ZIPCO
        </h1>
        <p className="mt-5 text-[28px] font-medium text-[#14C8B8]">
          Cerca de ti
        </p>

        <div
          className="mt-28 h-16 w-16 rounded-full p-1 animate-spin"
          style={{ background: 'conic-gradient(from 0deg, #14C8B8, #2D7CFF, #8B5CF6, transparent 72%)' }}
        >
          <div className="h-full w-full rounded-full bg-[#0B1A2E]" />
        </div>
      </motion.div>
    </div>
  );
}
