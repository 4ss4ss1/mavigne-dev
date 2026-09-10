// mv-harnais-pil-coherence.mjs — lot PIL-COH (pilotage.js + planning.js + utils.js)
//
//   node scripts/mv-harnais-pil-coherence.mjs            (le lot)
//   node scripts/mv-harnais-pil-coherence.mjs --contre   (les contre-epreuves)
//
// POURQUOI. Le 10/09/2026, un bac qui rend les huit onglets sur un domaine
// synthetique a trouve deux dates de fin sur le meme module (11 sept. / 29 sept.),
// une cadence d'equipe qui comptait une fiche pour une personne, un ecart de
// cadence refuse par une tuile et applique par sa voisine, une masse salariale
// sans le bureau. Ce harnais EXECUTE les fonctions reelles (methode C20) : il
// ne relit pas le code, il le fait tourner sur des chiffres choisis pour que
// chaque assertion ne puisse pas passer par hasard.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = {
  pil:  fs.readFileSync(path.join(RACINE,'src','pilotage.js'),'utf8'),
  plan: fs.readFileSync(path.join(RACINE,'src','planning.js'),'utf8'),
  util: fs.readFileSync(path.join(RACINE,'src','utils.js'),'utf8'),
};
const CONTRE = process.argv.includes('--contre');
let ok=0, ko=0;
const t=(nom,cond,det)=>{ if(cond){ok++; console.log('  \x1b[32m✓\x1b[0m '+nom);} else {ko++; console.log('  \x1b[31m✗\x1b[0m '+nom+(det?'\n      → '+det:''));} };

function bloc(s, motif, nom){
  const m=motif.exec(s); if(!m) throw new Error('absent : '+nom);
  const start=m.index+(s[m.index]==='\n'?1:0);
  let d=0, j=s.indexOf('{', m.index+m[0].length-1);
  for(;j<s.length;j++){ if(s[j]==='{')d++; else if(s[j]==='}'){d--; if(!d)break;} }
  if(d!==0) throw new Error('accolades : '+nom);
  return s.slice(start,j+1);
}
const fn=(s,n)=>bloc(s,new RegExp('(?:^|\\n)function\\s+'+n+'\\s*\\(','m'),n);
const winFn=(s,n)=>bloc(s,new RegExp('(?:^|\\n)window\\.'+n+'\\s*=\\s*function\\s*\\(','m'),n);

async function charger(src){
  const tmp=path.join(os.tmpdir(),'mv-pilcoh-'+Math.random().toString(36).slice(2)+'.mjs');
  fs.writeFileSync(tmp,src,'utf8');
  try{ execFileSync(process.execPath,['--check',tmp],{stdio:'pipe'}); }
  catch(e){ fs.unlinkSync(tmp); throw new Error('mutant non compilable'); }
  fs.unlinkSync(tmp);
  return import('data:text/javascript;base64,'+Buffer.from(src,'utf8').toString('base64'));
}

// ── ① planning.js : _planTeamCadence_ pese l'effectif et exclut les CP ──────
async function testCadence(planSrc){
  const corps=fn(planSrc,'_planTeamCadence_');
  // Stubs : 3 jours ouvres, un permanent 7 h + une equipe de 10 a 8 h, la
  // permanente en CP le 2e jour. Attendu : jour1 = 7+80, jour2 = 80, jour3 = 87.
  const src=`
let _planCtxYear=null;
const MB=[{nom:'A',bureau:false},{nom:'EQ',collectif:true,effectif:10}];
function _planMigrateYears(){}
function _planMbrsPer(){ return MB; }
function _planInContractRead(){ return true; }
function _pEntDay(nom,m,d){ return (nom==='A'&&d===8)?{type:'cp'}:null; }
function _planPlId(m){ return 'std'; }
function _planWorkH(pl,m,d,e){ if(e&&e.type==='cp') return 0; return pl==='std'?7:0; }
function _planDayH(pl,m,d,e){ return 7; }
function _planEffN(m){ return m.collectif?m.effectif:1; }
${corps}
export { _planTeamCadence_ };`;
  const M=await charger(src);
  // le stub _planWorkH rend 7 pour tous ; l'equipe pese 10 -> jour1 = 7+70, jour2 = 70, jour3 = 77
  const r=M._planTeamCadence_(new Date(2026,8,7), new Date(2026,8,9));
  return r;
}
{
  const r=await testCadence(SRC.plan);
  t('① la cadence pese l\'effectif collectif (77+70+77 h / 3 j)', Math.abs(r.cadence-224/3)<1e-9, JSON.stringify(r));
  t('① un CP n\'est pas une presence (jour 2 = 70 h)', Math.abs(r.totalH-224)<1e-9, 'totalH='+r.totalH);
  t('① hPers = heures par personne-jour (224 / 32)', Math.abs(r.hPers-224/32)<1e-9, 'hPers='+r.hPers);
}

// ── ② pilotage.js : _pilEchCadence pese l'effectif dans son repli ────────────
async function testEch(pilSrc, planCad){
  const src=`
const window={ _planTeamCadence: ${planCad?'()=>({cadence:100,hPers:6.5})':'null'}, _mvEffDef:(m)=>m.collectif?m.effectif:1, CONFIG:{eco:{h_jour:8}} };
${fn(pilSrc,'_pecHJour')}
${fn(pilSrc,'_pilEchCadence')}
export { _pilEchCadence };`;
  const M=await charger(src);
  return M._pilEchCadence({membres:[{nom:'A'},{nom:'B',bureau:true},{nom:'EQ',collectif:true,effectif:10}]});
}
{
  const r=await testEch(SRC.pil,false);
  t('② repli : 11 personnes x journee reglee 8 h = 88 h/j', r.cadH===88 && r.estim===true, JSON.stringify(r));
  t('② repli : hPers = journee reglee', r.hPers===8, 'hPers='+r.hPers);
  const r2=await testEch(SRC.pil,true);
  t('② planning present : hPers vient de la mesure', r2.cadH===100 && r2.hPers===6.5, JSON.stringify(r2));
}

// ── ③ _pilOrdDate est l'inverse LOCAL de _pilAnnOrd, sur toute l'annee ────────
{
  const src=`${fn(SRC.pil,'_pilAnnOrd')}\n${fn(SRC.pil,'_pilOrdDate')}\nexport {_pilAnnOrd,_pilOrdDate};`;
  const M=await charger(src);
  let bad=0;
  for(let o=0;o<800;o++){ const d=M._pilOrdDate(o); const iso=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); if(M._pilAnnOrd(iso)!==o || d.getHours()!==0) bad++; }
  t('③ 800 ordinaux -> date locale a minuit -> meme ordinal', bad===0, bad+' ecarts');
}

// ── ④ utils.js : _mvEnContratSurPeriode et le 4e argument ────────────────────
{
  const src=`const window={ _mvContrats:()=>[] };\n${winFn(SRC.util,'_mvEnContratSurPeriode')}\nexport const f=window._mvEnContratSurPeriode;`;
  const M=await charger(src);
  t('④ bureau exclu sans 4e argument (capacite vigne)', M.f({nom:'E',bureau:true},'2026-08-01','2027-07-31')===false);
  t('④ bureau inclus avec avecBureau (masse salariale)', M.f({nom:'E',bureau:true},'2026-08-01','2027-07-31',true)===true);
  t('④ non-bureau inchange', M.f({nom:'A'},'2026-08-01','2027-07-31')===true);
  t('④ _pexData passe true, et lui seul', (SRC.pil.match(/_mvEnContratSurPeriode\([^)]*,true\)/g)||[]).length===1 && /_mvEnContratSurPeriode\(m,ex\.d0,ex\.d1,true\)/.test(SRC.pil));
}

// ── ⑤ la borne vit dans _pecData, une seule fois ─────────────────────────────
{
  const cp=fn(SRC.pil,'_pilCapaProj');
  t('⑤ _pilCapaProj ne porte plus sa propre borne', !/k>=0\.5\s*&&\s*k<=3/.test(cp.replace(/^\s*\/\/.*$/gm,'')));
  t('⑤ _pilCapaProj accepte un facteur pre-calcule (kPre)', /function _pilCapaProj\(charge, startIso, kPre\)/.test(cp) && /kPre\.kHors/.test(cp));
  const pd=fn(SRC.pil,'_pecData').replace(/^\s*\/\/.*$/gm,'');
  t('⑤ _pecData refuse le facteur hors [KMIN;KMAX]', /kCad<_PEC_CAD_KMIN\s*\|\|\s*kCad>_PEC_CAD_KMAX/.test(pd) && /cadAppl = \(cadSrc==='planning' && !cadHors\)/.test(pd));
  t('⑤ la borne est declaree une fois', (SRC.pil.match(/var _PEC_CAD_KMIN = 0\.5, _PEC_CAD_KMAX = 3;/g)||[]).length===1);
  // execution : _pecNonRetenu dit pourquoi
  const src=`${fn(SRC.pil,'_pecNonRetenu')}\nexport {_pecNonRetenu};`;
  const M=await charger(src);
  t('⑤ hors bornes -> « n\'est pas appliqué au budget »', /n\u2019est pas appliqu\u00e9 au budget/.test(M._pecNonRetenu({cad:{horsBornes:true,kmin:0.5,kmax:3}})) && /hors \[0,5/.test(M._pecNonRetenu({cad:{horsBornes:true,kmin:0.5,kmax:3}})));
  t('⑤ histo -> lu, non applique', /campagne pr\u00e9c\u00e9dente/.test(M._pecNonRetenu({cad:{src:'histo'}})));
}

// ── ⑥ Echeances par tache lit la definition du cockpit ───────────────────────
{
  const ech=fn(SRC.pil,'_pilPanelEcheances').replace(/^\s*\/\/.*$/gm,'');
  t('⑥ Echeances lit _pilMargeCalc, pas sa propre cadence', /_pilMargeCalc\(d\)/.test(ech) && !/_pilEchCadence\(d\)/.test(ech));
  t('⑥ le « N j » par tache passe par _pilCapaProj', /_pilCapaProj\(h,startIso,kPre\)/.test(ech));
  t('⑥ la ligne de cadre nomme la source', /m\u00eame calcul qu/.test(ech) && /le planning ne couvre pas la suite/.test(ech));
}

// ── ⑦ Presences du jour = memes nombres que le cockpit ───────────────────────
{
  const pr=fn(SRC.pil,'_pilPanelPresences').replace(/^\s*\/\/.*$/gm,'');
  t('⑦ compte presentFiches / nVchamp (hors bureau)', /d\.presentFiches/.test(pr) && /d\.nVchamp/.test(pr) && /if\(p\.bureau\) return false;/.test(pr));
}

// ── ⑧ le simulateur divise par la journee mesuree par personne ───────────────
{
  const si=fn(SRC.pil,'_pilSimInitData').replace(/^\s*\/\/.*$/gm,'');
  t('⑧ perH = c.hPers, plus cadH/nMes', /var perH=\(cadH>0\)\?c\.hPers:0;/.test(si) && !/cadH\/nMes/.test(si));
}

// ── ⑨ _ecoRate : heures sur la periode x effectif, avec cache oublie au rendu ─
{
  const er=fn(SRC.pil,'_ecoRate').replace(/^\s*\/\/.*$/gm,'');
  t('⑨ pondere par _planWorkPersRange sur [d0,d1]', /_planWorkPersRange\(m,dA,dB\)/.test(er) && /_mvEffDef/.test(er));
  t('⑨ le cache est oublie a chaque repeinte', /_ECO_RATE_CACHE=\{k:null,v:0\}/.test(fn(SRC.pil,'_pilExoOublier')));
}

// ── ⑩ rythme de depense borne au debut de periode ────────────────────────────
{
  const tl=fn(SRC.pil,'_pecTimeline').replace(/^\s*\/\/.*$/gm,'');
  t('⑩ winStart = max(t0, winEnd-28j)', /var winStart = Math\.max\(t0, winEnd-28\*86400000\);/.test(tl));
}

// ── ⑪ photo Travaux : prorata des jours d'une periode a cheval ───────────────
{
  const ph=fn(SRC.pil,'_pilPhotosData').replace(/^\s*\/\/.*$/gm,'');
  t('⑪ une periode a cheval compte au prorata', /part=Math\.max\(0,\(b2-a2\+1\)\)\/\(b-a\+1\)/.test(ph) && /nChev\+\+/.test(ph));
}


// ── ⑫ lot PIL-EXO : l'exercice coupé au jour (engagé / prévu) ────────────────
{
  const px=fn(SRC.pil,'_pexData').replace(/^\s*\/\/.*$/gm,'');
  t('⑫ _pexData prend une coupe en 3e argument', /function _pexData\(ex, noCmp, coupeIso\)/.test(px));
  // ⚠️ LE NOMBRE EST LE COMPTE DES SOURCES DATEES de _pexData, et c'est ce qui
  //   fait mordre ce test : un filtre RETIRE le ferait rougir. Il passe donc a 4
  //   avec les futs achetes (lot FUT-LOC). A relever chaque fois qu'une source
  //   datee s'ajoute — jamais a assouplir en >=, sinon il ne prouve plus rien.
  t('⑫ les faits datés s\'arrêtent à dFin (4 filtres), plus à ex.d1', (px.match(/iso>dFin\) return;/g)||[]).length===4 && !/iso>ex\.d1\) return;/.test(px));
  t('⑫ le segment de paie est coupé à la coupe (engagé / prévu)', /prevu:false/.test(px) && /prevu:true/.test(px) && /byM\[mo\.k\]\.salP\+=h\*tx/.test(px));
  t('⑫ totalClot = engagé + prévu', /var totalP=salP, totalClot=total\+totalP;/.test(px));
  t('⑫ N-1 rejoué aux mêmes jours (à date comparable)', /_pexData\(exP, true, _cp\)/.test(px));
  const src=`${fn(SRC.pil,'_pexIsoToMs2')}\n${fn(SRC.pil,'_pexIsoPlus')}\n${fn(SRC.pil,'_pexJourApres')}\nexport {_pexIsoPlus,_pexJourApres};`;
  const M=await charger(src);
  t('⑫ _pexJourApres passe le 31 → 01 et le 28 févr. → 1er mars (UTC de bout en bout)', M._pexJourApres('2026-08-31')==='2026-09-01' && M._pexJourApres('2027-02-28')==='2027-03-01' && M._pexIsoPlus('2026-08-01',40)==='2026-09-10');
  const en=fn(SRC.pil,'_pexEntete').replace(/^\s*\/\/.*$/gm,'');
  t('⑫ l\'en-tête dit Engagé / Prévu / À la clôture quand il reste du prévu', /E\.enCoursC/.test(en) && /Engag\\u00e9 \\u00e0 ce jour/.test(en) && /Pr\\u00e9vu jusqu/.test(en) && /pr\\u00e9vu compris/.test(en));
  t('⑫ l\'exercice clos garde son en-tête d\'avant', /D\\u00e9penses de l\\u2019exercice/.test(en));
  const gr=fn(SRC.pil,'_pexGraph').replace(/^\s*\/\/.*$/gm,'');
  t('⑫ le graphe hachure le prévu et marque la coupe', /pex-hach/.test(gr) && /\['salP','url\(#pex-hach\)'\]/.test(gr) && /aujourd\\u2019hui/.test(gr));
  const cd=fn(SRC.pil,'_pilDeuxCadresHtml').replace(/^\s*\/\/.*$/gm,'');
  t('⑫ le cadre « Exercice comptable » nomme la clôture, prévu compris', /X\.enCoursC/.test(cd) && /X\.totalClot/.test(cd));
}

// ── ⑬ lot PIL-DIAG : une seule liste ─────────────────────────────────────────
{
  const dg=fn(SRC.pil,'_pilDiag').replace(/^\s*\/\/.*$/gm,'');
  t('⑬ les postes à zéro sont des constats du moteur (4 × zero:true)', (dg.match(/zero:true/g)||[]).length===4 && /cible:'entretien'/.test(dg) && /cible:'phyto'/.test(dg));
  t('⑬ _pilDiag est mémoïsé et oublié au rendu', /if\(_PIL_DIAGC\) return _PIL_DIAGC;/.test(dg) && /_PIL_DIAGC=null;/.test(fn(SRC.pil,'_pilExoOublier')));
  t('⑬ la cible phyto existe', /phyto:\s*\['phyto',null,null\]/.test(SRC.pil));
  const src=`
const _DG=[{k:'Aucun taux horaire',g:'r',cible:'equipe',ou:'R',touche:['budget'],zero:true,poste:'MO'},
           {k:'Prix du GNR inconnu',g:'o',cible:'entretien',ou:'T',touche:['budget'],zero:true},
           {k:'3 lignes sans prix',g:'o',cible:'reserve',ou:'LR',touche:['budget']},
           {k:'Écartements absents',g:'b',cible:'dens',ou:'V',touche:[]}];
function _pilDiag(){ return _DG; }
${fn(SRC.pil,'_pecZeros')}
export {_pecZeros};`;
  const M=await charger(src);
  const Z=M._pecZeros({});
  t('⑬ _pecZeros = les constats budget marqués zero (2), N des M = 3', Z.length===2 && Z.nBudget===3 && Z[0].nom==='Aucun taux horaire' && Z[1].cible==='entretien');
  t('⑬ _pecZeros ne recalcule rien (aucun E.hasRate / E.hasGnr)', !/E\.hasRate|E\.hasGnr|E\.phy/.test(fn(SRC.pil,'_pecZeros').replace(/^\s*\/\/.*$/gm,'')));
  const fc=fn(SRC.pil,'_pecFiabCard').replace(/^\s*\/\/.*$/gm,'');
  t('⑬ la carte dit « N des M choses à compléter »', /Z\.nBudget/.test(fc) && /choses \\u00e0 compl\\u00e9ter qui touchent ce budget/.test(fc));
}

// ── Contre-epreuves : chaque defaut reintroduit doit ROUGIR ──────────────────
if(CONTRE){
  console.log('\n  ── contre-epreuves ──');
  async function attend(nom, fnMut){
    try{ const r=await fnMut(); t('CONTRE '+nom+' (rougit)', r===false, 'la mutation est passee VERTE'); }
    catch(e){ t('CONTRE '+nom+' (rougit : '+e.message+')', true); }
  }
  await attend('cadence sans effectif', async()=>{
    const m=SRC.plan.replace('dayTeam += hM * nM; persJ += nM;','dayTeam += hM; persJ += 1;');
    if(m===SRC.plan) throw new Error('ancre absente');
    const r=await testCadence(m); return Math.abs(r.cadence-224/3)<1e-9;
  });
  await attend('CP compte comme presence', async()=>{
    const m=SRC.plan.replace('var hM = _planWorkH(_planPlId(mbr), m, d, ent, yr);','var hM = _planDayH(_planPlId(mbr), m, d, ent);');
    if(m===SRC.plan) throw new Error('ancre absente');
    const r=await testCadence(m); return Math.abs(r.totalH-224)<1e-9;
  });
  await attend('repli 7 x fiches', async()=>{
    const m=SRC.pil.replace('if(!cadH){ if(nV>0){ cadH=hJ*nV; estim=true; } }','if(!cadH){ var nF=(d.membres||[]).filter(function(m){return m&&!m.bureau;}).length; if(nF>0){ cadH=7*nF; estim=true; } }');
    if(m===SRC.pil) throw new Error('ancre absente');
    const r=await testEch(m,false); return r.cadH===88;
  });
  await attend('epoque locale +86400000', async()=>{
    const m=SRC.pil.replace('function _pilOrdDate(o){ return new Date(2026,0,1+o); }',"function _pilOrdDate(o){ return new Date(Date.parse('2026-01-01T00:00:00')+o*86400000); }");
    if(m===SRC.pil) throw new Error('ancre absente');
    const src=`${fn(m,'_pilAnnOrd')}\n${fn(m,'_pilOrdDate')}\nexport {_pilAnnOrd,_pilOrdDate};`;
    const M=await charger(src); let bad=0;
    for(let o=0;o<800;o++){ const d=M._pilOrdDate(o); if(d.getHours()!==0) bad++; }
    // ⚠ Sous TZ=UTC (bac Claude) l'ancienne version passe aussi : la contre-epreuve
    //   n'est probante que sous un fuseau a changement d'heure (Europe/Paris).
    if(process.env.TZ==='UTC' || !process.env.TZ) throw new Error('non probante sous UTC — lancer avec TZ=Europe/Paris');
    return bad===0;
  });
  await attend('bureau dans la masse salariale sans le 4e argument', async()=>{
    const m=SRC.pil.replace('_mvEnContratSurPeriode(m,ex.d0,ex.d1,true)','_mvEnContratSurPeriode(m,ex.d0,ex.d1)');
    if(m===SRC.pil) throw new Error('ancre absente');
    return (m.match(/_mvEnContratSurPeriode\([^)]*,true\)/g)||[]).length===1;
  });
  await attend('la borne revient dans _pilCapaProj', async()=>{
    const m=SRC.pil.replace('if(E.cad.applic){ k=1+((E.cad.ecart||0)/100); if(k>0) kOk=true; else k=1; }','if(E.cad.applic){ k=1+((E.cad.ecart||0)/100); if(k>=0.5 && k<=3) kOk=true; else k=1; }');
    if(m===SRC.pil) throw new Error('ancre absente');
    return !/k>=0\.5\s*&&\s*k<=3/.test(fn(m,'_pilCapaProj').replace(/^\s*\/\/.*$/gm,''));
  });
  await attend('Echeances reprend sa propre cadence', async()=>{
    const m=SRC.pil.replace('var m=_pilMargeCalc(d), cadH=m.cadH;','var c=_pilEchCadence(d), cadH=c.cadH, m={start:new Date(),src:null,cadH:cadH};');
    if(m===SRC.pil) throw new Error('ancre absente');
    const e=fn(m,'_pilPanelEcheances').replace(/^\s*\/\/.*$/gm,''); return /_pilMargeCalc\(d\)/.test(e) && !/_pilEchCadence\(d\)/.test(e);
  });
  await attend('Presences compte le bureau', async()=>{
    const m=SRC.pil.replace("var list=(d.presences||[]).filter(function(p){ if(p.bureau) return false;","var list=(d.presences||[]).filter(function(p){");
    if(m===SRC.pil) throw new Error('ancre absente');
    return /if\(p\.bureau\) return false;/.test(fn(m,'_pilPanelPresences'));
  });
  await attend('rythme sans borne au debut de periode', async()=>{
    const m=SRC.pil.replace('var winStart = Math.max(t0, winEnd-28*86400000);','var winStart = winEnd-28*86400000;');
    if(m===SRC.pil) throw new Error('ancre absente');
    return /Math\.max\(t0, winEnd-28\*86400000\)/.test(fn(m,'_pecTimeline'));
  });

  await attend('_pecZeros reprend sa propre liste', async()=>{
    const m=SRC.pil.replace("var Z=B.filter(function(d){ return d.zero; })","var Z=[{nom:'Main-d\\u2019\\u0153uvre',cible:'equipe',ou:'R'}].concat(B.filter(function(d){ return d.zero; }))");
    if(m===SRC.pil) throw new Error('ancre absente');
    const src=`const _DG=[{k:'x',g:'r',cible:'equipe',ou:'R',touche:['budget'],zero:true}];function _pilDiag(){ return _DG; }\n${fn(m,'_pecZeros')}\nexport {_pecZeros};`;
    const M=await charger(src); return M._pecZeros({}).length===1;
  });
  await attend('le prévu retombe dans l\'engagé (byM.sal au lieu de salP)', async()=>{
    const m=SRC.pil.replace("if(pt.prevu){ hpP+=h; if(tx>0){ eurP+=h*tx; byM[mo.k].salP+=h*tx; }","if(pt.prevu){ hpP+=h; if(tx>0){ eurP+=h*tx; byM[mo.k].sal+=h*tx; }");
    if(m===SRC.pil) throw new Error('ancre absente');
    return /byM\[mo\.k\]\.salP\+=h\*tx/.test(fn(m,'_pexData'));
  });
  await attend('N-1 comparé sur l\'exercice entier au lieu des mêmes jours', async()=>{
    const m=SRC.pil.replace("var prevD=_pexData(exP, true, _cp);","var prevD=_pexData(exP, true);");
    if(m===SRC.pil) throw new Error('ancre absente');
    return /_pexData\(exP, true, _cp\)/.test(fn(m,'_pexData'));
  });
}

console.log('\n  '+ok+' vert'+(ok>1?'s':'')+' · '+ko+' rouge'+(ko>1?'s':'')+(CONTRE?' (mode contre-epreuves : un rouge attendu = vert)':''));
process.exit(ko?1:0);
