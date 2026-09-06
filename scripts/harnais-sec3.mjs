#!/usr/bin/env node
// ── HARNAIS SEC-3 : l'adresse mail ne sort plus en bloc ──────────────────────
//
// Ce que le lot promet, et que ce harnais mesure :
//   1. getLoginRoster ne projette plus d'email pour un client v>=2, et en
//      projette encore pour un client sans `v` (compatibilite).
//   2. getLoginEmail rend l'adresse d'UN nom, rien d'autre ; inconnu et Inactif
//      rendent une chaine vide ; l'adresse n'est JAMAIS journalisee.
//   3. Cote client, la resolution est lancee au CLIC et l'attente est BORNEE.
//   4. Le champ « mot de passe oublie » n'est plus pre-rempli.
//
// ⚠️ METHODE : on EXECUTE les vraies fonctions extraites des fichiers, on ne
// cherche pas un motif de texte. Trois des cinq premieres contre-epreuves d'un
// lot precedent etaient fausses parce qu'elles cherchaient une phrase qu'une
// autre ligne du meme fichier satisfaisait deja (§53).
// ⚠️ Chemin de fichier : jamais new URL(...).pathname — sous Windows il rend
// /C:/Users/... que Node repart en C:\C:\Users\... (§53, vecu chez Nico).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ICI    = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ICI, '..');
const lire = (rel) => readFileSync(join(RACINE, rel), 'utf8');

let ok = 0, ko = 0;
const c = { g:(s)=>`\x1b[32m${s}\x1b[0m`, r:(s)=>`\x1b[31m${s}\x1b[0m`, d:(s)=>`\x1b[2m${s}\x1b[0m` };
function verifie(nom, cond, detail) {
  if (cond) { ok++; console.log('  ' + c.g('✓') + ' ' + nom); }
  else { ko++; console.log('  ' + c.r('✗') + ' ' + nom + (detail ? c.d('  → ' + detail) : '')); }
}

// ── Extraction : on decoupe la vraie fonction par ses bornes, pas par regex ──
function decoupe(src, debut, fin, quoi) {
  const i = src.indexOf(debut);
  if (i < 0) throw new Error('borne de debut introuvable pour ' + quoi + ' : ' + debut);
  const j = src.indexOf(fin, i + debut.length);
  if (j < 0) throw new Error('borne de fin introuvable pour ' + quoi + ' : ' + fin);
  return src.slice(i, j + fin.length);
}

const MEMBRES_TEST = [
  { nom: 'Nico',      email: 'nico@perso.fr',   roles: ['admin'],   statut: 'Actif',   couleur: '#1' },
  { nom: 'Victor',    email: 'victor@perso.fr', roles: ['ouvrier'], statut: 'Actif',   couleur: '#2' },
  { nom: 'Ancien',    email: 'parti@perso.fr',  roles: ['ouvrier'], statut: 'Inactif', couleur: '#3' },
  { nom: 'Sans mail', email: '',                roles: ['ouvrier'], statut: 'Actif',   couleur: '#4' },
];

// ═══ 1. La projection du roster (fonction reelle de claims.js) ═══
console.log('\n1. getLoginRoster — la projection');
const claims = lire('functions/claims.js');
const blocRoster = decoupe(claims, '  const roster = arr', '  return { roster: roster };', 'roster');
const projette = new Function('arr', 'avecEmail', blocRoster);   // rend { roster: [...] }

const rNeuf   = projette(MEMBRES_TEST, false).roster;   // client v:2
const rAncien = projette(MEMBRES_TEST, true).roster;    // client d'avant SEC-3

verifie('client v:2 — AUCUNE adresse dans la reponse',
  rNeuf.every((m) => m.email === ''),
  JSON.stringify(rNeuf.map((m) => m.email)));
verifie('client v:2 — les noms sont toujours la (la tuile doit s\'afficher)',
  rNeuf.length === MEMBRES_TEST.length && rNeuf[0].nom === 'Nico' && rNeuf[1].nom === 'Victor');
verifie('client v:2 — roles/statut/couleur intacts (la tuile a besoin des trois)',
  rNeuf[0].roles[0] === 'admin' && rNeuf[0].statut === 'Actif' && rNeuf[0].couleur === '#1');
verifie('client ancien — les adresses sont encore servies (pas de verrouillage dehors)',
  rAncien[0].email === 'nico@perso.fr' && rAncien[1].email === 'victor@perso.fr');

// La lecture du parametre v, telle qu'ecrite dans la function
const blocV = decoupe(claims, "  const vClient = Number(", '  const avecEmail = !(vClient >= 2);', 'parametre v');
const litV = new Function('request', blocV + '\n  return avecEmail;');
verifie('v:2 → pas d\'email',            litV({ data: { v: 2 } }) === false);
verifie('v:3 (futur) → pas d\'email',    litV({ data: { v: 3 } }) === false);
verifie('aucun v → email (client ancien)', litV({ data: {} }) === true);
verifie('v:1 explicite → email',         litV({ data: { v: 1 } }) === true);

// ═══ 2. getLoginEmail ═══
console.log('\n2. getLoginEmail — une adresse, une seule');
const blocCible = decoupe(claims, '  const cible = nom.toLowerCase();', "  return { email: (m && m.email) ? String(m.email) : '' };", 'getLoginEmail');
// ⚠⚠ CE DECOUPAGE A DEJA ETE FAUX UNE FOIS, ET C'EST INSTRUCTIF.
// Il partait de `const cible = nom.toLowerCase();` — donc SOUS le .trim() de la
// ligne 1716 — puis affirmait tester la tolerance aux espaces. Le harnais coupait
// la normalisation, la testait, et la declarait absente. Le code etait juste.
// On inclut donc la ligne qui normalise, et on passe `request` comme la vraie
// function le recoit : ce qui est teste est la chaine ENTIERE, entree comprise.
const ligneNom = decoupe(claims, "  const nom  = String((request.data", ".trim();", 'normalisation du nom');
const resout = new Function('request', 'arr', 'slug', 'console', ligneNom + '\n' + blocCible);
const journal = [];
const faussseConsole = { log: (...a) => journal.push(a.join(' ')), error: () => {} };
const R = (nom) => resout({ data: { nom: nom } }, MEMBRES_TEST, 'domaine-test', faussseConsole);

verifie('un nom connu rend SON adresse',            R('Nico').email === 'nico@perso.fr');
verifie('la casse et les espaces ne comptent pas',  R('  nIcO ').email === 'nico@perso.fr');
verifie('un nom inconnu rend une chaine vide',      R('Personne').email === '');
verifie('un membre Inactif n\'est pas resoluble',   R('Ancien').email === '');
verifie('un membre sans adresse rend une chaine vide', R('Sans mail').email === '');
verifie('l\'ADRESSE n\'est jamais journalisee',
  journal.length > 0 && !journal.join('|').includes('@'),
  journal.join(' | '));
verifie('le NOM est journalise (reperer une moisson nom par nom)',
  journal.some((l) => l.includes('Nico')));

// ═══ 3. Le client : resolution au clic, attente bornee ═══
console.log('\n3. app.js — la resolution cote client');
const app = lire('src/app.js');
const blocAides = decoupe(app, 'function _loginResolveEmail(m){', 'window._mvLoginAwaitEmail = _loginAwaitEmail;', 'aides SEC-3');
const prelude = `
  var _loginPendingEmail = '', _loginEmailPromise = null;
  var window = { logError: function(){} , fbGetLoginEmail: fbGetLoginEmail };
  var navigator = { onLine: enLigne };
`;
function monteClient({ enLigne = true, reponse = 'du-serveur@x.fr', lent = false, casse = false } = {}) {
  let appels = 0;
  const fbGetLoginEmail = (nom) => {
    appels++;
    if (casse) return Promise.reject(new Error('reseau'));
    if (lent)  return new Promise(() => {});          // ne repond JAMAIS
    return Promise.resolve(reponse);
  };
  const f = new Function('fbGetLoginEmail', 'enLigne',
    prelude + blocAides + '\n return { resoudre: _loginResolveEmail, attendre: _loginAwaitEmail };');
  const api = f(fbGetLoginEmail, enLigne);
  return { api, appels: () => appels };
}

{
  const { api, appels } = monteClient({});
  api.resoudre({ nom: 'Nico', email: '' });
  verifie('le clic sur une tuile DECLENCHE la demande (pas la validation)', appels() === 1);
  const t0 = Date.now();
  const mail = await api.attendre();
  verifie('la reponse du serveur est utilisee', mail === 'du-serveur@x.fr', mail);
  verifie('aucune attente perceptible quand le serveur repond', Date.now() - t0 < 300);
}
{
  const { api, appels } = monteClient({ enLigne: false });
  api.resoudre({ nom: 'Nico', email: 'repli@local.fr' });
  verifie('hors ligne : AUCUN appel reseau', appels() === 0);
  verifie('hors ligne : le repli local sert', (await api.attendre()) === 'repli@local.fr');
}
{
  const { api, appels } = monteClient({});
  api.resoudre({ nom: 'Nico', email: 'repli@local.fr' });
  verifie('en ligne AVEC repli : on appelle quand meme (le chemin neuf doit tourner)', appels() === 1);
  verifie('la reponse du serveur PRIME sur le repli', (await api.attendre()) === 'du-serveur@x.fr');
}
{
  const { api } = monteClient({ casse: true });
  api.resoudre({ nom: 'Nico', email: 'repli@local.fr' });
  verifie('serveur en panne : le repli tient, aucune exception', (await api.attendre()) === 'repli@local.fr');
}
{
  const { api } = monteClient({ lent: true });
  api.resoudre({ nom: 'Nico', email: 'repli@local.fr' });
  const t0 = Date.now();
  const mail = await api.attendre();
  const dt = Date.now() - t0;
  verifie('serveur muet AVEC repli : borne courte (~2,5 s), pas 8', dt >= 2400 && dt < 3200, dt + ' ms');
  verifie('serveur muet AVEC repli : on se connecte quand meme', mail === 'repli@local.fr');
}
{
  // ⚠ ASSERTION FAIBLE CORRIGEE : elle appelait resoudre(null) sur un client NEUF,
  // ou _loginPendingEmail valait deja ''. Elle constatait un etat deja vrai et ne
  // pouvait donc pas echouer — la contre-epreuve « quitter le profil n'oublie plus »
  // restait verte. On choisit d'abord un profil, PUIS on le quitte.
  const { api } = monteClient({});
  api.resoudre({ nom: 'Nico', email: 'repli@local.fr' });
  const avant = await api.attendre();
  verifie('un profil choisi met bien une adresse en main (pre-condition)', avant !== '');
  api.resoudre(null);
  verifie('quitter le profil oublie l\'adresse', (await api.attendre()) === '');
}

// ═══ 4. Le champ « mot de passe oublie » ═══
console.log('\n4. reglages.js — le champ n\'est plus pre-rempli');
const reg = lire('src/reglages.js');
const blocForgot = decoupe(reg, 'async function showForgotPanel() {', 'document.getElementById(\'login-forgot-panel\').style.display = \'block\';', 'showForgotPanel');
verifie('le champ est vide, pas rempli avec l\'adresse du membre',
  /login-forgot-email'\)\.value = '';/.test(blocForgot));
verifie('plus aucune lecture de m.email dans ce bloc, sauf le repli explicite',
  (blocForgot.match(/m\.email/g) || []).length <= 1,
  (blocForgot.match(/m\.email/g) || []).join(','));

console.log('\n' + (ko === 0 ? c.g(`✓ SEC-3 : ${ok} verifications, 0 rouge`) : c.r(`✗ SEC-3 : ${ko} rouge(s) sur ${ok + ko}`)));
process.exit(ko === 0 ? 0 : 1);
