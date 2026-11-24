import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import ProgressCardShell from './ProgressCardShell';
const props={id:20,business:true,name:'Cliente QA',statusLabel:'Pendiente de retiro en el local',retry:()=>{}};
it('shows a neutral business skeleton while the real agreement is loading',()=>{
  const html=renderToStaticMarkup(React.createElement(ProgressCardShell,props));
  expect(html).toContain('id="order-20"');expect(html).toContain('aria-busy="true"');
  expect(html).toContain('zipco-progress-placeholder');expect(html).toContain('role="status"');
  expect(html).not.toContain('zipco-co-dk');expect(html).not.toContain('ACORDADO');
  expect(html).not.toContain('Pendiente de retiro');expect(html).not.toContain('Sin hora');
});
it('replaces the skeleton with the real error and retry control after a failed read',()=>{
  const html=renderToStaticMarkup(React.createElement(ProgressCardShell,{...props,error:'Error de lectura real'}));
  expect(html).toContain('aria-busy="false"');expect(html).toContain('role="alert"');
  expect(html).toContain('Error de lectura real');expect(html).toContain('Reintentar condiciones');
  expect(html).not.toContain('zipco-progress-placeholder');expect(html).not.toContain('zipco-co-dk');
});
it('preserves the current customer shell outside the business redesign',()=>{
  const html=renderToStaticMarkup(React.createElement(ProgressCardShell,{...props,business:false}));
  expect(html).toContain('zipco-cp');expect(html).toContain('Verificando condiciones');
  expect(html).not.toContain('zipco-progress-loading');
});
