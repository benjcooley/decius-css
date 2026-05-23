// Dev-only: make an auto-opening copy of the kitchen sink for screenshot verification.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root } from '../lib.mjs';

const distUrl = 'file:///' + resolve(root, 'dist').replace(/\\/g, '/');
let html = readFileSync(resolve(root, 'examples/kitchen-sink.html'), 'utf8')
  .replaceAll('../dist', distUrl);
const script = `<script>window.addEventListener('load',()=>setTimeout(()=>{
  document.querySelector('[data-dcs-target="#m1"]').click();
  document.querySelector('[data-dcs-target="#pop1"]').click();
  decius.toast({title:'Saved',message:'scene.blend written',variant:'ok'});
  decius.toast({title:'Render failed',message:'GPU out of memory',variant:'danger'});
},300));<\/script>`;
html = html.replace('</body>', script + '</body>');
writeFileSync(resolve(root, '.cache/ks-open.html'), html);
console.log('wrote .cache/ks-open.html');
