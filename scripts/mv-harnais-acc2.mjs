// HARNAIS — ACC-2 (§277) : la priorité épinglée de l'Accueil en carte (maquette v4) et l'avancement au cadre neutre.
//   node scripts/mv-harnais-acc2.mjs           → doit être vert
//   node scripts/mv-harnais-acc2.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue la VRAIE _homePrioCarte (extraite par ses accolades) sur un faux DOM et de fausses parcelles, avec et sans priorité.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { app: L('src/app.js'), css: L('src/styles.css'), uti: L('src/utils.js'), guide: L('guide/04-vigne.html'), liste: L('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function bloc(css) { const i = css.indexOf('★ ACC-2 (§277)'); if (i < 0) return ''; const j = css.indexOf('★ FIN ACC-2', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function jouerCarte(S, avecPrio) {
  const el = (id) => ({ id, parentNode: null, className: '', classList: { add() {} }, innerHTML: '' });
  const w = el('w'), kp = el('home-kpis'), eq = el('home-eqj-wrap'), corps = { v: null };
  w.insertBefore = (n) => { n.parentNode = w; if (n.id === 'home-prio-corps') corps.v = n; };
  const doc = { querySelector: () => w, getElementById: (id) => (id === 'home-kpis' ? kp : id === 'home-eqj-wrap' ? eq : id === 'home-prio-corps' ? corps.v : null), createElement: () => el('home-prio-corps') };
  const P = [{ nom: 'Les Crais', surface: '0,5', statut: 'En cours' }, { nom: 'Bel <Air>', surface: '2', statut: 'En cours' }, { nom: 'Arrachée', surface: '1', statut: 'Arrachee' }];
  const ST = { 'Les Crais': 'Validé', 'Bel <Air>': 'En cours' };
  const ctx = new Function('document', 'PARCELLES', '_prioItems', 'getTacheStatut', 'getPCls', 'tNom', '_escAttr', '_escHtml', '_pvSurfFr',
    fonction(S.app, 'function _homeSurf(p){') + '\n' + fonction(S.app, 'function _homeHa(x){') + '\n' + fonction(S.app, 'function _homePrioCarte(){') + '\n_homePrioCarte(); return document.getElementById(\'home-prio-corps\');');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const c = ctx(doc, P, () => (avecPrio ? [{ t: 'Chaussage', equipe: ['Lucas', 'Inès'] }] : []), (p) => ST[p.nom], (p) => ({ pct: p.nom === 'Les Crais' ? 100 : 40 }), (t) => t, esc, esc, (s) => s);
  return { html: c ? c.innerHTML : '', kpRange: kp.parentNode === w };
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  let a = { html: '' }, b = { html: '' }; try { a = jouerCarte(S, true); b = jouerCarte(S, false); } catch (e) { a = { html: 'plantage ' + e.message }; }
  T('avec une priorité : la tâche, son pourcentage pondéré par la surface (20 %), la barre, l’équipe', a.html.includes('Priorit\u00e9 du moment\u00a0: Chaussage') && a.html.includes('<div class="hpc-pct">20<small>') && a.html.includes('<div class="hpc-bar"><i style="--p:20%">') && a.html.includes('\u00e9quipe\u00a0: Lucas, In\u00e8s'));
  T('les parcelles à leur surface, faites d’abord, arrachée exclue, noms échappés, un appui ouvre la parcelle', a.html.indexOf('hpc-fait') > -1 && a.html.indexOf('hpc-fait') < a.html.indexOf('hpc-cours') && !a.html.includes('Arrach\u00e9e') && a.html.includes('Bel &lt;Air&gt;') && !a.html.includes('Bel <Air>') && a.html.includes('onclick="openSelParc(this.dataset.nom)"'));
  T('sans priorité : la saison parcelle par parcelle, sans pourcentage en double', b.html.includes('La saison, parcelle par parcelle') && !b.html.includes('hpc-pct') && b.html.includes('2 parcelles, 2,50\u00a0ha'));
  T('les chiffres du domaine (#home-kpis) sont rangés dans la carte, pas recréés', a.kpRange === true && S.app.includes("var kp=document.getElementById('home-kpis'); if(kp&&kp.parentNode!==w)w.insertBefore(kp,eq||null);"));
  T('renderHome appelle la carte à la fin', S.app.includes('  _renderHomeWidgets();\n  _homePrioCarte();   // ACC-2 (§277)\n}'));
  T('le bloc ACC-2 est posé après ACC-1, par jetons seulement (' + dur.length + ')', B.length > 3000 && S.css.indexOf('★ ACC-2 (§277)') > S.css.indexOf('★ FIN ACC-1') && dur.length === 0);
  T('sur ordinateur, la carte en trois zones : titre, corps et chiffres, équipes', B.includes('grid-template-areas:"titre titre" "corps kpis" "eq eq";'));
  T('l’avancement de la saison quitte son fond vert et son filet', B.includes('#page-home #home-stat-card{ background:var(--bg-card)!important;') && B.includes('#page-home #home-stat-card::before,#page-home #home-stat-card::after{ display:none!important; }'));
  T('l’aide, le guide et les nouveautés disent la carte', S.uti.includes("['La priorité du moment', \"reste épinglée en haut, dans une carte") && S.guide.includes("La carte du haut de l'Accueil indique la tâche du moment") && S.uti.includes("titre: 'La priorité du moment devient une carte'"));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-acc2.mjs'],") && S.liste.includes("['node scripts/mv-harnais-acc2.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['le pourcentage ne pèse plus la surface', 'app', "var pct=t?(surf?Math.round(fait/surf*100):0)", "var pct=t?(act.length?Math.round(act.filter(function(p){return etat(p)==='fait';}).length/act.length*100):0)", 0],
    ['un nom de parcelle n’est plus échappé', 'app', "aria-label=\"'+_escAttr(p.nom)+'\" onclick", "aria-label=\"'+p.nom+'\" onclick", 1],
    ['l’arrachée revient dans la carte', 'app', "var act=(PARCELLES||[]).filter(function(p){return p&&p.statut!=='Arrachee';});", "var act=(PARCELLES||[]).filter(function(p){return p;});", 1],
    ['le pourcentage s’affiche en double sans priorité', 'app', ":'<div class=\"hpc-meta\"><b>La saison, parcelle par parcelle</b>", ":'<div class=\"hpc-pct\">'+pct+'</div><div class=\"hpc-meta\"><b>La saison, parcelle par parcelle</b>", 2],
    ['les chiffres restent hors de la carte', 'app', "if(kp&&kp.parentNode!==w)w.insertBefore(kp,eq||null);", "", 3],
    ['renderHome n’appelle plus la carte', 'app', '  _homePrioCarte();   // ACC-2 (§277)\n', '', 4],
    ['une couleur écrite en dur dans le bloc', 'css', '#page-home .hpc-p.hpc-fait{ border-color:var(--ok); background:var(--ok-doux); }', '#page-home .hpc-p.hpc-fait{ border-color:#2E7A4E; background:var(--ok-doux); }', 5],
    ['la carte d’avancement garde son filet', 'css', '#page-home #home-stat-card::before,#page-home #home-stat-card::after{ display:none!important; }', '', 7],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-acc2.mjs'],", '', 9]
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
