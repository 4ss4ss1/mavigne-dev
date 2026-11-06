// PACK-1 — fabrique le zip que Nico glisse dans une conversation Claude quand le dépôt est PRIVÉ
// (le clone anonyme ne marche plus). Pur Node, aucun git requis : fonctionne sous Windows.
// Usage : npm run pack-claude   →   ../mavigne-dev-claude.zip (HORS du dépôt : jamais commité)
import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, sep } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = join(RACINE, '..', 'mavigne-dev-claude.zip');
const TMP = join(RACINE, '..', '.mv-pack-tmp');
const DOSSIER = join(TMP, 'mavigne-dev');

// Exclus : ce que .gitignore exclut déjà + secrets + le dépôt Git lui-même (le zip n'a pas d'historique).
const EXCLUS_NOMS = new Set(['node_modules', 'dist', '.git', '.firebase', 'gt.html']);
const exclu = (src) => {
  const n = basename(src);
  if (EXCLUS_NOMS.has(n)) return true;
  if (n === '.env' || n.startsWith('.env.')) return true;
  if (/^firebase-debug.*\.log$/.test(n)) return true;
  if (/\.(pem|key|p12)$/i.test(n) || /service-?account.*\.json$/i.test(n)) return true;
  return false;
};

// Commit courant, lu sans git (HEAD → ref → fichier ou packed-refs).
function commit() {
  try {
    const g = join(RACINE, '.git');
    const head = readFileSync(join(g, 'HEAD'), 'utf8').trim();
    if (!head.startsWith('ref: ')) return head.slice(0, 7);
    const ref = head.slice(5);
    const f = join(g, ref);
    if (existsSync(f)) return readFileSync(f, 'utf8').trim().slice(0, 7);
    const pk = readFileSync(join(g, 'packed-refs'), 'utf8').split('\n').find(l => l.endsWith(' ' + ref));
    return pk ? pk.slice(0, 7) : 'inconnu';
  } catch { return 'inconnu'; }
}

rmSync(TMP, { recursive: true, force: true });
rmSync(SORTIE, { force: true });
mkdirSync(TMP, { recursive: true });
cpSync(RACINE, DOSSIER, { recursive: true, filter: (s) => !exclu(s) });
writeFileSync(join(DOSSIER, 'PACK-INFO.txt'),
  `Zip fabriqué le ${new Date().toISOString()}\nCommit local : ${commit()}\n` +
  `Sans historique Git, sans node_modules/dist/.env.\nPour dater ce qu'on lit : comparer ce commit à ce que Nico vient de pousser.\n`);

if (process.platform === 'win32') {
  execFileSync('powershell', ['-NoProfile', '-Command',
    `Compress-Archive -Path '${DOSSIER}' -DestinationPath '${SORTIE}' -Force`], { stdio: 'inherit' });
} else {
  execFileSync('zip', ['-qr', SORTIE, 'mavigne-dev'], { cwd: TMP, stdio: 'inherit' });
}
rmSync(TMP, { recursive: true, force: true });
console.log(`✓ ${SORTIE} (${(statSync(SORTIE).size / 1048576).toFixed(1)} Mo) — commit ${commit()}`);
console.log('→ Glisse ce zip dans la conversation Claude (début de session).');
