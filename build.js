const { spawnSync } = require('child_process');
const fs = require('fs');

const stores = JSON.parse(fs.readFileSync('stores.json', 'utf8'));
fs.mkdirSync('output', { recursive: true });

function run(cmd, args, options = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, {
    encoding: 'utf8',
    timeout: 300000,
    ...options
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}

async function buildStore(store) {
  console.log(`\n=============================`);
  console.log(`🔨 Building: ${store.name}`);
  console.log(`=============================`);

  const dir = `build_${store.package.replace(/\./g, '_')}`;

  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir);

  const input = '\n'.repeat(30);

  const init = run('bubblewrap', [
    'init',
    '--manifest', `${store.url}/manifest.json`
  ], { cwd: dir, input });

  if (init.status !== 0) {
    console.error(`❌ Init failed: ${store.name}`);
    return false;
  }

  const build = run('bubblewrap', ['build', '--skipPwaValidation'], {
    cwd: dir,
    input: '\n'
  });

  if (build.status !== 0) {
    console.error(`❌ Build failed: ${store.name}`);
    return false;
  }

  const found = spawnSync('find', [
    dir, '-name', '*.apk',
    '-not', '-path', '*/intermediates/*'
  ], { encoding: 'utf8' });

  const apks = (found.stdout || '').trim().split('\n').filter(Boolean);

  if (apks.length > 0) {
    fs.copyFileSync(apks[0], `output/${store.name}.apk`);
    console.log(`✅ Done: output/${store.name}.apk`);
    return true;
  }

  console.error(`❌ No APK found for: ${store.name}`);
  return false;
}

(async () => {
  let ok = 0, fail = 0;
  for (const store of stores) {
    (await buildStore(store)) ? ok++ : fail++;
  }
  console.log(`\n🏁 ${ok} نجح، ${fail} فشل`);
})();
