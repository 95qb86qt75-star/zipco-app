import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, CalendarDays, ClipboardList, Heart, Home, ShoppingBag, Store, Trash2, UserRound } from 'lucide-react';
import { AvailableRequestDesign, BusinessDesignActions, ConfirmAvailabilityDesign, ConsultationDesignSheet, DesignConfirmation, PendingRequestDesign, type RequestDesignData } from '../app/screens/requests/availability-design/AvailabilityDesign';
import '../styles/index.css';
import './availability-preview.css';

const query = new URLSearchParams(location.search);
const screen = ['1', '2', '3', '4', '5'].includes(query.get('screen') ?? '') ? query.get('screen')! : '1';
const business = screen === '3' || screen === '4';
const pickup = query.get('path') === 'pickup';
const example: RequestDesignData = {
  counterpart: business ? 'Usuario Pauta QA' : 'ZIPCO Negocio QA',
  items: [{ name: query.has('long') ? 'Producto de ejemplo con un nombre muy largo para revisar cómo se adapta la tarjeta' : 'Producto QA', quantity: 1, unitPrice: 12000 }],
  total: 12000, immediate: screen !== '2', schedule: screen === '2' ? '25 oct · 12:20' : 'Ahora',
  ...(query.has('detail') ? { note: 'Esta es una nota de ejemplo para revisar el detalle completo de la solicitud.' } : {}),
};

function Preview() {
  const [expanded, setExpanded] = useState(query.has('expanded') || screen === '5');
  const [contact, setContact] = useState(query.get('contact') !== '0');
  const [sheet, setSheet] = useState(screen === '1');
  const [availability, setAvailability] = useState(screen === '4');
  const [cancel, setCancel] = useState(false), [decline, setDecline] = useState(false);
  const [notice, setNotice] = useState('');
  const finish = (action: string) => {
    setSheet(false); setAvailability(false);
    setNotice(`Vista de diseño: ${action}. No se guardaron cambios ni se compartieron teléfonos.`);
  };
  return <div className="zipco-av-preview">
    <aside className="zipco-av-preview-warning">Diseño en revisión · Datos de ejemplo · Sin conexión al backend</aside>
    <main className="zipco-av-preview-phone">
      <header className="zipco-av-preview-heading"><ArrowLeft aria-hidden="true" /><h1>{screen === '1' ? 'Resumen del pedido' : 'Solicitudes'}</h1></header>
      <div className="zipco-av-preview-account"><ShoppingBag /><div><b>{business ? 'Mi Negocio' : 'Mis Pedidos'}</b><small>Revisa y gestiona tus solicitudes</small></div></div>
      {screen === '1' ? <section className="zipco-av-preview-checkout"><h2>Productos seleccionados</h2><div className="zipco-av-preview-product"><ShoppingBag /><div><b>Producto QA</b><p>$12.000</p></div></div><hr /><p>Cantidad <b>1</b></p><p>Subtotal <b>$12.000</b></p><h3>¿Cuándo lo necesitas?</h3><p>⚡ Ahora</p><button type="button" className="zipco-av-primary" onClick={() => setSheet(true)}>Requiero este producto</button></section> : <>
        <nav className="zipco-av-preview-tabs" aria-label="Categoría de la vista de diseño">
          {['Pendientes', business ? 'Esperando respuesta' : 'Por responder', 'En curso', 'Historial'].map((label, index) => <span key={label} aria-current={(screen === '5' ? index === 1 : index === 0) ? 'page' : undefined}>{label}<b>{index === (screen === '5' ? 1 : 0) ? 1 : 0}</b></span>)}
        </nav>
        <p className="zipco-av-preview-date"><CalendarDays />24 oct. 2026, 04:35 p. m.<span /></p>
        {screen === '5' ? <AvailableRequestDesign data={example} expanded={expanded} onToggle={() => setExpanded(!expanded)}
          {...(pickup ? { pickup: { message: 'Acércate al local a pagar y retirar.', scheduleOrAddress: query.has('noSchedule') ? '' : 'Hasta las 19:00', allowsContact: query.get('businessContact') !== '0' } } : {})}
          contact={contact} onContactChange={setContact} onContinue={() => finish(contact ? 'decisión de continuar preparada para revisión' : 'decisión de continuar sin autorizar contacto preparada para revisión')}
          onDecline={() => setDecline(true)} /> : <PendingRequestDesign data={example} business={business} expanded={expanded} onToggle={() => setExpanded(!expanded)}
          contactIntent={query.has('unknownContact') ? undefined : contact}
          actions={business ? <BusinessDesignActions data={example} onConfirm={() => setAvailability(true)} onAlternative={() => finish('se conserva el camino de alternativas, pendiente de adaptar al contrato nuevo')} onReject={() => finish('se conserva el rechazo con motivo existente')} />
            : <button type="button" className="zipco-av-cancel" onClick={() => setCancel(true)}><Trash2 />Anular solicitud</button>} />}
      </>}
      {notice && <p role="status" className="zipco-av-preview-notice">{notice}</p>}
      <footer className="zipco-av-preview-bottom">{[[Home, 'Inicio'], [UserRound, 'Perfil'], [Heart, 'Favoritos'], [ClipboardList, 'Solicitudes']].map(([Icon, label]) => {
        const Symbol = Icon as typeof Store;
        return <span key={String(label)}><Symbol aria-hidden="true" /><small>{String(label)}</small></span>;
      })}</footer>
    </main>
    <ConsultationDesignSheet open={sheet} onOpenChange={setSheet} data={example} contact={contact} onContactChange={setContact} onSend={() => finish('envío preparado para revisión')} />
    <ConfirmAvailabilityDesign open={availability} onOpenChange={setAvailability} initialStep={pickup ? 'pickup' : 'choice'} onChoose={choice => finish(choice.channel === 'whatsapp' ? 'disponibilidad por WhatsApp preparada para revisión' : `retiro preparado: ${choice.instructions.message}`)} />
    <DesignConfirmation open={cancel} onOpenChange={setCancel} title="¿Confirmas anulación de tu pedido?" description="La solicitud se conservará en Historial." confirmLabel="Sí" cancelLabel="No" onConfirm={() => finish('anulación preparada para revisión')} />
    <DesignConfirmation open={decline} onOpenChange={setDecline} title="¿No continuar con la compra?" description="Se cerrará la solicitud y pasará a Historial." confirmLabel="Sí, cerrar" onConfirm={() => finish('cierre preparado para revisión')} />
  </div>;
}

export function mountAvailabilityDesign() { createRoot(document.getElementById('root')!).render(<Preview />); }
