import { execSync } from 'child_process';
import { existsSync, mkdirSync, unlinkSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { build } from 'esbuild';
import { NtExecutable, NtExecutableResource, Data, Resource } from 'resedit';

const outExe = 'RAW Cull.exe';
const iconPath = join(import.meta.dirname, '..', 'icon.ico');

console.log('Building project...');

// 1. Clear old build artifacts
if (!existsSync('dist')) mkdirSync('dist');
if (existsSync(outExe)) unlinkSync(outExe);

// 2. Bundle modern ES modules into standard CommonJS format using JS API
await build({
  entryPoints: ['index.js'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/bundle.js',
});

// 3. Let Node natively compile and write the final .exe file based on sea-config.json
execSync('node --build-sea sea-config.json', { stdio: 'inherit' });

// 4. Inject your custom icon natively using the resedit pure JS API
if (existsSync(iconPath)) {
  console.log('Injecting custom icon...');
  try {
    const exeBuffer = readFileSync(outExe);
    const iconBuffer = readFileSync(iconPath);

    const exe = NtExecutable.from(exeBuffer, { ignoreCert: true });
    const res = NtExecutableResource.from(exe);
    const iconFile = Data.IconFile.from(iconBuffer);
    const iconEntries = iconFile.icons.map((item) => item.data);

    Resource.IconGroupEntry.replaceIconsForResource(res.entries, 1, 1033, iconEntries);
    Resource.IconGroupEntry.replaceIconsForResource(res.entries, 101, 1033, iconEntries);

    res.outputResource(exe);
    writeFileSync(outExe, Buffer.from(exe.generate()));
    console.log('Icon successfully injected into binary headers.');
  } catch (err) {
    console.error('Failed to inject icon:', err.message);
  }
}

console.log(`Success! Clean executable created: ${outExe}`);