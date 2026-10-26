#!/usr/bin/env node
// =============================================================================
// FERTI-6 (§463) — CHOISIR LES PARCELLES PAR RÈGLE (étape 2 de l'amendement)
// -----------------------------------------------------------------------------
//   node scripts/mv-harnais-ferti6.mjs            les contrôles
//   node scripts/mv-harnais-ferti6.mjs --contre   trois défauts posés exprès : chacun doit faire rougir
// Joue _ferRegleCalc (extraite de src/phyto.js) sur un petit domaine, et vérifie que le dessin et les gestes
// de la maquette v2 sont branchés.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC0 = fs.readFileSync(path.join(R, 'src', 'phyto.js'), 'utf8');
function ligne(s, debut) { const i = s.indexOf(debut); if (i < 0) throw new Error('absent : ' + debut); return s.slice(i, s.indexOf('\n', i)); }
function fonction(s, nom) { const i = s.indexOf('\nfunction ' + nom + '('); if (i < 0) throw new Error('absent : ' + nom); return s.slice(i + 1, s.indexOf('\nfunction ', i + 1)); }
let vertes = 0; const rouges = [];
const t = (c, m) => { if (c) vertes++; else rouges.push(m); };
const PARCS = [
  { nom: 'Clos du Moulin', appellation: 'Gevrey-Chambertin' }, { nom: 'Champ de la Croix', appellation: 'Bourgogne' },
  { nom: 'En Champs', appellation: 'Gevrey-Chambertin' }, { nom: 'Aux Murgers', appellation: 'Fixin' },
  { nom: 'Les Jeunes Rois', appellation: '' }, { nom: 'La Justice', appellation: ' Bourgogne ' } ];
const RDT = { 'Clos du Moulin': 31.2, 'Champ de la Croix': 29.4, 'En Champs': 36.2, 'Aux Murgers': 33.9, 'La Justice': 33 };
const noms = x => x.map(p => p.nom).join(', ');
function controles(S) {
  const calc = new Function(ligne(S, 'function _ferRegleCalc(') + '\nreturn _ferRegleCalc;')();
  let r = calc(PARCS, RDT, '35', { Bourgogne: 1 });
  t(noms(r.inc) === 'Clos du Moulin, Aux Murgers', 'sous 35 hL/ha sans les Bourgognes → Clos du Moulin, Aux Murgers (' + noms(r.inc) + ')');
  t(noms(r.sans) === 'Les Jeunes Rois', 'la parcelle sans rendement reste de côté, nommée');
  r = calc(PARCS, RDT, '35', {});
  t(noms(r.inc) === 'Clos du Moulin, Champ de la Croix, Aux Murgers, La Justice', 'sous 35 hL/ha, toutes appellations');
  r = calc(PARCS, RDT, '', { Bourgogne: 1 });
  t(noms(r.inc) === 'Clos du Moulin, En Champs, Aux Murgers, Les Jeunes Rois' && r.sans.length === 0, 'sans seuil : seules les appellations jouent (et « Bourgogne » avec espaces est reconnue)');
  r = calc(PARCS, RDT, '31,2', {});
  t(!r.inc.some(p => p.nom === 'Clos du Moulin'), '« sous » est strict : 31,2 n’est pas sous 31,2');
  r = calc(PARCS, RDT, '36,5', {});
  t(r.inc.some(p => p.nom === 'En Champs'), 'le seuil se lit avec une virgule');
  r = calc(PARCS, RDT, '', { '': 1 });
  t(!r.inc.some(p => p.nom === 'Les Jeunes Rois'), '« Sans appellation » se retire aussi');
  t(calc([], RDT, '35', {}).inc.length === 0 && calc(PARCS, {}, '35', {}).sans.length === PARCS.length, 'aucun rendement connu : tout reste de côté');
  const ov = fonction(S, 'openOvFerti');
  ["_ferIn('fer-seuil'", 'id="fer-aocs"', 'id="fer-regle-go"', '_ferRegleGo()', '_ferSeuil(this.value)'].forEach(x => t(ov.includes(x), 'l’étape 2 porte ' + x));
  t(/_fer\._rdt=_ferRdt\(_fer\._mil\)/.test(ov) && /_ferRdt\(_fer\._mil-1\)/.test(ov), 'les rendements de la dernière vendange connue sont lus à l’ouverture');
  const up = fonction(S, '_ferRegleUp');
  t(up.includes('_ferRegleCalc(') && up.includes('Sans appellation') && up.includes('data-aoc') && !/onclick="[^"]*'\+/.test(up), 'les appellations se touchent sans valeur interpolée dans le geste');
  t(fonction(S, '_ferUp').includes('_ferRegleUp()') && fonction(S, '_ferUp').includes('p.appellation') && fonction(S, '_ferUp').includes('_ferRdtLigne(p)'), 'chaque ligne montre appellation et rendement, la règle se redessine');
  t(['_ferSeuil', '_ferSauf', '_ferRegleGo'].every(f => S.includes('window.' + f + '=' + f + ';')), 'les gestes neufs sont posés sur window');
}
if (!process.argv.includes('--contre')) {
  controles(SRC0);
  console.log('mv-harnais-ferti6 : ' + vertes + ' vertes, ' + rouges.length + ' rouge' + (rouges.length > 1 ? 's' : ''));
  rouges.forEach(r => console.log('  ✗ ' + r));
  process.exit(rouges.length ? 1 : 0);
} else {
  const defauts = [
    ['« sous » devenu « jusqu’à »', 'if(!(r<s)) return;', 'if(!(r<=s)) return;'],
    ['les appellations retirées oubliées', 'if(sauf&&sauf[a]) return; ', ''],
    ['une parcelle sans rendement cochée d’office', 'sans.push(p); return;', 'inc.push(p); return;'],
  ];
  let attrapes = 0;
  for (const [nom, a, b] of defauts) {
    if (!SRC0.includes(a)) { console.log('  ✗ défaut impossible à poser (ancre absente) : ' + nom); continue; }
    vertes = 0; rouges.length = 0;
    try { controles(SRC0.split(a).join(b)); } catch (e) { rouges.push('exception : ' + e.message); }
    const vu = rouges.length > 0; if (vu) attrapes++;
    console.log((vu ? '  ✓ attrapé : ' : '  ✗ PAS attrapé : ') + nom);
  }
  console.log('mv-harnais-ferti6 --contre : ' + attrapes + '/' + defauts.length + ' défauts attrapés');
  process.exit(attrapes === defauts.length ? 0 : 1);
}
