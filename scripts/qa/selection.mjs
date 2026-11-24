export function selectCases(cases, args) {
  const options = { list: false, case: null, role: null, width: null, negative: null, exclude: null };
  for (let i = 0; i < args.length; i++) {
    const [flag, attached] = args[i].split('=');
    if (flag === '--list') { options.list = true; continue; }
    if (!['--case', '--role', '--width', '--negative-control', '--exclude'].includes(flag)) throw Error('Unknown option: ' + flag);
    const value = attached ?? args[++i];
    if (!value || value.startsWith('--')) throw Error('Missing value for ' + flag);
    const key = flag === '--negative-control' ? 'negative' : flag.slice(2);
    options[key] = value;
  }
  if (options.role && !['customer', 'business'].includes(options.role)) throw Error('Role must be customer or business');
  if (options.width && !/^[1-9]\d{2,3}$/.test(options.width)) throw Error('Invalid width');
  const excluded = options.exclude?.split(',') ?? [];
  const selected = cases.filter(c => (!options.case || c.case === options.case) &&
    (!options.role || c.role === options.role) && (!options.width || c.width === Number(options.width)) &&
    !excluded.includes([c.case,c.role,c.width,c.height].join(':')));
  if (!selected.length) throw Error('No matching cases; use --list');
  return { options, cases: selected };
}
