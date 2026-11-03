// ═══════════════════════════════════════════════════════════
//  HARNAIS GT-UI-4 — LA CONSOLE SUR LA MAQUETTE (§519)
// ═══════════════════════════════════════════════════════════
//  Nico, 02/11 : « d'un point de vue graphique, j'ai pas du tout l'impression
//  d'être sur la maquette ». La maquette v1 (docs/maquettes/maquette-console-gt-v1.html)
//  suit la CHARTE de l'appli : claire, sombre avec elle. Ce harnais garde :
//   · la feuille de la console sur les jetons de la charte (aucune couleur écrite
//     en dur hors du cadre des écrans encore à l'ancien rendu) ;
//   · l'en-tête de la maquette (titre, résumé, fraîcheur, Actualiser, action) ;
//   · les pastilles communes (.mvpas) pour priorités, statuts, santé ;
//   · la fiche d'un incident : les quatorze derniers jours, « Lié à » ;
//   · le Radar : chiffres, « À traiter » en tableau, santé, traces ;
//   · les écrans pas encore refaits ENCADRÉS (lisibles en clair comme en sombre).
//  Sur les VRAIES fonctions (histo14, lies, _agtRadarPrio), le reste lu dans les sources.
//
//  Usage :  node scripts/mv-harnais-gtui4.mjs
//           node scripts/mv-harnais-gtui4.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = { css: lire('src/styles.css'), html: lire('src/gt/console.html'), gt: lire('src/admin-gt.js'), inc: lire('src/gt/incidents.js'), cli: lire('src/gt/clients.js') };

function fonction(src, nom) {
  const m = new RegExp('^(?:export\\s+)?(?:async\\s+)?function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1);
  }
  throw new Error('accolade non fermée : ' + nom);
}
const bloc = css => { const i = css.indexOf('/* ★★★ GT-UI-4 (§519)'), j = css.indexOf('/* ★ GT-UI-5 (§520)', i); return i < 0 || j < 0 ? '' : css.slice(i, j); };   // GT-UI-7 : le cadre .agt-ancien est parti
function monterInc(inc) {
  const fin = inc.indexOf("// ── Les gestes de l'écran");
  return new Function(inc.slice(0, fin).replace(/^export (var|function) /gm, '$1 ') + '\nreturn { histo14, lies, trier };')();
}
const NOW = Date.parse('2026-11-02T15:00:00');
const ESSAIS = {
  jours(inc) {
    const M = monterInc(inc), h = d => new Date(NOW - d * 86400000).toISOString();
    const n = M.histo14({ items: [{ ts: h(0) }, { ts: h(0) }, { ts: h(1) }, { ts: h(13) }, { ts: h(14) }, { ts: 'pas une date' }, {}] }, NOW);
    return n.length === 14 && n[13] === 2 && n[12] === 1 && n[0] === 1 && n.reduce((a, b) => a + b, 0) === 4;
  },
  lies(inc) {
    const M = monterInc(inc);
    const d = { suivi: { kc: { prio: 'P1' }, ke: { prio: 'P1' } }, prio: () => ({ p: 'P3' }), fin: { clos: 1 }, st: {} };   // e, clos, passerait premier s'il n'était pas écarté
    const g = (id, t, o) => Object.assign({ id, key: 'k' + id, msg: id, n: 1, nOpen: 1, tenants: t, last: new Date(NOW) }, o);
    const G = [g('a', { A: 1, B: 1 }), g('b', { B: 2 }), g('c', { A: 1 }), g('d', { C: 1 }), g('e', { A: 1 }, { nOpen: 0 }), g('f', { B: 1 }), g('h', { A: 1 })];
    const L = M.lies(G[0], G, d).map(x => x.id);
    return L.length === 3 && L[0] === 'c' && L.indexOf('d') < 0 && L.indexOf('e') < 0 && L.indexOf('a') < 0;
  },
  radar(inc, gt) {
    const P = new Function(fonction(gt, '_agtRadarPrio') + '\nreturn _agtRadarPrio;')();
    return P({ c: '#EF4444', ord: 10 }) === 'P1' && P({ c: '#F97316', ord: 11 }) === 'P2' && P({ c: '#C4B5FD', ord: 20 }) === 'P2'
      && P({ c: '#9CA3AF', ord: 23 }) === 'P3' && P({ c: '#B8913A', ord: 30 }) === 'P4';
  }
};
const LIB = {
  jours: '★★ « Les 14 derniers jours » : une barre par jour, aujourd’hui à droite, ce qui est plus vieux ou sans date écarté',
  lies: '★ « Lié à » : les autres incidents OUVERTS d’un même domaine, les plus urgents d’abord, trois au plus',
  radar: '★ la priorité d’une ligne du Radar : sa couleur d’urgence, puis son rang'
};
function statiques(S) {
  const r = [], B = bloc(S.css);
  const enDur = (B.replace(/var\([^()]*(?:\([^()]*\)[^()]*)*\)/g, '').match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) || []);
  r.push([B.length > 0 && enDur.length === 0, '★★★ la feuille de la console suit la charte : aucune couleur en dur hors des replis (' + enDur.length + ')']);
  r.push([/#page-admin-gt\{background:var\(--bg-app\);color:var\(--texte\);\}/.test(B) && /\.agt-side-it\.active\{background:var\(--accent-doux\);color:var\(--accent-texte\)/.test(B) && /\.agt-tbl th\{position:sticky;top:0;background:var\(--bg-doux\)/.test(B),
    '★★ le fond, la barre latérale et les tableaux de la maquette — clair, et sombre avec la charte']);
  r.push([!/agt-ancien\{|class=\\?"agt-ancien/.test(S.css + S.gt + S.cli) && /window\._agtFacturationVue \? window\._agtFacturationVue\(window\._agtFacDonnees\(\)\)/.test(S.gt) && /if\(tb==='outils'\)\s+body\.innerHTML=ban\+_agtBuildOutils\(\);/.test(S.gt),
    '★★ plus aucun écran encadré à l’ancien rendu : toute la console est sur la charte (GT-UI-7)']);
  r.push([/<h1 class="agt-tete-titre" id="agt-titre">/.test(S.html) && /id="agt-sous"/.test(S.html) && /id="agt-maj"/.test(S.html) && /onclick="renderAdminGT\(\)" aria-label="Actualiser"/.test(S.html) && /id="agt-tete-actions"/.test(S.html),
    '★★ l’en-tête de la maquette : titre, résumé, fraîcheur, Actualiser, l’action principale']);
  r.push([fonction(S.gt, 'agtSwitchTab').indexOf('_agtEntete(tab)') !== -1 && fonction(S.gt, 'agtRenderBody').indexOf('_agtEntete(tb)') !== -1 && fonction(S.gt, '_agtSessTick').indexOf('_agtMajFraicheur()') !== -1,
    'l’en-tête suit l’onglet, les gestes et le temps (« À jour, il y a … »)']);
  r.push([['cible', 'alerte', 'maison', 'recu', 'enveloppe', 'outil'].every(i => S.html.indexOf('<use href="#ic-' + i + '"></use>') !== -1) && /class="agt-side-n mvpas mvpas-compteur mvpas-alerte" id="agt-side-n-incidents"/.test(S.html),
    'la barre latérale a ses icônes et ses compteurs de la charte']);
  r.push([/mvpas mvpas-type ' \+ PRIO_COUL\[p\.p\]/.test(S.inc) && /mvpas mvpas-statut ' \+ ST_COUL\[st\]/.test(S.inc) && /mvpas mvpas-statut ' \+ SANTE_COUL\[s\.cle\]/.test(S.cli) && /class="mvpas ' \+ \(c\.interne \? 'mvpas-etiquette'/.test(S.cli),
    '★★ priorités, statuts, santé et statut client en pastilles communes (.mvpas)']);
  r.push([/Les 14 derniers jours/.test(S.inc) && /Li\\u00e9 \\u00e0/.test(S.inc) && /Les donn\\u00e9es du domaine sont en lecture\./.test(S.cli) && /Chronologie/.test(S.cli), 'les fiches de la maquette : les jours et les liés d’un incident ; le bandeau « en lecture » et la chronologie d’un client']);
  const rd = fonction(S.gt, '_agtBuildRadar');
  r.push([rd.indexOf('<div class="agt-kpis">') !== -1 && rd.indexOf('<table class="agt-tbl">') !== -1 && rd.indexOf('_agtRadarSante()') !== -1 && rd.indexOf('_agtRadarTraces()') !== -1, '★★ le Radar de la maquette : chiffres, « À traiter » en tableau, santé du système, traces']);
  r.push([/<button class="mvpas mvpas-filtre'\+\(on\?' on':''\)\+\(sug\?' agt-sugg':''\)/.test(fonction(S.gt, '_agtSuiviLigne')) && !/rgba\(255,255,255/.test(fonction(S.gt, '_agtSuiviLigne')), 'la ligne de suivi sur la charte (plus de blanc écrit pour un fond sombre)']);
  return r;
}

let verts = 0, rouges = 0;
const pose = (c, q) => { if (c) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + q); } else { rouges++; console.log('  \x1b[31m✗ ' + q + '\x1b[0m'); } };
if (!CONTRE) {
  console.log('── 1 · les fonctions neuves ──');
  for (const k of Object.keys(ESSAIS)) { let c = false; try { c = ESSAIS[k](SRC.inc, SRC.gt); } catch (e) { console.log('    (' + e.message + ')'); } pose(c, LIB[k]); }
  console.log('\n── 2 · la console sur la maquette ──');
  for (const [c, q] of statiques(SRC)) pose(c, q);
  console.log('\n' + '─'.repeat(30) + '\n  ' + verts + ' vert · ' + rouges + ' rouge\n' + '─'.repeat(30));
  process.exit(rouges ? 1 : 0);
}
const okC = [], koC = [];
function mord(titre, fichier, ancre, remplace, essai) {
  const n = SRC[fichier].split(ancre).length - 1;
  if (n !== 1) { koC.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE ' + (n ? 'NON UNIQUE (' + n + ')' : 'INTROUVABLE')); return; }
  const S2 = Object.assign({}, SRC, { [fichier]: SRC[fichier].replace(ancre, remplace) });
  let detecte;
  try { detecte = essai === 'statiques' ? !statiques(S2).every(x => x[0]) : !ESSAIS[essai](S2.inc, S2.gt); } catch (e) { detecte = true; }
  if (detecte) { okC.push(titre); console.log('  vert   ' + titre + ' → détecté'); }
  else { koC.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
}
mord('★★★ une couleur sombre écrite en dur revient', 'css', '#page-admin-gt{background:var(--bg-app);color:var(--texte);}', '#page-admin-gt{background:#0F1319;color:var(--texte);}', 'statiques');
mord('★★ un écran retrouve le cadre de l’ancien rendu', 'gt', "body.innerHTML=ban+_agtBuildOutils();", "body.innerHTML=ban+'<div class=\"agt-ancien\">'+_agtBuildOutils()+'</div>';", 'statiques');
mord('★★ l’en-tête ne suit plus l’onglet', 'gt', "  _agtEntete(tab);   // ★ GT-UI-4\n", '', 'statiques');
mord('★★ la priorité redevient une pastille maison', 'inc', "'<td><span class=\"mvpas mvpas-type ' + PRIO_COUL[p.p]", "'<td><span class=\"' + PRIO_COUL[p.p]", 'statiques');
mord('★★ les jours comptent aussi l’avant-veille du quinzième', 'inc', "    if (k >= 0 && k < 14) n[k]++;", "    if (k < 14) n[Math.max(0, k)]++;", 'jours');
mord('★ « Lié à » montre des incidents clos', 'inc', "return x.id !== g.id && x.nOpen > 0 && Object.keys", "return x.id !== g.id && Object.keys", 'lies');
mord('★ le Radar ignore la couleur d’urgence', 'gt', "  if(r.c==='#EF4444') return 'P1';\n", '', 'radar');
console.log('\n' + '─'.repeat(30) + '\n  ' + okC.length + ' vert · ' + koC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(koC.length ? 1 : 0);
