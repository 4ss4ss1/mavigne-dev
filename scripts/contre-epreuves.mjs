// Contre-épreuves : chaque défaut est RÉINTRODUIT ; l'assertion doit rougir.
// Une contre-épreuve verte = une assertion qui ne protège rien.
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { execFileSync } from 'child_process';
const SRC = readFileSync('logiciel-vigne.html', 'utf8');
const TMP = '/tmp/ce.html';
let ok = 0, ko = 0;

function ce(nom, muter) {
  const m = muter(SRC);
  if (m === SRC) { ko++; console.log(`  ✗ ${nom} — LA MUTATION N'A RIEN CHANGÉ (motif faux)`); return; }
  writeFileSync(TMP, m);
  let rouge = false, sortie = '';
  try { execFileSync('node', ['harnais-vitrine.mjs', TMP], { encoding: 'utf8' }); }
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
   s => s.replace('var HORS = { nom: "Retrouver l\u2019info, éviter le déplacement pour rien", min: 10, freq: 220,',
                  'var HORS = { nom: "Retrouver l\u2019info, éviter le déplacement pour rien", min: 3, freq: 220,'));
ce('une image perd son texte de remplacement',
   s => s.replace(/ alt="Écran d&rsquo;accueil[^"]*"/, ''));
ce('une image pointe vers un fichier absent',
   s => s.replace('src="/mv-shot-pilotage.png"', 'src="/mv-shot-inexistant.png"'));
ce('un lien pointe vers une page absente',
   s => s.replace('href="/guide.html"', 'href="/tarifs.html"'));
ce('une balise n’est pas refermée',
   s => s.replace('</aside>\n    </div>', '</aside>\n    '));
ce('un nom de client apparaît',
   s => s.replace('des domaines bourguignons', 'les domaines Chapelle et Marchand-Grillot'));
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

try { unlinkSync(TMP); } catch (e) {}
console.log(`\n${ok} contre-épreuves rouges (bon) · ${ko} restées vertes (défaut du harnais)`);
process.exit(ko ? 1 : 0);
