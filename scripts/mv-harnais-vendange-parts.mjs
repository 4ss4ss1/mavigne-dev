#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : LA VENDANGE À PLUSIEURS (lots VD-1, VD-2 et VD-3)
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

// ── 6. VD-2 : LA LIVRAISON, SON BON, ET LE RETOUR DU CLIENT ───────────────
/*  L'unité du bon est le CHARGEMENT : un client + une date, quelles que soient
    les parcelles. Et deux mesures cohabitent sans se mélanger — les kilos, du
    domaine ; les litres, du client, des semaines plus tard.
    ⚠️ Le piège du prorata : arrondir ligne à ligne fabrique un litre qui
    n'existe pas. La somme des lignes doit retomber EXACTEMENT sur le total
    annoncé par le client. */
const NOMS_LIV = ['_vendLivs','_livKg','_livCs','_livJus','_livLie','_livVol','_livRetour',
                  '_livProrata','_livDateRet','_vendRendKgHl','_vendInit','_vendBlLignes','_vendBlCorps'];
const absentsLiv = NOMS_LIV.filter(x => !corps(x));
if (absentsLiv.length){ console.error('ROUGE — VD-2 introuvable : ' + absentsLiv.join(', ')); process.exit(1); }

const RECS = [
  { id:'a', parcelle:'Le Clos', date:'2026-09-13',
    parts:[ { dom:true, caisses:36, pck:25 },
            { dom:false, client:'Maison Bouchard', caisses:28, pck:24, surface:0.12,
              retour:{ jus:460, lie:45, le:'2026-09-19', src:'saisi' } } ] },
  { id:'b', parcelle:'En Champs', date:'2026-09-13',
    parts:[ { dom:false, client:'Maison Bouchard', caisses:10, pck:24 } ] },
  { id:'c', parcelle:'Aux Combottes', date:'2026-09-11',
    parts:[ { dom:false, client:'Maison Bouchard', caisses:20, pck:23,
              retour:{ jus:300, lie:30, le:'2026-09-18', src:'prorata' } } ] }
];
let codeLiv = 'var CAVE_VENDANGE={config:CFG,clients:CLIENTS,recoltes:RECS};\n'
  + 'var window={DOMAINE_NOM:"Domaine des Perrières"};\n'
  + 'function _escHtml(x){ var m={}; m["&"]="&amp;"; m["<"]="&lt;"; m[">"]="&gt;"; m[String.fromCharCode(34)]="&quot;"; m[String.fromCharCode(39)]="&#39;";\n'
  + '  return String(x==null?"":x).replace(/[&<>"\u0027]/g,function(c){return m[c];}); }\n'
  + 'function _vendFrDate(s){ if(!s) return ""; var p=String(s).split("-"); return p.length===3?(p[2]+"/"+p[1]):s; }\n'
  + 'function _vendHa(x){ return (Math.round(x*10000)/10000).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:4}); }\n'
  + 'function _vendL1(x){ return (Math.round(x*10)/10).toLocaleString("fr-FR",{minimumFractionDigits:1,maximumFractionDigits:1}); }\n'
  + 'function _vendKgTxt(x){ return Math.round(x||0).toLocaleString("fr-FR"); }\n'
  + PRELUDE + NOMS.map(corps).join('\n') + '\n' + NOMS_LIV.map(corps).join('\n')
  + '\nreturn {' + NOMS_LIV.join(',') + '};';
// eslint-disable-next-line no-new-func
const L = new Function('CLIENTS','CFG','RECS', codeLiv)(CLIENTS, CFG, RECS);

const livs = L._vendLivs('Maison Bouchard');
T('★ le bon regroupe par CHARGEMENT, pas par apport', livs.length, 2);
T('livraison du 13/09 : deux parcelles', livs[0].lignes.length, 2);
T('la plus récente en tête', livs[0].date, '2026-09-13');
T('kg du chargement (28×24 + 10×24)', L._livKg(livs[0]), 912);
T('caisses du chargement', L._livCs(livs[0]), 38);
T('retour partiel : la livraison compte comme reçue', L._livRetour(livs[0]), true);
T('jus du chargement', L._livJus(livs[0]), 460);
T('rendement réel 672 kg / 5,05 hL', Math.round(L._vendRendKgHl(672, 505)), 133);
T('prorata signalé sur le 11/09', L._livProrata(livs[1]), true);
T('date de réception retenue', L._livDateRet(livs[0]), '2026-09-19');
T('repère du bon', L._vendInit('Maison Bouchard'), 'MB');
T('repère : un seul mot', L._vendInit('Bouchard'), 'B');

const client = { nom:'Maison Bouchard', poids_caisse_kg:24, adresse:'12 rue du Chapitre, 21200 Beaune' };
const bon = L._vendBlCorps(client, L._vendBlLignes([livs[0]]), 'jour');
T('bon : le domaine émetteur', /Domaine des Perri/.test(bon), true);
T('★ bon : AUCUN prix, aucun montant', /€|euro|prix|montant/i.test(bon), false);
T('bon : la surface achetée', /0,12 ha/.test(bon), true);
T('bon : le pont-bascule fait foi', /pont-bascule/.test(bon), true);
T('bon : deux poids par caisse annoncés', /24 kg/.test(bon), true);
T('bon : la section retour existe', /Retour du client/.test(bon), true);
T('bon : la ligne sans retour est « en attente »', /en attente<\/td>/.test(bon), true);
T('★ bon : les totaux disent sur combien de kilos ils portent', /672 kg des 912 kg/.test(bon), true);

const sansRetour = L._vendBlCorps(client, L._vendBlLignes([{ client:'x', date:'2026-09-20',
  lignes:[{ parcelle:'Le Clos', part:{ dom:false, client:'Maison Bouchard', caisses:5, pck:24 } }] }]), 'jour');
T('bon sans retour : pas de tableau vide', /Retour du client \u2014 volumes/.test(sansRetour), false);
T('bon sans retour : le dit en clair', /en attente du retour du client/.test(sansRetour), true);
T('bon sans surface : pas de colonne fantôme', /<th class="n">Surface<\/th>/.test(sansRetour), false);

const recap = L._vendBlCorps(client, L._vendBlLignes(livs), 'campagne');
T('récap : les 3 apports', (recap.match(/<tr><td>\d\d\/\d\d<\/td>/g)||[]).length, 6);
T('récap : trié du plus ancien', recap.indexOf('11/09') < recap.indexOf('13/09'), true);
T('récap : mention du prorata', /prorata des kilos, pas une mesure/.test(recap), true);

/* ⚠️ LE PIÈGE DU PRORATA, rejoué sur la fonction réelle de répartition. */
const codeProrata = 'var _vliv={lignes:LIGNES,detail:false};\n'
  + 'function _vlKg(){ return _vliv.lignes.reduce(function(s,x){ return s+x.caisses*x.pck; },0); }\n'
  + corps('_vendRetProrata') + '\nreturn _vendRetProrata;';
const LIGNES = [ { caisses:10, pck:20 }, { caisses:30, pck:20 } ];   // 200 kg et 600 kg
// eslint-disable-next-line no-new-func
const prorata = new Function('LIGNES', codeProrata)(LIGNES);
const r = prorata(555, 50);
T('★ prorata : la somme retombe sur le total annoncé', r[0].jus + r[1].jus, 555);
T('prorata : le quart sur 200 des 800 kg', r[0].jus, 138.8);
T('prorata : la lie aussi', r[0].lie + r[1].lie, 50);

// ── 7. VD-3 : LE RENDEMENT, ET CE QU'IL VAUT ──────────────────────────────
/*  ⚠️⚠️⚠️ LE DÉFAUT QUE CE VOLET INTERDIT : afficher un hL/ha net — et un
    « % du maximum d'appellation » calculé dessus — alors que deux volumes sur
    trois manquent encore. C'est §33 à l'identique : un indicateur bâti sur un
    signal partiel ment avec l'autorité d'une mesure.
    ⚠️ Et la surface ne s'additionne pas d'un passage à l'autre. */
const NOMS_RDT = ['_vendRdtBase','_vendLitresRetour','_vendVolCuve','_vendVolPart','_vendSrcLbl',
                  '_vendSurfParc','_vendSurfLbl','_vendHaTxt','_vendVolParc','_vendRdtParc'];
const absentsRdt = NOMS_RDT.filter(x => !corps(x));
if (absentsRdt.length){ console.error('ROUGE — VD-3 introuvable : ' + absentsRdt.join(', ')); process.exit(1); }

/* Le Clos, 0,34 ha : le domaine garde le reste, deux négoces ont acheté leur
   portion. Une cuve de 6,6 hL porte la part domaine ; Bouchard a rendu ses
   litres ; Négoce n'a pas encore répondu. */
const R3 = [
  { id:'x', parcelle:'Le Clos', date:'2026-09-13', cuve_id:'cv1',
    parts:[ { dom:true, caisses:36, pck:25 },
            { dom:false, client:'Maison Bouchard', caisses:28, pck:24, surface:0.12,
              retour:{ jus:460, lie:45, le:'2026-09-19', src:'saisi' } },
            { dom:false, client:'Négoce de Nuits', caisses:22, pck:21, surface:0.08 } ] }
];
const CUVES = [ { id:'cv1', volume_hl:6.6 } ];
let codeRdt = 'var CAVE_VENDANGE={config:CFG,clients:CLIENTS,recoltes:RECS,cuves_vinif:CUVES};\n'
  + 'function _vendParcSurf(nom){ return nom==="Le Clos"?0.34:0; }\n'
  + 'function _vendMillOfDate(d){ return parseInt(String(d).slice(0,4),10); }\n'
  + PRELUDE + NOMS.map(corps).join('\n') + '\n' + NOMS_RDT.map(corps).join('\n')
  + '\nreturn {' + NOMS_RDT.join(',') + ', CFG:CFG};';
// eslint-disable-next-line no-new-func
const V = new Function('CLIENTS','CFG','RECS','CUVES', codeRdt)(CLIENTS, CFG, R3, CUVES);

const d = V._vendRdtParc('Le Clos', 2026);
T('★ statut PARTIEL, pas « mesuré »', d.vol.statut, 'partiel');
T('volume connu : 6,6 hL de cuve + 4,60 hL rendus', Math.round(d.vol.hl*100)/100, 11.2);
T('kilos couverts : 900 + 672', d.vol.kgOk, 1572);
T('kilos sans volume : les 462 de Négoce', d.vol.kgKo, 462);
T('★ part mesurée annoncée', d.vol.pctOk, 77);
T('fourchette basse (140 kg/hL sur le reste)', Math.round(d.vol.hlMin*100)/100, Math.round((11.2+462/140)*100)/100);
T('fourchette haute (130 kg/hL)', Math.round(d.vol.hlMax*100)/100, Math.round((11.2+462/130)*100)/100);
T('sources mêlées', d.vol.src, 'mixte');

T('surface : Bouchard a acheté 0,12 ha', d.parts.find(x => x.nom === 'Maison Bouchard').ha, 0.12);
T('surface : le domaine prend le reste', Math.round(d.parts.find(x => x.dom).ha * 10000) / 10000, 0.14);
T('surface : origine du reste', d.parts.find(x => x.dom).haSrc, 'reste');
T('somme = surface cadastrale', Math.round(d.surf.attribuee * 10000) / 10000, 0.34);
T('kg/ha de la portion domaine (900 / 0,14)', Math.round(d.parts.find(x => x.dom).kgHa), 6429);
T('hL/ha de la portion Bouchard (4,60 / 0,12)', Math.round(d.parts.find(x => x.nom === 'Maison Bouchard').hlHa * 10) / 10, 38.3);
T('Négoce : pas de hL/ha sans volume', d.parts.find(x => x.nom === 'Négoce de Nuits').hlHa, 'null');
T('la part domaine vient de la cuve', d.parts.find(x => x.dom).src, 'cuve');
T('la part Bouchard vient du client', d.parts.find(x => x.nom === 'Maison Bouchard').src, 'client');
T('Négoce : retour attendu', d.parts.find(x => x.nom === 'Négoce de Nuits').src, 'attente');

/* La base du rendement : le réglage change le volume, jamais les kilos. */
const kgAvant = d.vol.kg;
CFG.rdt_base = 'total';
const d2 = V._vendRdtParc('Le Clos', 2026);
T('base jus + lies : 45 L de plus', Math.round((d2.vol.hl - d.vol.hl) * 100) / 100, 0.45);
T('les kilos ne bougent pas avec la base', d2.vol.kg, kgAvant);
CFG.rdt_base = 'jus';

/* ⚠️ DEUX PASSAGES SUR LA MÊME VIGNE NE FONT PAS DEUX SURFACES. */
R3.push({ id:'y', parcelle:'Le Clos', date:'2026-09-16',
  parts:[ { dom:false, client:'Maison Bouchard', caisses:10, pck:24, surface:0.12 } ] });
let s3 = V._vendSurfParc('Le Clos', 2026);
T('★ 2e passage : la surface n\'est PAS additionnée', s3.lignes.find(x => x.nom === 'Maison Bouchard').ha, 0.12);
T('2e passage : les kilos, eux, s\'additionnent', s3.lignes.find(x => x.nom === 'Maison Bouchard').kg, 672 + 240);
T('total toujours 0,34 ha', Math.round(s3.attribuee * 10000) / 10000, 0.34);
R3[1].parts[0].surface = 0.15;
s3 = V._vendSurfParc('Le Clos', 2026);
T('deux surfaces divergentes : signalées', s3.conflit.length, 1);
T('...et la plus grande est retenue', s3.lignes.find(x => x.nom === 'Maison Bouchard').ha, 0.15);
R3.pop();

/* Les deux écarts de bornes. */
R3[0].parts[1].surface = 0.30; R3[0].parts[2].surface = 0.20;   // 0,50 déclarés sur 0,34
s3 = V._vendSurfParc('Le Clos', 2026);
T('dépassement mesuré', Math.round(s3.depasse * 10000) / 10000, 0.16);
T('pas d\'orphelin quand ça déborde', s3.orphelin, 0);
R3[0].parts[0].surface = 0.10; R3[0].parts[1].surface = 0.12; R3[0].parts[2].surface = 0.08;  // 0,30 sur 0,34
s3 = V._vendSurfParc('Le Clos', 2026);
T('hectares que personne ne réclame', Math.round(s3.orphelin * 10000) / 10000, 0.04);
delete R3[0].parts[0].surface; R3[0].parts[1].surface = 0.12; R3[0].parts[2].surface = 0.08;

/* ⚠️ UNE CUVE QUI RASSEMBLE DEUX PARCELLES : son volume se PARTAGE.
   Sans ce cas, la contre-épreuve du prorata de cuve reste MUETTE — le jeu
   d'essai à une seule récolte par cuve rend `vol × kd/tot` et `vol` identiques,
   et un harnais qui ne peut pas rougir ne prouve rien. */
R3.push({ id:'z', parcelle:'Aux Combottes', date:'2026-09-13', cuve_id:'cv1',
  parts:[ { dom:true, caisses:24, pck:25 } ] });
const cl2 = V._vendRdtParc('Le Clos', 2026), cb2 = V._vendRdtParc('Aux Combottes', 2026);
T('★ cuve partagée : Le Clos prend 900/1500 des 6,6 hL',
  Math.round(cl2.parts.find(x => x.dom).hl * 100) / 100, 3.96);
T('★ cuve partagée : Combottes prend 600/1500', Math.round(cb2.parts.find(x => x.dom).hl * 100) / 100, 2.64);
T('la somme fait bien le volume de la cuve',
  Math.round((cl2.parts.find(x => x.dom).hl + cb2.parts.find(x => x.dom).hl) * 100) / 100, 6.6);
T('★ un volume de cuve réparti est DÉDUIT, pas mesuré par parcelle',
  cl2.parts.find(x => x.dom).prorata, true);
R3.pop();
T('cuve à une seule récolte : rien à déduire',
  V._vendRdtParc('Le Clos', 2026).parts.find(x => x.dom).prorata, false);

/* Une parcelle entièrement mesurée : le chiffre devient une mesure. */
R3[0].parts[2].retour = { jus:340, lie:30, le:'2026-09-25', src:'saisi' };
const d3 = V._vendRdtParc('Le Clos', 2026);
T('★ tous les volumes connus → statut MESURE', d3.vol.statut, 'mesure');
T('100 % mesuré', d3.vol.pctOk, 100);
T('volume total 14,6 hL', Math.round(d3.vol.hl * 100) / 100, 14.6);
T('rendement réel 2 034 kg / 14,6 hL', Math.round(V._vendRdtBase() === 'jus' ? 2034 / 14.6 : 0), 139);
delete R3[0].parts[2].retour;

console.log('\n' + (ko ? ko + ' ASSERTION(S) ROUGE(S) sur ' + n : 'TOUT VERT — ' + n + ' assertions'));
if (CONTRE){
  console.log(ko ? '\nCONTRE-ÉPREUVE CONCLUANTE : les défauts réintroduits sont vus.'
                 : '\n⚠️ CONTRE-ÉPREUVE MUETTE : le harnais ne voit pas les défauts, il ne prouve rien.');
  process.exit(ko ? 0 : 1);
}
process.exit(ko ? 1 : 0);
