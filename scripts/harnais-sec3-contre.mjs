#!/usr/bin/env node
// ── CONTRE-EPREUVES DE harnais-sec3.mjs ──────────────────────────────────────
// Un harnais qui ne rougit jamais ne prouve rien. On REINTRODUIT chaque defaut
// dans une COPIE du depot, on relance le harnais, et on exige un rouge.
// ⚠️ Un plantage compte comme un rouge VALIDE seulement si le harnais sort en
// code != 0 : on lit le code de sortie, jamais la derniere ligne affichee.
// ⚠️ Chemins : join(dirname(fileURLToPath(...))) — jamais new URL().pathname.

import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ICI    = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ICI, '..');
const c = { g:(s)=>`\x1b[32m${s}\x1b[0m`, r:(s)=>`\x1b[31m${s}\x1b[0m`, d:(s)=>`\x1b[2m${s}\x1b[0m` };

const DEFAUTS = [
  { nom: 'le roster reprojette l\'email pour tout le monde',
    fichier: 'functions/claims.js',
    de: "      email:   (avecEmail && m.email) ? String(m.email) : '',",
    a:  "      email:   m.email ? String(m.email) : ''," },

  { nom: 'le seuil de compatibilite est inverse (v>=2 recoit les emails)',
    fichier: 'functions/claims.js',
    de: '  const avecEmail = !(vClient >= 2);',
    a:  '  const avecEmail = (vClient >= 2);' },

  { nom: 'getLoginEmail resout aussi les membres Inactif',
    fichier: 'functions/claims.js',
    de: "    && (x.statut || 'Actif') !== 'Inactif');",
    a:  '    && true);' },

  { nom: 'getLoginEmail journalise l\'adresse',
    fichier: 'functions/claims.js',
    de: "  console.log('[getLoginEmail]', slug, '\\u00b7', nom, '\\u00b7', m ? 'trouve' : 'inconnu');",
    a:  "  console.log('[getLoginEmail]', slug, '\\u00b7', nom, '\\u00b7', m ? m.email : 'inconnu');" },

  { nom: 'la normalisation du nom disparait (casse/espaces)',
    fichier: 'functions/claims.js',
    de: "  const nom  = String((request.data && request.data.nom) || '').trim();",
    a:  "  const nom  = String((request.data && request.data.nom) || '');" },

  { nom: 'la demande part a la validation, plus au clic',
    fichier: 'src/app.js',
    de: '  _loginEmailPromise = window.fbGetLoginEmail(m.nom).then(function(em){',
    a:  '  _loginEmailPromise = Promise.resolve(\'\').then(function(em){' },

  { nom: 'l\'attente n\'est plus bornee (bouton fige a l\'infini)',
    fichier: 'src/app.js',
    de: '    var _ms = _loginPendingEmail ? 2500 : 8000;',
    a:  '    var _ms = 99000;' },

  { nom: 'la borne courte disparait : 8 s meme avec un repli en main',
    fichier: 'src/app.js',
    de: '    var _ms = _loginPendingEmail ? 2500 : 8000;',
    a:  '    var _ms = 8000;' },

  { nom: 'on n\'appelle plus le serveur quand un repli existe',
    fichier: 'src/app.js',
    de: '  if(m.email) _loginPendingEmail = m.email;\n  if(!navigator.onLine || !window.fbGetLoginEmail) return;',
    a:  '  if(m.email){ _loginPendingEmail = m.email; return; }\n  if(!navigator.onLine || !window.fbGetLoginEmail) return;' },

  { nom: 'on appelle le reseau meme hors ligne',
    fichier: 'src/app.js',
    de: '  if(!navigator.onLine || !window.fbGetLoginEmail) return;',
    a:  '  if(!window.fbGetLoginEmail) return;' },

  { nom: 'quitter le profil n\'oublie plus l\'adresse',
    fichier: 'src/app.js',
    de: "  _loginPendingEmail = '';\n  _loginEmailPromise = null;\n  if(!m || !m.nom) return;",
    a:  "  if(!m || !m.nom) return;\n  _loginPendingEmail = '';\n  _loginEmailPromise = null;" },

  { nom: 'le champ « mot de passe oublie » est de nouveau pre-rempli',
    fichier: 'src/reglages.js',
    de: "  document.getElementById('login-forgot-email').value = '';",
    a:  "  document.getElementById('login-forgot-email').value = m.email || '';" },
];

let ok = 0, ko = 0;
console.log('\nContre-epreuves SEC-3 — chaque defaut doit faire ROUGIR le harnais\n');

for (const d of DEFAUTS) {
  const bac = mkdtempSync(join(tmpdir(), 'sec3-'));
  try {
    for (const dossier of ['src', 'scripts', 'functions']) {
      cpSync(join(RACINE, dossier), join(bac, dossier), { recursive: true });
    }
    const cible = join(bac, d.fichier);
    const src = readFileSync(cible, 'utf8');
    const n = src.split(d.de).length - 1;
    if (n !== 1) {
      console.log('  ' + c.r('✗') + ' ' + d.nom + c.d(`  → motif introuvable ou ambigu (${n}) : la contre-epreuve elle-meme est fausse`));
      ko++; continue;
    }
    writeFileSync(cible, src.replace(d.de, d.a), 'utf8');
    const r = spawnSync(process.execPath, [join(bac, 'scripts', 'harnais-sec3.mjs')],
      { encoding: 'utf8', timeout: 120000 });
    // Un plantage (code != 0, y compris une exception) est un rouge valide.
    if (r.status !== 0) { ok++; console.log('  ' + c.g('✓') + ' ' + d.nom + c.d('  → rouge, code ' + r.status)); }
    else { ko++; console.log('  ' + c.r('✗') + ' ' + d.nom + c.d('  → le harnais reste VERT : il ne prouve rien sur ce point')); }
  } finally {
    rmSync(bac, { recursive: true, force: true });
  }
}

console.log('\n' + (ko === 0
  ? c.g(`✓ ${ok} defauts reintroduits, ${ok} rouges obtenus`)
  : c.r(`✗ ${ko} contre-epreuve(s) en echec sur ${ok + ko}`)));
process.exit(ko === 0 ? 0 : 1);
