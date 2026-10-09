// HARNAIS — TRAC-2 (§283) : l'Entretien du Tracteur sur deux colonnes (maquette v6) — éléments existants rangés, pas recréés.
//   node scripts/mv-harnais-trac2.mjs           → doit être vert
//   node scripts/mv-harnais-trac2.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue la VRAIE _trEntDock sur un faux DOM : au large, le filtre et la cuve vont dans #ent-gauche ; au téléphone, ils reviennent.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { tr: L('src/tracteur.js'), css: L('src/styles.css'), uti: L('src/utils.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function bloc(css) { const i = css.indexOf('★ TRAC-2 (§283)'); if (i < 0) return ''; const j = css.indexOf('★ FIN TRAC-2', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function noeud(id) { return { id, parentNode: null, enfants: [], appendChild(n) { if (n.parentNode) n.parentNode.retirer(n); n.parentNode = this; this.enfants.push(n); }, insertBefore(n) { if (n.parentNode) n.parentNode.retirer(n); n.parentNode = this; this.enfants.unshift(n); }, removeChild(n) { this.retirer(n); n.parentNode = null; }, retirer(n) { this.enfants = this.enfants.filter((x) => x !== n); } }; }
function scene(S, large) {
  const pan = noeud('trac-panel-entretiens'), liste = noeud('entretiens-list'), filtre = noeud('ent-trac-filter');
  const cuve = noeud('cuve'); cuve.querySelector = (q) => (/openGnrAppoint/.test(q) ? {} : null); cuve.className = 'ent-resume-card';
  const rev = noeud('rev'); rev.querySelector = () => null; rev.className = 'ent-resume-card';
  pan.appendChild(filtre); pan.appendChild(liste); liste.appendChild(cuve); liste.appendChild(rev);
  liste.querySelectorAll = () => liste.enfants.filter((x) => x.className === 'ent-resume-card');
  pan.firstChild = null;
  let g = null;
  const doc = { getElementById: (id) => ({ 'trac-panel-entretiens': pan, 'ent-trac-filter': filtre, 'entretiens-list': liste, 'ent-gauche': g })[id] || null,
    createElement: () => { g = noeud('ent-gauche'); g.querySelector = () => g.enfants.find((x) => x.className === 'ent-resume-card') || null; return g; } };
  const f = new Function('document', '_trDesk', fonction(S.tr, 'function _trEntDock(){') + '\n_trEntDock(); return 1;');
  f(doc, () => large);
  const r = { gauche: g ? g.enfants.map((x) => x.id).join(',') : '', listeAprès: liste.enfants.map((x) => x.id).join(',') };
  if (large) { f(doc, () => false); r.retour = (filtre.parentNode === pan) && !(g && g.parentNode === pan); }
  return r;
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  let a = {}, b = {}; try { a = scene(S, true); b = scene(S, false); } catch (e) { a = { erreur: e.message }; }
  T('au large, le filtre des machines et la cuve passent à gauche, la révision reste dans la liste', a.gauche === 'ent-trac-filter,cuve' && a.listeAprès === 'rev');
  T('au téléphone, rien n’est rangé ; en repassant à l’étroit, le filtre revient en tête et la colonne disparaît', b.gauche === '' && b.listeAprès === 'cuve,rev' && a.retour === true);
  T('le rangement suit chaque rendu de l’Entretien (changer de machine ne passe pas par renderTracteur)', S.tr.includes("  _trEntDock();   // TRAC-2 (§283) : aussi quand on change de machine ou d'onglet sans passer par renderTracteur\n}"));
  T('le bloc TRAC-2 est posé après TRAC-1, par jetons seulement (' + dur.length + ')', B.length > 2500 && S.css.indexOf('★ TRAC-2 (§283)') > S.css.indexOf('★ FIN TRAC-1') && dur.length === 0);
  T('deux colonnes sur ordinateur, la gauche collante ; les machines en liste, la choisie à l’accent', B.includes('#page-tracteur #trac-panel-entretiens{ display:grid; grid-template-columns:var(--l-list,400px) minmax(0,1fr);') && B.includes('#ent-gauche #ent-trac-filter .chip.active{ background:var(--accent-doux)!important;'));
  T('l’appoint et la nouvelle fiche à l’accent, l’anomalie non traitée en rouge pâle', B.includes('button[onclick*="openGnrAppoint"]{ border:0!important; background:var(--accent)!important;') && B.includes('#page-tracteur #ent-add-btn{ border:0!important; border-radius:var(--r-sm,6px)!important; background:var(--accent)!important;') && B.includes('#page-tracteur .ent-ano-banner{'));
  T('l’aide dit les deux colonnes de l’Entretien', S.uti.includes('Dans l’Entretien, les machines et la cuve de GNR passent à gauche'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-trac2.mjs'],") && S.liste.includes("['node scripts/mv-harnais-trac2.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['la cuve reste dans la liste', 'tr', "  if(cuve&&cuve.parentNode!==g)g.appendChild(cuve);\n", '', 0],
    ['le téléphone range quand même', 'tr', "  if(!_trDesk()){\n    // ⚠️ g.parentNode===pan", "  if(false){\n    // ⚠️ g.parentNode===pan", 1],
    ['le rendu de l’Entretien oublie de ranger', 'tr', "  _trEntDock();   // TRAC-2 (§283) : aussi quand on change de machine ou d'onglet sans passer par renderTracteur\n", '', 2],
    ['une couleur écrite en dur dans le bloc', 'css', '#page-tracteur .ent-ano-banner{ border:0!important; border-radius:var(--r-sm,6px)!important; background:var(--danger-doux)!important;', '#page-tracteur .ent-ano-banner{ border:0!important; border-radius:var(--r-sm,6px)!important; background:#F8E5E0!important;', 3],
    ['l’appoint perd l’accent', 'css', 'button[onclick*="openGnrAppoint"]{ border:0!important; background:var(--accent)!important;', 'button[onclick*="openGnrAppoint"]{ border:0!important;', 5],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-trac2.mjs'],", '', 7]
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
if (ko) process.exit(1);
