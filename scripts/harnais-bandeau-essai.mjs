import { readFileSync } from 'fs';
const A=readFileSync('/home/claude/mavigne-dev/src/app.js','utf8');
const H=readFileSync('/home/claude/mavigne-dev/index.html','utf8');
const S=readFileSync('/home/claude/mavigne-dev/public/sw.js','utf8');
const C=readFileSync('/home/claude/mavigne-dev/functions/claims.js','utf8');
let ok=0,ko=0; const t=(n,c)=>{c?(ok++,console.log('  \x1b[32m✓\x1b[0m '+n)):(ko++,console.log('  \x1b[31m✗ '+n+'\x1b[0m'));};
const fn=A.match(/function _mvTrialBanner\(\)\{[\s\S]*?\n\}/)[0];

function rend(d,lvl){
  let html=null,cls=[];
  const bar={style:{},classList:{add:(c)=>cls.push(c),remove:()=>{}},set innerHTML(v){html=v;},get innerHTML(){return html;}};
  new Function('document','_mvTrial','currentUser',`${fn}\n_mvTrialBanner();`)(
    {getElementById:(i)=>i==='mv-trial-bar'?bar:{classList:{add:()=>{},remove:()=>{}}},
     body:{classList:{add:()=>{},remove:()=>{}}}},
    ()=>({active:true,expired:false,daysLeft:d,level:lvl}), {});
  return html||'';
}
console.log('\n── le bandeau ──');
let h=rend(12,'ok');
t('J-12 : pas de sous-ligne (on n\'alarme pas pour rien)', !/consultable/.test(h) && /12 jours restants/.test(h));
h=rend(3,'warn');
t('★ J-3 : la sous-ligne apparaît', /consultable/.test(h));
t('★ … elle dit que rien ne disparaît', /Tout reste consultable/.test(h));
t('★ … et que Nicolas est prévenu tout seul', /pr\u00e9venu automatiquement/.test(h));
h=rend(1,'urgent');
t('dernier jour : libellé adapté + sous-ligne', /Dernier jour/.test(h) && /consultable/.test(h));
t('le bouton Continuer survit à tous les cas',
  [rend(12,'ok'),rend(3,'warn'),rend(1,'urgent')].every(x=>/_mvContactGo\(\)/.test(x)));
t('un seul <b> de libellé (pas de doublon de structure)', (rend(3,'warn').match(/<b>/g)||[]).length===1);

console.log('\n── miroir du seuil ──');
t('★ le bandeau promet à J-3, la veille envoie à J-3',
  /const TRIAL_WARN_D    = 3;/.test(C) && /var sous = \(d<=3\)/.test(A));

console.log('\n── écran de fin d\'essai ──');
t('dit la lecture seule', /saisie<\/b> est suspendue/.test(H));
t('dit que les données restent', /donn&#233;es sont conserv&#233;es/.test(H));
t('★ dit que la reconduction existe', /rouvrir l&#39;&#233;criture pour quinze jours/.test(H));
t('★ ne promet plus « 15 jours » dans le titre (30 après reconduction)',
  /Votre essai est termin&#233;<\/div>/.test(H));

console.log('\n── bump ──');
const v=[...S.matchAll(/v6\.66/g)].length;
t('4 porteurs alignés (en-tête, CACHE_NAME, 2 console.log)', v>=4);
t('aucun v6.65 résiduel hors journal',
  !S.split('\n').some(l=>l.includes('v6.65')&&!l.trim().startsWith('//')));
t('APP_VERSION délibérément inchangé (6.13)',
  /APP_VERSION = '6\.13'/.test(readFileSync('/home/claude/mavigne-dev/src/utils.js','utf8')));
console.log('\n'+(ko?`\x1b[31m✗ ${ko} rouge(s) sur ${ok+ko}\x1b[0m`:`\x1b[32m✓ ${ok} vertes, 0 rouge\x1b[0m`));
process.exit(ko?1:0);
