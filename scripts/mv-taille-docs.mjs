#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   MA VIGNE — LA TAILLE DE CHAQUE DOCUMENT FIRESTORE, FACE À LA LIMITE (§177)
   Lancer :  npm run taille -- "C:\chemin\mavigne_sauvegarde_xxx_2026-09-26.json"
             npm run taille -- ancienne.json recente.json     (+ projection)
             node scripts/mv-taille-docs.mjs --test            (auto-contrôle, dans check)

   ══ POURQUOI ══
   Chaque module est UN document Firestore ({ value: … }, firebase.js fbDocRef /
   fbSave) et Firestore REFUSE tout document au-delà de 1 Mio (1 048 576 octets).
   _mvDocSize (firebase.js) compte des ENTRÉES pour la garde anti-écrasement ;
   rien ne mesure des OCTETS. Le jour où le journal, les sessions ou la cave
   franchissent la limite, les enregistrements de ce module échouent pour tout
   le domaine. Ce script le voit venir, à partir d'une sauvegarde complète
   (Réglages › Domaine › Documents & impressions › Données brutes › Sauvegarde
   complète), SUR LE POSTE : aucune donnée ne quitte l'ordinateur.

   ══ LE CALCUL ══
   La règle publiée par Firestore (« Storage size calculations ») :
     nom du document : chaque segment du chemin = octets UTF-8 + 1, plus 16
     chaîne = octets UTF-8 + 1 · booléen, null = 1 · nombre = 8
     tableau = somme des valeurs · objet = somme (octets de la clé + 1 + valeur)
     document = nom + champs + 32
   Seul le champ `value` est dans la sauvegarde (fbLireTout) : un éventuel petit
   champ technique à côté n'est pas compté — d'où des seuils prudents (50 / 80 %).
   `--test` rejoue l'exemple de la documentation Firestore (tâche « my_task_id »,
   147 octets) : si le calcul dérive, check rougit.

   ⚠️ CHEMINS : fileURLToPath, jamais new URL(...).pathname (Windows, 20/08).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';

// ★★ TAILLE-2 (§246) — la règle vit dans src/taille-doc.js, UN seul endroit : l'appli la joue avant chaque envoi, ce
//   script la joue sur une sauvegarde, et --test (joué par check) la vérifie pour les deux.
import { MV_LIMITE_DOC as LIMITE, mvOctetsTexte, mvOctetsValeur as tailleValeur, mvOctetsNom as tailleNom, mvOctetsDoc as tailleDoc } from '../src/taille-doc.js';
const c = { g:s=>`\x1b[32m${s}\x1b[0m`, r:s=>`\x1b[31m${s}\x1b[0m`, y:s=>`\x1b[33m${s}\x1b[0m`, dim:s=>`\x1b[2m${s}\x1b[0m`, b:s=>`\x1b[1m${s}\x1b[0m` };

// ── Auto-contrôle : l'exemple de la documentation Firestore ────────────────
if (process.argv.includes('--test')) {
  const nom = tailleNom(['users', 'jeff', 'tasks', 'my_task_id']);
  const champs = tailleValeur({ type: 'Personal', done: false, priority: 1, description: 'Learn Cloud Firestore' });
  const doc = tailleDoc(['users', 'jeff', 'tasks', 'my_task_id'], { type: 'Personal', done: false, priority: 1, description: 'Learn Cloud Firestore' });
  // Et l'octet UTF-8 compté sans tampon (taille-doc.js) doit dire exactement ce que dit Node, accents et emoji compris.
  const textes = ['', 'a', 'é', 'Côte de Nuits', 'Gevrey-Chambertin · 2026', '\u{1F347} raisin', 'ok\uD800', '\uDC00x'];
  const utf8 = textes.every(t => mvOctetsTexte(t) === Buffer.byteLength(t, 'utf8'));
  const ok = nom === 44 && champs === 71 && doc === 147 && utf8
    && tailleValeur(['a', 'é']) === 5 && tailleValeur({ 'clé': [1, null, true] }) === 15;
  console.log('  ' + (ok ? c.g('✓') : c.r('✗')) + ' calcul Firestore : nom ' + nom + '/44, champs ' + champs + '/71, document ' + doc + '/147 octets');
  process.exit(ok ? 0 : 1);
}

const fichiers = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!fichiers.length) {
  console.log('\n  Usage : npm run taille -- "C:\\\\…\\\\mavigne_sauvegarde_<domaine>_<date>.json"  [une 2e sauvegarde plus ancienne]\n');
  process.exit(2);
}
function lire(f) {
  let j;
  try { j = JSON.parse(fs.readFileSync(path.resolve(f), 'utf8')); }
  catch (e) { console.error(c.r('✖ Lecture impossible : ' + f + ' — ' + e.message)); process.exit(2); }
  if (!j || !j.meta || !j.donnees) { console.error(c.r('✖ ' + f + ' n\u2019est pas une sauvegarde Ma Vigne (meta / donnees absents).')); process.exit(2); }
  const col = 'mavigne_' + (j.meta.tenant || 'domaine');
  const tailles = {};
  for (const k of Object.keys(j.donnees)) tailles[k] = tailleDoc([col, k], { value: j.donnees[k] });
  return { f, meta: j.meta, tailles, date: new Date(j.meta.date) };
}
const S = fichiers.map(lire).sort((a, b) => a.date - b.date);
const R = S[S.length - 1], A = S.length > 1 ? S[0] : null;
const jours = A ? (R.date - A.date) / 86400000 : 0;

console.log('\n' + c.b('MA VIGNE — taille des documents Firestore') + c.dim('  (limite ' + LIMITE.toLocaleString('fr-FR') + ' octets par document)'));
console.log(c.dim('  ' + (R.meta.domaine || R.meta.tenant || '') + ' · sauvegarde du ' + R.date.toLocaleDateString('fr-FR') + ' · v' + (R.meta.app_version || '?')
  + (R.meta.complet === false ? ' · ⚠️ SAUVEGARDE INCOMPLÈTE' : '') + (A ? ' · comparée au ' + A.date.toLocaleDateString('fr-FR') + ' (' + Math.round(jours) + ' j)' : '')));
if (A && jours < 7) console.log(c.y('  ! Moins de 7 jours entre les deux sauvegardes : la projection sera peu fiable.'));

const lignes = Object.entries(R.tailles).sort((a, b) => b[1] - a[1]);
let pire = 0;
console.log('');
for (const [k, n] of lignes) {
  const pc = n / LIMITE * 100; pire = Math.max(pire, pc);
  const col = pc >= 80 ? c.r : pc >= 50 ? c.y : (s => s);
  let proj = '';
  if (A && jours >= 1 && A.tailles[k] != null) {
    const parJour = (n - A.tailles[k]) / jours;
    if (parJour > 0) {
      const j = (LIMITE - n) / parJour;
      const quand = new Date(R.date.getTime() + j * 86400000);
      const rythme = '  +' + (parJour * 30 / 1024).toFixed(1).replace('.', ',') + ' Ko/mois';
      proj = c.dim(rythme + (j > 3650 ? ' → limite pas avant 10 ans' : ' → limite vers ' + quand.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })));
    } else proj = c.dim('  stable');
  }
  const barre = '█'.repeat(Math.min(20, Math.round(pc / 5))).padEnd(20, '·');
  console.log('  ' + col(k.padEnd(26) + String(Math.round(n / 1024)).padStart(5) + ' Ko  ' + barre + ' ' + pc.toFixed(1).padStart(5) + ' %') + proj);
}
const total = lignes.reduce((s, x) => s + x[1], 0);
console.log('\n  ' + lignes.length + ' documents · ' + Math.round(total / 1024) + ' Ko au total · le plus gros à ' + pire.toFixed(1) + ' % de la limite');
console.log('  ' + (pire >= 80 ? c.r('✗ URGENT : un document approche la limite — à découper avant qu\u2019il ne soit refusé.')
  : pire >= 50 ? c.y('! À surveiller : un document dépasse la moitié de la limite.')
  : c.g('✓ Marge confortable sur tous les documents.')) + '\n');
process.exit(pire >= 80 ? 1 : 0);
