// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — MOTIFS-1 (§250) : CE QU'UN TÉLÉPHONE REÇOIT DU PLANNING
// ════════════════════════════════════════════════════════════════════════════
// Règle de Nico (05/10/2026) : un salarié ne voit pas les motifs d'absence de ses collègues — et son téléphone
// ne les REÇOIT pas. Trois documents restent chez l'administrateur (firestore.rules : lecture admin seule) :
// planning_entries (motifs, commentaires), planning_hsup (heures sup), planning_acomptes (acomptes).
// À leur place, un téléphone de salarié lit deux vues fabriquées par le serveur (functions/planning-vues-calc.js) :
//   · planning_equipe    — l'équipe sans motif ni commentaire ;
//   · planning_moi_<uid> — SES jours, complets : son « Mon mois » reste juste (motifs, couleurs, compteurs).
// Heures sup et acomptes : « Mon mois » n'en lit aucun (vérifié sur les fonctions qu'il appelle) — rien ne les remplace.
// Module PUR (ni window, ni document, ni Firebase) : src/firebase.js l'importe, scripts/mv-harnais-motifs1.mjs aussi.

export const PLAN_CLES_ADMIN = ['planning_entries', 'planning_hsup', 'planning_acomptes'];
export const PLAN_CLE_EQUIPE = 'planning_equipe';
export const PLAN_PREFIXE_MOI = 'planning_moi_';

export function planCleMoi(uid) {
  return (typeof uid === 'string' && uid) ? PLAN_PREFIXE_MOI + uid : null;
}

// LA VUE COMPLÈTE — la même question que les règles : isAdmin() = claim `adm` = deriveAdm(rôles), c'est-à-dire
// le rôle admin (tenu égal par mv-harnais-motifs1 sur les 32 combinaisons de rôles). S'y ajoutent les sessions
// qui lisent tout : GUERETTECH (console ou préparation d'un domaine, isGtAdmin) et la démo (jeu fictif, la règle
// démo lit tout sauf la paie). `prep` vient de window._mvPrepOn() : la seule question à poser sur la préparation.
// Sans session : vue salarié, la plus prudente — un téléphone en vue salarié n'écrit jamais le planning (garde de
// fbSave) : il ne peut rien abîmer.
export function planVueComplete(cu, prep) {
  if (prep) return true;
  if (!cu || typeof cu !== 'object') return false;
  if (cu._isGTAdmin === true || cu._isDemo === true) return true;
  var r = Array.isArray(cu.roles) ? cu.roles : [];
  return r.indexOf('admin') >= 0;
}

function estObjet(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

// Ce que détient le téléphone d'un salarié : l'équipe SANS motif, et à son nom SES jours complets.
// Tant que sa vue personnelle n'est pas arrivée, ses jours actuels restent tels quels (`miensActuels`).
export function planComposer(equipe, moi, miensActuels, nomActuel) {
  var out = {};
  if (estObjet(equipe)) Object.keys(equipe).forEach(function (nom) { out[nom] = equipe[nom]; });
  if (estObjet(moi) && typeof moi.nom === 'string' && moi.nom) {
    out[moi.nom] = estObjet(moi.entries) ? moi.entries : {};
  } else if (typeof nomActuel === 'string' && nomActuel && estObjet(miensActuels)) {
    out[nomActuel] = miensActuels;
  }
  return out;
}

// Avant la première réponse du serveur : la copie du téléphone peut dater d'avant ce lot (ou venir d'un admin
// connecté plus tôt sur le même appareil). On n'en garde que les jours de la personne connectée.
export function planGarderLesMiens(entries, nom) {
  var out = {};
  if (typeof nom === 'string' && nom && estObjet(entries) && estObjet(entries[nom])) out[nom] = entries[nom];
  return out;
}
