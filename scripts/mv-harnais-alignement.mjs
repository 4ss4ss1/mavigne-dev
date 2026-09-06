/* ══════════════════════════════════════════════════════════════════════
   HARNAIS — ALIGNEMENT DU CUVIER (CUV-2)

   Demande explicitement par Nico : « rien ne doit se chevaucher ».

   ⚠️⚠️ CE QUE CE CONTROLE NE FAIT PAS : il ne mesure AUCUN pixel. Il n'y a
   pas de navigateur dans le bac a sable, donc rien ici ne prouve qu'un
   texte tient a l'ecran. Ce qu'il verifie, ce sont les quatre regles CSS
   dont l'absence CAUSE un chevauchement en flexbox :

     1. min-width:0 sur tout conteneur flex portant du texte variable.
        Sans lui, un flex-item refuse de descendre sous la largeur de son
        contenu : un nom long pousse ses voisins HORS de la carte. C'est la
        cause n°1 des debordements en flex, et elle est invisible tant
        qu'on teste avec des noms courts.
     2. nowrap + overflow:hidden + text-overflow:ellipsis, ensemble, sur
        toute ligne censee tenir sur une ligne. Les trois ou aucun :
        nowrap seul deborde, overflow seul coupe net sans point de suite.
     3. flex-shrink:0 sur les colonnes de droite, pour qu'un nom long ne
        les ecrase pas.
     4. AUCUNE height fixe sur un bloc de texte — c'est ce qui tranchait
        les noms au milieu d'une lettre dans la maquette.

   La verification a l'oeil reste NECESSAIRE et n'est pas remplacee.
   ══════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(ICI, '..', 'src', 'cave.js'), 'utf8');

let ok = 0, ko = 0;
const dit = [];
const T = (n, c, d) => c ? ok++ : (ko++, dit.push('  ✗ ' + n + (d ? ' — ' + d : '')));

/* ── on extrait les regles, en blanchissant les commentaires : un
   commentaire ne doit JAMAIS satisfaire une assertion (§53, cinq fois). ── */
/* ⚠️ La borne haute allait a '.mvv-ftot-s{' : la derniere regle etait donc
   HORS du texte analyse, et deux assertions la declaraient « absente ».
   Un controle qui coupe sa propre zone de lecture invente des defauts. */
const _d = SRC.indexOf('.mvv-tools{');
const cssBrut = SRC.slice(_d, SRC.indexOf('`;', _d));
const css = cssBrut.replace(/\/\*[\s\S]*?\*\//g, ' ');
T('C0 le bloc CSS du Cuvier a bien ete trouve', css.length > 1500, css.length + ' caracteres');

function regle(sel) {
  const m = css.match(new RegExp('\\' + sel + '\\s*\\{([^}]*)\\}'));
  return m ? m[1] : null;
}
function a(sel, prop, nom) {
  const r = regle(sel);
  if (r === null) { ko++; dit.push('  ✗ ' + nom + ' — selecteur ' + sel + ' absent'); return; }
  T(nom, r.indexOf(prop) !== -1, sel + ' = {' + r.trim().slice(0, 60) + '…}');
}

/* ── 1. min-width:0 sur les conteneurs flex qui portent du texte ────── */
[['.mvv-hd', 'la ligne entiere'],
 ['.mvv-mid', 'la colonne du milieu'],
 ['.mvv-pick', 'la ligne a cocher'],
 ['.mvv-pick-b', 'le corps de la ligne a cocher'],
 ['.mvv-fusrow', 'la ligne des fusionnees'],
 ['.mvv-seg', 'le segment de tri']
].forEach(([sel, quoi]) => a(sel, 'min-width:0', 'A1 min-width:0 sur ' + quoi));

/* ── 2. le trio nowrap + hidden + ellipsis, ENSEMBLE ────────────────── */
['.mvv-nom', '.mvv-sub', '.mvv-pick-n', '.mvv-pick-m', '.mvv-ref-n',
 '.mvv-cell-r', '.mvv-cell-s'].forEach(sel => {
  const r = regle(sel);
  if (r === null) { ko++; dit.push('  ✗ A2 ' + sel + ' absent'); return; }
  const trois = ['white-space:nowrap', 'overflow:hidden', 'text-overflow:ellipsis']
    .filter(p => r.indexOf(p) !== -1);
  T('A2 ' + sel + ' a les trois proprietes de coupe', trois.length === 3,
    'il en a ' + trois.length + '/3');
});

/* ── 3. flex-shrink:0 (ou flex:0 0 auto) a droite et sur les pastilles ─ */
[['.mvv-rt', 'la colonne de droite'],
 ['.mvv-ref', 'le repere de cuverie'],
 ['.mvv-chev', 'le chevron'],
 ['.mvv-pick-r', 'la pastille de la ligne a cocher'],
 ['.mvv-box', 'la case a cocher'],
 ['.mvv-rad', 'le bouton radio'],
 ['.mvv-fil', 'la puce de filtre']
].forEach(([sel, quoi]) => {
  const r = regle(sel);
  if (r === null) { ko++; dit.push('  ✗ A3 ' + sel + ' absent'); return; }
  T('A3 ' + quoi + ' ne se laisse pas ecraser',
    /flex-shrink:0|flex:0 0 auto/.test(r), sel);
});

/* ── 4. AUCUNE hauteur fixe sur un bloc de texte ────────────────────── */
['.mvv-nom', '.mvv-sub', '.mvv-cell-n', '.mvv-cell-s', '.mvv-pick-n',
 '.mvv-pick-m', '.mvv-ref-n', '.mvv-ftot-s', '.mvv-detnote'].forEach(sel => {
  const r = regle(sel);
  if (r === null) { ko++; dit.push('  ✗ A4 ' + sel + ' absent'); return; }
  /* height:auto est permis ; une valeur en px ou en em ne l'est pas. */
  T('A4 ' + sel + ' n\'a pas de hauteur figee',
    !/(^|;)\s*height:\s*[0-9]/.test(r), sel);
});

/* ── 5. le nom du plan se coupe par line-clamp, pas par une hauteur ─── */
{
  const r = regle('.mvv-cell-n') || '';
  T('A5 le nom du plan se coupe par line-clamp', r.indexOf('-webkit-line-clamp') !== -1);
  T('A6 et il autorise la cesure d\'un mot tres long',
    r.indexOf('overflow-wrap:anywhere') !== -1);
}

/* ── 6. les zones de texte long peuvent casser un mot interminable ──── */
['.mvv-ftot-s', '.mvv-detnote'].forEach(sel => {
  const r = regle(sel) || '';
  T('A7 ' + sel + ' casse les mots interminables',
    r.indexOf('overflow-wrap:anywhere') !== -1, sel);
});

/* ── 7. tout ce qui se touche au doigt fait au moins 44 px ──────────── */
[['.mvv-fil', 36], ['.mvv-seg button', 36], ['.mvv-pick', 56], ['.mvv-srch input', 44]]
  .forEach(([sel, mini]) => {
    const r = regle(sel);
    if (r === null) { ko++; dit.push('  ✗ A8 ' + sel + ' absent'); return; }
    const m = r.match(/min-height:\s*(\d+)px/);
    T('A8 ' + sel + ' est assez haut pour le doigt', !!m && +m[1] >= mini,
      m ? m[1] + 'px < ' + mini : 'pas de min-height');
  });

/* ── 8. le HTML genere respecte ce que le CSS promet ────────────────── */
{
  /* Chaque texte variable injecte dans une ligne doit passer par _escHtml :
     un nom de cuvee contenant « < » casserait la mise en page entiere. */
  const ligne = SRC.slice(SRC.indexOf('function _vendLigneHtml'),
                          SRC.indexOf('function _vendDetailHtml'));
  T('A9 le nom de la cuve est echappe', /_escHtml\(c\.nom/.test(ligne));
  T('A10 les parcelles sont echappees', /_escHtml\(c\.parcelles\.join/.test(ligne));
  const cell = SRC.slice(SRC.indexOf('function _vendCellHtml'),
                         SRC.indexOf('function _vendCorpsHtml'));
  T('A11 le nom est echappe dans le plan aussi', /_escHtml\(c\.nom/.test(cell));
  T('A12 le repere est echappe', /_escHtml\(rep/.test(cell));
}

/* ── 9. contre-controle : le CSS ne doit pas reintroduire une largeur
       fixe sur la colonne du milieu, qui casserait tout l'ajustement ── */
{
  const r = regle('.mvv-mid') || '';
  T('A13 la colonne du milieu reste elastique',
    /* ⚠️ /width:\d/ matche aussi « min-width:0 » : il faut ancrer sur un
       debut de declaration, sinon l'assertion rougit sur du code juste. */
    /flex:1 1 auto/.test(r) && !/(^|;)\s*width:\s*\d/.test(r), r.trim());
}

console.log('\nHARNAIS ALIGNEMENT — ' + ok + ' vertes, ' + ko + ' rouges');
if (ko) { console.log(dit.join('\n')); process.exit(1); }
console.log('✔ les quatre regles anti-chevauchement sont posees partout');
console.log('  ⚠ aucun pixel n\'a ete mesure : la relecture a l\'oeil reste a faire');
process.exit(0);
