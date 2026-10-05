'use strict';
// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — MOTIFS-1 (§250) : CE QU'UN SALARIÉ REÇOIT DU PLANNING DE L'ÉQUIPE
// ════════════════════════════════════════════════════════════════════════════
// Règle de Nico (05/10/2026) : un salarié ne doit pas voir les motifs d'absence de ses collègues.
// Cacher le motif à l'écran ne suffisait pas : le planning COMPLET (motifs, commentaires) partait sur le
// téléphone de chaque membre. Désormais `planning_entries` n'est lisible que par l'administrateur
// (firestore.rules, isAdminReadDoc) et le serveur fabrique, à chaque écriture, deux vues :
//   · planning_equipe     — toute l'équipe, SANS motif ni commentaire : lisible par tout membre ;
//   · planning_moi_<uid>  — les jours COMPLETS d'un seul salarié : lisibles par lui seul (et l'admin).
// Le téléphone d'un salarié compose les deux (src/planning-vue.js) : son « Mon mois » reste juste.
//
// Module PUR : aucun require. Firestore et l'annuaire des comptes sont passés en paramètre — c'est ce qui
// permet à scripts/mv-harnais-motifs1.mjs de jouer le VRAI code, sans émulateur.
// Lecteurs : functions/planning-vues.js (les deux déclencheurs) et functions/claims.js (gtPlanningVues).

const CLE_SOURCE = 'planning_entries';
const CLE_EQUIPE = 'planning_equipe';
const PREFIXE_MOI = 'planning_moi_';
const TENANT_PREFIX = 'mavigne_';

// Les champs d'une journée : la liste exécutée de SCHEMA-1 (_planEntreeProbleme, src/planning.js), plus `extra`
// (relu, plus écrit). Un objet qui porte l'un d'eux est une JOURNÉE ; sinon c'est un conteneur (année, mois).
// ⚠️ Un champ ajouté demain au planning doit être ajouté ICI pour être reconnu — et décidé dans vueJour pour
//    sortir vers les collègues. Tant que rien n'est décidé, il reste chez l'admin (liste blanche).
const CHAMPS_JOUR = ['absent', 'motif', 'comment', 'timing', 'remplacement', 'motif_h', 'motif_t',
  'abs_de', 'abs_a', 'effectif', 'type', 'heures', 'reduit_motif', 'canicule', 'extra'];

function estObjet(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function estJour(o) {
  return estObjet(o) && CHAMPS_JOUR.some((k) => Object.prototype.hasOwnProperty.call(o, k));
}
function horaire(t) {
  if (!estObjet(t) || typeof t.debut !== 'string' || typeof t.fin !== 'string') return null;
  return { debut: t.debut, fin: t.fin, continu: t.continu === true };
}

// Une journée vue par un COLLÈGUE. Liste blanche : ce qui n'est pas écrit ici ne sort pas.
//   · congé payé, récup, absence d'une journée entière → { absent:true, motif:'autre' } : « absence non
//     précisée », que le moteur du planning lit comme une absence neutre. Ni un congé, ni un arrêt, ni une
//     absence injustifiée ne se devinent — même un congé s'affiche « absent » (décision du 05/10) ;
//   · absence d'une partie de la journée, retard → la personne est venue : jour au modèle (rien), sauf un jour
//     d'échange, qui garde son horaire pour rester « présent » ;
//   · jour d'échange ou extra travaillé (0 h au modèle) → son horaire seul ;
//   · tout le reste (horaire modifié, chaleur, journée réduite et son motif) → jour au modèle (rien) ;
//   · l'effectif d'une équipe collective passe toujours : un nombre de personnes, pas un motif.
function vueJour(e) {
  if (!estObjet(e)) return null;
  let out = null;
  if (e.type === 'cp' || e.type === 'recup') {
    out = { absent: true, motif: 'autre' };
  } else if (e.absent === true) {
    const partiel = typeof e.abs_de === 'string' && e.abs_de !== '' && typeof e.abs_a === 'string' && e.abs_a !== '';
    const retard = e.motif === 'retard' || (typeof e.motif_h === 'number' && e.motif_h > 0)
                   || (typeof e.motif_t === 'string' && e.motif_t !== '');
    if (!partiel && !retard) out = { absent: true, motif: 'autre' };
    else if (e.remplacement === true && horaire(e.timing)) out = { timing: horaire(e.timing), remplacement: true };
  } else if ((e.remplacement === true || e.extra === true) && horaire(e.timing)) {
    out = { timing: horaire(e.timing) };
    if (e.remplacement === true) out.remplacement = true;
    if (e.extra === true) out.extra = true;
  }
  if (typeof e.effectif === 'number' && isFinite(e.effectif) && e.effectif >= 1) {
    out = out || {};
    out.effectif = e.effectif;
  }
  return out;
}

// Un sous-arbre (années, mois, jours — ancienne forme sans année comprise) : chaque journée passe par vueJour,
// les conteneurs vides disparaissent.
function vueSousArbre(v) {
  if (estJour(v)) return vueJour(v);
  if (!estObjet(v)) return null;
  const out = {};
  let n = 0;
  Object.keys(v).forEach((k) => {
    const s = vueSousArbre(v[k]);
    if (s !== null) { out[k] = s; n++; }
  });
  return n ? out : null;
}

function vueEquipe(entries) {
  const out = {};
  if (!estObjet(entries)) return out;
  Object.keys(entries).forEach((nom) => {
    const s = vueSousArbre(entries[nom]);
    if (s !== null) out[nom] = s;
  });
  return out;
}

// Égalité de contenu, l'ordre des clés ne compte pas : une vue déjà à jour n'est pas réécrite.
function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (estObjet(v)) return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
function egal(a, b) { return canon(a) === canon(b); }
function valeur(snap) {
  if (!snap || !snap.exists) return undefined;
  const d = snap.data();
  return (d && d.value !== undefined) ? d.value : undefined;
}

// Les membres qui peuvent se connecter : un nom et une adresse. Une équipe collective, un saisonnier sans
// compte n'ont pas de vue personnelle (ils n'ouvrent jamais l'appli).
function cibles(membres) {
  const out = [], vu = {};
  (Array.isArray(membres) ? membres : []).forEach((m) => {
    if (!estObjet(m) || typeof m.nom !== 'string' || !m.nom || typeof m.email !== 'string') return;
    const mail = m.email.trim().toLowerCase();
    if (!mail || vu[mail]) return;
    vu[mail] = true;
    out.push({ nom: m.nom, email: mail });
  });
  return out;
}
async function uidsParAdresse(auth, adresses) {
  const out = {};
  for (let i = 0; i < adresses.length; i += 100) {          // getUsers : 100 identifiants au plus par appel
    const r = await auth.getUsers(adresses.slice(i, i + 100).map((email) => ({ email })));
    ((r && r.users) || []).forEach((u) => { if (u && u.email && u.uid) out[String(u.email).toLowerCase()] = u.uid; });
  }
  return out;
}

// Fabrique les vues d'UN domaine. Idempotent : n'écrit que ce qui a changé.
// ⚠️ Ne recrée RIEN quand la liste des membres ou le planning n'existe plus : gtDeleteTenant supprime les
//    documents un par un et chaque suppression réveille un déclencheur — sans cette garde, les vues
//    renaîtraient dans un domaine qu'on vient d'effacer.
async function deriverDomaine(db, auth, coll) {
  if (typeof coll !== 'string' || coll.indexOf(TENANT_PREFIX) !== 0 || coll.length <= TENANT_PREFIX.length) {
    return { ignore: 'collection hors domaine' };
  }
  const refSrc = db.doc(coll + '/' + CLE_SOURCE);
  const refMbr = db.doc(coll + '/membres');
  const refEq = db.doc(coll + '/' + CLE_EQUIPE);
  // L'annuaire des comptes n'est pas Firestore : il se consulte AVANT la transaction.
  const mbr = valeur(await refMbr.get());
  if (!Array.isArray(mbr)) return { ignore: 'aucune liste de membres' };
  const cib = cibles(mbr);
  const uids = cib.length ? await uidsParAdresse(auth, cib.map((c) => c.email)) : {};
  const avecCompte = cib.filter((c) => uids[c.email]).map((c) => ({ nom: c.nom, uid: uids[c.email] }));
  // La transaction relit le planning : deux écritures rapprochées ne peuvent pas laisser une vue en retard.
  return db.runTransaction(async (tx) => {
    const src = valeur(await tx.get(refSrc));
    if (src === undefined) return { ignore: 'aucun planning' };
    const entries = estObjet(src) ? src : {};
    const refsMoi = avecCompte.map((c) => db.doc(coll + '/' + PREFIXE_MOI + c.uid));
    const snaps = await tx.getAll(refEq, ...refsMoi);        // toutes les lectures AVANT la première écriture
    let ecrits = 0;
    const eq = vueEquipe(entries);
    if (!egal(valeur(snaps[0]), eq)) { tx.set(refEq, { value: eq }); ecrits++; }
    avecCompte.forEach((c, i) => {
      const v = { nom: c.nom, entries: estObjet(entries[c.nom]) ? entries[c.nom] : {} };
      if (!egal(valeur(snaps[i + 1]), v)) { tx.set(refsMoi[i], { value: v }); ecrits++; }
    });
    return { ecrits, personnes: avecCompte.length, sansCompte: cib.length - avecCompte.length };
  });
}

module.exports = {
  CLE_SOURCE, CLE_EQUIPE, PREFIXE_MOI, TENANT_PREFIX, CHAMPS_JOUR,
  vueJour, vueEquipe, cibles, egal, deriverDomaine,
};
