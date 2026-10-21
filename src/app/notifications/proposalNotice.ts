import type { ProcessOrder } from '../screens/requests/requestProcess';
export function proposalNotice(order: { id: number } & ProcessOrder, business: boolean) {
  const p = order.requestProcess;
  if (!p?.proposalSummary) return null;
  let action = '', title = '';
  if (!business && p.state === 'AWAITING_CUSTOMER_DECISION') { action = 'PROPOSE_ALTERNATIVE'; title = 'Nueva alternativa del negocio'; }
  if (!business && p.state === 'AWAITING_CUSTOMER_FINAL_DECISION') { action = 'PROPOSE_FINAL'; title = 'Nueva propuesta final del negocio'; }
  if (business && p.state === 'AWAITING_BUSINESS_COUNTER_RESPONSE') { action = 'COUNTER_PROPOSAL'; title = 'Nueva contrapropuesta del cliente'; }
  if (p.state === 'COORDINATION_PENDING' && business && p.proposalSummary.type !== 'CUSTOMER_COUNTER') { action = 'ACCEPT_PROPOSAL'; title = 'El cliente aceptó la alternativa'; }
  if (p.state === 'COORDINATION_PENDING' && !business && p.proposalSummary.type === 'CUSTOMER_COUNTER') { action = 'ACCEPT_COUNTER_PROPOSAL'; title = 'El negocio aceptó tu contrapropuesta'; }
  if (business && p.closure?.reasonCode === 'CUSTOMER_REJECTED_PROPOSAL') { action = 'REJECT_PROPOSAL'; title = 'El cliente rechazó la propuesta'; }
  if (!business && p.closure?.reasonCode === 'BUSINESS_REJECTED_COUNTER_PROPOSAL') { action = 'REJECT_COUNTER_PROPOSAL'; title = 'El negocio rechazó la contrapropuesta'; }
  return action ? { key: `order-${order.id}-proposal-${p.currentProposalId}-${action.toLowerCase().replaceAll('_', '-')}`,
    notice: [title, 'Revisa las condiciones y los siguientes pasos en Solicitudes.'] as const } : null;
}
