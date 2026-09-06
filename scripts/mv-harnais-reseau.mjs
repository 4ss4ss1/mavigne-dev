#!/usr/bin/env node
/**
 * mv-harnais-reseau.mjs — UN INCIDENT RESEAU N'EST PAS UNE PANNE.
 *
 * Signale par Nico le 25/08/2026 depuis la cave : « Promesse rejetee : Firebase:
 * Error (auth/network-request-failed) » en travers de l'ecran pendant la saisie
 * d'une analyse, sur 4G. La 4G avait lache pendant le rafraichissement du jeton ;
 * fbSave avait fait exactement son travail (3 tentatives, mise en file, envoi
 * differe) — puis relance l'erreur. Ses 71 sites d'appel l'invoquent SANS await
 * et SANS catch, donc le rejet remontait au gestionnaire global, qui repeignait
 * l'ecran d'un code d'erreur anglais sur une ecriture qui n'avait rien perdu.
 *
 * CE QUE CE HARNAIS GRAVE — et pourquoi il est statique :
 * fbSave ne peut pas etre importee ici (elle tire tout le SDK Firebase). Mais le
 * contrat « elle ne rejette jamais » est justement le genre d'invariant qu'un lot
 * futur casse sans le voir, en rajoutant un `throw` dans un nouveau chemin
 * d'erreur. Une lecture du fichier reel suffit a le tenir.
 *
 * ⚠️ Chaque assertion est doublee d'une CONTRE-EPREUVE : le defaut est reinjecte
 *    dans une copie en memoire du fichier, et l'assertion DOIT rougir. Un harnais
 *    qui ne sait pas rougir ne prouve rien (lecon du 23/08, §55).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (p) => fs.readFileSync(path.join(RACINE, p), 'utf8');

let verts = 0, rouges = 0;
const dire = (ok, libelle, detail) => {
  if (ok) { verts++; console.log('    \x1b[32m✓\x1b[0m ' + libelle); }
  else { rouges++; console.log('    \x1b[31m✗\x1b[0m ' + libelle + (detail ? '  \x1b[2m→ ' + detail + '\x1b[0m' : '')); }
};

// ⚠️⚠️ BLANCHIR LES COMMENTAIRES AVANT DE LIRE — piege §53, cinquieme occurrence.
//    Ce harnais s'est trompe des sa premiere execution : il cherchait la chaine
//    « network-request-failed » dans la zone du gestionnaire, et la trouvait dans le
//    COMMENTAIRE qui explique le correctif, juste au-dessus du code. La contre-epreuve
//    restait donc verte sur un fichier sabote — c'est-a-dire qu'elle ne prouvait rien.
//    Regle generale : un controle qui lit du code ne doit jamais lire la prose qui
//    l'accompagne, sinon il valide le commentaire au lieu de l'instruction.
const sansCommentaires = (txt) => txt
  .split('\n')
  .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
  .join('\n');

// ── Decoupe du corps de fbSave dans le texte reel de firebase.js ──
function corpsFbSave(src) {
  const i = src.indexOf('window.fbSave = async function');
  if (i < 0) return null;
  let d = 0, debut = src.indexOf('{', i), fin = -1;
  for (let k = debut; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (d === 0) { fin = k; break; } }
  }
  return fin < 0 ? null : src.slice(debut, fin + 1);
}

// ══ Les regles, chacune jouable sur un texte quelconque (pour la contre-epreuve) ══
const REGLES = [
  {
    nom: 'fbSave ne contient plus AUCUN throw',
    fichier: 'src/firebase.js',
    test: (src) => { const c = corpsFbSave(src); return c !== null && !/\bthrow\b/.test(c); },
    // contre-epreuve : on remet le throw du chemin reseau
    casse: (src) => src.replace(
      "    return { ok: false, queued: true, code: (e && e.code) || '' };",
      '    throw e;')
  },
  {
    nom: 'fbSave rend un etat sur CHAQUE sortie (aucun `return;` nu)',
    fichier: 'src/firebase.js',
    test: (src) => { const c = corpsFbSave(src); return c !== null && !/\breturn\s*;/.test(c); },
    casse: (src) => src.replace(
      '    return { ok: false, queued: true, offline: true };',
      '    return;')
  },
  {
    nom: 'saveData LIT l\'etat rendu (pas de .then() nu qui dirait « Enregistre ✓ »)',
    fichier: 'src/app.js',
    test: (src) => /p\.then\(function\(r\)\s*\{[\s\S]{0,400}?r\.ok[\s\S]{0,400}?r\.queued/.test(src),
    casse: (src) => src.replace(
      'p.then(function(r) {',
      'p.then(function() {')
  },
  {
    nom: 'le gestionnaire global etouffe les incidents RESEAU avant le bandeau rouge',
    fichier: 'src/app.js',
    test: (src) => {
      const code = sansCommentaires(src);          // ⚠️ jamais la prose, seulement l'instruction
      const i = code.indexOf('unhandledrejection');
      if (i < 0) return false;
      const zone = code.slice(i, i + 3000);
      const iFiltre = zone.search(/if\s*\(\s*\/[^\n]*network-request-failed[^\n]*\/i\.test\(_rmsg\)\s*\)/);
      const iRouge = zone.indexOf("msg: 'Promesse rejetée : '");
      return iFiltre > 0 && iRouge > 0 && iFiltre < iRouge;   // le filtre passe AVANT le bandeau
    },
    casse: (src) => src.replace('network-request-failed|Failed to fetch', 'jamais-declenche|Failed to fetch')
  },
  {
    nom: 'le badge distingue « coupe » de « instable » (navigator.onLine)',
    fichier: 'src/firebase.js',
    test: (src) => {
      const i = src.indexOf('function _showOfflineQueueBadge');
      if (i < 0) return false;
      const zone = src.slice(i, i + 1200);
      return /navigator\.onLine/.test(zone) && /Réseau instable/.test(zone) && /Hors ligne/.test(zone);
    },
    casse: (src) => src.replace(
      "  var tete = navigator.onLine ? 'Réseau instable' : 'Hors ligne';",
      "  var tete = 'Hors ligne';")
  },
  {
    nom: 'l\'echec reseau se journalise en \'info\' (pas de toast « fbSave échoué » a l\'ecran)',
    fichier: 'src/firebase.js',
    test: (src) => /level:'info',cat:'firebase',msg:'fbSave échoué/.test(src),
    casse: (src) => src.replace("level:'info',cat:'firebase',msg:'fbSave échoué",
                                "level:'warning',cat:'firebase',msg:'fbSave échoué")
  },
  {
    nom: 'aucun appel nu a fbSave ne subsiste dans saveData (tous par _fbSaveMuet)',
    fichier: 'src/app.js',
    test: (src) => {
      const i = src.indexOf('var _doFbSave = function');
      if (i < 0) return false;
      const zone = src.slice(i, i + 1800);
      // le seul window.fbSave tolere est celui dont on lit le retour (var p = ...)
      const nus = (zone.match(/(?<!var p = )window\.fbSave\(/g) || []).length;
      return nus === 0;
    },
    casse: (src) => src.replace('      if(!toastMsg) { _fbSaveMuet(key, value); return; }',
                                '      if(!toastMsg) { window.fbSave(key, value); return; }')
  }
];

console.log('\n\x1b[1m  HARNAIS RESEAU — fbSave ne rejette jamais, et le badge dit la verite\x1b[0m\n');

console.log('\x1b[1m  1. Le contrat tient sur les fichiers reels\x1b[0m');
const cache = {};
for (const r of REGLES) {
  if (!(r.fichier in cache)) cache[r.fichier] = lire(r.fichier);
  dire(r.test(cache[r.fichier]), r.nom, r.fichier);
}

console.log('\n\x1b[1m  2. CONTRE-EPREUVE — chaque defaut reinjecte doit faire ROUGIR sa regle\x1b[0m');
for (const r of REGLES) {
  const abime = r.casse(cache[r.fichier]);
  if (abime === cache[r.fichier]) {
    dire(false, 'contre-epreuve INOPERANTE : ' + r.nom,
         'le motif de sabotage ne correspond a rien — le harnais ne prouve rien');
    continue;
  }
  dire(r.test(abime) === false, 'rougit bien si l\'on casse : ' + r.nom,
       'l\'assertion reste VERTE sur un fichier abime');
}

console.log('\n' + (rouges === 0
  ? `\x1b[32m  ✓ ${verts} vertes, 0 rouge\x1b[0m\n`
  : `\x1b[31m  ✗ ${verts} vertes, ${rouges} ROUGE(S)\x1b[0m\n`));
process.exit(rouges === 0 ? 0 : 1);
