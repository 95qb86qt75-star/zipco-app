import { ImageIcon } from "lucide-react";
import { motion } from "motion/react";

export default function AnimatedPhotoIcon() {
  return (
    <motion.span
      animate={{
        scale: [1, 1.08, 1],
        boxShadow: [
          "0 0 0 0 rgba(124,58,237,0)",
          "0 0 0 7px rgba(124,58,237,0.12)",
          "0 0 0 0 rgba(124,58,237,0)",
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
      className="zipco-animated-photo-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white"
    >
      <ImageIcon className="h-5 w-5" />
    </motion.span>
  );
}
