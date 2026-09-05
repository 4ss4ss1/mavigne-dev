// ════════════════════════════════════════════════════════════════════
// HARNAIS — page vitrine logiciel-vigne.html
// Règle : on exécute la table réellement livrée, on ne la réimplémente pas.
// corps()  : retire commentaires HTML et CSS avant toute assertion de contenu.
// texte()  : décode les entités, sinon un motif rate ce qui est pourtant écrit.
// ════════════════════════════════════════════════════════════════════
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// ⚠️ Deux pieges vecus, corriges ici :
//   1. un chemin relatif au cwd fait echouer le harnais en ENOENT des qu'on ne
//      le lance pas depuis public/ — c'est pour ca qu'il ne tournait nulle part ;
//   2. un chemin de bac a sable en dur se lit comme un succes chez son auteur
//      et nulle part ailleurs.
//   fileURLToPath, PAS new URL(...).pathname : sous Windows ce dernier rend
//   « /C:/Users/... », que Node repart ensuite en « C:\C:\Users\... ».
const ICI = dirname(fileURLToPath(import.meta.url));   // scripts/
const PUB = process.argv[3] || join(ICI, '..', 'public');
const F = process.argv[2] || join(PUB, 'logiciel-vigne.html');
const s = readFileSync(F, 'utf8');
let ok = 0, ko = 0;
const A = (c, l) => { if (c) { ok++; } else { ko++; console.log('  ✗ ' + l); } };

const corps = t => t.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const texte = t => t
  .replace(/&nbsp;/g, ' ').replace(/&rsquo;/g, '’').replace(/&amp;/g, '&')
  .replace(/&#183;/g, '·').replace(/&rarr;/g, '→')
  .replace(/&copy;/g, '©').replace(/&euro;/g, '€');
const C = corps(s);          // structure  (entités intactes)
const T = texte(C);          // contenu    (entités décodées)
// ⚠️ Le JSON-LD répète les mêmes chiffres : une assertion posée sur T se laisse
//    satisfaire par le <head> alors que la page VISIBLE ne dit plus rien.
const TB = texte(corps(s.slice(s.indexOf('</head>'))));  // le corps seul

// ── 1. Structure ────────────────────────────────────────────────────
A(s.split('<style>').length === 2 && s.split('</style>').length === 2, 'un seul bloc <style>');
A((s.match(/<script>/g) || []).length === 1, 'un seul bloc <script>');
A(s.includes('<!DOCTYPE html>') && s.trimEnd().endsWith('</html>'), 'document complet');
A((s.match(/\{/g) || []).length === (s.match(/\}/g) || []).length, 'accolades équilibrées');
for (const t of ['div','section','ul','figure','details','svg','header','footer','main','nav','aside','article','button']) {
  const o = (s.match(new RegExp('<' + t + '[\\s>]', 'g')) || []).length;
  const c = (s.match(new RegExp('</' + t + '>', 'g')) || []).length;
  A(o === c, `balise <${t}> équilibrée (${o}/${c})`);
}
A(!/[\uD800-\uDFFF]/.test(s), 'aucun demi-caractère isolé');
A(s.indexOf('</main>') < s.indexOf('<footer'), 'le pied de page est hors de <main>');
A(!/<img (?![^>]*alt=)/.test(C), 'toute image porte un alt');
A(![...C.matchAll(/<img [^>]*>/g)].some(m => !/width=/.test(m[0]) || !/height=/.test(m[0])), 'toute image porte width et height');

// ── 2. La table de chiffrage LIVRÉE, exécutée telle quelle ──────────
const js = s.match(/<script>([\s\S]*?)<\/script>/)[1];
const mC = js.match(/var CREDITS = (\[[\s\S]*?\n  \]);/);
const mH = js.match(/var HORS = (\{[\s\S]*?\});/);
A(!!mC && !!mH, 'tables CREDITS et HORS extractibles');
const CREDITS = eval(mC[1]);
const HORS = eval('(' + mH[1] + ')');
const h = c => Math.round(c.min * c.freq / 60);
const total = CREDITS.reduce((a, c) => a + h(c), 0);
A(CREDITS.length === 9, `neuf lignes (${CREDITS.length})`);
A(total === 127, `le total vaut 127 h (${total})`);
A(h(HORS) === 37, `la ligne hors total vaut 37 h (${h(HORS)})`);
A(CREDITS.every(c => c.hyp && c.hyp.length > 25), 'chaque ligne porte son hypothèse');
A(CREDITS.every(c => c.min > 0 && c.freq > 0), 'aucune ligne à zéro');
A(new Set(CREDITS.map(c => c.nom)).size === CREDITS.length, 'aucune ligne en double');
A(js.includes('>' + total + '<') === false, 'le total n’est pas écrit en dur dans le script');
A(new RegExp('id="tot">' + total + '<').test(C), `le total affiché (${total}) est celui de la table`);
A(/Cent vingt-sept heures/.test(T), 'le titre annonce le même chiffre');

// ── 3. La règle de la démo : le compte ne porte AUCUN montant ───────
const i0 = C.indexOf('id="compte"'), i1 = C.indexOf('id="conformite"');
const compte = texte(C.slice(i0, i1));
A(i0 > 0 && i1 > i0, 'section du compte localisée');
A(!/\d\s*(€|euros?)\b/i.test(compte), 'aucun montant chiffré dans le compte');
A(!/\b(948|790|990|690|490|260)\b/.test(compte), 'aucun chiffre d’argent résiduel dans le compte');
A(/Aucun euro dans ce calcul/.test(compte), 'la page dit explicitement qu’elle ne chiffre pas en euros');
// ⚠️ Les lignes du compte sont ÉCRITES PAR LE SCRIPT (corpsLigne + tables), pas dans le HTML
//    statique : juger le fragment HTML seul, c'est une assertion qui se prouve toute seule.
const gabarit = texte(js.slice(js.indexOf('function corpsLigne'), js.indexOf('var hote')));
const donnees = JSON.stringify(CREDITS) + JSON.stringify(HORS);
A(!/€|\beuros?\b/i.test(gabarit), 'aucun montant dans le gabarit des lignes du compte');
A(!/€|\beuros?\b/i.test(donnees), 'aucun montant dans les données du compte');
A(!/\d\s*(€|euros?)\b/i.test(gabarit + donnees), 'aucun prix chiffré dans le compte, gabarit compris');

// ── 4. Les prix, une fois chacun ────────────────────────────────────
for (const p of ['29', '49', '79']) {
  A((T.match(new RegExp('<b>' + p + ' €</b>', 'g')) || []).length === 1, `prix ${p} € présent une fois`);
}
for (const [f, p] of [['Essentiel', '490'], ['Vigneron', '690'], ['Domaine', '990']]) {
  A((T.match(new RegExp('<b>' + p + ' €</b>', 'g')) || []).length === 1, `forfait ${f} chiffré une fois (${p} €)`);
}
A(/60 €/.test(TB), 'le tarif horaire au-delà du volant est dit dans le corps');
A((TB.match(/ni frais de dossier/gi) || []).length === 2, 'pas de frais de dossier : dit deux fois (récap et FAQ)');
A((TB.match(/ni coût par utilisateur/gi) || []).length === 2, 'pas de coût par utilisateur : dit deux fois');
A(/PAC \/ Telepac/.test(TB) && /KML/.test(TB), 'ce que couvre le forfait est nommé (Telepac, KML)');
A(/293 B/.test(T), 'mention TVA art. 293 B');
A(/prix par domaine|Pas par utilisateur/i.test(T), 'le prix par domaine est dit');

// ── 5. Liens internes : chaque cible existe dans public/ ────────────
const liens = [...new Set([...C.matchAll(/href="\/([a-z0-9\-]+\.html)"/g)].map(m => m[1]))];
liens.forEach(l => A(existsSync(join(PUB, l)), `page liée existante : ${l}`));
A(liens.length >= 6, `au moins six liens internes (${liens.length})`);
A(/href="https:\/\/mavigneapp\.fr\/\?demo=visite"/.test(C), 'lien de démo publique présent');
A(/href="https:\/\/mavigneapp\.fr\/essai\.html"/.test(C), 'lien d’essai présent');

// ── 6. Images : chaque source existe ────────────────────────────────
const imgs = [...new Set([...C.matchAll(/src="\/([a-z0-9\-\.]+\.(?:png|jpg|svg|webp))"/g)].map(m => m[1]))];
imgs.forEach(i => A(existsSync(join(PUB, i)), `image existante : ${i}`));
A(imgs.length >= 4, `au moins quatre images (${imgs.length})`);

// ── 7. Aucun nom de client, aucune donnée réelle ────────────────────
/* ⚠ SEUL ENDROIT DU DEPOT OU DES NOMS DE CLIENTS RESTENT EN CLAIR, ET C'EST
   ASSUME : c'est la LISTE NOIRE qui garde la page vitrine publique. Pour
   verifier qu'un nom de client n'apparait pas sur la vitrine, il faut bien
   savoir lequel chercher. Un fichier de scripts/ n'est pas servi aux clients
   et n'entre pas dans le bundle — il n'est visible que dans le depot.
   ★ Si le depot doit devenir totalement muet : remplacer par des empreintes
   SHA-256 des noms, en gardant 'domaine-' en clair comme canari pour la
   contre-epreuve. Non fait ici : un controle illisible ne se maintient pas. */
for (const n of ['Marchand', 'Grillot', 'Chapelle', 'Garraud', 'Dupont', 'domaine-']) {
  A(!new RegExp(n, 'i').test(T), `aucune mention de « ${n} »`);
}
A(/données de démonstration/.test(T), 'la capture du hero est signalée comme démo');

// ── 8. Les appuis réglementaires sont nommés ────────────────────────
A(/2023\/564/.test(T), 'règlement UE 2023/564 cité');
A(/24 décembre 2025/.test(T), 'arrêté du 24 décembre 2025 cité');
A(/1\s*<sup>er<\/sup>\s*janvier 2027|1er janvier 2027/.test(T), 'échéance 2027 citée');
A(/31 janvier de l’année suivante/.test(T), 'échéance de conversion citée');
A(/trente jours/.test(T), 'délai de 30 jours (2030) cité');
A(/n’oblige à acheter aucun logiciel/.test(T), 'la nuance honnête est présente');
A(/surface de la parcelle/.test(T) && /surface traitée/.test(T), 'la colonne qui ne ment pas est expliquée');

// ── 8b. Les métadonnées portent leurs accents ───────────────────────
const metas = [...s.slice(0, s.indexOf('</head>')).matchAll(/<meta [^>]*content="([^"]*)"/g)]
  .map(m => m[1]).join(' | ');
for (const mot of ['Ecrit', 'ecrit', 'Demo', 'materiel', 'tache', 'Cote de Nuits', 'pret']) {
  A(!new RegExp('\\b' + mot + '\\b').test(metas), `méta accentuée : « ${mot} » n’y figure pas`);
}

// ── 8c. Données structurées : mensualité, forfait, essai gratuit ────
const ld = [...s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
A(ld.length === 1, `un seul bloc de données structurées (${ld.length})`);
let ldOk = true, ldObj = null;
try { ldObj = JSON.parse(ld[0]); } catch (e) { ldOk = false; }
A(ldOk, 'les données structurées sont du JSON valide');
A(!/\\u[0-9a-fA-F]{4}/.test(ld[0]), 'le JSON-LD est écrit en clair, sans échappement');
A((s.match(/"unitText": "MONTH"/g) || []).length === 3, 'les trois formules sont déclarées mensuelles');
A((s.match(/"unitText": "ONE-TIME"/g) || []).length === 3, 'les trois forfaits sont déclarés payés une fois');
A(/"name": "Essai de 15 jours"[\s\S]{0,240}?"price": "0"/.test(s), 'l’essai de 15 jours est déclaré gratuit');
A(/"eligibleDuration"[\s\S]{0,140}?"value": 15/.test(s), 'la durée de l’essai est déclarée');
if (ldObj) {
  const off = (ldObj['@graph'][0].offers || []);
  A(off.length === 4, `quatre offres déclarées (${off.length})`);
  A(off.filter(o => o.addOn).length === 3, 'chaque abonnement porte son forfait de mise en route');
  const prix = off.filter(o => o.addOn).map(o => o.addOn.price).join(',');
  A(prix === '490,690,990', `forfaits du JSON-LD alignés sur la page (${prix})`);
}

// ── 9. Cohérence avec ce que dit l'application elle-même ────────────
A(/4 minutes|quatre minutes/.test(T), 'durée de démo alignée sur l’écran de bienvenue');
A(/26 écrans/.test(T), 'nombre de chapitres aligné (_MVT_CHAPS = 26)');
A(/10, 15 ou 20 heures/.test(T), 'volants d’accompagnement annoncés');
A(/10 h/.test(T) && /15 h/.test(T) && /20 h/.test(T), 'les trois volants figurent dans les formules');
A(/AROME/.test(T), 'modèle météo nommé');
A(/E-Phy/.test(T), 'catalogue E-Phy nommé');
A(!/3 à 5 heures de bureau par mois/.test(T), 'l’ancien chiffre contradictoire a disparu');

// ── 10. Hygiène ─────────────────────────────────────────────────────
A(!/localStorage|sessionStorage/.test(js), 'aucun stockage navigateur');
const nonChiffres = [...C.matchAll(/http:\/\/(?!www\.w3\.org)[^"'\s]+/g)].map(m => m[0]);
A(nonChiffres.length === 0, `aucun lien non chiffré (${nonChiffres.join(', ')})`);
A(/@media \(prefers-reduced-motion: reduce\)\{/.test(s), 'mouvement réduit : la règle CSS existe');
A(/matchMedia\("\(prefers-reduced-motion: reduce\)"\)/.test(js), 'mouvement réduit : la garde du script existe');
A(/animation-duration:\.001ms/.test(s), 'mouvement réduit : les animations sont bien coupées');
A(/class="saut"/.test(C), 'lien d’évitement présent');
A(/aria-checked/.test(js), 'les cases portent un état accessible');
A(/role="checkbox"/.test(js), 'les lignes du compte sont des cases annoncées');
A(/lang="fr"/.test(s), 'langue déclarée');
A(/rel="canonical"/.test(s), 'canonique déclarée');
A(/FAQPage/.test(s), 'balisage FAQ pour le référencement');
A(/SoftwareApplication/.test(s), 'balisage logiciel pour le référencement');
A(/preload/.test(s), 'polices préchargées');
A(!/<form/.test(C), 'aucun formulaire sur la vitrine (l’essai vit sur sa page)');

// ── 10b. Micro-interactions : ce qui doit rester branché ────────────
// 17 tracés du cadastre + 13 têtes lumineuses + 8 points + 1 liseré = 39.
// Un chemin qui perd son pathLength ne se dessine plus : il apparaît d'un bloc.
const pl = (C.match(/pathLength="1"/g) || []).length;
A(pl === 39, `les 39 tracés du hero sont normalisés (${pl})`);
for (const [g, n2] of [['cad', 8], ['parc', 1], ['rangs', 8], ['tete', 5], ['tete-r', 8],
                       ['pointeurs', 8], ['lisere', 1]]) {
  const bloc = C.slice(C.indexOf(`<g class="${g}"`));
  const fin = bloc.indexOf('</g>');
  A((bloc.slice(0, fin).match(/pathLength="1"/g) || []).length === n2, `groupe ${g} : ${n2} tracés`);
}
A(/@keyframes tracer\{to\{stroke-dashoffset:0\}\}/.test(s), 'le cadastre se dessine');
// ── Le rideau : le texte n'arrive qu'après le cadastre ───────────────
A(/--r:\.95s;/.test(C), 'la durée du rideau est celle qui a été arbitrée (0,95 s)');
A(/\.lever > \*\{opacity:0; transform:translateY\(22px\);\s*\n\s*animation:lever var\(--rTexteD\) var\(--e\) var\(--rTexte\) forwards\}/.test(C),
  'le texte du hero attend la fin du tracé');
A(/\.barre\{opacity:0; animation:paraitre/.test(C), 'la barre haute arrive avec le texte');
A(!/\.barre\{[^}]*transform/.test(C), 'aucun transform sur la barre : elle est en position:fixed');
A(/@media\(max-width:960px\)\{\s*\n\s*\.lever > \*\{animation:lever \.8s/.test(C),
  'le rideau est coupé sous 960 px');
A(/\.lever > \*,\.hero-vue\{opacity:1; transform:none; animation:none\}/.test(C),
  'mouvement réduit : le texte est posé, pas retardé');
A(/@keyframes encre\{/.test(s), 'la ligne sort vive et retombe');
A(/@keyframes monte\{/.test(s) && /stroke-dashoffset:\.988; opacity:0/.test(s),
  'les points remontent les rangs (et ne les descendent pas)');
A(/animation:lisere 7s linear var\(--rVies\) infinite/.test(C), 'le liseré tourne en boucle');
// ⚠️ Le liseré doit RESPIRER : en continu il coûtait 14 images par seconde.
A(/@keyframes lisere\{[\s\S]*?100%\{stroke-dashoffset:0; opacity:0\}/.test(C),
  'le liseré se tait entre deux passages');
A(/animation:respire 3\.4s/.test(C) && /animation:onde 3\.4s/.test(C), 'la pastille respire');
A(/--oCad:\.78/.test(C) && /--oRang:\.44/.test(C), 'la présence du cadastre est au cran arbitré');
A(!/stroke-opacity="\.55"/.test(C), 'les opacités ne sont plus figées dans le dégradé');
A(/\.hero-grille \.tete,\.hero-grille \.tete-r\{display:none\}/.test(C),
  'le flou SVG est débranché sous 960 px');
// ⚠️ Sur C, pas sur s : le commentaire qui EXPLIQUE la règle contient la règle,
//    et suffirait à verdir l'assertion alors que le CSS ne l'applique plus.
A(/interpolate-size:allow-keywords/.test(C), 'l’ouverture des réponses peut aller vers auto');
A(/\.q::details-content\{block-size:0/.test(s), 'la boîte animée des réponses existe');
A(/\.q::details-content\{transition:none\}/.test(s), 'mouvement réduit : l’ouverture des réponses est coupée');
A(/function poseTotal/.test(js), 'le total passe par l’odomètre');
A(!/totEl\.textContent = String\(t\);/.test(js), 'plus aucune écriture directe du total');
A(/\.ligne\.bat \.coche::after\{content:""/.test(s), 'la pulsation des cases existe');
A(/\.ligne \.nom\{display:block/.test(s) && /\.ligne \.hyp\{display:block/.test(s),
  'nom et hypothèse sont deux blocs, pas deux boîtes en ligne collées');
A(/\.ligne\.bat \.coche::after\{display:none\}/.test(s), 'mouvement réduit : l’onde est coupée');
A(/h3\{font-family:var\(--sans\)/.test(s), 'les h3 sont en Outfit, pas en Cormorant');
A(/\.hero-grille path\{animation:none; stroke-dashoffset:0\}/.test(s),
  'mouvement réduit : le cadastre est posé, pas retardé');

// ── 10c. Contrastes : mesurés sur la palette, pas déclarés ──────────
// ⚠️ Un délai n'est pas une durée, et une couleur « qui a l'air lisible » n'est
//    pas une mesure : ces sept ratios sont calculés, pas relus.
const vars = {};
for (const m of s.matchAll(/--([a-z0-9-]+):(#[0-9A-Fa-f]{6})/g)) vars[m[1]] = m[2];
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = h => { const n = parseInt(h.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const ratio = (a, b) => { const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
for (const [t, f] of [['doux', 'craie'], ['tres-doux', 'craie'], ['tres-doux', 'papier'],
                      ['creme-3', 'nuit'], ['creme-3', 'nuit-2'], ['creme-2', 'nuit'],
                      ['or-fonce', 'papier']]) {
  const ok2 = vars[t] && vars[f];
  const r = ok2 ? ratio(vars[t], vars[f]) : 0;
  A(r >= 4.5, `contraste --${t} sur --${f} : ${r.toFixed(2)} (minimum 4,5)`);
}
A(!/#6F6656/.test(C), 'la couleur de copyright à 3,15 a disparu');
A(!/#8C8271/.test(C), 'la couleur de texte secondaire à 3,29 a disparu');
A(!/#A8842E/.test(C), 'la couleur de pastille à 3,35 a disparu');

console.log(`\n${ok} vertes · ${ko} rouges`);
process.exit(ko ? 1 : 0);
