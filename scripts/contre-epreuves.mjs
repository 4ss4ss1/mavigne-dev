// Contre-épreuves : chaque défaut est RÉINTRODUIT ; l'assertion doit rougir.
// Une contre-épreuve verte = une assertion qui ne protège rien.
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
// ⚠️ « /tmp/ce.html » n'existe pas sous Windows : le bac a sable est Linux,
//    la machine de Nico ne l'est pas. tmpdir() rend le bon dossier des deux cotes.
const ICI = dirname(fileURLToPath(import.meta.url));   // scripts/
const HARNAIS = join(ICI, 'harnais-vitrine.mjs');
const PUB = join(ICI, '..', 'public');
const SRC = readFileSync(join(PUB, 'logiciel-vigne.html'), 'utf8');
const TMP = join(tmpdir(), 'mv-contre-epreuve.html');
let ok = 0, ko = 0;

function ce(nom, muter) {
  const m = muter(SRC);
  if (m === SRC) { ko++; console.log(`  ✗ ${nom} — LA MUTATION N'A RIEN CHANGÉ (motif faux)`); return; }
  writeFileSync(TMP, m);
  let rouge = false, sortie = '';
  try { execFileSync('node', [HARNAIS, TMP, PUB], { encoding: 'utf8' }); }
  catch (e) { rouge = true; sortie = String(e.stdout || '').trim().split('\n')[0]; }
  if (rouge) { ok++; console.log(`  ✓ ${nom} → rougit${sortie ? '  [' + sortie.replace(/^\s*✗\s*/, '') + ']' : ''}`); }
  else { ko++; console.log(`  ✗ ${nom} → RESTE VERT`); }
}

ce('le total de la table est faussé',
   s => s.replace('{ nom: "Registre phyto", min: 20, freq: 16,', '{ nom: "Registre phyto", min: 45, freq: 16,'));
ce('un montant se glisse dans le compte',
   s => s.replace('<span class="nom">\' + c.nom + \'</span>', '<span class="nom">\' + c.nom + \' — 79 €</span>'));
ce('le total affiché décroche de la table',
   s => s.replace('<span id="tot">127</span>', '<span id="tot">200</span>'));
ce('deux lignes portent le même nom',
   s => s.replace('nom: "La Réserve — stock & bilan matière"', 'nom: "Registre phyto"'));
ce('une ligne perd son hypothèse',
   s => s.replace(/hyp: "Un passage sur deux[^"]*"/, 'hyp: ""'));
ce('la ligne hors total est ramenée dans le barème',
   s => s.replace('var HORS = { nom: "Retrouver l’info, éviter le déplacement pour rien", min: 10, freq: 220,',
                  'var HORS = { nom: "Retrouver l’info, éviter le déplacement pour rien", min: 3, freq: 220,'));
ce('une image perd son texte de remplacement',
   s => s.replace(/ alt="Écran d&rsquo;accueil[^"]*"/, ''));
ce('une image pointe vers un fichier absent',
   s => s.replace('src="/mv-shot-pilotage.png"', 'src="/mv-shot-inexistant.png"'));
ce('un lien pointe vers une page absente',
   s => s.replace('href="/guide.html"', 'href="/tarifs.html"'));
ce('une balise n’est pas refermée',
   s => s.replace('</aside>\n    </div>', '</aside>\n    '));
ce('un nom de client apparaît',
   /* ⚠ Le jeton injecte doit figurer dans le denylist de harnais-vitrine.mjs.
   On utilise 'domaine-' — present dans la liste et qui n'est le nom de
   personne : la contre-epreuve prouve le mecanisme sans nommer un client. */
   s => s.replace('des domaines bourguignons', 'les domaines domaine-untel et domaine-autre'));
ce('l’ancien chiffre contradictoire revient',
   s => s.replace('Cent vingt-sept heures par an.', '3 à 5 heures de bureau par mois.'));
ce('la nuance honnête sur 2027 disparaît',
   s => s.replace(/Le texte n&rsquo;oblige à acheter aucun logiciel[^<]*/, 'Sans logiciel, vous serez hors la loi. '));
ce('la référence réglementaire disparaît',
   s => s.replace('règlement européen 2023/564', 'la nouvelle réglementation'));
ce('la colonne « surface » n’est plus expliquée',
   s => s.replace(/<b>Et une colonne qui ne ment pas<\/b>[\s\S]*?<\/div>/, '</div>'));
ce('le mouvement réduit n’est plus respecté',
   s => s.replace('@media (prefers-reduced-motion: reduce){', '@media (min-width: 99999px){'));
ce('le pied de page repasse dans <main>',
   s => s.replace('</main>\n\n<!-- ═══════════════ PIED', '<!-- ═══════════════ PIED').replace('</footer>', '</footer>\n</main>'));
ce('un lien non chiffré apparaît',
   s => s.replace('href="mailto:ngdevpro@gmail.com"', 'href="http://mavigneapp.fr/contact"'));
ce('les cases perdent leur état accessible',
   s => s.replace('role="checkbox" aria-checked="true"', ''));
ce('un prix change de valeur',
   s => s.replace('<b>49&nbsp;€</b>', '<b>59&nbsp;€</b>'));
ce('la durée de démo décroche de l’application',
   s => s.replace(/quatre minutes/g, 'dix minutes').replace(/4&nbsp;minutes/g, '10&nbsp;minutes'));

// ── Lot du 21/08 : chiffrage du forfait, contrastes, micro-interactions ──
ce('le forfait de mise en route redevient flou',
   s => s.replace('<b>690&nbsp;€</b>', '<b>sur devis</b>'));
ce('le tarif horaire au-delà du volant disparaît',
   s => s.replace(/60(&nbsp;| )€/g, 'un tarif horaire'));
ce('la page cesse de dire qu’il n’y a pas d’autre frais',
   s => s.replace(/ni frais de dossier/g, 'des frais annexes'));
ce('un accent manque dans une méta',
   s => s.replace('registre phyto prêt pour 2027', 'registre phyto pret pour 2027'));
ce('les abonnements perdent leur mensualité déclarée',
   s => s.replace(/"unitText": "MONTH"/g, '"unitText": "YEAR"'));
ce('le forfait n’est plus déclaré payé une seule fois',
   s => s.replace(/"unitText": "ONE-TIME"/g, '"unitText": "MONTH"'));
ce('l’essai n’est plus déclaré gratuit',
   s => s.replace('"price": "0",', '"price": "39",'));
ce('le JSON-LD annonce un forfait que la page ne pratique pas',
   s => s.replace('"price": "990"', '"price": "1490"'));
ce('le JSON-LD repasse en échappements illisibles',
   s => s.replace('"name": "Essai de 15 jours"', '"name": "Essai de 15 jours\\u00a0"'));
ce('les données structurées deviennent invalides',
   s => s.replace('"applicationCategory": "BusinessApplication",', '"applicationCategory": "BusinessApplication"'));
ce('un tracé du hero perd sa normalisation',
   s => s.replace('<path pathLength="1" d="M905 92', '<path d="M905 92'));
ce('le cadastre ne se dessine plus',
   s => s.replace('@keyframes tracer{to{stroke-dashoffset:0}}', '@keyframes tracer{to{opacity:1}}'));
ce('l’ouverture fluide des réponses est débranchée',
   s => s.replace(/interpolate-size:allow-keywords/g, 'interpolate-size:numeric-only'));
ce('la boîte animée des réponses disparaît',
   s => s.replace('.q::details-content{block-size:0', '.q::zzz-content{block-size:0'));
ce('mouvement réduit : l’ouverture des réponses n’est plus coupée',
   s => s.replace('.q::details-content{transition:none}', ''));
ce('le total repasse en écriture directe',
   s => s.replace('poseTotal(t);', 'totEl.textContent = String(t);'));
ce('la pulsation des cases disparaît',
   s => s.replace('.ligne.bat .coche::after{content:""', '.ligne.zzz .coche::after{content:""'));
ce('mouvement réduit : l’onde n’est plus coupée',
   s => s.replace('.ligne.bat .coche::after{display:none}', ''));
ce('l’hypothèse se recolle à la fin du nom',
   s => s.replace('.ligne .nom{display:block; ', '.ligne .nom{'));

// ── Lot du 21/08 (soir) : le rideau ──────────────────────────────────────
ce('le rideau s’allonge sans qu’on l’ait décidé',
   s => s.replace('--r:.95s;', '--r:1.9s;'));
ce('le texte cesse d’attendre le tracé',
   s => s.replace('animation:lever var(--rTexteD) var(--e) var(--rTexte) forwards}',
                  'animation:lever var(--rTexteD) var(--e) forwards}'));
ce('la barre haute reçoit un transform alors qu’elle est fixed',
   s => s.replace('.barre{opacity:0; animation:paraitre',
                  '.barre{opacity:0; transform:translateY(-8px); animation:paraitre'));
ce('le rideau n’est plus coupé sous 960 px',
   s => s.replace('  .lever > *{animation:lever .8s var(--e) forwards}',
                  '  .lever > *{animation-name:lever}'));
ce('mouvement réduit : le texte reste retardé',
   s => s.replace('.lever > *,.hero-vue{opacity:1; transform:none; animation:none}',
                  '.lever > *,.hero-vue{opacity:1; transform:none}'));
ce('un tracé du hero perd sa normalisation (groupe des points)',
   s => s.replace('<g class="pointeurs" fill="none" stroke="#F3DFA2" stroke-width="3" stroke-linecap="round">\n      <path pathLength="1" d="M1090 78 L1118 400"/>',
                  '<g class="pointeurs" fill="none" stroke="#F3DFA2" stroke-width="3" stroke-linecap="round">\n      <path d="M1090 78 L1118 400"/>'));
ce('les points redescendent les rangs',
   s => s.replace('0%  {stroke-dashoffset:.988; opacity:0}', '0%  {stroke-dashoffset:0; opacity:0}'));
ce('le liseré ne fait plus qu’un tour',
   s => s.replace('animation:lisere 7s linear var(--rVies) infinite', 'animation:lisere 7s linear var(--rVies) forwards'));
ce('le liseré repasse en boucle continue (14 img/s de moins)',
   s => s.replace('  48% {stroke-dashoffset:0; opacity:0}\n  100%{stroke-dashoffset:0; opacity:0}\n}',
                  '  100%{stroke-dashoffset:0}\n}'));
ce('la pastille cesse de respirer',
   s => s.replace('animation:respire 3.4s', 'animation:zzz 3.4s'));
ce('la présence du cadastre retombe à ce qu’elle était',
   s => s.replace('--wCad:1.2;  --oCad:.78;', '--wCad:1;  --oCad:.55;'));
ce('l’encre fraîche disparaît',
   s => s.replace('@keyframes encre{', '@keyframes zzz-encre{'));
ce('le flou SVG reste branché sur téléphone',
   s => s.replace('  .hero-grille .tete,.hero-grille .tete-r{display:none}\n}', '}'));
ce('un h3 repasse en Cormorant',
   s => s.replace('h3{font-family:var(--sans)', 'h3{font-family:var(--serif)'));
ce('le cadastre reste caché en mouvement réduit',
   s => s.replace('.hero-grille path{animation:none; stroke-dashoffset:0}', '.hero-grille path{stroke-dashoffset:1}'));
ce('la couleur de copyright sous 4,5 revient dans le pied',
   s => s.replace('font-size:12px; color:var(--creme-3)}', 'font-size:12px; color:#6F6656}'));
ce('le texte secondaire repasse sous le seuil de contraste',
   s => s.replace('--tres-doux:#6F6857;', '--tres-doux:#8C8271;'));
ce('la pastille du verdict repasse sous le seuil de contraste',
   s => s.replace('--or-fonce:#82631A;', '--or-fonce:#A8842E;'));

try { unlinkSync(TMP); } catch (e) {}
console.log(`\n${ok} contre-épreuves rouges (bon) · ${ko} restées vertes (défaut du harnais)`);
process.exit(ko ? 1 : 0);
