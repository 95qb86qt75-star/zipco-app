// Synthetic fixtures shared by the local 2A tests; no customer data.
import type { RequestProcessSummary } from './requestProcess';
import type { AgreementReadDto } from './agreement';
export const pendingProcess: RequestProcessSummary = {
  id: 7, state: 'AWAITING_BUSINESS_RESPONSE', version: 1, currentProposalId: 123,
  agreementPublicId: null, allowedActions: ['ACCEPT_FIXED_ORDER'],
};
export const coordinationProcess: RequestProcessSummary = {
  ...pendingProcess, state: 'COORDINATION_PENDING', version: 2,
  agreementPublicId: 'agreement-test', allowedActions: [],
};
export const rawOrder = { id: 20, status: 'pending', createdAt: '2026-10-15T12:00:00Z',
  products: [{ name: 'Producto de prueba', quantity: 2, price: 1000 }],
  total: 2000, needNow: false, note: 'Nota de prueba', referencePhoto: 'https://example.test/photo.jpg',
  deliveryDate: '2026-10-16', deliveryTime: '15:00' };
export const agreementFixture: AgreementReadDto = {
  agreementPublicId: 'agreement-test', requestProcessId: 7, acceptedProposalId: 123,
  subjectSchemaVersion: 1, subjectSnapshot: {
    orderType: 'product', items: [{ catalogItemId: 5, nameSnapshot: 'Producto acordado',
      descriptionSnapshot: 'Descripción acordada', quantity: 2, unitPriceClpSnapshot: 1000, subtotalClp: 2000 }],
    needNow: false, note: 'Nota acordada', referencePhoto: 'https://example.test/agreement.jpg',
  }, totalPriceClp: 2000, reservationAmountClp: null, scheduledFor: '2026-10-16T18:00:00Z',
  customerAcceptedAt: '2026-10-15T12:00:00Z', businessAcceptedAt: '2026-10-15T12:01:00Z',
  confirmedAt: '2026-10-15T12:01:00Z', createdAt: '2026-10-15T12:01:00Z',
};
