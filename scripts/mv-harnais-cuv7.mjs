// Harnais fonctionnel CUV-7 — sur les VRAIES fonctions extraites de cave.js.
import fs from 'fs';
const SRC = fs.readFileSync(new URL('../src/cave.js', import.meta.url), 'utf8');

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
  '_vendDecuvee','_vendFaEnCours','_vendSuivie'];
// ⚠ Ordre réel du fichier : on relit les indices avant de découper.
NOMS.sort((a,b)=>SRC.indexOf('function '+a+'(')-SRC.indexOf('function '+b+'('));

let ko = 0, ok = 0;
function t(nom, cond) { if (cond) { ok++; console.log('  ✓ ' + nom); } else { ko++; console.log('  ✗ ' + nom); } }

function monter(saboter) {
  let code = NOMS.map(extrait).join('\n');
  if (saboter) code = saboter(code);
  const pre = `
var CAVE_VENDANGE={cuves_vinif:[]}, _VT_BUF={}, _VT_WHO=[];
function _vendTriMes(c){ var m=(c&&c.mesures_fa)||[]; if(m.length>1) m.sort(function(a,b){return a.date<b.date?-1:1;}); return m; }
function _vendIsActive(c){ return c.statut==='fa'||c.statut==='mpf'; }
function _vendEstFusionnee(c){ return !!(c.fusion); }
function _vendMesD20(m){ return m?m.densite:null; }   // bouchon : pas de T° ici
function _vendDSec(){ return 996; }                   // bouchon : cf. cuv8
function canWrite(){ return true; }
var ECRITURES=0;
function _vendFbSave(){ ECRITURES++; return null; }
function _vendRefreshCockpit(){}
function _vtEtat(){}
var window={};
var navigator={};
var showToast=function(){};
`;
  const post = `\nreturn {CV:CAVE_VENDANGE,BUF:_VT_BUF,WHO:_VT_WHO,ecrire:_vtEcrire,lastD:_vendLastD,jour:_vtJour,
  actives:_vtActives,
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
  const dec = (id, d) => ({ id, nom: id, statut: 'termine', decuvage: { date: jm(1) },
                            mesures_fa: [{ id: 'm', date: jm(1), densite: d }] });
  const sucre = dec('avec-sucre', 999);   // au-dessus du seuil bouchonné (996)
  const seche = dec('seche', 993);        // en dessous : l'affaire est close
  H2.set({ cuves_vinif: [sucre, seche] }, {}, []);
  const ids = H2.actives().map(c => c.id);
  t('une cuve décuvée encore sucrée reste dans la tournée', ids.indexOf('avec-sucre') >= 0);
  t('une cuve décuvée et sèche en sort', ids.indexOf('seche') < 0);
  const fus = dec('fusionnee', 999); fus.fusion = { vers: 'x' };
  H2.set({ cuves_vinif: [fus] }, {}, []);
  t('★ une cuve FUSIONNÉE ne suit rien : son vin est ailleurs', H2.actives().length === 0);
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
contre('empilement au lieu de mise à jour',
  c => c.replace('var m=_vtMesJour(c);', 'var m=null;'),
  r => r.c3.mesures_fa.length === 1);
contre('le vide écrase la valeur en place',
  c => c.replace('if(t!=null) m.temp_c=t;', 'm.temp_c=t;'),
  r => r.c3.mesures_fa[0].temp_c === 22);
contre('_vendLastD prend le dernier relevé tout court',
  c => c.replace('if(m[i]&&m[i].densite!=null) return m[i];', 'if(m[i]) return m[i];'),
  (r, H) => { const d = H.lastD(r.c2); return d === null; });
console.log('\n' + (ko ? '❌ ' + ko + ' ÉCHEC(S) · ' : '✅ ') + ok + ' assertions vertes');
process.exit(ko ? 1 : 0);
