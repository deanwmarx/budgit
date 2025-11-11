import * as universal from '../entries/pages/_page.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+page.js";
export const imports = ["_app/immutable/nodes/2.KUZ2bo55.js","_app/immutable/chunks/BOQhAMOo.js","_app/immutable/chunks/ChTlyFlX.js","_app/immutable/chunks/C0WG1Ef3.js","_app/immutable/chunks/BkKJFjph.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/x0oHCbIn.js","_app/immutable/chunks/CBscU4cN.js"];
export const stylesheets = [];
export const fonts = [];
