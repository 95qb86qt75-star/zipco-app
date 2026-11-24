import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
import ReservationChoiceFields from './ReservationChoiceFields';
import {NO_RESERVATION_WARNING} from './ReservationDecisionDialog';
import {simpleFree,simplePaid} from '../../fixtures/simplifiedReservationFixtures';

it.each(['plain','cards'] as const)('shows the real warning only for the no-reservation choice (%s)',variant=>{
 for(const offer of [simpleFree,simplePaid]){
  const render=(value:'NONE'|'REQUEST_RESERVATION')=>renderToStaticMarkup(React.createElement(ReservationChoiceFields,{offer,value,note:'Hola',onChange:vi.fn(),onNote:vi.fn(),variant}));
  expect(render('NONE')).toContain(NO_RESERVATION_WARNING);
  expect(render('REQUEST_RESERVATION')).not.toContain(NO_RESERVATION_WARNING);
  expect(render('REQUEST_RESERVATION')).toContain('Nota para la reserva');
 }
});
it.each(['plain','cards'] as const)('keeps the warning for a NONE offer (%s)',variant=>{
 const html=renderToStaticMarkup(React.createElement(ReservationChoiceFields,{offer:{mode:'NONE'},value:'NONE',note:'',onChange:vi.fn(),onNote:vi.fn(),variant}));
 expect(html).toContain(NO_RESERVATION_WARNING);expect(html).not.toContain('type="radio"');
});
it('hides only the repeated summary in cards and preserves native disabled controls',()=>{
 const html=renderToStaticMarkup(React.createElement(ReservationChoiceFields,{offer:simpleFree,value:'REQUEST_RESERVATION',note:'Hola',onChange:vi.fn(),onNote:vi.fn(),variant:'cards',hideSummary:true,disabled:true}));
 expect(html).toContain('TU ELECCIÓN');expect(html).toContain('4/300');
 expect(html).not.toContain('aria-label="Oferta de reserva"');
 expect(html).toContain('disabled=""');expect(html.match(/type="radio"/g)).toHaveLength(2);
});
it('preserves the default plain presentation',()=>{
 const html=renderToStaticMarkup(React.createElement(ReservationChoiceFields,{offer:simpleFree,value:'NONE',note:'',onChange:vi.fn(),onNote:vi.fn()}));
 expect(html).not.toContain('zipco-rc');expect(html).toContain('aria-label="Oferta de reserva"');
});
it('keeps the note limit at 300 Unicode characters',()=>{
 const onNote=vi.fn();const tree=ReservationChoiceFields({offer:simpleFree,value:'REQUEST_RESERVATION',note:'',onChange:vi.fn(),onNote,variant:'cards'});
 const find=(node:any):any=>!node?null:Array.isArray(node)?node.map(find).find(Boolean):node.type==='textarea'?node:find(node.props?.children);
 find(tree).props.onChange({target:{value:'\ud83d\ude00'.repeat(301)}});
 expect(Array.from(onNote.mock.calls[0][0])).toHaveLength(300);
});
