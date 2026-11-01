// ═══════════════════════════════════════════════════════════
//  HARNAIS GTFIX-2 — LE VERROU AU-DESSUS DE TOUT, LA FICHE CLIENT EN
//  LECTURE SEULE, RIEN DANS LE NAVIGATEUR (§511)
// ═══════════════════════════════════════════════════════════
//  L'audit du 01/11 (docs/maquettes/audit-console-gt-2026-11-01.md) :
//   GT-B05 — le verrou d'inactivité (plan 9500) passait SOUS les fenêtres de la
//            console (9999 à 10001) : une fiche ouverte restait utilisable ;
//   GT-B03 — la fiche réécrivait la copie lue à l'ouverture (les saisies du
//            client faites entre-temps disparaissaient) ;
//   GT-B04 — elle renommait sans la règle de renommage (historique détaché) ;
//   GT-B25 — gt.html gardait dans le navigateur les documents de tous les
//            domaines (cache persistant).
//  Décision D1 (01/11) : les données du domaine sont en LECTURE dans la fiche ;
//  on les modifie dans la préparation, sur les vrais écrans.
//
//  CE QUE CE HARNAIS PROUVE
//   1. le verrou, joué sur un faux DOM : remis à la racine, tout le reste
//      inerte (scripts exceptés), un élément déjà inerte n'est pas « rendu » ;
//   2. la fiche, jouée sur de vraies sections : aucun champ, aucun geste
//      d'édition, du texte échappé, le chemin vers la préparation ;
//   3. le câblage, lu dans les sources : le plan du verrou au-dessus de tout
//      plan écrit ailleurs, plus aucune écriture des données du domaine depuis
//      la fiche, le cache mémoire sur gt.html.
//
//  Usage :  node scripts/mv-harnais-gtfix2.mjs
//           node scripts/mv-harnais-gtfix2.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync, readdirSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = { gt: lire('src/admin-gt.js'), fb: lire('src/firebase.js'), cons: lire('src/gt/console.html'),
  css: lire('src/styles.css') + '\n' + lire('src/charte.css') };
const HTML_GT = readdirSync(new URL('../src/gt/', import.meta.url)).filter(f => f.endsWith('.html') && f !== 'console.html')
  .map(f => lire('src/gt/' + f)).join('\n');

/* ══ EXTRACTION ══ */
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
function affectation(src, nom) {
  const m = new RegExp('window\\.' + nom + '\\s*=\\s*(?:async\\s+)?function').exec(src);
  if (!m) throw new Error('AFFECTATION ABSENTE : window.' + nom);
  const k = src.indexOf('{', m.index); let d = 0;
  for (let j = k; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1);
  }
  throw new Error('accolade non fermée : window.' + nom);
}

/* ══ 1 · LE VERROU, SUR UN FAUX DOM ══ */
function monterVerrou(gt) {
  const bloc = /^var _agtInertes\s*=[^\n]*;/m.exec(gt)[0] + '\n' + fonction(gt, '_agtInerte');
  const mk = (tag, id) => ({ tagName: tag, id: id || '', attrs: {}, parentNode: null, children: [],
    setAttribute(k, v) { this.attrs[k] = String(v); }, removeAttribute(k) { delete this.attrs[k]; }, hasAttribute(k) { return k in this.attrs; } });
  const body = mk('BODY');
  body.appendChild = function (el) { if (el.parentNode) el.parentNode.children = el.parentNode.children.filter(x => x !== el); el.parentNode = body; body.children.push(el); };
  const racine = mk('DIV', 'app-root'), enveloppe = mk('DIV', 'app-content-wrap'), verrou = mk('DIV', 'agt-lock'),
    fiche = mk('DIV', 'agt-fiche-ov'), script = mk('SCRIPT'), deja = mk('DIV', 'deja');
  deja.attrs.inert = '';
  body.appendChild(racine); racine.children = [enveloppe]; enveloppe.parentNode = racine; enveloppe.children = [verrou]; verrou.parentNode = enveloppe;
  body.appendChild(fiche); body.appendChild(script); body.appendChild(deja);
  const tous = [racine, enveloppe, verrou, fiche, script, deja];
  const document = { body, getElementById(id) { return tous.find(e => e.id === id) || null; } };
  const api = new Function('document', bloc + '\nreturn { _agtInerte };')(document);
  return Object.assign(api, { body, racine, verrou, fiche, script, deja });
}
const inerte = el => el.hasAttribute('inert');
const ESSAIS_V = {
  verrouille(V) {
    V._agtInerte(true);
    return V.verrou.parentNode === V.body && !inerte(V.verrou) && inerte(V.racine) && inerte(V.fiche) && !inerte(V.script) && inerte(V.deja);
  },
  rend(V) {
    V._agtInerte(true); V._agtInerte(true); V._agtInerte(false);
    return !inerte(V.racine) && !inerte(V.fiche) && inerte(V.deja) && !inerte(V.verrou);
  }
};

/* ══ 2 · LA FICHE, SUR DE VRAIES SECTIONS ══ */
const FICHE_FN = ['_fcHint', '_fcEmpty', '_fcActiveCount', '_fcLectureSeule', '_fcLigne', '_fcEntete', '_fcTxt', '_fcSecteursHtml',
  '_fcSecParc', '_fcSecMbr', '_fcSecTache', '_fcSecTrac', '_fcSecSais'];
const PIEGE = '<img src=x onerror=alert(1)>';
function monterFiche(gt) {
  const bloc = FICHE_FN.map(n => fonction(gt, n)).join('\n');
  const _FC = {
    parcelles: [{ nom: PIEGE, surface: 1.25, statut: 'active', commune: { nom: 'Morey' } }, { nom: 'Les Charmes', surface: 0.4, statut: 'Arrachee', commune: 'Gevrey' }],
    membres: [{ nom: 'Lucie', email: 'l@x.fr', roles: ['admin', 'ouvrier'], statut: 'actif' }, { nom: PIEGE, email: '', roles: {}, statut: 'Inactif' }],
    taches: [{ nom: 'Taille', hha: 62.5, saison: 'Hiver', type: 'simple' }],
    tracteurs_list: [{ nom: 'T1', modele: PIEGE }],
    saisons: [{ nom: 'Hiver', debut: '2026-11-01', fin: '2027-02-28', active: true }]
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return new Function('_FC', '_escHtml', '_ROLE_COLORS', bloc + '\nreturn {' + FICHE_FN.join(',') + '};')(_FC, esc, { admin: '#7A2850' });
}
const SECTIONS = ['_fcSecParc', '_fcSecMbr', '_fcSecTache', '_fcSecTrac', '_fcSecSais'];
const ESSAIS_F = {
  lectureSeule(F) {
    return SECTIONS.every(n => { const h = F[n](); return h.indexOf('<input') === -1 && h.indexOf('<select') === -1 && !/oninput=|onchange=/.test(h)
      && h.indexOf('Modifier dans la pr\u00e9paration') !== -1 && h.indexOf('_fcPreparer()') !== -1; });
  },
  echappe(F) {
    const tout = SECTIONS.map(n => F[n]()).join('');
    return tout.indexOf(PIEGE) === -1 && tout.indexOf('&lt;img src=x') !== -1;
  },
  contenu(F) {
    const p = F._fcSecParc(), m = F._fcSecMbr(), t = F._fcSecTache(), s = F._fcSecSais();
    return p.indexOf('1,25\u00a0ha') !== -1 && /arrach\u00e9e/.test(p) && p.indexOf('Morey') !== -1 && p.indexOf('agt-fc-secteurs') !== -1
      && m.indexOf('admin \u00b7 ouvrier') !== -1 && m.indexOf('aucun r\u00f4le') !== -1 && m.indexOf('inactif') !== -1
      && t.indexOf('62,5') !== -1 && s.indexOf('active') !== -1;
  }
};

/* ══ 3 · LE CÂBLAGE ══ */
function zMax(texte) { let m = 0; for (const x of texte.matchAll(/z-index\s*:\s*(\d+)/g)) m = Math.max(m, +x[1]); return m; }
function statiques(S) {
  const r = [];
  const zv = /<div id="agt-lock"[^>]*z-index:(\d+)/.exec(S.cons), zVerrou = zv ? +zv[1] : 0;
  const autres = Math.max(zMax(S.gt), zMax(S.css), zMax(HTML_GT), zMax(S.cons.replace(/<div id="agt-lock"[^>]*>/, '')));
  r.push([zVerrou > autres, '★★★ le verrou est au-dessus de tout plan écrit ailleurs (' + zVerrou + ' > ' + autres + ') — GT-B05']);
  r.push([/<div id="agt-lock" role="dialog" aria-modal="true"/.test(S.cons), 'le verrou se dit fenêtre modale (role, aria-modal)']);
  const lk = fonction(S.gt, '_agtLock'), ul = fonction(S.gt, 'agtUnlock');
  r.push([lk.indexOf('_agtInerte(true)') !== -1, '★★ verrouiller rend tout le reste inerte']);
  r.push([ul.indexOf('_agtInerte(false)') !== -1 && ul.indexOf('_agtInerte(false)') < ul.indexOf("ov.style.display='none'"), 'déverrouiller rend la page, avant de cacher le verrou']);
  r.push([S.gt.indexOf('fbAdminWrite(_FC_SLUG') === -1 && !/window\._fcSave\s*=/.test(S.gt), '★★★ la fiche ne réécrit plus les données du domaine (`_fcSave` est parti) — GT-B03, GT-B04']);
  r.push([!/_fcAddRow|_fcAskDel|_fcSetField|_fcToggleRole|_fcSetActive|_fcSetCommune|_fcGuardBlock/.test(S.gt), '★ plus aucun geste d’édition de ces données (ajouter, retirer, renommer, rôle, saison active)']);
  const sc = affectation(S.gt, '_fcSaveCurrent');
  r.push([sc.indexOf("_fcSaveDom()") !== -1 && sc.indexOf("_fcSaveAbo()") !== -1 && /return _fcPreparer\(\);/.test(sc), 'enregistrer : seulement Domaine et Abonnement ; ailleurs, la préparation']);
  r.push([affectation(S.gt, '_fcPreparer').indexOf('agtPrepOuvrir(') !== -1, '« Modifier dans la préparation » ouvre la préparation (PREP-1)']);
  r.push([/id="agt-fc-save" onclick="_fcSaveCurrent\(\)"/.test(S.gt) && /getElementById\('agt-fc-save'\)[^\n]*\(t==='dom'\|\|t==='abo'\)/.test(fonction(S.gt, '_fcRenderSection')),
    'le bouton « Enregistrer » n’existe que sur Domaine et Abonnement']);
  const iDb = S.fb.indexOf('const db = (function'), iPg = S.fb.indexOf('const _MV_PAGE_GT');
  r.push([iPg > 0 && iPg < iDb && /if \(_MV_PAGE_GT\) return initializeFirestore\(app, \{ localCache: memoryLocalCache\(\) \}\);/.test(S.fb),
    '★★ gt.html prend le cache MÉMOIRE (GT-B25)']);
  r.push([/\/\\\/gt\\\.html\$\//.test(S.fb) && S.fb.indexOf("document.getElementById('agt-lock')") !== -1, 'gt.html repérée par son adresse ou par son verrou']);
  return r;
}

/* ══ MODE NORMAL ══ */
let verts = 0, rouges = 0;
const pose = (ok, q) => { if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + q); } else { rouges++; console.log('  \x1b[31m✗ ' + q + '\x1b[0m'); } };
const LIB = {
  verrouille: '★★★ verrouiller : le verrou remis à la racine, tout le reste inerte (fiche comprise), les scripts laissés',
  rend: '★ déverrouiller rend la page — sauf ce qui était déjà inerte avant ; verrouiller deux fois ne trouble rien',
  lectureSeule: '★★★ les cinq sections de la fiche : aucun champ, aucun geste d’édition, le chemin vers la préparation (D1)',
  echappe: '★★ les données du domaine affichées échappées (un nom piégé reste du texte)',
  contenu: 'la fiche dit tout : surface, statut, commune, secteurs, rôles, inactifs, h/ha, saison active'
};
if (!CONTRE) {
  console.log('── 1 · le verrou ──');
  for (const k of Object.keys(ESSAIS_V)) { let ok = false; try { ok = ESSAIS_V[k](monterVerrou(SRC.gt)); } catch (e) { console.log('    (' + e.message + ')'); } pose(ok, LIB[k]); }
  console.log('\n── 2 · la fiche client ──');
  for (const k of Object.keys(ESSAIS_F)) { let ok = false; try { ok = ESSAIS_F[k](monterFiche(SRC.gt)); } catch (e) { console.log('    (' + e.message + ')'); } pose(ok, LIB[k]); }
  console.log('\n── 3 · le câblage ──');
  for (const [c, q] of statiques(SRC)) pose(c, q);
  console.log('\n' + '─'.repeat(30) + '\n  ' + verts + ' vert · ' + rouges + ' rouge\n' + '─'.repeat(30));
  process.exit(rouges ? 1 : 0);
}

/* ══ CONTRE-ÉPREUVE ══ */
const okC = [], koC = [];
function muter(fichier, ancre, remplace) {
  const n = SRC[fichier].split(ancre).length - 1;
  if (n !== 1) return null;
  return Object.assign({}, SRC, { [fichier]: SRC[fichier].replace(ancre, remplace) });
}
function mord(titre, fichier, ancre, remplace, essai) {
  const S2 = muter(fichier, ancre, remplace);
  if (!S2) { koC.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE INTROUVABLE OU NON UNIQUE'); return; }
  let detecte;
  try { detecte = !essai(S2); } catch (e) { detecte = true; }
  if (detecte) { okC.push(titre); console.log('  vert   ' + titre + ' → détecté'); }
  else { koC.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
}
const tousStatiques = S => statiques(S).every(x => x[0]);
mord('★★★ le verrou retombe au plan 9500', 'cons', 'z-index:2147483000;', 'z-index:9500;', tousStatiques);
mord('★★ verrouiller oublie de rendre le reste inerte', 'gt', "  if(ov){ ov.style.display='flex'; }\n  _agtInerte(true);", "  if(ov){ ov.style.display='flex'; }", tousStatiques);
mord('★★ le verrou reste dans la page (il deviendrait inerte avec elle)', 'gt',
  "    if (ov && ov.parentNode !== document.body) document.body.appendChild(ov);\n", '', S => ESSAIS_V.verrouille(monterVerrou(S.gt)));
mord('★ déverrouiller rend aussi ce qui était déjà inerte', 'gt',
  "      if (el === ov || el.tagName === 'SCRIPT' || el.hasAttribute('inert')) return;", "      if (el === ov || el.tagName === 'SCRIPT') return;", S => ESSAIS_V.rend(monterVerrou(S.gt)));
mord('★ les scripts deviennent inertes aussi', 'gt',
  "      if (el === ov || el.tagName === 'SCRIPT' || el.hasAttribute('inert')) return;", "      if (el === ov || el.hasAttribute('inert')) return;", S => ESSAIS_V.verrouille(monterVerrou(S.gt)));
mord('★★★ un champ revient dans la fiche', 'gt',
  "    return _fcLigne(cols,[_fcTxt(t.nom,'sans nom'), _fcTxt(t.modele)]);",
  "    return _fcLigne(cols,['<input value=\"'+_fcTxt(t.nom,'sans nom')+'\" oninput=\"_fcSetField()\">', _fcTxt(t.modele)]);", S => ESSAIS_F.lectureSeule(monterFiche(S.gt)));
mord('★★ une donnée du domaine n’est plus échappée', 'gt',
  "var s = (v == null) ? '' : String(v).trim(); return s ? _escHtml(s) :", "var s = (v == null) ? '' : String(v).trim(); return s ? s :", S => ESSAIS_F.echappe(monterFiche(S.gt)));
mord('★★★ l’écriture de la fiche revient', 'gt',
  "window._fcTab=function(id){ _FC_TAB=id; _fcRenderTabs(); _fcRenderSection(); };",
  "window._fcTab=function(id){ _FC_TAB=id; _fcRenderTabs(); _fcRenderSection(); };\nwindow._fcSave=async function(coll){ await window.fbAdminWrite(_FC_SLUG,coll,_FC[coll]); };", tousStatiques);
mord('★ « Enregistrer » réécrit de nouveau les autres onglets', 'gt', "  return _fcPreparer();   // ★ GTFIX-2 (D1)", "  return _fcSaveDom();   // ★ GTFIX-2 (D1)", tousStatiques);
mord('★★ gt.html reprend le cache persistant', 'fb', "  if (_MV_PAGE_GT) return initializeFirestore(app, { localCache: memoryLocalCache() });\n", '', tousStatiques);
console.log('\n' + '─'.repeat(30) + '\n  ' + okC.length + ' vert · ' + koC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(koC.length ? 1 : 0);
