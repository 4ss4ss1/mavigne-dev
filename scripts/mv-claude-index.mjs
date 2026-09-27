#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   DOC-1 (§188) — L'INDEX DES SECTIONS : « §N » → le fichier qui la porte
   Lancer : node scripts/mv-claude-index.mjs            (régénère docs/claude/INDEX.md)
            node scripts/mv-claude-index.mjs --check    (rouge si l'index est en retard)

   ══ POURQUOI ══
   Le 27/09, CLAUDE.md faisait 23 910 lignes, dont 1 190 lignes d'historique AVANT la
   première règle d'or : les consignes se perdaient dans le récit. Il est scindé en un
   cœur lu en entier (CLAUDE.md) et des fichiers consultés à la demande (docs/claude/).
   Le prix de la scission : une référence « Détail en §146 » ne dit plus OÙ lire. Cet
   index le dit, et il est GÉNÉRÉ — un index écrit à la main dérive au premier lot.
   ⚠️ Comme `public/guide.html` (§27d) : on ne l'édite pas, on le régénère, et le
   `--check` du `npm run check` rougit s'il est en retard.
   ⚠️ CHEMINS : fileURLToPath (§53).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(RACINE, 'docs', 'claude');
const SORTIE = path.join(DOCS, 'INDEX.md');

export function fichiersDoc() {
  const autres = fs.existsSync(DOCS)
    ? fs.readdirSync(DOCS).filter(f => f.endsWith('.md') && f !== 'INDEX.md').sort()
        .map(f => 'docs/claude/' + f)
    : [];
  return ['CLAUDE.md', ...autres];
}

function cle(titre) {
  const m = /^(\d+)(?:-(\d+))?([a-z]?)\./.exec(titre);
  return m ? [0, Number(m[1]), m[3] || ''] : [-1, 0, ''];
}

export function construire() {
  const lignes = [];
  for (const f of fichiersDoc()) {
    const txt = fs.readFileSync(path.join(RACINE, f), 'utf8').replace(/\r\n/g, '\n');   // ⚠️ poste Windows : CRLF possible
    for (const l of txt.split('\n')) {
      if (!l.startsWith('## ')) continue;
      const titre = l.slice(3).trim();
      lignes.push({ f, titre, k: cle(titre) });
    }
  }
  lignes.sort((a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1] || a.k[2].localeCompare(b.k[2]));
  const court = s => (s.length > 110 ? s.slice(0, 107) + '…' : s).replace(/\|/g, '\\|');
  const out = [
    '# Index des sections — GÉNÉRÉ, ne pas éditer',
    '',
    '> Régénérer : `node scripts/mv-claude-index.mjs`. Contrôle : `--check` (dans `npm run check`).',
    '> Une référence « §N » se lit dans le fichier indiqué ici. Recherche directe :',
    '> `grep -n "^## N\\." CLAUDE.md docs/claude/*.md`.',
    '',
    '| § | Titre | Fichier |',
    '|---|---|---|',
    ...lignes.map(x => {
      const n = /^(\d+(?:-\d+)?[a-z]?)\./.exec(x.titre);
      return `| ${n ? n[1] : '—'} | ${court(x.titre)} | \`${x.f}\` |`;
    }),
    ''
  ];
  return out.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const neuf = construire();
  if (process.argv.includes('--check')) {
    const actuel = fs.existsSync(SORTIE) ? fs.readFileSync(SORTIE, 'utf8').replace(/\r\n/g, '\n') : '';
    if (actuel !== neuf) {
      console.error('\x1b[31m✗ docs/claude/INDEX.md est en retard sur la documentation.\x1b[0m');
      console.error('  → node scripts/mv-claude-index.mjs   puis committer INDEX.md');
      process.exit(1);
    }
    console.log('\x1b[32m✓ docs/claude/INDEX.md à jour\x1b[0m');
  } else {
    fs.mkdirSync(DOCS, { recursive: true });
    fs.writeFileSync(SORTIE, neuf);
    console.log('docs/claude/INDEX.md régénéré (' + (neuf.split('\n').length - 9) + ' sections)');
  }
}
