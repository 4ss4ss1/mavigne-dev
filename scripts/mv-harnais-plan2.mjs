// HARNAIS — PLAN-2 (§280) : Planning « Les gens » en liste + fiche (maquette v5) — la fiche de l'appli rangée dans la page.
//   node scripts/mv-harnais-plan2.mjs           → doit être vert
//   node scripts/mv-harnais-plan2.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue la VRAIE _plGensDock sur un faux DOM : rangée dans la page sur « Les gens » au large, rendue à sa place sinon.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { pl: L('src/planning.js'), css: L('src/styles.css'), uti: L('src/utils.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function bloc(css) { const i = css.indexOf('★ PLAN-2 (§280)'); if (i < 0) return ''; const j = css.indexOf('★ FIN PLAN-2', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function scene(S, tab, large, admin) {
  const cls = (set) => ({ add: (c) => set.add(c), remove: (c) => set.delete(c), contains: (c) => set.has(c), toggle: (c, on) => (on ? set.add(c) : set.delete(c)) });
  const corps = { parent: null, enfants: [] }, pg = { id: 'page-planning', enfants: [] };
  const ovCls = new Set(), bodyCls = new Set(), ouvert = [];
  const ov = { id: 'ovPlanFiche', parentNode: corps, nextSibling: null, classList: cls(ovCls) };
  corps.insertBefore = (n) => { n.parentNode = corps; }; pg.appendChild = (n) => { n.parentNode = pg; };
  const lignes = ['Nico', 'Victor'].map((n) => ({ textContent: n }));
  pg.querySelectorAll = () => lignes;
  const doc = { getElementById: (id) => (id === 'page-planning' ? pg : id === 'ovPlanFiche' ? ov : null), body: { classList: cls(bodyCls) }, querySelectorAll: () => [] };
  const env = { fiche: null };
  const f = new Function('document', 'window', 'planTab', 'isAdmin', 'openPlanFiche', 'env',
    'var _planFicheNom=env.fiche, _plFicheChez=null;\n' + fonction(S.pl, 'function _plGensDesk(){') + '\n' + fonction(S.pl, 'function _plGensMarque(){') + '\n' + fonction(S.pl, 'function _plFicheFenetre(') + '\n' + fonction(S.pl, 'function _plGensDock(){')
    + '\n_plGensDock(); var a={ dock: document.body.classList.contains("pl-gens-dock"), chez: document.getElementById("ovPlanFiche").parentNode.id || "corps" };'
    + '\nplanTab="mois"; _plGensDock(); a.retour = document.getElementById("ovPlanFiche").parentNode.id || "corps"; a.dock2 = document.body.classList.contains("pl-gens-dock"); return a;');
  const r = f(doc, { matchMedia: () => ({ matches: large }) }, tab, () => admin, (n) => { ouvert.push(n); ovCls.add('open'); env.fiche = n; }, env);
  r.ouvert = ouvert; return r;
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  let a = {}, b = {}, c = {}; try { a = scene(S, 'gens', true, true); b = scene(S, 'gens', false, true); c = scene(S, 'mois', true, true); } catch (e) { a = { erreur: e.message }; }
  T('sur « Les gens » au large : la fiche est rangée dans la page et la première personne s’y ouvre', a.dock === true && a.chez === 'page-planning' && a.ouvert && a.ouvert[0] === 'Nico');
  T('en quittant « Les gens », la fiche retourne à sa place et la page redevient d’une colonne', a.retour === 'corps' && a.dock2 === false);
  T('au téléphone ou sur « Le mois », rien n’est rangé', b.dock === false && b.chez === 'corps' && c.dock === false && c.chez === 'corps');
  T('les accroches : rendu du corps, changement d’onglet, rendu de la fiche', S.pl.includes("  _pl2AbarSync();\n  _plGensDock();   // PLAN-2 (§280)\n}") && S.pl.includes("  _planRenderBody();\n  _plGensDock();   // PLAN-2 (§280)\n}") && S.pl.includes("  body.innerHTML=h;\n  _plGensMarque();   // PLAN-2 (§280)\n}"));
  T('le bloc PLAN-2 est posé après PLAN-1, par jetons seulement (' + dur.length + ')', B.length > 3000 && S.css.indexOf('★ PLAN-2 (§280)') > S.css.indexOf('★ FIN PLAN-1') && dur.length === 0);
  T('deux colonnes sur « Les gens », la fiche collante dans la seconde', B.includes('body.pl-gens-dock #page-planning.active{ display:grid; grid-template-columns:minmax(0,1fr) var(--l-fiche,440px);') && B.includes('body.pl-gens-dock #ovPlanFiche.open{ position:sticky!important;'));
  T('la ligne ouverte est marquée, l’en-tête de la fiche est clair', B.includes('#page-planning .pl2-mcard.on{ background:var(--accent-doux)!important; }') && B.includes('#ovPlanFiche .pl2-sh-hdr{ background:var(--bg-card)!important;'));
  T('l’aide dit la fiche à droite sur ordinateur', S.uti.includes('sur ordinateur, la fiche s’ouvre à droite de la liste'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-plan2.mjs'],") && S.liste.includes("['node scripts/mv-harnais-plan2.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['la fiche n’est plus rangée dans la page', 'pl', "if(ov.parentNode!==pg){ _plFicheChez={ parent:ov.parentNode, suivant:ov.nextSibling }; pg.appendChild(ov); }", '', 0],
    ['la fiche ne retourne pas à sa place', 'pl', "_plFicheChez.parent.insertBefore(ov,_plFicheChez.suivant); ", '', 1],
    ['le rangement se fait aussi au téléphone', 'pl', "var on=planTab==='gens'&&_plGensDesk()&&isAdmin();", "var on=planTab==='gens'&&isAdmin();", 2],
    ['le changement d’onglet oublie de ranger', 'pl', "  _planRenderBody();\n  _plGensDock();   // PLAN-2 (§280)\n}", "  _planRenderBody();\n}", 3],
    ['une couleur écrite en dur dans le bloc', 'css', '#page-planning .pl2-mcard.on{ background:var(--accent-doux)!important; }', '#page-planning .pl2-mcard.on{ background:#F4E8EE!important; }', 4],
    ['la fiche flotte au lieu de coller', 'css', 'body.pl-gens-dock #ovPlanFiche.open{ position:sticky!important;', 'body.pl-gens-dock #ovPlanFiche.open{ position:fixed!important;', 5],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-plan2.mjs'],", '', 8]
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
