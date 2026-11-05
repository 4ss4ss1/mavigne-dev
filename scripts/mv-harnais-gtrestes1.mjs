// ═══════════════════════════════════════════════════════════
//  HARNAIS GT-RESTES-1 — LES RESTES DE LA CONSOLE GT (§529)
// ═══════════════════════════════════════════════════════════
//  Ce que le chantier « console GT » avait laissé (§522d) : les tickets saisis à
//  la main et les liens entre incidents ; la barre d'onglets du bas au téléphone
//  (la maquette) ; l'historique des relances d'une demande ; deux harnais périmés
//  (réparés, et désormais dans la chaîne).
//
//  Usage :  node scripts/mv-harnais-gtrestes1.mjs
//           node scripts/mv-harnais-gtrestes1.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = { gt: lire('src/admin-gt.js'), inc: lire('src/gt/incidents.js'), lea: lire('src/gt/leads.js'), html: lire('src/gt/console.html'), co: lire('src/gt/coquille.js'), css: lire('src/styles.css'), liste: lire('scripts/mv-harnais-liste.mjs') };
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
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ESSAIS = {
  tickets(gt) {
    const T = new Function('var _AGT_SUIVI_FIN={clos:1,sans_suite:1};' + fonction(gt, '_agtTicketsGroupes') + '\nreturn _agtTicketsGroupes;')();
    const g = T({ 'ticket|a1': { ticket: true, titre: 'Relancer Fontrouge <b>', client: 'fontrouge', statut: 'nouveau', creeLe: '2026-11-04T10:00:00Z', maj: '2026-11-05T09:00:00Z' },
      'ticket|b2': { ticket: true, titre: 'Fait', statut: 'clos', creeLe: '2026-11-01T10:00:00Z' }, 'ticket|c3': { titre: 'pas un ticket' }, 'error|firebase|x': { statut: 'nouveau' } }, { fontrouge: 'Château Fontrouge' });
    return g.length === 2 && g[0].id === 'tk-a1' && g[0].key === 'ticket|a1' && g[0].ticket === true && g[0].nOpen === 1 && g[0].tenants['Château Fontrouge'] === 1
      && g[1].nOpen === 0 && g[0].items.length === 0 && g[0].msg === 'Relancer Fontrouge <b>';
  },
  liens(gt) {
    const L = new Function(fonction(gt, '_agtLiensMaj') + '\nreturn _agtLiensMaj;')();
    return JSON.stringify(L(['a', 'b'], 'c', true)) === '["a","b","c"]' && JSON.stringify(L(['a', 'c', 'c'], 'c', true)) === '["a","c"]'
      && JSON.stringify(L(['a', 'c'], 'c', false)) === '["a"]' && JSON.stringify(L(null, 'x', true)) === '["x"]';
  },
  historique(gt, lea) {
    const H = new Function(lea.slice(lea.indexOf('export function historiqueRelances'), lea.indexOf('export function chercher')).replace(/^export function /gm, 'function ') + '\nreturn historiqueRelances;')();
    const h = H({ relance: '2026-11-10', relanceVue: '', relances: [{ date: '2026-10-01', fin: 'retirée <b>', le: '2026-10-05T08:00:00Z' }, { date: '2026-10-26', fin: 'remplacée', le: '2026-11-03T08:00:00Z', signalee: true }] }   /* l’ordre réel : la plus ancienne d’abord */, { esc, dateFr: x => x });
    return h.indexOf('Historique des relances') !== -1 && h.indexOf('2026-11-10</b> — en cours') !== -1 && h.indexOf('(mail parti)') !== -1 && h.indexOf('retirée &lt;b&gt;') !== -1
      && h.indexOf('2026-10-26') < h.indexOf('2026-10-01') && H({ relances: [] }, { esc }) === '';
  }
};
const LIB = {
  tickets: '★★ un ticket est un incident sans occurrence, rangé avec les autres : ouvert ou clos, son client nommé ; une entrée qui n’est pas un ticket n’en devient pas un',
  liens: '★ un lien s’ajoute une fois, se retire, ne se double pas',
  historique: '★★ l’historique des relances : la date en cours, puis les anciennes (la plus récente d’abord), « mail parti » dit, une fin piégée reste du texte'
};
function statiques(S) {
  const r = [];
  const li = fonction(S.gt, 'agtIncLier');
  r.push([/var v1=_agtMutSuivi\(d, existe, a\.key, \{ liens:_agtLiensMaj\(/.test(li) && /return _agtMutSuivi\(v1, true, b\.key, \{ liens:_agtLiensMaj\(/.test(li) && li.indexOf("window.fbGtMaj('suivi'") !== -1,
    '★★★ un lien s’écrit des DEUX côtés, en UNE transaction']);
  r.push([/var ok=await _agtSuiviMaj\('ticket\|'\+id, \{ ticket:true,/.test(fonction(S.gt, 'agtTicketCreerGT')) && /if\(!titre\)\{ showToast\(/.test(S.gt), 'un ticket se crée par l’écriture du suivi (transaction), jamais sans titre']);
  r.push([/_agtErrGroupes\(_agtErrMerged\(\)\)\.concat\(_agtTicketsGroupes\(_agtSuivi, _agtNomsClients\(\)\)\)/.test(fonction(S.gt, '_agtErrGroupById')) && /groupes:_agtErrGroupes\(_agtErrMerged\(\)\)\.concat\(_agtTicketsGroupes/.test(S.gt),
    'les tickets sont dans le tableau et les gestes du suivi les trouvent']);
  r.push([/if\(tab==='incidents'\) return '<button class="agt-tete-principal" onclick="agtIncNouveauTicket\(\)">/.test(S.gt) && /function ficheNouveau\(d\)/.test(S.inc) && /agtIncLier\(/.test(S.inc) && /Lier /.test(S.inc),
    'Incidents : « + Nouveau ticket » (la maquette), sa fiche, « Lier à… » dans chaque fiche']);
  r.push([/<nav class="agt-bas" aria-label=/.test(S.html) && ['radar', 'incidents', 'clients', 'plus'].every(t => S.html.indexOf('class="agt-bas-it' + (t === 'radar' ? ' active' : '') + '" data-tab="' + t + '"') !== -1) && /id="agt-bas-plus" role="menu" hidden/.test(S.html) && /window\.agtBasPlus = function/.test(S.co),
    '★★ la barre d’onglets du bas au téléphone : Radar, Incidents, Clients, Plus — et la feuille de « Plus »']);
  const tel = S.css.slice(S.css.indexOf('GT-RESTES-1 (§529)'));
  r.push([/\.agt-bas,\.agt-bas-plus\{display:none;\}/.test(S.css) && /#page-admin-gt \.agt-bottom-bar,#page-admin-gt \.agt-tabs\{display:none;\}/.test(tel) && /#page-admin-gt \.agt-bas\{display:flex;position:fixed;/.test(tel),
    'au téléphone seulement, elle remplace les onglets du haut et la barre de session']);
  r.push([/if\(e\.relance && e\.relance!==date\)\{/.test(fonction(S.gt, 'agtLeadRelance')) && /\n\s*h0\.push\(\{ date:e\.relance, fin:/.test(fonction(S.gt, 'agtLeadRelance')), 'une relance remplacée ou retirée part dans l’historique']);
  r.push([/\['node scripts\/harnais-bandeau-essai\.mjs'\]/.test(S.liste) && /\['node scripts\/harnais-sec7-contre\.mjs'\]/.test(S.liste), '★ les deux harnais périmés, réparés, sont dans la chaîne (ils ne pourriront plus dehors)']);
  return r;
}

let verts = 0, rouges = 0;
const pose = (c, q) => { if (c) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + q); } else { rouges++; console.log('  \x1b[31m✗ ' + q + '\x1b[0m'); } };
if (!CONTRE) {
  console.log('── 1 · les restes, sur des données ──');
  for (const k of Object.keys(ESSAIS)) { let c = false; try { c = ESSAIS[k](SRC.gt, SRC.lea); } catch (e) { console.log('    (' + e.message + ')'); } pose(c, LIB[k]); }
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
  try { detecte = essai === 'statiques' ? !statiques(S2).every(x => x[0]) : !ESSAIS[essai](S2.gt, S2.lea); } catch (e) { detecte = true; }
  if (detecte) { okC.push(titre); console.log('  vert   ' + titre + ' → détecté'); }
  else { koC.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
}
mord('★★ une entrée quelconque du suivi devient un ticket', 'gt', "    if(cle.indexOf('ticket|')!==0 || e.ticket!==true) return;\n", "    if(cle.indexOf('ticket|')!==0) return;\n", 'tickets');
mord('★ un ticket clos reste ouvert', 'gt', "      nOpen:_AGT_SUIVI_FIN[e.statut]?0:1,", "      nOpen:1,", 'tickets');
mord('★ un lien se double', 'gt', "  var L=(Array.isArray(liste)?liste:[]).filter(function(x){ return x!==cle; });", "  var L=(Array.isArray(liste)?liste:[]).slice();", 'liens');
mord('★★★ un lien ne s’écrit que d’un côté', 'gt', "      return _agtMutSuivi(v1, true, b.key, { liens:_agtLiensMaj((v1.value[b.key]||{}).liens, a.key, !!oui) }, now);", "      return v1;", 'statiques');
mord('★★ l’historique perd l’ordre', 'lea', "var L = (Array.isArray(l.relances) ? l.relances : []).slice().reverse();", "var L = (Array.isArray(l.relances) ? l.relances : []).slice();", 'historique');
mord('★★ une fin piégée s’affiche telle quelle', 'lea', "\\u2014 ' + esc(r.fin || '')", "\\u2014 ' + (r.fin || '')", 'historique');
mord('★ la relance remplacée se perd', 'gt', "    h0.push({ date:e.relance, fin:", "    if(false) h0.push({ date:e.relance, fin:", 'statiques');
mord('★ le harnais de SEC-7 ressort de la chaîne', 'liste', "  ['node scripts/harnais-sec7-contre.mjs'],", "", 'statiques');
console.log('\n' + '─'.repeat(30) + '\n  ' + okC.length + ' vert · ' + koC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(koC.length ? 1 : 0);
