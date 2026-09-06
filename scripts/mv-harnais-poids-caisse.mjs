#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : CORRIGER UN POIDS DE CAISSE APRÈS COUP (lot CUV-5)
// ═══════════════════════════════════════════════════════════════════════════
//  ★★★ POURQUOI CE HARNAIS EXISTE.
//  Un correcteur en masse touche 47 récoltes d'un geste. Il a exactement trois
//  façons de mentir, et AUCUNE ne se voit à l'écran :
//
//   1. NE PAS PRÉVENIR LA PARCELLE. Les kilos sont dénormalisés dans
//      `rendement_hist`, et c'est là que le Pilotage lit son prix de revient.
//      Corriger `parts[].pck` sans repasser par `_vendRecordRendement` laisse
//      le Cuvier juste et le Pilotage faux — les deux écrans ayant l'air sains
//      chacun de son côté. C'est le défaut que `_vendRetSave` portait déjà.
//
//   2. PERDRE LA CORRECTION D'UNE RÉCOLTE D'AVANT VD-1. `_vendParts()` fabrique
//      une part de migration EN LECTURE, qui n'est stockée nulle part. Écrire
//      dedans sans la poser dans la récolte, c'est corriger un objet jetable :
//      l'écran dit juste, le rechargement dit faux.
//
//   3. DÉBORDER. Corriger « 25 kg » ne doit toucher NI les apports à 12 kg, NI
//      un autre millésime. Un correcteur trop large ne se remarque pas non
//      plus : les kilos changent, personne ne sait qu'ils n'auraient pas dû.
//
//  Le harnais EXÉCUTE les fonctions réellement extraites de src/cave.js — dont
//  `_vpcAppliquer` et `_vendRecordRendement` en entier. Il ne cherche pas des
//  motifs de texte : un contrôle qui lit du texte aurait dit vert sur les trois.
//
//  Usage :
//    node scripts/mv-harnais-poids-caisse.mjs
//    node scripts/mv-harnais-poids-caisse.mjs --contre   # les contre-épreuves, une par une
//  Exit 0 si tout passe, 1 sinon. Un CRASH est ROUGE.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const args   = process.argv.slice(2);
const CONTRE = args.includes('--contre');
/* ⚠️ UN SABOTAGE À LA FOIS. Joués ensemble, deux défauts se couvrent : le
   premier fait tomber les assertions du second, et on ne sait plus lequel est
   réellement vu. `--contre` relance donc ce fichier une fois par défaut, dans
   son propre processus, et EXIGE le rouge à chaque fois. */
const SABOT = (() => { const a = args.find(x => x.startsWith('--sabotage=')); return a ? parseInt(a.slice(11), 10) : -1; })();
const CIBLE  = path.resolve(args.find(a => !a.startsWith('--')) || path.join(RACINE, 'src', 'cave.js'));

const SRC = fs.readFileSync(CIBLE, 'utf8');

/* Extraction par comptage d'accolades : la fonction telle qu'elle est écrite
   dans le module, pas une copie qui dériverait au premier lot suivant. */
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

const NOMS = [
  '_vendMillOfDate','_vendClients','_vendClient','_vendPckLegacy','_vendParts',
  '_vpPck','_vpCs','_vpKg','_vpNom','_vpSurf',
  '_recKg','_recCaisses','_recKgDom','_recCsDom','_recKgCli','_recHasDom','_recSold',
  '_vendParcSurf','_vendParcByName','_vendSaveParcelles','_vendParcLot',
  '_vendSurfParc','_vendVolCuve','_vendVolPart','_vendLitresRetour','_vendRdtBase',
  '_vendCuvCsDom','_vendVolLoge','_vendRecordRendement',
  '_vpcMillesimes','_vpcRecs','_vpcPoids','_vpcLigne','_vpcClientsVises','_vpcAppliquer'
];
/* Les deux compteurs du lot d'écritures sont des `var` de module, pas des
   fonctions : on les extrait tels quels, pour que le harnais tombe si la
   déclaration disparaît au lieu de la redéclarer gentiment de son côté. */
const DECL = (SRC.match(/^var _vendParcDiff=.*$/m) || [])[0];
if (!DECL){
  console.error('ROUGE — `var _vendParcDiff` introuvable : le lot d\'écritures de parcelles a disparu.');
  process.exit(1);
}

const manquants = NOMS.filter(n => !corps(n));
if (manquants.length){
  console.error('ROUGE — fonctions introuvables dans ' + path.basename(CIBLE) + ' : ' + manquants.join(', '));
  process.exit(1);
}

/* Les seules dépendances laissées au harnais : l'écran, le réseau et la config.
   Tout le reste est le vrai code. `_saves` compte les écritures de parcelles :
   c'est lui qui prouve que la rafale est regroupée. */
const PRELUDE = `
var CAVE_VENDANGE = {config:{poids_caisse_kg:25,ratio_min:130,ratio_max:140},recoltes:[],cuves_vinif:[],clients:[]};
var PARCELLES = [];
var _vendTab = 'param';
var _vpc = {mil:null, ancien:null, nouveau:null, defaut:true, clients:true};
var _journal = {saves:0, toasts:[], fb:[]};
var window = { get CAVE_VENDANGE(){return CAVE_VENDANGE;}, set CAVE_VENDANGE(v){CAVE_VENDANGE=v;},
               get PARCELLES(){return PARCELLES;},
               saveData:function(){ _journal.saves++; },
               openConfirmDel:function(t,s,cb){ cb(); } };
function _vendCfg(){return Object.assign({poids_caisse_kg:25,ratio_min:130,ratio_max:140,sucre_par_degre:16.83},CAVE_VENDANGE.config||{});}
function _vendGarde(){ return true; }
function _vendFbSave(m){ _journal.fb.push(m); }
function showToast(m){ _journal.toasts.push(m); }
function _vendSheetClose(){}
function renderVendParam(){}
function renderVendRec(){}
`;

let code = PRELUDE + DECL + '\n' + NOMS.map(corps).join('\n')
         + '\nreturn {' + NOMS.join(',')
         + ', _etat:function(){return {CAVE_VENDANGE:CAVE_VENDANGE,PARCELLES:PARCELLES,_vpc:_vpc,j:_journal};}'
         + ', _set:function(k,v){ if(k===\'vpc\') _vpc=v; if(k===\'recoltes\') CAVE_VENDANGE.recoltes=v;'
         + ' if(k===\'parcelles\') PARCELLES=v; if(k===\'clients\') CAVE_VENDANGE.clients=v;'
         + ' if(k===\'config\') CAVE_VENDANGE.config=v; }};';

/* Les défauts réintroduits, dans l'ordre où ils sont décrits en tête de fichier.
   ⚠️ Un sabotage dont l'ancre a disparu doit ÉCHOUER FORT : sans ça, le jour où
   le code change, la contre-épreuve passerait au vert sans rien saboter du
   tout, et le harnais ne prouverait plus rien en silence. */
const SABOTAGES = (() => {
  const sabotages = [
    // 1. la parcelle n'est plus prévenue
    ['      _vendRecordRendement(r,null);\n', '      /* saboté */\n'],
    // 2. la part de migration n'est plus posée dans la récolte
    ['      if(!Array.isArray(r.parts)||!r.parts.length) r.parts=ps;\n', '      /* saboté */\n'],
    // 3. le filtre de poids déborde sur tous les apports
    ['        if(_vpCs(p)>0 && _vpPck(p)===anc){ p.pck=nv; nApp++; }',
     '        if(_vpCs(p)>0){ p.pck=nv; nApp++; }']
  ];
  return sabotages;
})();

/* ── Deux régressions qui ne s'attrapent PAS en exécutant _vpcAppliquer ──────
   Elles vivent dans d'autres fonctions (`_vendRetSave`, `_bcData`), trop
   attachées à leur écran pour être extraites ici. Ce sont donc des contrôles
   MÉCANIQUES sur le texte du module — et ils sont dits comme tels : ils
   vérifient qu'un appel existe et qu'une constante a disparu, rien de plus.
   Ils gardent deux défauts réels, trouvés pendant ce lot. */
const SAB_TXT = [
  ['_vendRecordRendement(x.rec,null);', '/* saboté */'],
  ['      var kg = _recKg(r);', '      var kg = (r.nb_caisses||0) * 25;']
];

const LIB = ['la parcelle n\'est plus prévenue',
             'la part de migration n\'est plus posée dans la récolte',
             'le filtre de poids déborde sur tous les apports',
             'le retour de livraison ne prévient plus la parcelle',
             'le bilan de campagne repèse les caisses à 25 kg en dur'];

if (CONTRE){
  const { spawnSync } = await import('node:child_process');
  let vus = 0;
  const TOTAL = SABOTAGES.length + SAB_TXT.length;
  for (let i = 0; i < TOTAL; i++){
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), CIBLE, '--sabotage=' + i],
                        { encoding:'utf8' });
    void r;
    const rouge = r.status !== 0;
    if (rouge) vus++;
    console.log((rouge ? '  VU  ' : '  RATÉ ') + 'sabotage ' + (i + 1) + ' — ' + LIB[i]);
    if (!rouge) console.log(r.stdout.split('\n').filter(l => l.includes('TOUT VERT')).join(''));
  }
  const ok = vus === TOTAL;
  console.log('\n' + (ok ? 'CONTRE-ÉPREUVE CONCLUANTE : ' + vus + '/' + TOTAL + ' défauts vus.'
                          : '⚠️ CONTRE-ÉPREUVE MUETTE : ' + (TOTAL - vus) + ' défaut(s) passent inaperçus.'));
  process.exit(ok ? 0 : 1);
}

let TEXTE = SRC;
if (SABOT >= 0){
  const s = SABOTAGES[SABOT] || SAB_TXT[SABOT - SABOTAGES.length];
  if (!s){ console.error('ROUGE — sabotage ' + SABOT + ' inconnu.'); process.exit(1); }
  const cible = SABOT < SABOTAGES.length ? code : TEXTE;
  if (!cible.includes(s[0])){
    console.error('ROUGE — contre-épreuve impossible : l\'ancre du sabotage a disparu du code.\n  ' + s[0].trim());
    process.exit(1);
  }
  if (SABOT < SABOTAGES.length) code  = code.replace(s[0], s[1]);
  else                          TEXTE = TEXTE.replace(s[0], s[1]);
}

/* ⚠️ LES COMMENTAIRES SONT DU TEXTE. Le commentaire qui EXPLIQUE le défaut
   corrigé contient le motif du défaut : sans ce nettoyage, un contrôle « ce
   motif a disparu » resterait rouge à jamais, et on finirait par le retirer.
   C'est le contrôle qui s'adapte, pas l'explication qui s'efface. */
function sansCom(t){
  return t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
}
/* Le corps d'une fonction nommée, pris dans le texte (éventuellement saboté). */
function corpsT(nom){
  const i = TEXTE.indexOf('function ' + nom + '(');
  if (i < 0) return '';
  let p = TEXTE.indexOf('{', i), n = 0, j = p;
  for (; j < TEXTE.length; j++){
    if (TEXTE[j] === '{') n++;
    else if (TEXTE[j] === '}'){ n--; if (n === 0) break; }
  }
  return TEXTE.slice(i, j + 1);
}

// eslint-disable-next-line no-new-func
const M = new Function(code)();

let ko = 0, n = 0;
const T = (titre, obtenu, attendu) => {
  n++; const ok = String(obtenu) === String(attendu);
  if (!ok) ko++;
  console.log((ok ? '  OK  ' : '  KO  ') + titre + ' → ' + obtenu + (ok ? '' : '   [attendu ' + attendu + ']'));
};

/* ── Le jeu d'essai : la vendange 2026 de Nico, en miniature ────────────────
   Deux parcelles, deux poids de caisse, un client, et une récolte de 2025 qui
   ne doit surtout pas bouger. */
function poser(){
  M._set('parcelles', [
    { nom:'Le Clos',        surface:0.80, rendement_hist:[] },
    { nom:'Aux Combottes',  surface:0.50, rendement_hist:[] }
  ]);
  M._set('clients', [{ nom:'Maison Bouchard', poids_caisse_kg:12 }]);
  M._set('config', { poids_caisse_kg:25, ratio_min:130, ratio_max:140 });
  M._set('recoltes', [
    // mixte : 40 caisses de 25 au domaine + 30 caisses de 12 chez le négoce
    { id:'r1', parcelle:'Le Clos', date:'2026-09-14', nb_caisses:70,
      parts:[ { dom:true, caisses:40, pck:25 },
              { dom:false, client:'Maison Bouchard', caisses:30, pck:12 } ] },
    // domaine seul, même poids
    { id:'r2', parcelle:'Aux Combottes', date:'2026-09-15', nb_caisses:20,
      parts:[ { dom:true, caisses:20, pck:25 } ] },
    // ★ récolte d'AVANT VD-1 : aucun parts[], le poids vient de la fiche client
    { id:'r3', parcelle:'Le Clos', date:'2026-09-16', nb_caisses:10,
      vendu:true, client:'Maison Bouchard' },
    // ★ millésime précédent : hors de portée de la correction
    { id:'r0', parcelle:'Le Clos', date:'2025-09-20', nb_caisses:12,
      parts:[ { dom:true, caisses:12, pck:25 } ] }
  ]);
  M._set('vpc', { mil:2026, ancien:25, nouveau:20, defaut:true, clients:true });
  M._etat().j.saves = 0; M._etat().j.fb.length = 0; M._etat().j.toasts.length = 0;
}
poser();

// ── 1. Ce que l'écran annonce AVANT d'appliquer ────────────────────────────
T('deux millésimes détectés',            M._vpcMillesimes().join(','), '2026,2025');
T('trois récoltes sur 2026',             M._vpcRecs(2026).length, 3);
const ps = M._vpcPoids(2026);
T('deux poids en place sur 2026',        ps.length, 2);
T('le plus lourd en tête : 25 kg',       ps[0].pck, 25);
T('25 kg → 2 récoltes',                  ps[0].recoltes, 2);
T('25 kg → 60 caisses',                  ps[0].caisses, 60);
T('25 kg → 1 500 kg',                    ps[0].kg, 1500);
T('★ 12 kg vu AUSSI sur la récolte legacy (40 caisses)', ps[1].caisses, 40);
T('12 kg → 480 kg',                      ps[1].kg, 480);
T('★ la campagne 2025 n\'entre pas dans le compte', M._vpcLigne(2026,25).kg, 1500);
T('la fiche client à 12 kg est repérée', M._vpcClientsVises(12).length, 1);
T('...et aucune à 25 kg',                M._vpcClientsVises(25).length, 0);

// ── 2. La correction 25 → 20 ───────────────────────────────────────────────
M._vpcAppliquer();
const E = M._etat();
const R = k => E.CAVE_VENDANGE.recoltes.find(r => r.id === k);
const P = k => E.PARCELLES.find(p => p.nom === k);
/* ⚠️ `|| {}` : une entrée manquante doit produire une assertion ROUGE, pas une
   exception. Un harnais qui plante ne dit pas CE QUI a lâché. */
const H = (k, rid) => ((P(k).rendement_hist || []).find(e => e.recolte_id === rid) || {});

T('la part domaine passe à 20 kg',       R('r1').parts[0].pck, 20);
T('★ la part à 12 kg N\'A PAS BOUGÉ',     R('r1').parts[1].pck, 12);
T('r1 : 40×20 + 30×12 = 1 160 kg',       M._recKg(R('r1')), 1160);
T('r2 corrigée aussi',                   M._recKg(R('r2')), 400);
T('★ la récolte legacy (12 kg) est intacte', M._recKg(R('r3')), 120);
T('★ le millésime 2025 est intact',      M._recKg(R('r0')), 300);
T('les caisses ne changent pas',         M._recCaisses(R('r1')), 70);
T('nb_caisses reste cohérent',           R('r1').nb_caisses, 70);

// ── 3. ★★ LE POINT DUR : la parcelle a été prévenue ────────────────────────
T('★ rendement_hist écrit pour r1',      H('Le Clos','r1').kg != null, true);
T('★ kg de l\'entrée = kg corrigés',      H('Le Clos','r1').kg, 1160);
T('★ kg/ha recalculé (1160 / 0,80)',     H('Le Clos','r1').kg_ha, 1450);
T('★ la part domaine de l\'entrée suit',  ((H('Le Clos','r1').parts||[]).find(p => p.dest === 'domaine')||{}).kg, 800);
T('★ le pck de la part est celui d\'après', ((H('Le Clos','r1').parts||[]).find(p => p.dest === 'domaine')||{}).pck, 20);
T('★ la part client garde SON poids',    ((H('Le Clos','r1').parts||[]).find(p => p.dest === 'Maison Bouchard')||{}).pck, 12);
T('★ Aux Combottes recalculée (400/0,50)', H('Aux Combottes','r2').kg_ha, 800);
T('★ aucune entrée pour 2025',           H('Le Clos','r0').kg != null, false);

// ── 4. La rafale ne fait qu'UNE écriture de parcelles ──────────────────────
T('★★ deux récoltes corrigées = 1 seule écriture', E.j.saves, 1);
T('un seul message d\'enregistrement',   E.j.fb.length, 1);

// ── 5. Le poids par défaut et la fiche client ──────────────────────────────
T('le défaut du Cuvier suit 25 → 20',    E.CAVE_VENDANGE.config.poids_caisse_kg, 20);
T('★ la fiche client à 12 ne suit PAS une correction du 25', E.CAVE_VENDANGE.clients[0].poids_caisse_kg, 12);

// ── 6. La seconde passe : 12 → 10, et la récolte legacy ────────────────────
M._set('vpc', { mil:2026, ancien:12, nouveau:10, defaut:true, clients:true });
M._vpcAppliquer();
T('la part client passe à 10 kg',        R('r1').parts[1].pck, 10);
T('★ la part domaine déjà corrigée ne rebouge pas', R('r1').parts[0].pck, 20);
T('★★ la récolte legacy a reçu un parts[] EN DUR', (Array.isArray(R('r3').parts) && R('r3').parts.length) || 0, 1);
T('★★ ...et il porte le nouveau poids',  ((R('r3').parts||[])[0]||{}).pck, 10);
T('★★ ...et le client, sinon le bon perd son destinataire', ((R('r3').parts||[])[0]||{}).client, 'Maison Bouchard');
T('legacy : 10 caisses × 10 kg',         M._recKg(R('r3')), 100);
T('r1 : 800 + 300 = 1 100 kg',           M._recKg(R('r1')), 1100);
T('★ rendement_hist de la legacy écrit', H('Le Clos','r3').kg, 100);
T('★ le défaut ne bouge pas (il vaut 20, pas 12)', E.CAVE_VENDANGE.config.poids_caisse_kg, 20);
T('★ la fiche client suit 12 → 10',      E.CAVE_VENDANGE.clients[0].poids_caisse_kg, 10);

// ── 7. Les refus et les cas limites ────────────────────────────────────────
poser();
M._set('vpc', { mil:2026, ancien:25, nouveau:25, defaut:true, clients:true });
M._vpcAppliquer();
T('même poids : rien n\'est écrit',      M._etat().j.saves, 0);
M._set('vpc', { mil:2026, ancien:99, nouveau:20, defaut:true, clients:true });
M._vpcAppliquer();
T('poids absent : rien n\'est écrit',    M._etat().j.saves, 0);
T('...et l\'écran le dit',               M._etat().j.toasts.length, 1);
M._set('vpc', { mil:2026, ancien:25, nouveau:0, defaut:true, clients:true });
M._vpcAppliquer();
T('poids nul refusé',                    M._etat().j.saves, 0);

// ── 8. Le lot d'écritures rend la main même sur exception ──────────────────
poser();
let leve = false;
try { M._vendParcLot(function(){ M._vendSaveParcelles(); throw new Error('boum'); }); }
catch(e){ leve = true; }
T('l\'exception ressort du lot',          leve, true);
T('★★ ...et l\'écriture en attente est quand même partie', M._etat().j.saves, 1);
M._vendSaveParcelles();
T('★★ ...et les écritures suivantes ne sont PAS muettes', M._etat().j.saves, 2);

// ── 9. Les deux autres écrans qui écrivent des kilos (contrôles mécaniques) ─
T('★★ le retour de livraison prévient la parcelle',
  /_vendRecordRendement\(x\.rec\s*,/.test(corpsT('_vendRetSave')), true);
const BC = sansCom(corpsT('_bcDoc'));
T('★★ le bilan de campagne ne repèse plus les caisses en dur',
  /nb_caisses\s*\|\|\s*0\)\s*\*\s*25/.test(BC), false);
T('★ ...il lit le poids de chaque apport', /var kg = _recKg\(r\);/.test(BC), true);
T('★ le repli mort sur window._recKg a disparu', sansCom(TEXTE).includes('window._recKg'), false);

console.log('\n' + (ko ? ko + ' ASSERTION(S) ROUGE(S) sur ' + n : 'TOUT VERT — ' + n + ' assertions'));
process.exit(ko ? 1 : 0);
