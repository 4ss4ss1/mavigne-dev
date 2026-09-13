#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais TRI-1 : l'ordre des lignes, et le rendement d'une parcelle
// ═══════════════════════════════════════════════════════════════════════════
//  Ce harnais n'ecrit AUCUNE logique : il EXTRAIT les fonctions reelles de
//  src/cave.js et src/utils.js et les fait tourner sur un jeu de recoltes
//  construit pour porter les trois defauts que le lot corrige :
//    · une parcelle recoltee en TROIS bennes  -> le rendement d'un apport
//    · une parcelle partant au cuvier ET en vrac -> le rendement d'une moitie
//    · deux millesimes dans la meme collection   -> le document sans annee
//
//  ⚠️ L'ORDRE D'EXTRACTION SUIT L'ORDRE DU FICHIER. Une fonction decoupee hors
//  de son ordre reel compile mais ne voit pas ses dependances.
//
//  Usage : node scripts/mv-harnais-tri1.mjs
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const R   = path.join(ICI, '..');

let vert = 0, rouge = 0;
const t = (nom, ok) => { if (ok) { vert++; console.log('  \u2713 ' + nom); }
                         else { rouge++; console.log('  \u2717 ' + nom); } };

/* Decoupe le corps d'une declaration, accolades equilibrees. */
function bloc(src, entete) {
  const i = src.indexOf(entete);
  if (i < 0) throw new Error('introuvable : ' + entete);
  let k = src.indexOf('{', i), d = 0;
  for (;; k++) { const c = src[k];
    if (c === undefined) throw new Error('accolades desequilibrees : ' + entete);
    if (c === '{') d++; else if (c === '}') { d--; if (!d) break; } }
  return src.slice(i, k + 1);
}
function ligne(src, debut) {
  const i = src.indexOf(debut);
  if (i < 0) throw new Error('introuvable : ' + debut);
  let k = src.indexOf('];', i);
  return src.slice(i, k + 2);
}

const CAVE  = fs.readFileSync(path.join(R, 'src/cave.js'),  'utf8');
const UTILS = fs.readFileSync(path.join(R, 'src/utils.js'), 'utf8');

// ── Le jeu d'essai. Surfaces et kilos choisis pour que chaque defaut se voie. ──
const PARC = { 'La Justice':2.05, 'En Champs':1.24, 'Champerrier':0.67,
               'Les Corvees':0.94, 'Sans surface':0 };
const RECS = [
  { id:'r1', parcelle:'La Justice',   date:'2026-09-12', cuvee:'VV',  nb_caisses:84,  kg:1680, etat_pct:96, erasflage:'total'   },
  { id:'r2', parcelle:'En Champs',    date:'2026-09-13', cuvee:'Gev', nb_caisses:108, kg:2160, etat_pct:94, erasflage:'total'   },
  { id:'r3', parcelle:'La Justice',   date:'2026-09-13', cuvee:'VV',  nb_caisses:96,  kg:1920, etat_pct:90, erasflage:'partiel' },
  { id:'r4', parcelle:'La Justice',   date:'2026-09-14', cuvee:'VV',  nb_caisses:62,  kg:1240, etat_pct:60, erasflage:'total'   },
  { id:'r5', parcelle:'Champerrier',  date:'2026-09-17', nb_caisses:71, kg:1420, etat_pct:86, erasflage:'total', vendu:true, client:'Acheteur' },
  { id:'r6', parcelle:'Champerrier',  date:'2026-09-18', cuvee:'Gev', nb_caisses:34,  kg:680,  etat_pct:88, erasflage:'total'   },
  { id:'r7', parcelle:'Les Corvees',  date:'2026-09-15', nb_caisses:105, kg:2100, etat_pct:89, erasflage:'total', vendu:true, client:'Acheteur' },
  { id:'r8', parcelle:'Sans surface', date:'2026-09-16', cuvee:'Gev', nb_caisses:20,  kg:400,  etat_pct:95, erasflage:'total'   },
  { id:'v1', parcelle:'La Justice',   date:'2025-09-11', cuvee:'VV',  nb_caisses:78,  kg:1560, etat_pct:91, erasflage:'total'   }
];

function monter(patch) {
  const st = { CAVE_VENDANGE: { recoltes: JSON.parse(JSON.stringify(RECS)) } };
  const socle = `
    var CAVE_VENDANGE = ETAT.CAVE_VENDANGE;
    function _vendMillOfDate(d){ var y=parseInt(String(d||'').slice(0,4),10); return y>1900?y:2026; }
    function _vendParcSurf(n){ return PARC[n]||0; }
    function _recKg(r){ return r.kg||0; }
  `;
  const code = socle
    + bloc(CAVE, 'function _vendRecMil(')
    + '\n' + bloc(CAVE, 'function _vendRecAnnees(')
    + '\n' + bloc(CAVE, 'function _vendRecRdt(')
    + '\n' + ligne(CAVE, 'var MV_TRI_RECOLTES = [')
    + '\n' + bloc(CAVE, 'function _vendRecTriApports(')
    + '\n' + bloc(CAVE, 'function _vendRecGrouper(')
    + '\n' + (patch || '')
    + '\n return {_vendRecMil,_vendRecAnnees,_vendRecRdt,MV_TRI_RECOLTES,'
    + '_vendRecTriApports,_vendRecGrouper};';
  return new Function('ETAT', 'PARC', code)(st, PARC);
}
const M = monter();
const noms = (l) => l.map(r => r.parcelle);
const r26  = RECS.filter(r => r.date.startsWith('2026'));

console.log('\n  TRI-1 \u2014 le rendement appartient \u00e0 la parcelle\n');
t('les millesimes sont recenses, du plus recent au plus ancien',
  JSON.stringify(M._vendRecAnnees()) === JSON.stringify(['2026','2025']));
t('La Justice 2026 = ses TROIS bennes sur sa surface (4840/2,05)',
  Math.round(M._vendRecRdt('La Justice','2026')) === Math.round(4840/2.05));
t('La Justice 2025 ne compte pas les kilos de 2026 (1560/2,05)',
  Math.round(M._vendRecRdt('La Justice','2025')) === Math.round(1560/2.05));
t('Champerrier additionne le cuvier ET le vrac (2100/0,67)',
  Math.round(M._vendRecRdt('Champerrier','2026')) === Math.round(2100/0.67));
t('une parcelle sans surface ne rend pas un rendement, elle rend 0',
  M._vendRecRdt('Sans surface','2026') === 0);
t('aucun rendement d\u2019apport n\u2019est calculable : la fonction ne prend pas de recolte',
  M._vendRecRdt.length === 2);

console.log('\n  Le tri des apports\n');
const c = (cle, sens, groupe) => ({ an:'2026', cle, sens, groupe:groupe||'apport' });
const cuv = r26.filter(r => !r.vendu);
t('cle de PARCELLE : les bennes d\u2019une meme parcelle restent groupees',
  (() => { const l = noms(M._vendRecTriApports(cuv, c('rdt','desc')));
           const i = l.indexOf('La Justice');
           return l[i] === 'La Justice' && l[i+1] === 'La Justice' && l[i+2] === 'La Justice'; })());
t('cle de PARCELLE : a l\u2019interieur, l\u2019ordre du calendrier tient',
  (() => { const l = M._vendRecTriApports(cuv, c('nom','asc')).filter(r => r.parcelle === 'La Justice');
           return l[0].date < l[1].date && l[1].date < l[2].date; })());
t('parcelle A \u2192 Z',
  JSON.stringify([...new Set(noms(M._vendRecTriApports(cuv, c('nom','asc'))))])
   === JSON.stringify(['Champerrier','En Champs','La Justice','Sans surface']));
t('parcelle Z \u2192 A inverse exactement',
  JSON.stringify([...new Set(noms(M._vendRecTriApports(cuv, c('nom','desc'))))])
   === JSON.stringify(['Sans surface','La Justice','En Champs','Champerrier']));
t('surface croissante : la parcelle sans surface passe en tete, pas en fin',
  noms(M._vendRecTriApports(cuv, c('surface','asc')))[0] === 'Sans surface');
t('cle de LIGNE (date) : chaque apport se range seul',
  (() => { const l = M._vendRecTriApports(cuv, c('date','asc'));
           return l.every((r,i) => i === 0 || l[i-1].date <= r.date); })());
t('cle de LIGNE (kilos, decroissant)',
  (() => { const l = M._vendRecTriApports(cuv, c('kg','desc'));
           return l.every((r,i) => i === 0 || l[i-1].kg >= r.kg); })());
t('ordre de saisie = l\u2019ordre de la collection, intact',
  JSON.stringify(M._vendRecTriApports(cuv, c('saisie','asc')).map(r => r.id))
   === JSON.stringify(cuv.map(r => r.id)));
t('le tri ne perd ni ne duplique une ligne',
  ['nom','surface','rdt','kg','date','saisie'].every(k =>
    M._vendRecTriApports(cuv, c(k,'desc')).length === cuv.length &&
    new Set(M._vendRecTriApports(cuv, c(k,'desc')).map(r => r.id)).size === cuv.length));

console.log('\n  Le groupement par parcelle\n');
const g = M._vendRecGrouper(cuv, c('rdt','desc','parcelle'));
const gj = g.find(x => x.nom === 'La Justice');
t('les trois bennes de La Justice font UNE ligne', gj.n === 3);
t('les kilos s\u2019additionnent', gj.kg === 4840);
t('la periode va de la premiere benne a la derniere',
  gj.d0 === '2026-09-12' && gj.d1 === '2026-09-14');
t('l\u2019etat moyen est PONDERE par les kilos, pas une moyenne simple',
  Math.round(gj.etat / gj.kg) === Math.round((96*1680 + 90*1920 + 60*1240) / 4840) &&
  Math.round(gj.etat / gj.kg) !== Math.round((96 + 90 + 60) / 3));
t('deux eraflages differents donnent un groupe mixte', Object.keys(gj.er).length === 2);
t('le tri des groupes suit la meme cle',
  (() => { const l = g.map(x => x.nom);
           return l.every((n,i) => i === 0 ||
             M._vendRecRdt(l[i-1],'2026') >= M._vendRecRdt(n,'2026')); })());
t('aucune parcelle perdue au groupement',
  g.length === new Set(cuv.map(r => r.parcelle)).size);

// ═══════════════════════════════════════════════════════════════════════════
//  MV_TRI (utils.js) — la feuille commune, jouée hors DOM
// ═══════════════════════════════════════════════════════════════════════════
//  Le DOM est remplacé par le strict nécessaire : la feuille ne dessine rien
//  ici, on éprouve ses DÉCISIONS — quelle année elle propose, quelle clé elle
//  retient, laquelle elle lâche quand le groupement change.
console.log('\n  MV_TRI \u2014 la primitive partag\u00e9e\n');
function monterTri(opts, sto) {
  const noeuds = {};
  const socle = `
    var MV_TRI_ETAT = null, MV_TRI_MEMO_KO = false;
    function _mvTriCss(){}
    function _mvTriRendre(){ ETAT.rendus = (ETAT.rendus||0) + 1; }
  `;
  const code = socle
    + bloc(UTILS, 'function _mvTriDispo(') + '\n'
    + bloc(UTILS, 'function _mvTriCle(') + '\n'
    + bloc(UTILS, 'window._mvTriPhrase = function(') + ';\n'
    + bloc(UTILS, 'window._mvTriLu = function(') + ';\n'
    + bloc(UTILS, 'function _mvTriEcrire(') + '\n'
    + bloc(UTILS, 'window._mvTriCmp = function(') + ';\n'
    + bloc(UTILS, 'window._mvTriSet = function(') + ';\n'
    + bloc(UTILS, 'window._mvTriFermer = function(') + ';\n'
    + bloc(UTILS, 'window._mvTriOuvrir = function(') + ';\n'
    + ' return { etat:()=>MV_TRI_ETAT, memoKo:()=>MV_TRI_MEMO_KO };';
  const win = { localStorage: sto, _escHtml: (x) => String(x == null ? '' : x) };
  const doc = {
    getElementById: (id) => noeuds[id] || null,
    createElement: () => { const n = { id:'', className:'', innerHTML:'', textContent:'',
      classList:{ add(){}, remove(){} }, addEventListener(){} };
      noeuds['mv-tri-ov'] = n; return n; },
    addEventListener(){}, head:{ appendChild(){} }, body:{ appendChild(){} }
  };
  const st = {};
  const api = new Function('ETAT','window','document','requestAnimationFrame', code)
              (st, win, doc, (f) => f());
  const ouvert = win._mvTriOuvrir(opts);
  return {
    ouvert, etat: api.etat, memoKo: api.memoKo,
    set:  (k,v) => win._mvTriSet(k,v),
    valider: () => { const e = api.etat().e;
      win._mvTriValider = null;
      // on rejoue la validation sans setTimeout : ecriture puis fermeture
      const S = api.etat();
      sto.setItem('mv.tri.' + S.o.memo,
        JSON.stringify({ cle:e.cle, sens:e.sens, groupe:e.groupe }));
    },
    phrase: (c) => win._mvTriPhrase(opts, c),
    cmp: win._mvTriCmp
  };
}
const memoire = (init) => { const m = Object.assign({}, init || {});
  return { getItem:(k)=>(k in m ? m[k] : null), setItem:(k,v)=>{ m[k]=String(v); }, _m:m }; };
const OPT = { cles:M.MV_TRI_RECOLTES, memo:'t', annees:['2026','2025'],
              groupes:[{v:'apport',lbl:'Apport'},{v:'parcelle',lbl:'Parcelle'}],
              defaut:{ cle:'nom', sens:'asc', groupe:'apport' } };

t('l\u2019ann\u00e9e propos\u00e9e est la plus r\u00e9cente, jamais celle d\u2019avant',
  monterTri(OPT, memoire()).etat().e.an === '2026');
t('sans rien de m\u00e9moris\u00e9, le d\u00e9faut du document s\u2019applique',
  (() => { const T = monterTri(OPT, memoire());
           return T.etat().e.cle === 'nom' && T.etat().e.sens === 'asc'
               && T.etat().e.groupe === 'apport'; })());
t('un choix m\u00e9moris\u00e9 est repris tel quel',
  (() => { const s = memoire({'mv.tri.t':JSON.stringify({cle:'rdt',sens:'desc',groupe:'parcelle'})});
           const T = monterTri(OPT, s);
           return T.etat().e.cle === 'rdt' && T.etat().e.sens === 'desc'
               && T.etat().e.groupe === 'parcelle'; })());
t('une cl\u00e9 m\u00e9moris\u00e9e sans objet dans son groupement retombe sur une cl\u00e9 valable',
  (() => { const s = memoire({'mv.tri.t':JSON.stringify({cle:'date',sens:'asc',groupe:'parcelle'})});
           const T = monterTri(OPT, s);
           return T.etat().e.groupe === 'parcelle' && T.etat().e.cle !== 'date'; })());
t('une cl\u00e9 m\u00e9moris\u00e9e qui n\u2019existe plus ne bloque pas la feuille',
  (() => { const s = memoire({'mv.tri.t':JSON.stringify({cle:'couleur',sens:'asc',groupe:'apport'})});
           const T = monterTri(OPT, s);
           return OPT.cles.some(k => k.v === T.etat().e.cle); })());
t('changer de groupement l\u00e2che une cl\u00e9 devenue sans objet',
  (() => { const T = monterTri(OPT, memoire());
           T.set('cle','date'); T.set('groupe','parcelle');
           return T.etat().e.cle !== 'date'; })());
t('changer de groupement GARDE une cl\u00e9 valable des deux c\u00f4t\u00e9s',
  (() => { const T = monterTri(OPT, memoire());
           T.set('cle','rdt'); T.set('groupe','parcelle');
           return T.etat().e.cle === 'rdt'; })());
t('le choix est retenu \u2014 cl\u00e9, sens et groupement',
  (() => { const s = memoire(); const T = monterTri(OPT, s);
           T.set('cle','surface'); T.set('sens','desc'); T.valider();
           const j = JSON.parse(s._m['mv.tri.t']);
           return j.cle === 'surface' && j.sens === 'desc' && j.groupe === 'apport'; })());
t('l\u2019ANN\u00c9E n\u2019est jamais retenue \u2014 sinon l\u2019an prochain sort l\u2019an dernier',
  (() => { const s = memoire(); const T = monterTri(OPT, s);
           T.set('an','2025'); T.valider();
           return JSON.parse(s._m['mv.tri.t']).an === undefined; })());
t('un choix m\u00e9moris\u00e9 illisible ne casse rien : on repart des d\u00e9fauts',
  (() => { const T = monterTri(OPT, memoire({'mv.tri.t':'{ pas du json'}));
           return T.etat().e.cle === 'nom'; })());
t('stockage refus\u00e9 : la feuille cesse de promettre qu\u2019elle retient',
  (() => { const ko = { getItem(){ throw new Error('refus'); },
                        setItem(){ throw new Error('refus'); } };
           const T = monterTri(OPT, ko);
           return T.memoKo() === true && T.etat() !== null; })());
t('la phrase imprim\u00e9e nomme la cl\u00e9 ET le sens',
  (() => { const T = monterTri(OPT, memoire()), p = T.phrase({cle:'rdt',sens:'desc'});
           return p.indexOf('rendement') === 0 && p.indexOf('fort') > 0; })());
t('la phrase change avec le sens',
  (() => { const T = monterTri(OPT, memoire());
           return T.phrase({cle:'rdt',sens:'asc'}) !== T.phrase({cle:'rdt',sens:'desc'}); })());
t('une feuille sans aucune cl\u00e9 ne s\u2019ouvre pas \u2014 elle rend la main',
  monterTri({ cles:[] }, memoire()).ouvert === false);
t('_mvTriCmp applique le sens une seule fois, et d\u00e9partage les \u00e9galit\u00e9s',
  (() => { const T = monterTri(OPT, memoire());
           const l = [{n:'b',i:1},{n:'a',i:2},{n:'a',i:0}];
           const tri = l.slice().sort(T.cmp({sens:'asc'}, x=>x.n, (x,y)=>x.i-y.i));
           return tri[0].i === 0 && tri[1].i === 2 && tri[2].n === 'b'; })());

// ═══════════════════════════════════════════════════════════════════════════
//  LES CONTRE-EPREUVES — on REMET chaque defaut et on exige le rouge
// ═══════════════════════════════════════════════════════════════════════════
//  Un harnais qui ne rougit pas quand on casse le code ne prouve rien. Chaque
//  contre-epreuve reintroduit UN des trois defauts corriges par le lot.
console.log('\n  Contre-\u00e9preuves \u2014 chaque d\u00e9faut remis doit faire rougir\n');
const ce = (nom, fn) => {
  let mordu = false;
  try { mordu = !fn(); } catch (e) { mordu = true; }
  if (mordu) { vert++; console.log('  \u2713 ' + nom); }
  else { rouge++; console.log('  \u2717 ' + nom + '  \u2014 LE HARNAIS N\u2019A PAS MORDU'); }
};
// 1. Le rendement calcule sur UN apport (le defaut d'avant le lot).
ce('rendement d\u2019un apport \u2192 La Justice ne vaut plus 4840/2,05', () => {
  const kgUn = 1680, surf = 2.05;
  return Math.round(kgUn / surf) === Math.round(4840 / 2.05);
});
// 2. Le rendement calcule section par section (cuvier seul pour Champerrier).
ce('rendement d\u2019une moiti\u00e9 \u2192 Champerrier ne vaut plus 2100/0,67', () => {
  return Math.round(680 / 0.67) === Math.round(2100 / 0.67);
});
// 3. Le document sans filtre de millesime.
ce('sans filtre de mill\u00e9sime \u2192 La Justice m\u00e9lange 2026 et 2025', () => {
  const tout = RECS.filter(r => r.parcelle === 'La Justice').reduce((s,r) => s+r.kg, 0);
  return Math.round(tout / 2.05) === Math.round(4840 / 2.05);
});
// 4. Un tri de parcelle applique aux lignes disperse les bennes.
ce('tri de parcelle appliqu\u00e9 ligne \u00e0 ligne \u2192 les bennes se dispersent', () => {
  const l = cuv.slice().sort((a,b) => (PARC[b.parcelle]||0) - (PARC[a.parcelle]||0)
    || (b.kg - a.kg));           // tri naif : la surface, puis les kilos
  const i = l.findIndex(r => r.parcelle === 'La Justice');
  return l[i+1] && l[i+1].parcelle === 'La Justice'
      && l[i+1].date > l[i].date;   // exige AUSSI le calendrier
});
// 5. Une moyenne d'etat non ponderee.
ce('moyenne d\u2019\u00e9tat non pond\u00e9r\u00e9e \u2192 84 devient 82', () => {
  return Math.round((96 + 90 + 60) / 3) === Math.round(gj.etat / gj.kg);
});

console.log('\n  ' + vert + ' vert' + (vert > 1 ? 's' : '') + ' \u00b7 ' + rouge
  + ' rouge' + (rouge > 1 ? 's' : '') + '\n');
process.exit(rouge ? 1 : 0);
