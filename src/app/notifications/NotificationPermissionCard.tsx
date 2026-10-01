import { Bell, BellOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { enablePushNotifications, getExistingPushSubscription, getPushSupport } from './pushNotifications';
import { showAppToast } from '../screens/Toast';

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
      showAppToast('', 'success', { title: 'Notificaciones activadas', description: 'Podrás desactivarlas desde la pantalla de Inicio.', icon: 'bell', durationMs: 4500 });
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
  if (state === 'active') return null;

  const unavailable = state === 'unsupported' || state === 'blocked';
  return (
    <div className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
      <div className="flex items-start gap-3">
        {unavailable ? <BellOff className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" /> : <Bell className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-violet-950">Avisos de pedidos y cotizaciones</p>
          <p className="mt-1 text-xs leading-4 text-violet-800">
            {state === 'unsupported' && 'Instala ZIPCO en la pantalla de inicio para recibir avisos en este dispositivo.'}
            {state === 'blocked' && 'Las notificaciones estan bloqueadas. Habilitalas desde los ajustes del dispositivo.'}
            {!unavailable && 'Activalos para recibir avisos importantes incluso cuando uses otra aplicacion.'}
          </p>
          {!unavailable && <button type="button" onClick={activate} disabled={state === 'saving'} className="mt-3 rounded-xl bg-violet-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{state === 'saving' ? 'Activando...' : 'Activar notificaciones'}</button>}
          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
