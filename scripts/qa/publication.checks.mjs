import {it} from 'node:test';import assert from 'node:assert/strict';
import {QA,validatePublicationTarget,verifyQaPublication} from './publication.mjs';
const sha='a'.repeat(40),deployment='dpl_Test123';
function scenario(changes={}){
 const meta={projectId:QA.project,readyState:'READY',target:null,gitSource:{ref:'qa',sha},alias:[new URL(QA.base).hostname],...changes.meta};
 const calls=[];
 const fetchImpl=async(url,options)=>{
  calls.push({url,options});assert.equal(options.method,'GET');assert.equal(options.redirect,'error');
  if(url.includes('/v13/deployments/'))return Response.json(meta);
  if(url.includes('/v9/projects/'))return Response.json({id:QA.project,protectionBypass:changes.noBypass?{}:{'private-existing-access':{scope:'automation-bypass'}}});
  assert.deepEqual(options.headers,{'x-vercel-protection-bypass':'private-existing-access'});
  if(url.includes('/assets/index-app.js'))return new Response(changes.bundle??sha+' https://zipco-backend-qa.up.railway.app marker');
  if(url.includes('/assets/index-app.css'))return new Response('css-marker');
  return new Response(changes.html??'<script src="/assets/index-app.js"></script><link href="/assets/index-app.css">');
 };fetchImpl.calls=calls;return fetchImpl;
}
it('verifies fixed QA target with GETs and credential-free result',async()=>{
 const fetchImpl=scenario(),result=await verifyQaPublication({sha,deployment,token:'private-token',fetchImpl,jsContains:['marker'],cssContains:['css-marker']});
 assert.equal(result.method,'GET only');assert.equal(fetchImpl.calls.length,5);assert.doesNotMatch(JSON.stringify(result),/private-token|private-existing-access/);
});
for(const meta of [{projectId:'other'},{readyState:'ERROR'},{target:'production'},{gitSource:{ref:'main',sha}},{gitSource:{ref:'qa',sha:'b'.repeat(40)}},{alias:[]}])
 it('rejects invalid metadata before site request '+JSON.stringify(meta),async()=>{
  const fetchImpl=scenario({meta});await assert.rejects(verifyQaPublication({sha,deployment,token:'token',fetchImpl}));assert.equal(fetchImpl.calls.length,1);
 });
for(const change of [{noBypass:true},{html:'<title>Login</title>'},{bundle:'wrong sha'},{bundle:sha+' wrong backend'}])
 it('rejects missing access/login/stale assets '+JSON.stringify(change),async()=>{
  await assert.rejects(verifyQaPublication({sha,deployment,token:'token',fetchImpl:scenario(change)}));
 });
it('rejects missing requested marker',async()=>await assert.rejects(verifyQaPublication({sha,deployment,token:'token',fetchImpl:scenario(),jsContains:['absent']})));
for(const args of [{sha:'short',deployment},{sha,deployment:'../production'},{sha,deployment,base:'https://zipco.cl'}])
 it('rejects unsafe arguments before credential lookup '+JSON.stringify(args),()=>assert.throws(()=>validatePublicationTarget(args)));
