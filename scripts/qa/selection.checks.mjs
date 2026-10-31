import {it} from 'node:test';import assert from 'node:assert/strict';
import {selectCases} from './selection.mjs';
const cases=[{case:'controls',role:'customer',width:393,height:852},{case:'controls',role:'business',width:393,height:852},{case:'reveal',role:'customer',width:320,height:852}];
it('selects exact case/role/width',()=>assert.deepEqual(selectCases(cases,['--case','controls','--role=customer','--width','393']).cases,[cases[0]]));
it('excludes a case approved earlier',()=>assert.deepEqual(selectCases(cases,['--exclude','controls:customer:393:852']).cases,cases.slice(1)));
for(const args of [['--role','admin'],['--width','no'],['--case','absent'],['--deployment','anything'],['--role']])
 it('rejects invalid selection '+args.join(' '),()=>assert.throws(()=>selectCases(cases,args)));
it('lists without starting browser',()=>assert.equal(selectCases(cases,['--list']).options.list,true));
