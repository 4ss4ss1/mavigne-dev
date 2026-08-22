#!/usr/bin/env node
// ── CONTRE-EPREUVES DE harnais-uxlogin.mjs ───────────────────────────────────
// On REINTRODUIT chaque defaut dans une COPIE, on relance, on exige un rouge.
// Un plantage compte comme rouge VALIDE si le code de sortie est != 0 : on lit
// le code, jamais la derniere ligne affichee.

import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ICI, '..');
const c = { g:(s)=>`\x1b[32m${s}\x1b[0m`, r:(s)=>`\x1b[31m${s}\x1b[0m`, d:(s)=>`\x1b[2m${s}\x1b[0m` };

const DEFAUTS = [
  { nom: '⚠️ LE PIEGE : on reindexe le tableau filtre (clic sur la mauvaise fiche)',
    de: '  aAfficher.forEach(function(idx){\n    var m = MEMBRES[idx];',
    a:  '  aAfficher.map(function(x,n){ return n; }).forEach(function(idx){\n    var m = MEMBRES[idx];' },

  { nom: 'un membre Inactif reprend une tuile',
    de: "    if(mv && mv.nom && mv.statut !== 'Inactif') visibles.push(i);",
    a:  '    if(mv && mv.nom) visibles.push(i);' },

  { nom: 'le lien de sortie est masque quand la tuile est unique',
    de: "  if(lien) lien.style.display = (seul >= 0) ? 'block' : 'none';",
    a:  "  if(lien) lien.style.display = 'none';" },

  { nom: 'la tuile unique s\'applique meme a un domaine d\'une personne',
    de: '  if(!_loginVoirTous && visibles.length > 1){',
    a:  '  if(!_loginVoirTous){' },

  { nom: '« Ce n\'est pas moi » ne rouvre plus la liste',
    de: '  _loginVoirTous = true;\n  _loginRenderTuiles();',
    a:  '  _loginVoirTous = true;' },

  { nom: '« Ce n\'est pas moi » efface le souvenir au passage',
    de: '  _loginVoirTous = true;\n  _loginRenderTuiles();',
    a:  '  _loginVoirTous = true;\n  _loginMemOublier();\n  _loginRenderTuiles();' },

  { nom: 'un souvenir orphelin fait planter au lieu de retomber sur la liste',
    de: '        if(mk && String(mk.nom).trim().toLowerCase() === memo){ seul = visibles[k]; break; }',
    a:  '        if(String(mk.nom).trim().toLowerCase() === memo){ seul = visibles[k]; } else { seul = visibles[k]; }' },

  { nom: 'la comparaison du souvenir devient sensible a la casse',
    de: '    var memo = _loginMemLire().trim().toLowerCase();',
    a:  '    var memo = _loginMemLire().trim();' },

  { nom: 'la memoire n\'est plus scopee au domaine',
    de: "  return 'mavigne_profil_' + (localStorage.getItem('mavigne_tenant') || '');",
    a:  "  return 'mavigne_profil';" },

  { nom: 'le souvenir n\'est plus ecrit au succes de connexion',
    de: '    _loginMemEcrire(m.nom);',
    a:  '    /* rien */' },

  { nom: 'logout n\'oublie plus le profil (poste partage)',
    de: '  _loginMemOublier();\n  _loginVoirTous = false;',
    a:  '  _loginVoirTous = false;' },

  { nom: 'la tuile seule n\'est plus centree',
    de: "  profiles.style.justifyContent      = (seul >= 0) ? 'center' : '';",
    a:  "  profiles.style.justifyContent      = '';" },

  { nom: '\u26a0 le centrage n\'est pas annule : la liste sort en une colonne etroite',
    de: "  profiles.style.gridTemplateColumns = (seul >= 0) ? 'minmax(0, 240px)' : '';",
    a:  "  if(seul >= 0) profiles.style.gridTemplateColumns = 'minmax(0, 240px)';" },

  { nom: 'le sous-titre ne signale plus la tuile unique',
    de: "  if(sous) sous.textContent = (seul >= 0) ? 'Bon retour' : 'Choisissez votre profil';",
    a:  "  if(sous) sous.textContent = 'Choisissez votre profil';" },
];

let ok = 0, ko = 0;
console.log('\nContre-epreuves UX-LOGIN — chaque defaut doit faire ROUGIR le harnais\n');

for (const d of DEFAUTS) {
  const bac = mkdtempSync(join(tmpdir(), 'ux-'));
  try {
    for (const dossier of ['src', 'scripts']) {
      cpSync(join(RACINE, dossier), join(bac, dossier), { recursive: true });
    }
    const cible = join(bac, 'src', 'app.js');
    const src = readFileSync(cible, 'utf8');
    const n = src.split(d.de).length - 1;
    if (n !== 1) {
      console.log('  ' + c.r('✗') + ' ' + d.nom + c.d(`  → motif introuvable ou ambigu (${n}) : la contre-epreuve est fausse`));
      ko++; continue;
    }
    writeFileSync(cible, src.replace(d.de, d.a), 'utf8');
    const r = spawnSync(process.execPath, [join(bac, 'scripts', 'harnais-uxlogin.mjs')],
      { encoding: 'utf8', timeout: 120000 });
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
