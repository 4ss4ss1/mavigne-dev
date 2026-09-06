import { readFileSync } from 'fs';
// ★ RACINE DEDUITE DU FICHIER, JAMAIS DU REPERTOIRE COURANT NI D'UN CHEMIN ABSOLU.
//   Regle posee en §44c : six harnais portaient « /home/claude/mavigne-dev/ » en dur —
//   un chemin de bac a sable. Chez Nico et en CI ils sortaient en ENOENT, et deux
//   d'entre eux etaient VERTS ici : un filet qui ne demarre pas se lit comme un succes.
const R = new URL('../', import.meta.url).pathname;
const A=readFileSync(R+'src/app.js','utf8');
const H=readFileSync(R+'index.html','utf8');
const S=readFileSync(R+'public/sw.js','utf8');
const C=readFileSync(R+'functions/claims.js','utf8');
let ok=0,ko=0; const t=(n,c)=>{c?(ok++,console.log('  \x1b[32m✓\x1b[0m '+n)):(ko++,console.log('  \x1b[31m✗ '+n+'\x1b[0m'));};
const fn=A.match(/function _mvTrialBanner\(\)\{[\s\S]*?\n\}/)[0];

function rend(d,lvl){
  let html=null,cls=[];
  const bar={style:{},classList:{add:(c)=>cls.push(c),remove:()=>{}},set innerHTML(v){html=v;},get innerHTML(){return html;}};
  // ⚠️ _mvIcon EST ARRIVE APRES CE HARNAIS (lot DS-1, 16/08). Sans ce stub le
  //    rendu leve ReferenceError et le script sort en exit 1 AVANT la premiere
  //    assertion : sept verifications du bandeau ne protegeaient plus rien, et
  //    la sortie ressemblait a un simple rouge. Le stub rend un marqueur inerte,
  //    pas une chaine vide : on veut voir si l'icone est bien posee.
  new Function('document','_mvTrial','currentUser','_mvIcon',`${fn}\n_mvTrialBanner();`)(
    {getElementById:(i)=>i==='mv-trial-bar'?bar:{classList:{add:()=>{},remove:()=>{}}},
     body:{classList:{add:()=>{},remove:()=>{}}}},
    ()=>({active:true,expired:false,daysLeft:d,level:lvl}), {},
    (nom,taille)=>'<svg data-ic="'+nom+'" data-px="'+taille+'"></svg>');
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

// ★★ CE BLOC ETAIT UNE PHOTO DU LOT DU 14/08, PAS UN TEST DE COMPORTEMENT.
//    Il exigeait « v6.66 » quatre fois, « aucun v6.65 » et « APP_VERSION == 6.13 ».
//    Trois assertions vraies un jour et fausses tous les autres : au premier bump
//    suivant, le harnais rougissait sans qu'aucune regression n'ait eu lieu — c'est
//    §44c mot pour mot, « un harnais ecrit pour un lot devient un frein au suivant ».
//    Rebase sur l'INVARIANT que le lot voulait proteger : les quatre porteurs du SW
//    disent le meme numero, et aucun numero anterieur ne traine hors du journal.
//    L'assertion sur APP_VERSION est SUPPRIMEE : « delibérément inchangé » n'a de sens
//    que dans son lot d'origine, jamais apres.
console.log('\n── bump ──');
const vSW=(S.match(/^\/\/ MA VIGNE — Service Worker v(\d+\.\d+)/m)||[])[1];
t('l\'en-tete du SW porte un numero de version', !!vSW);
if(vSW){
  const porteurs=[
    new RegExp('^// MA VIGNE — Service Worker v'+vSW.replace('.','\\.'),'m'),
    new RegExp("CACHE_NAME\\s*=\\s*'mavigne-v"+vSW.replace('.','\\.')+"'"),
  ];
  const logs=[...S.matchAll(new RegExp("console\\.log\\('\\[SW\\] Ma Vigne v"+vSW.replace('.','\\.'),'g'))].length;
  t('4 porteurs alignés sur v'+vSW+' (en-tête, CACHE_NAME, 2 console.log)',
    porteurs.every(re=>re.test(S)) && logs>=2);
  // Un numero ANTERIEUR hors du journal = un porteur oublie au bump precedent.
  const [maj,min]=vSW.split('.').map(Number);
  const prec='v'+maj+'.'+(min-1);
  t('aucun '+prec+' résiduel hors journal',
    !S.split('\n').some(l=>l.includes(prec)&&!l.trim().startsWith('//')));
}
console.log('\n'+(ko?`\x1b[31m✗ ${ko} rouge(s) sur ${ok+ko}\x1b[0m`:`\x1b[32m✓ ${ok} vertes, 0 rouge\x1b[0m`));
process.exit(ko?1:0);
