import assert from 'node:assert/strict';

export const QA = Object.freeze({
  project: 'prj_if0y7EHVe3OPcP7DRcNhFYzuCny3',
  team: 'team_t4tkh3ANJIBPQ8RAnP4V3nmu',
  base: 'https://zipco-app-git-qa-zipco-s-projects.vercel.app',
});

export function validatePublicationTarget({ sha, deployment, base = QA.base }) {
  assert.match(sha ?? '', /^[a-f0-9]{40}$/, 'Expected a full commit SHA');
  assert.match(deployment ?? '', /^dpl_[A-Za-z0-9]+$/, 'Expected a deployment ID');
  assert.equal(base, QA.base, 'Only the approved QA alias can be read');
}

export async function verifyQaPublication({ sha, deployment, base = QA.base, token,
  jsContains = [], cssContains = [], fetchImpl = fetch }) {
  validatePublicationTarget({ sha, deployment, base });
  assert(typeof token === 'string' && token.length > 0, 'Existing Vercel access required');
  const requests = [];
  async function get(url, headers, json = false) {
    requests.push(new URL(url).origin + new URL(url).pathname);
    const response = await fetchImpl(url, { method: 'GET', headers, redirect: 'error',
      cache: 'no-store', signal: AbortSignal.timeout(20000) });
    assert(response.ok, 'Read-only QA verification HTTP ' + response.status);
    return json ? response.json() : response.text();
  }
  const api = route => get('https://api.vercel.com' + route + '?teamId=' + QA.team,
    { Authorization: 'Bearer ' + token }, true);
  // Validate metadata before looking up automation access or requesting site assets.
  const meta = await api('/v13/deployments/' + deployment);
  assert.equal(meta.projectId ?? meta.project?.id, QA.project, 'Wrong Vercel project');
  assert.equal(meta.readyState, 'READY', 'Deployment is not Ready');
  assert.notEqual(meta.target, 'production', 'Production verification is outside this tool');
  assert.equal(meta.gitSource?.ref, 'qa', 'Wrong branch');
  assert.equal(meta.gitSource?.sha, sha, 'Wrong deployment SHA');
  assert(meta.alias?.includes(new URL(base).hostname), 'QA alias is not assigned to this deployment');
  const project = await api('/v9/projects/' + QA.project);
  assert.equal(project.id, QA.project, 'Wrong project response');
  const bypass = Object.entries(project.protectionBypass ?? {}).find(([, value]) => value.scope === 'automation-bypass')?.[0];
  assert(bypass, 'Existing automation access unavailable; do not create or change protection');
  const site = route => get(base + route, { 'x-vercel-protection-bypass': bypass });
  const html = await site('/?verify=' + sha);
  const js = html.match(/src="(\/assets\/index-[A-Za-z0-9_-]+\.js)"/)?.[1];
  const css = html.match(/href="(\/assets\/index-[A-Za-z0-9_-]+\.css)"/)?.[1];
  assert(js && css, 'Published app assets missing; login pages do not count as success');
  const bundle = await site(js), styles = await site(css);
  assert(bundle.includes(sha), 'Served bundle SHA mismatch');
  assert(bundle.includes('https://zipco-backend-qa.up.railway.app'), 'QA backend marker missing');
  for (const marker of jsContains) assert(bundle.includes(marker), 'Missing requested JS marker');
  for (const marker of cssContains) assert(styles.includes(marker), 'Missing requested CSS marker');
  return { readyState: meta.readyState, sha, branch: 'qa', project: QA.project,
    deployment, base, js, css, markers: { js: jsContains.length, css: cssContains.length },
    requestCount: requests.length, method: 'GET only' };
}
