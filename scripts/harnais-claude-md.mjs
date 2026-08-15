// CLAUDE.md doit décrire le code RÉEL. Chaque affirmation vérifiable est vérifiée
// contre les fichiers — un document de continuité qui ment est pire qu'absent.
import { readFileSync as R } from 'fs';
const B='/home/claude/mavigne-dev/';
const MD=R(B+'CLAUDE.md','utf8'), C=R(B+'functions/claims.js','utf8'),
      A=R(B+'src/admin-gt.js','utf8'), AP=R(B+'src/app.js','utf8'),
      SW=R(B+'public/sw.js','utf8'), U=R(B+'src/utils.js','utf8'),
      FJ=R(B+'firebase.json','utf8'), RU=R(B+'firestore.rules','utf8');
let ok=0,ko=0; const t=(n,c)=>{c?(ok++,console.log('  \x1b[32m✓\x1b[0m '+n)):(ko++,console.log('  \x1b[31m✗ '+n+'\x1b[0m'));};

console.log('\n── structure ──');
t('§40 existe et est unique', (MD.match(/^## 40\. /gm)||[]).length===1);
t('§14b enrichi de l\'essai borné', /## 14b[\s\S]{0,4000}L\u2019ESSAI EST BORN\u00c9/.test(MD));
/* ⚠️ NE PAS FIGER LE NUMERO DU CHANTIER. Cette assertion cherchait « §40 » : elle
   a rougi au chantier suivant, dont la checklist s'est posee AVANT en tete de §28
   — ce qui est le bon ordre. On verifie qu'il Y A une checklist, pas laquelle. */
t('§28 ouvre sur une checklist de déploiement',
  /## 28[\s\S]{0,600}AVANT DE D\u00c9PLOYER LE CHANTIER \u00a7\d+/.test(MD));
t('aucun numéro de section en doublon',
  (()=>{const s=[...MD.matchAll(/^## (\d+[a-z]?)\. /gm)].map(m=>m[1]);return new Set(s).size===s.length;})());

console.log('\n── les nombres annoncés sont les vrais ──');
t('TRIAL_DAYS = 15 · dans le code ET dans le doc',
  /const TRIAL_DAYS      = 15;/.test(C) && /`TRIAL_DAYS = 15`/.test(MD));
t('TRIAL_MAX_RENEW = 1 · idem',
  /const TRIAL_MAX_RENEW = 1;/.test(C) && /`TRIAL_MAX_RENEW = 1`/.test(MD));
t('TRIAL_WARN_D = 3 · idem',
  /const TRIAL_WARN_D    = 3;/.test(C) && /`TRIAL_WARN_D = 3`/.test(MD));
t('_FC_TRIAL_DAYS / _FC_TRIAL_MAX existent bien dans admin-gt.js',
  /var _FC_TRIAL_DAYS = 15;/.test(A) && /var _FC_TRIAL_MAX  = 1;/.test(A));
t('le seuil d<=3 du bandeau existe bien dans app.js', /var sous = \(d<=3\)/.test(AP));
/* ⚠️⚠️ REGLE D'OR N°2, APPLIQUEE AU HARNAIS. Ces deux assertions figeaient les
   numeros du chantier §40 : elles ont rougi des le bump suivant, en accusant le
   document alors que c'etait le controle qui etait perime. On LIT les versions
   dans les fichiers, on ne les recopie pas — et on verifie ce qui ne bouge pas :
   que le document ne contienne AUCUN numero de version dans son corps courant. */
const APP_REEL = (R('src/utils.js','utf8')
  .match(/export const APP_VERSION = '([^']+)'/) || [])[1];
const SW_REEL  = (SW.match(/const CACHE_NAME\s*=\s*'mavigne-v([^']+)'/) || [])[1];
t('les deux versions réelles se lisent', !!APP_REEL && !!SW_REEL, APP_REEL + ' / ' + SW_REEL);
t('les versions ne sont PAS recopiées dans le document (règle d\'or n°2)',
  !new RegExp('APP_VERSION\\s*=\\s*.' + APP_REEL).test(MD));

console.log('\n── les affirmations vérifiables ──');
t('★ « rules ignore trial » — c\'est vrai', !/trial_until/.test(RU) && /Aucune r\u00e8gle de `firestore.rules` ne lit/.test(MD));
t('★ « app.js:703 » — saveData refuse bien là',
  AP.split('\n')[702].includes('_MV_LOCKED'));
t('★ les rewrites annoncés existent', /"\/api\/lead"/.test(FJ) && /"\/api\/mise-en-route"/.test(FJ));
t('gtRenewTrial et trialWatch nommés dans le doc ET exportés',
  /gtRenewTrial/.test(MD) && /trialWatch/.test(MD)
  && /exports\.gtRenewTrial/.test(C) && /exports\.trialWatch/.test(C));
t('trialPrevu / trialRenewals documentés et présents',
  /trialRenewals/.test(MD) && /trialPrevu/.test(MD)
  && /trialRenewals/.test(A) && /trialPrevu/.test(A));
t('_guerettech/trial_mails documenté et utilisé',
  /trial_mails/.test(MD) && /_guerettech\/trial_mails/.test(C));
t('8h05 annoncé = cron réel', /8h05/.test(MD) && /schedule:       '5 8 \* \* \*'/.test(C));
t('★ « esc() n\'existe pas dans claims.js » — toujours vrai',
  !/^(const|function) esc/m.test(C) && /_trialEsc/.test(C));

console.log('\n── ce que le doc promet de ne PAS avoir fait ──');
t('smoke/e2e déclarés non joués', /test:smoke.*jamais jou|jamais jou[^\\n]*Playwright|CDN Playwright/.test(MD));
t('★ l\'hypothèse J30 est signalée comme non confirmée',
  /jamais confirm|\u26a0\ufe0f \*\*\u00c0 confirmer\*\*/.test(MD));
t('les 4 harnais sont nommés',
  ['harnais-parcours-prospect','harnais-essai-borne','harnais-reconduction','harnais-bandeau-essai']
    .every(h=>MD.includes(h)));
t('le total d\'assertions annoncé = 58+15+20+15', /108 assertions/.test(MD) && 58+15+20+15===108);

console.log('\n'+(ko?`\x1b[31m✗ ${ko} rouge(s) sur ${ok+ko}\x1b[0m`:`\x1b[32m✓ ${ok} vertes, 0 rouge\x1b[0m`));
process.exit(ko?1:0);
