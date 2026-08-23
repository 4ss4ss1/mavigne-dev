/* ───────────────────────────────────────────────────────────────────────────
   CONTRE-EPREUVE DU HARNAIS D'ICONES (lot DS-1)
   Lancer : node scripts/mv-harnais-icones-contre.mjs

   Un harnais qui ne rougit jamais ne prouve rien. On reintroduit ici, une par
   une, les six fautes que le harnais pretend interdire — sur une COPIE de
   l'arborescence, jamais sur les vrais fichiers — et on exige qu'il rougisse
   a chaque fois, en NOMMANT la faute.

   ⚠️ Vecu le 15/08 (§42f) : une assertion qui cherche « au moins un rouge »
     se laisse satisfaire par un rouge d'une AUTRE famille. On verifie donc que
     la ligne rouge cite bien le defaut qu'on vient de poser.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const bac = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-ic-'));

/* On ne copie que ce que le harnais lit. Un `cp -r` du depot entier
   embarquerait node_modules et .git pour rien. */
fs.mkdirSync(path.join(bac, 'src'), { recursive: true });
fs.mkdirSync(path.join(bac, 'scripts'), { recursive: true });
const MODULES = ['app', 'utils', 'pilotage', 'planning', 'reglages', 'cave',
                 'tracteur', 'phyto', 'reserve', 'admin-gt', 'firebase', 'onboarding'];
for (const m of MODULES)
  fs.copyFileSync(path.join(root, 'src', m + '.js'), path.join(bac, 'src', m + '.js'));
for (const f of ['mv-harnais-icones.mjs', 'mv-icones-baseline.json', 'preflight.mjs', 'preflight-baseline.json',
                 'mv-harnais-echelle.mjs', 'mv-espace-baseline.json'])
  fs.copyFileSync(path.join(root, 'scripts', f), path.join(bac, 'scripts', f));
fs.copyFileSync(path.join(root, 'index.html'), path.join(bac, 'index.html'));
fs.copyFileSync(path.join(root, 'src', 'styles.css'), path.join(bac, 'src', 'styles.css'));

/* ⚠️ LE CLIQUET DU BAC EST REGRAVE AVANT TOUTE INJECTION. Sans ca, l'epreuve
   « le compte remonte » depend de QUAND on lance : si la reference du depot
   date d'avant une baisse, ajouter trois emojis ne la depasse pas et l'epreuve
   reste verte — elle ne prouve plus rien. Une contre-epreuve ne doit dependre
   que de la faute qu'elle pose. */
execFileSync('node', [path.join(bac, 'scripts', 'mv-harnais-icones.mjs'), '--baseline'],
  { cwd: bac, stdio: 'ignore' });

const lire  = (f) => fs.readFileSync(path.join(bac, f), 'utf8');
const ecrire = (f, c) => fs.writeFileSync(path.join(bac, f), c);
const neuf  = {};
for (const f of ['index.html', 'src/reglages.js', 'src/utils.js', 'src/app.js', 'src/styles.css',
                 'src/pilotage.js'])
  neuf[f] = lire(f);
const restaurer = () => { for (const f in neuf) ecrire(f, neuf[f]); };

function lancer(harnais) {
  try {
    execFileSync('node', [path.join(bac, 'scripts', harnais || 'mv-harnais-icones.mjs')],
      { cwd: bac, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { rouge: false, sortie: '' };
  } catch (e) {
    return { rouge: true, sortie: String(e.stdout || '') + String(e.stderr || '') };
  }
}

let ok = 0, ko = 0;
function epreuve(nom, casser, motif, harnais) {
  restaurer();
  casser();
  const r = lancer(harnais);
  /* Le rouge ne suffit pas : il doit NOMMER la faute posee. */
  const cite = r.rouge && motif.test(r.sortie.replace(/\u001b\[\d+m/g, ''));
  if (cite) { ok++; console.log('  \x1b[32m\u2713\x1b[0m ' + nom + ' \u2014 rougit, et le dit'); }
  else {
    ko++;
    console.log('  \x1b[31m\u2717\x1b[0m ' + nom
      + (r.rouge ? ' \u2014 rougit, mais pour autre chose' : ' \u2014 RESTE VERT'));
    console.log('      ' + r.sortie.replace(/\u001b\[\d+m/g, '').split('\n')
      .filter(l => l.includes('\u2717')).join('\n      '));
  }
  restaurer();
}

console.log('\n\u2500\u2500 CONTRE-EPREUVE DU HARNAIS D\u2019ICONES\n');

/* 1. Un symbol renomme : l'appel vise le vide. C'est LE piege du lot —
      <use> qui ne trouve rien ne rend RIEN, sans la moindre erreur. */
epreuve('un symbole renomme',
  () => ecrire('index.html', lire('index.html').replace('id="ic-corbeille"', 'id="ic-poubelle"')),
  /Toute icone appelee a son symbole[\s\S]*corbeille/);

/* 2. Un symbol declare que personne n'appelle : du poids mort dans index.html. */
/* ⚠️ L'ancienne epreuve visait « symbole sans emploi », devenue un simple
   avertissement parce qu'elle poussait a supprimer des symboles vivants.
   On la remplace par celle qui aurait evite `equipe` PUIS `euro`. */
epreuve('un triplet qui cite un symbole absent',
  () => ecrire('src/pilotage.js', lire('src/pilotage.js')
        .replace("['eco','euro',", "['eco','nexistepas',")),
  /Toute icone appelee a son symbole[\s\S]*nexistepas/);

/* 3. Un emoji qui revient dans le module temoin. */
epreuve('un emoji reintroduit dans reglages.js',
  () => ecrire('src/reglages.js', lire('src/reglages.js')
        .replace("showToast('Domaine mis \u00e0 jour'", "showToast('\u2705 Domaine mis \u00e0 jour'")),
  /reglages\.js ne remonte pas/);

/* 4. Une forme qui fige sa couleur : elle ne se repeint plus en mode sombre. */
epreuve('une forme qui fige sa couleur',
  () => ecrire('index.html', lire('index.html')
        .replace('<symbol id="ic-check" viewBox="0 0 24 24" data-src="check">',
                 '<symbol id="ic-check" viewBox="0 0 24 24" data-src="check"><path stroke="#000" d="M0 0h1v1H0Z"/>')),
  /Aucune forme ne fige sa couleur[\s\S]*check/);

/* 4bis. Un trou creuse au blanc : impeccable sur la carte claire, faux partout
      ailleurs — bandeau sombre, encart vert, document imprime. */
epreuve('un trou creuse avec du blanc en dur',
  () => ecrire('index.html', lire('index.html')
        .replace('<symbol id="ic-liste" viewBox="0 0 24 24" data-src="clipboard-list">',
                 '<symbol id="ic-liste" viewBox="0 0 24 24" data-src="clipboard-list"><rect fill="#fff" x="9" y="9" width="6" height="2"/>')),
  /couleur de fond en dur[\s\S]*liste/);

/* 5. Le compte global qui remonte : un emoji ajoute AILLEURS que dans le temoin.
   ⚠️ Le motif portait une alternative large (`/ne remonte pas/`) qui se laissait
     satisfaire par le rouge du cliquet GLOBAL — donc par n'importe quelle hausse,
     y compris dans un autre fichier. C'est §42f, et il a suffi de renommer une
     assertion pour que ca se voie. Le motif exige desormais que le rouge NOMME
     `utils`. */
epreuve('le compte global qui remonte',
  () => ecrire('src/utils.js', lire('src/utils.js')
        .replace('export const APP_VERSION', 'export const _MV_FAUX = \'\u{1F600}\u{1F600}\u{1F600}\';\nexport const APP_VERSION')),
  /ne remonte dans aucune surface[\s\S]*utils/);

/* 5bis. Une taille hors echelle : invisible dans le fichier, visible a l'ecran
      quand deux icones voisines ne font pas la meme taille. */
epreuve('une taille hors echelle (13 px)',
  () => ecrire('src/reglages.js', lire('src/reglages.js')
        .replace("_mvIcon('corbeille',16)", "_mvIcon('corbeille',13)")),
  /Toute taille est dans l\u2019echelle/);

/* 5ter. Une forme retouchee a la main : elle sera ecrasee au prochain
      build-sprite.mjs, sans bruit. La marque d'origine disparait avec elle. */
epreuve('un symbole prive de sa marque d\u2019origine',
  () => ecrire('index.html', lire('index.html')
        .replace('<symbol id="ic-feuille" viewBox="0 0 24 24" data-src="leaf"',
                 '<symbol id="ic-feuille" viewBox="0 0 24 24"')),
  /forme d\u2019origine[\s\S]*feuille/);

/* 5quater. Un cinquieme ton de badge : deux ecrans finiraient par dire la
      meme chose de deux couleurs differentes. */
epreuve('un badge d\u2019un ton inexistant',
  () => ecrire('src/app.js', lire('src/app.js')
        .replace("_mvBadge('En cours','ambre')", "_mvBadge('En cours','orange')")),
  /ton inexistant/);

/* 5quinquies. Une regle CSS qui vise un enfant par son rang dans un bloc que
      la charte remanie : elle se met a viser le mauvais bloc, en silence. */
epreuve('une regle CSS qui vise un enfant par son rang',
  () => ecrire('src/styles.css', lire('src/styles.css')
        .replace('.home-w-compact #home-stat-content .mv-hn{font-size:27px;}',
                 '.home-w-compact #home-stat-content>div:first-child{font-size:27px;}')),
  /par son rang/);

/* 5sexies. Un ternaire dont les deux branches redeviennent identiques : le
      bouton ment sans que rien ne plante. */
epreuve('un ternaire a deux branches identiques',
  () => ecrire('src/app.js', lire('src/app.js')
        .replace("_mapLabelsVisible?'Masquer les noms':'Afficher les noms'",
                 "_mapLabelsVisible?'Noms':'Noms'")),
  /deux fois la meme chaine/);

/* 5septies. Un espacement ecrit a la main dans la charte : c'est comme ca que
      vingt valeurs de padding sont arrivees la premiere fois. */
epreuve('un espacement ecrit a la main dans la charte',
  () => ecrire('src/styles.css', lire('src/styles.css')
        .replace('.mv-act{ display:flex; gap:var(--e-2); }',
                 '.mv-act{ display:flex; gap:9px; }')),
  /espacement a la main/, 'mv-harnais-echelle.mjs');

/* 5octies. UNE TABLE QUI DEMANDE UN SYMBOLE ABSENT. C'est le defaut que la CI
      a trouve et que le harnais laissait passer : il SAUTAIT les noms inconnus
      d'une table au lieu de les signaler — un controle qui ne peut pas echouer.
      Cette epreuve existe pour qu'il ne redevienne jamais muet. */
epreuve('une table qui demande un symbole absent',
  () => ecrire('src/pilotage.js', lire('src/pilotage.js')
        .replace("equipe:'equipe'", "equipe:'nexistepas'")),
  /Toute icone appelee a son symbole[\s\S]*nexistepas/);

/* 5nonies. UN AIDE PRIVE APPELE MAIS DISPARU — la panne du 17/08 en production.
      Ni `node --check` ni ESLint ne la voyaient. C23 la voit.
      ⚠️ Cette epreuve lance le PREFLIGHT, pas le harnais d'icones. */
epreuve('un aide prive appele mais disparu',
  () => ecrire('src/pilotage.js', lire('src/pilotage.js')
        .replace("_pilEsc(_opTNom(x.nom))", "_opEmo(x.nom)+_pilEsc(_opTNom(x.nom))")),
  /C23[\s\S]*_opEmo/, 'preflight.mjs');

/* 6. Un document imprime qui appelle `_mvIcon` : le sprite n'existe pas dans
      l'onglet ou il s'ouvre, le cadre sort vide et rien ne le signale. */
epreuve('_mvIcon dans un document imprime',
  () => ecrire('src/reglages.js', lire('src/reglages.js')
        .replace("${_mvIconInline('eprouvette',40)}", "${_mvIcon('eprouvette',40)}")),
  /Aucun document imprime/);

/* 7. ★★★ index.html SOUS CLIQUET — LE TROU DU LOT DS-M1.
      Le cliquet ne lisait que `src/*.js`. La surface la PLUS VISIBLE de
      l'application (modales, titres de section, puces de filtre, tout l'ecran
      Reglages) portait 257 pictogrammes que rien ne comptait, et le harnais
      sortait 27 verts. Cette epreuve existe pour que ca ne puisse plus arriver
      en silence : un emoji repose dans index.html doit rougir, et NOMMER
      index.html — pas seulement faire remonter un total anonyme. */
epreuve('un emoji repose dans index.html',
  () => ecrire('index.html', lire('index.html')
        .replace('<div class="modal-title">', '<div class="modal-title">\u{1F347}')),
  /ne remonte dans aucune surface[\s\S]*index\.html/);

/* 8. ★★★ LA CLASSE DE CARACTERES AVAIT UN TROU — troisieme fois que le
      compteur ment, apres §50 (les echappements) et l'ecart U+FE0F de §45a.
      `\u2139\uFE0F` tombait entre les plages `\u2300-\u23FF` et `\u25A0-\u25FF` : treize
      occurrences rendues, invisibles, dans sept fichiers. Le hasard des bornes
      n'est pas une definition.
      ⚠️ L'epreuve pose un `\u2139\uFE0F`, PAS un emoji ordinaire : elle doit echouer si
        quelqu'un retrecit un jour la classe a ses seules plages historiques. */
epreuve('un glyphe hors des plages historiques (\u2139)',
  () => ecrire('index.html', lire('index.html')
        .replace('<div class="modal-title">', '<div class="modal-title">\u2139\uFE0F')),
  /ne remonte dans aucune surface[\s\S]*index\.html/);

/* 9. ★★★ UN DOCUMENT IMPRIME QUI APPELLE `_mvIcon` — MAIS VIA UN HELPER.
      L'epreuve n°6 pose la faute DANS la fonction du document ; celle-ci la
      pose trois crans plus loin (`_bcExport` → `_bcDoc` → `_bcSec`), qui est
      la forme reelle du code. Elle a rougi TROIS versions de l'assertion :
        · la 1re ne lisait que reglages.js ;
        · la 2e lisait les 12 modules mais decoupait la fonction au premier
          `\n}` — c'est-a-dire a la fin du gabarit <style>, un tiers du corps ;
        · la 3e suivait UN niveau d'appel, la chaine en a trois.
      ⚠ Elle existe pour que ce controle ne redevienne jamais decoratif. */
epreuve('_mvIcon dans un document imprime, via un helper',
  () => ecrire('src/cave.js', lire('src/cave.js')
        .replace('_mvIconInline(ico,16)', '_mvIcon(ico,16)')),
  /Aucun document imprime[\s\S]*cave\.js : _bcSec/);

/* 10. UNE TUILE D'UN TON INEXISTANT. L'assertion des tons ne lisait que
      `_mvBadge` : j'ai fait porter des tons a `_mvIconTuile` dans le meme lot,
      et le harnais est reste vert sur une classe CSS qui n'existe pas — une
      tuile sans fond, sans erreur, sans trace. Trouve par contre-epreuve,
      pas par relecture. */
epreuve('une tuile d\u2019un ton inexistant',
  () => ecrire('src/pilotage.js', lire('src/pilotage.js')
        .replace('_mvIconTuile(em[0],em[1])', "_mvIconTuile('alerte','orange')")),
  /tuile ne demande un ton inexistant[\s\S]*orange/);

fs.rmSync(bac, { recursive: true, force: true });
console.log('\n' + (ko ? '\x1b[31m' + ko + ' CONTRE-EPREUVE(S) EN ECHEC\x1b[0m'
                       : '\x1b[32mLes ' + ok + ' contre-epreuves rougissent\x1b[0m') + '\n');
process.exit(ko ? 1 : 0);
