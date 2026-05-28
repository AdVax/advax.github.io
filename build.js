const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const stores = JSON.parse(fs.readFileSync('stores.json', 'utf8'));

if (!fs.existsSync('output')) {
  fs.mkdirSync('output');
}

async function buildStore(store) {
  console.log(`\n🔨 Building: ${store.name}`);
  
  const dir = `build/${store.package}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    // Initialize Bubblewrap
    execSync(`bubblewrap init --manifest ${store.url}/manifest.json`, {
      cwd: dir,
      stdio: 'inherit',
      input: `\n\n\n\n\n\n\n\n\n\n`
    });

    // Build APK
    execSync(`bubblewrap build`, {
      cwd: dir,
      stdio: 'inherit'
    });

    // Copy APK to output
    const apkName = `${store.name}.apk`;
    execSync(`cp ${dir}/app-release-signed.apk output/${apkName}`);
    
    console.log(`✅ Done: ${apkName}`);

  } catch (err) {
    console.error(`❌ Failed: ${store.name}`, err.message);
  }
}

(async () => {
  for (const store of stores) {
    await buildStore(store);
  }
  console.log('\n🎉 All done! APKs are in /output folder');
})();
