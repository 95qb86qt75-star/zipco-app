/**
 * Lógica PURA (sin React) de la hoja "Acuerdo completo": convierte las propuestas del proceso en las "rondas" de la línea de tiempo
 * (pedido original → propuesta del negocio → contrapropuesta del cliente → propuesta final del negocio) y deduce quién aceptó.
 * Vista del NEGOCIO (los textos están escritos en segunda persona: "Tú propusiste", "Tu final").
 * Si algún nombre de campo difiere del contrato real (`proposalContract.ts`), se corrige SOLO aquí.
 */
import type { Proposal } from './proposalContract';
import type { AgreementReadDto } from './agreement';
export type ProposalLike = Proposal;
export type Side = 'client' | 'business';
export type Change = { label: string; from: string; to: string };
export type Round = {
  key: string; side: Side; label: string; time: string;
  /** Línea resumen cuando la ronda está cerrada: la primera ronda muestra el pedido; las demás, el/los cambio(s). */
  headline: { kind: 'order'; title: string; price: string; when: string } | { kind: 'changes'; changes: Change[] } | { kind: 'same' };
  message: string | null; kept: string[]; photo: unknown | null; accepted: boolean;
  details: string[];
};
export type Timeline = {
  rounds: Round[]; who: string; marker: string; section: string; count: string;
  /** Datos del acuerdo final (tarjeta resumen). */
  final: { title: string; price: string; unit: string | null; quantity: number | null; when: string };
};

export const TZ = 'America/Santiago';
export const KEPT_FIELDS = ['Cantidad', 'Precio / unidad', 'Producto', 'Descripción'] as const;
export const money = (value: number) => `$${value.toLocaleString('es-CL')}`;
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const dayOf = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { timeZone: TZ, day: 'numeric', month: 'short' }).replace('.', '');
/** "26 oct · 6:25 a. m." */
export const whenOf = (iso: string) => `${dayOf(iso)} · ${timeOf(iso)}`;
const slot = (p: Pick<ProposalLike, 'subjectSnapshot' | 'scheduledFor'>, asapWord: string) => p.subjectSnapshot.needNow ? asapWord : p.scheduledFor ? whenOf(p.scheduledFor) : 'Sin horario acordado';
const titleOf = (p: ProposalLike) => {
  const items = p.subjectSnapshot.items; const service = p.subjectSnapshot.orderType === 'service';
  return items.length === 1 ? `${service ? '' : `${items[0].quantity}× `}${items[0].nameSnapshot}` : `${items.length} productos`;
};

/** Cambios de `cur` respecto de `prev`. Lo que no cambió se devuelve en `kept` (chips "Se mantuvo"). */
export function diffProposals(prev: ProposalLike, cur: ProposalLike): { changes: Change[]; kept: string[] } {
  const changes: Change[] = [];
  const a = prev.subjectSnapshot.items; const b = cur.subjectSnapshot.items;
  const sameShape = a.length === b.length;
  const dropped = new Set<string>();
  if (slot(prev, 'Ahora') !== slot(cur, 'Ahora')) changes.push({ label: 'Disponibilidad', from: slot(prev, 'Ahora'), to: slot(cur, 'Ahora') });
  if (!sameShape) { changes.push({ label: 'Productos', from: titleOf(prev), to: titleOf(cur) }); KEPT_FIELDS.forEach(k => dropped.add(k)); }
  else for (let index = 0; index < a.length; index++) {
    const x = a[index]; const y = b[index];
    const line = a.length > 1 ? ` (${index + 1})` : '';
    if (x.quantity !== y.quantity) { changes.push({ label: `Cantidad${line}`, from: String(x.quantity), to: String(y.quantity) }); dropped.add('Cantidad'); }
    if ((x.unitPriceClpSnapshot ?? null) !== (y.unitPriceClpSnapshot ?? null)) {
      changes.push({ label: `Precio / unidad${line}`, from: x.unitPriceClpSnapshot === null ? 'Precio por línea' : money(x.unitPriceClpSnapshot), to: y.unitPriceClpSnapshot === null ? 'Precio por línea' : money(y.unitPriceClpSnapshot) }); dropped.add('Precio / unidad');
    }
    if (x.nameSnapshot !== y.nameSnapshot || x.catalogItemId !== y.catalogItemId || x.source !== y.source) { changes.push({ label: `Producto${line}`, from: x.nameSnapshot, to: y.nameSnapshot }); dropped.add('Producto'); }
    if ((x.descriptionSnapshot ?? '') !== (y.descriptionSnapshot ?? '')) { changes.push({ label: `Descripción${line}`, from: x.descriptionSnapshot || 'Sin descripción', to: y.descriptionSnapshot || 'Sin descripción' }); dropped.add('Descripción'); }
    if (x.subtotalClp !== y.subtotalClp && x.unitPriceClpSnapshot === null && y.unitPriceClpSnapshot === null)
      changes.push({ label: `Precio por línea${line}`, from: money(x.subtotalClp), to: money(y.subtotalClp) });
  }
  if (prev.totalPriceClp !== cur.totalPriceClp && !changes.some(c => c.label === 'Precio / unidad')) changes.push({ label: 'Precio total', from: money(prev.totalPriceClp), to: money(cur.totalPriceClp) });
  return { changes, kept: KEPT_FIELDS.filter(k => !dropped.has(k)) };
}

const LABELS: Record<number, [Side, string]> = { 0: ['client', 'El cliente pidió'], 1: ['business', 'Tú propusiste'], 2: ['client', 'El cliente contrapone'], 3: ['business', 'Tu final'] };

/** Links normalized history to acceptedProposalId and the immutable agreement. */
export function buildTimeline(all: ProposalLike[], accepted: AgreementReadDto): Timeline | null {
  const chosen = all.find(p => p.id === accepted.acceptedProposalId);
  if (!chosen || chosen.totalPriceClp !== accepted.totalPriceClp || chosen.scheduledFor !== accepted.scheduledFor ||
    chosen.subjectSchemaVersion !== accepted.subjectSchemaVersion || chosen.subjectSnapshot.note !== accepted.subjectSnapshot.note ||
    chosen.subjectSnapshot.referencePhoto !== accepted.subjectSnapshot.referencePhoto ||
    chosen.subjectSnapshot.proposalMessage !== (accepted.subjectSnapshot.proposalMessage ?? '') ||
    chosen.subjectSnapshot.proposalPhoto !== (accepted.subjectSnapshot.proposalPhoto ?? null) ||
    chosen.subjectSnapshot.orderType !== accepted.subjectSnapshot.orderType || chosen.subjectSnapshot.needNow !== accepted.subjectSnapshot.needNow ||
    chosen.subjectSnapshot.items.length !== accepted.subjectSnapshot.items.length ||
    chosen.subjectSnapshot.items.some((item, i) => {
      const other = accepted.subjectSnapshot.items[i];
      return item.catalogItemId !== other.catalogItemId || item.quantity !== other.quantity || item.nameSnapshot !== other.nameSnapshot ||
        item.descriptionSnapshot !== other.descriptionSnapshot || item.unitPriceClpSnapshot !== other.unitPriceClpSnapshot || item.subtotalClp !== other.subtotalClp;
    })) throw new Error('El historial no corresponde al acuerdo aceptado');
  const sorted = all.filter(p => p.sequence <= chosen.sequence).sort((x, y) => x.sequence - y.sequence);
  if (!sorted.length || sorted[0].type !== 'ORIGINAL_REQUEST') throw new Error('Historial incompleto');
  const last = sorted[sorted.length - 1];
  const rounds: Round[] = sorted.map((p, i) => {
    const side = p.authorActor === 'CUSTOMER' ? 'client' : 'business';
    const label = LABELS[p.sequence][1];
    const snap = p.subjectSnapshot;
    const details = snap.items.map(item => `${item.quantity}× ${item.nameSnapshot} · ${item.descriptionSnapshot || 'Sin descripción'} · ${item.unitPriceClpSnapshot === null ? 'Precio total de esta línea' : `${money(item.unitPriceClpSnapshot)} por unidad`} · Subtotal ${money(item.subtotalClp)}`);
    const message = (i === 0 ? snap.note : snap.proposalMessage ?? snap.note) || null;
    if (i === 0) return { key: `p${p.id}`, side, label, time: timeOf(p.createdAt), message, kept: [], photo: snap.referencePhoto ?? null, accepted: p === last, details,
      headline: { kind: 'order', title: titleOf(p), price: money(p.totalPriceClp), when: slot(p, 'Lo antes posible') } };
    const { changes, kept } = diffProposals(sorted[i - 1], p);
    return { key: `p${p.id}`, side, label, time: timeOf(p.createdAt), message, kept, photo: snap.proposalPhoto ?? null, accepted: p === last, details,
      headline: changes.length ? { kind: 'changes', changes } : { kind: 'same' } };
  });
  const clientProposed = last.authorActor === 'CUSTOMER';
  const acceptedAt = clientProposed ? accepted.businessAcceptedAt : accepted.customerAcceptedAt;
  const who = last.sequence === 0 ? 'Tú aceptaste el pedido tal como se pidió' : last.sequence === 2 ? 'Tú aceptaste la contrapropuesta'
    : last.sequence === 3 ? 'El cliente aceptó tu propuesta final' : 'El cliente aceptó tu propuesta';
  const item = last.subjectSnapshot.items.length === 1 ? last.subjectSnapshot.items[0] : null;
  return {
    rounds, who,
    marker: `${clientProposed ? 'Tú aceptaste' : 'El cliente aceptó'}${acceptedAt ? ` · ${timeOf(acceptedAt)}` : ''}`,
    section: rounds.length === 1 ? 'Pedido del cliente' : 'Cómo llegaron al acuerdo',
    count: rounds.length === 1 ? 'Sin cambios' : `${rounds.length} propuestas`,
    final: { title: titleOf(last), price: money(last.totalPriceClp), quantity: item?.quantity ?? null,
      unit: item?.unitPriceClpSnapshot != null ? `${money(item.unitPriceClpSnapshot)} c/u` : null, when: slot(last, 'Lo antes posible') },
  };
}
