#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais UI-Z : L'ORDRE DES COUCHES
// ═══════════════════════════════════════════════════════════════════════════
//  ★★★ POURQUOI CE HARNAIS EXISTE — l'incident du 06/09.
//  La confirmation d'une correction de poids s'ouvrait DERRIÈRE la feuille du
//  Cuvier. Invisible, injoignable, et le clic « à côté » annulait sans rien
//  enregistrer : la correction ne partait jamais, et rien ne le disait.
//
//  La cause n'était pas un chiffre mal choisi, c'était un ANGLE MORT.
//  `openOv` empilait à partir de 600 en ne regardant que les `.overlay.open` —
//  sa propre famille. La feuille du Cuvier vit dans une autre (`.mvv-ov`,
//  z-index 9000), déclarée dans une CSS INJECTÉE PAR `cave.js`, pas dans
//  `styles.css`. Personne ne pouvait voir les deux d'un coup d'œil.
//
//  ★★ C'EST ÇA QUE LE HARNAIS RÉPARE : il rassemble les z-index de TOUTES les
//  sources — la feuille de style ET les CSS injectées dans les modules — et
//  vérifie un ordre que le code ne peut plus contredire en silence :
//
//        contenu  <  PLANCHER modal  ≤  PLAFOND modal  <  porte CGU  <  toasts
//
//  Une couche de contenu neuve posée trop haut sortira ROUGE au prochain lot,
//  au lieu d'enterrer un dialogue et d'attendre qu'un client s'en aperçoive.
//
//  Usage :
//    node scripts/mv-harnais-couches.mjs
//    node scripts/mv-harnais-couches.mjs --contre
//  Exit 0 si l'ordre tient, 1 sinon.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const CONTRE = process.argv.includes('--contre');
const T = '\u001b[0m', R = '\u001b[31m', V = '\u001b[32m', G = '\u001b[2m';

const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');

/* Les fichiers qui peuvent déclarer une couche : la feuille de style, et tout
   module qui injecte du CSS. Les seconds sont les dangereux — un z-index dans
   une chaîne JavaScript ne se voit dans aucun outil CSS. */
const SOURCES = ['src/styles.css', 'index.html',
  'src/cave.js', 'src/pilotage.js', 'src/planning.js', 'src/reglages.js',
  'src/tracteur.js', 'src/phyto.js', 'src/reserve.js', 'src/admin-gt.js',
  'src/onboarding.js', 'src/app.js', 'src/utils.js']
  .filter(f => fs.existsSync(path.join(RACINE, f)));

/* ⚠️ TROIS JETS RATÉS AVANT CELUI-CI, et chacun a menti différemment.
   1. Chercher le z-index puis remonter deviner le sélecteur par voisinage :
      rendait « #fff » (une couleur) et ratait `.pil-drawer`.
   2. Découper en blocs sans retirer les COMMENTAIRES : le commentaire que je
      venais d'écrire au-dessus de `.pil-scrim` devenait son sélecteur.
   3. Découper en blocs `sel{…}` avec les commentaires retirés : la regex se
      DÉSYNCHRONISE au premier `@media`, dont le corps contient des accolades.
      Elle rendait 25 blocs sur une feuille qui en compte des centaines, et
      perdait justement `.mvt-ov`, `.overlay` et `.pil-*` — les quatre qui
      comptent.

   ★★★ TROIS FOIS LE MÊME PIÈGE : un extracteur qui rend un résultat
   PLAUSIBLE mais faux. Il n'échoue pas, il répond — et on le croit. La seule
   sortie est d'arrêter d'approximer : pour chaque `z-index`, on REMONTE en
   comptant les accolades jusqu'à celle qui l'ouvre, puis on lit le sélecteur
   juste avant. Ça marche à travers les `@media`, les CSS injectées dans du
   JavaScript, et tout ce qu'on n'a pas prévu. */
function sansCommentaires(t){
  return t.replace(/\/\*[\s\S]*?\*\//g, ' ');
}
function couches(txt, fichier){
  const t = sansCommentaires(txt);
  const out = [];
  const re = /z-index\s*:\s*(\d+)/g;
  let m;
  while ((m = re.exec(t)) !== null){
    let d = 0, i = m.index - 1;
    for (; i >= 0; i--){
      if (t[i] === '}') d++;
      else if (t[i] === '{'){ if (d === 0) break; d--; }
    }
    if (i < 0) continue;
    let j = i - 1;
    while (j >= 0 && '{};'.indexOf(t[j]) === -1) j--;
    /* ⚠️ Dans une CSS INJECTÉE, ce qui précède la première règle n'est pas du
       CSS mais du JavaScript : `s.textContent=\u0060` puis `.mvv-ov`. On coupe
       donc au dernier délimiteur de chaîne rencontré — c'est là que le CSS
       commence vraiment. Sans ça, `.mvv-ov` sortait « undefined », et la
       couche même qui a causé l'incident restait invisible au harnais. */
    let brut = t.slice(j + 1, i);
    const coup = Math.max(brut.lastIndexOf('`'), brut.lastIndexOf("'"), brut.lastIndexOf('"'));
    if (coup >= 0) brut = brut.slice(coup + 1);
    const sels = brut.split(',').map(x => x.trim()).filter(Boolean);
    const nom = (sels.find(x => /^[#.]/.test(x)) || sels[0] || '?').split(/[\s:>]/)[0];
    out.push({ z: parseInt(m[1], 10), sel: nom, f: fichier,
               ligne: t.slice(0, m.index).split('\n').length });
  }
  return out;
}

let TOUTES = [];
for (const f of SOURCES) TOUTES = TOUTES.concat(couches(lire(f), f));

const APP = lire('src/app.js');
const val = (n) => { const m = APP.match(new RegExp('var\\s+' + n + '\\s*=\\s*(\\d+)')); return m ? parseInt(m[1], 10) : null; };
let PLANCHER = val('MV_Z_MODAL_PLANCHER');
let PLAFOND  = val('MV_Z_MODAL_PLAFOND');

/* La porte CGU est en fail-closed : rien, pas même un dialogue, ne doit pouvoir
   passer devant un consentement. On la retrouve par son sélecteur. */
const porte = TOUTES.filter(c => c.sel === '.mvt-ov').map(c => c.z).sort((a, b) => b - a)[0] || null;

/* ⚠️ PREMIER JET : « toute couche au-dessus du plancher est fautive ». Il a
   sorti 31 rouges — splash, toasts, bandeaux, barre flottante — dont AUCUN
   n'est un défaut. Un contrôle qui rougit sur trente et un faux positifs ne
   sera pas lu : il sera désactivé. Il ne prouvait rien, il criait.

   ★★ CE QUE LE HARNAIS PEUT VRAIMENT PROUVER, c'est plus étroit et plus utile :
   un dialogue modal s'ouvre par-dessus une SURFACE D'ACCUEIL — une feuille, un
   tiroir, un voile, un panneau. Ce sont ces surfaces-là, et elles seules, qui
   doivent rester sous le plancher. Un toast ou un bandeau au-dessus, c'est
   voulu ; une feuille au-dessus, c'est le bug du 06/09.

   On les reconnaît à leur suffixe, et surtout on va les chercher DANS LES CSS
   INJECTÉES PAR LES MODULES — c'est là que `.mvv-ov` se cachait, invisible à
   tout outil qui ne lit que `styles.css`. */
const SUFFIXES = /-(ov|sheet|drawer|scrim|modal|panel|feuille|tiroir)$/;
const NOMMEES  = ['.mvv-ov', '.pil-drawer', '.pil-scrim', '.overlay'];
const accueil  = TOUTES.filter(c =>
  c.sel !== '.mvt-ov' && (SUFFIXES.test(c.sel) || NOMMEES.indexOf(c.sel) !== -1));

if (CONTRE){
  // ⚠️ Le sabotage doit être un MENSONGE RÉEL, pas une modification visible :
  //    on remet le plancher à sa valeur d'avant l'incident (600), celle qui
  //    laissait la feuille du Cuvier passer devant les dialogues.
  PLANCHER = 600;
}

let ko = 0, n = 0;
const A = (titre, ok, det) => { n++; if (!ok) ko++;
  console.log('  ' + (ok ? V + 'OK  ' + T : R + 'KO  ' + T) + titre + (det ? '   ' + G + det + T : '')); };

console.log('\n  MA VIGNE — Harnais UI-Z : l\'ordre des couches\n');
console.log('  ' + G + TOUTES.length + ' z-index lus dans ' + SOURCES.length + ' fichiers' + T);
console.log('  ' + G + 'plancher modal ' + PLANCHER + ' · plafond ' + PLAFOND + ' · porte CGU ' + porte + T + '\n');

A('le plancher modal est déclaré', PLANCHER != null);
A('le plafond modal est déclaré',  PLAFOND != null);
A('plancher < plafond',            PLANCHER != null && PLAFOND != null && PLANCHER < PLAFOND,
  PLANCHER + ' < ' + PLAFOND);
A('la porte CGU est trouvée',      porte != null, '.mvt-ov = ' + porte);
A('★★ le plafond modal reste SOUS la porte CGU', PLAFOND != null && porte != null && PLAFOND < porte,
  PLAFOND + ' < ' + porte);

/* ★★ Le contrôle qui compte. */
const fautives = accueil.filter(c => PLANCHER == null || c.z >= PLANCHER);
A('★★ aucune surface d\'accueil au niveau ou au-dessus du plancher modal',
  fautives.length === 0,
  fautives.length ? fautives.length + ' fautive(s)' : accueil.length + ' surfaces examinées');
fautives.slice(0, 10).forEach(c => {
  console.log('       ' + R + '· ' + c.sel + ' = ' + c.z + T + '   ' + G + c.f + ':' + c.ligne + T);
});
console.log('  ' + G + '    surfaces suivies : '
  + accueil.map(c => c.sel + ' ' + c.z).join(' · ') + T);

/* La feuille du Cuvier nommément : c'est elle qui a enterré le dialogue. */
const zDe = (sel) => TOUTES.filter(c => c.sel === sel).map(c => c.z).sort((a, b) => b - a)[0];
A('★ la feuille du Cuvier passe sous les dialogues',
  zDe('.mvv-ov') != null && PLANCHER != null && zDe('.mvv-ov') < PLANCHER, '.mvv-ov = ' + zDe('.mvv-ov'));
A('★ le tiroir du Pilotage aussi',
  zDe('.pil-drawer') != null && PLANCHER != null && zDe('.pil-drawer') < PLANCHER,
  '.pil-drawer = ' + zDe('.pil-drawer'));
A('★ et son voile',
  zDe('.pil-scrim') != null && PLANCHER != null && zDe('.pil-scrim') < PLANCHER,
  '.pil-scrim = ' + zDe('.pil-scrim'));

/* openOv doit VRAIMENT utiliser la constante, pas un 600 réécrit à la main. */
A('★ openOv part du plancher, pas d\'un nombre en dur',
  /var base\s*=\s*MV_Z_MODAL_PLANCHER/.test(APP));
A('★ openOv borne au plafond',
  /Math\.min\(max\s*\+\s*1\s*,\s*MV_Z_MODAL_PLAFOND\)/.test(APP));

console.log('\n' + (ko ? R + ko + ' ROUGE(S) sur ' + n + T : V + 'TOUT VERT — ' + n + ' assertions' + T));
if (CONTRE){
  console.log(ko ? '\n' + V + 'CONTRE-ÉPREUVE CONCLUANTE : le plancher d\'avant l\'incident (600) fait rougir.' + T
                 : '\n' + R + '⚠️ CONTRE-ÉPREUVE MUETTE : le harnais ne voit pas le défaut, il ne prouve rien.' + T);
  process.exit(ko ? 0 : 1);
}
process.exit(ko ? 1 : 0);
