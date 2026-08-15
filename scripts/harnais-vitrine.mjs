// ════════════════════════════════════════════════════════════════════
// HARNAIS — page vitrine logiciel-vigne.html
// Règle : on exécute la table réellement livrée, on ne la réimplémente pas.
// corps()  : retire commentaires HTML et CSS avant toute assertion de contenu.
// texte()  : décode les entités, sinon un motif rate ce qui est pourtant écrit.
// ════════════════════════════════════════════════════════════════════
import { readFileSync, existsSync } from 'fs';
const F = process.argv[2] || 'logiciel-vigne.html';
const PUB = process.argv[3] || '/home/claude/mavigne-dev/public';
const s = readFileSync(F, 'utf8');
let ok = 0, ko = 0;
const A = (c, l) => { if (c) { ok++; } else { ko++; console.log('  ✗ ' + l); } };

const corps = t => t.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const texte = t => t
  .replace(/&nbsp;/g, ' ').replace(/&rsquo;/g, '\u2019').replace(/&amp;/g, '&')
  .replace(/&#183;/g, '\u00B7').replace(/&rarr;/g, '\u2192')
  .replace(/&copy;/g, '\u00A9').replace(/&euro;/g, '\u20AC');
const C = corps(s);          // structure  (entités intactes)
const T = texte(C);          // contenu    (entités décodées)

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
A(/293 B/.test(T), 'mention TVA art. 293 B');
A(/prix par domaine|Pas par utilisateur/i.test(T), 'le prix par domaine est dit');

// ── 5. Liens internes : chaque cible existe dans public/ ────────────
const liens = [...new Set([...C.matchAll(/href="\/([a-z0-9\-]+\.html)"/g)].map(m => m[1]))];
liens.forEach(l => A(existsSync(PUB + '/' + l), `page liée existante : ${l}`));
A(liens.length >= 6, `au moins six liens internes (${liens.length})`);
A(/href="https:\/\/mavigneapp\.fr\/\?demo=visite"/.test(C), 'lien de démo publique présent');
A(/href="https:\/\/mavigneapp\.fr\/essai\.html"/.test(C), 'lien d’essai présent');

// ── 6. Images : chaque source existe ────────────────────────────────
const imgs = [...new Set([...C.matchAll(/src="\/([a-z0-9\-\.]+\.(?:png|jpg|svg|webp))"/g)].map(m => m[1]))];
imgs.forEach(i => A(existsSync(PUB + '/' + i), `image existante : ${i}`));
A(imgs.length >= 4, `au moins quatre images (${imgs.length})`);

// ── 7. Aucun nom de client, aucune donnée réelle ────────────────────
for (const n of ['Marchand', 'Grillot', 'Chapelle', 'Garraud', 'Dupont', 'domaine-']) {
  A(!new RegExp(n, 'i').test(T), `aucune mention de « ${n} »`);
}
A(/données de démonstration/.test(T), 'la capture du hero est signalée comme démo');

// ── 8. Les appuis réglementaires sont nommés ────────────────────────
A(/2023\/564/.test(T), 'règlement UE 2023/564 cité');
A(/24 décembre 2025/.test(T), 'arrêté du 24 décembre 2025 cité');
A(/1\s*<sup>er<\/sup>\s*janvier 2027|1er janvier 2027/.test(T), 'échéance 2027 citée');
A(/31 janvier de l\u2019année suivante/.test(T), 'échéance de conversion citée');
A(/trente jours/.test(T), 'délai de 30 jours (2030) cité');
A(/n\u2019oblige à acheter aucun logiciel/.test(T), 'la nuance honnête est présente');
A(/surface de la parcelle/.test(T) && /surface traitée/.test(T), 'la colonne qui ne ment pas est expliquée');

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

console.log(`\n${ok} vertes · ${ko} rouges`);
process.exit(ko ? 1 : 0);
