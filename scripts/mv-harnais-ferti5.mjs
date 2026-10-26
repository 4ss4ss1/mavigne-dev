#!/usr/bin/env node
// =============================================================================
// FERTI-5 (§462) — LA FICHE « LE PRODUIT » DE L'AMENDEMENT
// -----------------------------------------------------------------------------
//   node scripts/mv-harnais-ferti5.mjs            les contrôles
//   node scripts/mv-harnais-ferti5.mjs --contre   trois défauts posés exprès : chacun doit faire rougir
//
// Extrait de src/phyto.js les pièces pures de la fiche (formule N-P-K, nature → type nitrates, libellé
// d'un type vide, normes, statuts vigne) et les joue ; vérifie aussi que le dessin et les gestes de la
// maquette validée sont branchés (recherche, « pas dans E-Phy », enregistrement, recherche d'un traitement).
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC0 = fs.readFileSync(path.join(R, 'src', 'phyto.js'), 'utf8');

function ligne(s, debut) { const i = s.indexOf(debut); if (i < 0) throw new Error('absent : ' + debut); return s.slice(i, s.indexOf('\n', i)); }
function objet(s, nom) {
  const i = s.indexOf('var ' + nom + ' = '); if (i < 0) throw new Error('absent : ' + nom);
  let j = s.indexOf('=', i) + 1, prof = 0, k = j;
  for (; k < s.length; k++) { const c = s[k]; if (c === '{' || c === '[') prof++; else if (c === '}' || c === ']') { prof--; if (prof === 0) { k++; break; } } }
  return s.slice(i, k) + ';';
}
function fonction(s, nom) { const i = s.indexOf('\nfunction ' + nom + '('); if (i < 0) throw new Error('absent : ' + nom); return s.slice(i + 1, s.indexOf('\nfunction ', i + 1)); }

let vertes = 0; const rouges = [];
const t = (c, m) => { if (c) vertes++; else rouges.push(m); };

function controles(S) {
  const code = [objet(S, 'FER_TYP'), objet(S, 'FER_NORMES'), objet(S, 'FER_NAT'), objet(S, 'FER_VG'),
    ligne(S, 'function _ferFr('), ligne(S, 'function _ferTypLbl('), ligne(S, 'function _ferLireNpk('), ligne(S, 'function _ferFmt(')].join('\n');
  const K = new Function(code + '\nreturn {FER_TYP, FER_NORMES, FER_NAT, FER_VG, _ferTypLbl, _ferLireNpk, _ferFmt};')();
  const a = K._ferLireNpk('4-10-1');
  t(!!a && a.N === '4' && a.P === '10' && a.K === '1', '« 4-10-1 » → azote 4, phosphore 10, potasse 1');
  const b = K._ferLireNpk('NPK 8,5-0-12 + 2 MgO');
  t(!!b && b.N === '8,5' && b.P === '0' && b.K === '12', '« NPK 8,5-0-12 + 2 MgO » → 8,5 · 0 · 12');
  const c = K._ferLireNpk('4-10');
  t(!!c && c.N === '4' && c.P === '10' && c.K === '', '« 4-10 » → potasse vide');
  t(K._ferLireNpk('4') === null && K._ferLireNpk('') === null, 'un seul chiffre ne remplit rien');
  const T = { compost: 'Ia', fumier: 'Ib', orga: 'II', mineral: 'III', frais: '0', chaux: '', nsp: 'II' };
  Object.keys(T).forEach(k => t(!!K.FER_NAT[k] && K.FER_NAT[k].t === T[k], 'nature « ' + k + ' » → type ' + (T[k] || 'aucun')));
  t(Object.keys(K.FER_NAT).every(k => K.FER_NAT[k].t === '' || !!K.FER_TYP[K.FER_NAT[k].t]), 'chaque nature pose un type qui existe');
  t(Object.keys(K.FER_NAT).every(k => !!K.FER_NAT[k].l && !!K.FER_NAT[k].w), 'chaque nature a son libellé et sa raison');
  t(K._ferTypLbl('') === '\u2014', 'un type vide s’écrit « — »');
  t(K._ferTypLbl('Ia') === K.FER_TYP.Ia.lbl && K._ferTypLbl('zz') === K.FER_TYP.II.lbl, 'libellés des types');
  t(['NF U 44-051', 'NF U 42-001', 'Règlement (UE) 2019/1009'].every(r => K.FER_NORMES.some(n => n.ref === r)), 'les trois normes en un geste');
  t(K.FER_VG.v[0] === 'Vigne' && K.FER_VG.tc[0] === 'Toutes cultures' && K.FER_VG.nc[0] === 'Culture non précisée' && K.FER_VG.non[0] === 'Pas la vigne', 'les quatre statuts vigne');
  t(K._ferFmt(6) === '6' && K._ferFmt(8.5) === '8,5' && K._ferFmt(0.12) === '0,12', 'teneurs écrites à la française');
  const ov = fonction(S, 'openOvFerti');
  ['id="fer-npk"', 'id="fer-nat"', 'id="fer-norms"', 'id="fer-etat"', 'id="fer-sac"', 'id="fer-typ-h"', '_ferNpk(this.value)', '_ferNat(this.value)'].forEach(x => t(ov.includes(x), 'la fiche porte ' + x));
  t(!ov.includes('Même catalogue que pour un traitement'), 'l’ancienne phrase sur le catalogue a disparu');
  t(/p\.vg/.test(fonction(S, '_ferSearch')) && /fer-chip/.test(fonction(S, '_ferSearch')), 'la recherche affiche le statut vigne');
  const et = fonction(S, '_ferEtat');
  t(et.includes('Pas dans E-Phy') && et.includes('_ferNomQ') && et.includes('ne cite pas la vigne') && et.includes('pas charg'), '« pas dans E-Phy », hors connexion et « pas la vigne » sont dits');
  t(/P\.src=true/.test(fonction(S, '_ferPickEphy')) && /c\.N!=null/.test(fonction(S, '_ferPickEphy')), 'un produit E-Phy apporte ses teneurs déclarées');
  t(/nat:P\.nat\|\|''/.test(fonction(S, '_ferSave')) && /vg:P\.vg\|\|''/.test(fonction(S, '_ferSave')), 'l’enregistrement garde la nature et le statut');
  t(!S.includes('(FER_TYP[P.typ]||FER_TYP.II).lbl'), 'registre, liste et tableur passent par _ferTypLbl');
  t(/vg:p\.vg\|\|''/.test(fonction(S, '_phyEphyMeta')) && fonction(S, '_tratResultRow').includes('Pas la vigne'), 'la recherche d’un traitement signale « Pas la vigne »');
  t(['_ferNomQ', '_ferNorme', '_ferNpk', '_ferNat', '_ferTypMain', '_ferTypTog', '_ferSacTog'].every(f => S.includes('window.' + f + '=' + f + ';')), 'les gestes neufs sont posés sur window');
}

if (!process.argv.includes('--contre')) {
  controles(SRC0);
  console.log('mv-harnais-ferti5 : ' + vertes + ' vertes, ' + rouges.length + ' rouge' + (rouges.length > 1 ? 's' : ''));
  rouges.forEach(r => console.log('  ✗ ' + r));
  process.exit(rouges.length ? 1 : 0);
} else {
  const defauts = [
    ['la formule lit le phosphore à la place de l’azote', "N:m[0].replace('.',','), P:m[1]", "N:m[1].replace('.',','), P:m[0]"],
    ['un compost classé en type II', "compost: { l:'Compost : fumier, marc, d\\u00e9chets verts m\\u00fbrs', t:'Ia'", "compost: { l:'Compost : fumier, marc, d\\u00e9chets verts m\\u00fbrs', t:'II'"],
    ['le statut oublié dans la recherche d’un traitement', "source:'ephy',vg:p.vg||''}", "source:'ephy'}"],
  ];
  let attrapes = 0;
  for (const [nom, a, b] of defauts) {
    if (!SRC0.includes(a)) { console.log('  ✗ défaut impossible à poser (ancre absente) : ' + nom); continue; }
    vertes = 0; rouges.length = 0;
    try { controles(SRC0.split(a).join(b)); } catch (e) { rouges.push('exception : ' + e.message); }
    const vu = rouges.length > 0; if (vu) attrapes++;
    console.log((vu ? '  ✓ attrapé : ' : '  ✗ PAS attrapé : ') + nom);
  }
  console.log('mv-harnais-ferti5 --contre : ' + attrapes + '/' + defauts.length + ' défauts attrapés');
  process.exit(attrapes === defauts.length ? 0 : 1);
}
