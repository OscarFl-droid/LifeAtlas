import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'index.html','console/index.html','assets/app.js','assets/console.js','assets/db.js','assets/engine.js','assets/crypto.js',
  'assets/styles.css','data/ontology.json','data/action-templates.json','data/measurements.json','manifest.webmanifest','sw.js'
];
for (const path of required) await access(resolve(root, path));
for (const path of ['data/ontology.json','data/action-templates.json','data/measurements.json','manifest.webmanifest']) JSON.parse(await readFile(resolve(root,path),'utf8'));
const index = await readFile(resolve(root,'index.html'),'utf8');
const consoleHTML = await readFile(resolve(root,'console/index.html'),'utf8');
assert.match(index, /assets\/app\.js/);
assert.match(consoleHTML, /assets\/console\.js/);
const sw = await readFile(resolve(root,'sw.js'),'utf8');
for (const path of required.filter(path => !path.startsWith('tests/'))) {
  if (['console/index.html'].includes(path)) continue;
  if (path === 'sw.js') continue;
}
console.log('LifeAtlas package structure tests passed.');
