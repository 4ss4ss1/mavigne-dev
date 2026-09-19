#!/usr/bin/env node
/**
 * mv-signature-restaurer.cjs — SIGN-1 (§156) : reverser une preuve d'acceptation CGU + DPA écrasée.
 *
 * Avant SIGN-1, acceptTerms écrivait _mv_signatures/{slug} par `set` : un nouvel admin passé par la porte
 * REMPLAÇAIT la preuve du domaine. La preuve d'avant vit encore dans l'export Firestore quotidien. Ce script
 * la lit dans une base de RESTAURATION (l'export importé à part — jamais dans la base de production), puis la
 * reverse dans l'historique du domaine. Il n'efface RIEN.
 *
 *   0. Mettre l'export à l'abri de la règle des 7 jours (préfixe backups/firestore/) :
 *      gcloud storage cp --recursive gs://mavigne-a0fd5.firebasestorage.app/backups/firestore/<DATE> gs://mavigne-a0fd5.firebasestorage.app/archives/firestore-<DATE>
 *   1. gcloud firestore databases create --database=restauration --location=eur3 --project=mavigne-a0fd5
 *   2. gcloud firestore import gs://mavigne-a0fd5.firebasestorage.app/archives/firestore-<DATE> --database=restauration --project=mavigne-a0fd5
 *   3. node scripts/mv-signature-restaurer.cjs <slug>            lecture seule : les deux preuves, et ce qui serait écrit
 *   4. node scripts/mv-signature-restaurer.cjs <slug> --ecrire   écrit (transaction, rien d'effacé)
 *   5. gcloud firestore databases delete --database=restauration --project=mavigne-a0fd5
 *
 * Accès : scripts/serviceAccountKey.json s'il existe (comme restore-from-json.js), sinon les identifiants par
 * défaut (gcloud auth application-default login). firebase-admin : celui du projet, sinon celui de functions/.
 * ⚠️ Déployer la Cloud Function acceptTerms de SIGN-1 AVANT : l'ancienne réécraserait à la signature suivante.
 */
'use strict';
const fs = require('fs');
const path = require('path');

function charger(m) {
  try { return require(m); } catch (e) { return require(path.join(__dirname, '..', 'functions', 'node_modules', m)); }
}
// Identifiant dans l'historique — MÊME règle que termsHistId (functions/claims.js) ; le harnais le vérifie.
function histId(p) {
  return String((p && p.ref) || 'sans-ref') + '-' + String((p && p.ts_ms) || 0);
}
// La preuve du domaine = la PREMIÈRE acceptation des versions en vigueur (celles de la preuve actuelle).
function choisirParent(ancienne, actuelle) {
  if (!ancienne) return actuelle;
  if (!actuelle) return ancienne;
  const v = (p) => ((p.docs && p.docs.cgv && p.docs.cgv.version) || '?') + '/' + ((p.docs && p.docs.dpa && p.docs.dpa.version) || '?');
  if (ancienne.accepted && v(ancienne) === v(actuelle) && (ancienne.ts_ms || 0) < (actuelle.ts_ms || 0)) return ancienne;
  return actuelle;
}
function resume(p) {
  if (!p) return 'aucune';
  const g = p.signataire || {}, d = p.docs || {};
  return p.ref + ' · ' + new Date(p.ts_ms || 0).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
    + ' · ' + (g.nom || '?') + (g.fonction ? ' — ' + g.fonction : '')
    + ' · CGU v' + ((d.cgv && d.cgv.version) || '?') + ' / DPA v' + ((d.dpa && d.dpa.version) || '?');
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith('--'));
  const ecrire = args.includes('--ecrire');
  const base = ((args.find((a) => a.startsWith('--base=')) || '--base=restauration').slice(7)) || 'restauration';
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.log('Usage : node scripts/mv-signature-restaurer.cjs <slug> [--ecrire] [--base=restauration]');
    process.exit(1);
  }
  const { initializeApp, cert } = charger('firebase-admin/app');
  const { getFirestore } = charger('firebase-admin/firestore');
  const cle = path.join(__dirname, 'serviceAccountKey.json');
  const app = initializeApp(fs.existsSync(cle) ? { credential: cert(require(cle)) } : { projectId: 'mavigne-a0fd5' });
  const prod = getFirestore(app);
  const rest = getFirestore(app, base);
  const parentRef = prod.doc('_mv_signatures/' + slug);
  const [sR, sP] = await Promise.all([rest.doc('_mv_signatures/' + slug).get(), parentRef.get()]);
  const ancienne = sR.exists ? sR.data() : null;
  const actuelle = sP.exists ? sP.data() : null;
  console.log('\n  Preuve dans la base « ' + base + ' » : ' + resume(ancienne));
  console.log('  Preuve en production        : ' + resume(actuelle));
  if (!ancienne) { console.log('\n  Rien à reverser.\n'); return; }
  if (actuelle && histId(ancienne) === histId(actuelle)) { console.log('\n  La même preuve : rien à faire.\n'); return; }
  const parent = choisirParent(ancienne, actuelle);
  console.log('\n  Écrirait : hist/' + histId(ancienne) + (actuelle ? ' et hist/' + histId(actuelle) : '') + ' (si absents)'
    + (parent !== actuelle ? ' ; preuve du domaine ← ' + ancienne.ref : ' ; preuve du domaine inchangée'));
  if (!ecrire) { console.log('  Lecture seule — relancer avec --ecrire.\n'); return; }
  await prod.runTransaction(async (tx) => {
    const hA = parentRef.collection('hist').doc(histId(ancienne));
    const hC = actuelle ? parentRef.collection('hist').doc(histId(actuelle)) : null;
    const gA = await tx.get(hA);
    const gC = hC ? await tx.get(hC) : null;
    if (!gA.exists) tx.set(hA, Object.assign({}, ancienne, { type: 'preuve', restauree_le: Date.now(), restauree_depuis: base }));
    if (hC && !gC.exists) tx.set(hC, Object.assign({}, actuelle, { type: parent === actuelle ? 'preuve' : 'supplementaire' }));
    else if (hC && parent !== actuelle) tx.update(hC, { type: 'supplementaire' });
    if (parent !== actuelle) tx.set(parentRef, parent);
  });
  console.log('  ✓ Écrit. Rien n\'a été effacé.\n');
}
if (require.main === module) main().catch((e) => { console.error('  ✗ ' + ((e && e.message) || e)); process.exit(1); });
