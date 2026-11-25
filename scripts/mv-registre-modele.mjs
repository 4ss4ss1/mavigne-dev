#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   MA VIGNE — scripts/mv-registre-modele.mjs — LE MODÈLE EXCEL VIERGE DU REGISTRE PHYTO 2027 (TARIF-1, §608)

   Fabrique public/downloads/registre-phyto-2027-mavigneapp.xlsx, le modèle gratuit proposé sur logiciel-vigne.html et
   registre-phytosanitaire-2027.html (téléchargement direct, sans formulaire).

   ★ LES COLONNES NE S'ÉCRIVENT PAS ICI : elles sont LUES dans src/registre.js (MV_PHY_CSV_COLS), la liste même de l'export
     CSV de l'appli. Un vigneron qui tient ce modèle puis passe à Ma Vigne retrouve les mêmes colonnes, dans le même ordre.
     Une colonne ajoutée à l'export sans sa consigne ci-dessous fait refuser la fabrique (jamais une colonne muette).

   Deux onglets : « Registre 2027 » (l'en-tête, une ligne d'exemple grisée, l'aide de chaque colonne au survol de la case,
   oui / non imposé pour la conduite biologique) et « Mode d'emploi & Ma Vigne » (les règles de saisie, colonne par
   colonne, et l'encadré Ma Vigne avec ses liens).

   ★ Sans dépendance : le classeur est un ZIP écrit à la main, entrées STOCKÉES (non compressées), date fixe. Le même
     src/registre.js donne donc exactement les mêmes octets sur toutes les machines — c'est ce qui permet de vérifier.

   Lancer :   node scripts/mv-registre-modele.mjs              (écrit le fichier)
              node scripts/mv-registre-modele.mjs --verifier   (rougit si le fichier du dépôt n'est plus celui que
                                                                 donnent les colonnes d'aujourd'hui — mv-harnais-tarif1)
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SORTIE = 'public/downloads/registre-phyto-2027-mavigneapp.xlsx';

/* ── 1. Les colonnes, lues dans l'appli ─────────────────────────────────── */
export function colonnesDeLAppli(src) {
  const m = /var MV_PHY_CSV_COLS = (\[[\s\S]*?\]);/.exec(src);
  if (!m) throw new Error('MV_PHY_CSV_COLS introuvable dans src/registre.js');
  const cols = Function('"use strict";return (' + m[1] + ');')();
  if (!Array.isArray(cols) || cols.length < 18) throw new Error('MV_PHY_CSV_COLS illisible');
  return cols;
}

/* ── 2. Ce que dit chaque colonne : quand, quel format, et l'exemple ───────
   quand : 'Toujours' · 'Selon le cas' · 'Facultatif' (les trois de l'annexe) · 'En plus' (ce que Ma Vigne ajoute).
   fmt   : le style de la colonne (texte, date, heure, gps, nombre).                                                */
const CONSIGNES = {
  'SIRET détenteur':                   { quand: 'Toujours',     fmt: 'texte',  ex: '12345678900012', aide: '14 chiffres, sans espace. Le SIRET de l’exploitation qui tient le registre, sur chaque ligne.' },
  'SIRET bénéficiaire':                { quand: 'Selon le cas', fmt: 'texte',  ex: '',               aide: '14 chiffres. Seulement en prestation de service : le SIRET de l’exploitation pour qui le traitement est fait.' },
  'Produit':                           { quand: 'Toujours',     fmt: 'texte',  ex: 'Exemple : nom commercial complet', aide: 'Le nom commercial complet, tel qu’il est écrit sur l’étiquette.' },
  'Numéro d’autorisation (AMM)':       { quand: 'Toujours',     fmt: 'texte',  ex: '1234567',        aide: '7 chiffres, inscrits sur l’étiquette du bidon.' },
  'Date d’utilisation':                { quand: 'Toujours',     fmt: 'date',   ex: '2027-06-12',     aide: 'JJ/MM/AAAA.' },
  'Horaire de début':                  { quand: 'Selon le cas', fmt: 'heure',  ex: '06:30',          aide: 'HH:MM, sur 24 heures, heure de Paris. Quand l’AMM ou la réglementation le prévoit.' },
  'Horaire de fin':                    { quand: 'Selon le cas', fmt: 'heure',  ex: '08:15',          aide: 'HH:MM, sur 24 heures, heure de Paris. Quand l’AMM ou la réglementation le prévoit.' },
  'Délai de rentrée anticipée':        { quand: 'Selon le cas', fmt: 'texte',  ex: '',               aide: 'HH:MM. Seulement si quelqu’un est entré dans la parcelle avant la fin du délai de rentrée. Remplir aussi les trois colonnes « Rentrée anticipée ».' },
  'Dose de produit utilisée':          { quand: 'Toujours',     fmt: 'nombre', ex: 0.25,             aide: 'Le nombre seul, rapporté à l’hectare (ex. 0,25). L’unité va dans la colonne suivante.' },
  'Unité de dose':                     { quand: 'Toujours',     fmt: 'texte',  ex: 'kg/ha',          aide: 'L/ha ou kg/ha.' },
  'Cible':                             { quand: 'Facultatif',   fmt: 'texte',  ex: 'Mildiou',        aide: 'Le bioagresseur visé (ex. mildiou, oïdium).' },
  'Mode d’application':                { quand: 'Facultatif',   fmt: 'texte',  ex: 'Pulvérisation',  aide: 'Ex. pulvérisation.' },
  'Latitude (WGS84)':                  { quand: 'Toujours',     fmt: 'gps',    ex: 47.219,           aide: 'Un point de la zone traitée, en degrés décimaux (WGS84), 5 décimales (ex. 47,21900).' },
  'Longitude (WGS84)':                 { quand: 'Toujours',     fmt: 'gps',    ex: 4.969,            aide: 'Un point de la zone traitée, en degrés décimaux (WGS84), 5 décimales (ex. 4,96900).' },
  'Surface traitée (ha)':              { quand: 'Toujours',     fmt: 'nombre', ex: 0.85,             aide: 'Les hectares réellement traités, pas la surface de la parcelle.' },
  'Dénomination de la culture (OEPP)': { quand: 'Toujours',     fmt: 'texte',  ex: 'VITVI',          aide: 'Le code OEPP de la culture : VITVI pour la vigne.' },
  'Stade phénologique (BBCH)':         { quand: 'Selon le cas', fmt: 'texte',  ex: '61',             aide: 'Deux chiffres de l’échelle BBCH (ex. 61 = début de la floraison). Quand l’usage est limité à certains stades.' },
  'Conduite biologique':               { quand: 'Toujours',     fmt: 'texte',  ex: 'non',            aide: 'oui ou non : la parcelle est-elle conduite en agriculture biologique ?' },
  'Parcelle':                          { quand: 'En plus',      fmt: 'texte',  ex: 'Exemple : Les Chaumes', aide: 'Le nom de la parcelle au domaine.' },
  'Substance active':                  { quand: 'En plus',      fmt: 'texte',  ex: 'Exemple : cuivre', aide: 'La ou les substances actives du produit.' },
  'Applicateur':                       { quand: 'En plus',      fmt: 'texte',  ex: 'Exemple : J. Martin', aide: 'Qui a traité.' },
  'Observations':                      { quand: 'En plus',      fmt: 'texte',  ex: 'Ligne d’exemple : à effacer avant de remplir', aide: 'Ce que vous voulez garder en mémoire.' },
  'Surface de la parcelle (ha)':       { quand: 'En plus',      fmt: 'nombre', ex: 0.92,             aide: 'La surface totale de la parcelle : on voit d’un coup d’œil une parcelle traitée en partie.' },
  'Rentrée anticipée — moment':        { quand: 'Selon le cas', fmt: 'texte',  ex: '',               aide: 'JJ/MM/AAAA HH:MM. L’annexe I demande, pour une rentrée anticipée, le moment, le lieu, le motif et les mesures de protection.' },
  'Rentrée anticipée — motif':         { quand: 'Selon le cas', fmt: 'texte',  ex: '',               aide: 'Pourquoi il a fallu entrer avant la fin du délai.' },
  'Rentrée anticipée — mesures de protection': { quand: 'Selon le cas', fmt: 'texte', ex: '',        aide: 'Les protections portées (gants, combinaison…).' },
};
const LARGEUR = { texte: 18, date: 13, heure: 10, gps: 12, nombre: 11 };
const LARGEUR_COL = { 'Produit': 32, 'Parcelle': 22, 'Observations': 36, 'Substance active': 20 };   // les colonnes qu'on remplit en phrases

/* ── 3. Petits outils XML / Excel ───────────────────────────────────────── */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lettre = (i) => { let s = ''; i++; while (i > 0) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; };
const serieDate = (iso) => { const [a, m, j] = iso.split('-').map(Number); return Math.round((Date.UTC(a, m - 1, j) - Date.UTC(1899, 11, 30)) / 86400000); };
const serieHeure = (hm) => { const [h, m] = hm.split(':').map(Number); return (h * 60 + m) / 1440; };
const txt = (ref, s, st) => `<c r="${ref}" t="inlineStr" s="${st}"><is><t xml:space="preserve">${esc(s)}</t></is></c>`;
const num = (ref, v, st) => `<c r="${ref}" s="${st}"><v>${v}</v></c>`;

/* Les styles (index dans cellXfs) — un seul endroit, nommés. */
const S = { def: 0, tAnnexe: 1, tPlus: 2, exTxt: 3, exDate: 4, exHeure: 5, exGps: 6, exNum: 7, cTxt: 8, cDate: 9, cHeure: 10, cGps: 11,
            titre: 12, para: 13, section: 14, cadre: 15, cadreGras: 16, cadreLien: 17, thead: 18, tcell: 19, lien: 20, cNum: 21 };
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="3"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="hh:mm"/><numFmt numFmtId="166" formatCode="0.00000"/></numFmts>
<fonts count="8">
<font><sz val="11"/><color rgb="FF1B1A18"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FF1B1A18"/><name val="Calibri"/><family val="2"/></font>
<font><i/><sz val="11"/><color rgb="FF8A8780"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="16"/><color rgb="FF2E5320"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="13"/><color rgb="FF1B1A18"/><name val="Calibri"/><family val="2"/></font>
<font><u/><sz val="11"/><color rgb="FF1F5C99"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="12"/><color rgb="FF2E5320"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="6">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF3D6B27"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFEFE7D6"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF3F2EF"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFE8F0E2"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="3">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFCDCAC2"/></left><right style="thin"><color rgb="FFCDCAC2"/></right><top style="thin"><color rgb="FFCDCAC2"/></top><bottom style="thin"><color rgb="FFCDCAC2"/></bottom><diagonal/></border>
<border><left style="thick"><color rgb="FF3D6B27"/></left><right/><top/><bottom/><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="22">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="49" fontId="3" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="164" fontId="3" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="165" fontId="3" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="166" fontId="3" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="0" fillId="5" borderId="2" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="7" fillId="5" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="6" fillId="5" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="6" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const LIENS = {
  page: 'https://mavigneapp.fr/logiciel-vigne.html',
  demo: 'https://mavigneapp.fr/demo.html',
  tel: 'tel:+33699424859',
  whatsapp: 'https://wa.me/33699424859',
  ministere: 'https://agriculture.gouv.fr/le-registre-dutilisation-des-produits-phytopharmaceutiques-au-format-electronique',
};
const NOM_REGISTRE = 'Registre 2027';
const NOM_AIDE = 'Mode d\'emploi & Ma Vigne';
const LIGNES_SAISIE = 2000;   // les aides et le oui / non valent jusqu'à cette ligne

/* ── 4. L'onglet « Registre 2027 » ──────────────────────────────────────── */
function feuilleRegistre(cols) {
  const nAnnexe = cols.indexOf('Conduite biologique') + 1;   // les colonnes de l'annexe II vont jusqu'à « Conduite biologique »
  if (nAnnexe < 18) throw new Error('« Conduite biologique » introuvable ou mal placée dans MV_PHY_CSV_COLS');
  const der = lettre(cols.length - 1);
  const styleCol = { texte: S.cTxt, date: S.cDate, heure: S.cHeure, gps: S.cGps, nombre: S.cNum };
  const colsXml = cols.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${LARGEUR_COL[c] || Math.max(LARGEUR[CONSIGNES[c].fmt], Math.min(30, c.length * 0.9))}" style="${styleCol[CONSIGNES[c].fmt]}" customWidth="1"/>`).join('');
  const entete = cols.map((c, i) => txt(lettre(i) + '1', c, i < nAnnexe ? S.tAnnexe : S.tPlus)).join('');
  const exemple = cols.map((c, i) => {
    const k = CONSIGNES[c], ref = lettre(i) + '2';
    if (k.ex === '' || k.ex == null) return `<c r="${ref}" s="${S.exTxt}"/>`;
    if (k.fmt === 'date') return num(ref, serieDate(k.ex), S.exDate);
    if (k.fmt === 'heure') return num(ref, serieHeure(k.ex), S.exHeure);
    if (k.fmt === 'gps') return num(ref, k.ex, S.exGps);
    if (k.fmt === 'nombre') return num(ref, k.ex, S.exNum);
    return txt(ref, k.ex, S.exTxt);
  }).join('');
  const dv = cols.map((c, i) => {
    const k = CONSIGNES[c], L = lettre(i), plage = `${L}2:${L}${LIGNES_SAISIE}`;
    const quand = k.quand === 'En plus' ? 'En plus de l’arrêté (Ma Vigne).' : k.quand + '.';
    const prompt = esc((quand + ' ' + k.aide).slice(0, 255));
    if (c === 'Conduite biologique')
      return `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" errorTitle="oui ou non" error="Écrivez oui ou non." promptTitle="Format attendu" prompt="${prompt}" sqref="${plage}"><formula1>"oui,non"</formula1></dataValidation>`;
    return `<dataValidation allowBlank="1" showInputMessage="1" promptTitle="Format attendu" prompt="${prompt}" sqref="${plage}"/>`;
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><tabColor rgb="FF3D6B27"/><pageSetUpPr fitToPage="1"/></sheetPr>
<dimension ref="A1:${der}2"/>
<sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${colsXml}</cols>
<sheetData><row r="1" ht="48" customHeight="1">${entete}</row><row r="2">${exemple}</row></sheetData>
<dataValidations count="${dv.length}">${dv.join('')}</dataValidations>
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="landscape" fitToWidth="2" fitToHeight="0"/>
</worksheet>`;
}

/* ── 5. L'onglet « Mode d'emploi & Ma Vigne » ───────────────────────────── */
function feuilleAide(cols) {
  const rows = [], liens = [], fusions = [];
  let r = 0;
  const ligne = (cellules, ht) => { r++; rows.push(`<row r="${r}"${ht ? ` ht="${ht}" customHeight="1"` : ''}>${cellules(r)}</row>`); return r; };
  const plein = (texte, st, ht, lien) => ligne((n) => {
    fusions.push(`B${n}:D${n}`); if (lien) liens.push({ ref: `B${n}`, url: lien });
    return txt(`B${n}`, texte, st) + `<c r="C${n}" s="${st}"/><c r="D${n}" s="${st}"/>`;
  }, ht);

  ligne(() => '');
  plein('Registre phytosanitaire 2027 — mode d’emploi', S.titre, 26);
  plein('Modèle vierge, aux colonnes de l’annexe II de l’arrêté du 24 décembre 2025 : à partir du 1er janvier 2027, le registre doit pouvoir être fourni dans un format électronique lisible par une machine.', S.para, 34);
  ligne(() => '');
  // L'encadré Ma Vigne — en tête, là où l'œil arrive.
  plein('Modèle offert par Ma Vigne — ' + LIENS.page, S.cadreLien, 22, LIENS.page);
  plein('Remplir ces colonnes à la main après chaque traitement devient vite pénible. Ma Vigne les écrit automatiquement pendant que vous traitez, depuis le catalogue E-Phy officiel.', S.cadre, 34);
  plein('Testez la démo libre : ' + LIENS.demo, S.cadreLien, 20, LIENS.demo);
  plein('Ou appelez Nicolas Guéret au 06 99 42 48 59 (appel ou WhatsApp).', S.cadreGras, 22, LIENS.tel);
  ligne(() => '');
  plein('Les règles de saisie', S.section, 20);
  const regles = [
    'Une ligne par produit et par parcelle. Un mélange de deux produits sur une parcelle fait deux lignes.',
    'La ligne 2 de l’onglet « Registre 2027 » est un exemple : effacez-la avant de remplir. L’aide de chaque colonne s’affiche quand vous cliquez dans une case.',
    'Date : JJ/MM/AAAA. Horaires : HH:MM, sur 24 heures, seulement quand l’AMM ou la réglementation le prévoit.',
    'Culture : le code OEPP, VITVI pour la vigne. Stade : deux chiffres de l’échelle BBCH, quand l’usage est limité à certains stades.',
    'Surface traitée et surface de la parcelle ne sont pas la même chose : notez les hectares réellement traités. La surface totale de la parcelle a sa propre colonne, pour voir d’un coup d’œil ce qui ne l’a été qu’en partie.',
    'Remplissez le registre le jour du traitement. De 2027 à 2029, ce qui n’est pas saisi au format électronique doit y être converti avant le 31 janvier de l’année suivante ; dès 2030, dans les trente jours.',
    'Pour fournir le fichier : Fichier › Enregistrer sous › CSV UTF-8, depuis l’onglet « Registre 2027 » (Excel n’enregistre que l’onglet affiché). Gardez le registre au moins cinq ans.',
  ];
  regles.forEach((t) => plein('•  ' + t, S.para, t.length > 150 ? 48 : 32));
  plein('Les listes officielles des cultures et des stades BBCH : site du ministère de l’Agriculture.', S.lien, 20, LIENS.ministere);
  ligne(() => '');
  plein('Colonne par colonne', S.section, 20);
  ligne((n) => txt(`B${n}`, 'Colonne', S.thead) + txt(`C${n}`, 'Ce qu’on y écrit', S.thead) + txt(`D${n}`, 'Quand', S.thead), 20);
  cols.forEach((c) => {
    const k = CONSIGNES[c];
    const quand = k.quand === 'En plus' ? 'En plus (Ma Vigne)' : k.quand;
    ligne((n) => txt(`B${n}`, c, S.tcell) + txt(`C${n}`, k.aide, S.tcell) + txt(`D${n}`, quand, S.tcell), k.aide.length > 95 ? 46 : 30);
  });
  ligne(() => '');
  plein('En vert dans l’onglet « Registre 2027 » : les colonnes de l’annexe II, dans son ordre. En beige : ce que Ma Vigne ajoute à son export (parcelle, substance active, applicateur, détails d’une rentrée anticipée).', S.para, 34);

  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><tabColor rgb="FFC9A84C"/><pageSetUpPr fitToPage="1"/></sheetPr>
<dimension ref="B1:D${r}"/>
<sheetViews><sheetView showGridLines="0" workbookViewId="0"><selection activeCell="B2" sqref="B2"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols><col min="1" max="1" width="3" customWidth="1"/><col min="2" max="2" width="36" customWidth="1"/><col min="3" max="3" width="74" customWidth="1"/><col min="4" max="4" width="18" customWidth="1"/></cols>
<sheetData>${rows.join('')}</sheetData>
<mergeCells count="${fusions.length}">${fusions.map((f) => `<mergeCell ref="${f}"/>`).join('')}</mergeCells>
<hyperlinks>${liens.map((l, i) => `<hyperlink ref="${l.ref}" r:id="rId${i + 1}"/>`).join('')}</hyperlinks>
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${liens.map((l, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${esc(l.url)}" TargetMode="External"/>`).join('')}</Relationships>`;
  return { xml, rels, liens: liens.map((l) => l.url) };
}

/* ── 6. Le classeur et son ZIP (entrées stockées, date fixe) ────────────── */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zipStocke(entrees) {
  const DATE = ((2026 - 1980) << 9) | (11 << 5) | 25, HEURE = 0;   // 25/11/2026 00:00 — fixe, pour des octets stables
  const locaux = [], centraux = []; let pos = 0;
  for (const { nom, data } of entrees) {
    const n = Buffer.from(nom, 'utf8'), d = Buffer.from(data, 'utf8'), crc = crc32(d);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(0, 8);
    h.writeUInt16LE(HEURE, 10); h.writeUInt16LE(DATE, 12); h.writeUInt32LE(crc, 14); h.writeUInt32LE(d.length, 18); h.writeUInt32LE(d.length, 22);
    h.writeUInt16LE(n.length, 26); h.writeUInt16LE(0, 28);
    locaux.push(h, n, d);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(0, 10);
    c.writeUInt16LE(HEURE, 12); c.writeUInt16LE(DATE, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(d.length, 20); c.writeUInt32LE(d.length, 24);
    c.writeUInt16LE(n.length, 28); c.writeUInt32LE(0, 30); c.writeUInt32LE(0, 34); c.writeUInt32LE(0, 38); c.writeUInt32LE(pos, 42);
    centraux.push(c, n);
    pos += 30 + n.length + d.length;
  }
  const cd = Buffer.concat(centraux);
  const fin = Buffer.alloc(22); fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(entrees.length, 8); fin.writeUInt16LE(entrees.length, 10);
  fin.writeUInt32LE(cd.length, 12); fin.writeUInt32LE(pos, 16);
  return Buffer.concat([...locaux, cd, fin]);
}

/* Lecture d'un ZIP à entrées stockées : ce que lit mv-harnais-tarif1. */
export function lireZip(buf) {
  const out = {}; let p = 0;
  while (buf.readUInt32LE(p) === 0x04034b50) {
    const meth = buf.readUInt16LE(p + 8), taille = buf.readUInt32LE(p + 18), nl = buf.readUInt16LE(p + 26), xl = buf.readUInt16LE(p + 28);
    if (meth !== 0) throw new Error('entrée compressée : ce lecteur ne lit que les entrées stockées');
    const nom = buf.toString('utf8', p + 30, p + 30 + nl), d0 = p + 30 + nl + xl;
    out[nom] = buf.toString('utf8', d0, d0 + taille); p = d0 + taille;
  }
  return out;
}

export function fabriquer(srcRegistre) {
  const cols = colonnesDeLAppli(srcRegistre);
  const sans = cols.filter((c) => !CONSIGNES[c]);
  if (sans.length) throw new Error('colonne(s) de l’export sans consigne dans mv-registre-modele.mjs : ' + sans.join(' · '));
  const aide = feuilleAide(cols);
  const T = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const entrees = [
    { nom: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>` },
    { nom: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${T}/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="${T}/extended-properties" Target="docProps/app.xml"/></Relationships>` },
    { nom: 'docProps/core.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Registre phytosanitaire 2027 — modèle vierge</dc:title><dc:subject>Registre d’utilisation des produits phytopharmaceutiques au format électronique</dc:subject><dc:creator>Ma Vigne — GUERETTECH</dc:creator><dc:description>Modèle offert par Ma Vigne — ${LIENS.page}</dc:description><dcterms:created xsi:type="dcterms:W3CDTF">2026-11-25T00:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-11-25T00:00:00Z</dcterms:modified></cp:coreProperties>` },
    { nom: 'docProps/app.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Ma Vigne</Application><Company>GUERETTECH</Company></Properties>` },
    { nom: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${T}"><bookViews><workbookView activeTab="0"/></bookViews><sheets><sheet name="${esc(NOM_REGISTRE)}" sheetId="1" r:id="rId1"/><sheet name="${esc(NOM_AIDE)}" sheetId="2" r:id="rId2"/></sheets></workbook>` },
    { nom: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${T}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${T}/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="${T}/styles" Target="styles.xml"/></Relationships>` },
    { nom: 'xl/styles.xml', data: STYLES },
    { nom: 'xl/worksheets/sheet1.xml', data: feuilleRegistre(cols) },
    { nom: 'xl/worksheets/sheet2.xml', data: aide.xml },
    { nom: 'xl/worksheets/_rels/sheet2.xml.rels', data: aide.rels },
  ];
  return { buf: zipStocke(entrees), cols, liens: aide.liens, noms: [NOM_REGISTRE, NOM_AIDE] };
}

/* ── 7. En ligne de commande ─────────────────────────────────────────────── */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const src = fs.readFileSync(path.join(RACINE, 'src/registre.js'), 'utf8');
  const { buf, cols } = fabriquer(src);
  const cible = path.join(RACINE, SORTIE);
  if (process.argv.includes('--verifier')) {
    const ok = fs.existsSync(cible) && Buffer.compare(fs.readFileSync(cible), buf) === 0;
    console.log(ok ? `✓ modèle du registre à jour (${cols.length} colonnes, ${buf.length} octets)`
                   : '✗ ' + SORTIE + ' ne correspond plus aux colonnes de src/registre.js — relancer : node scripts/mv-registre-modele.mjs');
    process.exit(ok ? 0 : 1);
  }
  fs.mkdirSync(path.dirname(cible), { recursive: true });
  fs.writeFileSync(cible, buf);
  console.log(`✓ ${SORTIE} : ${cols.length} colonnes, ${buf.length} octets`);
}
