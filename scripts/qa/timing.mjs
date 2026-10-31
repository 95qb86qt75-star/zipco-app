import fs from 'node:fs';
import path from 'node:path';

export function createTiming(label) {
  const startedAt = new Date(), phases = [];
  return {
    async measure(name, action) {
      const start = new Date(), clock = performance.now();
      try { return await action(); }
      finally { phases.push({ name, startedAt: start.toISOString(), endedAt: new Date().toISOString(), seconds: +(performance.now() - clock).toFixed(3) / 1000 }); }
    },
    report(extra = {}) {
      return { label, startedAt: startedAt.toISOString(), endedAt: new Date().toISOString(),
        totalSeconds: +(Date.now() - startedAt.getTime()) / 1000, phases,
        note: 'Elapsed wall time; nested phases overlap and are not additive.', ...extra };
    },
    save(file, extra = {}) {
      const report = this.report(extra);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(report, null, 2));
      const parsed = path.parse(file);
      fs.writeFileSync(path.join(parsed.dir, parsed.name + '-' + startedAt.getTime() + parsed.ext), JSON.stringify(report, null, 2));
      return report;
    },
  };
}
