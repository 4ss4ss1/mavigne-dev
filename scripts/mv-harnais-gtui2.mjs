// ═══════════════════════════════════════════════════════════
//  HARNAIS GT-UI-2 — L'ÉCRAN INCIDENTS EN TABLEAU, LE RADAR TRIÉ (§517)
// ═══════════════════════════════════════════════════════════
//  La maquette v1 (docs/maquettes/maquette-console-gt-v1.html) : les incidents en
//  tableau — onglets par statut, recherche, filtres, tri sur chaque colonne,
//  sélection, la fiche à côté, « Annuler » après chaque geste ; le Radar trié par
//  priorité ou par type, et ses dernières traces.
//
//  Sur les VRAIES fonctions de src/gt/incidents.js (statut, priorité, filtres, tri,
//  dessin) et de src/admin-gt.js (le tri du Radar) ; le câblage lu dans les sources
//  (l'ancien écran parti, les gestes annulables, le preflight qui lit src/gt/).
//
//  Usage :  node scripts/mv-harnais-gtui2.mjs
//           node scripts/mv-harnais-gtui2.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = { inc: lire('src/gt/incidents.js'), gt: lire('src/admin-gt.js'), entree: lire('src/gt.js'), co: lire('src/gt/coquille.js'), pf: lire('scripts/preflight.mjs') };

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
function monter(inc) {
  const fin = inc.indexOf("// ── Les gestes de l'écran");
  if (fin < 0) throw new Error('repère des gestes absent');
  const code = inc.slice(0, fin).replace(/^export (var|function) /gm, '$1 ');
  return new Function(code + '\nreturn { ongletDe, prioDe, revenu, filtrer, trier, compteOnglets, vue, statutDe, E };')();
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const J = 86400000, NOW = Date.parse('2026-11-02T12:00:00Z');
function jeu() {
  const g = (id, o) => Object.assign({ id, key: 'k' + id, level: 'error', cat: 'firebase', msg: 'msg ' + id, n: 1, nOpen: 1, tenants: { 'Clos A': 1 }, pages: {}, users: {}, versions: {}, loc: 0, fb: 1, items: [], first: new Date(NOW - 5 * J), last: new Date(NOW - 1 * J) }, o);
  const groupes = [
    g('a', { msg: 'Lecture refusée : config', n: 14, nOpen: 14, level: 'critical', tenants: { 'Domaine Bérard': 9, 'Clos A': 5 } }),
    g('b', { msg: 'Synchro échouée', n: 3, nOpen: 3 }),
    g('c', { msg: 'Météo indisponible', n: 30, nOpen: 0, last: new Date(NOW - 40 * J) }),
    g('d', { msg: 'Revenu après clôture', n: 2, nOpen: 1, level: 'warning' }),
    g('e', { msg: 'Corrigé à livrer', n: 1, nOpen: 1, loc: 1, fb: 0 }),
    g('f', { msg: 'Livré à vérifier', n: 4, nOpen: 2 }),
    g('h', { msg: "Piège <img onerror=x> d'id", id: "h'x", n: 1, nOpen: 1 })
  ];
  const suivi = { ka: { prio: 'P2' }, kd: { statut: 'clos', closLe: '2026-10-30T00:00:00Z' }, ke: { statut: 'corrige' }, kf: { statut: 'livre' }, kc: { statut: 'clos', closLe: '2026-09-01T00:00:00Z' } };
  const st = { nouveau: 'Nouveau', qualifie: 'Qualifié', en_cours: 'En cours', corrige: 'Corrigé, à livrer', livre: 'Livré, à vérifier', clos: 'Clos', sans_suite: 'Sans suite' };
  const prio = gg => gg.level === 'critical' ? { p: 'P1', pourquoi: 'critique' } : gg.level === 'warning' ? { p: 'P3', pourquoi: 'avertissement' } : { p: 'P3', pourquoi: 'erreur isolée' };
  return { groupes, suivi, st, fin: { clos: 1, sans_suite: 1 }, prio, cat: { firebase: 'Base de données' }, ligneSuivi: () => '<div class="ligne">L</div>', sante: '', esc, relTime: () => '1 j', dateFr: () => '28/10/2026', noms: {} };
}
const E0 = () => ({ onglet: 'tous', q: '', prios: {}, client: '', source: '', periode: 0, tri: 'prio', sens: 1, sel: {}, ouvert: '' });
const ESSAIS = {
  onglets(inc) {
    const M = monter(inc), d = jeu(), G = id => d.groupes.find(x => x.id === id);
    return M.ongletDe(G('a'), d) === 'ouverts' && M.ongletDe(G('e'), d) === 'alivrer' && M.ongletDe(G('f'), d) === 'averifier'
      && M.ongletDe(G('c'), d) === 'clos' && M.ongletDe(G('d'), d) === 'ouverts' && M.revenu(G('d'), d) && !M.revenu(G('c'), d)
      && JSON.stringify(M.compteOnglets(d.groupes, d)) === JSON.stringify({ ouverts: 4, alivrer: 1, averifier: 1, clos: 1, tous: 7 });
  },
  priorite(inc) {
    const M = monter(inc), d = jeu(), G = id => d.groupes.find(x => x.id === id);
    const a = M.prioDe(G('a'), d), b = M.prioDe(G('b'), d);
    return a.p === 'P2' && a.confirmee === true && b.p === 'P3' && b.confirmee === false;
  },
  filtres(inc) {
    const M = monter(inc), d = jeu(), F = o => M.filtrer(d.groupes, d, Object.assign(E0(), o), NOW).map(g => g.id).join('');
    return F({ onglet: 'ouverts' }) === "abdh'x" && F({ q: 'berard' }) === 'a' && F({ q: 'LECTURE' }) === 'a' && F({ q: 'base de donn' }) === "abcdefh'x"
      && F({ prios: { P2: true } }) === 'a' && F({ client: 'Domaine Bérard' }) === 'a' && F({ source: 'poste' }) === 'e'
      && F({ periode: 30 }).indexOf('c') < 0 && F({ periode: 0 }).indexOf('c') >= 0;
  },
  tri(inc) {
    const M = monter(inc), d = jeu(), T = o => M.trier(d.groupes, d, Object.assign(E0(), o)).map(g => g.id);
    const p = T({ tri: 'prio' }), pInv = T({ tri: 'prio', sens: -1 }), f = T({ tri: 'fois' });
    return p[0] === 'a' && pInv[pInv.length - 1] === 'a' && f[0] === 'c' && f[1] === 'a' && T({ tri: 'titre' })[0] === 'e'
      && T({ tri: 'statut' })[0] === 'a' && T({ tri: 'statut' }).slice(-2).join(',') === 'c,d';
  },
  dessin(inc) {
    const M = monter(inc), d = jeu();
    Object.assign(M.E, E0(), { tri: 'fois', ouvert: 'a' });
    const h = M.vue(d);
    return h.indexOf('<table class="agt-tbl">') !== -1 && h.indexOf('<img onerror') === -1 && h.indexOf('Piège &lt;img onerror=x&gt;') !== -1
      && h.indexOf("agtIncOuvrir('h&#39;x')") !== -1 && h.indexOf("('h'x')") === -1 && h.indexOf('aria-sort="ascending"') !== -1 && h.indexOf('class="agt-inc-fiche"') !== -1
      && h.indexOf('<div class="ligne">L</div>') !== -1 && h.indexOf('>Tous <span>7</span>') !== -1 && h.indexOf('agt-prio p2"') !== -1 && h.indexOf('agt-prio p3 sugg"') !== -1;
  },
  radar(inc, gt) {
    const tri = new Function(fonction(gt, '_agtRadarTrier') + '\nreturn _agtRadarTrier;')();
    const rows = [{ ord: 22, ty: 'Facturation' }, { ord: 10, ty: 'Incident' }, { ord: 12, ty: 'Facturation' }, { ord: 20, ty: 'Lead' }, { ord: 30, ty: 'Client' }];
    const t = tri(rows.slice(), 'type').map(r => r.ty + r.ord).join(','), p = tri(rows.slice(), 'prio').map(r => r.ord).join(',');
    return t === 'Client30,Facturation12,Facturation22,Incident10,Lead20' && p === '22,10,12,20,30';
  }
};
const LIB = {
  onglets: '★★★ les onglets par statut : ouverts, à livrer, à vérifier, clos ; un incident clos qui revient repasse dans les ouverts, « revenu »',
  priorite: '★★ la priorité confirmée, sinon la suggérée (dite suggérée)',
  filtres: '★★ recherche sans accents (message, client, catégorie), priorités, client, source, période',
  tri: '★★ le tri sur chaque colonne, dans les deux sens, stable',
  dessin: '★★★ le dessin : un tableau, la fiche ouverte, le tri dit (aria-sort), un message piégé reste du texte, un identifiant piégé ne casse pas le gestionnaire',
  radar: '★ le Radar trié par type (puis l’urgence) ou par priorité'
};
function statiques(S) {
  const r = [];
  r.push([!/_agtBuildErrors\s*\(|function agtSetErr|function agtErrToggle|var _agtErrFilter|var _agtErrTenant|var _agtErrOpen/.test(S.gt), '★★ l’ancien écran est parti : sa liste, ses filtres, ses états (une fonction morte est une invitation)']);
  r.push([/window\._agtIncidentsVue \? window\._agtIncidentsVue\(window\._agtIncDonnees\(\)\)/.test(fonction(S.gt, '_agtBuildIncidents')), 'l’onglet Erreurs dessine le tableau de src/gt/incidents.js']);
  r.push([/window\._agtIncDonnees = function\(\)\{/.test(S.gt) && /ligneSuivi:function\(g\)\{ return _agtSuiviLigne\(g\); \}/.test(S.gt) && /window\.agtRenderBody     = agtRenderBody;/.test(S.gt), 'la console expose en lecture ce que l’écran lit, et son rendu']);
  r.push([/\['P1','P2','P3','P4',''\]\.indexOf\(p\)/.test(S.gt) && /_agtProposerAnnuler\(p\?\('Priorit/.test(S.gt) && /_agtProposerAnnuler\('Statut : '/.test(S.gt) && /_agtProposerAnnuler\('Incident clos'/.test(fonction(S.gt, 'agtResolveGroup')),
    '★★ chaque geste du suivi propose « Annuler » (priorité, statut, clôture)']);
  r.push([/window\.agtSuiviLot=async function\(gids, patch\)\{/.test(S.gt) && /var r=await window\.fbGtMaj\('suivi', chaine\(/.test(S.gt), '★ la sélection s’écrit en UNE transaction, et s’annule']);
  r.push([/window\._agtAnnulable = function \(texte, defaire\)/.test(S.inc) && /setTimeout\(function \(\) \{ var x = document\.getElementById\('agt-annuler'\)/.test(S.inc), 'la barre « Annuler » vit huit secondes']);
  r.push([['Incident', 'Signalement', 'Facturation', 'Lead', 'Client'].every(t => S.gt.indexOf("ty:'" + t + "'") !== -1) && fonction(S.gt, '_agtBuildRadar').indexOf('_agtRadarTraces()') !== -1, 'chaque ligne du Radar a son type ; le Radar montre les dernières traces']);
  r.push([fonction(S.gt, '_agtRadarTraces').indexOf("_agtIco(e.icon||'')") !== -1 && fonction(S.gt, '_agtRadarTraces').indexOf("_escHtml(e.action||'')") !== -1, 'les traces : icônes dessinées, texte échappé']);
  r.push([/import '\.\/gt\/coquille\.js';[^\n]*\nimport '\.\/gt\/incidents\.js';/.test(S.entree), 'gt.js charge l’écran Incidents après la coquille']);
  r.push([/if \(window\.agtIncOuvrir\) window\.agtIncOuvrir\(g\.id\)/.test(S.co), 'la recherche (Ctrl K) ouvre la fiche d’un incident']);
  r.push([/function jsSources\(\) \{ return \[\.\.\.listDir\('src', '\.js'\), \.\.\.listDir\('src\/gt', '\.js'\)\]; \}/.test(S.pf) && S.pf.split("listDir('src', '.js')").length === 2,
    '★★ le preflight lit aussi src/gt/*.js — partout (ces fichiers échappaient à tous ses contrôles)']);
  r.push([(S.inc.match(/_escAttr\(/g) || []).length >= 10 && !/agtInc\w+\(\\'' \+ esc\(/.test(S.inc), 'chaque valeur posée dans un gestionnaire passe par _escAttr']);
  return r;
}

let verts = 0, rouges = 0;
const pose = (c, q) => { if (c) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + q); } else { rouges++; console.log('  \x1b[31m✗ ' + q + '\x1b[0m'); } };
if (!CONTRE) {
  console.log('── 1 · l’écran, sur des incidents ──');
  for (const k of Object.keys(ESSAIS)) { let c = false; try { c = ESSAIS[k](SRC.inc, SRC.gt); } catch (e) { console.log('    (' + e.message + ')'); } pose(c, LIB[k]); }
  console.log('\n── 2 · le câblage ──');
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
mord('★★★ un incident clos qui revient reste dans les clos', 'inc', "  if (g.nOpen > 0) return 'ouverts';           // un incident clos qui revient", "  if (g.nOpen > 0 && statutDe(g, d) !== 'clos') return 'ouverts';           // un incident clos qui revient", 'onglets');
mord('★★ la priorité suggérée passe pour confirmée', 'inc', "return { p: s.prio || d.prio(g).p, confirmee: !!s.prio };", "return { p: s.prio || d.prio(g).p, confirmee: true };", 'priorite');
mord('★★ la recherche redevient sensible aux accents', 'inc', "function plier(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, ''); }", "function plier(s) { return String(s || '').toLowerCase(); }", 'filtres');
mord('★ le filtre de période laisse tout passer', 'inc', "    if (lim && !(g.last && g.last.getTime() >= lim)) return false;\n", '', 'filtres');
mord('★★ le tri ignore le sens', 'inc', "if (a.v[j] < b.v[j]) return -s; if (a.v[j] > b.v[j]) return s;", "if (a.v[j] < b.v[j]) return -1; if (a.v[j] > b.v[j]) return 1;", 'tri');
mord('★★★ un message piégé s’affiche tel quel', 'inc', "<span class=\"agt-tbl-msg\">' + esc(g.msg || '(sans message)')", "<span class=\"agt-tbl-msg\">' + (g.msg || '(sans message)')", 'dessin');
mord('★★★ un identifiant piégé casse le gestionnaire', 'inc', "onclick=\"agtIncOuvrir(\\'' + _escAttr(g.id) + '\\')\" onkeydown", "onclick=\"agtIncOuvrir(\\'' + g.id + '\\')\" onkeydown", 'dessin');
mord('★ le Radar par type oublie l’urgence', 'gt', "return x<y?-1:(x>y?1:(a.r.ord-b.r.ord)||(a.i-b.i));", "return x<y?-1:(x>y?1:(a.i-b.i));", 'radar');
mord('★★ un geste du suivi ne s’annule plus', 'gt', "    _agtProposerAnnuler('Incident clos', g.key, { statut:_avant.statut, closLe:_avant.closLe });\n", '', 'statiques');
mord('★★ le preflight ne lit plus src/gt/', 'pf', "function jsSources() { return [...listDir('src', '.js'), ...listDir('src/gt', '.js')]; }", "function jsSources() { return [...listDir('src', '.js')]; }", 'statiques');
mord('★ l’ancien écran revient', 'gt', "function _agtRadarTraces(){", "function agtErrToggle(gid){ agtRenderBody(); }\nfunction _agtRadarTraces(){", 'statiques');
console.log('\n' + '─'.repeat(30) + '\n  ' + okC.length + ' vert · ' + koC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(koC.length ? 1 : 0);
