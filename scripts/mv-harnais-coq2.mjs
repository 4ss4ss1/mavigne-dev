// HARNAIS — COQ-2 (§271) : la barre latérale, la recherche Ctrl K et le dock au dessin de la maquette v2.
//   node scripts/mv-harnais-coq2.mjs           → doit être vert
//   node scripts/mv-harnais-coq2.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions de la recherche (_palEntrees, _palTrier, extraites de src/coquille.js) ; lit le reste
// sur le texte : le balisage de la barre, les gestes, le bloc CSS COQ-2 (par jetons seulement), le guide, la liste.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { coq: L('src/coquille.js'), css: L('src/styles.css'), guide: L('guide/01-demarrer.html'), liste: L('scripts/mv-harnais-liste.mjs') };

// Une fonction affectée à window, extraite par ses accolades (jamais par expression régulière : §24).
function fonction(src, debut) {
  const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut);
  let k = src.indexOf('{', i), prof = 0;
  for (; k < src.length; k++) { if (src[k] === '{') prof++; else if (src[k] === '}' && --prof === 0) break; }
  return src.slice(i, k + 1) + ';';
}
function recherche(S) {
  const win = { openJournalEntry: () => 0, applyTheme: () => 0 }, doc = { documentElement: { getAttribute: () => 'light' } };
  const sa = S.coq.slice(S.coq.indexOf('const sansAccent'), S.coq.indexOf('\n', S.coq.indexOf('const sansAccent')));
  const og = "function ongletsPil(){ return [['auj','Aujourd’hui'],['eco','Économie']]; }";
  return new Function('window', 'document', sa + '\n' + og + '\n' + fonction(S.coq, 'window._palEntrees = function') + '\n' + fonction(S.coq, 'window._palTrier = function') + '\nreturn window;')(win, doc);
}
function bloc(css) { const i = css.indexOf('★ COQ-2 (§271)'); if (i < 0) return ''; const j = css.indexOf('★ FIN COQ-2', i); return css.slice(i, j < 0 ? undefined : j); }
// Retire chaque var(--x[, repli]) en entier, parenthèses équilibrées : le repli est la valeur du jeton (règle DS-0).
function sansVar(s) {
  let out = '', i = 0;
  for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3;
    for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; }
}
function enDur(b) {
  const c = sansVar(b.replace(/\/\*[\s\S]*?\*\//g, ''));
  return c.match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
}

function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  T('la barre affiche la marque en tête et le domaine dessous (comme la maquette v2)',
    S.coq.includes(`<b>Ma Vigne</b><small title="' + esc(dom.sous) + '">' + esc(dom.nom) + '</small>`));
  T('le bouton qui replie est sur la ligne de la personne, en icône de panneau, et garde son identifiant',
    /<div class="mv-rail-moi">[\s\S]*?<button class="mv-rail-plier" id="mv-rail-plier"[\s\S]*?<rect x="3" y="3" width="18" height="18" rx="2"\/><path d="M9 3v18"\/><\/svg><\/button><\/div><\/div>';/.test(S.coq));
  T('la personne est dite par ses deux initiales', S.coq.includes("slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')"));
  let W = null; try { W = recherche(S); } catch (e) { W = null; }
  const items = [{ p: 'home', l: 'Vigne', ic: 'feuille' }, { p: 'pilotage', l: 'Pilotage', ic: 'graphique' }];
  const E = W ? W._palEntrees(items, [{ nom: 'Les Crais', appellation: 'Gevrey-Chambertin', surface: 0.41 }]) : [];
  T('la recherche range en « Aller à », « Parcelles », « Actions » ; les onglets du Pilotage vont dans « Aller à »',
    E.length && [...new Set(E.map(x => x.g))].join('|') === 'Aller à|Parcelles|Actions'
    && E.some(x => x.t === 'Économie' && x.g === 'Aller à' && x.s === 'Pilotage') && E.some(x => x.t === 'Les Crais' && x.s === 'Gevrey-Chambertin'));
  const vide = W ? W._palTrier(E, '') : [];
  T('sans rien taper : une action, puis les écrans — ni onglet, ni parcelle',
    vide.length > 1 && vide[0].g === 'Actions' && vide.slice(1).every(x => x.g === 'Aller à' && !x.s));
  const econ = W ? W._palTrier(E, 'econ') : [];
  T('en tapant, le classement de PAL-1 reste (le titre qui commence par la recherche d’abord)', econ.length && econ[0].t === 'Économie');
  T('les trois actions font ce qu’elles disent (journal, thème gardé, barre)',
    S.coq.includes("if (x.go.act === 'journal') { window.openJournalEntry(); return; }")
    && S.coq.includes("try { localStorage.setItem('mavigne_theme', m); }") && S.coq.includes("window.applyTheme(m); return; }")
    && S.coq.includes("if (x.go.act === 'barre') { plier(!document.body.classList.contains('mv-rail-ouvert'), true); return; }"));
  T('« [ » replie ou déplie la barre, hors d’un champ, seulement quand la barre existe',
    /ev\.key === '\[' && !champ && !ouverte && !ev\.ctrlKey && !ev\.metaKey && !ev\.altKey && document\.body\.classList\.contains\('mv-avec-rail'\)/.test(S.coq));
  T('le pied de la recherche dit choisir, ouvrir, fermer', S.coq.includes('> choisir</span><span><kbd>↵</kbd> ouvrir</span><span><kbd>Échap</kbd> fermer</span>'));
  const B = bloc(S.css), dur = enDur(B);
  T('le bloc COQ-2 est posé après les règles de COQ-1, et n’écrit aucune valeur en dur (' + dur.length + ')',
    B.length > 2000 && S.css.indexOf('★ COQ-2 (§271)') > S.css.lastIndexOf('.mv-rail-plier svg{') && dur.length === 0);
  T('la barre quitte le brun : fond neutre, filet, écran ouvert marqué par l’accent seulement',
    B.includes('body .mv-rail{ background:var(--bg-app); border-right:var(--bw) solid var(--ligne,#E7E6E2);')
    && B.includes('body .mv-rail .mv-rail-b[aria-current="page"]>svg{ color:var(--accent-texte); }') && B.includes('[aria-current="page"]::before{ display:none; }'));
  T('le dock à plat : plus de filet dégradé, l’écran ouvert à l’accent', B.includes('body #mv-dock::before{ display:none; }') && B.includes('body #mv-dock .mv-dk.on .mv-dk-ic{ color:var(--accent-texte); background:none; }'));
  T('les jetons de la recherche sont déclarés une fois (--l-cmdk, --h-cmdk)', (S.css.match(/--l-cmdk:600px; --h-cmdk:52px;/g) || []).length === 1);
  T('le guide dit la touche « [ » et les trois actions', S.guide.includes('la touche « [ », la replie et la déplie') && S.guide.includes('Elle propose aussi trois actions'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-coq2.mjs'],") && S.liste.includes("['node scripts/mv-harnais-coq2.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['la marque disparaît de la barre', 'coq', '<b>Ma Vigne</b>', "<b>' + esc(dom.nom) + '</b>", 0],
    ['le bouton qui replie reprend une flèche', 'coq', '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>', '<path d="M14.5 6l-6 6 6 6"/>', 1],
    ['une seule initiale', 'coq', "slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')", "slice(0, 1).map(w => w.charAt(0).toUpperCase()).join('')", 2],
    ['les écrans reprennent leur ancien groupe', 'coq', "g: 'Aller à', t: x.l", "g: 'Écrans', t: x.l", 3],
    ['sans rien taper, les parcelles reviennent', 'coq', "entrees.filter(x => x.g === 'Actions').slice(0, 1).concat(entrees.filter(x => x.g === 'Aller à' && !x.s))", "entrees.filter(x => x.g !== 'Actions')", 4],
    ['le thème choisi n’est plus gardé', 'coq', "try { localStorage.setItem('mavigne_theme', m); }", 'try { }', 6],
    ['« [ » agit aussi dans un champ', 'coq', "ev.key === '[' && !champ", "ev.key === '['", 7],
    ['une couleur écrite en dur dans le bloc', 'css', 'body .mv-rail{ background:var(--bg-app);', 'body .mv-rail{ background:#14110D;', 9],
    ['le filet dégradé du dock revient', 'css', 'body #mv-dock::before{ display:none; }', '', 11],
    ['le guide oublie la touche « [ »', 'guide', 'la touche « [ », la replie et la déplie', 'la replie', 13],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-coq2.mjs'],", '', 14]
  ];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible]) => {
    const S = Object.assign({}, S0); if (!S[f].includes(de)) { console.log('  !! MOTIF ABSENT : ' + nom); return; }
    S[f] = S[f].replace(de, vers);
    if (S[f] === S0[f]) { console.log('  !! MUTATION SANS EFFET : ' + nom); return; }
    const r = jouer(S), ok = r[cible] && !r[cible][1];
    console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  if (mord !== DEF.length) process.exit(1);
}
if (ko) process.exit(1);
