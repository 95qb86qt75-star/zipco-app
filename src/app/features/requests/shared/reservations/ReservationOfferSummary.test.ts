import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import ReservationOfferSummary from './ReservationOfferSummary';
import AvailabilityPlanSummary from '../../cards/shared/availability/AvailabilityPlanSummary';
import {simpleFree} from '../../fixtures/simplifiedReservationFixtures';
import {pickupPlan} from '../../fixtures/availabilityFixtures';
const offer={...simpleFree,simplified:{...simpleFree.simplified,hoursPolicy:'ADVISORY_ONLY' as const,opensAt:null,closesAt:null,holdMinutes:null}};
it('keeps default free-reservation wording outside customer proposals',()=>{
 const html=renderToStaticMarkup(React.createElement(ReservationOfferSummary,{offer}));
 expect(html).toContain('Se confirma automáticamente al solicitarla.');
 expect(html).not.toContain('zipco-offer-h');
});
it('opts into the new offer wording only for customer proposals',()=>{
 const html=renderToStaticMarkup(React.createElement(ReservationOfferSummary,{offer,customerProposal:true}));
 expect(html).toContain('Puedes reservar este producto sin un pago previo');
 expect(html).not.toContain('Se confirma automáticamente');
});
it('can omit the repeated offer while keeping real pickup instructions',()=>{
 const html=renderToStaticMarkup(React.createElement(AvailabilityPlanSummary,{plan:{...pickupPlan,reservationOffer:offer},customerProposal:true,showReservation:false}));
 expect(html).toContain(pickupPlan.customerMessage);
 expect(html).not.toContain('Oferta de reserva');
});
