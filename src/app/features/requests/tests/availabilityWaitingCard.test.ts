import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import AvailabilityWaitingCard from '../cards/business/availability/AvailabilityWaitingCard';

const base={name:'Cliente QA',price:12000,items:[{name:'Flores',quantity:2,unitPrice:6000}],schedule:'Hoy',expanded:true,onToggle:()=>{},busy:false,onRetire:()=>{}};
describe('business availability waiting presentation permissions',()=>{
 it('omits withdrawal without permission and retains local pickup instructions',()=>{
  const html=renderToStaticMarkup(React.createElement(AvailabilityWaitingCard,{...base,canRetire:false,path:'LOCAL_PICKUP',customerMessage:'Retira en caja',scheduleOrAddress:'Texto libre'}));
  expect(html).not.toContain('Retirar disponibilidad');
  expect(html).toContain('Retira en caja');expect(html).toContain('Texto libre');expect(html).toContain('$12.000');
 });
 it('disables authorized withdrawal while busy',()=>{
  const html=renderToStaticMarkup(React.createElement(AvailabilityWaitingCard,{...base,canRetire:true,busy:true}));
  expect(html).toMatch(/class="zipco-avw-withdraw zipco-aw-wd" disabled=""/);
 });
 it('does not present pickup instructions for WhatsApp and preserves the error when collapsed',()=>{
  const html=renderToStaticMarkup(React.createElement(AvailabilityWaitingCard,{...base,price:null,expanded:false,canRetire:false,path:'WHATSAPP',customerMessage:'No es retiro',scheduleOrAddress:'No mostrar',error:React.createElement('p',{role:'alert'},'Comprobar pedido')}));
  expect(html).not.toContain('No es retiro');expect(html).not.toContain('No mostrar');
  expect(html).toContain('Comprobar pedido');expect(html).toContain('—');
 });
});
