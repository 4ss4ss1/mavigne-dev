'use strict';
// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — NOTIF-3 (§311) : LA NOTIFICATION DU MATIN — LE CALCUL, SANS AUCUN require
// ════════════════════════════════════════════════════════════════════════════
// Demande de Nico (11/10/2026) : « les notifications, on les reçoit vraiment de façon intempestive. L'idée, c'est
// d'en avoir une […] le matin, en fonction de l'heure à laquelle on prend le travail […] sur le téléphone ».
// ⚠️ Le serveur ne recalcule RIEN du planning. L'appli de l'administrateur publie, à chaque enregistrement et une
//    fois par jour, l'heure de prise de poste de chacun et les lignes de son message pour les quatorze jours qui
//    viennent (src/planning.js/_planPrisesDePoste, src/reglages.js/_mvNotifPublier) : le même calcul que l'écran,
//    jamais une seconde source d'horaire (CLAUDE.md, « deux sources d'horaire pour une même journée »).
// Ici : valider ce qui arrive des téléphones, et choisir à chaque quart d'heure qui reçoit quoi.
// Module PUR : scripts/mv-harnais-notif3.mjs joue le VRAI code. Lecteur : functions/notif.js.

const TENANT_PREFIX = 'mavigne_';
const PAS_MIN = 15;                                    // notifMatin passe tous les quarts d'heure
const RE_JOUR = /^\d{4}-\d{2}-\d{2}$/;
const RE_HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
const RE_B64U = /^[A-Za-z0-9_-]+={0,2}$/;
// Les services d'envoi des navigateurs (Chrome/Android, Firefox, Safari/iPhone, Edge). Un abonnement qui vise une
// autre adresse est refusé : sinon le serveur posterait où on veut, au nom du domaine.
const HOTES = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/,
  /^web\.push\.apple\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];

function estObjet(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function texte(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }

// L'abonnement d'un téléphone, tel que PushSubscription.toJSON() le rend : { endpoint, keys:{ p256dh, auth } }.
function abonnementValide(a) {
  if (!estObjet(a) || typeof a.endpoint !== 'string' || a.endpoint.length > 1024 || !estObjet(a.keys)) return null;
  let u; try { u = new URL(a.endpoint); } catch (e) { return null; }
  if (u.protocol !== 'https:' || !HOTES.some((re) => re.test(u.hostname))) return null;
  const p = a.keys.p256dh, k = a.keys.auth;
  if (typeof p !== 'string' || typeof k !== 'string' || !RE_B64U.test(p) || !RE_B64U.test(k)) return null;
  if (p.length < 80 || p.length > 100 || k.length < 16 || k.length > 32) return null;
  return { endpoint: a.endpoint, keys: { p256dh: p, auth: k } };
}

// La publication de l'administrateur : { 'AAAA-MM-JJ': { <nom> : { h:'HH:MM', l:[lignes] } } }. Tout ou rien.
function publicationValide(jours) {
  if (!estObjet(jours)) return null;
  const dates = Object.keys(jours);
  if (!dates.length || dates.length > 31) return null;
  const out = {};
  for (const iso of dates) {
    if (!RE_JOUR.test(iso) || !estObjet(jours[iso])) return null;
    const noms = Object.keys(jours[iso]);
    if (noms.length > 300) return null;
    const j = {};
    for (const nom of noms) {
      const e = jours[iso][nom], n = texte(nom, 80);
      if (!n || !estObjet(e) || typeof e.h !== 'string' || !RE_HEURE.test(e.h)) return null;
      j[n] = { h: e.h, l: Array.isArray(e.l) ? e.l.map((x) => texte(x, 160)).filter(Boolean).slice(0, 6) : [] };
    }
    out[iso] = j;
  }
  return JSON.stringify(out).length > 400000 ? null : out;
}

function valeur(snap) { const d = (snap && typeof snap.data === 'function') ? snap.data() : null; return (d && d.value !== undefined) ? d.value : undefined; }

// Le membre d'un compte : l'adresse VÉRIFIÉE du jeton contre la fiche de l'équipe (même lien que planning-vues-calc).
function membreDuCompte(membres, email) {
  const mail = texte(email, 320).toLowerCase();
  if (!mail || !Array.isArray(membres)) return null;
  const m = membres.find((x) => estObjet(x) && typeof x.email === 'string' && x.email.trim().toLowerCase() === mail
    && typeof x.nom === 'string' && x.nom);
  if (!m || m.statut === 'Inactif') return null;
  return { nom: m.nom };
}

// L'instant d'un passage, à l'heure de Paris, ramené au quart d'heure.
function parisDe(date) {
  const p = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).forEach((x) => { p[x.type] = x.value; });
  const min = Math.floor((parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10)) / PAS_MIN) * PAS_MIN;
  return { iso: p.year + '-' + p.month + '-' + p.day, min,
    hhmm: String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0') };
}
function minutes(h) { const x = String(h).split(':'); return parseInt(x[0], 10) * 60 + parseInt(x[1], 10); }
function prenom(nom) { return String(nom).trim().split(/\s+/)[0] || String(nom); }

// Le message d'une personne pour un jour. Rien de particulier à dire : « Bonne journée ! ».
function message(nom, e, iso) {
  const l = (e && Array.isArray(e.l)) ? e.l : [];
  return { titre: 'Bonjour ' + prenom(nom), corps: l.length ? l.join('\n') : 'Bonne journée !', tag: 'mv-matin-' + iso, url: '/' };
}

// À ce passage : chaque abonnement dont la personne prend son poste dans [ce quart d'heure, le suivant) — un poste à
// 07:10 reçoit son message à 07:00, jamais après l'heure —, sauf s'il l'a déjà reçu aujourd'hui (un passage rejoué
// ne renvoie rien). Les jours de repos, de congé ou d'arrêt, la personne n'est pas dans la publication : rien.
function planDuQuart(publications, abonnements, quand) {
  const parSlug = {};
  (publications || []).forEach((p) => {
    if (p && typeof p.slug === 'string' && estObjet(p.jours) && estObjet(p.jours[quand.iso])) parSlug[p.slug] = p.jours[quand.iso];
  });
  const out = [];
  (abonnements || []).forEach((a) => {
    if (!a || !parSlug[a.slug] || typeof a.nom !== 'string' || !estObjet(a.abo)) return;
    const e = parSlug[a.slug][a.nom];
    if (!e || typeof e.h !== 'string' || !RE_HEURE.test(e.h)) return;
    const m = minutes(e.h);
    if (m < quand.min || m >= quand.min + PAS_MIN) return;
    if (a.dernier === quand.iso) return;
    out.push({ id: a.id, slug: a.slug, nom: a.nom, abo: a.abo, message: message(a.nom, e, quand.iso) });
  });
  return out;
}

module.exports = { TENANT_PREFIX, PAS_MIN, HOTES, abonnementValide, publicationValide, valeur, membreDuCompte,
  parisDe, minutes, prenom, message, planDuQuart };
