#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════
   CONTRE-ÉPREUVES DU HARNAIS DU RETARD

   Un harnais vert ne prouve rien tant qu'on n'a pas vérifié qu'il sait rougir.
   Chaque cas ci-dessous RÉINTRODUIT un défaut réel dans une copie de
   src/planning.js, relance le harnais, et exige un ROUGE. Un vert = le harnais
   ne tient pas ce défaut, et c'est LUI qui est en faute.

   ⚠️ Travail sur COPIE, dans un dossier temporaire. src/ n'est jamais touché.
   ⚠️ fileURLToPath, jamais new URL(...).pathname (Windows).
   ══════════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RAC = path.resolve(ICI, '..');

/* Chaque cas : un nom, et une transformation du source. */
const CAS = [
  {
    nom: 'le retard repasse SOUS le garde-fou des heures dues',
    detail: 'le défaut d\'origine : journée à 0 h tant que le réglage est Inactif',
    f: s => s.replace(
      "      if(_mo.heures)return Math.max(0,pl-_planAbsH(e));    // retard : seules SES heures sont perdues\n      // Toute autre absence : 0 h, dans la fenetre comme en dehors.\n      return 0;",
      "      if(!_planDuesActive(m))return 0;\n      if(_mo.heures)return Math.max(0,pl-_planAbsH(e));\n      return 0;")
  },
  {
    nom: '_planAbsLostH redevient muet hors fenêtre',
    detail: 'aucune heure due tant que le réglage n\'est pas posé',
    f: s => s.replace('function _planAbsLostH(mbr,m,duesOnly){\n  var actif=_planDuesActive(m);',
                      'function _planAbsLostH(mbr,m,duesOnly){\n  if(!_planDuesActive(m))return 0;\n  var actif=_planDuesActive(m);')
  },
  {
    nom: 'la case du retard redevient une croix',
    detail: 'un retard d\'une heure indiscernable d\'une journée entière',
    f: s => s.replace("    if(_mc.heures){\n      var _fa=Math.max(0,pl-_planAbsH(e));\n      if(_fa>0.0001)return{txt:_planFmt(_fa),cls:'pl2c-late'};\n    }",
                      "    if(false){}")
  },
  {
    nom: 'la coupure déjeuner n\'est plus déduite',
    detail: '« arrivée moins départ » : arriver à 14 h devrait 6 h au lieu de 5',
    f: s => s.replace('  return Math.max(0,Math.min(pl,_planTimingH(arrivee,fin,continu)));',
                      '  return Math.max(0,Math.min(pl,(_planMinOf(fin)-_planMinOf(arrivee))/60));')
  },
  {
    nom: 'l\'arrivée après la fin prévue ne bascule plus',
    detail: 'un « retard » qui vaut la journée entière part en base comme retard',
    f: s => s.replace('        if(_planRetardVide(b.t1,arrivee)){', '        if(false){')
  },
  {
    nom: 'motif_t n\'est plus enregistré',
    detail: 'l\'heure d\'arrivée est perdue à la relecture du jour',
    f: s => s.replace('          e.motif_t=arrivee;\n', '')
  },
  {
    nom: 'une arrivée à l\'heure écrit quand même une absence',
    detail: 'garde-fou du zéro retiré',
    f: s => s.replace('          if(dh<=0.0001){skip++;return;}          // a l\'heure : aucune absence posee\n', '')
  },
  {
    nom: 'motif_h n\'est plus borné à la journée',
    detail: 'un retard peut devoir plus que ce qui était prévu',
    f: s => s.replace('  return Math.max(0,Math.min(pl,pl-_planRetardFaites(fin,arrivee,pl,continu)));',
                      '  return Math.max(0,pl-_planRetardFaites(fin,arrivee,pl,continu)+99);')
  },
  {
    nom: 'une heure malformée est acceptée',
    detail: '_planMinOf ne valide plus le format',
    f: s => s.replace("  var m=/^([01]?\\d|2[0-3]):([0-5]\\d)$/.exec(String(s||''));\n  return m?(parseInt(m[1],10)*60+parseInt(m[2],10)):-1;",
                      "  var p=String(s||'').split(':');\n  return (parseInt(p[0],10)||0)*60+(parseInt(p[1],10)||0);")
  },
  {
    nom: 'les entrées antérieures au lot perdent leurs heures',
    detail: 'un retard sans motif_t doit garder son motif_h',
    f: s => s.replace('function _planAbsH(e){var v=parseFloat(e&&e.motif_h);return(isNaN(v)||v<0)?0:v;}',
                      'function _planAbsH(e){var v=parseFloat(e&&e.motif_h);return(isNaN(v)||v<0||!(e&&e.motif_t))?0:v;}')
  },
  {
    nom: 'une absence injustifiée sort du garde-fou avec le retard',
    detail: 'régression : elle deviendrait due sans réglage posé',
    f: s => s.replace('    if(!actif&&!mo.heures)continue;', '')
  }
];

const base = fs.readFileSync(path.join(RAC, 'src', 'planning.js'), 'utf8');
let ok = 0, ko = 0;
const RATES = [];

console.log('');
console.log('  CONTRE-ÉPREUVES DU HARNAIS DU RETARD');
console.log('  ' + '─'.repeat(64));

for (const c of CAS) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-contre-'));
  const dSrc = path.join(tmp, 'src'), dScr = path.join(tmp, 'scripts');
  fs.mkdirSync(dSrc); fs.mkdirSync(dScr);

  const mute = c.f(base);
  if (mute === base) {
    ko++; RATES.push(c.nom + '  — LE MOTIF DE MUTATION N\'A RIEN CHANGÉ (motif périmé)');
    console.log('  ✗ ' + c.nom);
    console.log('      le motif de mutation ne trouve plus sa cible — contre-épreuve inopérante');
    fs.rmSync(tmp, { recursive: true, force: true });
    continue;
  }
  fs.writeFileSync(path.join(dSrc, 'planning.js'), mute);
  fs.copyFileSync(path.join(RAC, 'scripts', 'mv-harnais-retard.mjs'),
                  path.join(dScr, 'mv-harnais-retard.mjs'));

  let rouge = false, sortie = '';
  try {
    execFileSync(process.execPath, [path.join(dScr, 'mv-harnais-retard.mjs')],
                 { encoding: 'utf8', stdio: 'pipe' });
  } catch (err) {
    rouge = true;
    sortie = String(err.stdout || '') + String(err.stderr || '');
  }
  fs.rmSync(tmp, { recursive: true, force: true });

  if (rouge) {
    ok++;
    const n = (sortie.match(/✗ (\d+) ROUGE/) || [])[1];
    console.log('  ✓ ' + c.nom + (n ? '   → ' + n + ' rouge(s)' : '   → rouge'));
  } else {
    ko++; RATES.push(c.nom + '  — ' + c.detail);
    console.log('  ✗ ' + c.nom);
    console.log('      RESTÉ VERT — le harnais ne tient pas ce défaut');
  }
}

console.log('  ' + '─'.repeat(64));
if (ko === 0) {
  console.log('  ✓ ' + ok + ' défauts réintroduits, ' + ok + ' détectés.');
  console.log('');
  process.exit(0);
}
console.log('  ✗ ' + ko + ' contre-épreuve(s) en échec sur ' + (ok + ko) + ' :');
RATES.forEach(r => console.log('    · ' + r));
console.log('');
process.exit(1);
