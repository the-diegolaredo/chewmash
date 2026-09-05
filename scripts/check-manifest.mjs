import { readFile } from 'node:fs/promises';

const manifestPath = '.output/chrome-mv3/manifest.json';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

const expectedPermissions = ['storage', 'tabs'];
const expectedHosts = ['https://get.cbord.com/calpoly/*'];

function sorted(values = []) {
  return [...values].sort();
}

function sameValues(actual = [], expected = []) {
  return JSON.stringify(sorted(actual)) === JSON.stringify(sorted(expected));
}

if (manifest.manifest_version !== 3) {
  throw new Error(`Expected Manifest V3, got ${manifest.manifest_version}`);
}

if (!sameValues(manifest.permissions, expectedPermissions)) {
  throw new Error(`Unexpected permissions: ${JSON.stringify(manifest.permissions ?? [])}`);
}

if (!sameValues(manifest.host_permissions, expectedHosts)) {
  throw new Error(`Unexpected host permissions: ${JSON.stringify(manifest.host_permissions ?? [])}`);
}

for (const script of manifest.content_scripts ?? []) {
  for (const match of script.matches ?? []) {
    if (!match.startsWith('https://get.cbord.com/calpoly/')) {
      throw new Error(`Unexpected content-script match: ${match}`);
    }
  }
}

if (JSON.stringify(manifest).includes('<all_urls>')) {
  throw new Error('Generated manifest unexpectedly contains <all_urls>.');
}

console.log(`Manifest security check passed for ChewMash ${manifest.version}.`);
