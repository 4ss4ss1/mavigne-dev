#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais TRN-2 (§331) : UNE TOURNÉE PAR ÉQUIPE, ET LA TOURNÉE AVANT LA PROXIMITÉ
//  Sur les fonctions RÉELLES : utils.js (_mvTourneeEquipe, _mvOrdreMoi, _mvOrdreRangs) et app.js (_mvEqEcrire,
//  _mvEqBrut, _pProxBloque, _pOrdTitre). Contre-épreuves : chaque défaut réintroduit doit faire rougir.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
const U = fs.readFileSync(new URL('../src/utils.js', import.meta.url), 'utf8');
const A = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
function tranche(src, debut, fin){ const a = src.indexOf(debut), b = src.indexOf(fin, a); if(a < 0 || b < 0) throw new Error('tranche introuvable : ' + debut); return src.slice(a, b); }
function fonction(src, nom){
  const a = src.indexOf('function ' + nom + '('); if(a < 0) throw new Error('fonction introuvable : ' + nom);
  let i = src.indexOf('{', a), n = 0;
  for(; i < src.length; i++){ if(src[i] === '{') n++; else if(src[i] === '}'){ n--; if(n === 0) return src.slice(a, i + 1); } }
  throw new Error('fin introuvable : ' + nom);
}
const LECTURE = tranche(U, 'window._mvOrdreMap = function(){', '// ══ LA DERNIÈRE PARCELLE VALIDÉE');
const EQ = "var MV_EQ_SUITE_DEPUIS = '2026-10-30';\n" + ['_mvEqSource', '_mvEqPresents', '_mvEqEnPlace'].map(n => fonction(U, n)).join('\n') + '\nwindow._mvEqEnPlace = _mvEqEnPlace;\n';   // EQDEF-2 (§493)
const APP = ['_mvEqEcrire', '_mvEqBrut', '_pProxBloque', '_pOrdTitre', '_pOrdNomTournee'].map(n => fonction(A, n)).join('\n');
const ESC = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function monde(lecture, app){
  const window = { CONFIG: {}, PARCELLES: [], currentUser: { nom: 'Shana' }, _mvToday: () => '2026-10-14', saves: [] };
  const etat = { admin: false, tache: 'Tirage' };
  const f = new Function('window', 'saveData', '_mvISO', '_escHtml', '_mvMoiAdmin', '_pOrdTache',
    'var CONFIG = window.CONFIG;\n' + EQ + lecture + '\n' + app + '\nreturn { _mvEqEcrire, _mvEqBrut, _pProxBloque, _pOrdTitre, lireConfig: () => CONFIG };');
  const api = f(window, k => window.saves.push(k), d => d.toISOString().slice(0, 10), ESC, () => etat.admin, () => etat.tache);
  return { w: window, api, etat };
}
let rouges = 0;
function verifie(nom, ok, bavard){ if(!ok){ rouges++; if(bavard) console.log('  ✗ ' + nom); } }
function suite(lecture, app, bavard){
  const avant = rouges; let m;
  try{ m = monde(lecture, app); }catch(e){ rouges++; if(bavard) console.log('  ✗ plante : ' + e.message); return rouges - avant; }
  const { w, api, etat } = m;
  try{
    w.PARCELLES = [{ nom: 'A', pid: 'pa' }, { nom: 'B', pid: 'pb' }, { nom: 'C', pid: 'pc' }];
    w.CONFIG.tournees = [{ id: 't1', nom: 'Hiver', taches: ['Tirage'], ordre: ['pa', 'pb', 'pc'] }, { id: 't2', nom: 'Sud', taches: [], ordre: ['pc', 'pb', 'pa'] }];
    w.CONFIG.equipes_jour = { '2026-10-14': [{ m: ['Victor', 'Shana'], t: 't2' }, { m: ['Nico'] }] };
    verifie('la tournée de l’équipe de Shana, ce jour-là', w._mvTourneeEquipe('Shana', '2026-10-14') === 't2' && w._mvTourneeEquipe('Nico', '2026-10-14') === '' && w._mvTourneeEquipe('Shana', '2026-10-15') === '', bavard);
    let o = w._mvOrdreMoi('Tirage');
    verifie('Shana suit la tournée de son équipe', o && o.ordre.join() === 'C,B,A' && o.equipe === true && o.nom === 'Sud', bavard);
    verifie('…même sur un travail sans tournée', (w._mvOrdreMoi('Pliage') || {}).nom === 'Sud', bavard);
    verifie('Décider et le Tracteur gardent la tournée du travail', w._mvOrdreFor('Tirage').ordre.join() === 'A,B,C', bavard);
    let r = w._mvOrdreRangs('Tirage', ['A', 'B', 'C'], true);
    verifie('numéros de Parcelles dans l’ordre de l’équipe', r.ok && r.rang.C === 1 && r.rang.A === 3, bavard);
    r = w._mvOrdreRangs('Tirage', ['A', 'B', 'C']);
    verifie('sans « moi », l’ordre du travail', r.ok && r.rang.A === 1, bavard);
    w.currentUser = { nom: 'Nico' };
    o = w._mvOrdreMoi('Tirage');
    verifie('Nico, équipe sans tournée choisie : celle du travail', o && o.nom === 'Hiver' && !o.equipe && w._mvOrdreMoi('Pliage') === null, bavard);
    w.currentUser = { nom: 'Shana' }; w.CONFIG.equipes_jour['2026-10-14'][0].t = 'disparue';
    verifie('tournée d’équipe supprimée depuis : repli sur celle du travail', w._mvOrdreMoi('Tirage').nom === 'Hiver', bavard);
    api._mvEqEcrire('2026-10-14', [['Victor', 'Shana'], ['Nico']], ['t2', '']);
    const E = api.lireConfig().equipes_jour['2026-10-14'];
    verifie('l’enregistrement garde la tournée de chaque équipe', E.length === 2 && E[0].t === 't2' && !('t' in E[1]) && E[1].m.join() === 'Nico' && w.saves.slice(-1)[0] === 'config', bavard);
    api.lireConfig().equipes_jour['2026-10-14'].splice(1, 0, { m: [''] });
    const B = api._mvEqBrut('2026-10-14');
    verifie('relecture alignée sur les équipes réelles', B.length === 2 && B[0].t === 't2' && B[1].m.join() === 'Nico', bavard);
    etat.admin = false; etat.tache = 'Tirage';
    verifie('ouvrier + tournée : pas de tri par proximité', api._pProxBloque() === true, bavard);
    etat.admin = true;
    verifie('l’administrateur garde le tri', api._pProxBloque() === false, bavard);
    etat.admin = false; etat.tache = '';
    verifie('sans tournée, l’ouvrier garde le tri', api._pProxBloque() === false, bavard);
    verifie('la barre dit « votre équipe »', api._pOrdTitre({ nom: 'Sud', equipe: true }, 'Tirage') === 'Tournée « Sud » · votre équipe', bavard);
  }catch(e){ rouges++; if(bavard) console.log('  ✗ plante : ' + e.message); }
  return rouges - avant;
}
console.log('mv-harnais-trn2 — une tournée par équipe, la tournée avant la proximité (TRN-2, §331)');
if(suite(LECTURE, APP, true)){ console.log('ROUGE'); process.exit(1); }
console.log('  ✓ 14 vérifications vertes');
const CONTRE = [
  ['l’équipe ignorée', LECTURE.replace('var id = moi ? window._mvTourneeEquipe(moi, iso) : \'\';', "var id = '';"), APP],
  ['la tournée d’équipe perdue à l’enregistrement', LECTURE, APP.replace('if(trn&&trn[i]) o.t=String(trn[i]);', '')],
  ['la proximité jamais bloquée', LECTURE, APP.replace("return !_mvMoiAdmin() && !!_pOrdTache();", 'return false;')],
  // EQDEF-2 (§493) : le filtre a déménagé dans _mvEqEnPlace (utils.js) ; le défaut réinjecté : _mvEqBrut relit le brut du jour.
  ['relecture non filtrée (indices décalés)', LECTURE, APP.replace("return P ? P.eq : [];", "var E=(window.CONFIG||{}).equipes_jour, L=E?E[String(iso||'').slice(0,10)]:null; return Array.isArray(L)?L:[];")],
  ['les numéros ignorent l’équipe', LECTURE.replace("var o = (moi && typeof window._mvOrdreMoi === 'function') ? window._mvOrdreMoi(tache) : window._mvOrdreFor(tache);", 'var o = window._mvOrdreFor(tache);'), APP]
];
let ko = 0;
CONTRE.forEach(([nom, l, a]) => {
  if(l === LECTURE && a === APP){ ko++; console.log('  ✗ contre-épreuve sans effet (motif introuvable) : ' + nom); return; }
  const r0 = rouges, n = suite(l, a, false); rouges = r0;
  if(!n){ ko++; console.log('  ✗ contre-épreuve restée verte : ' + nom); }
});
if(ko){ console.log('ROUGE : ' + ko + ' contre-épreuve(s)'); process.exit(1); }
console.log('  ✓ ' + CONTRE.length + ' contre-épreuves rouges comme attendu');
