/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LOT 1 : L'ECHELLE DE TEXTE DU PILOTAGE
   Lancer :  node scripts/preflight.mjs && node mv-harnais-echelle.mjs src/pilotage.js
   Le preflight verifie la MECANIQUE. Ce harnais verifie le SENS : qu'il ne
   reste aucune taille inventee sur place, et qu'aucun pas ne pointe dans le vide.
   §34e : on ne redouble pas ici ce que le preflight fait deja.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';

const F = process.argv[2] || 'src/pilotage.js';
const BRUT = readFileSync(F, 'utf8');

/* §34g — LES COMMENTAIRES NE SONT PAS UNE PREUVE. Une assertion satisfaite par
   la phrase qui documente la correction ne teste rien. On lit le code seul. */
const SRC = BRUT.split('\n').filter(l => !l.trimStart().startsWith('//')).join('\n');

const PAS = [['hero','40px'],['xxl','31px'],['xl','27px'],['lg','23px'],['md','20px'],
             ['sm','17px'],['base','14px'],['txt','12.5px'],['micro','11px'],
             ['lbl','10.5px'],['nano','9.5px']];

let ok = 0, ko = 0;
const t = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail ? '\n      → ' + detail : '')); }
};

console.log('\n── L\'ECHELLE DE TEXTE — ' + F + '\n');

/* 1. Les onze pas sont declares, avec leur valeur exacte. */
for (const [nom, val] of PAS) {
  t(`le pas --pt-${nom} vaut ${val}`, SRC.includes(`--pt-${nom}:${val};`));
}

/* 2. Ils sont declares DANS _pilCssV2, sur :root — pas ailleurs, pas deux fois. */
const corpsCss = (SRC.match(/function _pilCssV2\(\)\{[\s\S]*?\n\}/) || [''])[0];
t('les pas sont declares dans _pilCssV2', PAS.every(([n]) => corpsCss.includes(`--pt-${n}:`)));
t('ils sont poses sur :root (les bulles Leaflet sortent de la page)',
  /\+':root\{'/.test(corpsCss));
t('la feuille n\'est posee qu\'une fois', (SRC.match(/id='pil-css-v2'/g) || []).length === 1);

/* 3. AUCUNE taille inventee sur place. C'est le cliquet du lot. */
const enDur = [];
BRUT.split('\n').forEach((l, i) => {
  if (l.trimStart().startsWith('//')) return;
  const nu = l.replace(/font-size:var\(--pt-[a-z]+,[0-9.]+px\)/g, '')
              .replace(/--pt-[a-z]+:[0-9.]+px;/g, '');
  if (/font-size:[0-9.]+px/.test(nu)) enDur.push((i + 1) + ' : ' + l.trim().slice(0, 80));
});
t('aucune taille de texte ecrite en dur', enDur.length === 0,
  enDur.length ? enDur.length + ' restante(s), dont ' + enDur[0] : '');

/* 4. Aucun pas invoque qui ne soit declare : une faute de frappe passerait
      inapercue, le repli rendant l'affichage juste et le pas mort. */
const declares = new Set(PAS.map(p => p[0]));
const invoques = new Set([...SRC.matchAll(/var\(--pt-([a-z]+)\s*,/g)].map(m => m[1]));
t('aucun pas invoque hors de la liste', [...invoques].every(x => declares.has(x)),
  [...invoques].filter(x => !declares.has(x)).join(', '));
t('aucun pas declare sans emploi', [...declares].every(x => invoques.has(x)),
  [...declares].filter(x => !invoques.has(x)).join(', '));

/* 5. Chaque appel porte son repli. Une variable inconnue rend la declaration
      invalide : le texte retombe a la taille heritee, en silence et partout. */
const sansRepli = [...SRC.matchAll(/var\(--pt-[a-z]+\)/g)].length;
t('chaque appel porte son repli', sansRepli === 0, sansRepli + ' appel(s) sans repli');
const bonRepli = [...SRC.matchAll(/var\(--pt-([a-z]+),([0-9.]+px)\)/g)]
  .filter(m => { const p = PAS.find(x => x[0] === m[1]); return p && p[1] !== m[2]; });
t('chaque repli redit la valeur du pas', bonRepli.length === 0,
  bonRepli.slice(0, 2).map(m => m[0]).join(' · '));

/* 6. RIEN D'AUTRE NE BOUGE. Le lot est typographique : il ne touche ni les
      selecteurs vises par la visite guidee, ni les cles d'onglet. */
for (const sel of ['pil-tile', 'data-pid', 'pil-cockpit-card', 'pil-dec', 'pil-th'])
  t(`« ${sel} » intact (vise par la visite guidee / C22)`, SRC.includes(sel));
t('les huit cles d\'onglet sont intactes',
  ['auj','an','avc','equ','sim','cav','eco','cfm'].every(k => new RegExp(`\\['${k}',`).test(SRC)));
t('le nombre de catch vides n\'a pas bouge (cliquet C14)',
  (BRUT.match(/catch\s*\([^)]*\)\s*\{\s*\}/g) || []).length === 15);

console.log(`\n  ${ok} vertes, ${ko} rouges\n`);
process.exit(ko ? 1 : 0);
