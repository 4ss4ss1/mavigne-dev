// Le bloc de reconduction et son handler, extraits du code REEL et exécutés.
import { readFileSync } from 'fs';
const A = readFileSync('/home/claude/mavigne-dev/src/admin-gt.js','utf8');
let ok=0,ko=0; const t=(n,c)=>{c?(ok++,console.log('  \x1b[32m✓\x1b[0m '+n)):(ko++,console.log('  \x1b[31m✗ '+n+'\x1b[0m'));};
const g=(re,q)=>{const m=A.match(re); if(!m) throw new Error('introuvable: '+q); return m[0];};
const K   = g(/var _FC_TRIAL_DAYS = 15;\nvar _FC_TRIAL_MAX  = 1;/,'constantes');
const HTM = g(/function _fcRenewHtml\(\)\{[\s\S]*?\n\}/,'_fcRenewHtml');
const BOX = g(/function _fcTrialStatusHtml\(fc\)\{[\s\S]*?\n\}/,'box');
const EXP = g(/function _fcTrialExpMs\(fc\)\{[\s\S]*?\n\}/,'exp');
const FMT = g(/function _fcTrialFmt\(ms\)\{.*?\n/,'fmt');
const HDL = g(/window\._fcRenewTrial=async function\(\)\{[\s\S]*?\n\};/,'handler');

const html=(FC)=>new Function('_FC',`${K}\n${HTM}\nreturn _fcRenewHtml();`)(FC);
console.log('\n── le bloc de reconduction ──');
let h=html({trialRenewals:0});
t('jamais reconduit : bouton actif', !/disabled/.test(h) && /Reconduire 15 jours/.test(h));
t('… compteur 0 / 1', h.includes('0 / 1'));
h=html({trialRenewals:1});
t('★ déjà reconduit : bouton désactivé', /disabled/.test(h) && /utilis/.test(h));
t('… compteur 1 / 1', h.includes('1 / 1'));
t('… et il dit quoi faire à la place', /conversion/.test(h));
t('champ absent (vieux registre) → traité comme 0', !/disabled/.test(html({})));

console.log('\n── l\'encart d\'état annonce la suite ──');
const etat=(fc)=>new Function('fc',`${EXP}\n${FMT}\n${BOX}\nreturn _fcTrialStatusHtml(fc);`)(fc);
const J=86400000;
t('essai en cours, jamais reconduit → « encore possible »',
  /encore possible/.test(etat({trialExp:Date.now()+4*J,trialRenewals:0,trialDays:15})));
t('essai en cours, déjà reconduit → « déjà utilisée »',
  /d\u00e9j\u00e0 utilis\u00e9e/.test(etat({trialExp:Date.now()+4*J,trialRenewals:1,trialDays:15})));

console.log('\n── le handler, exécuté ──');
async function run(rep, boum){
  const FC={trialRenewals:0,trialExp:0,trialDays:0,trialPrevu:9}; const el={};
  const mk=(id)=>({outerHTML:'',value:null,disabled:false,textContent:'x',_id:id});
  ['agt-fc-trial-status','agt-fc-trial','agt-fc-renew','agt-fc-renew-btn'].forEach(i=>el[i]=mk(i));
  let toast=null;
  const f=new Function('_FC','_FC_SLUG','document','window','showToast','_fcSyncSum','_fcTrialStatusHtml','_fcTrialLeft','agtLogAccess','out',`
    ${K}\n${HTM}\n${HDL}\nreturn window._fcRenewTrial();`);
  await f(FC,'garraud',{getElementById:(i)=>el[i]||null},
    {_fbRenewTrial:async()=>{ if(boum) throw boum; return rep; }},
    (m)=>{toast=m;},()=>{},()=>'STATUS',()=>7,()=>{},null);
  return {FC,el,toast};
}
let r=await run({renewals:1,trialUntil:Date.now()+15*J});
t('succès : le compteur passe à 1', r.FC.trialRenewals===1);
t('… la nouvelle échéance est posée', r.FC.trialExp>Date.now()+14*J);
t('… trialPrevu est purgé', r.FC.trialPrevu===0);
t('★ les TROIS zones sont repeintes',
  r.el['agt-fc-trial-status'].outerHTML==='STATUS' && r.el['agt-fc-trial'].value===7 && /agt-fc-renew/.test(r.el['agt-fc-renew'].outerHTML));
t('… le bloc repeint est grisé', /disabled/.test(r.el['agt-fc-renew'].outerHTML));
t('… toast de succès', /reconduit/i.test(r.toast||''));

const e=new Error('Essai déjà reconduit une fois.'); e.code='functions/failed-precondition';
r=await run(null,e);
t('★ refus serveur : compteur INCHANGÉ', r.FC.trialRenewals===0);
t('… message explicite, pas un code brut', /refuse la seconde/.test(r.toast||''));
t('… le bloc est repeint depuis l\'état, pas laissé « Un instant… »',
  /Reconduire 15 jours/.test(r.el['agt-fc-renew'].outerHTML));

r=await run(null,new Error('network'));
t('panne réseau : compteur inchangé et bouton rendu', r.FC.trialRenewals===0 && /Reconduire/.test(r.el['agt-fc-renew'].outerHTML));

console.log('\n── miroir client / serveur ──');
const C=readFileSync('/home/claude/mavigne-dev/functions/claims.js','utf8');
t('★ TRIAL_DAYS identique des deux côtés',
  /const TRIAL_DAYS      = 15;/.test(C) && /var _FC_TRIAL_DAYS = 15;/.test(A));
t('★ MAX_RENEW identique des deux côtés',
  /const TRIAL_MAX_RENEW = 1;/.test(C) && /var _FC_TRIAL_MAX  = 1;/.test(A));
console.log('\n'+(ko?`\x1b[31m✗ ${ko} rouge(s) sur ${ok+ko}\x1b[0m`:`\x1b[32m✓ ${ok} vertes, 0 rouge\x1b[0m`));
process.exit(ko?1:0);
