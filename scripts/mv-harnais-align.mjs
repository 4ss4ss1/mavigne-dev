// HARNAIS — ALIGN-1 (§236) : Pilotage › Aujourd'hui, la décision du jour en quatre tuiles bâties pareil.
//   node scripts/mv-harnais-align.mjs           → doit être vert
//   node scripts/mv-harnais-align.mjs --contre  → chaque défaut réinjecté doit rougir
// Nico (04/10, capture) : quatre cartes de même hauteur mais le contenu collé en haut, deux grands vides.
// Maquette validée : chaque tuile a les mêmes étages (verdict, raison, bande, pied), le pied collé en bas ;
// les listes (parcelles à nu, tension par personne) descendent dans .pil-dec2, 5 lignes et un bouton.
// ⚠️ Aucun harnais ne voit un écran : celui-ci garde la STRUCTURE (étages, ordre, rangées, CSS qui aligne),
//    le rendu à l'œil reste à faire sur appareil.
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const PIL0 = fs.readFileSync(path.join(R, 'src/pilotage.js'), 'utf8');
const CSS0 = fs.readFileSync(path.join(R, 'src/styles.css'), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}\n', i) + 3); }
const ZONES = ['pil-tz-big', 'pil-tz-rai', 'pil-tz-ban', 'pil-tz-pied'];
const enOrdre = s => { let k = -1; for (const z of ZONES) { const j = s.indexOf(z, k + 1); if (j < 0) return false; k = j; } return true; };
function suite(PIL, CSS) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const P = sansCom(PIL);
  for (const f of ['_pilCkPres(d)', '_pilCkTraiter()', '_pilCkPrio(d)', '_pilTuileTension(d)']) {
    const b = fn(P, 'function ' + f + '{');
    T(`la tuile ${f} porte les quatre étages, dans l’ordre`, b && /pil-tile2 pil-tz/.test(b) && enOrdre(b));
  }
  const a = P.indexOf("var dec='', det='';"), z = P.indexOf("if(det) H+=");
  const comp = a >= 0 && z > a ? P.slice(a, z) : '';
  T('la décision du jour : présents, traiter, priorité, tension — dans cet ordre', /dec\+=_pilCkPres\(d\)[\s\S]*dec\+=_pilCkTraiter\(\)[\s\S]*dec\+=_pilCkPrio\(d\)[\s\S]*dec\+=_pilTuileTension\(d\)/.test(comp));
  T('la protection et le détail de la tension descendent dans .pil-dec2', /det\+=_pilProtCarte\(\)/.test(comp) && /det\+=_pilCardTension\(d\)/.test(comp) && /if\(det\) H\+='<div class="pil-dec2">'/.test(P));
  T('« Traiter ? » ne porte plus la protection', !/_pilProtHtml\(\)/.test(fn(P, 'function _pilCkTraiter(){')));
  T('la protection montre 5 parcelles, le bouton déplie les autres', /_PIL_PROT_TOUT\?tot:5/.test(P) && /data-diag="prot_tout"/.test(P) && /cible==='prot_tout'\)\{ _PIL_PROT_TOUT=!_PIL_PROT_TOUT; renderPilotage\(\); return; \}/.test(P));
  T('le pied de chaque tuile est collé en bas', /\.pil-tz-pied\{margin-top:auto;/.test(CSS));
  T('la raison tient en deux lignes au plus, le verdict en une', /\.pil-tz-rai\{[^}]*-webkit-line-clamp:2/.test(CSS) && /\.pil-tz-big\{[^}]*white-space:nowrap/.test(CSS));
  T('le détail tient sa rangée, et prend toute la largeur quand il est seul', /\.pil-dec2\{display:grid;grid-template-columns:repeat\(auto-fit,minmax\(320px,1fr\)\)/.test(CSS));
  T('sur téléphone : les tuiles par deux', /@media \(max-width:600px\)\{\.pil-dec\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/.test(CSS));
  const ctx = { Math, String, Number, Array, Object,
    _pilTensData: () => ({ nRouge: 0, nSeuil: 1, L: { maxMoy: 44, maxHebdo: 48 }, rows: [
      { nom: 'Shana', f: 76, p: 75, ec: 1, niv: 'vert' }, { nom: 'Nico', f: 74, p: 65, ec: 14, niv: 'orange' }, { nom: 'Alicia', f: 39, p: 75, ec: -48, niv: 'vert' }] }),
    _pilEsc: s => String(s), _pilIco: () => '', _mvInfoBtn: k => '<i data-k="' + k + '"></i>', _pilTensFmtEc: e => (e > 0 ? '+' : '') + e + ' %' };
  vm.createContext(ctx);
  let h = '';
  try { vm.runInContext(fn(PIL, 'function _pilTuileTension(d){'), ctx); h = ctx._pilTuileTension({}); } catch (e) { h = 'PLANTE ' + e.message; }
  T('la tuile tension : le verdict, la personne au seuil, sa pastille, le bouton Planning', /1 personne au seuil/.test(h) && /<b>Nico<\/b>/.test(h) && /data-k="pil\.tension"/.test(h) && /data-diag="planning"/.test(h) && !/undefined|NaN|PLANTE/.test(h));
  return out;
}
function joue(P, C) { try { return suite(P, C); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
joue(PIL0, CSS0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nALIGN-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['la protection revient dans « Traiter ? »', p => p.replace(`<div class="pil-tz-pied">'+pied+'</div>`, `<div class="pil-tz-pied">'+pied+_pilProtHtml()+'</div>`), c => c],
  ['le pied flotte de nouveau', p => p, c => c.replace('.pil-tz-pied{margin-top:auto;', '.pil-tz-pied{')],
  ['la liste des parcelles n’a plus de limite', p => p.replace('_PIL_PROT_TOUT?tot:5', '_PIL_PROT_TOUT?tot:tot'), c => c],
  ['le bouton « Et N autres » ne fait plus rien', p => p.replace("cible==='prot_tout'", "cible==='prot_tout_x'"), c => c],
  ['la tension remonte sa liste dans la rangée du haut', p => p.replace('dec+=_pilTuileTension(d)', 'dec+=_pilCardTension(d)'), c => c],
  ['une tuile perd son pied', p => p.replace('<div class="pil-tz-pied"><button class="pil-diag-go ghost" data-diag="planning">', '<div class="pil-x"><button class="pil-diag-go ghost" data-diag="planning">'), c => c],
  ['la tuile tension ne nomme plus personne', p => p.replace("<b>'+_pilEsc(top.nom)+'</b>", "<b>?</b>"), c => c],
  ['sur téléphone, une tuile par ligne', p => p, c => c.replace('.pil-dec{grid-template-columns:repeat(2,minmax(0,1fr))', '.pil-dec{grid-template-columns:minmax(0,1fr)')],
  ['la raison déborde sans limite', p => p, c => c.replace('-webkit-line-clamp:2;', '')],
];
let rg = 0;
DEF.forEach(([n, fp, fc]) => {
  const P2 = fp(PIL0), C2 = fc(CSS0);
  if (P2 === PIL0 && C2 === CSS0) { console.log('  ⚠ non injecté : ' + n); return; }
  const rouge = joue(P2, C2).some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
});
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
