#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — PRES-1 + PDF-1 + SYNC-1 + ESC-1 (§174, 26/09/2026)
   Lancer : node scripts/mv-harnais-pres.mjs
            node scripts/mv-harnais-pres.mjs --contre

   ══ POURQUOI ══
   Le lot 1 du tour complet (code mort, doublons) a trouve quatre defauts reels :
     PRES-1  deux regles de « etait-il la ? ». utils.js comptait une fiche Inactive
             sans date de contrat, planning.js (_planCouvre) l'excluait : la meme
             personne comptee sur un ecran et pas sur l'autre. Decision de Nico
             (26/09) : Inactive sans date = ABSENTE, sauf les annees ou elle a des
             heures au planning (elles ont ete faites, elles se paient) ; toute
             fiche sans date est signalee au Pilotage.
     PDF-1   fbDeleteAnalyse n'etait appelee nulle part : les PDF d'analyse
             restaient dans Firebase Storage apres suppression ou remplacement.
     SYNC-1  app.js et cave.js importaient showSyncBadge de utils.js et
             contournaient l'enveloppe de app.js : le point de synchro restait fige.
     ESC-1   admin-gt.js mettait &#39; dans un onclick : le navigateur le redecode
             en ' avant le JS, le bouton mourait sur une apostrophe.

   ══ CE QU'IL TIENT ══
     A. On EXECUTE les vraies fonctions extraites (utils.js + planning.js) sur les
        memes fiches : les cinq lecteurs de presence rendent la MEME reponse.
     B. On EXECUTE _cavePdfRefs/_cavePdfPurge : un PDF qui n'est plus cite part,
        un PDF encore cite reste, rien ne part quand rien ne change.
     C. Le code (lu SANS commentaires) : les six chemins de Cave photographient et
        purgent ; le constat du Pilotage existe ; plus d'import de showSyncBadge ;
        plus de &#39; dans un attribut d'evenement.

   ⚠️ Les contre-epreuves mutent EN MEMOIRE, avec garde d'injection : une mutation
      qui ne trouve pas son ancre est une ERREUR, jamais un vert.
   ⚠️ CHEMINS : fileURLToPath, jamais new URL(...).pathname (Windows, 20/08).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const BASE = {
  utils: lire('src/utils.js'), plan: lire('src/planning.js'), pil: lire('src/pilotage.js'),
  cave: lire('src/cave.js'), app: lire('src/app.js'), agt: lire('src/admin-gt.js'),
};
const c = { g:s=>`\x1b[32m${s}\x1b[0m`, r:s=>`\x1b[31m${s}\x1b[0m`, dim:s=>`\x1b[2m${s}\x1b[0m`, b:s=>`\x1b[1m${s}\x1b[0m` };

// Bloc qui commence a `debut` et se termine a l'accolade fermante correspondante.
function bloc(src, debut) {
  const i = src.indexOf(debut);
  if (i < 0) return null;
  let d = 0; const s = src.indexOf('{', i);
  for (let k = s; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
  return null;
}
// Code sans commentaires : un controle qui lit la prose valide le commentaire.
function sansCom(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
}

// ── A. Les cinq lecteurs de presence ────────────────────────────────────────
function monterPresence(S) {
  const W = { PLANNING_ENTRIES: {} };
  W._mvContrats = m => (m && m._P) ? m._P.map(p => ({ debut: p.debut || '', fin: p.fin || '' })) : [];
  const morceaux = [
    bloc(S.utils, 'window._mvSansDateContrat = function'),
    bloc(S.utils, 'window._mvCompteSansDate = function'),
    bloc(S.utils, 'window._mvEnContratSurPeriode = function'),
    bloc(S.utils, 'window._mvEnContratLe = function'),
  ];
  const plan = ['function _planEntAn(', 'function _planSansDate(', 'function _planCompteSansDate(',
                'function _planCouvre(', 'function _planJourCouvert(', 'function _inContractDay(']
    .map(d => bloc(S.plan, d));
  if (morceaux.concat(plan).some(x => !x)) throw new Error('extraction impossible (ancre absente)');
  const code = 'var window=W; var PLANNING_ENTRIES=W.PLANNING_ENTRIES; var _Y=2026; function _pY(){return _Y;}\n'
    + 'function _planInContract(){ return true; }\n'
    + morceaux.join(';\n') + ';\n' + plan.join('\n')
    + '\nreturn { W:W, setY:function(y){_Y=y;}, couvre:_planCouvre, jour:_planJourCouvert, day:_inContractDay };';
  return new Function('W', code)(W);
}

function testsA(S, t) {
  const E = monterPresence(S), W = E.W;
  W.PLANNING_ENTRIES['Heures'] = { 2026: { 3: { 12: { h: 7 } } } };
  const F = {
    actif:   { nom: 'Actif',   statut: 'Actif',   _P: [] },
    inact:   { nom: 'Inact',   statut: 'Inactif', _P: [] },
    heures:  { nom: 'Heures',  statut: 'Inactif', _P: [] },
    vide:    { nom: 'Vide',    statut: 'Inactif', _P: [{ debut: '', fin: '' }] },
    date:    { nom: 'Date',    statut: 'Inactif', _P: [{ debut: '2026-03-01', fin: '2026-06-30' }] },
    bureau:  { nom: 'Bureau',  statut: 'Actif',   _P: [], bureau: true },
  };
  // Les cinq lecteurs, ramenes a « le 15 avril 2026 » / « l'annee 2025 ».
  const lecteurs = {
    'utils _mvEnContratSurPeriode': (m, jour) => W._mvEnContratSurPeriode(m, jour, jour),
    'utils _mvEnContratLe':         (m, jour) => W._mvEnContratLe(m, jour),
    'planning _planCouvre':         (m, jour) => E.couvre(m, jour, jour),
    'planning _planJourCouvert':    (m, jour) => { E.setY(+jour.slice(0,4)); return E.jour(m, +jour.slice(5,7) - 1, +jour.slice(8,10)); },
    'planning _inContractDay':      (m, jour) => E.day(m, jour),
  };
  const attendu = [
    ['actif',  '2026-04-15', true,  'Active sans date : presente'],
    ['inact',  '2026-04-15', false, 'Inactive sans date, sans heures : ABSENTE'],
    ['heures', '2026-04-15', true,  'Inactive sans date AVEC heures en 2026 : comptee en 2026'],
    ['heures', '2025-04-15', false, '… mais pas en 2025, ou elle n\u2019a rien fait'],
    ['vide',   '2026-04-15', false, 'Periode sans debut ni fin = sans date'],
    ['date',   '2026-04-15', true,  'Inactive avec dates : comptee pendant son contrat'],
    ['date',   '2026-08-15', false, '… et pas apres sa fin'],
  ];
  for (const [nom, fn] of Object.entries(lecteurs)) {
    for (const [cle, jour, att, lib] of attendu) {
      if (nom === 'utils _mvEnContratSurPeriode' && cle === 'bureau') continue;
      t(nom + ' — ' + lib + ' (' + jour + ')', fn(F[cle], jour) === att);
    }
  }
  t('_mvSansDateContrat : fiche avec une date de fin seule = datee', W._mvSansDateContrat({ _P: [{ debut: '', fin: '2026-06-30' }] }) === false);
  t('Bureau exclu de la presence vigne, inclus pour la masse salariale',
    W._mvEnContratSurPeriode(F.bureau, '2026-04-15', '2026-04-15') === false
    && W._mvEnContratSurPeriode(F.bureau, '2026-04-15', '2026-04-15', true) === true);
}

// ── B. Les PDF orphelins ────────────────────────────────────────────────────
function testsB(S, t) {
  const refs = bloc(S.cave, 'function _cavePdfRefs('), purge = bloc(S.cave, 'function _cavePdfPurge(');
  if (!refs || !purge) throw new Error('extraction impossible (_cavePdfRefs/_cavePdfPurge)');
  const monter = () => {
    const supp = [];
    const W = { fbDeleteAnalyse: p => { supp.push(p); return Promise.resolve(); }, logError: () => {} };
    const CE = { operations: [
      { id: 'o1', data: { pdf_path: 'a.pdf' } },
      { id: 'o2', data: { pdf_path: 'g.pdf' } }, { id: 'o3', data: { pdf_path: 'g.pdf' } },
      { id: 'o4', data: {} } ], analyses: [ { id: 'x', storage_path: 'x.pdf' } ] };
    const f = new Function('window', 'CAVE_ELEVAGE', refs + '\n' + purge + '\nreturn {refs:_cavePdfRefs, purge:_cavePdfPurge};')(W, CE);
    return { f, CE, supp };
  };
  let m = monter(); let av = m.f.refs();
  m.CE.operations = m.CE.operations.filter(o => o.id !== 'o1'); m.f.purge(av);
  t('Operation supprimee : son PDF part du stockage', m.supp.join() === 'a.pdf');
  m = monter(); av = m.f.refs();
  m.CE.operations = m.CE.operations.filter(o => o.id !== 'o2'); m.f.purge(av);
  t('PDF partage : il reste tant qu\u2019une operation le cite', m.supp.length === 0);
  m.CE.operations = m.CE.operations.filter(o => o.id !== 'o3'); m.f.purge(av);
  t('… et part avec la derniere', m.supp.join() === 'g.pdf');
  m = monter(); av = m.f.refs();
  m.CE.operations[0].data.pdf_path = 'b.pdf'; m.f.purge(av);
  t('PDF remplace : l\u2019ancien part, le nouveau reste', m.supp.join() === 'a.pdf');
  m = monter(); av = m.f.refs(); m.f.purge(av);
  t('Rien ne change : rien ne part (analyses comprises)', m.supp.length === 0);
}

// ── C. Le code, lu sans commentaires ────────────────────────────────────────
function testsC(S, t) {
  const cave = sansCom(S.cave);
  const chemins = [
    ['_attachPdfToOp', 'async function _attachPdfToOp('], ['saveCaveOp', 'async function saveCaveOp('],
    ['deleteCuvee', 'function deleteCuvee('], ['deleteCuveeById', 'function deleteCuveeById('],
    ['deleteCaveOp', 'function deleteCaveOp('],
  ];
  for (const [nom, d] of chemins) {
    const b = bloc(cave, d) || '';
    t('Cave › ' + nom + ' photographie puis purge les PDF', /_cavePdfRefs\(\)/.test(b) && /_cavePdfPurge\(_pdfAvant\)/.test(b));
  }
  const lien = cave.slice(cave.indexOf('linkOps.forEach('), cave.indexOf('linkOps.forEach(') + 900);
  t('Cave › rattachement groupe d\u2019un PDF : purge apres enregistrement', /_cavePdfPurge\(_pdfAvant\)/.test(lien));
  t('firebase.js › fbDeleteAnalyse existe toujours (appelee par la purge)', /window\.fbDeleteAnalyse\s*=/.test(sansCom(lire('src/firebase.js'))));

  const pil = sansCom(S.pil);
  t('Pilotage › constat « fiche sans date de contrat » (cible equipe, lit _mvSansDateContrat)',
    /_mvSansDateContrat\(m\)/.test(pil) && /sans date de contrat/.test(pil) && /cible:'equipe', touche:\['effectif','budget'\]/.test(pil));
  const ut = sansCom(S.utils);
  const sp = bloc(ut, 'window._mvEnContratSurPeriode = function') || '';
  t('utils › _mvEnContratSurPeriode passe par la regle unique', /_mvSansDateContrat\(m\)/.test(sp) && !/if\(!P\.length\) return true;/.test(sp));

  const importe = s => /import\s*\{[^}]*\bshowSyncBadge\b[^}]*\}\s*from\s*'\.\/utils\.js'/.test(sansCom(s));
  t('app.js n\u2019importe plus showSyncBadge de utils.js', !importe(S.app));
  t('cave.js n\u2019importe plus showSyncBadge de utils.js', !importe(S.cave));
  t('app.js et cave.js : showSyncBadge local = relais vers window.showSyncBadge',
    [S.app, S.cave].every(s => /function showSyncBadge\(msg, color\)\{\s*if\(typeof window\.showSyncBadge === 'function'\) window\.showSyncBadge\(msg, color\);/.test(sansCom(s))));

  // SEC-PIL (TOUR-4, §176) : goTo refuse le Pilotage sans le rôle (vu par npm run tour).
  const gt = bloc(sansCom(S.app), 'function goTo(') || '';
  t('app.js › goTo refuse le Pilotage sans _canPilotage (SEC-PIL)', /if\(page==='pilotage' && !_canPilotage\(\)\)\{[^}]*page=_landingPage\(\)/.test(gt));

  const attr = /\bon[a-z]+=\\?"[^"]*&#39;/;
  const fautifs = [];
  for (const f of fs.readdirSync(path.join(RACINE, 'src')).filter(f => f.endsWith('.js'))) {
    sansCom(f === 'admin-gt.js' ? S.agt : lire('src/' + f)).split('\n').forEach((l, i) => {
      if (attr.test(l) && /\\'/.test(l) && /replace\(\/'\/g,\s*'&#39;'\)/.test(l)) fautifs.push(f + ':' + (i + 1));
    });
  }
  t('Aucun attribut d\u2019evenement n\u2019echappe une apostrophe en &#39; (' + (fautifs.join(', ') || 'aucun') + ')', fautifs.length === 0);
}

function jouer(S, silencieux) {
  let ok = 0, ko = 0; const rouges = [];
  const t = (lib, cond) => { if (cond) ok++; else { ko++; rouges.push(lib); } if (!silencieux) console.log('  ' + (cond ? c.g('✓') : c.r('✗')) + ' ' + lib); };
  for (const [titre, f] of [['A. Une seule regle de presence', testsA], ['B. Les PDF orphelins', testsB], ['C. Le code', testsC]]) {
    if (!silencieux) console.log('\n' + c.b(titre));
    try { f(S, t); } catch (e) { ko++; rouges.push(titre + ' : ' + e.message); if (!silencieux) console.log('  ' + c.r('✗ PLANTE : ' + e.message)); }
  }
  return { ok, ko, rouges };
}

if (!CONTRE) {
  console.log(c.b('MA VIGNE — Harnais PRES-1 / PDF-1 / SYNC-1 / ESC-1'));
  const r = jouer(BASE, false);
  console.log('\n  ' + r.ok + ' verts · ' + (r.ko ? c.r(r.ko + ' rouge' + (r.ko > 1 ? 's' : '')) : '0 rouge') + '\n');
  process.exit(r.ko ? 1 : 0);
}

// ── Contre-epreuves : on reintroduit chaque defaut, le harnais doit rougir ──
function muter(S, fichier, ancre, remplacement) {
  if (!S[fichier].includes(ancre)) throw new Error('ancre introuvable dans ' + fichier + ' : ' + ancre.slice(0, 60));
  return Object.assign({}, S, { [fichier]: S[fichier].replace(ancre, remplacement) });
}
const MUT = [
  ['utils compte de nouveau une Inactive sans date (convention du 09/07)', S => muter(S, 'utils',
    "  if(window._mvSansDateContrat(m)) return window._mvCompteSansDate(m, d0, d1);\n", "  if(!P.length) return true;\n")],
  ['la regle unique oublie l\u2019exception des heures saisies', S => muter(S, 'utils',
    "  for(var y = y0; y <= y1; y++){ if(E[y]) return true; }\n  return false;\n};", "  return false;\n};")],
  ['_planJourCouvert retombe sur l\u2019ancien repli (statut ignore)', S => muter(S, 'plan',
    "  if(!P.length||_planSansDate(mbr))return _planCompteSansDate(mbr,ds,ds);", "  if(!P.length)return true;")],
  ['_inContractDay retombe sur « sans date = present »', S => muter(S, 'plan',
    "    if(!P.length||_planSansDate(mb)) return _planCompteSansDate(mb,ds,ds); // PRES-1 (26/09)", "    if(!P.length) return true;")],
  ['la purge supprime aussi les PDF encore cites', S => muter(S, 'cave', "    if(apres[path]) return;\n", "")],
  ['deleteCaveOp ne purge plus', S => muter(S, 'cave',
    "    else window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},'Op\\u00E9ration supprim\\u00E9e','#3D6B27');\n    _cavePdfPurge(_pdfAvant);",
    "    else window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},'Op\\u00E9ration supprim\\u00E9e','#3D6B27');")],
  ['le constat du Pilotage disparait', S => muter(S, 'pil', "k:sansDate.length+' fiche'", "k:sansDate.length+' dossier'").pil.includes('sans date de contrat')
      ? muter(muter(S, 'pil', "k:sansDate.length+' fiche'", "k:sansDate.length+' dossier'"), 'pil', "+' sans date de contrat',", "+' incomplete',") : null],
  ['app.js reimporte showSyncBadge', S => muter(S, 'app', "getRoleLabel, showToast, wmoDesc,", "getRoleLabel, showToast, showSyncBadge, wmoDesc,")],
  ['goTo laisse de nouveau passer le Pilotage (SEC-PIL)', S => muter(S, 'app', "if(page==='pilotage' && !_canPilotage()){", "if(page==='pilotage' && false){")],
  ['admin-gt reecrit &#39; dans l\u2019onclick', S => muter(S, 'agt',
    "agtInsPerTache(' + i + ',\\'' + _escAttr(t) + '\\')", "agtInsPerTache(' + i + ',\\'' + E(t).replace(/'/g, '&#39;') + '\\')")],
];
console.log(c.b('MA VIGNE — Harnais PRES-1 · contre-epreuves'));
let bad = 0;
for (const [lib, f] of MUT) {
  let S;
  try { S = f(BASE); if (!S) throw new Error('mutation vide'); }
  catch (e) { bad++; console.log('  ' + c.r('✗ ERREUR D\u2019INJECTION — ' + lib + ' : ' + e.message)); continue; }
  const r = jouer(S, true);
  if (r.ko > 0) console.log('  ' + c.g('✓') + ' rougit : ' + lib + c.dim('  (' + r.rouges[0].slice(0, 70) + ')'));
  else { bad++; console.log('  ' + c.r('✗ RESTE VERT : ' + lib)); }
}
console.log('\n  ' + (MUT.length - bad) + '/' + MUT.length + ' contre-epreuves rougissent\n');
process.exit(bad ? 1 : 0);
