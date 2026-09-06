// restore-from-json.js — restauration depuis un backup JSON par tenant (couche 3)
// Backup : gs://mavigne-a0fd5.firebasestorage.app/backups/tenants/{slug}/AAAA-MM-JJ.json
// Format : { tenant, exported_at, data: { docId: {...}, ... } }
//
// USAGE :
//   node restore-from-json.js <slug> <fichier.json> [doc1 doc2 ...]
//     • sans liste de docs  -> restaure TOUS les docs du backup (rollback complet du client)
//     • avec liste de docs  -> restaure SEULEMENT ceux-la (cible : garde le reste intact)
//   Ajouter --apply pour ecrire reellement (sinon DRY-RUN, rien n'est ecrit).
//
//   Cible  :  node restore-from-json.js marchand-grillot 2026-06-24.json parcelles --apply
//   Complet:  node restore-from-json.js domaine-x 2026-06-24.json --apply
//
// Prerequis : serviceAccountKey.json dans le meme dossier + `npm i firebase-admin`.
'use strict';
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const sa = require('./serviceAccountKey.json');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const pos   = args.filter(function (a) { return a !== '--apply'; });
const slug  = pos[0];
const file  = pos[1];
const onlyDocs = pos.slice(2); // vide => tous les docs du backup

if (!slug || !file) {
  console.error('Usage: node restore-from-json.js <slug> <fichier.json> [doc1 doc2 ...] [--apply]');
  process.exit(1);
}

const app = initializeApp({ credential: cert(sa) });
const db  = getFirestore(app);
const COL = 'mavigne_' + slug;

function size(v) {
  if (v == null) return 0;
  if (Array.isArray(v)) return v.length;
  if (typeof v === 'object') return Object.keys(v).length;
  return 1;
}
function val(docData) { return (docData && docData.value !== undefined) ? docData.value : docData; }

(async () => {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!raw || !raw.data) { console.error('[X] JSON invalide (pas de champ .data)'); process.exit(1); }
  if (raw.tenant && raw.tenant !== slug) {
    console.error('[!] Backup du tenant "' + raw.tenant + '" mais tu cibles "' + slug + '". Arret par securite.');
    process.exit(1);
  }
  console.log('Backup : tenant=' + (raw.tenant || '?') + '  exporte_le=' + (raw.exported_at || '?'));

  const allDocs = Object.keys(raw.data);
  const docs = onlyDocs.length ? onlyDocs : allDocs;
  for (const d of docs) {
    if (!(d in raw.data)) { console.error('[X] doc "' + d + '" absent du backup. Dispo : ' + allDocs.join(', ')); process.exit(1); }
  }

  console.log('\nComparaison backup <-> live (' + docs.length + ' doc(s)) :');
  for (const d of docs) {
    const bN = size(val(raw.data[d]));
    let liveN = '?';
    try { const s = await db.collection(COL).doc(d).get(); liveN = s.exists ? String(size(val(s.data()))) : 'absent'; } catch (e) {}
    console.log('  ' + d.padEnd(22) + ' backup=' + String(bN).padStart(5) + '   live=' + liveN);
    if (bN === 0) console.log('     [!] ce doc du backup est VIDE — verifie la DATE avant d\'ecraser');
  }

  if (!APPLY) {
    console.log('\n-- DRY-RUN -- rien ecrit. Ajoute --apply pour restaurer.');
    return;
  }

  let ok = 0;
  for (const d of docs) {
    await db.collection(COL).doc(d).set(raw.data[d]); // reecrit le doc tel quel (cle "value" incluse)
    console.log('  [OK] ' + COL + '/' + d);
    ok++;
  }
  console.log('\n[FINI] ' + ok + '/' + docs.length + ' doc(s) restaure(s) pour "' + slug + '". F5 dans l\'app pour verifier.');
})().catch(function (e) { console.error(e); process.exit(1); });
