// Decorative mark only. Contact authorization and WhatsApp navigation remain separate actions.
export default function WhatsAppMark({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" className={className}>
    <path d="M20.5 11.8a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.3-4.7a8.5 8.5 0 1 1 16.2-4Z"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m8 7.5 1.4-.2 1 2.3-.9 1.1c.7 1.5 1.8 2.6 3.3 3.3l1.1-.9 2.3 1-.2 1.4c-.1.8-.9 1.3-1.7 1.1-4-.9-7-3.9-7.9-7.9-.2-.8.3-1.6 1.1-1.7Z"
      fill="currentColor" />
  </svg>;
}
