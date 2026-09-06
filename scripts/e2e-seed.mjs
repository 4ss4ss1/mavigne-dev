#!/usr/bin/env node
// =============================================================================
// Ma Vigne — Seed E2E (palier 2)
// -----------------------------------------------------------------------------
// Écrit un tenant JETABLE « e2e-test » DANS LES ÉMULATEURS Firebase :
//   • un compte Auth (nico@e2e.test / vigne21) avec claims {tenant, ro:false}
//   • les docs Firestore mavigne_e2e-test/{membres,config,saisons,parcelles}
//     aux formes RÉELLES de l'app (enveloppe {value:…}, m.roles = tableau,
//     saisons datées, parcelles avec taches).
//   • _guerettech/tenants (registre) pour éviter le gate d'onboarding.
//
// ⚠️ NE TOUCHE JAMAIS LA PROD : on force les variables d'ENV émulateur ci-dessous,
// et on REFUSE de tourner si elles pointent ailleurs que 127.0.0.1 / localhost.
//
// Pré-requis : émulateurs démarrés (npm run emu), firebase-admin installé.
// Usage : node scripts/e2e-seed.mjs
// =============================================================================

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const PROJECT  = 'mavigne-a0fd5';
const TENANT   = 'e2e-test';
const EMAIL    = 'nico@e2e.test';
const PASSWORD = 'vigne21';

// --- Forcer les émulateurs (jamais la prod) ---
process.env.FIRESTORE_EMULATOR_HOST     = process.env.FIRESTORE_EMULATOR_HOST     || '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

// --- Garde de sécurité : refuser si ce n'est pas du localhost ---
const okHost = (h) => /^(127\.0\.0\.1|localhost|0\.0\.0\.0)(:\d+)?$/i.test(h || '');
if (!okHost(process.env.FIRESTORE_EMULATOR_HOST) || !okHost(process.env.FIREBASE_AUTH_EMULATOR_HOST)) {
  console.error('✖ SÉCURITÉ : les hosts émulateur ne sont pas locaux — seed ANNULÉ (jamais la prod).');
  console.error('  FIRESTORE_EMULATOR_HOST =', process.env.FIRESTORE_EMULATOR_HOST);
  console.error('  FIREBASE_AUTH_EMULATOR_HOST =', process.env.FIREBASE_AUTH_EMULATOR_HOST);
  process.exit(2);
}

const app  = initializeApp({ projectId: PROJECT });
const db   = getFirestore(app);
const auth = getAuth(app);

// --- Données (formes réelles de l'app) ---
const MEMBRES = [
  { nom: 'Nico E2E', email: EMAIL, roles: ['admin', 'ouvrier', 'tractoriste'], statut: 'Actif', couleur: '#3D6B27' },
  { nom: 'Victor E2E', email: 'victor@e2e.test', roles: ['ouvrier', 'tractoriste'], statut: 'Actif', couleur: '#1A4A7A' },
];

const SAISONS = [
  { nom: 'Hiver 2025-2026', active: false, debut: '2025-11-01', fin: '2026-03-15' },
  { nom: 'Printemps 2026',  active: true,  debut: '2026-03-16', fin: '2026-07-31' },
];

const CONFIG = {
  domaine_nom: 'Domaine E2E Test',
  visuSaison: 'Printemps 2026',
  plantation_min_trou: 3,
  features: {},                 // aucun override → plan par défaut (domaine) = tout ouvert
  gnr: { capacite: 1000, niveau: 600, seuil: 200, maj: '2026-06-01' },
};

const PARCELLES = [
  {
    nom: 'Parcelle Test A', surface: 1.2, lat: 47.2200, lng: 4.9700, statut: 'Actif',
    taches: { Taille: 'Validé', Reparation: 'Validé', Ebourgeonnage: { p1: 'Validé', p2: 'Non démarré', ov: false } },
  },
  {
    nom: 'Parcelle Test B', surface: 0.8, lat: 47.2210, lng: 4.9710, statut: 'Actif',
    taches: { Taille: 'Validé', Ebourgeonnage: { p1: 'Non démarré', p2: 'Non démarré', ov: false } },
  },
  {
    nom: 'Parcelle Test C', surface: 0.5, lat: 47.2190, lng: 4.9690, statut: 'Actif',
    taches: {},
  },
];

const TRACTEURS = [
  { id: 'tr1', nom: 'John Deere 5075E', modele: '5075E', type: 'Tracteur', traitementOnly: false },
  { id: 'tr2', nom: 'Enjambeur Bobard', modele: '1054', type: 'Enjambeur', traitementOnly: false },
];

const ACTIVITES = [
  { nom: 'Rognage', tracteurDefautId: 'tr2' },
  { nom: 'Labour', tracteurDefautId: 'tr1' },
  // Tarière : alimente les trous de plantation (§16b)
  { nom: 'Tarière', tracteurDefautId: 'tr1', champCustom: { label: 'Trous', type: 'nombre', feedsPlantation: true } },
];

async function main() {
  console.log('→ Seed tenant « ' + TENANT + ' » dans les émulateurs…');

  // 1) Registre GT (évite le gate d'onboarding) — doc racine SANS enveloppe {value}
  await db.doc('_guerettech/tenants').set({ slugs: [TENANT] }, { merge: true });

  // 2) Docs tenant (enveloppe {value:…})
  const base = 'mavigne_' + TENANT;
  await db.doc(base + '/membres').set({ value: MEMBRES });
  await db.doc(base + '/saisons').set({ value: SAISONS });
  await db.doc(base + '/config').set({ value: CONFIG });
  await db.doc(base + '/parcelles').set({ value: PARCELLES });
  await db.doc(base + '/tracteurs_list').set({ value: TRACTEURS });
  await db.doc(base + '/activites').set({ value: ACTIVITES });
  console.log('  ✓ Firestore : membres, saisons, config, parcelles, tracteurs, activités écrits');

  // 3) Compte Auth + claims
  let user;
  try {
    user = await auth.getUserByEmail(EMAIL);
    console.log('  · compte Auth déjà présent (' + EMAIL + ')');
  } catch {
    user = await auth.createUser({ email: EMAIL, password: PASSWORD, emailVerified: true, displayName: 'Nico E2E' });
    console.log('  ✓ compte Auth créé (' + EMAIL + ' / ' + PASSWORD + ')');
  }
  await auth.setCustomUserClaims(user.uid, { tenant: TENANT, ro: false });
  console.log('  ✓ claims posés : { tenant:"' + TENANT + '", ro:false }');

  console.log('\n✓ Seed terminé. Tenant de test prêt : ?tenant=' + TENANT + '  (login ' + EMAIL + ' / ' + PASSWORD + ')');
  process.exit(0);
}

main().catch((e) => { console.error('✖ Seed échoué :', e && e.stack || e); process.exit(1); });
