#!/usr/bin/env node
// PIL-RANGE-1b (§441) : l'ancien Aujourd'hui (tuiles d'avant, petites courbes, frise, carte Cave) est retiré ; ce harnais ne garde que ce qui vit encore.
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — TOUR-6 : DEUX CHEVAUCHEMENTS VUS PAR LE TOUR, TENUS PAR LE CALCUL (§182)
   Lancer : node scripts/mv-harnais-etiquettes.mjs          (+ --contre)

   ══ POURQUOI ══
   npm run tour (-- --dates) a vu, sur 17 écrans, « AUJ. » sur « OBJECTIF » dans la
   frise du cockpit (Pilotage › Aujourd'hui) et, à 375 px, « août 26 » sur « sept »
   dans l'échelle des mois des Archives. Le tour mesure des pixels dans un navigateur ;
   ce harnais tient la RÈGLE qui les évite, sans navigateur :
     A. _pilCockpitTimeline : deux repères à moins de _PIL_TL_ECART ne partagent pas
        l'étage de leurs étiquettes ; la frise s'écarte d'autant (classe n1 / n2).
     B. _cmpEchelle : sur 12 mois, en écran étroit (classe `imp` masquée par CSS),
        l'étiquette de tête reste, le mois qui la suit se cache, janvier et son année
        restent, jamais deux mois voisins visibles.
   ⚠️ CHEMINS : fileURLToPath (20/08).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const BASE = { pil: lire('src/pilotage.js'), regl: lire('src/reglages.js'), idx: lire('index.html'), css: lire('src/styles.css') };
const c = { g:s=>`\x1b[32m${s}\x1b[0m`, r:s=>`\x1b[31m${s}\x1b[0m`, dim:s=>`\x1b[2m${s}\x1b[0m`, b:s=>`\x1b[1m${s}\x1b[0m` };
function bloc(src, debut) {
  const i = src.indexOf(debut); if (i < 0) return null;
  let d = 0; const s = src.indexOf('{', i);
  for (let k = s; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); } }
  return null;
}

function jouer(S, silencieux) {
  let ok = 0, ko = 0; const rouges = [];
  const t = (lib, cond) => { if (cond) ok++; else { ko++; rouges.push(lib); } if (!silencieux) console.log('  ' + (cond ? c.g('✓') : c.r('✗')) + ' ' + lib); };
  try {

    if (!silencieux) console.log('\n' + c.b('B. L\u2019échelle des mois des Archives'));
    const mo = (S.regl.match(/var _CMP_MOIS=\[[^\]]*\];/) || [])[0];
    const nf = bloc(S.regl, 'function _cmpN('), ef = bloc(S.regl, 'function _cmpEchelle(');
    if (!mo || !nf || !ef) throw new Error('extraction échelle impossible');
    const E = new Function(mo + nf + ef + '\nreturn {e:_cmpEchelle, n:_cmpN};')();
    const vis = (d0, d1) => [...E.e(E.n(d0), E.n(d1)).matchAll(/<span class="([^"]*)"[^>]*>([^<]*)/g)].map((m, i) => ({ lib: m[2], cache: /\bimp\b/.test(m[1]) }));
    const L = vis('2026-08-01', '2027-07-31');
    const v = L.filter(x => !x.cache).map(x => x.lib);
    t('Étiquette de tête visible (août)', v[0] === 'août');
    t('Le mois qui la suit est caché (sept)', L[1] && L[1].lib === 'sept' && L[1].cache);
    t('Janvier reste visible (porte l\u2019année)', v.includes('janv'));
    let voisins = false; for (let i = 1; i < L.length; i++) if (!L[i].cache && !L[i - 1].cache) voisins = true;
    t('Jamais deux mois voisins visibles sur téléphone (' + v.join(' ') + ')', !voisins);
    t('Le masquage est bien réservé aux écrans étroits (@media max-width:520px)', /@media \(max-width:520px\)\{\.cmp-scale span\.imp\{display:none\}\}/.test(S.idx));
  } catch (e) { ko++; rouges.push('PLANTE : ' + e.message); if (!silencieux) console.log('  ' + c.r('✗ PLANTE : ' + e.message)); }
  return { ok, ko, rouges };
}

if (!process.argv.includes('--contre')) {
  console.log(c.b('MA VIGNE — Harnais TOUR-6 (étiquettes)'));
  const r = jouer(BASE, false);
  console.log('\n  ' + r.ok + ' verts · ' + (r.ko ? c.r(r.ko + ' rouge(s)') : '0 rouge') + '\n');
  process.exit(r.ko ? 1 : 0);
}
function muter(S, f, a, b) { if (!S[f].includes(a)) throw new Error('ancre introuvable : ' + a.slice(0, 50)); return Object.assign({}, S, { [f]: S[f].replace(a, b) }); }
const MUT = [
  ['l\u2019échelle ne cache plus rien sur téléphone', S => muter(S, 'regl', "    var imp=(pas===1) && i!==0 &&", "    var imp=false &&")],
  ['le mois qui suit l\u2019étiquette de tête reste visible', S => muter(S, 'regl', " || rang===1);", ");")],
];
console.log(c.b('MA VIGNE — Harnais TOUR-6 · contre-épreuves'));
let bad = 0;
for (const [lib, f] of MUT) {
  let S; try { S = f(BASE); } catch (e) { bad++; console.log('  ' + c.r('✗ ERREUR D\u2019INJECTION — ' + lib + ' : ' + e.message)); continue; }
  const r = jouer(S, true);
  if (r.ko) console.log('  ' + c.g('✓') + ' rougit : ' + lib + c.dim('  (' + r.rouges[0].slice(0, 60) + ')'));
  else { bad++; console.log('  ' + c.r('✗ RESTE VERT : ' + lib)); }
}
console.log('\n  ' + (MUT.length - bad) + '/' + MUT.length + ' contre-épreuves rougissent\n');
process.exit(bad ? 1 : 0);
