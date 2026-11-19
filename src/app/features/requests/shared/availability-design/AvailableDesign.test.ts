import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {AvailableRequestDesign,ConsultationDesignSheet} from './AvailabilityDesign';
import ReservationOfferSummary from '../reservations/ReservationOfferSummary';
import {simpleFree,simplePaid} from '../../fixtures/simplifiedReservationFixtures';
import {freeOffer,paidOffer} from '../../fixtures/reservationFixtures';
const data={counterpart:'Negocio de prueba',items:[{name:'Producto',quantity:2,unitPrice:2500}],total:5000,immediate:true,schedule:'Ahora'};
const base={data,expanded:true,contact:true,onToggle:()=>{},onContactChange:()=>{},onContinue:()=>{},onDecline:()=>{}};
const html=(props={})=>renderToStaticMarkup(React.createElement(AvailableRequestDesign,{...base,...props}));
describe('complete availability design variants',()=>{
 it.each([false,true])('uses the shared design and full WhatsApp contact copy when expanded=%s',expanded=>{
  const output=html({expanded});expect(output).toContain('zipco-avpro');expect(output).toContain('data-channel="WHATSAPP"');
  expect(output).toContain('Permitir que este negocio me escriba por WhatsApp');expect(output).toContain('Coordinarán por WhatsApp');
  expect(output).not.toContain('Retiro en el local');expect(output).not.toContain('zipco-avwa-rail');
 });
 it('preserves the initial consultation component outside the redesign',()=>{
  expect(()=>renderToStaticMarkup(React.createElement(ConsultationDesignSheet,{data,open:false,contact:true,onOpenChange:()=>{},onContactChange:()=>{},onSend:()=>{}}))).not.toThrow();
 });
 it.each([simpleFree,simplePaid,freeOffer,paidOffer])('renders real offer modes without replacing the summary',offer=>{
  const simplified='simplified' in offer,output=html({pickup:{message:'Texto real',scheduleOrAddress:'Local 19',allowsContact:true,reservationOffer:offer},simplified,onReserve:simplified?undefined:()=>{},onReservationNote:()=>{}});
  expect(output).toContain('zipco-avpro');expect(output).toContain('Tienen tu producto');expect(output).not.toContain('zipco-avwa-rail');
  expect(output).toContain('data-channel="LOCAL_PICKUP"');
  expect(output).toContain('Texto real');expect(output).toContain('Local 19');
  expect(output).toContain('Oferta de reserva');expect(output.includes('role="switch"')).toBe(!simplified);
  expect(output.includes('Agregar nota para la reserva')).toBe(!simplified);
 });
 it.each([undefined,{mode:'NONE'}])('shows first-come instructions without presenting a reservation offer for %s',offer=>{
  const output=html({expanded:false,simplified:true,pickup:{message:'Retira en el local',allowsContact:false,reservationOffer:offer}});
  expect(output).toContain('SIN RESERVA');expect(output).toContain('Atención por orden de llegada. El producto no se guarda y podría agotarse.');
  expect(output).not.toContain('Oferta de reserva');expect(output).not.toContain('Puedes reservar');expect(output).not.toContain('PAGO PREVIO');
 });
 it('keeps free reservation distinct from prepayment in the common presentation',()=>{
  const output=html({simplified:true,pickup:{message:'Mensaje',allowsContact:true,reservationOffer:simpleFree}});
  expect(output).toContain('RESERVA GRATIS');expect(output).not.toContain('PAGO PREVIO');expect(output).not.toContain('role="switch"');
  expect(output).not.toContain('Solicitar reserva</span>');
 });
 it.each([false,true])('retains pickup contact permissions and legacy reserve action when allowsContact=%s',allowsContact=>{
  const output=html({expanded:false,pickup:{message:'Mensaje',allowsContact,reservationOffer:paidOffer},onReserve:()=>{},onReservationNote:()=>{}});
  expect(output.includes('role="switch"')).toBe(allowsContact);expect(output).toContain('Solicitar reserva con pago previo');expect(output).toContain('Iré sin reserva');
  expect(output).toContain('Pagar hasta:');expect(output).toContain('Agregar nota para la reserva');
 });
 it('separates the requested total from the proposed deposit and formats the offer date in Santiago',()=>{
  const offer={...simplePaid,requiredAmountClp:2500,simplified:{...simplePaid.simplified,hoursPolicy:'ADVISORY_ONLY' as const,opensAt:null,closesAt:null,holdMinutes:null,scheduledFor:'2026-11-20T02:10:00.000Z'}};
  const output=html({expanded:false,simplified:true,pickup:{message:'Mensaje',allowsContact:true,reservationOffer:offer}});
  expect(output).toContain('$5.000');expect(output).toContain('SOLICITADO');expect(output).toContain('PAGO PREVIO · $2.500');
  expect(output).toContain('19 nov · 23:10');expect(output).toContain('Sí, continuar con la compra');expect(output).toContain('No, gracias');
 });
 it('keeps errors and recovery outside the inert folded details',()=>{
  const output=html({expanded:false,error:'Error real',recovery:React.createElement('button',null,'Actualizar estado'),pickup:{message:'Mensaje',allowsContact:false}});
  expect(output.indexOf('Error real')).toBeLessThan(output.indexOf('id="'));expect(output).toContain('Actualizar estado');expect(output).toContain('SIN RESERVA');expect(output).not.toContain('role="switch"');
 });
 it('keeps the presentation fallback for missing instructions without accepting invalid server data',()=>{
  const output=html({pickup:{message:'',scheduleOrAddress:'',allowsContact:false}});
  expect(output).toContain('Acércate al local a pagar y retirar.');expect(output).not.toContain('DIRECCIÓN Y HORARIO');
 });
 it('shows the informational hours text by default and only omits it in the compact summary',()=>{
  const offer={...simpleFree,simplified:{...simpleFree.simplified,hoursPolicy:'ADVISORY_ONLY' as const,opensAt:null,closesAt:null,holdMinutes:null}};
  const full=renderToStaticMarkup(React.createElement(ReservationOfferSummary,{offer})),compact=renderToStaticMarkup(React.createElement(ReservationOfferSummary,{offer,compact:true}));
  expect(full).toContain('no tiene vencimiento automático');expect(compact).not.toContain('El horario de atención es informativo');expect(compact).toContain('Se confirma automáticamente');
 });
});
