// HARNAIS — BULLE-1 (§314) : chaque « i » ouvre UNE bulle collée à lui — plus la feuille #ovInfo (Pilotage, Cave,
//   Documents), plus le texte nu en bas de page (Pilotage › Aujourd'hui, dont la bulle de la maquette avait perdu son
//   style au portage, REF-1 §266). Le VRAI calcul de position et le VRAI choix des paragraphes d'utils.js sont EXÉCUTÉS ;
//   l'écouteur, la fenêtre hôte (A11Y-2), Échap, la feuille de style et le branchement du cockpit se lisent dans le code,
//   commentaires retirés (§34g).
//   node scripts/mv-harnais-bulle1.mjs [--contre]
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { u: L('src/utils.js'), css: L('src/styles.css'), ck: L('src/cockpit-vue.js') };

// Une fonction découpée par ses accolades, chaînes et commentaires sautés.
function corps(src, debut) {
  const i = src.indexOf(debut); if (i < 0) return null;
  let n = 0, q = null;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    const c = src[j], d = src[j + 1];
    if (q) { if (c === '\\') j++; else if (c === q) q = null; continue; }
    if (c === '/' && d === '/') { j = src.indexOf('\n', j); if (j < 0) return null; continue; }
    if (c === '/' && d === '*') { j = src.indexOf('*/', j + 2) + 1; if (j <= 0) return null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '{') n++; else if (c === '}' && --n === 0) return src.slice(i, j + 1);
  }
  return null;
}
const nu = s => s.split('\n').filter(l => !l.trimStart().startsWith('//')).join('\n');
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');

// Le moteur : quatre fonctions pures d'utils.js, exécutées telles quelles.
function moteur(S) {
  const noms = ['function _mvBulleNu(', 'function _mvBulleParagraphes(', 'function _mvBulleLargeur(', 'function _mvBulleCalcul('];
  const code = noms.map(n => corps(S.u, n));
  if (code.some(c => !c)) throw new Error('moteur de la bulle introuvable : ' + noms.filter((n, k) => !code[k]).join(', '));
  const m = S.u.match(/var _MV_BULLE_COURT\s*=\s*(\d+)/); if (!m) throw new Error('_MV_BULLE_COURT introuvable');
  const ctx = { Math, String, Array }; vm.createContext(ctx);
  vm.runInContext('var _MV_BULLE_COURT = ' + m[1] + ';\n' + code.join('\n'), ctx);
  return ctx;
}

function controles(S) {
  const out = []; const t = (nom, ok, det) => out.push({ nom, ok: !!ok, det: det || '' });
  let M = null;
  try { M = moteur(S); t('le moteur de la bulle s\'exécute', true); }
  catch (e) { t('le moteur de la bulle s\'exécute', false, e.message); return out; }
  const J = o => JSON.stringify(o);
  const i = (l, h) => ({ l, t: h, r: l + 20, b: h + 20 });   // un « i » de 20 px

  // ══ 1. LA POSITION — un téléphone (390 × 844) et un ordinateur (1440 × 900) ══
  let c = M._mvBulleCalcul(i(185, 300), 390, 844, 335, 160, null);
  t('au milieu de l\'écran, la bulle se pose SOUS le « i » (10 px d\'écart)', c.cote === 'bas' && c.y === 330 && !c.maxH, J(c));
  c = M._mvBulleCalcul(i(185, 760), 390, 844, 335, 160, null);
  t('près du bas, elle passe AU-DESSUS', c.cote === 'haut' && c.y === 760 - 10 - 160 && !c.maxH, J(c));
  c = M._mvBulleCalcul(i(185, 200), 390, 844, 335, 1400, null);
  t('trop haute des deux côtés : du côté le plus grand, hauteur bornée à la place qui reste',
    c.cote === 'bas' && c.maxH === 844 - 220 - 10 - 12 && c.y === 230, J(c));
  c = M._mvBulleCalcul(i(185, 600), 390, 844, 335, 1400, null);
  t('… au-dessus quand c\'est là qu\'il y a le plus de place, collée au « i »',
    c.cote === 'haut' && c.maxH === 600 - 10 - 12 && c.y === 600 - 10 - c.maxH, J(c));
  c = M._mvBulleCalcul(i(4, 300), 390, 844, 335, 160, null);
  t('« i » au bord gauche : la bulle reste dans l\'écran (12 px), la pointe sous le « i »', c.x === 12 && c.ox === 16, J(c));
  c = M._mvBulleCalcul(i(1400, 300), 1440, 900, 360, 160, null);
  t('« i » au bord droit : la bulle s\'arrête à 12 px du bord, la pointe sous le « i »',
    c.x === 1440 - 360 - 12 && c.ox === 1410 - c.x, J(c));
  c = M._mvBulleCalcul(i(700, 300), 1440, 900, 360, 160, null);
  t('au milieu, la bulle est centrée sur le « i »', c.x === 710 - 180 && c.ox === 180, J(c));
  c = M._mvBulleCalcul(i(185, 760), 390, 844, 335, 160, 'bas');
  t('un côté imposé est tenu (suivre le « i » sans sauter d\'un bord à l\'autre)', c.cote === 'bas', J(c));
  c = M._mvBulleCalcul(i(185, 200), 390, 844, 335, 1400, 'bas', true);
  t('en suivant le « i », la hauteur déjà bornée ne se recalcule pas', !c.maxH && c.y === 230, J(c));
  t('largeur sur ordinateur : 360 px pour une fiche titrée, 320 pour une phrase',
    M._mvBulleLargeur(1440, true) === 360 && M._mvBulleLargeur(1440, false) === 320);
  t('… et jamais plus de 86 % d\'un téléphone', M._mvBulleLargeur(390, true) === 335 && M._mvBulleLargeur(390, false) === 320);

  // ══ 2. LES PARAGRAPHES ══
  const court = ['Un.', 'Deux.', 'Trois.'], long = ['A'.repeat(200), 'B'.repeat(200), 'C'.repeat(200)];
  let p = M._mvBulleParagraphes(['<b>' + 'x'.repeat(650) + '</b>'], false);
  t('un seul paragraphe, même long : tout, sans « Lire la suite »', p.vus.length === 1 && !p.suite);
  p = M._mvBulleParagraphes(court, false);
  t('une fiche courte (≤ 480 caractères) : tout, sans « Lire la suite »', p.vus.length === 3 && !p.suite);
  p = M._mvBulleParagraphes(long, false);
  t('une fiche longue : le premier paragraphe, puis « Lire la suite »', p.vus.length === 1 && p.vus[0] === long[0] && p.suite);
  p = M._mvBulleParagraphes(long, true);
  t('« Lire la suite » déplie tout', p.vus.length === 3 && !p.suite);
  t('les balises ne comptent pas dans la longueur',
    !M._mvBulleParagraphes(['<b>' + 'x'.repeat(220) + '</b>', '<b>' + 'y'.repeat(220) + '</b>'], false).suite);
  t('une fiche sans paragraphe ne casse rien', M._mvBulleParagraphes(undefined, false).vus.length === 0);

  // ══ 3. LA CHAÎNE — lue dans le code, commentaires retirés ══
  const U = nu(S.u);
  const ouvrir = corps(U, 'export function _mvInfoOpen(') || '';
  t('le « i » ouvre la bulle, plus la feuille #ovInfo', ouvrir.includes('_mvBulleOuvrir(') && !/openOv\(/.test(ouvrir));
  t('… la fiche vivante passe toujours avant le dictionnaire', /MV_INFO_LIVE\[cle\] \|\| MV_INFO\[cle\]/.test(ouvrir));
  const bu = corps(U, 'export function _mvBulleOuvrir(') || '';
  t('★★ dans une fenêtre, la bulle se pose DANS la fenêtre (A11Y-2 rend le reste inerte)',
    /closest\('\.overlay'\)/.test(bu) && /appendChild\(/.test(bu));
  t('un second toucher sur le même « i » referme sa bulle', /B\.ancre === ancre[^\n]*_mvBulleFermer/.test(bu));
  t('dans un tiroir ou une feuille fixe, la bulle passe juste au-dessus', /_mvBulleCouche\(ancre\)/.test(bu) && /z \+ 1/.test(bu));
  const k = U.indexOf("t.closest('[data-mvi]')");
  const debut = k < 0 ? -1 : U.lastIndexOf("document.addEventListener('click'", k);
  const ec = debut < 0 ? '' : U.slice(debut, U.indexOf('}, true);', k) + 9);
  t('l\'écouteur route [data-mvi] vers la bulle, en lui donnant le « i »', /_mvInfoOpen\(b\.getAttribute\('data-mvi'\), b,/.test(ec));
  const autour = ec.slice(ec.indexOf("t.closest('[data-mvi]')"), ec.indexOf('_mvInfoOpen(b.getAttribute'));
  t('… en arrêtant la propagation (sinon la carte se replie)', /e\.stopPropagation\(\)/.test(autour));
  const queue = ec.slice(ec.indexOf('if (!ouverte) return;'));
  t('★ un toucher à côté referme la bulle ET s\'arrête là (la carte dessous ne bouge pas)',
    ec.includes('if (!ouverte) return;') && /_mvBulleFermer\(false\);\s*if \(t\.closest\('\[data-bulle\]'\)\) return;\s*e\.preventDefault\(\);\s*e\.stopPropagation\(\);/.test(queue));
  t('… sauf sur un autre « i » géré par son module ([data-bulle]) : il ouvre le sien du premier coup',
    /if \(t\.closest\('\[data-bulle\]'\)\) return;/.test(queue));
  t('l\'écouteur passe AVANT ceux des écrans (phase de capture)', ec.endsWith('}, true);'));
  const kd = (() => { const a = U.indexOf("document.addEventListener('keydown', function (e) {\n    var B = _MV_BULLE;");
    return a < 0 ? '' : U.slice(a, U.indexOf('}, true);', a) + 9); })();
  t('★ Échap ferme la bulle AVANT la fenêtre (preventDefault, que _mvOvKey respecte)',
    /e\.preventDefault\(\);/.test(kd) && /_mvBulleFermer\(/.test(kd) && kd.endsWith('}, true);'));
  t('la bulle suit la page qui défile, et l\'écran qui tourne',
    /addEventListener\('scroll', _mvBulleDefile, \{ capture: true/.test(U) && /addEventListener\('resize', _mvBulleDefile/.test(U));
  t('la bulle est exposée pour le cockpit', /window\._mvBulleOuvrir\s*=\s*_mvBulleOuvrir/.test(U) && /window\._mvBulleFermer\s*=\s*_mvBulleFermer/.test(U));
  t('le nom de la pastille porte son accent (lecteur d\'écran)', U.includes('aria-label="D\\u2019o\\u00f9 vient ce chiffre"'));

  // ══ 4. L'HABILLAGE — le défaut d'origine : une bulle sans règle de style ══
  const CSS = sansCom(S.css);
  const regle = sel => { const a = CSS.indexOf(sel + '{'); return a < 0 ? '' : CSS.slice(a, CSS.indexOf('}', a) + 1); };
  const base = regle('.mv-bulle');
  t('★★ .mv-bulle a sa règle (position fixe, couche des bulles)', /position:fixed/.test(base) && /z-index:var\(--z-tip,800\)/.test(base));
  t('[hidden] est redit (sinon display:flex l\'emporte et la bulle vide reste à l\'écran)', /display:none/.test(regle('.mv-bulle[hidden]')));
  t('elle apparaît (.ouvert)', /opacity:1/.test(regle('.mv-bulle.ouvert')));
  t('la pointe dessous et la pointe dessus', CSS.includes('.mv-bulle[data-cote="bas"]::before{') && CSS.includes('.mv-bulle[data-cote="haut"]::before{'));
  t('le texte défile DANS la bulle, pas la pointe', /overflow-y:auto/.test(regle('.mv-bulle-c')) && !/overflow/.test(base));
  t('« Lire la suite » est stylé', regle('.mv-bulle-suite').length > 0);
  t('aucune règle orpheline de l\'ancienne bulle du cockpit', !/ck-pop/.test(CSS));

  // ══ 5. LE COCKPIT D'AUJOURD'HUI ══
  const CK = nu(sansCom(S.ck));
  t('★★ la bulle sans style de la maquette (#ck-pop) a disparu du cockpit', !/ck-pop/.test(CK));
  const oi = corps(CK, 'function ouvrirInfo(') || '';
  t('ses « i » ouvrent la bulle commune, avec leur texte', /window\._mvBulleOuvrir\(btn, \{ p: \[esc\(INFO\[k\]/.test(oi));
  t('… et se raccrochent au même « i » si le cockpit se redessine', /sig: '\.ck-i\[data-info="' \+ k \+ '"\]'/.test(oi));
  t('ses « i » se déclarent déclencheurs ([data-bulle])', /const btnI = [^\n]*data-bulle=""/.test(CK));
  t('plus aucune fermeture maison', !/fermerInfo/.test(CK));
  t('le premier Échap ne referme que la bulle (pas « Agrandir » en même temps)', /ev\.key !== 'Escape' \|\| ev\.defaultPrevented/.test(CK));
  return out;
}

// ══ Les contre-épreuves : chaque défaut réinjecté, en mémoire, doit faire rougir au moins une ligne ══
const MUT = [
  ['le « i » retombe dans la feuille', S => ({ ...S, u: S.u.replace('_mvBulleOuvrir(ancre, f, {', "openOv('ovInfo'); ({") })],
  ['la bulle se pose toujours sur <body>', S => ({ ...S, u: S.u.replace("ancre.closest('.overlay')", "ancre.closest('.overlay-nulle-part')") })],
  ['toujours dessous, même en bas de l\'écran', S => ({ ...S, u: S.u.replace("dessous >= dessus) ? 'bas' : 'haut';", "dessous >= dessus) ? 'bas' : 'bas';") })],
  ['la bulle déborde de l\'écran', S => ({ ...S, u: S.u.replace('Math.max(M, Math.min(vw - pw - M, cx - pw / 2))', '(cx - pw / 2)') })],
  ['tout le texte d\'un coup', S => ({ ...S, u: S.u.replace('return (tout || court) ?', 'return (true) ?') })],
  ['le toucher à côté passe à travers', S => ({ ...S, u: S.u.replace("if (t.closest('[data-bulle]')) return;\n    e.preventDefault();\n    e.stopPropagation();", "if (t.closest('[data-bulle]')) return;") })],
  ['Échap ferme aussi la fenêtre', S => ({ ...S, u: S.u.replace("!B.el || B.el.hidden) return;\n    e.preventDefault();", '!B.el || B.el.hidden) return;') })],
  ['la feuille de la bulle perdue (le défaut d\'origine)', S => ({ ...S, css: S.css.replace('.mv-bulle{', '.mv-bulle-perdue{') })],
  ['le cockpit revient à sa bulle sans style', S => ({ ...S, ck: S.ck.replace('<div class="ck-sr" id="ck-annonce"', '<div class="ck-pop" id="ck-pop" role="note" hidden><p></p></div> <div class="ck-sr" id="ck-annonce"') })],
  ['Échap du cockpit referme « Agrandir » en même temps', S => ({ ...S, ck: S.ck.replace(" || ev.defaultPrevented) return;", ') return;') })],
  ['les « i » du cockpit ne se déclarent plus', S => ({ ...S, ck: S.ck.replace(' data-bulle=""', '') })],
];

const V = '\u001b[32m', Rr = '\u001b[31m', T = '\u001b[0m';
let rouges = 0;
const jouer = S => { try { return controles(S); } catch (e) { return [{ nom: 'le harnais a planté', ok: false, det: e.message }]; } };
if (!CONTRE) {
  console.log('\n── BULLE-1 — la bulle des « i »\n');
  const res = jouer(SRC0);
  res.forEach(r => { if (!r.ok) rouges++; console.log('  ' + (r.ok ? V + '✓' : Rr + '✗') + T + ' ' + r.nom + (r.ok || !r.det ? '' : '\n      → ' + r.det)); });
  console.log('\n  ' + (res.length - rouges) + ' vertes, ' + rouges + ' rouges\n');
} else {
  console.log('\n── BULLE-1 — contre-épreuves\n');
  const ref = jouer(SRC0);
  if (ref.some(r => !r.ok)) { console.log('  ' + Rr + '✗' + T + ' la référence n\'est pas verte : contre-épreuves sans objet'); process.exit(1); }
  for (const [nom, f] of MUT) {
    const S = f(SRC0);
    const change = S.u !== SRC0.u || S.css !== SRC0.css || S.ck !== SRC0.ck;
    const ko = change ? jouer(S).filter(r => !r.ok) : [];
    const mord = change && ko.length > 0;
    if (!mord) rouges++;
    console.log('  ' + (mord ? V + '✓' : Rr + '✗') + T + ' ' + nom + (change ? (mord ? '  →  ' + ko[0].nom : '  →  RIEN NE ROUGIT') : '  →  défaut NON injecté (ancre perdue)'));
  }
  console.log('\n  ' + (MUT.length - rouges) + ' contre-épreuves sur ' + MUT.length + '\n');
}
process.exit(rouges ? 1 : 0);
