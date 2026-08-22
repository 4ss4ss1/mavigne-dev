#!/usr/bin/env node
'use strict';
// ── CONTRE-ÉPREUVES SEC-6 ────────────────────────────────────────────────────
// Un harnais vert ne prouve rien tant qu'on ne l'a pas vu rougir. On réintroduit
// chaque défaut, un par un, et on exige DEUX choses : que le harnais sorte en
// erreur, ET que ce soit bien l'assertion visée qui tombe — pas une autre.
// C'est la deuxième condition qui compte : sur un lot précédent, deux contre-
// épreuves passaient au vert parce qu'une phrase écrite ailleurs dans le même
// fichier satisfaisait déjà le motif cherché (§53).
//
// ⚠️ Chemin : __dirname, jamais new URL(...).pathname (§53, Windows).

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const HARNAIS = path.join(__dirname, 'harnais-sec6.cjs');
const c = { g:(s)=>`\x1b[32m${s}\x1b[0m`, r:(s)=>`\x1b[31m${s}\x1b[0m`, d:(s)=>`\x1b[2m${s}\x1b[0m` };

// attendu : fragment que la LIGNE ROUGE doit contenir.
const CAS = [
  { nom: 'le throttle disparaît de submitLead',
    env: { MV_SEC6_MUT: 'throttle-absent-lead' },
    attendu: 'submitLead appelle le débit exactement 1 fois' },
  { nom: 'le throttle passe avant le honeypot (mise en route)',
    env: { MV_SEC6_MUT: 'ordre-inverse-mer' },
    attendu: 'honeypot AVANT le débit' },
  { nom: 'la limite revient en dur dans la comparaison',
    env: { MV_SEC6_MUT: 'limite-en-dur' },
    attendu: 'la comparaison de seuil lit la constante' },
  { nom: 'la fenêtre diverge de celle de claims.js',
    env: { MV_SEC6_MUT: 'fenetre-divergente' },
    attendu: 'fenêtres égales' },
  { nom: 'ipHash recopié de claims.js (lit rawRequest)',
    env: { MV_SEC6_MUT: 'iphash-rawrequest' },
    attendu: 'deux IP différentes = deux clés différentes' },
  { nom: 'le refus devient visible du client (429)',
    env: { MV_SEC6_MUT: 'refus-visible' },
    attendu: 'le client reçoit 200' },
  // Les trois cas HSTS se testent drapeau FORCÉ À TRUE : sans ça, le harnais est en
  // mode attente et ne regarde même pas includeSubDomains — les contre-épreuves
  // passeraient au vert sans rien prouver.
  { nom: 'HSTS sans includeSubDomains',
    env: { MV_SEC6_HSTS_FLAG: '1', MV_SEC6_HSTS: 'max-age=31536000' },
    attendu: 'includeSubDomains présent' },
  { nom: 'HSTS sans preload',
    env: { MV_SEC6_HSTS_FLAG: '1', MV_SEC6_HSTS: 'max-age=31536000; includeSubDomains' },
    attendu: 'preload présent' },
  { nom: 'HSTS à six mois',
    env: { MV_SEC6_HSTS_FLAG: '1', MV_SEC6_HSTS: 'max-age=15768000; includeSubDomains; preload' },
    attendu: 'max-age ≥ 31536000' },
  // Et le sens inverse : renfort parti alors que le drapeau dit « en attente ».
  // C'est le déploiement accidentel — celui qui grille www pour un an sans le vouloir.
  { nom: 'renfort déployé alors que le drapeau dit attente',
    env: { MV_SEC6_HSTS: 'max-age=31536000; includeSubDomains; preload' },
    attendu: 'renfort absent, conforme au drapeau' },
];

let ok = 0, ko = 0;

// Pré-condition : sans mutation, le harnais DOIT être vert. Sans ça, tous les
// rouges ci-dessous pourraient venir d'autre chose que de la mutation.
{
  const r = spawnSync(process.execPath, [HARNAIS], { encoding: 'utf8' });
  if (r.status === 0) { ok++; console.log('  ' + c.g('✓') + ' pré-condition : le harnais est vert sans mutation'); }
  else { ko++; console.log('  ' + c.r('✗') + ' pré-condition : le harnais n\'est PAS vert sans mutation'); }
}

for (const cas of CAS) {
  const r = spawnSync(process.execPath, [HARNAIS], {
    encoding: 'utf8',
    env: Object.assign({}, process.env, cas.env),
  });
  const sortie = (r.stdout || '') + (r.stderr || '');
  // La ligne rouge : celles marquées ✗, hors ligne de bilan.
  const rouges = sortie.split('\n').filter((l) => l.includes('✗') && !/SEC-6 :/.test(l));
  const rougeAttendue = rouges.some((l) => l.includes(cas.attendu));
  // Un CRASH compte comme rouge, mais pas comme la bonne raison.
  const crash = /CRASH/.test(sortie);

  if (r.status !== 0 && rougeAttendue && !crash) {
    ok++;
    console.log('  ' + c.g('✓') + ' ' + cas.nom + c.d('  → ' + rouges.length + ' rouge(s), dont celui attendu'));
  } else {
    ko++;
    console.log('  ' + c.r('✗') + ' ' + cas.nom
      + c.d('  → exit=' + r.status + (crash ? ' · CRASH' : '')
            + ' · rouges: ' + (rouges.length ? rouges.map((l) => l.replace(/\x1b\[\d+m/g, '').trim()).join(' | ') : 'aucun')));
  }
}

console.log('\n' + (ko === 0
  ? c.g(`✓ CONTRE-ÉPREUVES SEC-6 : ${ok} défauts réintroduits, tous détectés`)
  : c.r(`✗ CONTRE-ÉPREUVES SEC-6 : ${ko} non détecté(s) sur ${ok + ko}`)));
process.exit(ko === 0 ? 0 : 1);
