#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Garde de base : UN LOT NE S'INTÈGRE QUE SUR SA BASE
// ═══════════════════════════════════════════════════════════════════════════
//  ★★★ POURQUOI CE CONTRÔLE EXISTE — l'incident du 06/09 (CLAUDE.md §82a).
//
//  Un lot est livré en FICHIERS COMPLETS. Coller un fichier complet par-dessus
//  un autre, ce n'est pas une fusion : c'est un ÉCRASEMENT. Si le lot a été
//  construit sur un commit et collé sur un autre, tout ce que le commit
//  intermédiaire avait apporté au même fichier disparaît — sans conflit, sans
//  message, sans une ligne rouge nulle part.
//
//  C'est arrivé : PARC-1 poussé le matin, un lot préparé sur le commit
//  d'avant, collé le soir. `src/cave.js` a perdu tout le parcours daté d'une
//  cuve. Le CI l'a vu, par chance, parce qu'un harnais que le lot ne livrait
//  PAS réclamait une fonction disparue.
//
//  ⚠️ LA RÈGLE ÉTAIT DÉJÀ ÉCRITE — deux fois, dans CLAUDE.md et dans la note
//  de livraison. Une règle rappelée deux fois et non exécutée n'est pas une
//  règle, c'est un vœu. Il fallait la sortir des bonnes intentions et la
//  mettre dans une commande qui rougit.
//
//  ── CE QUE FAIT LE CONTRÔLE ─────────────────────────────────────────────
//  Chaque lot livré contient un fichier `.mv-base` à la racine, qui porte le
//  SHA du commit sur lequel il a été construit. Ce script exige que ce SHA
//  soit le HEAD courant.
//
//  ⚠️⚠️ IL NE S'ARME QUE QUAND `.mv-base` VIENT D'ÊTRE COLLÉ. Sinon il serait
//  rouge à jamais après le premier commit — le SHA de base devenant le parent
//  du HEAD — et on finirait par le retirer. C'est le fichier LUI-MÊME qui doit
//  apparaître comme modifié ou non suivi : la présence d'un lot frais est donc
//  la condition d'armement, et le contrôle se désarme tout seul au commit.
//  Un contrôle qu'on doit désactiver à la main est un contrôle qu'on oublie
//  de réactiver.
//
//  Hors dépôt git, ou git indisponible : le contrôle le DIT et laisse passer.
//  Il ne prétend pas avoir vérifié.
//
//  Usage :
//    node scripts/mv-base.mjs
//    node scripts/mv-base.mjs --contre   # les contre-épreuves
//  Exit 0 si tout va bien, 1 si le lot n'est pas sur sa base.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const CONTRE = process.argv.includes('--contre');

const T = '\u001b[0m', R = '\u001b[31m', V = '\u001b[32m', G = '\u001b[2m';

function git(args, cwd){
  return execFileSync('git', args, { cwd: cwd || RACINE, encoding:'utf8', stdio:['ignore','pipe','pipe'] }).trim();
}

/* Le SHA déclaré par le lot. On lit le premier mot : le fichier peut porter
   un commentaire derrière (« dd1110c  PARC-1 »), c'est plus lisible pour
   celui qui colle. */
function baseDeclaree(racine){
  const f = path.join(racine, '.mv-base');
  if (!fs.existsSync(f)) return null;
  const t = fs.readFileSync(f, 'utf8').split(/\s|#/)[0].trim();
  return /^[0-9a-f]{7,40}$/i.test(t) ? t.toLowerCase() : (t ? '?' + t : null);
}

/* Le contrôle, isolé pour que la contre-épreuve puisse le rejouer sur des
   dépôts fabriqués — un contrôle qu'on ne peut pas mettre en défaut n'a
   jamais prouvé qu'il servait à quelque chose. */
export function controler(racine){
  const base = baseDeclaree(racine);
  if (base === null)  return { etat:'absent',  msg:'aucun .mv-base — lot sans base declaree' };
  if (base[0] === '?') return { etat:'illisible', msg:'.mv-base ne contient pas un SHA : ' + base.slice(1) };

  let sale, head;
  try {
    sale = git(['status', '--porcelain', '--', '.mv-base'], racine) !== '';
    head = git(['rev-parse', 'HEAD'], racine);
  } catch {
    return { etat:'sans-git', msg:'pas de depot git lisible — controle NON joue' };
  }
  if (!sale) return { etat:'desarme', msg:'.mv-base est deja commite (' + base.slice(0,7) + ') — rien a verifier' };

  if (head.toLowerCase().startsWith(base)) {
    return { etat:'ok', msg:'lot construit sur ' + base.slice(0,7) + ', qui est bien le HEAD' };
  }
  return { etat:'ecart', base, head,
    msg:'le lot a ete construit sur ' + base.slice(0,7) + ', le depot est sur ' + head.slice(0,7) };
}

// ── Les contre-épreuves : trois dépôts fabriqués, trois verdicts attendus ──
if (CONTRE){
  const os  = await import('node:os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mvbase-'));
  const mk = (nom) => { const d = path.join(tmp, nom); fs.mkdirSync(d); return d; };
  const init = (d) => {
    git(['init', '-q', '-b', 'main'], d);
    git(['config', 'user.email', 'h@h'], d); git(['config', 'user.name', 'h'], d);
    fs.writeFileSync(path.join(d, 'x'), 'a'); git(['add', '.'], d);
    git(['commit', '-qm', 'un'], d);
    return git(['rev-parse', 'HEAD'], d);
  };
  let ko = 0, n = 0;
  const A = (titre, obtenu, attendu) => { n++;
    const ok = obtenu === attendu; if (!ok) ko++;
    console.log('  ' + (ok ? V+'VU  '+T : R+'RATÉ'+T) + '  ' + titre + ' → ' + obtenu); };

  let d = mk('bonne-base'); let h = init(d);
  fs.writeFileSync(path.join(d, '.mv-base'), h + '  # lot de test\n');
  A('un lot collé sur SA base passe', controler(d).etat, 'ok');

  d = mk('mauvaise-base'); init(d);
  fs.writeFileSync(path.join(d, 'x'), 'b'); git(['commit', '-aqm', 'deux'], d);
  fs.writeFileSync(path.join(d, '.mv-base'), '0'.repeat(40) + '\n');
  A('★★ un lot collé sur un AUTRE commit rougit', controler(d).etat, 'ecart');

  d = mk('deja-commite'); h = init(d);
  fs.writeFileSync(path.join(d, '.mv-base'), h + '\n');
  git(['add', '.'], d); git(['commit', '-qm', 'lot'], d);
  A('★ une fois commité, le contrôle se désarme seul', controler(d).etat, 'desarme');

  d = mk('sans-base');
  A('pas de .mv-base : dit « absent », ne rougit pas', controler(d).etat, 'absent');

  d = mk('pas-un-depot');
  fs.writeFileSync(path.join(d, '.mv-base'), '0'.repeat(40) + '\n');
  A('hors dépôt git : le dit, ne prétend pas avoir vérifié', controler(d).etat, 'sans-git');

  fs.rmSync(tmp, { recursive:true, force:true });
  console.log('\n' + (ko ? R + ko + ' RATÉ(S) sur ' + n + T : V + 'CONTRE-ÉPREUVE CONCLUANTE — ' + n + '/' + n + T));
  process.exit(ko ? 1 : 0);
}

const r = controler(RACINE);
console.log('\n  MA VIGNE — Garde de base\n');
if (r.etat === 'ok')       console.log('  ' + V + '✓' + T + ' ' + r.msg + '\n');
else if (r.etat === 'ecart'){
  console.log('  ' + R + '✗ LE LOT N\'EST PAS SUR SA BASE' + T);
  console.log('    ' + r.msg);
  console.log('\n    ' + R + 'NE PAS COMMITER.' + T + ' Coller un fichier complet par-dessus un commit');
  console.log('    plus recent EFFACE ce que ce commit avait apporte au meme fichier,');
  console.log('    sans conflit et sans un mot. Redemander un rejeu du lot sur ' + r.head.slice(0,7) + '.');
  console.log('    ' + G + '(CLAUDE.md §82a — c\'est deja arrive une fois, le 06/09.)' + T + '\n');
  process.exit(1);
} else console.log('  ' + G + '· ' + r.msg + T + '\n');
