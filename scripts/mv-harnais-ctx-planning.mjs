#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   MA VIGNE — HARNAIS CTX-1 : L'ANNÉE DE CALCUL NE FUIT JAMAIS
   (méthode C20 : lecture du VRAI src/planning.js, _planSurAnnee exécutée telle quelle)

   `_planCtxYear` dit à _pY() sur quelle année calculer (§19, _planSurAnnee). Une
   fonction qui la pose sans la rendre laisse TOUT le Planning sur la mauvaise année —
   et depuis le lot du 28/09, les clés d'heures sup et du solde de départ la suivent :
   une fuite enverrait une saisie dans l'année d'à côté.

     A. _planSurAnnee rend l'année d'avant : sortie normale, exception, imbrication
     B. personne ne remet l'année à `null` (c'était « rendre » la mauvaise valeur)
     C. toute fonction qui pose l'année à la main le fait sous un `finally`

     node scripts/mv-harnais-ctx-planning.mjs            # contrôle
     node scripts/mv-harnais-ctx-planning.mjs --contre   # contre-épreuves
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ICI, '..', 'src', 'planning.js');
const CONTRE = process.argv.includes('--contre');

// Corps d'une fonction à partir de sa première accolade (profondeur d'accolades).
function corpsDepuis(source, i) {
  let j = source.indexOf('{', i), prof = 0, k = j;
  for (; k < source.length; k++) {
    const c = source[k];
    if (c === '{') prof++;
    else if (c === '}') { prof--; if (prof === 0) { k++; break; } }
  }
  return source.slice(i, k);
}

function jouer(source) {
  const ECHECS = [];
  let verts = 0;
  const ok = (c, m) => { if (c) verts++; else ECHECS.push(m); };

  // ── A. la primitive, exécutée ──
  const iSA = source.indexOf('window._planSurAnnee=function');
  if (iSA < 0) { ECHECS.push('EXTRACTION : window._planSurAnnee=function introuvable'); return { verts, ECHECS }; }
  const fSA = corpsDepuis(source, iSA);
  try {
    const M = new Function(`
      var planYear=2026,_planCtxYear=null,window={};
      function _pY(){ return _planCtxYear!=null?_planCtxYear:planYear; }
      ${fSA};
      return {SA:window._planSurAnnee, pY:_pY, ctx:function(){return _planCtxYear;}};`)();
    ok(M.SA(2025, () => M.pY()) === 2025, 'A. sous _planSurAnnee(2025), _pY() doit valoir 2025');
    ok(M.ctx() === null && M.pY() === 2026, 'A. après une sortie normale, l’année d’avant doit être rendue');
    let jete = false;
    try { M.SA(2024, () => { throw new Error('boum'); }); } catch (e) { jete = true; }
    ok(jete, 'A. une exception doit remonter à l’appelant');
    ok(M.ctx() === null, 'A. après une exception, l’année d’avant doit être rendue');
    const vu = M.SA(2025, () => [M.pY(), M.SA(2027, () => M.pY()), M.pY()]);
    ok(vu[0] === 2025 && vu[1] === 2027 && vu[2] === 2025, 'A. imbrication : l’année extérieure doit revenir (vu ' + vu.join('/') + ')');
    ok(M.SA(null, () => M.pY()) === 2026, 'A. _planSurAnnee(null) garde l’année courante');
  } catch (e) { ECHECS.push('A. PLANTAGE : ' + e.message); }

  // ── B. aucune remise à null ──
  const lignes = source.split('\n');
  const aNull = [];
  lignes.forEach((l, n) => {
    const code = l.replace(/\/\/.*$/, '');
    if (/_planCtxYear\s*=\s*null/.test(code) && !/^\s*var _planCtxYear\s*=\s*null;/.test(code)) aNull.push(n + 1);
  });
  ok(aNull.length === 0, 'B. `_planCtxYear=null` hors déclaration, ligne(s) ' + aNull.join(', '));

  // ── C. toute pose à la main est sous un finally, dans la même fonction ──
  const tetes = /(?:^|\n)(?:function\s+([A-Za-z_$][\w$]*)\s*\(|window\.([A-Za-z_$][\w$]*)\s*=\s*function\s*\()/g;
  let m, poseurs = 0;
  const fautifs = [];
  while ((m = tetes.exec(source))) {
    const debut = m.index + (m[0].startsWith('\n') ? 1 : 0);
    const nom = m[1] || m[2];
    const corps = corpsDepuis(source, debut).replace(/\/\/[^\n]*/g, '');
    if (!/_planCtxYear\s*=(?!=)/.test(corps)) continue;
    poseurs++;
    if (!/\bfinally\b/.test(corps)) fautifs.push(nom + ' (l. ' + source.slice(0, debut).split('\n').length + ')');
  }
  ok(poseurs > 0, 'C. aucun poseur trouvé : l’extraction est cassée');
  ok(fautifs.length === 0, 'C. année posée sans finally dans : ' + fautifs.join(', '));

  return { verts, ECHECS };
}

const source = fs.readFileSync(SRC, 'utf8');

if (!CONTRE) {
  const { verts, ECHECS } = jouer(source);
  console.log('\n  HARNAIS CTX-1 — l’année de calcul ne fuit jamais\n');
  ECHECS.forEach(e => console.log('  ✗ ' + e));
  console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge');
  process.exit(ECHECS.length ? 1 : 0);
}

const DEFAUTS = [
  ['_planSurAnnee ne rend plus l’année sur exception',
    s => s.replace('  try{ return fn(); } finally { _planCtxYear=_sv; }\n};', '  var r=fn(); _planCtxYear=_sv; return r;\n};')],
  ['une fonction remet l’année à null',
    s => s.replace('function _planCpDayType(mbr,plId,yr,mi,d){', 'function _planCpDayType(mbr,plId,yr,mi,d){ if(0)_planCtxYear=null;')],
  ['une fonction pose l’année sans finally',
    s => s.replace('function _planCpCount(plId,marked,mode){', 'function _planCpCount(plId,marked,mode){ var _k=_planCtxYear; _planCtxYear=2025; _planCtxYear=_k;')]
];
let rates = 0;
console.log('\n  HARNAIS CTX-1 — contre-épreuves\n');
DEFAUTS.forEach(([n, f]) => {
  const muté = f(source);
  if (muté === source) { rates++; console.log('  ✗ défaut « ' + n + ' » : injection impossible (ancre introuvable)'); return; }
  const { ECHECS } = jouer(muté);
  if (ECHECS.length) console.log('  ✓ « ' + n + ' » → ' + ECHECS.length + ' rouge(s)');
  else { rates++; console.log('  ✗ « ' + n + ' » n’est PAS vu par le harnais'); }
});
console.log('\n  ' + (DEFAUTS.length - rates) + '/' + DEFAUTS.length + ' défauts attrapés');
process.exit(rates ? 1 : 0);
