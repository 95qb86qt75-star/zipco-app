export type ToastType = 'success' | 'error';

export function showAppToast(message: string, type: ToastType = 'success') {
  window.dispatchEvent(new CustomEvent('zipco-toast', { detail: { message, type } }));
}

export default function Toast({ message, type }: { message: string; type: ToastType }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md pointer-events-none">
      <div
        className={`rounded-2xl px-5 py-3 text-white text-sm font-semibold shadow-2xl ${
          type === 'success' ? 'bg-[#00BFA5]' : 'bg-[#EF4444]'
        }`}
      >
        {message}
      </div>
    </div>
  );
}
