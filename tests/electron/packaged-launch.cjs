const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const childProcess = require('node:child_process');
const overrides = new Set(['ELECTRON_RUN_AS_NODE', 'ELECTRON_RENDERER_URL', 'NODE_OPTIONS', 'THOUGHTLINE_DATA_DIR', 'THOUGHTLINE_OWNED_PROFILE']);

function sanitizedPackagedEnv(base, profile) {
  const env = Object.fromEntries(Object.entries(base).filter(([key]) => !overrides.has(key.toUpperCase())));
  if (profile) env.THOUGHTLINE_DATA_DIR = profile;
  return env;
}

// Observe only the exact owned launch. Synchronous receipts survive Node's fatal
// unhandled-rejection exit; never change Playwright's rejection or retry policy.
function observeLaunch(executable, out) {
  const original = childProcess.spawn;
  const record = event => fs.appendFileSync(path.join(out, 'launch-events.jsonl'), JSON.stringify({ time: new Date().toISOString(), ...event }) + '\n');
  childProcess.spawn = function(command, args, options) {
    const owned = command === executable || (options?.shell === true && command.startsWith(`"${executable}" `));
    const child = original.apply(this, arguments);
    if (owned) {
      const env = options?.env || {};
      record({ type: 'spawn', pid: child.pid ?? null, shell: !!options?.shell, runtimeOverrideKeys: Object.keys(env).filter(key => overrides.has(key.toUpperCase()) && key.toUpperCase() !== 'THOUGHTLINE_DATA_DIR') });
      let remaining = 65536;
      child.stderr?.on('data', data => {
        if (remaining <= 0) return;
        const text = data.toString().slice(0, remaining); remaining -= text.length;
        record({ type: 'stderr', pid: child.pid ?? null, text });
      });
      child.on('error', error => record({ type: 'error', pid: child.pid ?? null, code: error.code || null, message: error.message }));
      child.on('exit', (code, signal) => record({ type: 'exit', pid: child.pid ?? null, code, signal }));
    }
    return child;
  };
  return () => { childProcess.spawn = original; };
}

async function runPackagedFixture({ executable = process.env.THOUGHTLINE_EXECUTABLE, out = process.env.THOUGHTLINE_EVIDENCE_DIR || 'acceptance/evidence/appearance/packaged', worker = path.join(__dirname, 'packaged-appearance-worker.cjs') } = {}) {
  if (!executable) throw Error('THOUGHTLINE_EXECUTABLE must identify the actual frozen package');
  executable = path.resolve(executable); out = path.resolve(out);
  fs.mkdirSync(out, { recursive: true });
  // Each invocation owns a new profile. Do not accept a stale prior worker result.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'thoughtline-packaged-appearance-'));
  const workerResult = path.join(out, 'packaged-appearance-worker.json');
  fs.rmSync(workerResult, { force: true });
  fs.writeFileSync(path.join(out, 'launch-events.jsonl'), '');
  let result = { passed: false, packaged: true, executable, version: require('../../package.json').version, host: { platform: process.platform, arch: process.arch, release: os.release() }, checks: [], stage: 'worker-starting', cleanup: { normalQuit: false, profile, profileRemoved: false, ownedPids: [], allExited: false } };
  const save = () => fs.writeFileSync(path.join(out, 'packaged-appearance.json'), JSON.stringify(result, null, 2));
  save();
  const stdout = fs.openSync(path.join(out, 'worker.stdout.log'), 'w');
  const stderr = fs.openSync(path.join(out, 'worker.stderr.log'), 'w');
  let termination;
  try {
    termination = await new Promise(resolve => {
      const child = childProcess.spawn(process.execPath, [worker], { env: { ...sanitizedPackagedEnv(process.env), THOUGHTLINE_EXECUTABLE: executable, THOUGHTLINE_EVIDENCE_DIR: out, THOUGHTLINE_OWNED_PROFILE: profile }, stdio: ['ignore', stdout, stderr] });
      let spawnError;
      child.on('error', error => { spawnError = { code: error.code || null, message: error.message }; });
      child.on('close', (code, signal) => resolve({ pid: child.pid ?? null, code, signal, ...(spawnError ? { error: spawnError } : {}) }));
    });
  } finally { fs.closeSync(stdout); fs.closeSync(stderr); }
  let completed;
  try { completed = JSON.parse(fs.readFileSync(workerResult, 'utf8')); } catch (error) { result.error = `Worker did not write a valid completion receipt (${error.code || error.name})`; }
  if (completed?.cleanup?.profile === profile && completed.executable === executable) result = completed;
  else if (completed) result.error = 'Worker receipt does not match this owned invocation';
  result.worker = termination;
  result.stage = completed ? 'worker-completed' : 'worker-terminated-before-receipt';
  result.launchEvents = fs.readFileSync(path.join(out, 'launch-events.jsonl'), 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
  result.observedPidState = result.launchEvents.filter(event => event.type === 'spawn' && event.pid).map(event => {
    try { process.kill(event.pid, 0); return { pid: event.pid, alive: true }; }
    catch (error) { return { pid: event.pid, alive: error.code === 'ESRCH' ? false : null, ...(error.code === 'ESRCH' ? {} : { error: error.code }) }; }
  });
  result.passed = result.passed === true && termination.code === 0 && !termination.signal && !termination.error;
  if (!completed) {
    result.cleanup.ownedPids = [...new Set(result.launchEvents.filter(event => event.type === 'spawn' && event.pid).map(event => event.pid))];
    result.cleanup.reason = 'No complete app lifecycle receipt; process tree exit is unverified and profile retained';
  }
  save();
  return result;
}
module.exports = { sanitizedPackagedEnv, observeLaunch, runPackagedFixture };
