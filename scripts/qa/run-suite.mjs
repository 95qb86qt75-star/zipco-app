import fs from 'node:fs';
import path from 'node:path';
import { withBrowser } from './browser.mjs';
import { selectCases } from './selection.mjs';

export async function runSuite(suite, fixture, catalog, runCase, args, negatives = []) {
  const selection = selectCases(catalog, args);
  if (selection.options.negative && !negatives.includes(selection.options.negative)) throw Error('Unsupported negative control');
  if(selection.options.negative&&selection.cases.length!==1)throw Error('Choose one case for a negative control');
  if (selection.options.list) { console.log(JSON.stringify(selection.cases, null, 2)); return; }
  const results = [], runId=Date.now(), reportSuite=suite+(selection.options.negative?'-negative-'+selection.options.negative:'');
  try {
    await withBrowser(reportSuite, fixture, async ctx => {
      for (const spec of selection.cases) {
        const id = [spec.case, spec.role, spec.width, spec.height, spec.reduce ? 'reduced' : 'normal'].join('-');
        try {
          const data = await ctx.timing.measure('case execution/' + id, () => runCase(ctx, spec, selection.options.negative));
          results.push({ id, passed: true, ...(data ? { data } : {}) }); console.log('PASS', id);
        } catch (error) {
          results.push({ id, passed: false, error: error.message });
          await ctx.screenshot('failed-' + id).catch(() => {});
          throw error;
        }
      }
    });
  } finally {
    const directory = path.resolve('node_modules/.cache/qa-pilot', reportSuite);
    fs.mkdirSync(directory, { recursive: true });
    const report = { suite, selected: selection.cases.length, results, passed: results.filter(r => r.passed).length,
      negativeControl: selection.options.negative, transport: 'synthetic; browser network restricted to fixture origin' };
    fs.writeFileSync(path.join(directory, 'results.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(directory, 'results-'+runId+'.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  }
}
