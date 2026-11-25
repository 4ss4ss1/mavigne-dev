#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — VITRINE-3 (§606) : LA PAGE LOGICIEL-VIGNE, RESSERRÉE POUR MENER À L'ESSAI
   Lancer :          node scripts/mv-harnais-vitrine3.mjs
   Contre-épreuves : node scripts/mv-harnais-vitrine3.mjs --contre

   CE QU’IL GARDE (lu dans public/logiciel-vigne.html, public/llms.txt, firebase.json)
   ① l’ordre des sections décidé par Nico (24/11) ; « Cinq endroits » et « Quatre écrans » ne reviennent pas ;
      chaque ancre du menu, du panneau et du JSON-LD a sa cible ;
   ② l’en-tête : « Voir la démo » (trait) juste avant « Demander un essai » ; l’adresse en .html partout, parce que
      firebase.json renvoie /logiciel-vigne vers /logiciel-vigne.html (un canonical sans .html désignerait une adresse
      qui redirige) ;
   ③ le haut de page : le sous-titre court ; quatre vrais onglets (rôles, aria-controls, un seul choisi, les écrans
      cachés hors de portée du clavier) ; un appui arrête le défilement ; les écrans qu’on ne regarde pas se remettent
      à zéro AVANT celui qu’on regarde ;
   ④ le bandeau annonce la mise en route et son montant (250 €, TARIF-1 §608) ;
   ⑤ « Qui écrit ce logiciel » : la phrase des tests à la place de l’ancien chiffre faux, le portrait et ses initiales ;
      aucun retour client affiché tant que le bloc est en commentaire ;
   ⑥ la question de la pérennité : même texte à l’écran et dans le JSON-LD ;
   ⑦ les tarifs : un essai par formule (?formule=), Domaine en avant (Nico, 24/11) avec un badge qui dit un fait,
      pas une popularité ;
   ⑧ « Comment ça se passe » sépare l’essai gratuit et ce que paie la mise en route ; llms.txt dit la même chose ;
   ⑨ essai.html lit ?formule= et coche d’avance les modules de la formule (le contenu des cartes de tarifs).
   ★ TARIF-1 (§608, 25/11) : les montants et le contenu des formules ont changé (250 € pour toutes, Planning en
      Vigneron) ; ④ ⑧ ⑨ suivent. La cohérence de toute la chaîne (appli, console, site) est dans mv-harnais-tarif1.
   ⚠️ Il ne regarde pas l’écran : le rendu au navigateur (375, 768, 1100, 1280, 1440) est dans le §606.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { page: lire('public/logiciel-vigne.html'), llms: lire('public/llms.txt'), fb: lire('firebase.json'), essai: lire('public/essai.html') };

const sansCommentaires = (h) => h.replace(/<!--[\s\S]*?-->/g, '');
const texte = (h) => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ').replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
const corps = (h) => h.slice(h.indexOf('<body>'));
function bloc(src, debut) {   /* une balise et son contenu, jusqu'à sa fermeture équilibrée */
  const i = src.indexOf(debut); if (i < 0) return '';
  const tag = debut.match(/^<(\w+)/)[1]; const re = new RegExp('<' + tag + '\\b|</' + tag + '>', 'g'); re.lastIndex = i;
  let n = 0, m; while ((m = re.exec(src))) { if (m[0][1] === '/') { n--; if (n === 0) return src.slice(i, m.index + m[0].length); } else n++; }
  return '';
}

function suite(S) {
  const out = []; const T = (n, c, d = '') => out.push([n, !!c, d]);
  const P = S.page, B = sansCommentaires(corps(P)), main = bloc(B, '<main');

  /* ① l'ordre */
  const ordre = [...main.matchAll(/<section class="(?:section|bref|haut|suite)"(?: id="([\w-]+)")?/g)].map((m) => m[1] || 'bref');
  const attendu = ['haut', 'bref', 'journee', 'registre', 'carnet', 'lieux', 'presentation', 'objections', 'prix', 'suite'];
  T('① l’ordre : haut, bandeau, journée, registre, carnet, trois lieux, qui écrit, objections, tarifs, suite', ordre.join() === attendu.join(), ordre.join());
  T('① « Cinq endroits » et « Quatre écrans » ne reviennent pas', !/id="(fonctions|ecrans)"/.test(B) && !/Cinq endroits pour une seule|Quatre écrans, quatre questions/.test(B) && !/#(flux|reg-liste|cuve)\b/.test(B));
  const ids = new Set([...B.matchAll(/id="([\w-]+)"/g)].map((m) => m[1]));
  const ancres = [...B.matchAll(/href="#([\w-]+)"/g)].map((m) => m[1]);
  const ld = (P.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1] || '';
  const ancresLd = [...ld.matchAll(/logiciel-vigne\.html#([\w-]+)/g)].map((m) => m[1]);
  const orphelines = [...ancres, ...ancresLd].filter((a) => !ids.has(a));
  T('① chaque ancre (menu, panneau, boutons, JSON-LD #formules) a sa cible', orphelines.length === 0, orphelines.join(','));
  T('① le menu suit la page : L’application, Registre 2027, Présentation, Questions, Tarifs',
    [...bloc(B, '<nav class="menu"').matchAll(/href="#([\w-]+)"/g)].map((m) => m[1]).join() === 'journee,registre,presentation,objections,prix');
  T('① le carnet et les trois lieux allument « L’application »', /id="carnet" data-nav="#journee"/.test(B) && /id="lieux" data-nav="#journee"/.test(B));

  /* ② l'en-tête et l'adresse */
  const act = bloc(B, '<div class="barre-actions"');
  T('② « Voir la démo » (trait) juste avant « Demander un essai » dans l’en-tête',
    /<a class="bt bt-trait bt-petit bt-demo" href="https:\/\/mavigneapp\.fr\/demo\.html">Voir la démo<\/a>\s*<a class="bt bt-plein bt-petit bt-essai" href="\/essai\.html">Demander un essai<\/a>/.test(act));
  T('② le panneau du téléphone dans le même ordre (démo, puis essai)', /panneau-actions[^>]*><a class="bt bt-trait" href="https:\/\/mavigneapp\.fr\/demo\.html">Voir la démo<\/a><a class="bt bt-plein" href="\/essai\.html">/.test(B));
  const redir = /"source":\s*"\/logiciel-vigne",\s*"destination":\s*"\/logiciel-vigne\.html"/.test(S.fb);
  T('② l’adresse en .html partout : canonical, og:url et logo (firebase.json renvoie /logiciel-vigne vers .html)',
    redir && P.includes('<link rel="canonical" href="https://mavigneapp.fr/logiciel-vigne.html">') && P.includes('<meta property="og:url" content="https://mavigneapp.fr/logiciel-vigne.html">') && B.includes('<a class="marque" href="/logiciel-vigne.html">'));

  /* ③ le haut de page */
  T('③ le sous-titre court', texte(bloc(B, '<p class="chapo"')) === "Une seule application pour les travaux de la vigne, le registre phyto 2027, la cave et les heures d'équipe. Chacun saisit une fois sur le terrain ; le bureau se met à jour tout seul.");
  const liste = bloc(B, '<div class="onglets-demo"');
  const tabs = [...liste.matchAll(/<button type="button" role="tab" id="(og-[\w-]+)" aria-controls="(ecran-[\w-]+)" aria-selected="(true|false)"( tabindex="-1")?>/g)];
  const panneaux = [...B.matchAll(/<section class="ecran" id="(ecran-[\w-]+)" role="tabpanel" aria-labelledby="(og-[\w-]+)"( aria-hidden="true" inert)?>/g)];
  T('③ quatre onglets (Vigne, Tracteur, Phyto, Cave) dans une liste d’onglets nommée', /role="tablist" aria-label="[^"]+"/.test(liste) && tabs.length === 4 && texte(liste).split(' ').join() === 'Vigne,Tracteur,Phyto,Cave');
  T('③ chaque onglet désigne son écran, et l’écran le sien', tabs.length === 4 && panneaux.length === 4 && tabs.every((t, i) => t[2] === panneaux[i][1] && panneaux[i][2] === t[1]));
  T('③ un seul onglet choisi au départ ; les trois autres écrans cachés et hors du clavier',
    tabs.filter((t) => t[3] === 'true').length === 1 && tabs[0][3] === 'true' && !tabs[0][4] && tabs.slice(1).every((t) => t[4]) && !panneaux[0]?.[3] && panneaux.slice(1).every((p) => p[3]));
  const js = (P.match(/<script>\s*\/\* VITRINE-3 — le portrait[\s\S]*?<\/script>/) || [''])[0];
  const fnJs = (nom) => { const i = js.indexOf('function ' + nom + '('); return i < 0 ? '' : js.slice(i, js.indexOf('\n}', i) + 2); };
  T('③ un appui sur un onglet arrête le défilement sur son écran ; les flèches, Début et Fin s’y déplacent ; « Reprendre le défilement » le relance',
    /OG\.forEach\(\(b,i\)=>\{\s*b\.addEventListener\('click',\(\)=>choisir\(i,false\)\)/.test(js) && /manuel=i;/.test(fnJs('choisir'))
    && /ArrowRight:\(i\+1\)%4,ArrowLeft:\(i\+3\)%4,Home:0,End:3/.test(js) && js.includes('Reprendre le défilement') && /if\(manuel>=0\)demoManuel/.test(fnJs('rendre')));
  T('③ l’onglet suit l’écran affiché, défilement ou choix (aria-selected, tabindex, aria-hidden, inert)',
    /marquer\(e\)/.test(fnJs('demo')) && /marquer\(c\)/.test(fnJs('demoManuel')) && /aria-selected/.test(fnJs('marquer')) && /\.inert=!on/.test(fnJs('marquer')));
  const d = fnJs('demo'), dm = fnJs('demoManuel');
  T('③ les écrans qu’on ne regarde pas se remettent à zéro AVANT celui qu’on regarde (sinon le doigt et le message ne se voient jamais)',
    d.indexOf('reposerSauf(') > 0 && d.indexOf('reposerSauf(') < d.indexOf('ECR[e](') && dm.indexOf('reposerSauf(') > 0 && dm.indexOf('reposerSauf(') < dm.indexOf('ECR[c]('));
  T('③ le code des cartes retirées est parti (le fil, le registre et la cuve de « Cinq endroits »)', !/histFlux|histReg|histCuve|tracerFlux/.test(P));

  /* ④ le bandeau */
  T('④ le prix du bandeau annonce la mise en route et son montant', /<b>Un prix par domaine<\/b><span>De 29 à 79&nbsp;€ par mois, sans coût par utilisateur \(\+&nbsp;250&nbsp;€ de mise en route unique\)\.<\/span>/.test(B));

  /* ⑤ qui écrit ce logiciel */
  const aut = bloc(B, '<article class="auteur" id="auteur"');
  T('⑤ la phrase des tests remplace l’ancien chiffre faux',
    texte(aut).includes("Chaque calcul sensible — heures d'équipe, coûts par parcelle, cumul de cuivre sur sept ans — est vérifié automatiquement par une batterie de tests avant chaque mise à jour.") && !/Le calcul des coûts par parcelle l’a été|quand un chiffre est faux/.test(P));
  T('⑤ le portrait : la photo et son texte, les initiales dessous, le logo retiré de la signature',
    /<span class="portrait" data-initiales="NG"><img src="\/images\/nicolas-gueret\.webp" alt="Nicolas Guéret dans les vignes en Côte de Nuits"/.test(aut) && !/class="signe"><img/.test(aut));
  T('⑤ une photo absente ou cassée est retirée (pas d’image cassée à l’écran)', /img\.complete&&!img\.naturalWidth\)retirer\(\);else img\.addEventListener\('error',retirer/.test(js));
  T('⑤ aucun retour client affiché : le bloc des retours terrain reste en commentaire', !/class="retours?\b/.test(B) && /<!-- RETOURS TERRAIN[\s\S]*class="retours"[\s\S]*fin des retours terrain -->/.test(P));

  /* ⑥ la pérennité */
  const q = "Et si vous êtes sous l'eau pendant les vendanges, ou si vous arrêtez ?";
  const det = [...bloc(B, '<div class="faq"').matchAll(/<details[^>]*><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)];
  const vis = det.find((m) => texte(m[1]).replace(/[«»]/g, '').trim() === q);
  let J = null; try { J = JSON.parse(ld); } catch (e) { J = null; }
  const faq = J && (J['@graph'] || []).find((g) => g['@type'] === 'FAQPage');
  const jq = faq && faq.mainEntity.find((e) => e.name === q);
  T('⑥ le JSON-LD se lit', !!J && !!faq);
  T('⑥ la question de la pérennité est posée à l’écran', !!vis && !/Je récupère mes données/.test(B));
  T('⑥ même réponse à l’écran et dans le JSON-LD', !!vis && !!jq && texte(vis[2]) === texte(jq.acceptedAnswer.text), vis && jq ? texte(vis[2]).slice(0, 60) + ' ≠ ' + texte(jq.acceptedAnswer.text).slice(0, 60) : '');
  T('⑥ la réponse dit ce qui est vrai : Europe, chaque nuit, JSON, CSV, PDF, trois mois de préavis, 90 jours, réponse sous 24 heures (Nico, 24/11 ; essai.html promet la même)',
    !!vis && ['hébergées en Europe', 'chaque nuit', 'JSON', 'CSV structuré', 'PDF', 'trois mois de préavis', '90 jours', 'Et même en vendanges, je vous réponds sous 24 heures.'].every((m) => texte(vis[2]).includes(m)) && /vous répond personnellement sous 24 heures/.test(S.essai));

  /* ⑦ les tarifs */
  const form = bloc(B, '<div class="formules" id="formules"');
  const cartes = [...form.matchAll(/<article class="formule[^"]*"[\s\S]*?<\/article>/g)].map((m) => m[0]);
  const cta = (c, f, nom, cls) => new RegExp(`<a class="bt ${cls}" href="/essai\\.html\\?formule=${f}">Essayer ${nom} \\(15&nbsp;jours\\)</a></article>$`).test(c);
  T('⑦ un essai par formule, en bas de chaque carte, avec sa formule dans l’adresse',
    cartes.length === 3 && cta(cartes[0], 'essentiel', 'Essentiel', 'bt-trait') && cta(cartes[1], 'vigneron', 'Vigneron', 'bt-trait') && cta(cartes[2], 'domaine', 'Domaine', 'bt-plein'));
  T('⑦ Domaine en avant, et elle seule : bordure, bouton plein, un badge qui dit un fait (pas « la plus choisie »)',
    /^<article class="formule mise"/.test(cartes[2] || '') && (form.match(/class="formule mise"/g) || []).length === 1 && (form.match(/class="badge-formule"/g) || []).length === 1
    && /<span class="badge-formule">La plus complète<\/span><h3>Domaine<\/h3>/.test(cartes[2] || '') && !/plus choisi/i.test(P));

  /* ⑧ l'essai et la mise en route */
  const et = [...bloc(B, '<ol class="etapes"').matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => texte(m[1]));
  T('⑧ étape 2 : l’essai sur un échantillon de parcelles, en conditions réelles, sans carte bancaire', /^Quinze jours d'essai/.test(et[1] || '') && ['en conditions réelles', 'sans carte bancaire', 'un échantillon suffit'].every((m) => (et[1] || '').includes(m)));
  T('⑧ étape 3 : ce que couvre le forfait unique (250 €, le parcellaire, le barème, l’annualisation dès Vigneron, la demi-journée de formation)',
    /^La mise en route/.test(et[2] || '') && ['forfait unique de 250 €', 'tout votre parcellaire depuis Telepac ou KML', 'barème et des périodes', "l'annualisation dès la formule Vigneron", "une demi-journée de formation de l'équipe"].every((m) => (et[2] || '').includes(m)));
  T('⑧ llms.txt dit la même chose (l’annualisation, l’échantillon, chaque nuit, le préavis)',
    ["(et de l'annualisation dès la formule Vigneron)", 'un échantillon de parcelles suffit', 'sauvegardé chaque nuit', 'trois mois de préavis, puis 90 jours'].every((m) => S.llms.includes(m)));

  /* ⑨ essai.html coche les modules de la formule */
  const E = S.essai;
  const valeurs = new Set([...E.matchAll(/<input type="checkbox" name="mod" value="([\w-]+)"/g)].map((m) => m[1]));
  let F = null; try { F = Function('"use strict";return (' + (E.match(/const FORMULES = (\{[\s\S]*?\n  \});/) || [])[1] + ');')(); } catch (e) { F = null; }
  const mods = (k) => (F && F[k] ? F[k].mods.slice().sort().join() : '');
  T('⑨ essai.html : une table des trois formules, chaque module coché existe dans le formulaire',
    !!F && Object.keys(F).sort().join() === 'domaine,essentiel,vigneron' && Object.values(F).every((f) => f.mods.length && f.mods.every((m) => valeurs.has(m))));
  T('⑨ le contenu des cartes : Essentiel = travaux, météo ; Vigneron = + tracteur, phyto, planning ; Domaine = + pilotage, cave',
    mods('essentiel') === 'meteo,travaux' && mods('vigneron') === 'meteo,phyto,planning,tracteur,travaux' && mods('domaine') === 'cave,meteo,phyto,pilotage,planning,tracteur,travaux');
  const coch = (E.match(/function cocherFormule\(\)\{[\s\S]*?\n  \}/) || [''])[0];
  T('⑨ la formule est lue dans l’adresse, les cases cochées, les blocs qui en dépendent ouverts, et c’est appelé au chargement',
    /new URLSearchParams\(location\.search\)\.get\('formule'\)/.test(coch) && /i\.checked = true/.test(coch) && /syncConds\(\);/.test(coch) && /\n  cocherFormule\(\);\n/.test(E));
  return out;
}

const sur = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('mutant sans prise : ' + a.slice(0, 70)); return { ...S, [cle]: S[cle].replace(a, b) }; };
const MUTANTS = [
  ['« Cinq endroits » revient', sur('page', '<section class="section" id="registre">', '<section class="section" id="fonctions"><h2>Cinq endroits pour une seule vérité.</h2></section>\n<section class="section" id="registre">')],
  ['« Qui écrit » remonte sous le haut de page', (S) => { const p = S.page; const a = bloc(p, '<section class="section" id="presentation">'); const s = p.replace(a + '\n\n', ''); return { ...S, page: s.replace('<section class="section" id="journee">', a + '\n\n<section class="section" id="journee">') }; }],
  ['le menu pointe encore vers #fonctions', sur('page', '<a href="#journee">L’application</a>', '<a href="#fonctions">L’application</a>')],
  ['« Voir la démo » retiré de l’en-tête', sur('page', '<a class="bt bt-trait bt-petit bt-demo" href="https://mavigneapp.fr/demo.html">Voir la démo</a>', '')],
  ['un canonical sans .html (une adresse qui redirige)', sur('page', '<link rel="canonical" href="https://mavigneapp.fr/logiciel-vigne.html">', '<link rel="canonical" href="https://mavigneapp.fr/logiciel-vigne">')],
  ['l’ancien sous-titre', sur('page', 'Une seule application pour les travaux de la vigne', 'Une seule application pour conduire le domaine : les parcelles et les travaux de la vigne')],
  ['un écran caché resté au clavier', sur('page', 'aria-labelledby="og-cave" aria-hidden="true" inert>', 'aria-labelledby="og-cave" aria-hidden="true">')],
  ['un onglet qui ne désigne pas son écran', sur('page', 'id="og-phyto" aria-controls="ecran-phyto"', 'id="og-phyto" aria-controls="ecran-cave"')],
  ['un appui qui ne change rien', sur('page', "b.addEventListener('click',()=>choisir(i,false));", "b.addEventListener('click',()=>{});")],
  ['l’écran regardé remis avant les autres (le doigt s’éteint)', sur('page', 'reposerSauf([e,(e+3)%4]);\n  ECR[e](u-(e===0&&k>0?.8:.6));', 'ECR[e](u-(e===0&&k>0?.8:.6));\n  reposerSauf([e,(e+3)%4]);')],
  ['le bandeau sans la mise en route', sur('page', ' (+&nbsp;250&nbsp;€ de mise en route unique).', '.')],
  ['le bandeau revient à l’ancien montant', sur('page', '(+&nbsp;250&nbsp;€ de mise en route unique)', '(+&nbsp;490&nbsp;€ de mise en route unique)')],
  ['l’étape 3 revient aux 10 à 20 h', sur('page', 'et une demi-journée de formation de l’équipe, en visio ou sur place. Puis', 'et 10 à 20&nbsp;h d’accompagnement. Puis')],
  ['Vigneron sans le planning (essai.html)', sur('essai', "mods: ['travaux', 'meteo', 'tracteur', 'phyto', 'planning'] }", "mods: ['travaux', 'meteo', 'tracteur', 'phyto'] }")],
  ['l’ancien chiffre faux revient', sur('page', 'Chaque calcul sensible', 'Et quand un chiffre est faux, je le dis. Le calcul des coûts par parcelle l’a été. Chaque calcul sensible')],
  ['le logo revient à la place du portrait', sur('page', '<span class="portrait" data-initiales="NG"><img src="/images/nicolas-gueret.webp"', '<img src="/logo-barre.png" alt=""><span class="portrait" data-initiales="NG"><img src="/images/x.webp"')],
  ['un retour client affiché sans être écrit par un client', sur('page', '\n  fin des retours terrain -->', ' -->\n  <div class="retours"><figure class="retour"><blockquote><p>Génial.</p></blockquote></figure></div>')],
  ['la réponse du JSON-LD diverge de l’écran', sur('page', 'puis 90 jours pour récupérer vos données. Et même en vendanges', 'puis 60 jours pour récupérer vos données. Et même en vendanges')],
  ['la promesse des 24 heures retirée', sur('page', ' Et même en vendanges, je vous réponds sous 24&nbsp;heures.', '')],
  ['« La plus choisie » au lieu d’un fait', sur('page', '<span class="badge-formule">La plus complète</span>', '<span class="badge-formule">La plus choisie</span>')],
  ['Vigneron remise en avant à côté de Domaine', sur('page', '<article class="formule" style="--i:1"><h3>Vigneron</h3>', '<article class="formule mise" style="--i:1"><h3>Vigneron</h3>')],
  ['Domaine sans le planning', sur('essai', "mods: ['travaux', 'meteo', 'tracteur', 'phyto', 'planning', 'pilotage', 'cave']", "mods: ['travaux', 'meteo', 'tracteur', 'phyto', 'pilotage', 'cave']")],
  ['un module qui n’existe pas dans le formulaire', sur('essai', "mods: ['travaux', 'meteo'] }", "mods: ['travaux', 'meteo', 'reserve'] }")],
  ['la formule plus lue dans l’adresse', sur('essai', "new URLSearchParams(location.search).get('formule')", "''")],
  ['les blocs liés aux modules restent fermés', sur('essai', "h.textContent = 'Cochés d\\u2019après la formule ' + f.nom + ' \\u2014 décochez ou ajoutez ce que vous voulez.';\n    syncConds();", "h.textContent = 'Cochés d\\u2019après la formule ' + f.nom + ' \\u2014 décochez ou ajoutez ce que vous voulez.';")],
  ['un essai sans sa formule', sur('page', 'href="/essai.html?formule=domaine"', 'href="/essai.html"')],
  ['#formules perdu (le JSON-LD y renvoie)', sur('page', '<div class="formules" id="formules">', '<div class="formules">')],
  ['l’essai redevient flou sur ce qu’il demande', sur('page', '&nbsp;: un échantillon suffit pour juger.', '.')],
  ['llms.txt oublie la sauvegarde de chaque nuit', sur('llms', ', sauvegardé chaque nuit.', '.')],
];

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  for (const [n, ok, d] of r) { console.log((ok ? '  ✓ ' : '  ✗ ') + n + (ok || !d ? '' : '  → ' + d)); if (!ok) ko++; }
  console.log(ko ? `✗ vitrine : ${ko} rouge(s) sur ${r.length}` : `✓ vitrine : ${r.length} vertes`);
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some(([, ok]) => !ok)) { console.log('✗ la suite doit être verte avant les contre-épreuves'); process.exit(1); }
  let ko = 0;
  for (const [nom, f] of MUTANTS) {
    let rouge;
    try { rouge = suite(f(S0)).find(([, ok]) => !ok); } catch (e) { console.log('  ✗ ' + nom + ' : ' + e.message); ko++; continue; }
    if (rouge) console.log('  ✓ ' + nom + ' → rougit (' + rouge[0] + ')'); else { console.log('  ✗ ' + nom + ' → reste vert'); ko++; }
  }
  console.log(ko ? `✗ contre-épreuve vitrine : ${ko} mutant(s) non vus` : `✓ contre-épreuve vitrine : ${MUTANTS.length}/${MUTANTS.length}`);
  process.exit(ko ? 1 : 0);
}
