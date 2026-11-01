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
 it.each([false,true])('keeps WhatsApp presentation and full contact copy when expanded=%s',expanded=>{
  const output=html({expanded});expect(output).toContain('zipco-av-available-wa');expect(output).not.toContain('zipco-av-available-pk');
  expect(output).toContain('Permitir que este negocio me escriba por WhatsApp');expect(output).toContain('WHATSAPP');
 });
 it('preserves the initial consultation component outside the redesign',()=>{
  expect(()=>renderToStaticMarkup(React.createElement(ConsultationDesignSheet,{data,open:false,contact:true,onOpenChange:()=>{},onContactChange:()=>{},onSend:()=>{}}))).not.toThrow();
 });
 it.each([simpleFree,simplePaid,freeOffer,paidOffer])('renders real offer modes without replacing the summary',offer=>{
  const simplified='simplified' in offer,output=html({pickup:{message:'Texto real',scheduleOrAddress:'Local 19',allowsContact:true,reservationOffer:offer},simplified,onReserve:simplified?undefined:()=>{},onReservationNote:()=>{}});
  expect(output).toContain('zipco-av-available-pk');expect(output).toContain('RETIRO');expect(output).toContain('Texto real');expect(output).toContain('Local 19');
  expect(output).toContain('Oferta de reserva');expect(output.includes('role="switch"')).toBe(!simplified);
  expect(output.includes('Agregar nota para la reserva')).toBe(!simplified);
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
