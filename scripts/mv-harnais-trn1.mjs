#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais TRN-1 (§330) : LES TOURNÉES
//  Le modèle (utils.js : _mvTourneesLues, _mvTourneeDe, _mvOrdreFor, _mvOrdreTaches, _mvOrdreRangs) et son écriture
//  (tournees.js : _trnEcrire), joués sur les fonctions RÉELLES extraites des fichiers (méthode C20, stubs minimaux).
//  Contre-épreuves : chaque défaut que ce lot évite, réintroduit dans le source extrait, doit faire rougir.
//  Usage : node scripts/mv-harnais-trn1.mjs — exit 1 au moindre rouge (un plantage compte rouge).
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
const U = fs.readFileSync(new URL('../src/utils.js', import.meta.url), 'utf8');
const RG = fs.readFileSync(new URL('../src/tournees.js', import.meta.url), 'utf8');
function tranche(src, debut, fin){ const a = src.indexOf(debut), b = src.indexOf(fin, a); if(a < 0 || b < 0) throw new Error('tranche introuvable : ' + debut); return src.slice(a, b); }
function fonction(src, nom){
  const a = src.indexOf('function ' + nom + '('); if(a < 0) throw new Error('fonction introuvable : ' + nom);
  let i = src.indexOf('{', a), n = 0;
  for(; i < src.length; i++){ if(src[i] === '{') n++; else if(src[i] === '}'){ n--; if(n === 0) return src.slice(a, i + 1); } }
  throw new Error('fin introuvable : ' + nom);
}
const LECTURE = tranche(U, 'window._mvOrdreMap = function(){', '// ══ LA DERNIÈRE PARCELLE VALIDÉE');
const ECRITURE = ['_trnLog', '_trnIndex', '_trnEcrire'].map(n => fonction(RG, n)).join('\n');
function monde(lecture, ecriture){
  const window = { CONFIG: {}, PARCELLES: [], saves: [], getTachesSaison: () => [{ nom: 'Brulage' }, { nom: 'Tirage' }, { nom: 'Taille' }], dispatchEvent(){}, logError(){} };
  window.saveData = k => window.saves.push(k);
  class CustomEvent { constructor(n){ this.type = n; } }
  const api = new Function('window', 'CustomEvent', lecture + '\n' + ecriture + '\nreturn { _trnEcrire };')(window, CustomEvent);
  return { w: window, ecrire: api._trnEcrire };
}
let rouges = 0;
function verifie(nom, ok, bavard){ if(!ok){ rouges++; if(bavard) console.log('  ✗ ' + nom); } }
function suite(lecture, ecriture, bavard){
  const avant = rouges; let w, ecrire;
  try{ ({ w, ecrire } = monde(lecture, ecriture)); }catch(e){ rouges++; if(bavard) console.log('  ✗ plante : ' + e.message); return rouges - avant; }
  try{
    w.PARCELLES = [{ nom: 'A', pid: 'pa' }, { nom: 'B', pid: 'pb' }, { nom: 'C', pid: 'pc' }];
    w.CONFIG = { ordre_passage_t: { Taille: { ordre: ['B', 'A'], date: '2026-10-01', par: 'N' } } };
    let o = w._mvOrdreFor('Taille');
    verifie('tournée d’avant lue', o && o.ordre.join() === 'B,A', bavard);
    const T = w._mvTourneesLues();
    verifie('tournée d’avant = une tournée par tâche, en pid', T.length === 1 && T[0].ordre.join() === 'pb,pa' && T[0].taches.join() === 'Taille' && T[0].ancienne === true, bavard);
    w.CONFIG.tournees = [{ id: 't1', nom: 'Hiver', taches: ['Tirage', 'Brulage'], ordre: ['pc', 'pa', 'pb'], date: '2026-10-14', par: 'N' }];
    verifie('CONFIG.tournees fait seul foi', w._mvOrdreFor('Taille') === null, bavard);
    o = w._mvOrdreFor('Tirage');
    verifie('ordre rendu en noms, avec le nom de la tournée', o && o.ordre.join() === 'C,A,B' && o.nom === 'Hiver', bavard);
    w.PARCELLES[0].nom = 'A2';
    o = w._mvOrdreFor('Tirage');
    verifie('renommer une parcelle ne touche pas la tournée', o && o.ordre.join() === 'C,A2,B', bavard);
    verifie('tâches suivies, dans l’ordre du catalogue', w._mvOrdreTaches().join() === 'Brulage,Tirage', bavard);
    const r = w._mvOrdreRangs('Tirage', ['A2', 'B']);
    verifie('numéros vivants', r.ok && r.rang.A2 === 1 && r.rang.B === 2 && r.n === 2, bavard);
    w.CONFIG.tournees = [];
    verifie('liste vide = aucune tournée, l’ancienne carte ne revient pas', w._mvOrdreFor('Taille') === null && w._mvOrdreTaches().length === 0, bavard);
    w.CONFIG = {};
    const src = { id: 't1', nom: 'Hiver', taches: ['Tirage'], ordre: ['pc', 'pa', 'zz'], date: '2026-10-14', par: 'N', ancienne: true };
    ecrire([src]);
    verifie('écrit CONFIG.tournees sans la marque « ancienne », ordre gardé tel quel', w.CONFIG.tournees.length === 1 && !('ancienne' in w.CONFIG.tournees[0]) && w.CONFIG.tournees[0].ordre.join() === 'pc,pa,zz', bavard);
    verifie('la tournée reçue n’est pas modifiée', src.ancienne === true, bavard);
    verifie('copie par tâche (noms) pour Décider et les appareils en retard', !!w.CONFIG.ordre_passage_t && !!w.CONFIG.ordre_passage_t.Tirage && w.CONFIG.ordre_passage_t.Tirage.ordre.join() === 'C,A2', bavard);
    verifie('sauvegarde de la config', w.saves[w.saves.length - 1] === 'config', bavard);
  }catch(e){ rouges++; if(bavard) console.log('  ✗ plante : ' + e.message); }
  return rouges - avant;
}
console.log('mv-harnais-trn1 — les tournées (TRN-1, §330)');
if(suite(LECTURE, ECRITURE, true)){ console.log('ROUGE'); process.exit(1); }
console.log('  ✓ 12 vérifications vertes');
const CONTRE = [
  ['l’ancienne carte relue malgré CONFIG.tournees', LECTURE.replace('if(Array.isArray((window.CONFIG||{}).tournees)) return null;', ''), ECRITURE],
  ['CONFIG.tournees ignoré', LECTURE.replace('if (Array.isArray(C.tournees)) return C.tournees', 'if (false) return C.tournees'), ECRITURE],
  ['ordre lu par nom (renommage perdu)', LECTURE.replace("if(p.pid) by[p.pid] = p; by['n:'+p.nom] = p;", 'by[p.nom] = p;'), ECRITURE],
  ['marque « ancienne » écrite en base', LECTURE, ECRITURE.replace('delete c.ancienne;', '')],
  ['tournée reçue modifiée en place', LECTURE, ECRITURE.replace('var c = Object.assign({}, t, { taches: (t.taches || []).slice(), ordre: (t.ordre || []).slice() });', 'var c = t;')],
  ['plus de copie par tâche', LECTURE, ECRITURE.replace('C.ordre_passage_t = m;', '')]
];
let ko = 0;
CONTRE.forEach(([nom, l, e]) => {
  if(l === LECTURE && e === ECRITURE){ ko++; console.log('  ✗ contre-épreuve sans effet (motif introuvable) : ' + nom); return; }
  const r0 = rouges, n = suite(l, e, false); rouges = r0;
  if(!n){ ko++; console.log('  ✗ contre-épreuve restée verte : ' + nom); }
});
if(ko){ console.log('ROUGE : ' + ko + ' contre-épreuve(s)'); process.exit(1); }
console.log('  ✓ ' + CONTRE.length + ' contre-épreuves rouges comme attendu');
