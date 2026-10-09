// HARNAIS — CADRE-1 (§300) : les cases dans leur cadre, la barre sous les fenêtres, la fiche rangée qui ne gèle plus rien.
//   node scripts/mv-harnais-cadre1.mjs           → doit être vert
//   node scripts/mv-harnais-cadre1.mjs --contre  → chaque défaut réinjecté doit rougir
// Trois défauts vus et mesurés dans un vrai navigateur le 09/10 (§300) :
//   · la règle « *,*::before,*::after{box-sizing:inherit} » du socle du cockpit valait pour TOUTE l'appli → tout passait en
//     content-box (case colorée de 72 px dans 67, 27 fenêtres sur 38 plus larges que leur cadre) ;
//   · la barre de sélection (z-index 560) passait devant la fenêtre de la journée (500) dès que la page ne s'animait pas ;
//   · la fiche rangée de « Les gens » gardait sa classe .overlay : tout le reste devenait inerte, et
//     « body.pl-gens-dock #page-planning{display:grid} » laissait la page affichée (et gelée) sous le module suivant.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), pl: L('src/planning.js'), liste: L('scripts/mv-harnais-liste.mjs') };
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
// Les règles (sélecteur, déclarations) d'une feuille, @media aplatis.
function regles(css) {
  const out = [], s = sansCom(css).replace(/@media[^{]*\{/g, '');
  const re = /([^{}]+)\{([^{}]*)\}/g; let m;
  while ((m = re.exec(s))) out.push({ sel: m[1].trim(), decl: m[2] });
  return out;
}
const zDe = (decl) => { const m = /z-index\s*:\s*(\d+)/.exec(decl); return m ? Number(m[1]) : null; };
function scene(S) {
  const cls = (set) => ({ add: (c) => set.add(c), remove: (c) => set.delete(c), contains: (c) => set.has(c), toggle: (c, on) => (on ? set.add(c) : set.delete(c)) });
  const corps = { insertBefore: (n) => { n.parentNode = corps; } }, pg = { id: 'page-planning', appendChild: (n) => { n.parentNode = pg; } };
  const ovCls = new Set(['overlay']), bodyCls = new Set();
  const ov = { id: 'ovPlanFiche', parentNode: corps, nextSibling: null, classList: cls(ovCls) };
  pg.querySelectorAll = () => [{ textContent: 'Nico' }];
  const doc = { getElementById: (id) => (id === 'page-planning' ? pg : id === 'ovPlanFiche' ? ov : null), body: { classList: cls(bodyCls) }, querySelectorAll: () => [] };
  const win = { matchMedia: () => ({ matches: true }), syncs: 0 }; win._mvOvSync = () => { win.syncs++; };
  const f = new Function('document', 'window', 'planTab', 'isAdmin', 'openPlanFiche',
    'var _planFicheNom=null, _plFicheChez=null;\n' + fonction(S.pl, 'function _plGensDesk(){') + '\n' + fonction(S.pl, 'function _plGensMarque(){') + '\n'
    + fonction(S.pl, 'function _plFicheFenetre(') + '\n' + fonction(S.pl, 'function _plGensDock(){')
    + '\n_plGensDock(); var a={ rangee: [].concat(document.getElementById("ovPlanFiche").classList.contains("pl2-rangee")), fen: document.getElementById("ovPlanFiche").classList.contains("overlay"), s1: window.syncs };'
    + '\nplanTab="mois"; _plGensDock(); a.fen2 = document.getElementById("ovPlanFiche").classList.contains("overlay"); a.rangee2 = document.getElementById("ovPlanFiche").classList.contains("pl2-rangee"); a.s2 = window.syncs; return a;');
  return f(doc, win, 'gens', () => true, () => { ovCls.add('open'); });
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const RG = regles(S.css);
  // 1-3. Le socle
  T('le socle de l’appli pose border-box sur tout élément', /\*\{margin:0;padding:0;box-sizing:border-box;/.test(S.css));
  const herit = RG.filter(r => /box-sizing\s*:\s*inherit/.test(r.decl));
  T('aucune règle « box-sizing:inherit » hors du cockpit (' + herit.length + ' règle·s, toutes bornées à .ck2)', herit.length > 0 && herit.every(r => r.sel.split(',').every(x => /^\.ck2\b/.test(x.trim()))));
  T('la racine du cockpit pose border-box, que ses enfants héritent', RG.some(r => r.sel === '.ck2' && /box-sizing\s*:\s*border-box/.test(r.decl)));
  // 4. La barre sous les fenêtres
  const zOv = (RG.find(r => r.sel === '.overlay' && zDe(r.decl) != null) || {}).decl, zB = RG.filter(r => /pl2-mbar\b|#plan-mbar\b/.test(r.sel) && zDe(r.decl) != null).map(r => zDe(r.decl));
  T('la barre de sélection reste sous les fenêtres (' + zB.join('/') + ' < ' + zDe(zOv || '') + ')', zB.length > 0 && zOv && zB.every(z => z < zDe(zOv)));
  // 5. Aucune page affichée hors de son état actif (§24 CSS n°1)
  const pages = [];
  RG.forEach(r => r.sel.split(',').forEach(x => { x = x.trim(); if (/#page-[a-z-]+(\.[\w-]+)*$/.test(x) && /(^|;)\s*display\s*:\s*(?!none)/.test(r.decl) && !/\.active\b/.test(x)) pages.push(x); }));
  T('aucune règle n’affiche une page qui n’est pas la page active' + (pages.length ? ' : ' + pages.join(' | ') : ''), pages.length === 0);
  // 6. La fiche rangée n'est plus une fenêtre (la vraie _plGensDock)
  let a = {}; try { a = scene(S); } catch (e) { a = { erreur: e.message }; }
  T('rangée sur « Les gens », la fiche quitte .overlay pour .pl2-rangee, et le verrou des fenêtres est rappelé', a.fen === false && a.rangee && a.rangee[0] === true && a.s1 === 1);
  T('rendue à sa place, elle redevient une fenêtre (.overlay) et le verrou est rappelé', a.fen2 === true && a.rangee2 === false && a.s2 === 2);
  // 7-8. Le dessin de la fiche rangée
  T('fermée et rangée, la fiche se cache (.overlay ne le fait plus pour elle)', S.css.includes('#ovPlanFiche.pl2-rangee:not(.open){ display:none!important; }'));
  const i = S.css.indexOf('★ PLAN-3 (§281)'), j = S.css.indexOf('★ FIN PLAN-3', i), B3 = i < 0 ? '' : S.css.slice(i, j);
  T('les règles des feuilles (PLAN-3) suivent la fiche rangée : 17 sélecteurs :is(.overlay,.pl2-rangee), plus aucun .overlay seul', (B3.match(/:is\(\.overlay,\.pl2-rangee\) \.pl2-/g) || []).length === 17 && B3.indexOf('.overlay .pl2-') < 0);
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-cadre1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-cadre1.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (ko && !CONTRE) process.exit(1);
if (CONTRE) {
  const DEF = [
    ['la règle du cockpit revient pour toute l’appli', 'css', '.ck2 *,.ck2 *::before,.ck2 *::after{box-sizing:inherit}', '*,*::before,*::after{box-sizing:inherit}', 1],
    ['la barre repasse devant les fenêtres', 'css', 'bottom:calc(64px + env(safe-area-inset-bottom,0px));z-index:450;', 'bottom:calc(64px + env(safe-area-inset-bottom,0px));z-index:560;', 3],
    ['la page « Les gens » reste affichée sous le module suivant', 'css', 'body.pl-gens-dock #page-planning.active{ display:grid;', 'body.pl-gens-dock #page-planning{ display:grid;', 4],
    ['rangée, la fiche reste une fenêtre (le gel)', 'pl', "  _plFicheFenetre(ov,false);   // CADRE-1 (§300) : rangée dans la page, elle n'est plus une fenêtre\n", '', 5],
    ['rendue, la fiche ne redevient pas une fenêtre', 'pl', "    _plFicheFenetre(ov,true);   // CADRE-1 (§300) : rendue à sa place, elle redevient une fenêtre\n", '', 6],
    ['fermée, la fiche rangée reste affichée', 'css', '#ovPlanFiche.pl2-rangee:not(.open){ display:none!important; }', '', 7],
    ['une règle des feuilles oublie la fiche rangée', 'css', ':is(.overlay,.pl2-rangee) .pl2-note{', '.overlay .pl2-note{', 8],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-cadre1.mjs'],", '', 9]
  ];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible]) => {
    const S = Object.assign({}, S0); if (!S[f].includes(de)) { console.log('  !! MOTIF ABSENT : ' + nom); return; }
    S[f] = S[f].replace(de, vers); if (S[f] === S0[f]) { console.log('  !! MUTATION SANS EFFET : ' + nom); return; }
    const r = jouer(S), ok = r[cible] && !r[cible][1]; console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  if (mord !== DEF.length) process.exit(1);
}
