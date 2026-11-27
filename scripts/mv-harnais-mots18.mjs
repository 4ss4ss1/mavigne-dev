/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-18 (§618) : PHYTO › FERTILISATION, LA CAVE, LA FICHE D'UNE PERSONNE ALLÉGÉES ; LES STYLES MORTS DU BANDEAU PURGÉS
   Lancer :          node scripts/mv-harnais-mots18.mjs
   Contre-épreuves : node scripts/mv-harnais-mots18.mjs --contre

   POURQUOI IL EXISTE
   Le plan « Moins de texte » (§580) fini, restaient hors plan des phrases de 15 mots et plus : Phyto › Fertilisation (4),
   la Cave (Récoltes, Cuves, Bouteilles, Labo, Diagnostic, Courbes), la fiche d'une personne au Planning (une douzaine de notes
   de paie). Nico (26/11) : « on fait les 3 », directement. La règle du plan : le texte retiré de l'écran va dans le « i » du
   chiffre (MV_INFO) ou dans l'aide « ? » (MV_AIDE) — JAMAIS supprimé. Et la feuille de style gardait les règles de deux places
   que plus rien ne pose (la barre .pil-tabsbar, la ligne du jour SOUS l'en-tête) : relevé page par page, 0 élément visé.
   Ce harnais lit les sources et tient :
     ① chaque phrase retirée vit dans son « i » ou dans l'aide, et chaque « i » posé a sa fiche ;
     ② les phrases longues ne reviennent pas à l'écran ;
     ③ ce qui reste à l'écran : « + Amendement » dans la carte vide, une parcelle par case, la pastille « Lecture seule »,
        la légende des courbes en cases, le pied du cadre sur deux lignes, l'explication de la compta une idée par ligne,
        « Planning › Année » (plus « Réglages ») pour corriger la grille du modèle ;
     ④ la feuille : plus de .pil-tabsbar ni de « .mod-header + .mod-meta-row » ; ce qui vit encore est resté (la ligne
        d'écran du Pilotage collée, la colonne du cockpit, la ligne du jour dans l'en-tête).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { phy: lire('src/phyto.js'), cuv: lire('src/cuvier.js'), cav: lire('src/cave.js'), dgn: lire('src/diagnostic.js'), pl: lire('src/planning.js'),
  uti: lire('src/utils.js'), css: lire('src/styles.css'), ban: lire('src/bandeau.css') };
// le texte d'une source, échappements \uXXXX décodés (les modules écrivent les accents ainsi)
const dec = (t) => t.replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
const NB = /[\u00a0\u202f ]/g, sp = (t) => dec(t).replace(NB, ' ');
const info = (S, cle) => { const i = S.uti.indexOf("'" + cle + "': { t:"); if (i < 0) return null; const j = S.uti.indexOf('] },', i); return sp(S.uti.slice(i, j)); };
const aide = (S) => sp(S.uti.slice(S.uti.indexOf('var MV_AIDE = {'), S.uti.indexOf('var MV_AIDE_DEFAUT')));

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const P = sp(S.phy), C = sp(S.cuv), K = sp(S.cav), D = sp(S.dgn), L = sp(S.pl);
  // ① les phrases retirées vivent dans leur « i » ou dans l'aide
  const fiches = [['phyto.fer.zv', 'zonage</b> a été revu en 2026'], ['phyto.fer.sol', 'Au-delà de <b>3 ha en zone vulnérable</b>'], ['phyto.fer.frac', '60 kg N/ha'],
    ['phyto.fer.plan', 'dose réglementaire'], ['cave.rec.rdt', 'une <b>fourchette</b> quand il est estimé'], ['cave.mesurer', 'relevé de densité par jour'],
    ['cave.btl', 'volume élevé × 133,33'], ['plan.paie.ordre', 'Les <b>absences</b> passent d’abord'], ['plan.paie.figer', 'ce qui changera ensuite passera sur le mois suivant'],
    ['plan.hsup.taux', 'les huit premières à 25 %'], ['plan.repos', 'faute d’accord, dans les deux mois'], ['plan.rattrapage', 'jamais sur la paie'],
    ['plan.cpt.lire', 'Heures sup de semaine'], ['plan.cpt.an', 'travail effectif'], ['plan.cpt.heure', 'Pas d’annualisation']];
  const manque = fiches.filter(([k, t]) => !(info(S, k) || '').includes(t)).map((x) => x[0]);
  T('① chaque phrase retirée a sa fiche « i » (15 fiches) — et l’aide de la Cave garde le Labo et le diagnostic', !manque.length
    && aide(S).includes('une fiche par envoi au labo') && aide(S).includes('le suivre permettrait une détection plus précoce'), manque.join(', '));
  const poses = { 'phyto.fer.zv': P, 'phyto.fer.sol': P, 'phyto.fer.frac': P, 'phyto.fer.plan': P, 'cave.rec.rdt': C, 'cave.mesurer': C, 'cave.btl': K,
    'plan.paie.ordre': L, 'plan.paie.figer': L, 'plan.hsup.taux': L, 'plan.repos': L, 'plan.rattrapage': L, 'plan.cpt.lire': L, 'plan.cpt.an': L, 'plan.cpt.heure': L };
  const nonPoses = Object.entries(poses).filter(([k, src]) => !src.includes("_mvInfoBtn('" + k + "')")).map((x) => x[0]);
  T('① chaque « i » est posé à sa place ; les trois fiches vivantes sont remplies au rendu (le réglage kilos / hL, la légende du tableau, la base ou le plafond)',
    !nonPoses.length && C.includes("_mvInfoSet('cave.rec.rdt'") && L.includes("_mvInfoSet('plan.cpt.lire',{ p:[AT.legende] })") && L.includes("_mvInfoSet('plan.cpt.an',"), nonPoses.join(', '));
  // ② les phrases longues ne reviennent pas
  const parties = [[P, 'Touchez le bouton rond en bas'], [P, 'Le zonage a été revu en 2026 et peut'], [P, 'une analyse par campagne est exigée (matière'], [P, 'Il ne concerne que l’azote minéral'],
    [P, '<small>Le calcul de dose réglementaire (référentiel'], [C, '. Une valeur quand le volume est mesuré'], [C, '<div class="mvv-alert-d">En fermentation active'], [C, 'L’ordre de récolte se lit dans cette liste'],
    [K, 'class="mvb-hint">Bouteilles auto'], [K, '<p class="lbo-intro">Une fiche par envoi'], [D, 'Lecture seule : le diagnostic croise'], [D, 'Ces mesures permettraient'],
    [L, '<p class="pl2-note">Les absences passent'], [L, '<p class="pl2-note">Faites = payées'], [L, 'Les heures sup se comptent à la semaine : les huit'], [L, 'Par journée ou demi-journée, aux dates'],
    [L, '<p class="pl2-note">Une journée écourtée par le domaine'], [L, "'<p class=\"pl2-note\">'+AT.legende"], [L, 'Le solde de départ se règle dans'], [L, 'Un acompte est une avance en euros'],
    [L, 'Au moment d’envoyer la feuille, figez'], [L, 'Corrige la grille du modèle dans Réglages'], [L, 'les heures sont payées à l’heure. \'']];
  const revenues = parties.filter(([src, t]) => src.includes(t)).map((x) => x[1]);
  T('② aucune des 23 phrases longues n’est revenue à l’écran (elles vivent dans leur « i » ou dans l’aide)', !revenues.length, revenues.join(' | '));
  // ③ ce qui reste à l'écran
  T('③ Fertilisation : « + Amendement » dans la carte vide (administrateur), une parcelle par case, la règle du fractionnement en une ligne',
    P.includes("Aucun apport sur cette campagne.</div>'+(adm?'<button type=\"button\" class=\"mvr-btn mvr-btn-p\" style=\"margin-top:10px\" onclick=\"_phytoFab()\">+ Amendement</button>'")
    && P.includes("<div class=\"fer-zvl\">'+_ferParcs().map(function(p){ return '<span>'+lk(p)") && /\.fer-zvl\{display:flex;flex-wrap:wrap/.test(P) && P.includes('Plus de 60 kg N/ha d’azote minéral : en deux apports au moins.'));
  T('③ Cave : « 8 parcelles rentrées sur 8 » et son « i », les cuves à mesurer et leur « i », « Lecture seule — les analyses se saisissent dans Labo », ce qui n’est pas suivi en cases, la plus avancée puis l’ordre de récolte, la légende des courbes en cases',
    C.includes("+ '. ' + _mvInfoBtn('cave.rec.rdt') + '</p>'") && C.includes(" à mesurer '+_mvInfoBtn('cave.mesurer')+'</div>'") && D.includes('<span>Lecture seule — les analyses se saisissent dans Labo.</span>')
    && D.includes("pasMes.map(function (x) { return '<span>' + esc(x) + '</span>'; })") && C.includes("'<div class=\"mvmat-ord\">Ordre de récolte : de haut en bas.</div>'")
    && K.includes("display:flex;flex-wrap:wrap;gap:2px 14px\">'") && K.includes("'<span><b style=\"color:var(--texte-med)\">Pointillé</b> : la médiane</span>'"));
  T('③ la fiche : le pied du cadre sur deux lignes, l’explication de la compta une idée par ligne (l’écran seul), « Planning › Année » pour la grille du modèle, les notes courtes',
    L.includes("+(K.semaines?'<p class=\"pf-pied\">'+K.semaines") && L.includes("l.p.split(/(?<=[.!?])\\s+(?=[A-ZÀ-Ý0-9])|,\\s+(?=\\d)/)")
    && L.includes("attendues')+'.</b> La grille se corrige dans Planning › Année.'") && L.includes('Solde de départ : Réglages › Équipe. Règle de décompte : la roue du Planning.')
    && L.includes('Une avance en euros, retirée du salaire, jamais de la récup.') && L.includes("Figez avant l’envoi : la suite passera sur '+suiv+'."));
  // ④ la feuille
  const css = S.css.replace(/\/\*[\s\S]*?\*\//g, '');
  T('④ la feuille : plus aucun sélecteur .pil-tabsbar ni « .mod-header + .mod-meta-row » (relevés : 0 élément visé, 15 pages × 3 tailles)',
    !/pil-tabsbar/.test(css) && !/\.mod-header\s*\+\s*\.mod-meta-row/.test(css));
  T('④ ce qui vit encore est resté : la ligne d’écran du Pilotage collée sous l’en-tête, la colonne du cockpit, la ligne du jour dans l’en-tête (bandeau.css), le Pilotage en mode démo',
    css.includes('body #page-pilotage .pil-portee{position:sticky;top:var(--pil-entete-bas,0px);z-index:61}') && css.includes('#ck-t-c #ck-fil{position:relative;max-height:186px;overflow:hidden}')
    && S.ban.includes('.mod-header-top > .mod-meta-row{ flex:none;') && /body\.mv-demo-on \.mod-header\{top:var\(--mv-demo-h,40px\);\}/.test(css)
    && css.includes('body .mod-header .mod-meta-row{ flex-wrap:nowrap;'));
  return out;
}

if (!CONTRE) {
  console.log('\n── MOTS-18 — Fertilisation, la Cave, la fiche d’une personne ; la feuille purgée\n');
  const r = suite(S0); let ko = 0;
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 400) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { const d = S[cle].indexOf(de) >= 0 ? de : null; if (!d) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(d, vers) }; };
  const mutants = [
    ['une fiche « i » perd sa phrase (le zonage)', sur('uti', 'Le <b>zonage</b> a été revu en 2026', 'Le <b>découpage</b> a changé')],
    ['l’aide de la Cave perd le diagnostic plus précoce', sur('uti', ' le suivre permettrait une détection plus précoce.', '')],
    ['un « i » n’est plus posé (les cuves à mesurer)', sur('cuv', "+_mvInfoBtn('cave.mesurer')", '')],
    ['la légende du tableau de l’année n’est plus remplie', sur('pl', "_mvInfoSet('plan.cpt.lire',{ p:[AT.legende] });", '')],
    ['la phrase du Labo revient', sur('cav', "  // ★ MOTS-18 (§618) : la phrase d'accueil a quitté l'écran", "  h+='<p class=\"lbo-intro\">Une fiche par envoi au labo.</p>';\n  // ★")],
    ['« Corrige la grille du modèle dans Réglages » revient', sur('pl', ".</b> La grille se corrige dans Planning \\u203a Ann\\u00e9e.'", ".</b> Corrige la grille du mod\\u00e8le dans R\\u00e9glages.'")],
    ['la carte vide perd « + Amendement »', sur('phy', '>+ Amendement</button>', '>Ajouter</button>')],
    ['les parcelles reviennent en une phrase', sur('phy', "'<div class=\"fer-zvl\">'+_ferParcs().map(function(p){ return '<span>'+lk(p)+(p.zv?' (ZV)':'')+'</span>'; }).join('')+'</div>", "_ferParcs().map(function(p){ return lk(p)+(p.zv?' (ZV)':''); }).join(', ')")],
    ['l’explication de la compta redevient un bloc', sur('pl', "l.p.split(/(?<=[.!?])\\s+(?=[A-Z\\u00c0-\\u00dd0-9])|,\\s+(?=\\d)/).map(function(x){return '<p class=\"pf-cl-p\">'+x+'</p>';}).join('')", "'<p class=\"pf-cl-p\">'+l.p+'</p>'")],
    ['une règle .pil-tabsbar revient', sur('css', '.mvu-tabs.mvu-pil .mvu-tab{flex:0 0 auto;}', '.pil-tabsbar{position:sticky;top:0;z-index:60;}\n.mvu-tabs.mvu-pil .mvu-tab{flex:0 0 auto;}')],
    ['une règle « sous l’en-tête » revient', sur('css', 'body .mod-header .mod-meta-row{ flex-wrap:nowrap;', 'body .mod-header + .mod-meta-row,body .mod-header .mod-meta-row{ flex-wrap:nowrap;')],
    ['la purge emporte la ligne d’écran du Pilotage', sur('css', 'body #page-pilotage .pil-portee{position:sticky;top:var(--pil-entete-bas,0px);z-index:61}', '')],
  ];
  let ok = 0;
  for (const [n, f] of mutants) { let rouge = false, d = ''; try { rouge = suite(f(S0)).some((x) => !x[1]); } catch (e) { d = e.message; }
    if (rouge) ok++; console.log('  ' + (rouge ? '\x1b[32m✓\x1b[0m rougit' : '\x1b[31m✗\x1b[0m NE ROUGIT PAS') + ' : ' + n + (d ? ' (' + d + ')' : '')); }
  console.log('\n' + (ok === mutants.length ? '\x1b[32mVERT\x1b[0m — ' + ok + '/' + mutants.length + ' contre-épreuves rougissent' : '\x1b[31mROUGE\x1b[0m — ' + (mutants.length - ok) + ' contre-épreuve(s) muette(s)'));
  process.exit(ok === mutants.length ? 0 : 1);
}
