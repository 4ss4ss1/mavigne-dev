#!/usr/bin/env node
// ── LOTS-1 (§231) — LA GARDE DES LOTS FRÈRES ─────────────────────────────────────────────────────────────
// Le 03/10, deux conversations ont livré chacune un zip bâti sur le MÊME commit ; collés l'un après l'autre sans
// commit entre eux, le second a écrasé le premier (§223). `mv-base` ne pouvait rien voir : les deux zips déclaraient
// la même base, à raison — il garde la base, pas la fratrie.
// Chaque lot pose désormais sa MARQUE : lots/<LOT>.json (un fichier par lot, jamais écrasé par un autre lot), qui dit
// sa base, les lots qu'il contient (`inclut`, pour un zip cumulatif) et l'empreinte SHA-256 de chaque fichier livré.
// Ce script lit les marques PAS ENCORE COMMITÉES :
//   ① plus d'une marque « de tête » en attente (aucune n'inclut l'autre) → deux lots frères collés ensemble : refus ;
//   ② la marque de tête ne retrouve plus un de ses fichiers tel qu'elle l'a livré → écrasé ou retouché : refus.
// Aucune marque en attente : rien à dire (un commit sépare toujours deux lots — c'est la règle).
// ⚠️ Un zip qui ne pose pas de marque (un fil qui ne connaît pas encore la règle) échappe à ①, mais pas à ② s'il a
//    écrasé un fichier d'un lot marqué collé avant lui.
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { execFileSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function empreinteDe(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

// marques : [{ fichier, lot, inclut:[], fichiers:{chemin: empreinte} }] ; enAttente : Set de noms de marque ;
// empreinte(chemin) → l'empreinte du fichier de travail (ou null s'il manque).
export function verdict(marques, enAttente, empreinte) {
  const att = marques.filter(m => enAttente.has(m.fichier));
  if (!att.length) return { ok: true, msg: ['aucun lot en attente de commit'] };
  const inclus = new Set(); att.forEach(m => (m.inclut || []).forEach(x => inclus.add(x)));
  const tetes = att.filter(m => !inclus.has(m.lot));
  if (tetes.length > 1) return { ok: false, msg: ['deux lots frères collés sans commit entre eux : ' + tetes.map(m => m.lot).join(' et ')
    + ' — le second a pu écraser le premier. Gardez-en un, commitez, puis faites reconstruire l\u2019autre sur ce commit.'] };
  if (!tetes.length) return { ok: false, msg: ['les marques en attente s\u2019incluent l\u2019une l\u2019autre : marques incohérentes'] };
  const T = tetes[0], noms = Object.keys(T.fichiers || {});
  const ko = noms.filter(f => empreinte(f) !== T.fichiers[f]);
  if (ko.length) return { ok: false, msg: ['le lot ' + T.lot + ' ne retrouve plus ' + ko.length + ' de ses ' + noms.length + ' fichiers tels qu\u2019il les a livrés : '
    + ko.slice(0, 6).join(', ') + (ko.length > 6 ? '…' : '') + ' — un autre lot les a écrasés, ou ils ont été retouchés à la main.'] };
  return { ok: true, msg: ['lot ' + T.lot + ' en attente de commit : ses ' + noms.length + ' fichiers sont ceux qu\u2019il a livrés'] };
}

function main() {
  const dir = path.join(R, 'lots');
  if (!fs.existsSync(dir)) { console.log('  \u2713 garde des lots : aucune marque'); return; }
  let st = '';
  // -uall : sans lui, un dossier `lots/` neuf sort d'un seul bloc (« ?? lots/ ») et aucune marque ne paraît en attente.
  try { st = execFileSync('git', ['status', '--porcelain', '-uall', '--', 'lots'], { cwd: R, encoding: 'utf8' }); }
  catch (e) { console.log('  \u26a0 garde des lots : git indisponible, rien à vérifier'); return; }
  const enAttente = new Set(st.split('\n').filter(Boolean).map(l => path.basename(l.slice(3).trim().replace(/^"|"$/g, ''))));
  const marques = fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
    const m = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); m.fichier = f; return m;
  });
  const r = verdict(marques, enAttente, f => { const p = path.join(R, f); return fs.existsSync(p) ? empreinteDe(fs.readFileSync(p)) : null; });
  r.msg.forEach(l => console.log((r.ok ? '  \u2713 ' : '  \u2717 ') + 'garde des lots : ' + l));
  if (!r.ok) process.exit(1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
