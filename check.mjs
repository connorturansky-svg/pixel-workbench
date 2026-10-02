// Runs every release check quietly: node check.mjs
// Prints "OK" when stamp, verify, verify-installation and the smoke test all pass; otherwise only the failure.
import {spawnSync} from 'node:child_process';

const steps = [
  ['node', ['stamp-version.mjs']],
  ['node', ['verify.mjs']],
  ['node', ['verify-installation.mjs']],
  [process.platform === 'win32' ? 'python' : 'python3', ['automation/smoke.py', 'dist']]
];
for (const [cmd, args] of steps) {
  const r = spawnSync(cmd, args, {encoding: 'utf8', cwd: new URL('.', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')});
  if (r.status !== 0) {
    const out = `${r.stdout || ''}\n${r.stderr || ''}${r.error ? `\n${r.error.message}` : ''}`.trim().split('\n');
    console.log(`FAILED: ${cmd} ${args.join(' ')}\n${out.slice(-40).join('\n')}`);
    process.exit(1);
  }
}
console.log('OK');
