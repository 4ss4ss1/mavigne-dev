#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : UNE RÉCOLTE, PLUSIEURS DESTINATAIRES (lot VD-1)
// ═══════════════════════════════════════════════════════════════════════════
//  ★★★ POURQUOI CE HARNAIS EXISTE.
//  Avant VD-1, une récolte n'avait qu'UN destinataire. Le lot introduit
//  `parts[]`, et avec lui deux façons de mentir en silence :
//
//   1. ENVOYER EN CUVE DES KILOS VENDUS. `_recKg` rend désormais le TOTAL de la
//      récolte, parts clients comprises. Partout où le code parlait de cuverie
//      — volume proposé, rattachement, bilan de chaîne, apports d'une cuvée — il
//      faut la part DOMAINE. Un seul oubli et une cuve de 21 hL en affiche 30.
//
//   2. RÉÉCRIRE L'HISTOIRE. `_vendRecPck` relisait la fiche client à chaque
//      affichage : corriger un client de 24 à 26 kg déplaçait rétroactivement
//      tous les kilos déjà livrés. Le poids est maintenant FIGÉ dans la part.
//
//  Le harnais EXÉCUTE les fonctions réellement extraites de src/cave.js — socle
//  ET écran, ce dernier rejoué sur un DOM minimal — il ne
//  cherche pas des motifs de texte. Un contrôle qui lit du texte aurait dit vert
//  sur les deux défauts ci-dessus.
//
//  Usage :
//    node scripts/mv-harnais-vendange-parts.mjs
//    node scripts/mv-harnais-vendange-parts.mjs --contre   # les contre-épreuves
//  Exit 0 si tout passe, 1 sinon. Un CRASH est ROUGE.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const args   = process.argv.slice(2);
const CONTRE = args.includes('--contre');
const CIBLE  = path.resolve(args.find(a => !a.startsWith('--')) || path.join(RACINE, 'src', 'cave.js'));

const SRC = fs.readFileSync(CIBLE, 'utf8');

/* Extraction par comptage d'accolades : la fonction telle qu'elle est écrite
   dans le module, pas une copie qui dériverait. */
function corps(nom){
  const i = SRC.indexOf('function ' + nom + '(');
  if (i < 0) return null;
  let p = SRC.indexOf('{', i), n = 0, j = p;
  for (; j < SRC.length; j++){
    if (SRC[j] === '{') n++;
    else if (SRC[j] === '}'){ n--; if (n === 0) break; }
  }
  return SRC.slice(i, j + 1);
}

const NOMS = ['_vendPckLegacy','_vendParts','_vpPck','_vpCs','_vpKg','_vpNom','_vpSurf',
              '_recKg','_recCaisses','_recKgDom','_recCsDom','_recKgCli','_recHasDom',
              '_recSold','_recKgPour','_recDests'];
const manquants = NOMS.filter(n => !corps(n));
if (manquants.length){
  console.error('ROUGE — fonctions introuvables dans ' + path.basename(CIBLE) + ' : ' + manquants.join(', '));
  process.exit(1);
}

/* Les deux seules dépendances externes du socle : le référentiel client et la
   config du Cuvier. Elles sont pilotées par le harnais. */
let CLIENTS = [], CFG = { poids_caisse_kg: 25 };
const PRELUDE = 'function _vendClient(n){ return CLIENTS.find(function(c){return c.nom===n;})||null; }\n'
              + 'function _vendCfg(){ return CFG; }\n';
let code = PRELUDE + NOMS.map(corps).join('\n') + '\nreturn {' + NOMS.join(',') + '};';
if (CONTRE){
  /* Contre-épreuve 1 — le poids redevient relu sur la fiche client.
     Contre-épreuve 2 — la part domaine n'est plus distinguée. */
  code = code.replace('function _vpPck(p){ var v=Number(p&&p.pck); return v>0?v:(_vendCfg().poids_caisse_kg||25); }',
                      'function _vpPck(p){ var c=_vendClient(p&&p.client); return (c&&c.poids_caisse_kg)||_vendCfg().poids_caisse_kg||25; }');
  code = code.replace(/return s\+\(p\.dom\?_vpKg\(p\):0\);/, 'return s+_vpKg(p);');
}
// eslint-disable-next-line no-new-func
const M = new Function('CLIENTS','CFG', code)(CLIENTS, CFG);

let ko = 0, n = 0;
const T = (titre, obtenu, attendu) => {
  n++; const ok = String(obtenu) === String(attendu);
  if (!ok) ko++;
  console.log((ok ? '  OK  ' : '  KO  ') + titre + ' → ' + obtenu + (ok ? '' : '   [attendu ' + attendu + ']'));
};

CLIENTS.length = 0;
CLIENTS.push({ nom:'Maison Bouchard', poids_caisse_kg:24 }, { nom:'Négoce de Nuits', poids_caisse_kg:22 });

// ── 1. Une récolte d'AVANT le lot se lit sans avoir été touchée ────────────
const vieilleVendue = { id:'r1', parcelle:'Le Clos', date:'2025-09-14', nb_caisses:40, vendu:true, client:'Maison Bouchard' };
const vieilleCuvee  = { id:'r2', parcelle:'Le Clos', date:'2025-09-14', nb_caisses:80, vendu:false, client:'' };
T('legacy vendue : kg = 40 × 24', M._recKg(vieilleVendue), 960);
T('legacy vendue : rien au domaine', M._recKgDom(vieilleVendue), 0);
T('legacy vendue : pas de cuve', M._recHasDom(vieilleVendue), false);
T('legacy vinifiée : 80 × 25 au domaine', M._recKgDom(vieilleCuvee), 2000);
T('legacy vinifiée : non vendue', M._recSold(vieilleCuvee), false);
T('legacy : caisses conservées', M._recCaisses(vieilleVendue), 40);

// ── 2. Une récolte du nouveau modèle ───────────────────────────────────────
const mixte = { id:'r3', parcelle:'Le Clos', date:'2026-09-13', nb_caisses:86,
  parts:[ { dom:true, caisses:36, pck:25 },
          { dom:false, client:'Maison Bouchard', caisses:28, pck:24, surface:0.12 },
          { dom:false, client:'Négoce de Nuits', caisses:22, pck:21 } ] };
T('mixte : total 2 034 kg', M._recKg(mixte), 36*25 + 28*24 + 22*21);
T('mixte : 900 kg au domaine', M._recKgDom(mixte), 900);
T('mixte : 1 134 kg vendus', M._recKgCli(mixte), 672 + 462);
T('mixte : 36 caisses en cuve', M._recCsDom(mixte), 36);
T('mixte : 86 caisses au total', M._recCaisses(mixte), 86);
T('mixte : alimente le cuvier', M._recHasDom(mixte), true);
T('mixte : et vend aussi', M._recSold(mixte), true);
T('mixte : 672 kg pour Bouchard', M._recKgPour(mixte,'Maison Bouchard'), 672);
T('mixte : 3 destinataires', M._recDests(mixte).length, 3);
T('mixte : surface de la portion', M._vpSurf(mixte.parts[1]), 0.12);

// ── 3. LE POINT DUR : la fiche client ne réécrit plus l'histoire ───────────
const avant = M._recKg(mixte);
CLIENTS[0].poids_caisse_kg = 30;
T('poids figé : kilos inchangés après modif fiche', M._recKg(mixte), avant);
T('poids figé : Bouchard toujours à 672 kg', M._recKgPour(mixte,'Maison Bouchard'), 672);
/* ...alors qu'une récolte NON migrée suit encore la fiche : c'est voulu, elle
   n'a pas de poids à elle tant qu'on ne l'a pas rouverte. */
T('legacy non migrée : suit encore la fiche', M._recKg(vieilleVendue), 40*30);
CLIENTS[0].poids_caisse_kg = 24;

// ── 4. Les cas limites qui font des divisions par zéro ailleurs ────────────
T('récolte vide : 0 kg', M._recKg({ id:'r4', parts:[] }), 0);
T('récolte sans rien : 0 kg', M._recKg({ id:'r5' }), 0);
T('part à 0 caisse : pas un destinataire', M._recDests({ parts:[{dom:false,client:'X',caisses:0,pck:24}] }).length, 0);
T('part à 0 caisse : pas de cuve', M._recHasDom({ parts:[{dom:true,caisses:0,pck:25}] }), false);
T('client sans nom : libellé lisible', M._vpNom({ dom:false, client:'' }), 'Vrac sans client');
T('pck absent : repli sur la config', M._vpKg({ dom:true, caisses:10 }), 250);

// ── 5. L'ÉCRAN : le pont vers le code de cuverie ──────────────────────────
/*  ⚠️ C'EST LE POINT LE PLUS RISQUÉ DU LOT. `index.html` n'est pas touché : le
    compteur `#vrec-caisses` est masqué et tenu à jour avec les caisses DU
    DOMAINE, parce que `_vendCuvAtt` et `_vendCuvKeep` le lisent pour proposer
    un volume de cuve. S'il portait le total, la cuve serait surévaluée de tout
    ce qui part chez les clients — sans le moindre message. On rejoue donc
    l'injection sur un DOM minimal et on LIT ce qui en sort. */
const NOMS_UI = ['_vendRepHide','_vendRepInject','_vendRepRender','_vendRepLigne','_vendRepKgHtml',
                 '_vendRepSurfHtml','_vendHa','_vendRepTotHtml','_vendRepPush','_vendRepLibres','_vendRepMaj',
                 '_vendRepDest','_vendRepCs','_vendRepAdj','_vendRepPck','_vendRepSurf',
                 '_vendRepAdd','_vendRepDel','_vendRepParts','_vendRepCss'];
const absentsUI = NOMS_UI.filter(x => !corps(x));
if (absentsUI.length){ console.error('ROUGE — UI introuvable : ' + absentsUI.join(', ')); process.exit(1); }

function noeud(id){
  return { id, value:'', innerHTML:'', style:{}, children:[], parentNode:null, previousElementSibling:null,
           appendChild(c){ c.parentNode=this; this.children.push(c); return c; },
           insertBefore(c,ref){ c.parentNode=this; this.children.splice(Math.max(0,this.children.indexOf(ref)),0,c); return c; } };
}
const REG = {};
const parentCs = noeud('parent');
const lblCs = noeud('lbl-caisses'), rowCs = noeud('row-caisses'), elCs = noeud('vrec-caisses');
parentCs.appendChild(lblCs); parentCs.appendChild(rowCs); rowCs.appendChild(elCs);
elCs.parentNode = rowCs; rowCs.previousElementSibling = lblCs;
const lblDest = noeud('lbl-dest'), vw = noeud('vrec-vendu-wrap');
parentCs.appendChild(lblDest); parentCs.appendChild(vw); vw.previousElementSibling = lblDest;
['vrec-caisses','vrec-vendu-wrap','vrec-cuvee-row','vrec-client-row','vrec-vinif-section','vrec-parcelle',
 'vrec-cuv-att'].forEach(k => { REG[k] = REG[k] || (k==='vrec-caisses'?elCs:(k==='vrec-vendu-wrap'?vw:noeud(k))); });
REG['vrec-parcelle'].value = 'Le Clos';

const docFaux = {
  getElementById(id){
    if (REG[id]) return REG[id];
    if (id.indexOf('vrp-') === 0 || id === 'vrec-rep' || id === 'vrec-rep-tot') return (REG[id] = noeud(id));
    return null;
  },
  createElement(){ return noeud('neuf'); },
  head:{ appendChild(){} }
};
const winFaux = {};
let codeUI = 'var CAVE_VENDANGE={config:CFG,clients:CLIENTS,recoltes:[]};\n'
  + 'var _vendVendu=false, _vcuvSel={volTouched:false,vol:null};\n'
  + 'function _escHtml(x){ var m={}; m["&"]="&amp;"; m["<"]="&lt;"; m[">"]="&gt;"; m[String.fromCharCode(34)]="&quot;"; m[String.fromCharCode(39)]="&#39;";\n'
  + '  return String(x==null?"":x).replace(/[&<>"\\u0027]/g,function(c){return m[c];}); }\n'
  + 'function _mvIcon(){ return "<svg></svg>"; }\n'
  + 'function _vendClients(){ return CLIENTS; }\n'
  + 'function _vendParcSurf(nom){ return nom==="Le Clos"?0.34:0; }\n'
  + 'function _vendSyncDest(){}\n'
  + 'function _vendCuvAtt(){ window.__attRejoue=(window.__attRejoue||0)+1; }\n'
  + PRELUDE + NOMS.map(corps).join('\n') + '\n' + NOMS_UI.map(corps).join('\n')
  + '\nreturn { inject:_vendRepInject, parts:_vendRepParts, add:_vendRepAdd, dest:_vendRepDest,'
  + ' cs:_vendRepCs, pck:_vendRepPck, surf:_vendRepSurf, del:_vendRepDel, etat:function(){return _vrep;},'
  + ' vendu:function(){return _vendVendu;} };';
// eslint-disable-next-line no-new-func
const U = new Function('CLIENTS','CFG','document','window', codeUI)(CLIENTS, CFG, docFaux, winFaux);

U.inject(mixte);
T('écran : le libellé « Nombre de caisses » est masqué', lblCs.style.display, 'none');
T('écran : le compteur d\'origine est masqué', rowCs.style.display, 'none');
T('écran : le toggle vendu/vinifié est masqué', vw.style.display, 'none');
T('★ PONT : #vrec-caisses porte les caisses DU DOMAINE', elCs.value, 36);
T('écran : trois lignes de répartition', (REG['vrec-rep'].innerHTML.match(/class="vrp-l/g)||[]).length, 3);
/* ⚠️ Deux assertions ont été écrites fausses ici, et c'est instructif :
   1. un input[type=number] porte sa valeur avec un POINT — c'est la spec HTML,
      le navigateur l'affiche ensuite selon la locale ;
   2. le reste (0,34 − 0,12 = 0,22 ha) se PARTAGE entre les DEUX parts sans
      surface : 0,11 chacune, pas 0,22. */
T('écran : la surface achetée est dans le champ', /value="0.12"/.test(REG['vrec-rep'].innerHTML), true);
T('écran : le reste 0,22 ha partagé entre les deux parts sans surface', /0,11/.test(REG['vrec-rep'].innerHTML), true);
T('écran : le total dit les kilos vendus', /1\u202f134 kg vendus|1 134 kg vendus/.test(REG['vrec-rep'].innerHTML), true);
T('écran : la cuve est prévenue du changement', winFaux.__attRejoue > 0, true);

U.cs(0, 50);
T('★ PONT : le compteur suit la part domaine', elCs.value, 50);
U.dest(0, 'C:Négoce de Nuits');
T('★ PONT : plus de part domaine → compteur à 0', elCs.value, 0);
T('écran : _vendVendu devient vrai tout seul', U.vendu(), true);
T('écran : le poids suit le nouveau destinataire', U.etat()[0].pck, 22);
U.dest(0, 'D');
T('écran : retour au domaine, poids de la config', U.etat()[0].pck, 25);

const sortie = U.parts();
T('sortie : 3 parts', sortie.length, 3);
T('sortie : la part domaine n\'a pas de client', 'client' in sortie[0], false);
T('sortie : la surface est conservée', sortie[1].surface, 0.12);
T('sortie : pas de surface inventée', 'surface' in sortie[2], false);
U.cs(2, 0);
T('sortie : une ligne à 0 caisse ne part pas en base', U.parts().length, 2);

console.log('\n' + (ko ? ko + ' ASSERTION(S) ROUGE(S) sur ' + n : 'TOUT VERT — ' + n + ' assertions'));
if (CONTRE){
  console.log(ko ? '\nCONTRE-ÉPREUVE CONCLUANTE : les défauts réintroduits sont vus.'
                 : '\n⚠️ CONTRE-ÉPREUVE MUETTE : le harnais ne voit pas les défauts, il ne prouve rien.');
  process.exit(ko ? 0 : 1);
}
process.exit(ko ? 1 : 0);
