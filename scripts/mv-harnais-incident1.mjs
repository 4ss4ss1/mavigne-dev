// ═══════════════════════════════════════════════════════════
//  HARNAIS INCIDENT-1 — L'INCIDENT DE DONNÉES (§531)
// ═══════════════════════════════════════════════════════════
//  La maquette docs/maquettes/maquette-fiche-client-v1.html, écran 3 : l'horloge
//  des 72 heures, la procédure, le message aux clients (un brouillon), le
//  registre des violations (GUERETTECH seul, par transaction) ; et la feuille
//  de la console (src/gt/console.css), sortie de styles.css au plafond de 1 Mo.
//
//  Usage :  node scripts/mv-harnais-incident1.mjs
//           node scripts/mv-harnais-incident1.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = { gt: lire('src/admin-gt.js'), ih: lire('src/gt/incident.js'), html: lire('src/gt/console.html'), co: lire('src/gt/coquille.js'), cc: lire('src/gt/console.css'), st: lire('src/styles.css'), entree: lire('src/gt.js'),
  ml: lire('public/mentions-legales.html'), je: lire('scripts/mv-harnais-jetons.mjs'), ec: lire('scripts/mv-harnais-echelle.mjs'), ct: lire('scripts/mv-harnais-contraste.mjs'), ty: lire('scripts/mv-harnais-typo.mjs') };
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
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function module(src) { return new Function('window', src.replace(/^export /gm, '') + '\nreturn { horloge, message, duree, vue, ETAPES };')({}); }
const ESSAIS = {
  horloge(S) {
    const M = module(S.ih), t0 = Date.parse('2026-11-05T07:40:00'), h = M.horloge('2026-11-05T07:40:00', t0 + 2 * 3600e3 + 15 * 60e3), h2 = M.horloge('2026-11-05T07:40:00', t0 + 80 * 3600e3);
    return h.ecoule === '2 h 15' && h.restantes === 69 && !h.depasse && h.echeance === t0 + 72 * 3600e3 && h2.depasse === true && M.horloge('', t0) === null && M.duree(30 * 60e3) === '30 min' && M.duree(26 * 3600e3) === '1 j 2 h';
  },
  message(S) {
    const M = module(S.ih), t = M.message({ ouvertLe: '2026-11-05T07:40:00', nature: 'un export lisible', categories: 'identification', volume: '120', personnes: '8', mesures: 'accès coupé' }, 'Nicolas Guéret — ngdevpro@gmail.com');
    const v = M.message({ ouvertLe: '2026-11-05T07:40:00' }, 'X');
    return t.indexOf('Le 05/11/2026 à 07:40, nous avons constaté un export lisible.') !== -1 && t.indexOf('environ 120 enregistrements, pour 8 personnes') !== -1 && t.indexOf('Mesures prises : accès coupé.') !== -1
      && t.indexOf('notification à la CNIL (72 h)') !== -1 && v.indexOf('[nature de l’incident]') !== -1 && v.indexOf('[catégories]') !== -1 && M.ETAPES.length === 7;
  },
  vue(S) {
    const M = module(S.ih), d0 = { entrees: [], encours: null, maintenant: Date.parse('2026-11-05T10:00:00'), contact: 'X', domaines: [], esc };
    const inc = { id: 'v1', ouvertLe: '2026-11-05T07:40:00', nature: 'fuite <b>', etapes: { 1: true }, domaines: ['a'], cnil: 'non (sous-traitant)' };
    const h0 = M.vue(d0), h1 = M.vue(Object.assign({}, d0, { entrees: [inc], encours: inc }));
    return h0.indexOf('Aucun incident en cours') !== -1 && h0.indexOf('Ouvrir un incident') !== -1 && h1.indexOf('Incident ouvert le 05/11/2026 à 07:40 — il y a 2 h 20.') !== -1
      && h1.indexOf('fuite &lt;b&gt;') !== -1 && h1.indexOf('<b>') !== -1 && h1.indexOf('fuite <b>') === -1 && h1.indexOf('En cours') !== -1 && h1.indexOf('Registre des violations') !== -1 && h1.indexOf('La proc\u00e9dure') !== -1;
  }
};
const LIB = { horloge: '★★★ l’horloge : l’écoulé depuis la prise de connaissance, l’échéance des 72 h, les heures restantes, le dépassement',
  message: '★★ le message aux clients (CG 4.8) : nature, catégories, volume, mesures ; ce qu’on ignore reste entre crochets ; sept étapes',
  vue: '★★ l’écran : sans incident, « Ouvrir un incident » ; en cours, l’horloge de la maquette ; une nature piégée reste du texte' };
function statiques(S) {
  const r = [];
  const vm = fonction(S.gt, '_agtViolMaj');
  r.push([/window\.fbGtMaj\('violations', function\(d\)\{ var v=JSON\.parse\(JSON\.stringify\(\(d&&d\.value\)\|\|\{\}\)\); fn\(v, now\);/.test(vm), '★★★ le registre des violations s’écrit par transaction (_guerettech/violations), rien d’écrasé']);
  const ms = fonction(S.gt, 'agtIncidentMessages');
  r.push([/window\.location\.href='mailto:\?bcc='/.test(ms) && !/collection\('mail'\)|fbGtMail|sendMail/.test(ms), '★★★ le message aux clients touchés : un brouillon, rien ne part seul (D5)']);
  const ct = /var _AGT_CONTACT_GT = '([^']+)';/.exec(S.gt);
  r.push([!!ct && S.ml.indexOf('06 99 42 48 59') !== -1 && S.ml.indexOf('ngdevpro@gmail.com') !== -1 && ct[1].indexOf('06 99 42 48 59') !== -1 && ct[1].indexOf('ngdevpro@gmail.com') !== -1, '★ le contact du message est celui des mentions légales (rien d’inventé)']);
  r.push([/if\(n===4\)\{ if\(x\.etapes\[n\]\) x\.clientsPrevenusLe=now; else delete x\.clientsPrevenusLe; \}/.test(fonction(S.gt, 'agtIncidentEtape')) && /if\(!x \|\| x\.closLe\) return;/.test(fonction(S.gt, 'agtIncidentEtape')), 'l’étape 4 cochée date la prévenance des clients ; un incident clos ne bouge plus']);
  r.push([/<button class="agt-side-it" data-tab="incident" onclick="agtSwitchTab\('incident'\)">/.test(S.html) && /incident: 'incident'/.test(S.co) && /import '\.\/gt\/incident\.js';/.test(S.entree) && /'violations'\]/.test(S.gt), '« Incident de données » dans la barre, #incident, le module chargé, le registre lu']);
  r.push([/import '\.\/gt\/console\.css';/.test(S.entree) && /\.agt-ih-horloge\{/.test(S.cc) && /\.agt-fc-grille\{/.test(S.cc) && !/\.agt-fc-grille\{/.test(S.st)
    && /readFileSync\('src\/gt\/console\.css', 'utf8'\)/.test(S.je) && /readFileSync\('src\/gt\/console\.css', 'utf8'\)/.test(S.ec) && /'src\/gt\/console\.css'\]/.test(S.ct) && /'src\/gt\/console\.css'\]/.test(S.ty),
    '★★ la feuille de la console : importée par gt.js, sortie de styles.css, et lue par les harnais des jetons, de l’échelle, du contraste et des tailles']);
  return r;
}

let verts = 0, rouges = 0;
const pose = (c, q) => { if (c) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + q); } else { rouges++; console.log('  \x1b[31m✗ ' + q + '\x1b[0m'); } };
if (!CONTRE) {
  console.log('── 1 · sur des données ──');
  for (const k of Object.keys(ESSAIS)) { let c = false; try { c = ESSAIS[k](SRC); } catch (e) { console.log('    (' + e.message + ')'); } pose(c, LIB[k]); }
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
  try { detecte = essai === 'statiques' ? !statiques(S2).every(x => x[0]) : !ESSAIS[essai](S2); } catch (e) { detecte = true; }
  if (detecte) { okC.push(titre); console.log('  vert   ' + titre + ' → détecté'); }
  else { koC.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
}
mord('★★★ l’échéance passe à 48 heures', 'ih', "var now = maintenant || Date.now(), ech = t0 + 72 * 3600000;", "var now = maintenant || Date.now(), ech = t0 + 48 * 3600000;", 'horloge');
mord('★★ ce qu’on ignore disparaît du message', 'ih', "c(inc.nature, '[nature de l\\u2019incident]')", "c(inc.nature, '')", 'message');
mord('★★ une nature piégée s’affiche telle quelle', 'ih', "<span class=\"agt-tbl-msg\">' + esc(x.nature || 'Incident') + '</span>", "<span class=\"agt-tbl-msg\">' + (x.nature || 'Incident') + '</span>", 'vue');
mord('★★★ le message part tout seul', 'gt', "  try{ window.location.href='mailto:?bcc='+bcc.join(',')+'&subject='+encodeURIComponent(txt.slice(0,i)", "  try{ window.fbGtMail && window.fbGtMail(bcc); window.location.href='mailto:?bcc='+bcc.join(',')+'&subject='+encodeURIComponent(txt.slice(0,i)", 'statiques');
mord('★★★ le registre s’écrase au lieu d’une transaction', 'gt', "var r=await window.fbGtMaj('violations', function(d){ var v=JSON.parse(JSON.stringify((d&&d.value)||{})); fn(v, now); return { value:v, maj:now }; });", "var v={}; fn(v, new Date().toISOString()); var r=await window.fbGtEcrire('violations', { value:v });", 'statiques');
mord('★★ la feuille de la console échappe au harnais des jetons', 'je', "readFileSync('src/gt/console.css', 'utf8')", "''", 'statiques');
mord('★ un incident clos bouge encore', 'gt', "  _agtViolMaj(function(V, now){ var x=V[id]; if(!x || x.closLe) return; x.etapes=x.etapes||{};", "  _agtViolMaj(function(V, now){ var x=V[id]; if(!x) return; x.etapes=x.etapes||{};", 'statiques');
console.log('\n' + '─'.repeat(30) + '\n  ' + okC.length + ' vert · ' + koC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(koC.length ? 1 : 0);
