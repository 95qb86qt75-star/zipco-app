import { Bell, BellOff, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { enablePushNotifications, getExistingPushSubscription, getPushSupport } from './pushNotifications';

type State = 'checking' | 'unsupported' | 'blocked' | 'inactive' | 'active' | 'saving';

export default function NotificationPermissionCard() {
  const [state, setState] = useState<State>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    if (getPushSupport() === 'unsupported') {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('blocked');
      return;
    }
    void getExistingPushSubscription().then((subscription) => {
      setState(subscription ? 'active' : 'inactive');
      const token = localStorage.getItem('zipco-token');
      if (subscription && token) void enablePushNotifications(token).catch(() => undefined);
    }).catch(() => setState('inactive'));
  }, []);

  const activate = async () => {
    const token = localStorage.getItem('zipco-token');
    if (!token) return;
    setState('saving');
    setError('');
    try {
      await enablePushNotifications(token);
      setState('active');
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : '';
      if (reason === 'permission-denied') setState('blocked');
      else {
        setState('inactive');
        setError('No pudimos activar las notificaciones. Intenta nuevamente.');
      }
    }
  };

  if (state === 'checking') return null;
  if (state === 'active') {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
        <div><p className="text-sm font-bold text-teal-900">Notificaciones activadas</p><p className="mt-1 text-xs text-teal-700">Te avisaremos cuando llegue un pedido nuevo.</p></div>
      </div>
    );
  }

  const unavailable = state === 'unsupported' || state === 'blocked';
  return (
    <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
      <div className="flex items-start gap-3">
        {unavailable ? <BellOff className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" /> : <Bell className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-violet-950">Avisos de pedidos nuevos</p>
          <p className="mt-1 text-xs leading-4 text-violet-800">
            {state === 'unsupported' && 'Instala ZIPCO en la pantalla de inicio para recibir avisos en este dispositivo.'}
            {state === 'blocked' && 'Las notificaciones estan bloqueadas. Habilitalas desde los ajustes del dispositivo.'}
            {!unavailable && 'Activalos para recibir avisos incluso cuando uses otra aplicacion.'}
          </p>
          {!unavailable && <button type="button" onClick={activate} disabled={state === 'saving'} className="mt-3 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{state === 'saving' ? 'Activando...' : 'Activar notificaciones'}</button>}
          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
