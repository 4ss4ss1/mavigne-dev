#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : « ENCORE SUR PIED » (lot CUV-4)
// ═══════════════════════════════════════════════════════════════════════════
//  ★★★ POURQUOI CE HARNAIS EXISTE.
//  L'écran répond à « qu'est-ce qu'il reste à rentrer ». Il n'a qu'une façon de
//  se tromper, mais elle est grave dans les deux sens :
//
//   1. RÉCLAMER UNE PARCELLE DÉJÀ RENTRÉE. Le champ parcelle d'une récolte
//      redevient LIBRE quand aucune parcelle n'est enregistrée : « les grandes
//      vignes » saisi à la main ne rejoint pas « Les Grandes Vignes » du
//      parcellaire si la comparaison porte sur le nom brut. On envoie alors
//      quelqu'un vendanger une parcelle vide.
//
//   2. OUBLIER UNE PARCELLE. Une parcelle sans surface renseignée était
//      écartée en silence par l'ancien _mlResteARentrer ; une parcelle ARRACHÉE
//      y figurait au contraire comme « encore sur pied ».
//
//  Le harnais EXÉCUTE les fonctions extraites de src/cave.js et src/utils.js.
//  Il ne cherche aucun motif de texte : un contrôle qui lit du texte aurait dit
//  vert sur les deux défauts ci-dessus.
//
//  ⚠️ LES CONTRE-ÉPREUVES SONT INDIVIDUELLES. Réintroduire les cinq défauts
//  d'un coup et constater « c'est rouge » ne prouve rien : chaque sabotage doit
//  faire rougir L'ASSERTION QUI LE VISE, et elle seule ne suffit pas — on exige
//  aussi qu'il ne rougisse pas tout le reste par accident (§55).
//
//  Usage :
//    node scripts/mv-harnais-reste-a-rentrer.mjs
//    node scripts/mv-harnais-reste-a-rentrer.mjs --contre
//  Exit 0 si tout passe, 1 sinon. Un CRASH est ROUGE.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sourceDates, poseDates } from './mv-dates-reelles.mjs';
/* fileURLToPath, jamais new URL().pathname : celui-ci rend « /C:/Users/… »
   sous Windows et Node le repart en « C:\C:\Users\… » (§53). */
const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const CONTRE = process.argv.slice(2).includes('--contre');

const CAVE  = fs.readFileSync(path.join(RACINE, 'src', 'cave.js'), 'utf8');
const UTILS = fs.readFileSync(path.join(RACINE, 'src', 'utils.js'), 'utf8');

/* Extraction par comptage d'accolades : la fonction telle qu'elle est écrite
   dans le module, pas une copie qui dériverait. */
function corps(src, nom){
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) return null;
  let n = 0, j = src.indexOf('{', i);
  for (; j < src.length; j++){
    if (src[j] === '{') n++;
    else if (src[j] === '}'){ n--; if (n === 0) break; }
  }
  return src.slice(i, j + 1);
}

const DE_CAVE  = ['_matNorm','_anaSpd','_matSuc','_matJours','_mvF1',
                  '_vendResteCle','_vendResteActives','_vendResteCmp','_vendResteARentrer',
                  '_vendResteVal','_vendResteHtml','_vendResteToggle','_mlResteARentrer'];
const DE_UTILS = ['_escHtml','_escAttr'];

const absents = DE_CAVE.filter(n => !corps(CAVE, n)).map(n => 'cave.js:' + n)
  .concat(DE_UTILS.filter(n => !corps(UTILS, n)).map(n => 'utils.js:' + n));
if (absents.length){
  console.error('ROUGE — fonctions introuvables : ' + absents.join(', '));
  process.exit(1);
}

/* Les deux variables de module sont RELUES dans la source, pas recopiées : un
   harnais qui fige un seuil cesse de décrire l'écran dès qu'on le change. */
function varDeModule(nom){
  const m = CAVE.match(new RegExp('^var\\s+' + nom + '\\s*=\\s*([^;]+);', 'm'));
  if (!m) throw new Error('variable de module introuvable : ' + nom);
  return 'var ' + nom + ' = ' + m[1].trim() + ';';
}
const ETAT = [varDeModule('_vendResteOuv'), varDeModule('_VEND_RESTE_MAX')].join('\n');

/* Les seules dépendances hors périmètre : pilotées par le harnais. */
const PRELUDE = `
${sourceDates()}
var window = CTX.window;
var CAVE_VENDANGE = CTX.CAVE_VENDANGE;
function _vendCfg(){ return CTX.cfg; }
function _mlCampagne(){ return CTX.campagne; }
function canWrite(){ return CTX.canWrite; }
function _mvIcon(n,t){ return '<svg data-ic="'+n+'"></svg>'; }
function renderVendRec(){ CTX.rendus++; }
`;

function construire(sabotages){
  let code = PRELUDE + ETAT + '\n'
    + DE_UTILS.map(n => corps(UTILS, n)).join('\n') + '\n'
    + DE_CAVE.map(n => corps(CAVE, n)).join('\n')
    + '\nreturn {' + DE_CAVE.concat(DE_UTILS).join(',') + '};';
  for (const s of (sabotages || [])){
    if (!code.includes(s.old))
      throw new Error('SABOTAGE IMPOSSIBLE (' + s.id + ') : ancre absente. '
        + 'La contre-épreuve ne prouve plus rien — corriger le harnais, pas le code.');
    code = code.replace(s.old, s.new);
  }
  // eslint-disable-next-line no-new-func
  return new Function('CTX', code);
}

/* ── Le décor. Toutes les dates sont relatives à aujourd'hui : un harnais qui
   fige une année devient faux le 1er janvier. ───────────────────────────── */
const J = 86400000;
const iso = ms => new Date(ms).toISOString().slice(0, 10);
const BASE = Date.now() - 3 * J;          // il y a trois jours
const CAMP = Number(iso(BASE).slice(0, 4));

function contexte(){
  return {
    campagne: CAMP,
    canWrite: true,
    rendus: 0,
    cfg: { sucre_par_degre: 16.83 },
    window: { PARCELLES: [
      { nom:'Les Grandes Vignes', surface:'0.42', cepages:['Pinot noir'] },
      /* ⚠️ « Aux Combottes » n'est pas décoratif : jamais analysée ET premier
         dans l'alphabet. Sans elle, supprimer la ligne qui range les mesurées
         avant les autres ne déplaçait RIEN dans ce décor — la contre-épreuve D4
         restait muette et l'assertion A6 ne prouvait rien. */
      { nom:'Aux Combottes',      surface:'0.55', cepages:['Pinot noir'] },
      { nom:'Le Clos',            surface:'1.10', cepage:'Pinot noir' },
      { nom:'Combe Brûlée',       surface:'0.26', cepages:['Chardonnay'] },
      { nom:'Sans Surface',       surface:'',     cepages:[] },
      { nom:"L'Ormeau",           surface:'0.31', cepages:['Aligoté'] },
      { nom:'Vieille Vigne',      surface:'0.80', statut:'Arrachee' }
    ] },
    CAVE_VENDANGE: {
      recoltes: [
        // casse et accents différents du parcellaire : c'est bien la MÊME parcelle
        { id:'r1', parcelle:'les grandes vignes', date:iso(BASE), nb_caisses:40 },
        // campagne précédente : ne rentre RIEN pour celle-ci
        { id:'r2', parcelle:'Le Clos', date:(CAMP - 1) + '-09-14', nb_caisses:60 },
        // nom absent du parcellaire : ne rentre aucune parcelle de la liste
        { id:'r3', parcelle:'Parcelle Fantôme', date:iso(BASE), nb_caisses:12 }
      ],
      analyses: [
        { id:'a1', parcelle:'Combe Brûlée', date:iso(BASE),        mode:'suc', val:198, spd:16.83 },
        { id:'a2', parcelle:'Le Clos',      date:iso(Date.now()),  mode:'alc', val:12.2, spd:16.83 },
        // analyse de la campagne précédente : ne doit pas remonter
        { id:'a3', parcelle:"L'Ormeau",     date:(CAMP - 1) + '-09-10', mode:'suc', val:230, spd:16.83 }
      ]
    }
  };
}

/* ── Les assertions. Chacune porte un identifiant : c'est lui que les
   contre-épreuves désignent. ─────────────────────────────────────────────── */
function passer(sabotages, muet){
  const rouges = [];
  let n = 0;
  const T = (id, titre, obtenu, attendu) => {
    n++;
    const ok = String(obtenu) === String(attendu);
    if (!ok) rouges.push(id);
    if (!muet) console.log((ok ? '  OK  ' : '  KO  ') + id.padEnd(5) + titre
      + ' → ' + obtenu + (ok ? '' : '   [attendu ' + attendu + ']'));
  };

  let M, CTX;
  try {
    CTX = contexte();
    M = construire(sabotages)(CTX);
  } catch (e) {
    if (!muet) console.log('  KO  CRASH à la construction — ' + e.message);
    return { rouges:['CRASH'], n:1 };
  }

  try {
    const r    = M._vendResteARentrer(CAMP);
    const noms = r.lignes.map(e => e.nom);

    T('A1', 'nom normalisé : la parcelle rentrée sort de la liste',
      noms.includes('Les Grandes Vignes'), false);
    T('A2', 'une parcelle ARRACHÉE n’est pas « sur pied »',
      noms.includes('Vieille Vigne'), false);
    T('A3', 'une parcelle SANS SURFACE reste dans la liste',
      noms.includes('Sans Surface'), true);
    T('A4', 'une récolte de la campagne précédente ne rentre rien',
      noms.includes('Le Clos'), true);
    T('A5', 'nom hors parcellaire signalé', r.inconnues.join('|'), 'Parcelle Fantôme');
    T('A6', 'ordre : la plus mûre en premier, jamais mesurées ensuite',
      noms.join(' > '), "Le Clos > Combe Brûlée > Aux Combottes > L'Ormeau > Sans Surface");
    T('A7', '5 parcelles encore sur pied', r.lignes.length, 5);

    const clos = r.lignes.find(e => e.nom === 'Le Clos');
    const orm  = r.lignes.find(e => e.nom === "L'Ormeau");
    T('A8', 'analyse d’une campagne passée ignorée', orm.suc, 'null');
    T('A9', 'âge de la dernière analyse', clos.jours, 0);
    T('A10', 'degré converti en sucre pour le classement',
      Math.round(clos.suc), Math.round(12.2 * 16.83));

    /* L'unité affichée suit le MODE de la mesure, pas un réglage d'affichage. */
    T('A11', 'une mesure en degré s’affiche en %vol',
      /12,2<span class="u">%vol<\/span>/.test(M._vendResteVal(clos)), true);
    T('A12', 'une mesure en sucre s’affiche en g/L',
      /198<span class="u">g\/L<\/span>/.test(M._vendResteVal(r.lignes[1])), true);

    /* Le millésime et Le Cuvier lisent la même règle. */
    const ml = M._mlResteARentrer(CAMP).map(p => p.nom);
    T('A13', 'Le millésime rend les mêmes parcelles', ml.join('|'), noms.join('|'));
    T('A14', 'Le millésime ne répond que sur la campagne en cours',
      M._mlResteARentrer(CAMP - 1).length, 0);

    /* L'écran. */
    const h = M._vendResteHtml();
    T('A15', 'le nom part dans un slot onclick échappé pour JS',
      h.includes(`onclick="openOvVendRec(null,'L\\'Ormeau')"`), true);
    /* ⚠️ Chercher « &#39; » dans TOUTE la page est une assertion qui ment : le
       texte visible en contient légitimement (_escHtml). On ne lit que les
       slots onclick, et on exige d'en avoir trouvé — sinon elle passerait à
       vide, ce qui est le pire des verts (§53). */
    const slots = h.match(/onclick="[^"]*"/g) || [];
    T('A16', 'aucune entité HTML dans un slot onclick (elle y serait pré-décodée)',
      (slots.length > 0) + '/' + slots.filter(x => x.includes('&#')).length, 'true/0');
    T('A17', 'le nom reste échappé dans le texte visible',
      h.includes('>L&#39;Ormeau<'), true);
    T('A18', 'la carte annonce le compte et la surface (1,10 + 0,26 + 0,55 + 0,31 + 0)',
      /<b>5<\/b>parcelle/.test(h) && h.includes('2,2 ha'), true);
    T('A19', 'le nom hors parcellaire est écrit sous la carte',
      h.includes('Parcelle Fantôme'), true);

    CTX.canWrite = false;
    const hr = M._vendResteHtml();
    T('A20', 'en lecture seule, aucun bouton qui mène nulle part',
      hr.includes('openOvVendRec'), false);
    CTX.canWrite = true;

    /* Tout rentré, et parcellaire vide. */
    const CT2 = contexte();
    CT2.CAVE_VENDANGE.recoltes = CT2.window.PARCELLES
      .filter(p => p.statut !== 'Arrachee')
      .map((p, i) => ({ id:'x' + i, parcelle:p.nom, date:iso(BASE), nb_caisses:10 }));
    const M2 = construire(sabotages)(CT2);
    T('A21', 'tout rentré : la carte le dit',
      M2._vendResteHtml().includes('Tout est rentré'), true);

    const CT3 = contexte();
    CT3.window.PARCELLES = [];
    T('A22', 'parcellaire vide : aucune carte plutôt qu’une carte vide',
      construire(sabotages)(CT3)._vendResteHtml(), '');

    /* Le repli / dépli est un état explicite, pas un calcul refait. */
    const CT4 = contexte();
    const M4 = construire(sabotages)(CT4);
    const h1 = M4._vendResteHtml();
    T('A23', '5 parcelles (≤ 8) : la carte s’ouvre d’elle-même', h1.includes('mvv-reste ouv'), true);
    M4._vendResteToggle();
    T('A24', 'le repli est pris en compte', M4._vendResteHtml().includes('mvv-reste ouv'), false);
    T('A25', 'et l’écran est bien redessiné', CT4.rendus, 1);

    /* ★ A26 — LA SEULE ASSERTION QUI VOIT LE DÉFAUT DE COMPARATEUR. L'ordre
       obtenu (A6) peut être JUSTE avec un comparateur qui se contredit : la
       coercition `null - 198` le sauve. On ne regarde donc pas le résultat, on
       regarde la RÈGLE : pour tout couple, cmp(a,b) et cmp(b,a) doivent être de
       signes opposés, et la transitivité doit tenir. Sinon la norme n'impose
       aucun résultat et le moteur fait ce qu'il veut. */
    const ech = [ { nom:'Aux Cheusots', suc:null }, { nom:'Bel Air', suc:212 },
                  { nom:'Champerrier', suc:null },  { nom:'Clos Prieur', suc:198 },
                  { nom:'La Justice', suc:null },   { nom:'Les Corvées', suc:212 } ];
    const sg = v => (v > 0) - (v < 0);
    let anti = 0, trans = 0;
    for (const a of ech) for (const b of ech){
      if (sg(M._vendResteCmp(a, b)) !== -sg(M._vendResteCmp(b, a))) anti++;
      for (const c of ech){
        if (sg(M._vendResteCmp(a, b)) <= 0 && sg(M._vendResteCmp(b, c)) <= 0
            && sg(M._vendResteCmp(a, c)) > 0) trans++;
      }
    }
    T('A26', 'comparateur cohérent : antisymétrie et transitivité sur 36 couples',
      anti + '/' + trans, '0/0');

  } catch (e) {
    if (!muet) console.log('  KO  CRASH pendant les assertions — ' + e.message);
    rouges.push('CRASH'); n++;
  }
  return { rouges, n };
}

/* ── Les cinq défauts que ce lot corrige, réintroduits un par un ─────────── */
const DEFAUTS = [
  { id:'D1', quoi:'comparaison sur le nom BRUT (plus de normalisation)',
    vise:'A1',
    s:[{ id:'D1', old:'function _vendResteCle(nom){ return _matNorm(nom); }',
                  new:'function _vendResteCle(nom){ return String(nom||""); }' }] },
  { id:'D2', quoi:'le statut de la parcelle n’est plus regardé',
    vise:'A2',
    s:[{ id:'D2', old:"p.statut!=='Arrachee'", new:'true' }] },
  { id:'D3', quoi:'une surface non renseignée écarte la parcelle',
    vise:'A3',
    s:[{ id:'D3', old:"return p && String(p.nom||'').trim() && p.statut!=='Arrachee';",
                  new:"return p && String(p.nom||'').trim() && p.statut!=='Arrachee' && (parseFloat(p.surface)||0)>0;" }] },
  { id:'D4', quoi:'le rang disparaît : la soustraction revoit un null (comparateur incohérent)',
    vise:'A26',
    s:[{ id:'D4', old:'if(mx!==my) return mx-my;', new:'' },
       { id:'D4b', old:'if(mx===0 && x.suc!==y.suc) return y.suc-x.suc;',
                   new:'if(x.suc!=null && x.suc!==y.suc) return y.suc-x.suc;' }] },
  { id:'D6', quoi:'classement alphabétique au lieu de la maturité',
    vise:'A6',
    s:[{ id:'D6', old:'  lignes.sort(_vendResteCmp);',
                  new:"  lignes.sort(function(x,y){ return x.nom.localeCompare(y.nom,'fr'); });" }] },
  { id:'D5', quoi:'_escHtml dans le slot onclick (défait par le décodage d’attribut)',
    vise:'A15',
    s:[{ id:'D5', old:"openOvVendRec(null,\\''+_escAttr(e.nom)+'\\')",
                  new:"openOvVendRec(null,\\''+_escHtml(e.nom)+'\\')" }] }
];

if (!CONTRE){
  console.log('\n  ENCORE SUR PIED — campagne de référence ' + CAMP + '\n');
  const { rouges, n } = passer(null, false);
  console.log('\n' + (rouges.length
    ? rouges.length + ' ASSERTION(S) ROUGE(S) sur ' + n + ' : ' + rouges.join(', ')
    : 'TOUT VERT — ' + n + ' assertions'));
  process.exit(rouges.length ? 1 : 0);
}

console.log('\n  CONTRE-ÉPREUVES — un défaut à la fois\n');
const temoin = passer(null, true);
let muettes = 0;
if (temoin.rouges.length){
  console.log('  ✗ le témoin n’est pas vert : ' + temoin.rouges.join(', '));
  muettes++;
}
for (const d of DEFAUTS){
  let res;
  try { res = passer(d.s, true); }
  catch (e){ console.log('  ✗ ' + d.id + ' — ' + e.message); muettes++; continue; }
  const vu    = res.rouges.includes(d.vise) || res.rouges.includes('CRASH');
  const bruit = res.rouges.filter(x => x !== d.vise && x !== 'CRASH'
    && !['A7','A13','A18','A21','A24'].includes(x));   // ceux-là bougent avec le nombre de lignes
  if (!vu){ muettes++; console.log('  ✗ ' + d.id + ' MUETTE — ' + d.quoi
    + ' : ' + d.vise + ' reste verte, l’assertion ne prouve rien.'); }
  else console.log('  ✓ ' + d.id + ' vue par ' + d.vise + ' — ' + d.quoi
    + (bruit.length ? '   (aussi : ' + bruit.join(', ') + ')' : ''));
}
console.log('\n' + (muettes
  ? '⚠️ ' + muettes + ' CONTRE-ÉPREUVE(S) MUETTE(S) : le harnais ne prouve pas ce qu’il annonce.'
  : 'CONTRE-ÉPREUVES CONCLUANTES — les ' + DEFAUTS.length + ' défauts sont vus, un par un.'));
process.exit(muettes ? 1 : 0);
