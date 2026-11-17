/* ───────────────────────────────────────────────────────
   HARNAIS — CDDCDI-1 (§589, régularisé dans MOTS-7) : LE PASSÉ D'UN CONTRAT ARCHIVÉ SE VOIT AU PLANNING, IL NE SE SAISIT PAS
   Lancer :          node scripts/mv-harnais-cddcdi1.mjs
   Contre-épreuves : node scripts/mv-harnais-cddcdi1.mjs --contre

   POURQUOI IL EXISTE
   Le jour où un CDD devient CDI, la fiche garde le CDI comme contrat en cours et archive le CDD. La grille du Planning
   ne lisait que le contrat en cours (_planInContract) : tous les jours d'avant la date du CDI tombaient en « – »
   (hors contrat), alors que la personne était là, sans coupure. Le commit « planning » (1b14008, 17/11) affiche ces
   jours — en lecture seule — sans toucher aux compteurs. Il était arrivé sans harnais, sans version, et cassait deux
   contrôles (mv-harnais-retard, mv-harnais-vueeq1 --contre). Ce harnais le garde.

   CE QU'IL GARDE
   ① un jour d'un contrat archivé s'affiche comme un jour normal, marqué « lecture seule » (ro), plus « hors contrat » ;
   ② un jour qu'aucun contrat ne couvre (avant l'embauche, ou dans une coupure entre deux contrats) reste « – » ;
   ③ un jour du contrat en cours ne change pas (pas de marque ro) ;
   ④ les compteurs ne bougent pas : _planInContract ne lit toujours que le contrat en cours ;
   ⑤ la grille : la case ro n'est pas un bouton (rien ne s'y saisit), elle a sa classe ; la ligne « Σ jour » compte ses
      heures ; la fiche du mois ne l'ouvre pas ; le harnais du retard charge _pl2CellJour ; ce fichier est dans la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { pl: lire('src/planning.js'), css: lire('src/styles.css'), ret: lire('scripts/mv-harnais-retard.mjs'), liste: lire('scripts/mv-harnais-liste.mjs'), wn: lire('src/whats-new.js') };
function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction introuvable : ' + nom);
  let k = src.indexOf('{', i), p = 0;
  for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
// Les vraies règles de contrat et la vraie case, montées dans Node ; le contenu d'un jour (_pl2CellJour) est simulé.
function monter(S, mois) {
  const code = ['_planInContract', '_planJourCouvert', '_planJourArchive', '_pl2Cell'].map((n) => corps(S.pl, n)).join('\n')
    + '\nreturn { _planInContract, _planJourCouvert, _planJourArchive, _pl2Cell };';
  return new Function('window', '_pY', '_planSansDate', '_planCompteSansDate', 'planMonth', '_pl2CellJour', code)(
    { _mvContrats: (m) => m.contrats || null }, () => 2026, () => false, () => false, mois, () => ({ txt: '7', cls: 'pl2c-w' }));
}
// Un CDD du 1er mars au 31 août, archivé ; le CDI part du 1er septembre, sans coupure.
const SUIVI = { nom: 'A', debut_contrat: '2026-09-01', fin_contrat: '', contrats: [{ debut: '2026-03-01', fin: '2026-08-31' }, { debut: '2026-09-01', fin: '' }] };
// Un CDD de mars à juin, archivé ; une coupure en juillet-août ; un nouveau contrat en septembre.
const COUPE = { nom: 'B', debut_contrat: '2026-09-01', fin_contrat: '', contrats: [{ debut: '2026-03-01', fin: '2026-06-30' }, { debut: '2026-09-01', fin: '' }] };

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };
  const P = S.pl;
  essai('① un jour du CDD archivé (15 août) s’affiche comme un jour normal, marqué lecture seule', () => { const c = monter(S, 7)._pl2Cell(SUIVI, 'A', 15, {});
    return [c.txt === '7' && c.cls === 'pl2c-w' && c.ro === true && !c.hc, JSON.stringify(c)]; });
  essai('① … du premier au dernier jour du CDD (1er mars, 31 août)', () => monter(S, 2)._pl2Cell(SUIVI, 'A', 1, {}).ro === true && monter(S, 7)._pl2Cell(SUIVI, 'A', 31, {}).ro === true);
  essai('② avant l’embauche (15 février), la case reste « – », hors contrat', () => { const c = monter(S, 1)._pl2Cell(SUIVI, 'A', 15, {});
    return [c.hc === true && c.txt === '\u2013' && c.cls === 'pl2c-hc' && !c.ro, JSON.stringify(c)]; });
  essai('② dans une coupure entre deux contrats (15 juillet), la case reste « – »', () => { const M = monter(S, 6), c = M._pl2Cell(COUPE, 'B', 15, {});
    return [c.hc === true && !c.ro && M._planJourArchive(COUPE, 6, 15) === false, JSON.stringify(c)]; });
  essai('③ un jour du contrat en cours (15 septembre) ne change pas : ni « – », ni lecture seule', () => { const M = monter(S, 8), c = M._pl2Cell(SUIVI, 'A', 15, {});
    return [c.txt === '7' && !c.ro && !c.hc && M._planJourArchive(SUIVI, 8, 15) === false, JSON.stringify(c)]; });
  essai('③ une fiche sans tableau de contrats se comporte comme avant', () => { const M = monter(S, 7), m = { nom: 'C', debut_contrat: '2026-09-01' };
    return M._pl2Cell(m, 'A', 15, {}).hc === true && !monter(S, 8)._pl2Cell(m, 'A', 15, {}).ro; });
  essai('④ les compteurs ne bougent pas : _planInContract ne lit que le contrat en cours', () => { const M = monter(S, 7);
    return M._planInContract(SUIVI, 7, 15) === false && M._planInContract(SUIVI, 8, 15) === true && M._planJourCouvert(SUIVI, 7, 15) === true && M._planJourArchive(SUIVI, 7, 15) === true
      && !/_mvContrats|_planJourCouvert|_planJourArchive/.test(corps(P, '_planInContract')); });
  T('④ l’affichage seul lit le contrat archivé : _planJourArchive ne sert qu’à la ligne « Σ jour »', (P.match(/_planJourArchive\(/g) || []).length === 2
    && P.includes('if(!_planInContract(mbr,planMonth,d)&&!_planJourArchive(mbr,planMonth,d))return;'));
  T('⑤ dans la grille, la case en lecture seule n’est pas un bouton : rien ne s’y saisit, et elle dit pourquoi', /if\(c\.ro\)\{h\+='<div class="pl2-cell pl2-cell-ro'\+\(we\?' pl2-we':''\)\+\(_pl2IsToday\(d\)\?' pl2-tdcol':''\)\+'" title="Contrat pr\\u00e9c\\u00e9dent \\u00b7 lecture seule"><span class="pl2-chip '\+c\.cls\+'">'\+c\.txt\+'<\/span><\/div>';return;\}/.test(P));
  T('⑤ … avant la ligne qui en ferait un bouton (planCellTap)', P.indexOf("if(c.ro){h+='<div class=\"pl2-cell pl2-cell-ro'") > 0 && P.indexOf("if(c.ro){h+='<div class=\"pl2-cell pl2-cell-ro'") < P.indexOf("onclick=\"planCellTap(\\''+nomA+'\\','+d+')\""));
  T('⑤ … avec sa classe à elle (curseur au repos), pas celle de la vue Équipe du salarié', S.css.includes('.pl2-cell-out,.pl2-cell-hc,.pl2-cell-ro{cursor:default;}') && (P.match(/h\+='<div class="pl2-cell pleq-ro'/g) || []).length === 1);
  T('⑤ dans la fiche du mois, un jour archivé ne s’ouvre pas', P.includes(":ce.ro?'<span class=\"pl2-chip '+ce.cls+'\" title=\"Contrat pr\\u00e9c\\u00e9dent \\u00b7 lecture seule\">'+ce.txt+'</span>'"));
  T('⑤ le harnais du retard charge _pl2CellJour (il plantait)', S.ret.includes("'_pl2Cell', '_pl2CellJour',"));
  const wn = S.wn.slice(S.wn.indexOf("  { v: '11.17',"), S.wn.indexOf("  { v: '11.16',"));
  T('⑤ l’annonce 11.17 le dit à l’admin, sans nommer personne', /pour: \['admin'\], emoji: 'calendrier', titre: 'Planning\\u00a0: un CDD devenu CDI garde son passé à l’écran'/.test(wn) && /lecture seule/.test(wn) && /Les compteurs ne changent pas/.test(wn));
  T('⑤ ce harnais et ses contre-épreuves sont dans la liste', S.liste.includes("['node scripts/mv-harnais-cddcdi1.mjs']") && S.liste.includes("['node scripts/mv-harnais-cddcdi1.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nCDDCDI-1 (§589) — le passé d’un contrat archivé se voit au Planning, il ne se saisit pas\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 400) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien (règle du §588)'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['le passé d’un CDD archivé retombe en « – » (le défaut d’origine)', sur('pl', "    if(!_planJourCouvert(mbr,planMonth,d))return{txt:'\\u2013',cls:'pl2c-hc',hc:true};\n    _ro=true;", "    return{txt:'\\u2013',cls:'pl2c-hc',hc:true};")],
    ['un jour archivé perd sa marque de lecture seule : il redevient saisissable', sur('pl', '  if(_ro)c.ro=true;\n', '')],
    ['une coupure entre deux contrats s’affiche comme travaillée', sur('pl', "    if(!_planJourCouvert(mbr,planMonth,d))return{txt:'\\u2013',cls:'pl2c-hc',hc:true};", "    if(false)return{txt:'\\u2013',cls:'pl2c-hc',hc:true};")],
    ['tout jour passe en lecture seule', sur('pl', '  var _ro=false;\n  if(!_planInContract(mbr,planMonth,d)){', '  var _ro=true;\n  if(!_planInContract(mbr,planMonth,d)){')],
    ['le compteur lit les contrats archivés', sur('pl', "  if(!mbr.debut_contrat&&!mbr.fin_contrat)return true;\n  var year=_pY();", "  if(!mbr.debut_contrat&&!mbr.fin_contrat)return true;\n  if(_planJourCouvert(mbr,m,d))return true;\n  var year=_pY();")],
    ['« archivé » se dit aussi d’un jour du contrat en cours', sur('pl', '  return !_planInContract(mbr,m,d)&&_planJourCouvert(mbr,m,d);', '  return _planJourCouvert(mbr,m,d);')],
    ['la ligne « Σ jour » oublie les jours archivés', sur('pl', 'if(!_planInContract(mbr,planMonth,d)&&!_planJourArchive(mbr,planMonth,d))return;', 'if(!_planInContract(mbr,planMonth,d))return;')],
    ['la case en lecture seule redevient un bouton qui se coche', sur('pl', "if(c.ro){h+='<div class=\"pl2-cell pl2-cell-ro'+(we?' pl2-we':'')+(_pl2IsToday(d)?' pl2-tdcol':'')+'\" title=", "if(c.ro){h+='<div onclick=\"planCellTap()\" class=\"pl2-cell pl2-cell-ro'+(we?' pl2-we':'')+(_pl2IsToday(d)?' pl2-tdcol':'')+'\" title=")],
    ['la case en lecture seule reprend la classe de la vue Équipe', sur('pl', "if(c.ro){h+='<div class=\"pl2-cell pl2-cell-ro'", "if(c.ro){h+='<div class=\"pl2-cell pleq-ro'")],
    ['le curseur d’une case en lecture seule invite à cliquer', sur('css', '.pl2-cell-out,.pl2-cell-hc,.pl2-cell-ro{cursor:default;}', '.pl2-cell-out,.pl2-cell-hc{cursor:default;}')],
    ['dans la fiche du mois, un jour archivé s’ouvre', sur('pl', ":ce.ro?'<span class=\"pl2-chip '+ce.cls+'\" title=", ":false?'<span class=\"pl2-chip '+ce.cls+'\" title=")],
    ['le harnais du retard ne charge plus _pl2CellJour', sur('ret', "'_pl2Cell', '_pl2CellJour',", "'_pl2Cell',")],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("emoji: 'calendrier', titre: 'Planning\\u00a0: un CDD devenu CDI"); if (i < 0) throw new Error('motif absent : annonce'); const j = S.wn.lastIndexOf("pour: ['admin']", i); return { ...S, wn: S.wn.slice(0, j) + "pour: ['tous']" + S.wn.slice(j + 15) }; }],
    ['le harnais sort de la liste', sur('liste', "['node scripts/mv-harnais-cddcdi1.mjs --contre']", "['node scripts/mv-harnais-cddcdi1.mjs']")],
  ];
  let fuites = 0;
  console.log('\nCDDCDI-1 — contre-épreuves : chaque mutation doit rougir\n');
  for (const [nom, f] of mutants) {
    let rouge = false, note = '';
    try { rouge = suite(f(S0)).some((x) => !x[1]); } catch (e) { note = ' (' + e.message + ')'; rouge = !/motif absent/.test(e.message); if (!rouge) note += ' — MOTIF ABSENT'; }
    if (!rouge) fuites++;
    console.log('  ' + (rouge ? '\x1b[32m✓\x1b[0m rougit : ' : '\x1b[31m✗ RESTE VERT : \x1b[0m') + nom + note);
  }
  console.log('\n' + (fuites ? '\x1b[31mROUGE\x1b[0m — ' + fuites + ' contre-épreuve(s) sans effet' : '\x1b[32mVERT\x1b[0m — ' + mutants.length + ' contre-épreuves rougissent'));
  process.exit(fuites ? 1 : 0);
}
