const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { _electron } = require('playwright');
const { launchOptions, openComposer, waitForInfo } = require('./window-fixture.cjs');
const { cleanupIdleFixture } = require('./idle-fixture-cleanup.cjs');

(async () => {
  const evidenceRoot = path.resolve(process.env.THOUGHTLINE_EVIDENCE_DIR || 'acceptance/evidence/round1/p6-windows-source');
  await fs.mkdir(evidenceRoot, { recursive: true });
  const evidence = await fs.mkdtemp(path.join(evidenceRoot, 'source-attempt-'));
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'thoughtline-source-key-events-'));
  const pids = [];
  let app;
  let normalClose = false;
  let completedChecks = false;
  let result = { passed: false, evidenceDirectory: evidence, attempt: process.env.THOUGHTLINE_ATTEMPT || null,
    host: { platform: process.platform, arch: process.arch, release: os.release() },
    scope: 'Source Electron on the actual runner OS with emulated shortcut registration and DOM keyboard events; no physical IME, DPI, focus, display, or receiver acceptance' };
  try {
    const seed = { schemaVersion: 3, revision: 0, ideas: [], clips: [],
      agents: [{ id: 'general', name: '通用', color: '#A4A5B0' }], draft: null,
      settings: { writeHotkey: 'Control+Alt+F18', reducedMotion: false } };
    await fs.writeFile(path.join(dir, 'snapshot.json'), JSON.stringify(seed));
    app = await _electron.launch(await launchOptions(dir));
    pids.push(app.process().pid);
    const shelf = await app.firstWindow();
    await shelf.waitForURL(/view=shelf/);
    await shelf.waitForSelector('[data-view=shelf]', { state: 'attached' });
    const composer = await openComposer(app, shelf);
    const input = composer.locator('#idea-text');
    await input.fill('第一行中文😀');
    await input.press('Enter');
    await input.type('第二行');
    assert.equal(await input.inputValue(), '第一行中文😀\n第二行');
    const before = await shelf.evaluate(() => window.thoughtline.info());
    const observedKeyCode = await input.evaluate(element => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', ctrlKey: true, isComposing: false, bubbles: true, cancelable: true,
      });
      Object.defineProperty(event, 'keyCode', { value: 229 });
      element.dispatchEvent(event);
      return event.keyCode;
    });
    assert.equal(observedKeyCode, 229);
    const guarded = await shelf.evaluate(() => window.thoughtline.info());
    assert.equal(guarded.snapshot.ideas.length, 0, '229 must not submit');
    assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()
      .find(window => window.getTitle() === 'Thoughtline Composer').isVisible()), true);
    await input.press(process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter');
    const saved = await waitForInfo(shelf, info => info.snapshot.ideas.length === 1 && !info.interactionLocked);
    assert.equal(saved.snapshot.ideas[0].text, '第一行中文😀\n第二行');
    assert.equal(saved.snapshot.draft, null);
    result = { ...result, electron: await app.evaluate(({ app }) => process.versions.electron),
      checks: { enterInsertsNewline: true, keyCode229GuardsSubmit: true, platformSubmitShortcut: process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter',
        preservedEmojiAndLineBreak: true, draftClearedAfterSubmit: true },
      revisions: { before: before.snapshot.revision, after: saved.snapshot.revision } };
    await shelf.screenshot({ path: path.join(evidence, 'source-shelf.png') });
    completedChecks = true;
  } catch (error) {
    result.error = String(error?.stack || error);
    throw error;
  } finally {
    try {
      if (app) {
        pids.push(...await app.evaluate(({ app }) => app.getAppMetrics().map(metric => metric.pid)));
        await app.close();
        normalClose = true;
      }
      await cleanupIdleFixture(dir, pids);
      const fakeDataRemoved = await fs.stat(dir).then(() => false, error => { if (error.code === 'ENOENT') return true; throw error; });
      assert(fakeDataRemoved);
      result.cleanup = { directory: dir, ownedPids: [...new Set(pids)], normalClose, fakeDataRemoved, allExited: true };
      result.passed = completedChecks && normalClose;
    } catch (error) {
      result.cleanup = { directory: dir, ownedPids: [...new Set(pids)], normalClose,
        allExited: false, fakeDataRemoved: false, error: String(error?.stack || error) };
      throw error;
    } finally {
      await fs.writeFile(path.join(evidence, 'source-key-events.json'), JSON.stringify(result, null, 2) + '\n');
    }
  }
  assert(result.passed);
  console.log(JSON.stringify(result));
})().catch(error => { console.error(error); process.exitCode = 1; });
