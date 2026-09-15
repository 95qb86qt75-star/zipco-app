import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Info, X } from 'lucide-react';
import { motion } from 'motion/react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastOptions = {
  title?: string;
  description?: string;
  dedupeKey?: string;
  durationMs?: number;
  icon?: 'bell';
};

export type ToastNotification = {
  message: string;
  type: ToastType;
  title?: string;
  description?: string;
  dedupeKey: string;
  durationMs: number;
  icon?: 'bell';
};

export function createToastNotification(message: string, type: ToastType = 'success', options: ToastOptions = {}): ToastNotification {
  return {
    message,
    type,
    title: options.title,
    description: options.description,
    dedupeKey: options.dedupeKey ?? `${type}:${options.title ?? ''}:${options.description ?? ''}:${message}`,
    durationMs: options.durationMs ?? (options.title || options.description ? 5000 : 3000),
    icon: options.icon
  };
}

export function mergeToastNotification(current: ToastNotification | null, next: ToastNotification): ToastNotification {
  return current?.dedupeKey === next.dedupeKey ? current : next;
}

export function showAppToast(message: string, type: ToastType = 'success', options: ToastOptions = {}) {
  window.dispatchEvent(new CustomEvent('zipco-toast', {
    detail: createToastNotification(message, type, options)
  }));
}

export default function Toast({ notification, onClose }: { notification: ToastNotification; onClose: () => void }) {
  const { message, type, title, description, durationMs, icon } = notification;
  const [isLeaving, setIsLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef(durationMs);
  const startedAtRef = useRef(Date.now());
  const isLeavingRef = useRef(false);
  const displayTitle = title || message;
  const tone = {
    success: { line: 'bg-teal-400', circle: 'bg-teal-50 text-teal-600', border: 'border-teal-100' },
    error: { line: 'bg-red-500', circle: 'bg-red-50 text-red-600', border: 'border-red-100' },
    warning: { line: 'bg-amber-500', circle: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
    info: { line: 'bg-sky-500', circle: 'bg-sky-50 text-sky-600', border: 'border-sky-100' }
  }[type];
  const TypeIcon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertTriangle : type === 'warning' ? AlertTriangle : Info;

  const beginClose = useCallback(() => {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;
    setIsLeaving(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    exitTimerRef.current = setTimeout(onClose, 180);
  }, [onClose]);

  const startTimer = useCallback(() => {
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(beginClose, remainingRef.current);
  }, [beginClose]);

  useEffect(() => {
    remainingRef.current = durationMs;
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [durationMs, startTimer]);

  const pauseTimer = () => {
    if (!timerRef.current || isLeaving) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
  };

  const resumeTimer = () => {
    if (timerRef.current || isLeaving) return;
    startTimer();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: isLeaving ? 0 : 1, y: isLeaving ? -8 : 0, scale: isLeaving ? 0.98 : 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="pointer-events-none fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[9999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div
          className={`pointer-events-auto relative overflow-hidden rounded-2xl border bg-white px-4 py-3 pr-12 shadow-[0_10px_30px_rgba(15,23,42,0.14)] ${tone.border}`}
          onMouseEnter={pauseTimer}
          onMouseLeave={resumeTimer}
        >
          <span className={`absolute inset-y-0 left-0 w-1.5 ${tone.line}`} />
          <div className="flex min-w-0 items-start gap-3 pl-1">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.circle}`}>
              {icon === 'bell' ? <Bell className="h-5 w-5" /> : <TypeIcon className="h-5 w-5" />}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-extrabold leading-5 text-slate-950">{displayTitle}</p>
              {description && <p className="mt-0.5 text-xs leading-4 text-slate-500">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={beginClose}
            aria-label="Cerrar notificación"
            className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
    </motion.div>
  );
}
