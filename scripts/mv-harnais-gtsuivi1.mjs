// ═══════════════════════════════════════════════════════════
//  HARNAIS GT-SUIVI-1 — LE SUIVI DES INCIDENTS VIT CHEZ GUERETTECH (§515)
// ═══════════════════════════════════════════════════════════
//  L'audit du 01/11 (docs/maquettes/audit-console-gt-2026-11-01.md) :
//   GT-B07 — « Traiter » écrivait dans le journal d'erreurs DU DOMAINE ;
//   GT-B18 — les erreurs remontées ne disaient pas leur version ;
//   GT-B19 — « résolu » s'affichait avant la réponse du serveur.
//  Décision D2 (01/11) : priorités P1 à P4, suggérées puis confirmées.
//
//  Sur les VRAIES fonctions de src/admin-gt.js (le suivi, la priorité suggérée)
//  et le câblage lu dans src/admin-gt.js, src/utils.js, src/whats-new.js,
//  public/sw.js.
//
//  Usage :  node scripts/mv-harnais-gtsuivi1.mjs
//           node scripts/mv-harnais-gtsuivi1.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = { gt: lire('src/admin-gt.js'), ut: lire('src/utils.js'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js') };

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
function ligneVar(src, nom) {
  const m = new RegExp('^var ' + nom + '\\s*=[^\\n]*;', 'm').exec(src);
  if (!m) throw new Error('VAR ABSENTE : ' + nom);
  return m[0];
}
function blocVar(src, nom) {
  const m = new RegExp('^var ' + nom + '\\s*=\\s*\\{', 'm').exec(src);
  if (!m) throw new Error('VAR ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, src.indexOf(';', j) + 1);
  }
  throw new Error('accolade non fermée : ' + nom);
}
function monter(gt, tenants, suivi) {
  const code = [blocVar(gt, '_AGT_SUIVI_ST'), ligneVar(gt, '_AGT_SUIVI_FIN'), fonction(gt, '_agtErrNorm'), fonction(gt, '_agtErrKey'),
    fonction(gt, '_agtErrRecount'), fonction(gt, '_agtErrTraiteeParSuivi'), fonction(gt, '_agtAppliquerSuivi'), fonction(gt, '_agtMutSuivi'),
    fonction(gt, '_agtPrioSuggeree')].join('\n');
  return new Function('_agtTenants', '_agtSuivi', code + '\nreturn { _agtErrKey, _agtErrTraiteeParSuivi, _agtAppliquerSuivi, _agtMutSuivi, _agtPrioSuggeree };')(tenants || [], suivi || {});
}
const E1 = { id: 'a', level: 'error', cat: 'firebase', msg: 'Lecture refusée : config', ts: '2026-10-20T10:00:00Z' };
const ESSAIS = {
  clos(gt) {
    const M = monter(gt);
    const k = M._agtErrKey(E1);
    const S = { [k]: { statut: 'clos', closLe: '2026-10-25T00:00:00Z' } };
    const apres = Object.assign({}, E1, { id: 'b', ts: '2026-10-30T09:00:00Z' });
    return M._agtErrTraiteeParSuivi(E1, S) === true && M._agtErrTraiteeParSuivi(apres, S) === false
      && M._agtErrTraiteeParSuivi(E1, { [k]: { statut: 'en_cours', closLe: '2026-10-25T00:00:00Z' } }) === false
      && M._agtErrTraiteeParSuivi(E1, { [k]: { statut: 'livre', closLe: '2026-10-25T00:00:00Z' } }) === false
      && M._agtErrTraiteeParSuivi(E1, { [k]: { statut: 'sans_suite', closLe: '2026-10-25T00:00:00Z' } }) === true
      && M._agtErrTraiteeParSuivi(E1, {}) === false;
  },
  applique(gt) {
    const t = { slug: 'd', errors: [Object.assign({}, E1), Object.assign({}, E1, { id: 'b', ts: '2026-10-30T09:00:00Z' }),
      { id: 'c', level: 'critical', cat: 'ui', msg: 'Autre', ts: '2026-10-01T00:00:00Z', resolved: true },
      { id: 'd', level: 'critical', cat: 'ui', msg: 'Ouverte', ts: '2026-10-02T00:00:00Z' }] };
    const k = monter(gt)._agtErrKey(E1);
    const M = monter(gt, [t], { [k]: { statut: 'clos', closLe: '2026-10-25T00:00:00Z' } });
    M._agtAppliquerSuivi(); M._agtAppliquerSuivi();
    return t.errors.map(e => e.resolved ? 1 : 0).join('') === '1010' && t.errorsOpen === 2 && t.errorsCrit === 1;
  },
  mutation(gt) {
    const M = monter(gt);
    const r = M._agtMutSuivi({ value: { k1: { prio: 'P2', note: 'n' }, k2: { statut: 'clos' } } }, true, 'k1', { statut: 'en_cours' }, 'T');
    const neuf = M._agtMutSuivi(null, false, 'k9', { prio: 'P1' }, 'T');
    let leve = false; try { M._agtMutSuivi({ autre: 1 }, true, 'k1', {}, 'T'); } catch (e) { leve = true; }
    return r.value.k1.prio === 'P2' && r.value.k1.note === 'n' && r.value.k1.statut === 'en_cours' && r.value.k1.maj === 'T'
      && r.value.k2.statut === 'clos' && neuf.value.k9.prio === 'P1' && leve;
  },
  priorite(gt) {
    const M = monter(gt), now = Date.parse('2026-11-02T12:00:00Z'), recent = new Date(now - 3600000), vieux = new Date(now - 10 * 86400000);
    const P = g => M._agtPrioSuggeree(g, now).p;
    return P({ level: 'critical', tenants: { a: 1 }, n: 1, last: vieux }) === 'P1'
      && P({ level: 'info', tenants: { a: 1, b: 1 }, n: 30, last: recent }) === 'P4'
      && P({ level: 'error', tenants: { a: 1, b: 1 }, n: 3, last: recent }) === 'P2'
      && P({ level: 'error', tenants: { a: 1 }, n: 12, last: recent }) === 'P2'
      && P({ level: 'error', tenants: { a: 1, b: 1 }, n: 3, last: vieux }) === 'P3'
      && M._agtPrioSuggeree({ level: 'warning', tenants: { a: 1 }, n: 1, last: vieux }, now).pourquoi === 'avertissement';
  }
};
const LIB = {
  clos: '★★★ une occurrence est traitée quand son incident est clos ou sans suite ET qu’elle est arrivée avant — après, il est « revenu » ; « livré » ne clôt pas',
  applique: '★★ en mémoire : les clôtures du suivi et les « traité » d’avant le lot, et les compteurs recalculés (deux passages ne changent rien)',
  mutation: '★ une fiche se complète sans écraser ses autres champs ni les autres fiches ; forme inconnue refusée',
  priorite: '★ la priorité suggérée et sa raison : critique P1, information P4, plusieurs domaines ou dix fois et récent P2, le reste P3 (D2)'
};
function statiques(S) {
  const r = [];
  const le = fonction(S.ut, 'logError');
  r.push([/\n    v: APP_VERSION,/.test(le), '★★ chaque erreur remontée porte la version de l’appli (logError, GT-B18)']);
  const rg = fonction(S.gt, 'agtResolveGroup'), re = fonction(S.gt, 'agtResolveError');
  r.push([rg.indexOf('_agtErrEcrire(') === -1 && rg.indexOf('fbAdminMaj(') === -1 && rg.indexOf("_agtSuiviMaj(g.key, { statut:'clos'") !== -1,
    '★★★ traiter un groupe clôt l’incident dans _guerettech/suivi — plus rien chez le domaine (GT-B07)']);
  r.push([re.indexOf('_agtErrEcrire(') === -1 && re.indexOf('fbAdminMaj(') === -1 && re.indexOf("_agtSuiviMaj(_agtErrKey(e), { statut:'clos'") !== -1,
    '★★ traiter une occurrence clôt son incident, au même endroit']);
  const sm = fonction(S.gt, '_agtSuiviMaj');
  r.push([/window\.fbGtMaj\('suivi', function\(d, existe\)\{ return _agtMutSuivi\(/.test(sm), 'le suivi s’écrit en transaction (la porte de GTFIX-1)']);
  const ra = fonction(S.gt, 'renderAdminGT');
  r.push([/'support_reports','suivi'(,'sante')?(,'pieces')?\]/.test(ra)   /* GT-UI-6 : la santé lue avec */ && ra.indexOf('_agtAppliquerSuivi();') !== -1 && ra.indexOf('_agtAppliquerSuivi();') < ra.lastIndexOf('_agtMajCompteurs();'),
    '★ le chargement lit le suivi et l’applique AVANT les compteurs']);
  const rr = fonction(S.gt, 'agtResolveReport');
  const iA = rr.indexOf('await window.fbResolveReport('), iF = rr.search(/flip\((t\.reports|_agtReportsGT)\)/);
  r.push([iA > 0 && iF > iA && /catch\(e\)\{[^}]*return; \}/.test(rr), '★★ un signalement n’est « résolu » qu’APRÈS la réponse du serveur (GT-B19)']);
  // ★ GT-UI-2 (§517) : la ligne de suivi passe à l'écran Incidents (src/gt/incidents.js) par ce que la console expose.
  r.push([S.gt.indexOf('ligneSuivi:function(g){ return _agtSuiviLigne(g); }') !== -1, 'chaque incident montre sa priorité, son statut, sa note et ses versions']);
  const sl = fonction(S.gt, '_agtSuiviLigne');
  r.push([/\['P1','P2','P3','P4'\]/.test(sl) && sl.indexOf('agtSuiviStatut(') !== -1 && sl.indexOf('agtSuiviNote(') !== -1 && sl.indexOf('revenu apr') !== -1, 'la ligne : P1 à P4, la suggérée en pointillé, le statut, la note, « revenu après clôture »']);
  r.push([/suivi:'le suivi des incidents'/.test(S.gt), 'une lecture ratée du suivi se dit au bandeau']);
  // ★ GT-UI-1 (§516) : la montée de CE lot se lit dans l'historique (les lots suivants montent encore).
  r.push([/\n  \{ v: '10\.59', d: '[0-9-]+', items: \[\] \},   \/\/ GT-SUIVI-1/.test(S.wn) && /\/\/ v11\.40 \(02\/11\/2026\) — GT-SUIVI-1/.test(S.sw),
    'la montée de ce lot : l’entrée 10.59 (rien à annoncer), le SW 11.40 dans l’historique']);
  return r;
}

let verts = 0, rouges = 0;
const pose = (c, q) => { if (c) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + q); } else { rouges++; console.log('  \x1b[31m✗ ' + q + '\x1b[0m'); } };
if (!CONTRE) {
  console.log('── 1 · le suivi, sur des données ──');
  for (const k of Object.keys(ESSAIS)) { let c = false; try { c = ESSAIS[k](SRC.gt); } catch (e) { console.log('    (' + e.message + ')'); } pose(c, LIB[k]); }
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
  try { detecte = essai === 'statiques' ? !statiques(S2).every(x => x[0]) : !ESSAIS[essai](S2.gt); } catch (e) { detecte = true; }
  if (detecte) { okC.push(titre); console.log('  vert   ' + titre + ' → détecté'); }
  else { koC.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
}
mord('★★★ une occurrence après la clôture passe pour traitée', 'gt', "s.closLe && String(e.ts||'') <= String(s.closLe));", "s.closLe && String(e.ts||'') >= '');", 'clos');
mord('★★ « livré » clôt l’incident', 'gt', "var _AGT_SUIVI_FIN = { clos:1, sans_suite:1 };", "var _AGT_SUIVI_FIN = { clos:1, sans_suite:1, livre:1 };", 'clos');
mord('★★ les « traité » d’avant le lot sont oubliés', 'gt', "      e.resolved = e._resolvedOrig || _agtErrTraiteeParSuivi(e, _agtSuivi);", "      e.resolved = _agtErrTraiteeParSuivi(e, _agtSuivi);", 'applique');
mord('★ une fiche du suivi écrase ses autres champs', 'gt', "  v[cle]=Object.assign({}, v[cle]||{}, patch, { maj:maintenant });", "  v[cle]=Object.assign({}, patch, { maj:maintenant });", 'mutation');
mord('★ le critique n’est plus suggéré P1', 'gt', "  if(g.level==='critical') return { p:'P1', pourquoi:'critique' };", "  if(g.level==='critical') return { p:'P2', pourquoi:'critique' };", 'priorite');
mord('★★★ traiter un groupe réécrit chez le domaine', 'gt', "  if(await _agtSuiviMaj(g.key, { statut:'clos', closLe:new Date().toISOString() })){", "  if(await _agtErrEcrire(_agtTenants[0], ids, false)){", 'statiques');
mord('★★ « résolu » avant la réponse du serveur', 'gt', "    await window.fbResolveReport(id, slug);\n", "    flip(_agtReportsGT); await window.fbResolveReport(id, slug);\n", 'statiques');
mord('★★ l’erreur ne dit plus sa version', 'ut', "    v: APP_VERSION,   // ★ GT-SUIVI-1", "    vv: APP_VERSION,   // ★ GT-SUIVI-1", 'statiques');
mord('★ le chargement oublie d’appliquer le suivi', 'gt', "  _agtAppliquerSuivi();   // ★ GT-SUIVI-1 : le « traité » de chaque occurrence, avant les compteurs\n", '', 'statiques');
console.log('\n' + '─'.repeat(30) + '\n  ' + okC.length + ' vert · ' + koC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(koC.length ? 1 : 0);
