// HARNAIS — KIT-3 (§228) : lot 3b du kit — barres de la Vigne, du Planning et du Tracteur ; un cercle ; la journée
// de repli des échéances lue dans le modèle du planning.
//   node scripts/mv-harnais-kit3.mjs           → doit être vert
//   node scripts/mv-harnais-kit3.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIS _pilJourModele et _pilEchCadence (src/pilotage.js) ; lit le reste dans les sources.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { pil: L('src/pilotage.js'), app: L('src/app.js'), css: L('src/styles.css') };
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); }

function cadence(S, avecModele) {
  const t = new Date(), o = Math.round((Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) - Date.UTC(2026, 0, 1)) / 86400000);
  const C = [0]; for (let k = 0; k < 60; k++) { const d = new Date(Date.UTC(2026, 0, 1) + (o + k) * 86400000).getUTCDay(); C.push(C[C.length - 1] + ((d >= 1 && d <= 5) ? 5.6 : 0)); }
  const ctx = { Math, Number, Date, window: { CONFIG: { eco: {} }, _mvEffDef: () => 1 },
    _rfCd: avecModele ? () => ({ capCum: C, spanS: o }) : () => null };
  vm.createContext(ctx);
  vm.runInContext(sansCom(fn(S.pil, 'function _pecHJour(){')) + '\n' + sansCom(fn(S.pil, 'function _pilJourModele(){')) + '\n'
    + sansCom(fn(S.pil, 'function _pilEchCadence(d){')) + '\nthis.__e=_pilEchCadence;', ctx);
  return ctx.__e({ membres: [{ nom: 'A' }, { nom: 'B' }] });
}
const pres = (a, b) => Math.abs(a - b) < 1e-6;
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const r1 = cadence(S, true);
  T('échéances, sans présence mesurée : la journée vient du MODÈLE du planning (5,6 h, deux personnes → 11,2 h/j)', pres(r1.hPers, 5.6) && pres(r1.cadH, 11.2) && r1.estim === true);
  const r0 = cadence(S, false);
  T('… et la journée réglée (7 h) ne sert qu\u2019en dernier recours', pres(r0.hPers, 7) && pres(r0.cadH, 14));
  const css = S.css, apres = (sel, decl) => { const i = css.lastIndexOf(sel + '{' + decl); return i > 0 && i > css.indexOf(sel + '{'); };
  T('barres fines (6 px, pilule) : fiche rapide, Planning, tracteur en cours, Accueil',
    apres('.mq-barwrap', 'height:6px;border-radius:3px;') && apres('.pl2-mc-track', 'height:6px;border-radius:3px;') && apres('.trac-encours-bar-track', 'height:6px;border-radius:3px;')
    && apres('.hv2-prog-track', 'height:6px;border-radius:3px;') && apres('.pc-bar', 'height:6px;border-radius:3px;'));
  T('barres normales (10 px) : ma part du chantier, rendement de la tournée', apres('.hmp-bar', 'height:10px;border-radius:5px;') && apres('.pil-dz-rdt-bar', 'height:10px;border-radius:5px;'));
  T('sessions tracteur : vert fini, doré en cours (plus orange, réservé au retard)',
    apres('.sc-bfill', 'border-radius:3px;background:var(--vert-med);') && css.includes('.sc-bfill-enc{background:var(--or)!important;}'));
  T('la fiche rapide de la carte : la couleur d\u2019état de la parcelle', S.app.includes("bar.style.background=cl.fill;") && S.app.includes("pe.style.color=(cl.pct===100?'var(--vert-med)':'var(--texte)');"));
  T('un seul cercle : 168 px (donut de La campagne, anneau d\u2019Économie)', css.includes('.pil-donut-s{width:168px;height:168px;}') && S.pil.includes('width="168" height="168" style="max-width:168px;margin:0 auto"'));
  return out;
}
let ok = 0, ko = 0;
suite(SRC0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nKIT-3 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const sub = (k, a, b) => S => Object.assign({}, S, { [k]: S[k].replace(a, b) });
const D = [
  ['le repli reprend la journée de 7 h', sub('pil', "var hJ=((typeof _pilJourModele==='function')?_pilJourModele():0)||_pecHJour();", 'var hJ=_pecHJour();')],
  ['le modèle compte les jours non travaillés', sub('pil', 'var h=C[k+1]-C[k]; if(h>0){ s+=h; n++; }', 'var h=C[k+1]-C[k]; s+=h; n++;')],
  ['la fiche rapide reprend le dégradé', sub('app', 'bar.style.background=cl.fill;', 'bar.style.background=cl.col;')],
  ['la session en cours redevient orange', sub('css', '.sc-bfill-enc{background:var(--or)!important;}', '.sc-bfill-enc{background:var(--orange)!important;}')],
  ['le donut reprend sa taille', sub('css', '.pil-donut-s{width:168px;height:168px;}', '.pil-donut-s{width:184px;height:184px;}')],
];
let rg = 0;
D.forEach(([n, f]) => {
  const S = f(SRC0);
  if (Object.keys(S).every(k => S[k] === SRC0[k])) { console.log('  \u26a0 non injecté : ' + n); return; }
  let res; try { res = suite(S); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + n);
});
console.log(`\n${rg}/${D.length} défauts détectés`);
process.exit(rg === D.length ? 0 : 1);
