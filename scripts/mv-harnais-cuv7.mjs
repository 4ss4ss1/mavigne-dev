// Harnais fonctionnel CUV-7 — sur les VRAIES fonctions extraites de cave.js.
import fs from 'fs';
import { sourceDates, poseDates } from './mv-dates-reelles.mjs';
import { lireCave } from './mv-cave-src.mjs';   // ★ CUV-DEC (§164) : la Cave = cave.js + cuvier.js
const SRC = lireCave();

function extrait(nom) {
  const i = SRC.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('introuvable : ' + nom);
  let d = 0, j = SRC.indexOf('{', i);
  for (let k = j; k < SRC.length; k++) {
    if (SRC[k] === '{') d++;
    else if (SRC[k] === '}') { d--; if (!d) return SRC.slice(i, k + 1); }
  }
  throw new Error('accolades : ' + nom);
}
const NOMS = ['_vtJour','_vtNum','_vtB','_vtMesJour','_vtEcrire','_vtActives','_vendLastD','_vtFait','_vtPart',
  /* CUV-9 : _vtActives passe par _vendSuivie. Les trois predicats sont
     EXTRAITS (c'est le sujet), le seuil est bouchonne (ce n'est pas le
     sujet : il a son propre harnais, mv-harnais-cuv8). */
  '_vendDecuvee','_vendFaEnCours','_vendSuivie',
  /* CUV-13 : `_vendSuivie` et `_vendMesurable` lisent `_vendPressee` — extrait,
     jamais bouchonne : c'est lui qui fait entrer la cuve pressuree. */
  '_vendPressee',
  /* CUV-11 : la LIGNE de tournee entre dans le harnais. Elle n'y etait pas,
     et c'est exactement la qu'un defaut a vecu deux jours : CUV-9 faisait
     entrer les cuves decuvees dans `_vtActives` pendant que `_vtRowHtml` leur
     refusait tout champ. Deux fonctions justes chacune de son cote, un ecran
     mort au milieu. Un harnais qui ne teste que des predicats ne voit pas ca. */
  '_vendMesurable','_vtMesurables','_vendRepere','_vtTags','_vtCntHtml','_vtRowHtml','_vendSince',
  /* CUV-11, second temps : L'ECRAN ENTIER. La ligne était juste, les champs
     étaient là, l'écriture couvrait le bon ensemble — et `renderVendTour`
     renvoyait « Aucune cuve en fermentation » avant de regarder le filtre.
     Trois fonctions vertes derrière une porte fermée. Un harnais qui s'arrête
     aux prédicats ne voit pas une impasse : il faut RENDRE l'écran. */
  '_vtVisibles','_vtBase','_vtFiltDef','_vtLoad','_vtBandeauHtml','_vtMaj','renderVendTour'];
// ⚠ Ordre réel du fichier : on relit les indices avant de découper.
NOMS.sort((a,b)=>SRC.indexOf('function '+a+'(')-SRC.indexOf('function '+b+'('));

let ko = 0, ok = 0;
function t(nom, cond) { if (cond) { ok++; console.log('  ✓ ' + nom); } else { ko++; console.log('  ✗ ' + nom); } }

function monter(saboter) {
  let code = NOMS.map(extrait).join('\n');
  if (saboter) code = saboter(code);
  const pre = `
${sourceDates()}
var CAVE_VENDANGE={cuves_vinif:[]}, _VT_BUF={}, _VT_WHO=[];
function _vendTriMes(c){ var m=(c&&c.mesures_fa)||[]; if(m.length>1) m.sort(function(a,b){return a.date<b.date?-1:1;}); return m; }
function _vendIsActive(c){ return c.statut==='fa'||c.statut==='mpf'; }
function _vendEstFusionnee(c){ return !!(c.fusion); }
function _vendMesD20(m){ return m?m.densite:null; }   // bouchon : pas de T° ici
function _vendDSec(){ return 996; }                   // bouchon : cf. cuv8
function _vendCuvF1(x){ return String(x); }
function _escAttr(s){ return String(s==null?'':s); }
function _escHtml(s){ return String(s==null?'':s); }
function _mvIcon(){ return '<svg></svg>'; }
function _caveCuve(){ return null; }                  // bouchon : pas de parc ici
function canWrite(){ return true; }
var ECRITURES=0;
function _vendFbSave(){ ECRITURES++; return null; }
function _vendRefreshCockpit(){}
function _vtEtat(){}
function _vtCss(){}
function _vendEnsureSheetCss(){}
function _caveIntLabel(a){ return (a||[]).join(', '); }
var _VT_FILT='cours';
/* ⚠ Décor DOM minimal : renderVendTour n'écrit QUE dans #mvv-body, et _vtMaj
   dans quatre nœuds de compteur. Un stub qui rend un nœud pour tout id suffit,
   et il ne prétend pas être un navigateur — build/e2e restent côté Nico. */
var _DOM={};
var document={getElementById:function(id){
  if(!_DOM[id]) _DOM[id]={id:id,innerHTML:'',textContent:'',style:{},
    classList:{add:function(){},remove:function(){},toggle:function(){}}};
  return _DOM[id];
}};
var window={};
var navigator={};
var showToast=function(){};
`;
  const post = `\nreturn {CV:CAVE_VENDANGE,BUF:_VT_BUF,WHO:_VT_WHO,ecrire:_vtEcrire,lastD:_vendLastD,jour:_vtJour,
  actives:_vtActives, mesurables:_vtMesurables, row:_vtRowHtml, base:_vtBase,
  filtDef:_vtFiltDef, render:renderVendTour, dom:_DOM,
  filt:function(k){ if(k!==undefined) _VT_FILT=k; return _VT_FILT; },
  set:function(cv,buf,who){CAVE_VENDANGE=cv;_VT_BUF=buf;_VT_WHO=who||[];},nEcr:function(){return ECRITURES;}};`;
  return new Function(pre + code + post)();
}

function cuve(id, mes) { return { id: id, statut: 'fa', nom: id, mesures_fa: mes || [] }; }

// ⚠ Les dates du jeu d'essai sont RELATIVES a aujourd'hui : ecrites en dur,
//   elles auraient collisionne avec la date du jour et fait rougir un code juste.
function jm(n){ const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); }
function jouer(H) {
  const j = H.jour();
  const c1 = cuve('c1', [{ id: 'a', date: jm(2), densite: 1050, temp_c: 24 },
                         { id: 'b', date: jm(1), densite: 1032, temp_c: 26 }]);
  const c2 = cuve('c2', []);
  const c3 = cuve('c3', [{ id: 'z', date: j, densite: 1010, temp_c: 22, note: 'écrite à la main' }]);
  const cv = { cuves_vinif: [c1, c2, c3] };
  H.set(cv, { c1: { t: '25,5', d: '1028', p: 2, r: 1 },
              c2: { t: '', d: '', p: 3, r: 0 },
              c3: { t: '', d: '1005', p: 0, r: 0 } }, ['Nico']);
  H.ecrire();
  return { c1, c2, c3, j };
}

console.log('\n── CUV-7 · écriture de la tournée ──');
{
  const H = monter(null); const r = jouer(H);
  t('c1 : le relevé du jour est CRÉÉ (pas d\'écrasement des anciens)', r.c1.mesures_fa.length === 3);
  const m1 = r.c1.mesures_fa[r.c1.mesures_fa.length - 1];
  t('c1 : densité et température prises au tampon', m1.densite === 1028 && m1.temp_c === 25.5);
  t('c1 : la virgule est acceptée (25,5 → 25.5)', m1.temp_c === 25.5);
  t('c1 : compteurs posés sur le relevé', m1.pigeages === 2 && m1.remontages === 1);
  t('c1 : intervenant écrit', Array.isArray(m1.qui) && m1.qui[0] === 'Nico');
  t('c2 : un pigeage seul crée quand même le relevé', r.c2.mesures_fa.length === 1);
  t('c2 : pas de densité inventée', r.c2.mesures_fa[0].densite === undefined);
  t('c3 : le relevé du jour est MIS À JOUR, pas empilé', r.c3.mesures_fa.length === 1);
  t('c3 : la note écrite à la main survit', r.c3.mesures_fa[0].note === 'écrite à la main');
  t('c3 : un champ vide n\'écrase pas la valeur en place (temp reste 22)', r.c3.mesures_fa[0].temp_c === 22);
  t('c3 : la densité saisie remplace bien l\'ancienne', r.c3.mesures_fa[0].densite === 1005);
  t('une seule écriture Firebase pour toute la tournée', H.nEcr() === 1);
  // deuxieme passage : la tournee ne doit RIEN empiler
  H.ecrire();
  t('2ᵉ enregistrement : aucun relevé de plus sur c1', r.c1.mesures_fa.length === 3);
  t('2ᵉ enregistrement : aucun relevé de plus sur c3', r.c3.mesures_fa.length === 1);
}
console.log('\n── CUV-9 · la tournée garde une cuve décuvée qui fermente ──');
{
  const H2 = monter();
  /* CUV-10 : ce n'est plus la densité qui décide, c'est la case cochée au
     décuvage. Même densité sur les deux cuves : seul le fait les sépare. */
  const dec = (id, fin) => ({ id, nom: id, statut: 'termine',
                            decuvage: { date: jm(1), fa_finie: fin },
                            mesures_fa: [{ id: 'm', date: jm(1), densite: 997 }] });
  const sucre = dec('avec-sucre', false); // écoulée exprès avant la fin
  const seche = dec('seche', true);       // finie en cuve : l'affaire est close
  H2.set({ cuves_vinif: [sucre, seche] }, {}, []);
  const ids = H2.actives().map(c => c.id);
  t('une cuve décuvée « à finir au chai » reste dans la tournée', ids.indexOf('avec-sucre') >= 0);
  t('★ à densité IDENTIQUE, celle déclarée finie en sort', ids.indexOf('seche') < 0);
  const muet = { id: 'muet', nom: 'muet', statut: 'termine', decuvage: { date: jm(1) },
                 mesures_fa: [{ id: 'm', date: jm(1), densite: 997 }] };
  H2.set({ cuves_vinif: [muet] }, {}, []);
  t('★ une cuve décuvée AVANT ce lot n’est pas devinée en FA', H2.actives().length === 0);
  const fus = dec('fusionnee', false); fus.fusion = { vers: 'x' };
  H2.set({ cuves_vinif: [fus] }, {}, []);
  t('★ une cuve FUSIONNÉE ne suit rien : son vin est ailleurs', H2.actives().length === 0);
}

console.log('\n── CUV-11 · la ligne de tournée porte ses champs ──');
{
  /* ★★★ CE BLOC EST LE FILET QUI MANQUAIT. Mesuré AVANT correction sur la
     fonction réelle : la ligne d'une cuve décuvée se rendait sans aucun champ,
     donc la tournée que CUV-9 lui avait ouverte ne servait à rien. */
  const H3 = monter();
  const champ = c => /vt-d-/.test(H3.row(c, true));
  const act = { id: 'a', nom: 'Active', statut: 'fa',
                mesures_fa: [{ id: 'm', date: jm(1), densite: 1030, temp_c: 25 }] };
  const decFA = { id: 'b', nom: 'DecFA', statut: 'termine',
                  decuvage: { date: jm(2), fa_finie: false },
                  mesures_fa: [{ id: 'm', date: jm(1), densite: 1004, temp_c: 22 }] };
  const decFin = { id: 'c', nom: 'DecFin', statut: 'termine',
                   decuvage: { date: jm(2), fa_finie: true },
                   mesures_fa: [{ id: 'm', date: jm(1), densite: 997, temp_c: 20 }] };
  const setup = { id: 'd', nom: 'Setup', statut: 'setup', mesures_fa: [] };
  t('une cuve en fermentation porte ses deux champs', champ(act));
  t('★★★ une cuve décuvée à finir au chai AUSSI (elle est dans la tournée depuis CUV-9)', champ(decFA));
  t('★★ une cuve décuvée et déclarée finie aussi, sous le filtre « Tout »', champ(decFin));
  t('une cuve à l’encuvage reste en lecture seule', !champ(setup));
  t('★ le tag « décuvée » ne dépend plus de la réponse au décuvage',
    /décuvée/.test(H3.row(decFin, true)) && /décuvée/.test(H3.row(decFA, true)));
  /* ★★ CE QUI S'AFFICHE DOIT S'ECRIRE. Un champ que personne n'enregistre rend
     une saisie faite et la perd — pire que pas de champ. */
  const cv = { cuves_vinif: [act, decFA, decFin, setup] };
  H3.set(cv, { c: { t: '19', d: '996', p: 0, r: 0 } }, ['Nico']);
  H3.ecrire();
  t('★★ le relevé saisi sur une cuve décuvée-finie est ÉCRIT', decFin.mesures_fa.length === 2);
  t('la tournée réclamée, elle, ne s’élargit pas',
    H3.actives().map(c => c.id).join(',') === 'a,b');
  t('l’ensemble écrit couvre bien l’ensemble affiché',
    H3.mesurables().map(c => c.id).join(',') === 'a,b,c');
}

console.log('\n── CUV-11 · la tournée reste ouverte quand le cuvier est décuvé ──');
{
  /* ★★★ LE DÉFAUT QUE NICO DÉCRIT, MESURÉ À L'ÉCRAN. Toutes les cuves décuvées
     et déclarées finies en cuve : l'état NORMAL du cuvier après vendange. */
  const H = monter();
  const dec = (id, fin) => ({ id, nom: id, statut: 'termine',
    decuvage: { date: jm(3), fa_finie: fin },
    mesures_fa: [{ id: 'm' + id, date: jm(3), densite: 997, temp_c: 20 }] });
  const d1 = dec('d1', true), d2 = dec('d2', true);
  H.set({ cuves_vinif: [d1, d2] }, {}, ['Nico']);
  H.filt('cours');
  H.render();
  const ecran = H.dom['mvv-body'].innerHTML;
  t('★★★ l’écran ne se ferme plus sur « aucune cuve »', !/Aucune cuve à relever/.test(ecran));
  t('★★★ les deux cuves décuvées portent leurs champs de saisie',
    (ecran.match(/vt-d-/g) || []).length === 2);
  t('★ la vue d’ouverture bascule sur « Toutes » — la seule où elles sont',
    H.filt() === 'tout');
  t('la barre de progression compte les deux', H.dom['vt-pt'].textContent === '/2');

  /* Le seul cas où l'écran vide est juste : plus rien de relevable. */
  const H0 = monter();
  const fus = dec('f', true); fus.fusion = { vers: 'x' };
  H0.set({ cuves_vinif: [fus, { id: 's', nom: 's', statut: 'setup', mesures_fa: [] }] }, {}, []);
  H0.render();
  t('★ une cuve fusionnée et une cuve à l’encuvage ne font pas une tournée',
    /Aucune cuve à relever/.test(H0.dom['mvv-body'].innerHTML));

  /* Le filtre choisi à la main ne se fait pas annuler : on l'explique. */
  const H2 = monter();
  H2.set({ cuves_vinif: [dec('x', true)] }, {}, []);
  H2.render(); H2.filt('cours'); H2.render();
  t('★ « En cours » vide dit où sont les cuves au lieu d’un blanc',
    /Toutes/.test(H2.dom['mvv-body'].innerHTML) && H2.filt() === 'cours');
}

console.log('\n── CUV-11 · _vtBase — la tournée compte ce qu’elle montre ──');
{
  const H = monter();
  const act = { id: 'a', nom: 'a', statut: 'fa', mesures_fa: [] };
  const decu = { id: 'b', nom: 'b', statut: 'termine',
    decuvage: { date: jm(2), fa_finie: true }, mesures_fa: [] };
  const setup = { id: 'c', nom: 'c', statut: 'setup', mesures_fa: [] };
  H.set({ cuves_vinif: [act, decu, setup] }, {}, []);
  H.filt('cours');
  t('sous « En cours », la base est exactement la tournée réclamée',
    H.base().map(c => c.id).join(',') === 'a');
  H.filt('tout');
  t('★ sous « Toutes », la décuvée compte — elle porte ses champs',
    H.base().map(c => c.id).join(',') === 'a,b');
  t('★ une cuve à l’encuvage ne compte jamais : rien à y saisir',
    H.base().every(c => c.id !== 'c'));
  t('★ avec une cuve active, la vue d’ouverture reste « En cours »',
    (H.filt('cours'), H.filtDef() === 'cours'));
}

console.log('\n── CUV-7 · _vendLastD ──');
{
  const H = monter(null);
  const c = cuve('x', [{ id: '1', date: jm(3), densite: 1060, temp_c: 25 },
                       { id: '2', date: jm(2), densite: 1040, temp_c: 26 },
                       { id: '3', date: jm(1), temp_c: 27, pigeages: 2 }]);
  t('ignore le relevé sans densité et rend le précédent', H.lastD(c).id === '2');
  t('rend null si aucune densité', H.lastD(cuve('y', [{ id: '1', date: jm(1), temp_c: 20 }])) === null);
  t('rend null sur une cuve sans relevé', H.lastD(cuve('z', [])) === null);
}
console.log('\n── CONTRE-PREUVE : on réintroduit chaque défaut, le harnais DOIT rougir ──');
function contre(nom, sab, verif) {
  let rouge = false;
  try { const H = monter(sab); rouge = !verif(jouer(H), H); }
  catch (e) { rouge = true; }
  if (rouge) { ok++; console.log('  ✓ ' + nom + ' → détecté'); }
  else { ko++; console.log('  ✗ ' + nom + ' → PASSÉ INAPERÇU'); }
}
/* ⚠⚠ ANCRE UNIQUE, ET C'EST UNE LEÇON DE CE LOT. Le sabotage visait
   `var m=_vtMesJour(c);` — présent DANS DEUX fonctions extraites depuis que
   `_vtLoad` entre dans le harnais. `String.replace` ne remplace que la
   PREMIÈRE occurrence : la contre-épreuve saccageait `_vtLoad` et laissait
   `_vtEcrire` intact, donc elle passait au vert sans rien prouver. Une ancre
   de contre-épreuve doit être unique DANS LE BLOC EXTRAIT, pas dans la
   fonction qu'on croit viser. */
contre('empilement au lieu de mise à jour',
  c => c.replace('    var m=_vtMesJour(c);\n    if(!m){', '    var m=null;\n    if(!m){'),
  r => r.c3.mesures_fa.length === 1);
contre('le vide écrase la valeur en place',
  c => c.replace('if(t!=null) m.temp_c=t;', 'm.temp_c=t;'),
  r => r.c3.mesures_fa[0].temp_c === 22);
contre('_vendLastD prend le dernier relevé tout court',
  c => c.replace('if(m[i]&&m[i].densite!=null) return m[i];', 'if(m[i]) return m[i];'),
  (r, H) => { const d = H.lastD(r.c2); return d === null; });
contre('★★★ CUV-11 · la ligne de tournée reprend `_vendIsActive` (le défaut d’origine)',
  c => c.replace('var b=_vtB(c.id), inact=!_vendMesurable(c);',
                 'var b=_vtB(c.id), inact=!_vendIsActive(c);'),
  (r, H) => /vt-d-/.test(H.row({ id: 'z', nom: 'z', statut: 'termine',
    decuvage: { date: jm(2), fa_finie: false }, mesures_fa: [] }, true)));
contre('★★ l’écriture reste sur la tournée pendant que l’affichage s’élargit',
  c => c.replace(/  var jour=_vtJour\(\), n=0;\n  _vtMesurables\(\)\.forEach/,
                 '  var jour=_vtJour(), n=0;\n  _vtActives().forEach'),
  (r, H) => { const d = { id: 'q', nom: 'q', statut: 'termine',
                          decuvage: { date: jm(2), fa_finie: true }, mesures_fa: [] };
              H.set({ cuves_vinif: [d] }, { q: { t: '19', d: '996', p: 0, r: 0 } }, ['N']);
              H.ecrire(); return d.mesures_fa.length === 1; });
console.log('\n' + (ko ? '❌ ' + ko + ' ÉCHEC(S) · ' : '✅ ') + ok + ' assertions vertes');
process.exit(ko ? 1 : 0);
