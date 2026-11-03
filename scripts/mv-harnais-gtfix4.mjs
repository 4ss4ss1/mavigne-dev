// ═══════════════════════════════════════════════════════════
//  HARNAIS GTFIX-4 — CE QUI MENTAIT ENCORE (§513)
// ═══════════════════════════════════════════════════════════
//  L'audit du 01/11 (docs/maquettes/audit-console-gt-2026-11-01.md) :
//   GT-B11 — la console se chargeait une lecture après l'autre ; un geste de lead
//            rechargeait tout ;
//   GT-B12 — une lecture ratée s'affichait « 0 membre, 0 parcelle » ;
//   GT-B15 — le compteur des codes d'essai restait à 0 (plus tenu par personne) ;
//   GT-B16 — « Accéder » ouvrait l'écran de connexion et notait un faux accès ;
//   GT-B17 — deux écrans de config, deux règles ;
//   GT-B21 — les compteurs de l'en-tête figés après un geste ;
//   GT-B22 — une barre de saison vide sur chaque carte ;
//   GT-B23 — le journal d'accès écrivait « cle », « crayon » en toutes lettres ;
//   GT-B24 — la fenêtre Erreurs : doublons et « il y a 312 h ».
//
//  Sur les VRAIES fonctions de src/admin-gt.js et src/firebase.js : les
//  fonctions pures jouées sur des données, le reste lu dans les sources.
//
//  Usage :  node scripts/mv-harnais-gtfix4.mjs
//           node scripts/mv-harnais-gtfix4.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = { gt: lire('src/admin-gt.js'), fb: lire('src/firebase.js'), cli: lire('src/gt/clients.js') };   // GT-UI-3 : la fiche du client vit dans clients.js

function fonction(src, nom) {
  const m = new RegExp('^(?:async\\s+)?function ' + nom + '\\s*\\(', 'm').exec(src);
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
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function monter(gt, etat) {
  const code = [ligneVar(gt, '_AGT_CLES_DOM'), blocVar(gt, '_AGT_LECT_NOMS'), fonction(gt, '_agtDomaineDepuisLectures'),
    fonction(gt, '_agtEntreesCode'), fonction(gt, '_agtErrFusion'), fonction(gt, '_agtBandeauLectures')].join('\n');
  return new Function('_escHtml', '_agtTenants', '_agtLecturesKo', code + '\nreturn { _agtDomaineDepuisLectures, _agtEntreesCode, _agtErrFusion, _agtBandeauLectures };')(
    esc, (etat && etat.tenants) || [], (etat && etat.ko) || []);
}
const ok = v => ({ etat: 'ok', v }), ko = () => ({ etat: 'echec', v: null }), absent = () => ({ etat: 'absent', v: null });
const ESSAIS = {
  lectures(gt) {
    const M = monter(gt);
    const t = M._agtDomaineDepuisLectures('dom-a', { config: ok({ domaine_nom: 'Clos <b>A</b>' }), membres: ko(),
      parcelles: ok([{ nom: 'P1' }, { nom: 'P2' }, { nom: 'P3', statut: 'Arrachee' }]), error_log: absent(), support_reports: ok([{ resolved: false }]),
      saisons: ok([{ nom: '2025' }, { nom: '2026', active: true }]), appareils: ko() });
    return t.membres === null && t.parcelles === 2 && t.errors.length === 0 && t.reportsOpen === 1 && t.nom === 'Clos <b>A</b>'
      && t.saison === '2026' && JSON.stringify(t.echecs) === '["membres","appareils"]' && JSON.stringify(t.appareils) === '{}';
  },
  absentNestPasEchec(gt) {
    const M = monter(gt);
    const t = M._agtDomaineDepuisLectures('neuf', { config: absent(), membres: absent(), parcelles: absent(), error_log: absent(),
      support_reports: absent(), saisons: absent(), appareils: absent() });
    return t.membres === 0 && t.parcelles === 0 && t.echecs.length === 0 && t.nom === 'neuf';
  },
  codes(gt) {
    const M = monter(gt);
    const r = M._agtEntreesCode('AB12', [{ tenant: 'essai:AB12', ts: '2026-10-02T10:00:00Z' }, { tenant: 'essai:ZZ99', ts: '2026-10-30T10:00:00Z' },
      { tenant: 'essai:AB12', ts: '2026-10-29T08:00:00Z' }, { tenant: 'AB12', ts: '2026-10-31T08:00:00Z' }]);
    return r.n === 2 && r.der === '2026-10-29T08:00:00Z' && M._agtEntreesCode('XX', []).n === 0;
  },
  erreurs(gt) {
    const M = monter(gt);
    const r = M._agtErrFusion([{ id: 'e1', msg: 'a' }, { ts: 't1', msg: 'sans id' }], [{ id: 'e1', msg: 'a' }, { id: 'e2', msg: 'b' }, { ts: 't1', msg: 'sans id' }, null]);
    return r.length === 3 && r.map(e => e.id || e.msg).join(',') === 'e1,sans id,e2';
  },
  bandeau(gt) {
    const vide = monter(gt, { tenants: [{ nom: 'A', echecs: [] }], ko: [] })._agtBandeauLectures();
    const plein = monter(gt, { tenants: [{ nom: 'Clos <b>A</b>', echecs: ['membres'] }, { nom: 'B', echecs: [] }], ko: ['billing', 'tenants'] })._agtBandeauLectures();
    return vide === '' && /Lecture impossible/.test(plein) && /la facturation/.test(plein) && /le registre des domaines/.test(plein)
      && /1 domaine en partie \(Clos &lt;b&gt;A&lt;\/b&gt;\)/.test(plein) && /ce n\\u2019est pas z\\u00e9ro|ce n’est pas zéro/.test(plein) && /onclick="renderAdminGT\(\)"/.test(plein);
  }
};
const LIB = {
  lectures: '★★★ une clé lue en échec donne « — » (null), jamais 0, et se nomme (GT-B12)',
  absentNestPasEchec: '★ une clé absente (domaine neuf) n’est pas un échec : 0, rien de signalé',
  codes: '★★ l’usage d’un code d’essai se lit au journal (« essai:CODE », noté par le serveur) : nombre et dernière entrée (GT-B15)',
  erreurs: '★★ les erreurs d’un domaine, une fois chacune : par identifiant, sinon par date et message (GT-B24)',
  bandeau: '★★ le bandeau dit ce qui n’a pas pu être lu — registre, facturation, domaines en partie — et propose de relire'
};
function statiques(S) {
  const r = [];
  const ra = fonction(S.gt, 'renderAdminGT');
  r.push([ra.indexOf('await window.fbAdminRead(') === -1 && ra.indexOf('await window.fbAdminReadGT(') === -1 && /Promise\.all\(/.test(ra), '★★★ le chargement se fait en parallèle, plus une lecture après l’autre (GT-B11)']);
  r.push([/window\.fbAdminLire \? window\.fbAdminLire\(slug, cle\)/.test(ra) && /window\.fbGtLire \? window\.fbGtLire\(cle\)/.test(ra), '★★ chaque lecture passe au serveur et LÈVE en cas d’échec (fbAdminLire, fbGtLire)']);
  r.push([/window\.fbGtLire = async function \(key\) \{\s*var snap = await getDocFromServer\(doc\(db, '_guerettech', key\)\);/.test(S.fb), 'firebase.js : fbGtLire lit au serveur']);
  r.push([/_agtMajCompteurs\(\);   \/\/ ★ GTFIX-4 \(GT-B21\)/.test(fonction(S.gt, 'agtRenderBody')) && ra.indexOf('_agtMajCompteurs();') !== -1, '★★ les compteurs se recalculent après chaque rendu (GT-B21)']);
  const mc = fonction(S.gt, '_agtMajCompteurs');
  r.push([mc.indexOf('background:#22C55E') !== -1 && mc.indexOf("critique'+(totalErrCrit>1?'s':'')") !== -1, 'le voyant du bas repasse au vert quand plus rien n’est critique']);
  r.push([/var tb=_AGT_TAB_MIGR\[_agtTab\]\|\|_agtTab, ban=_agtBandeauLectures\(\);/.test(S.gt) && (fonction(S.gt, 'agtRenderBody').match(/innerHTML=ban\+/g) || []).length === 7, 'le bandeau des lectures ratées en tête de chaque onglet (sept, avec la Santé du système — GT-UI-6)']);
  r.push([fonction(S.gt, 'agtLeadSet').indexOf('renderAdminGT()') === -1 && fonction(S.gt, 'agtLeadNote').indexOf('renderAdminGT()') === -1, '★ un geste de lead ne recharge plus toute la console']);
  r.push([S.gt.indexOf('agtAccedeTenant') === -1, '★★ « Accéder » est parti : plus de faux accès au journal (GT-B16)']);
  r.push([S.gt.indexOf("width:0%;background:linear-gradient(90deg,'+_AGT_SAISON") === -1, 'plus de barre de saison vide (GT-B22)']);
  // ★ GT-UI-3 (§518) : la carte du domaine est partie ; la fiche du client (src/gt/clients.js) mène à la fiche complète.
  r.push([S.cli.indexOf("onclick=\"agtShowFiche(\\'' + _escAttr(c.slug) + '\\')\">Fiche compl") !== -1 && !/agtShowConfig|agtSaveConfig/.test(S.gt + S.cli), '★★ un seul écran de config : la fiche complète (Domaine), plus de fenêtre Config (GT-B17)']);
  r.push([fonction(S.gt, '_fcSecDom').indexOf('_agtCguHtml(c, _FC_SLUG)') !== -1 && /_agtMutConfigDomaine\(cfg,existe,nom,lat,lon\)/.test(S.gt), 'la fiche › Domaine garde la règle de config et l’acceptation CGU + DPA']);
  r.push([S.cli.indexOf("(c.parcelles == null ? '\\u2014' : c.parcelles)") !== -1 && S.cli.indexOf("if (c.echecs && c.echecs.length) r.push('lecture impossible');") !== -1, 'la fiche d’un domaine dit « — » et sa santé nomme une lecture impossible (GT-UI-3 ; avant, la carte)']);
  r.push([fonction(S.gt, '_agtBuildLog').indexOf("_agtIco(e.icon||'')") !== -1, 'le journal d’accès dessine ses icônes (GT-B23)']);
  const er = fonction(S.gt, 'agtShowErreurs');
  r.push([er.indexOf("fbAdminLire(slug, 'error_log')") !== -1 && er.indexOf('_agtErrFusion(') !== -1 && er.indexOf('_agtRelTime(e.ts)') !== -1 && er.indexOf("Math.floor(diff/60)+'h'") === -1,
    '★ la fenêtre Erreurs : lecture ratée dite, une fois par erreur, l’âge en jours (GT-B24)']);
  r.push([S.gt.indexOf('_agtEntreesCode(t.code, _agtAccessLog)') !== -1 && !/window\.agtUpdateEssaiAccess\s*=/.test(S.gt), 'les codes d’essai lisent le journal ; le compteur mort est parti']);
  return r;
}

let verts = 0, rouges = 0;
const pose = (c, q) => { if (c) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + q); } else { rouges++; console.log('  \x1b[31m✗ ' + q + '\x1b[0m'); } };
if (!CONTRE) {
  console.log('── 1 · les fonctions, sur des données ──');
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
mord('★★★ une lecture ratée redevient 0', 'gt', "    membres:ko('membres')?null:(", "    membres:(", 'lectures');
mord('★ une clé absente devient un échec', 'gt', "  var ko=function(k){ return !!(L[k]&&L[k].etat==='echec'); };", "  var ko=function(k){ return !(L[k]&&L[k].etat==='ok'); };", 'absentNestPasEchec');
mord('★★ le compteur des codes cherche le mauvais nom', 'gt', "if(e && e.tenant==='essai:'+code){", "if(e && e.tenant===code){", 'codes');
mord('★★ les erreurs reviennent en double', 'gt', "    if(vus[cle]) return;\n    vus[cle]=1; out.push(e);", "    vus[cle]=1; out.push(e);", 'erreurs');
mord('★★ le bandeau se tait', 'gt', "  if(!_agtLecturesKo.length && !dom.length) return '';", "  return '';", 'bandeau');
mord('★★★ le chargement relit sans pouvoir dire un échec', 'gt', "    return (window.fbAdminLire ? window.fbAdminLire(slug, cle) :", "    return (window.fbAdminRead ? window.fbAdminRead(slug, cle) :", 'statiques');
mord('★★ les compteurs se figent de nouveau', 'gt', "  _agtMajCompteurs();   // ★ GTFIX-4 (GT-B21)\n", '', 'statiques');
mord('★ le voyant ne repasse plus au vert', 'gt', ": '<div id=\"agt-bottom-status\" style=\"width:8px;height:8px;border-radius:50%;background:#22C55E;box-shadow:0 0 6px rgba(34,197,94,0.6)\"></div>';", ": statusEl.outerHTML;", 'statiques');
mord('★ une note de lead recharge tout', 'gt', "      if(await _agtSaveLeadSt(id)) agtRenderBody();   // ★ GTFIX-4 (GT-B11)", "      if(await _agtSaveLeadSt(id)) renderAdminGT();", 'statiques');
mord('★ le journal réécrit les icônes en toutes lettres', 'gt', "font-size:15px\">'+_agtIco(e.icon||'')+'</div>';", "font-size:15px\">'+(e.icon||'')+'</div>';", 'statiques');
mord('★ « il y a 312 h » revient', 'gt', "    var when = e.ts ? _agtRelTime(e.ts) : '';", "    var diff = e.ts ? Math.floor((Date.now()-new Date(e.ts))/60000) : null; var when = diff===null ? '' : 'il y a '+Math.floor(diff/60)+'h';", 'statiques');
mord('★ « Config » rouvre une seconde fenêtre', 'cli', "onclick=\"agtShowFiche(\\'' + _escAttr(c.slug) + '\\')\">Fiche compl", "onclick=\"agtShowConfig(\\'' + _escAttr(c.slug) + '\\')\">Fiche compl", 'statiques');
console.log('\n' + '─'.repeat(30) + '\n  ' + okC.length + ' vert · ' + koC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(koC.length ? 1 : 0);
