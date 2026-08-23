/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LE THÈME ATTEINT-IL TOUT LE DOCUMENT ? (§59)
   Lancer : node scripts/mv-harnais-theme.mjs
   Contre-épreuves : node scripts/mv-harnais-theme.mjs --contre

   Le défaut qu'il interdit : #app-root est fermé ligne 3197 d'index.html. Les
   13 overlays statiques, les 37 .modal qu'ils contiennent et tous les overlays
   posés en JS par document.body.appendChild sont ses FRÈRES. Un thème posé sur
   #app-root seul les laisse en clair — une modale BLANCHE au milieu d'une
   application sombre, sans une erreur et sans un avertissement.

   ⚠️ CE QU'IL NE FAIT PAS : regarder un écran. Il vérifie que les variables
      peuvent atteindre les overlays, pas que le résultat soit beau.
   ─────────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
/* fileURLToPath, jamais new URL().pathname : celui-ci rend « /C:/Users/… »
   sous Windows et Node le repart en « C:\C:\Users\… » (§53). */
const B = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = f => readFileSync(join(B, f), 'utf8');

let ok = 0, ko = 0;
const R = [];
const t = (nom, c, d) => { R.push({ nom, ok: !!c, d: d || '' }); c ? ok++ : ko++; };

function controles(CSS, UTILS, APP, IDX) {
  R.length = 0; ok = 0; ko = 0;
  const nu = CSS.replace(/\/\*[\s\S]*?\*\//g, '');

  /* ⚠️⚠️ CE DÉCOUPAGE DOIT ENTRER DANS LES @media, ET LA PREMIÈRE VERSION N'Y
     ENTRAIT PAS. Elle n'enregistrait un bloc qu'au retour de la profondeur à
     zéro : un `@media(prefers-color-scheme:dark){ #app-root…{…} }` était donc
     vu comme UN seul bloc dont le sélecteur est « @media(…) » — qui ne contient
     pas « #app-root » et passait au travers. Or c'est là que vit la MOITIÉ des
     déclarations de thème : le mode auto de l'OS. Le trou a été trouvé par une
     contre-épreuve qui ne mordait pas, pas par une relecture.
     On empile les préambules et on ne retient que les blocs FEUILLES — ceux
     dont le corps ne contient plus d'accolade. */
  const blocs = [];
  const pile = [];
  let deb = 0;
  for (let i = 0; i < nu.length; i++) {
    if (nu[i] === '{') { pile.push([nu.slice(deb, i).trim(), i]); deb = i + 1; }
    else if (nu[i] === '}') {
      const ouvert = pile.pop();
      if (ouvert) {
        const corps = nu.slice(ouvert[1] + 1, i);
        if (!corps.includes('{')) blocs.push([ouvert[0].replace(/^[\s;}]+/, ''), corps]);
      }
      deb = i + 1;
    }
  }
  /* ⚠️⚠️ CES TROIS CONTRÔLES COMPTENT LES MANQUANTS, ILS NE CHERCHENT PAS UN
     EXEMPLE. Première version : `/#app-root\[data-theme="dark"\],:root…/.test()`
     — vraie dès qu'UN bloc était correct. Or il y en a cinq (les couleurs
     principales, --or-tx, --vin-tx, --sheen, --mv-sk-glow) : en casser un
     laissait l'assertion verte, satisfaite par les quatre autres. Troisième
     rencontre avec cette faute en deux jours (§57i, §58e). On compte les
     fautifs et on exige zéro. */
  /* ⚠️ SEULS LES BLOCS QUI DÉCLARENT DES VARIABLES sont concernés. Sept règles
     du type « #app-root[data-theme="dark"] .jms-periode{…} » stylent des
     descendants de #app-root : elles n'ont RIEN à faire sur :root, et les
     compter faisait rougir du code parfaitement sain. Vérifié : aucune d'elles
     ne vise un overlay (.dcnt, .hv2-card-or, .jms-periode, .parcel-label,
     .map-lbl-toggle, .sdp-check, .trat-parc-tag). */
  const oublis = (motif) => blocs.filter(([sel, corps]) =>
    /#app-root/.test(sel) && motif.test(sel) && !/:root/.test(sel)
    && /(^|[;{\s])--[a-z0-9-]+\s*:/.test(corps)).map(([sel]) => sel.slice(0, 46));
  const oA = oublis(/\[data-theme="dark"\]/);
  t(`aucun bloc « attribut » n'oublie :root (${oA.length})`, oA.length === 0, oA.join(' · '));
  const oB = oublis(/:not\(\[data-theme="light"\]\)/);
  t(`aucun bloc « auto OS » n'oublie :root (${oB.length})`, oB.length === 0, oB.join(' · '));

  const enfermees = new Set();
  for (const [sel, corps] of blocs) {
    if (!/#app-root/.test(sel)) continue;
    if (/:root/.test(sel)) continue;               // il emmène :root : très bien
    for (const m of corps.matchAll(/(--[a-z0-9-]+)\s*:/g)) enfermees.add(m[1]);
  }
  t(`aucune variable de thème enfermée sous #app-root (${enfermees.size})`,
    enfermees.size === 0, [...enfermees].slice(0, 8).join(' '));

  /* ── 3. Partout où data-theme se pose, il se pose sur LES DEUX ─────────── */
  /* ⚠️ On compte les deux cibles SÉPARÉMENT et on exige l'égalité. Une première
     version comparait un total à une moitié — elle affichait « 2/4 » et passait
     au vert : un contrôle qu'on ne peut pas lire ne se relit pas. */
  for (const [nom, src] of [['utils.js', UTILS], ['app.js', APP]]) {
    const total = [...src.matchAll(/setAttribute\(\s*'data-theme'\s*,/g)].length;
    const html = [...src.matchAll(/(?:documentElement|html)\.setAttribute\(\s*'data-theme'\s*,/g)].length;
    const app = total - html;
    t(`${nom} : chaque pose sur #app-root a la sienne sur <html> (${app} et ${html})`,
      app === html && total > 0, `${total} poses au total`);
  }
  t('utils.js retire l\'attribut des DEUX en mode auto',
    /removeAttribute\('data-theme'\)[\s\S]{0,120}html\.removeAttribute\('data-theme'\)/.test(UTILS));

  /* ── 4. Le mur existe bien : on ne corrige pas un problème imaginaire ──── */
  const i = IDX.indexOf('/#app-root');
  t('les overlays sont bien HORS de #app-root (le défaut était réel)',
    i > 0 && IDX.slice(i).includes('class="modal'),
    i > 0 ? IDX.slice(i).split('class="modal').length - 1 + ' .modal après la fermeture' : '');
  return R;
}

const F = () => [lire('src/styles.css'), lire('src/utils.js'), lire('src/app.js'), lire('index.html')];

if (process.argv.includes('--contre')) {
  console.log('\n── CONTRE-ÉPREUVES ──\n');
  /* ⚠️ Chaque mutation est vérifiée DEUX fois : qu'elle a mordu le texte, et
     que c'est bien l'assertion VISÉE qui rougit. Une mutation qui casse autre
     chose passerait pour bonne (§57i, §58e). */
  const MUT = [
    ['le bloc sombre « attribut » perd :root',
      f => [f[0].replace('#app-root[data-theme="dark"],:root[data-theme="dark"]{',
                         '#app-root[data-theme="dark"]{'), f[1], f[2], f[3]], "bloc \u00ab attribut \u00bb"],
    ['le bloc sombre « auto OS » perd :root',
      f => [f[0].replace('#app-root:not([data-theme="light"]),:root:not([data-theme="light"]){',
                         '#app-root:not([data-theme="light"]){'), f[1], f[2], f[3]], "bloc \u00ab auto OS \u00bb"],
    ['applyTheme ne pose plus rien sur <html>',
      f => [f[0], f[1].replace(/if\(html\) html\.setAttribute\('data-theme', '(dark|light)'\);/g, ''), f[2], f[3]], 'utils.js :'],
    ['le mode auto oublie de retirer l\'attribut de <html>',
      f => [f[0], f[1].replace("if(html) html.removeAttribute('data-theme');", ''), f[2], f[3]], 'retire l\'attribut'],
    ['un nouveau bloc enferme une variable sous #app-root',
      f => [f[0] + '\n#app-root[data-theme="dark"] .zz{--bg-card:#000;}\n', f[1], f[2], f[3]], 'enfermée'],
    /* ⚠️ Celle-ci vise le trou trouvé le 23/08 : un bloc enfermé À L'INTÉRIEUR
       d'un @media. Le premier découpage ne voyait pas dedans, et la moitié des
       déclarations de thème y vivent. */
    ['un bloc enferme une variable DANS un @media',
      f => [f[0] + '\n@media(prefers-color-scheme:dark){#app-root .zz2{--bg-card:#000;}}\n', f[1], f[2], f[3]], 'enfermée']
  ];
  let m = 0, r = 0;
  const base = F();
  if (controles(...base).some(x => !x.ok)) { console.log('  ✗ pas vert au départ\n'); process.exit(1); }
  for (const [nom, mute, motif] of MUT) {
    const f = mute(F());
    if (f.every((x, k) => x === base[k])) { console.log(`  ✗ ${nom} — mutation sans effet`); r++; continue; }
    const rouges = controles(...f).filter(x => !x.ok && x.nom.includes(motif));
    if (rouges.length) { console.log(`  ✓ ${nom}\n      → rougit : « ${rouges[0].nom} »`); m++; }
    else { console.log(`  ✗ ${nom} — rien de « ${motif} » n'a rougi`); r++; }
  }
  console.log(`\n  ${m} mordent, ${r} ne mordent pas\n`);
  process.exit(r ? 1 : 0);
}

console.log('\n── LE THÈME ATTEINT-IL TOUT LE DOCUMENT ? ──\n');
for (const x of controles(...F()))
  console.log(`  ${x.ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${x.nom}${x.d ? '\n      → ' + x.d : ''}`);
console.log(`\n  ${ok} vertes, ${ko} rouges\n`);
process.exit(ko ? 1 : 0);
