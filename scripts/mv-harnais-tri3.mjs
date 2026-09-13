#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais TRI-3 : maturité, cuverie, et la famille refermée
// ═══════════════════════════════════════════════════════════════════════════
//  Deux moteurs de tri à éprouver, et deux vérifications de STRUCTURE :
//    · `_matTrier` / `_cuvTrier` — dont le DÉFAUT doit rendre la liste reçue,
//      le même objet, sans départage ajouté ;
//    · les deux `openPrompt` d'année ont bien DISPARU (une feuille, pas deux
//      questions à la suite) ;
//    · les cinq documents qui posent une question passent tous par MV_TRI, et
//      les deux qui n'en posent pas le font pour la raison écrite en §121.
//
//  Usage : node scripts/mv-harnais-tri3.mjs
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const R   = path.join(ICI, '..');

let vert = 0, rouge = 0;
const t = (nom, ok) => { if (ok) { vert++; console.log('  \u2713 ' + nom); }
                         else { rouge++; console.log('  \u2717 ' + nom); } };
function bloc(src, entete) {
  const i = src.indexOf(entete);
  if (i < 0) throw new Error('introuvable : ' + entete);
  let k = src.indexOf('{', i), d = 0;
  for (;; k++) { const c = src[k];
    if (c === undefined) throw new Error('accolades desequilibrees : ' + entete);
    if (c === '{') d++; else if (c === '}') { d--; if (!d) break; } }
  return src.slice(i, k + 1);
}
function jusqua(src, debut, fin) {
  const i = src.indexOf(debut);
  if (i < 0) throw new Error('introuvable : ' + debut);
  return src.slice(i, src.indexOf(fin, i) + fin.length);
}
const CAVE = fs.readFileSync(path.join(R, 'src/cave.js'), 'utf8');
const REGL = fs.readFileSync(path.join(R, 'src/reglages.js'), 'utf8');

const M = new Function('PARC', `
  function _vendParcSurf(n){ return PARC[n]||0; }
  function _cuvJours(a, b){
    if(!a || !b) return null;
    return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
  }
  ${jusqua(CAVE, 'var MV_TRI_MATURITE = [', '];')}
  ${bloc(CAVE, 'function _matTrier(')}
  ${jusqua(CAVE, 'var MV_TRI_CUVERIE = [', '];')}
  ${bloc(CAVE, 'function _cuvTrier(')}
  return { _matTrier, _cuvTrier, MV_TRI_MATURITE, MV_TRI_CUVERIE };
`)({ 'La Justice':2.05, 'En Champs':1.24, 'Craipillot':0.31, 'Sans surface':0 });

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n  Le contr\u00f4le de maturit\u00e9\n');
// `_matClasse` rend deja du plus mur au moins mur : c'est l'entree du tri.
const RANGS = [
  { nom:'Craipillot',   suc:212, vit:2.4,  date:'2026-09-08' },
  { nom:'La Justice',   suc:198, vit:1.1,  date:'2026-09-09' },
  { nom:'En Champs',    suc:190, vit:null, date:'2026-09-05' },
  { nom:'Sans surface', suc:176, vit:0.4,  date:'2026-09-10' }
];
const c  = (cle, sens) => ({ cle, sens: sens || 'asc' });
const nm = l => l.map(x => x.nom);

t('le d\u00e9faut rend la liste re\u00e7ue \u2014 le m\u00eame objet, sans d\u00e9partage ajout\u00e9',
  M._matTrier(RANGS, c('maturite','desc')) === RANGS);
t('sans choix du tout, c\u2019est encore la liste re\u00e7ue',
  M._matTrier(RANGS) === RANGS && M._matTrier(RANGS, null) === RANGS);
t('maturit\u00e9 croissante = la liste \u00e0 l\u2019envers, pas un autre tri',
  JSON.stringify(nm(M._matTrier(RANGS, c('maturite','asc'))))
   === JSON.stringify(nm(RANGS).slice().reverse()));
t('parcelle A \u2192 Z',
  JSON.stringify(nm(M._matTrier(RANGS, c('nom'))))
   === JSON.stringify(['Craipillot','En Champs','La Justice','Sans surface']));
t('surface : la parcelle sans surface part en fin, dans les deux sens',
  nm(M._matTrier(RANGS, c('surface')))[3] === 'Sans surface' &&
  nm(M._matTrier(RANGS, c('surface','desc')))[3] === 'Sans surface');
t('vitesse : une parcelle \u00e0 un seul rel\u00e8vement n\u2019est pas la plus lente',
  nm(M._matTrier(RANGS, c('vitesse')))[3] === 'En Champs' &&
  nm(M._matTrier(RANGS, c('vitesse')))[0] === 'Sans surface');
t('dernier rel\u00e8vement, du plus r\u00e9cent au plus ancien',
  JSON.stringify(nm(M._matTrier(RANGS, c('releve','desc'))))
   === JSON.stringify(['Sans surface','La Justice','Craipillot','En Champs']));
t('aucune parcelle perdue, quelle que soit la cl\u00e9',
  M.MV_TRI_MATURITE.every(k => ['asc','desc'].every(s =>
    M._matTrier(RANGS, c(k.v, s)).length === RANGS.length)));
t('la liste source n\u2019est jamais modifi\u00e9e en place',
  (() => { const avant = nm(RANGS).join('|');
           M.MV_TRI_MATURITE.forEach(k => M._matTrier(RANGS, c(k.v,'desc')));
           return nm(RANGS).join('|') === avant; })());

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n  Le cahier de cuverie\n');
const CUVES = [                                   // deja triees par date_entree
  { nom:'Cuve 3',  volume_hl:42, date_entree:'2026-09-12', decuvage:{ date:'2026-09-26' }, mesures_fa:[] },
  { nom:'Cuve 12', volume_hl:18, date_entree:'2026-09-14', mesures_fa:[{ date:'2026-09-30' }] },
  { nom:'Cuve 1',  volume_hl:60, date_entree:'2026-09-16', mesures_fa:[] },   // encore en cuve
  { nom:'Cuve 7',  volume_hl:0,  date_entree:'2026-09-18', decuvage:{ date:'2026-10-10' }, mesures_fa:[] }
];
const cn = l => l.map(x => x.nom);
t('le d\u00e9faut rend la liste re\u00e7ue \u2014 l\u2019ordre de l\u2019encuvage',
  M._cuvTrier(CUVES, c('encuvage','asc')) === CUVES && M._cuvTrier(CUVES) === CUVES);
t('encuvage invers\u00e9 = la liste \u00e0 l\u2019envers',
  JSON.stringify(cn(M._cuvTrier(CUVES, c('encuvage','desc'))))
   === JSON.stringify(cn(CUVES).slice().reverse()));
t('cuve A \u2192 Z',
  JSON.stringify(cn(M._cuvTrier(CUVES, c('nom'))))
   === JSON.stringify(['Cuve 1','Cuve 12','Cuve 3','Cuve 7']));
t('volume : une cuve sans volume connu part en fin, pas en t\u00eate',
  cn(M._cuvTrier(CUVES, c('volume')))[3] === 'Cuve 7' &&
  cn(M._cuvTrier(CUVES, c('volume','desc')))[3] === 'Cuve 7');
t('cuvaison : une cuve ENCORE EN CUVE n\u2019a pas de dur\u00e9e, elle part en fin',
  cn(M._cuvTrier(CUVES, c('duree')))[3] === 'Cuve 1' &&
  cn(M._cuvTrier(CUVES, c('duree','desc')))[3] === 'Cuve 1');
t('cuvaison croissante : 14 j, puis 16 j, puis 22 j',
  JSON.stringify(cn(M._cuvTrier(CUVES, c('duree'))).slice(0, 3))
   === JSON.stringify(['Cuve 3','Cuve 12','Cuve 7']));
t('la liste source n\u2019est jamais modifi\u00e9e en place',
  (() => { const avant = cn(CUVES).join('|');
           M.MV_TRI_CUVERIE.forEach(k => M._cuvTrier(CUVES, c(k.v,'desc')));
           return cn(CUVES).join('|') === avant; })());

// ═══════════════════════════════════════════════════════════════════════════
//  La STRUCTURE — ce qui doit avoir disparu, et ce qui doit rester absent
// ═══════════════════════════════════════════════════════════════════════════
console.log('\n  La famille du tri, referm\u00e9e\n');
/* ★ UN GREP BRUT COMPTE LES COMMENTAIRES — le piege est ecrit dans CLAUDE.md
   et il a mordu ici meme : la premiere version de cette assertion sortait
   rouge parce que le commentaire de `_matExportChoix` CITE `openPrompt` pour
   raconter sa disparition. Le TEST avait tort, pas le code. On cherche donc un
   APPEL, dans le code seul. */
const sansCom = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const matChoix = sansCom(bloc(CAVE, 'window._matExportChoix = function('));
const cuvChoix = sansCom(bloc(CAVE, 'window._cuvExportChoix = function('));
t('maturit\u00e9 : plus d\u2019appel \u00e0 openPrompt \u2014 une seule feuille, pas deux questions',
  !/openPrompt\s*\(/.test(matChoix) && matChoix.indexOf('_mvTriOuvrir') !== -1);
t('cuverie : plus d\u2019appel \u00e0 openPrompt \u2014 une seule feuille',
  !/openPrompt\s*\(/.test(cuvChoix) && cuvChoix.indexOf('_mvTriOuvrir') !== -1);
t('les deux gardent leur repli si utils.js est en retard',
  /_mvTriOuvrir\s*!==\s*'function'/.test(matChoix) && /_matDoc\(ans\[0\]/.test(matChoix) &&
  /_mvTriOuvrir\s*!==\s*'function'/.test(cuvChoix) && /_cuvDoc\(ans\[0\]/.test(cuvChoix));
t('les deux retiennent leur choix sous une cl\u00e9 qui leur est propre',
  /memo:'maturite'/.test(matChoix) && /memo:'cuverie'/.test(cuvChoix));

// Les cinq documents qui posent la question, tels que le catalogue les annonce.
const CATALOGUE = [
  ["act:'vignoble'",  'Tri des parcelles'],
  ["act:'intrants'",  'Tri des intrants'],
  ["act:'recoltes'",  'Mill\\u00e9sime, puis tri'],
  ["act:'matur'",     'Vendange, puis tri'],
  ["act:'cuverie'",   'Vendange, puis tri']
];
CATALOGUE.forEach(([cle, ask]) => {
  const i = REGL.indexOf(cle);
  const entree = i < 0 ? '' : REGL.slice(i, i + 400);
  t('catalogue : ' + cle + ' annonce \u00ab ' + ask.replace(/\\u00e9/g, '\u00e9') + ' \u00bb et ferme le hub',
    i >= 0 && entree.indexOf("ask:'" + ask + "'") !== -1 && entree.indexOf('ov:true') !== -1);
});

// ⚠️ Ce qui ne doit PAS avoir de feuille de tri, et la raison (§121).
const elevage = bloc(CAVE, 'window.openOvCaveExport = function(');
t('le suivi d\u2019\u00e9levage garde son propre \u00e9cran de filtres, sans feuille de tri',
  elevage.indexOf('_mvTriOuvrir') === -1 && elevage.indexOf('ovCaveExport') !== -1);
t('l\u2019inventaire des f\u00fbts reste structur\u00e9 par fournisseur, sans feuille de tri',
  (() => { const src = fs.readFileSync(path.join(R, 'src/reserve.js'), 'utf8');
           const f = bloc(src, 'function _rsvExportFutsPdf(');
           return f.indexOf('_mvTriOuvrir') === -1 && f.indexOf('_futsBySupplier') !== -1; })());
t('la synth\u00e8se cuivre reste un \u00c9CRAN, pas un document \u00e0 trier',
  (() => { const f = bloc(REGL, 'function openSyntheseCuivre(');
           return f.indexOf('_mvDocOpen') === -1 && f.indexOf('_mvTriOuvrir') === -1
               && f.indexOf('ovSyntheseCuivre') !== -1; })());

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n  Contre-\u00e9preuves \u2014 chaque d\u00e9faut remis doit faire rougir\n');
const ce = (nom, fn) => {
  let mordu = false;
  try { mordu = !fn(); } catch (e) { mordu = true; }
  if (mordu) { vert++; console.log('  \u2713 ' + nom); }
  else { rouge++; console.log('  \u2717 ' + nom + '  \u2014 LE HARNAIS N\u2019A PAS MORDU'); }
};
ce('d\u00e9faut recalcul\u00e9 avec d\u00e9partage \u2192 ce n\u2019est plus la liste re\u00e7ue', () =>
  RANGS.slice().sort((a, b) => (b.suc - a.suc) || a.nom.localeCompare(b.nom, 'fr')) === RANGS);
ce('vitesse absente compt\u00e9e z\u00e9ro \u2192 la parcelle passe pour la plus lente', () => {
  const naif = RANGS.slice().sort((a, b) => (a.vit || 0) - (b.vit || 0));
  return nm(naif)[3] === 'En Champs';               // exige l'inconnue EN FIN
});
ce('cuve en cours compt\u00e9e dur\u00e9e z\u00e9ro \u2192 elle ouvre le classement', () => {
  const jours = x => { const f = (x.decuvage && x.decuvage.date)
    || (x.mesures_fa.length ? x.mesures_fa[x.mesures_fa.length-1].date : null);
    return f ? Math.round((Date.parse(f) - Date.parse(x.date_entree)) / 86400000) : 0; };
  return cn(CUVES.slice().sort((a, b) => jours(a) - jours(b)))[3] === 'Cuve 1';
});
ce('volume 0 trait\u00e9 comme un volume \u2192 la cuve sans volume ouvre le tri croissant', () => {
  const naif = CUVES.slice().sort((a, b) => (a.volume_hl || 0) - (b.volume_hl || 0));
  return cn(naif)[3] === 'Cuve 7';
});
ce('un openPrompt r\u00e9introduit \u2192 deux questions \u00e0 la suite', () =>
  !/openPrompt\s*\(/.test(matChoix) && /openPrompt\s*\(/.test(cuvChoix));
ce('grep brut, commentaires compris \u2192 le seul mot cit\u00e9 suffit \u00e0 faire croire au d\u00e9faut', () =>
  bloc(CAVE, 'window._matExportChoix = function(').indexOf('openPrompt') === -1);

console.log('\n  ' + vert + ' vert' + (vert > 1 ? 's' : '') + ' \u00b7 ' + rouge
  + ' rouge' + (rouge > 1 ? 's' : '') + '\n');
process.exit(rouge ? 1 : 0);
