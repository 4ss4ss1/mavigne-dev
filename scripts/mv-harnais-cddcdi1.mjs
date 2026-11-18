/* ───────────────────────────────────────────────────────
   HARNAIS — CDDCDI-1 (§589, régularisé dans MOTS-7), REVU PAR CHAINE-1 (§596) : LE PASSÉ D'UN CONTRAT ARCHIVÉ SE VOIT
   AU PLANNING — ET, DEPUIS CHAINE-1, IL SE SAISIT
   Lancer :          node scripts/mv-harnais-cddcdi1.mjs
   Contre-épreuves : node scripts/mv-harnais-cddcdi1.mjs --contre

   POURQUOI IL EXISTE
   Le jour où un CDD devient CDI, la fiche garde le CDI comme contrat en cours et archive le CDD. La grille du Planning
   ne lisait que le contrat en cours (_planInContract) : tous les jours d'avant la date du CDI tombaient en « – »
   (hors contrat), alors que la personne était là. CDDCDI-1 (17/11) les a rendus visibles, EN LECTURE SEULE.
   Le 18/11, Nico : « je ne peux plus modifier la période où il était en CDD [...] il ne faut pas être bloqué là-dessus ».
   CHAINE-1 (§596) : un contrat qui précède sans coupure entre dans la chaîne en cours (mv-harnais-chaine1 le joue sur
   l'appli entière) ; un contrat séparé par une coupure garde son compteur, mais ses jours se saisissent comme les autres.

   CE QU'IL GARDE (les vraies fonctions de la case, montées seules dans Node ; un contrat archivé APRÈS UNE COUPURE)
   ① un jour d'un contrat archivé s'affiche comme un jour normal — ni « – », ni lecture seule ;
   ② un jour qu'aucun contrat ne couvre (avant l'embauche, ou dans la coupure) reste « – » ;
   ③ un jour du contrat en cours ne change pas ;
   ④ les compteurs lisent la chaîne en cours (_planDebutCompteur), jamais un contrat séparé par une coupure
      (_planJourCouvert n'entre pas dans _planInContract) ;
   ⑤ la grille, la fiche du mois et la ligne « Σ jour » demandent toutes « ce jour se saisit-il ? »
      (_planJourSaisissable) ; plus aucune case « lecture seule » ; le harnais du retard charge _pl2CellJour ;
      ce fichier est dans la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { pl: lire('src/planning.js'), css: lire('src/styles.css'), ret: lire('scripts/mv-harnais-retard.mjs'), liste: lire('scripts/mv-harnais-liste.mjs') };
function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction introuvable : ' + nom);
  let k = src.indexOf('{', i), p = 0;
  for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const sansCom = (s) => s.replace(/^\s*\/\/.*$/gm, '');
// Les vraies règles de contrat et la vraie case, montées dans Node ; le contenu d'un jour (_pl2CellJour) est simulé.
// _mvContrats ET _mvChaines lisent le tableau de la fiche : deux contrats séparés par une coupure font deux chaînes.
function monter(S, mois) {
  const code = 'var _planDebutMemo=null;\n' + ['_planInContract', '_planDebutCompteur', '_planJourCouvert', '_planJourSaisissable', '_pl2Cell'].map((n) => corps(S.pl, n)).join('\n')
    + '\nreturn { _planInContract, _planJourCouvert, _planJourSaisissable, _pl2Cell };';
  const chaines = (m) => (m.contrats || []).map((c) => ({ debut: c.debut, fin: c.fin, annu: true, debuts: [c.debut], types: ['CDI'] }));
  return new Function('window', '_pY', '_planSansDate', '_planCompteSansDate', 'planMonth', '_pl2CellJour', code)(
    { _mvContrats: (m) => m.contrats || null, _mvChaines: chaines }, () => 2026, () => false, () => false, mois, () => ({ txt: '7', cls: 'pl2c-w' }));
}
// Un CDD de mars à juin, archivé ; une coupure en juillet-août ; un nouveau contrat en septembre.
const COUPE = { nom: 'B', debut_contrat: '2026-09-01', fin_contrat: '', contrats: [{ debut: '2026-03-01', fin: '2026-06-30' }, { debut: '2026-09-01', fin: '' }] };

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };
  const P = S.pl, Pc = sansCom(S.pl);
  essai('① un jour du contrat archivé (15 avril) s’affiche comme un jour normal, sans marque de lecture seule', () => { const c = monter(S, 3)._pl2Cell(COUPE, 'A', 15, {});
    return [c.txt === '7' && c.cls === 'pl2c-w' && !c.ro && !c.hc, JSON.stringify(c)]; });
  essai('① … du premier au dernier jour du contrat archivé (1er mars, 30 juin), et il se saisit', () => { const M2 = monter(S, 2), M5 = monter(S, 5);
    return !M2._pl2Cell(COUPE, 'A', 1, {}).hc && !M5._pl2Cell(COUPE, 'A', 30, {}).hc && M2._planJourSaisissable(COUPE, 2, 1) === true && M5._planJourSaisissable(COUPE, 5, 30) === true; });
  essai('② avant l’embauche (15 février), la case reste « – », et ne se saisit pas', () => { const M = monter(S, 1), c = M._pl2Cell(COUPE, 'A', 15, {});
    return [c.hc === true && c.txt === '\u2013' && c.cls === 'pl2c-hc' && M._planJourSaisissable(COUPE, 1, 15) === false, JSON.stringify(c)]; });
  essai('② dans la coupure entre deux contrats (15 juillet), la case reste « – »', () => { const M = monter(S, 6), c = M._pl2Cell(COUPE, 'B', 15, {});
    return [c.hc === true && M._planJourSaisissable(COUPE, 6, 15) === false, JSON.stringify(c)]; });
  essai('③ un jour du contrat en cours (15 septembre) ne change pas', () => { const c = monter(S, 8)._pl2Cell(COUPE, 'A', 15, {});
    return [c.txt === '7' && !c.ro && !c.hc, JSON.stringify(c)]; });
  essai('③ une fiche sans tableau de contrats se comporte comme avant', () => { const M = monter(S, 7), m = { nom: 'C', debut_contrat: '2026-09-01' };
    return M._pl2Cell(m, 'A', 15, {}).hc === true && !monter(S, 8)._pl2Cell(m, 'A', 15, {}).hc; });
  essai('④ le compteur ne lit pas un contrat séparé par une coupure : avril est hors du compteur en cours', () => { const M = monter(S, 3);
    return M._planInContract(COUPE, 3, 15) === false && M._planInContract(COUPE, 8, 15) === true && M._planJourCouvert(COUPE, 3, 15) === true
      && /_planDebutCompteur\(mbr\)/.test(corps(P, '_planInContract')) && !/_mvContrats|_planJourCouvert|_planJourSaisissable/.test(sansCom(corps(P, '_planInContract'))); });
  T('⑤ plus aucune case « lecture seule » dans le Planning (la grille, la fiche du mois)', !/lecture seule/.test(Pc.replace(/\/\*[\s\S]*?\*\//g, '')) && !/\.ro\b/.test(Pc) && !/pl2-cell-ro/.test(Pc));
  T('⑤ … ni de règle de style pour elle', !S.css.includes('.pl2-cell-ro') && S.css.includes('.pl2-cell-out,.pl2-cell-hc{cursor:default;}'));
  T('⑤ la case, la ligne « Σ jour » et la fiche du mois demandent _planJourSaisissable', /if\(!_planJourSaisissable\(mbr,planMonth,d\)\)return\{txt:'\\u2013',cls:'pl2c-hc',hc:true\};/.test(corps(P, '_pl2Cell'))
    && Pc.includes('      if(!_planJourSaisissable(mbr,planMonth,d))return;\n      var e=_pEntDay(mbr.nom,planMonth,d);')
    && /var ce=_pl2Cell\(mbr,plId,d,L\);\s*g\+=ce\.hc\?'<span class="pl2-chip pl2c-hc">'\+ce\.txt\+'<\/span>'\s*:'<button type="button" class="pl2-chip '\+ce\.cls\+'" onclick="planFicheOpenDay\(/.test(Pc));
  T('⑤ le harnais du retard charge _pl2CellJour et _planJourSaisissable', S.ret.includes("'_pl2Cell', '_pl2CellJour',") && S.ret.includes("'_planJourSaisissable',"));
  T('⑤ ce harnais et ses contre-épreuves sont dans la liste', S.liste.includes("['node scripts/mv-harnais-cddcdi1.mjs']") && S.liste.includes("['node scripts/mv-harnais-cddcdi1.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nCDDCDI-1 (§589) revu par CHAINE-1 (§596) — le passé d’un contrat archivé se voit au Planning, et il se saisit\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 400) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien (règle du §588)'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['le passé d’un contrat archivé retombe en « – » (le défaut d’origine)', sur('pl', "  if(!_planJourSaisissable(mbr,planMonth,d))return{txt:'\\u2013',cls:'pl2c-hc',hc:true};\n  return _pl2CellJour(", "  if(!_planInContract(mbr,planMonth,d))return{txt:'\\u2013',cls:'pl2c-hc',hc:true};\n  return _pl2CellJour(")],
    ['un jour archivé ne se saisit plus (la lecture seule de CDDCDI-1)', sur('pl', '  return _planInContract(mbr,m,d)||_planJourCouvert(mbr,m,d);', '  return _planInContract(mbr,m,d);')],
    ['une coupure entre deux contrats s’affiche comme travaillée', sur('pl', '  return _planInContract(mbr,m,d)||_planJourCouvert(mbr,m,d);', '  return true;')],
    ['le compteur lit un contrat séparé par une coupure', sur('pl', "  var d0=_planDebutCompteur(mbr);\n  if(d0&&ds<d0)return false;", "  var d0=_planDebutCompteur(mbr);\n  if(_planJourCouvert(mbr,m,d))return true;\n  if(d0&&ds<d0)return false;")],
    ['la ligne « Σ jour » oublie les jours archivés', sur('pl', '      if(!_planJourSaisissable(mbr,planMonth,d))return;\n      var e=_pEntDay(mbr.nom,planMonth,d);', '      if(!_planInContract(mbr,planMonth,d))return;\n      var e=_pEntDay(mbr.nom,planMonth,d);')],
    ['la case en lecture seule revient dans la grille', sur('pl', '      // CHAINE-1 (§596) : plus de case « lecture seule »', "      if(c.ro){h+='<div class=\"pl2-cell pl2-cell-ro\" title=\"lecture seule\"></div>';return;}\n      // CHAINE-1 (§596) : plus de case « lecture seule »")],
    ['la règle de style de la case en lecture seule revient', sur('css', '.pl2-cell-out,.pl2-cell-hc{cursor:default;}', '.pl2-cell-out,.pl2-cell-hc,.pl2-cell-ro{cursor:default;}')],
    ['le harnais du retard ne charge plus _planJourSaisissable', sur('ret', "'_planJourSaisissable',", "")],
    ['le harnais sort de la liste', sur('liste', "['node scripts/mv-harnais-cddcdi1.mjs --contre']", "['node scripts/mv-harnais-cddcdi1.mjs']")],
  ];
  let fuites = 0;
  console.log('\nCDDCDI-1 / CHAINE-1 — contre-épreuves : chaque mutation doit rougir\n');
  for (const [nom, f] of mutants) {
    let rouge = false, note = '';
    try { rouge = suite(f(S0)).some((x) => !x[1]); } catch (e) { note = ' (' + e.message + ')'; rouge = !/motif absent/.test(e.message); if (!rouge) note += ' — MOTIF ABSENT'; }
    if (!rouge) fuites++;
    console.log('  ' + (rouge ? '\x1b[32m✓\x1b[0m rougit : ' : '\x1b[31m✗ RESTE VERT : \x1b[0m') + nom + note);
  }
  console.log('\n' + (fuites ? '\x1b[31mROUGE\x1b[0m — ' + fuites + ' contre-épreuve(s) sans effet' : '\x1b[32mVERT\x1b[0m — ' + mutants.length + ' contre-épreuves rougissent'));
  process.exit(fuites ? 1 : 0);
}
