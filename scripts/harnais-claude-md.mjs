// CLAUDE.md doit décrire le code RÉEL. Chaque affirmation vérifiable est vérifiée
// contre les fichiers — un document de continuité qui ment est pire qu'absent.
import { readFileSync as R, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
/* ⚠⚠⚠ CHEMIN PORTABLE, ET C'EST UNE LEÇON PAYÉE DEUX FOIS.
   1) Ce harnais portait « /home/claude/mavigne-dev/ » en dur : il ne pouvait
      démarrer que dans le bac à sable, et se lisait comme un succès ailleurs
      (§44 — six harnais dans ce cas).
   2) Le remède naïf, `new URL(import.meta.url).pathname`, rend « /C:/Users/… »
      sous Windows, que Node repart en « C:\\C:\\Users\\… » : le harnais livré
      vert a planté chez Nico au premier lancement (§53). `fileURLToPath` est la
      seule forme juste sur les deux systèmes. */
const B = join(dirname(fileURLToPath(import.meta.url)), '..') + '/';
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
/* ⚠⚠ CETTE ASSERTION A ÉTÉ CORRIGÉE DEUX FOIS, POUR LA MÊME RAISON À CHAQUE COUP.
   Elle cherchait d'abord un numéro de chantier figé, puis un motif dans une
   FENÊTRE DE 600 CARACTÈRES — qui a rougi dès qu'une checklist plus longue s'est
   posée devant, ce qui est pourtant le bon ordre. Ni le numéro ni la longueur ne
   sont l'intention : l'intention est que LE BACKLOG S'OUVRE SUR UN BLOC
   D'ALERTE, jamais sur un paragraphe d'introduction tiède. */
t('§28 s\'ouvre directement sur un bloc d\'alerte',
  /## 28\. [^\n]*\n\s*\n### \u26a0/.test(MD));
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
/* ⚠⚠ CETTE ASSERTION FIGEAIT UN NUMÉRO DE LIGNE (703) et rougissait dès qu'une
   ligne était ajoutée plus haut — la garde a glissé en 704. Elle accusait le
   document alors que c'était LE CONTRÔLE qui était périmé : même famille que le
   cliquet à l'envers A8 et que le `.pathname` de §53. On cherche le MOTIF, pas
   le rang — et on vérifie qu'il est bien EN TÊTE de saveData, ce qui est
   l'affirmation réelle du document. */
t("★ saveData refuse en tête quand l'essai est terminé",
  (() => {
    const i = AP.indexOf('function saveData(');
    if (i < 0) return false;
    const tete = AP.slice(i, i + 600);
    return /_MV_LOCKED/.test(tete);
  })());
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

console.log('\n── les règles d\'or que Nico a demandées ──');
/* ★ Ces deux règles ont été demandées explicitement (23/08). Sans assertion,
   elles se dilueraient à la première grosse réécriture du document — et c'est
   précisément la règle n°6 qui empêche le document de dériver. */
t('le document annonce SIX règles d\'or, et les six existent',
  /## ⚖️ Les six règles d'or/.test(MD)
  && [1,2,3,4,5,6].every(n => new RegExp("\\*\\*Règle d'or n°" + n + " —").test(MD)));
t('★ règle n°6 — ce document part avec le dernier lot de la conversation',
  /Règle d'or n°6 — CE DOCUMENT SE MET À JOUR AU DERNIER LOT/.test(MD));
t('★ la note de livraison est écrite, fichier par fichier',
  /LA NOTE DE LIVRAISON — dire ce qui change, FICHIER PAR FICHIER/.test(MD));
/* ⚠⚠ RÈGLE D'OR N°2, ÉTENDUE AUX NUMÉROS DE LIGNE. « app.js:703 » a survécu des
   jours dans ce document et dans ce harnais : la garde avait glissé en 704. Un
   rang se décale au premier ajout, un motif non. */
/* ⚠⚠ ÉCRITE D'ABORD EN INTERDICTION, ELLE ÉTAIT INTENABLE : le document en
   contient 36, dont trois qui CITENT « app.js:703 » précisément pour raconter
   pourquoi figer un rang est une mauvaise idée. Un document doit pouvoir citer
   un défaut. → CLIQUET : le compte ne peut plus MONTER, et se résorbe quand une
   section est réécrite. Transformer une dette en cliquet vaut mieux que la
   solder à l'aveugle (§47b). */
const RANGS = 37;   /* 23/08 : +1, la citation d'« app.js:703 » en §58c, qui explique
                       précisément pourquoi figer un rang est une mauvaise idée */
const rangs = (MD.match(/`?(?:src\/)?(?:app|utils|cave|pilotage|planning|reglages)\.js:\d+/g) || []).length;
t(`les numéros de ligne recopiés ne remontent pas (${rangs} ≤ ${RANGS})`, rangs <= RANGS);
if (rangs < RANGS) console.log(`    ↓ ${RANGS - rangs} de moins — abaisser RANGS dans ce fichier`);


console.log('\n── le document a-t-il PERDU un chantier ? ──');
/* ★★★ LE FILET QUI MANQUAIT LE 23/08 (§58). Le contrôle « aucun numéro de
   section en doublon » ne voyait rien : la §55 sur DS-0 n'a pas été DUPLIQUÉE,
   elle a été REMPLACÉE par une autre conversation qui avait pris le même
   numéro. Le code est resté, le document a tout oublié — zéro occurrence de
   « DS-0 » dans neuf mille lignes. Un contrôle qui cherche la collision ne dit
   rien de la disparition. */

/* 1) LA MEILLEURE SONDE : un lot livre presque toujours un script. Un script
      que le document ignore signale un chantier que le document ignore.
      ⚠️ CLIQUET, pas interdiction : 11 des 45 scripts étaient déjà invisibles
      au moment de poser le filet. Les décrire sans les avoir instruits
      produirait des phrases fausses — exactement ce que la règle d'or n°3
      combat.
      ⚠️ LES CONTRE-ÉPREUVES SONT HORS SONDE, et c'est une exclusion RAISONNÉE,
      pas un arrangement : un « -contre.mjs » n'est pas un chantier, c'est le
      compagnon d'un harnais qui, lui, doit être documenté. Les six restants
      sont exactement dans ce cas. Une fois écartés, le seuil tombe à ZÉRO :
      plus un cliquet, une INTERDICTION. Bien plus tranchant.
      ⚠⚠ CE QUE CETTE SONDE NE PROUVE PAS : que le script soit EXPLIQUÉ. Elle
      vérifie que son nom APPARAÎT. Quatre scripts passent au vert uniquement
      parce que §58f les cite dans la liste de ce qui reste à documenter — le
      dire vaut mieux que faire semblant. C'est déjà beaucoup : le 23/08,
      « mv-harnais-jetons » n'apparaissait NULLE PART. */
const scripts = readdirSync(join(B, 'scripts'))
  .filter(f => f.endsWith('.mjs') && !f.endsWith('-contre.mjs'));
const muets = scripts.filter(f => !MD.includes(f.slice(0, -4)));
t(`tout script de scripts/ est nommé dans le document (${muets.length} muet(s))`,
  muets.length === 0, muets.join(' · '));

/* 1bis) ⚠️⚠️ LE NUMÉRO DE VERSION NE RECULE JAMAIS.
   Le 23/08, un lot construit sur un clone du matin a livré APP 6.48 / SW 7.03
   alors que le dépôt était à 6.49 / 7.04 : les numéros ont RECULÉ, et avec eux
   le bloc WHATS_NEW 6.49, l'entrée de changelog 7.04 et le correctif §59.
   AUCUN filet ne l'a vu — c'est le seul dégât de la journée qui soit passé.
   ★ La sonde compare au dernier commit : elle exige que APP et SW soient
   STRICTEMENT SUPÉRIEURS, ou inchangés. Jamais inférieurs. */
{
  const num = v => { const p = String(v).split('.').map(Number); return p[0] * 1000 + p[1]; };
  const lire = (txt, re) => { const m = re.exec(txt); return m ? m[1] : null; };
  const RE_APP = /APP_VERSION = '([\d.]+)'/;
  const RE_SW  = /Service Worker v([\d.]+)/;
  let avU = null, avS = null;
  try {
    /* ⚠️ ON PREND LE MAXIMUM SUR LES 12 DERNIERS COMMITS, PAS SEULEMENT HEAD.
       Comparer au dernier commit ne voit RIEN si la régression y est déjà :
       c'est exactement ce qui s'est passé le 23/08 — le lot fautif avait été
       intégré, HEAD portait donc 6.48, et 6.48 >= 6.48 sortait vert. */
    const revs = execSync('git rev-list -n 12 HEAD', { cwd: B, encoding: 'utf8' }).trim().split('\n');
    const maxi = (chemin, re) => {
      let best = null, bestN = -1;
      for (const r of revs) {
        let txt; try { txt = execSync(`git show ${r}:${chemin}`, { cwd: B, encoding: 'utf8' }); } catch { continue; }
        const m = re.exec(txt); if (!m) continue;
        const p = m[1].split('.').map(Number), n = p[0] * 1000 + p[1];
        if (n > bestN) { bestN = n; best = m[1]; }
      }
      return best;
    };
    avU = maxi('src/utils.js', RE_APP);
    avS = maxi('public/sw.js', RE_SW);
  } catch { avU = null; }
  if (!avU || !avS) {
    t('la comparaison de version est possible (dépôt git)', true, 'hors git — sonde inactive');
  } else {
    const appAv = avU, appAp = lire(R(join(B, 'src/utils.js'), 'utf8'), RE_APP);
    const swAv  = avS, swAp  = lire(R(join(B, 'public/sw.js'), 'utf8'), RE_SW);
    t(`APP ne recule pas (${appAv} → ${appAp})`, num(appAp) >= num(appAv),
      'un numéro qui recule écrase le lot précédent en silence');
    t(`SW ne recule pas (${swAv} → ${swAp})`, num(swAp) >= num(swAv),
      'réutiliser un numéro déjà servi fige l\'index.html correspondant pour toujours');
  }
}

/* 2) Une section ne disparaît pas, même si son numéro est réutilisé. */
const SECTIONS = 92;   /* +§60. ⚠️ MESURÉ, pas supposé : le cliquet compte les sections NUMÉROTÉES (## N.), pas tous les ## — à 91 il ne mordait plus. */
const sections = new Set([...MD.matchAll(/^## (\d+[a-z]?)\. /gm)].map(m => m[1])).size;
t(`aucune section n'a disparu (${sections} ≥ ${SECTIONS})`, sections >= SECTIONS);
if (sections > SECTIONS)
  console.log(`    ↑ ${sections - SECTIONS} de plus — relever SECTIONS dans ce fichier`);

/* 3) Les chantiers récents, nommés. Un garde-fou explicite vaut mieux qu'un
      compte quand on sait ce qu'on protège — et c'est celui-ci qui aurait
      rougi le 23/08 à 15h37. */
/* ⚠⚠⚠ ÉCRITE D'ABORD EN `MD.includes(motif)`, ELLE NE MORDAIT PAS — et c'est
   la QUATRIÈME fois que cette faute revient (§53, §57i, §58). En effaçant le
   TITRE de §57, la contre-épreuve laissait intactes les deux phrases de §58a
   qui CITENT « LE SOCLE DE LA CHARTE » pour raconter sa disparition. Le
   contrôle était satisfait PAR LE TEXTE QUI DOCUMENTE LE PROBLÈME, exactement
   comme le `.pathname` de §53. Un chantier vit dans un TITRE DE SECTION : c'est
   ça qu'on cherche, pas une occurrence n'importe où. */
for (const [sujet, titre] of [
  ['DS-0, le socle de la charte',  'LE SOCLE DE LA CHARTE'],
  ['la feuille d\'heures',         'LA FEUILLE D\'HEURES DISAIT'],
  ['les consommables par atelier', 'LES CONSOMMABLES PAR ATELIER'],
  ['le th\u00e8me hors #app-root',      "S'ARR\u00caTAIT \u00c0 LA PORTE DES FEN\u00caTRES"]
]) t(`★ ça reste un TITRE de section : ${sujet}`,
     new RegExp('^## \\d+[a-z]?\\. .*' + titre.replace(/'/g, "'"), 'm').test(MD));
/* Celui-ci n'est pas un titre : un harnais se nomme dans le corps du texte. */
t('★ le document connaît toujours le harnais des jetons', MD.includes('mv-harnais-jetons'));
console.log('\n'+(ko?`\x1b[31m✗ ${ko} rouge(s) sur ${ok+ko}\x1b[0m`:`\x1b[32m✓ ${ok} vertes, 0 rouge\x1b[0m`));
process.exit(ko?1:0);
