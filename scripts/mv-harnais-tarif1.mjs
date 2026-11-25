#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — TARIF-1 (§608) : LA GRILLE TARIFAIRE DIT LA MÊME CHOSE PARTOUT
   Lancer :          node scripts/mv-harnais-tarif1.mjs
   Contre-épreuves : node scripts/mv-harnais-tarif1.mjs --contre

   Décisions de Nico (24-25/11) : trois formules gardées ; le Planning (heures, annualisation) passe en Vigneron ;
   Domaine garde Cave, Pilotage et Réserve ; une mise en route unique de 250 € pour toutes les formules, une
   demi-journée de formation comprise ; contours sans KML ni Telepac et reprise des anciennes données à 60 €/h sur
   devis ; plus d'offre de lancement ; le téléphone et WhatsApp sur la page ; un modèle Excel gratuit du registre 2027.

   ★ La formule est écrite à SEPT endroits tenus à la main. La source est l'appli : _planModule (firebase.js), JOUÉE ici
     pour chaque formule. Tout le reste lui est comparé :
   ① le socle de la console (_FC_PLANDEF, admin-gt.js), la page d'essai (FORMULES, essai.html), les cartes de
      logiciel-vigne, le guide (03-formules), llms.txt et les trois pages « cas d'usage » ;
   ② la mise en route : 250 € dans la console (_AGT_INST) et partout sur le site (cartes, FAQ, JSON-LD, llms, kit des
      annuaires) ; plus aucun 490 / 690 / 990 ni volant de 10 à 20 h ; la demi-journée de formation dite ;
   ③ l'offre de lancement retirée de la console (ni libellé, ni −50 % calculé d'office) ;
   ④ le téléphone et WhatsApp sous les deux boutons de la fin et dans l'intro des objections ;
   ⑤ le modèle Excel : le fichier du dépôt est celui que donnent les colonnes de src/registre.js (rejoué octet pour
      octet), son en-tête EST la liste de l'export, ses liens sont là ; les deux pages le proposent sans formulaire ;
      les colonnes affichées sur logiciel-vigne suivent l'annexe II (deux horaires, plus de « Substance active »).
   ⚠️ Il ne regarde pas l'écran : le rendu des pages et du classeur se regarde (§608).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { fabriquer, lireZip, SORTIE } from './mv-registre-modele.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = {
  fb: lire('src/firebase.js'), gt: lire('src/admin-gt.js'), console: lire('src/gt/console.html'), reg: lire('src/registre.js'),
  page: lire('public/logiciel-vigne.html'), essai: lire('public/essai.html'), llms: lire('public/llms.txt'),
  temps: lire('public/suivi-temps-travail-vigne.html'), equipe: lire('public/gestion-equipe-viticole.html'),
  registre: lire('public/registre-phytosanitaire-2027.html'), guide: lire('guide/03-formules.html'), kit: lire('docs/geo-kit.md'),
  xlsx: fs.readFileSync(path.join(RACINE, SORTIE)),
};
const PLANS = ['essentiel', 'vigneron', 'domaine'];
const MODS = ['tracteur', 'phyto', 'planning', 'pilotage', 'cave', 'reserve'];
const sansCom = (s) => s.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
const texte = (h) => h.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
function corpsFn(src, debut) {   /* un corps de fonction, par comptage d'accolades */
  const i = src.indexOf(debut); if (i < 0) return '';
  let d = 0, j = src.indexOf('{', i);
  for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) break; }
  return src.slice(i, j + 1);
}
function objetVar(src, nom) {
  const m = new RegExp('^var ' + nom + '\\s*=\\s*\\{', 'm').exec(src); if (!m) return null;
  const txt = corpsFn(src.slice(m.index), 'var ' + nom).replace(/^var [^=]+=\s*/, '');
  try { return Function('"use strict";return (' + txt + ');')(); } catch (e) { return null; }
}
/* _planModule, JOUÉE : ce que chaque formule ouvre vraiment dans l'appli. */
function socleAppli(fb) {
  const f = corpsFn(fb, 'window._planModule = function');
  if (!f) return null;
  const out = {};
  for (const plan of PLANS) {
    const ctx = { window: { _plan: () => plan, CONFIG: { features: {} } } };
    vm.createContext(ctx);
    try { vm.runInContext(f + ';', ctx); } catch (e) { return null; }
    out[plan] = MODS.filter((m) => ctx.window._planModule(m));
  }
  return out;
}
const cartesDe = (html) => [...html.matchAll(/<article class="formule[^"]*"[^>]*>[\s\S]*?<\/article>/g)].map((m) => ({
  nom: texte((m[0].match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || ''), lis: [...m[0].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => texte(x[1])), mer: texte((m[0].match(/<p class="mer">([\s\S]*?)<\/p>/) || [])[1] || ''),
}));

function suite(S) {
  const out = []; const T = (n, c, d = '') => out.push([n, !!c, d]);

  /* ① la formule, partout comme dans l'appli */
  const app = socleAppli(S.fb);
  T('① _planModule se joue pour les trois formules', !!app, '');
  T('① l’appli : Essentiel = socle ; Vigneron = + tracteur, phyto, planning ; Domaine = + pilotage, cave, réserve',
    !!app && app.essentiel.join() === '' && app.vigneron.join() === 'tracteur,phyto,planning' && app.domaine.join() === MODS.join(), app ? JSON.stringify(app) : '');
  const plandef = objetVar(S.gt, '_FC_PLANDEF');
  T('① la console (_FC_PLANDEF) ouvre les mêmes modules que l’appli, formule par formule',
    !!app && !!plandef && PLANS.every((p) => MODS.filter((m) => plandef[p] && plandef[p][m === 'phyto' ? 'tracteur' : m]).join() === app[p].join()), plandef ? JSON.stringify(plandef.vigneron) : 'illisible');   // Phyto suit Tracteur, dans la console comme dans l'appli
  T('① les libellés de formule de la console : Planning avec Vigneron, plus avec Domaine',
    /opt\('vigneron','Vigneron — \+ Tracteur · Phyto · Planning'\)\+opt\('domaine','Domaine — \+ Pilotage · Cave · Réserve'\)/.test(S.gt)
    && /<option value="vigneron">Vigneron — 49 €\/mois \(\+ Tracteur, Phyto, Planning\)<\/option>/.test(S.console));
  let F = null; try { F = Function('"use strict";return (' + (S.essai.match(/const FORMULES = (\{[\s\S]*?\n  \});/) || [])[1] + ');')(); } catch (e) { F = null; }
  const ESSAI_MOD = { tracteur: 'tracteur', phyto: 'phyto', planning: 'planning', pilotage: 'pilotage', cave: 'cave' };   // la Réserve n'a pas de case
  T('① essai.html coche, pour chaque formule, les modules que l’appli ouvre',
    !!app && !!F && PLANS.every((p) => Object.keys(ESSAI_MOD).filter((m) => F[p].mods.includes(ESSAI_MOD[m])).join() === app[p].filter((m) => m !== 'reserve').join()));
  const LIB = { tracteur: 'Matériel et carburant', phyto: 'Traitements et registre phyto 2027', planning: 'Planning, heures et annualisation', pilotage: 'Pilotage et coûts par parcelle', cave: 'Cuvier et Chai', reserve: 'La Réserve' };
  const C = cartesDe(S.page.slice(S.page.indexOf('<div class="formules" id="formules">')));
  T('① logiciel-vigne : chaque module apparaît sur la carte de la première formule qui l’ouvre, et une seule fois',
    !!app && C.length >= 3 && MODS.every((m) => {
      const ou = C.slice(0, 3).map((c) => c.lis.includes(LIB[m]));
      const prem = PLANS.findIndex((p) => app[p].includes(m));
      return ou.filter(Boolean).length === 1 && ou[prem];
    }), C.map((c) => c.nom + ':' + c.lis.join('|')).join(' / '));
  for (const [cle, nom] of [['temps', 'suivi-temps-travail'], ['equipe', 'gestion-equipe'], ['registre', 'registre-2027']]) {
    const k = cartesDe(S[cle]); const v = k.find((c) => c.nom === 'Vigneron'), d = k.find((c) => c.nom === 'Domaine');
    T(`① ${nom} : le planning est sur la carte Vigneron, plus sur celle de Domaine`,
      !!v && !!d && v.lis.some((l) => /^Planning, heures et annualisation$/.test(l)) && !d.lis.some((l) => /^Planning/.test(l)));
  }
  T('① suivi-temps-travail : les heures, les heures sup, l’annualisation et le relevé disent « Vigneron et Domaine »',
    (S.temps.match(/<span class="etiq">Vigneron et Domaine<\/span><\/td><\/tr>/g) || []).length === 5
    && !/Le temps de travail est dans la formule Domaine/.test(S.temps) && /Les heures de l’équipe sont dans la formule Vigneron \(49 € par mois/.test(S.temps), (S.temps.match(/<span class="etiq">Vigneron et Domaine<\/span><\/td><\/tr>/g) || []).length);
  const gv = (S.guide.match(/<tr><td><b>Vigneron<\/b><\/td><td>([\s\S]*?)<\/td><\/tr>/) || [])[1] || '';
  const gd = (S.guide.match(/<tr><td><b>Domaine<\/b><\/td><td>([\s\S]*?)<\/td><\/tr>/) || [])[1] || '';
  T('① le guide (03-formules) : Planning RH avec Vigneron, plus avec Domaine', /Planning RH/.test(gv) && !/Planning/.test(gd) && /Pilotage/.test(gd));
  const lv = (S.llms.match(/^\| Vigneron \|.*$/m) || [''])[0], ld = (S.llms.match(/^\| Domaine \|.*$/m) || [''])[0];
  T('① llms.txt : le planning sur la ligne Vigneron, plus sur celle de Domaine', /planning, heures et annualisation/.test(lv) && !/planning/i.test(ld));
  T('① le kit des annuaires : Vigneron « en plus : planning », en français et en anglais ; plus de planning en Domaine',
    (S.kit.match(/Vigneron \(en plus : planning/g) || []).length === 2 && /Vigneron \(adds planning and hours/.test(S.kit) && /\| Vigneron \| 49 € par mois et par domaine, jusqu'à 10 utilisateurs \| en plus : planning et heures/.test(S.kit)
    && !/Domaine \(en plus : planning|Domaine \(adds planning|utilisateurs illimités \| en plus : planning/.test(S.kit));

  /* ② la mise en route : 250 €, une demi-journée de formation */
  const inst = objetVar(S.gt, '_AGT_INST');
  T('② la console facture 250 € de mise en route, quelle que soit la formule', !!inst && PLANS.every((p) => inst[p] === 250), JSON.stringify(inst));
  T('② la ligne d’installation dit la demi-journée de formation (plus « X h incluses »)',
    /var _AGT_INST_INCLUS = 'demi-journ\\u00e9e de formation incluse';/.test(S.gt) && /lib='Mise en route '\+\(_AGT_PLANL\[plan\]\|\|plan\)\+' \\u2014 '\+_AGT_INST_INCLUS;/.test(S.gt) && !/_AGT_INSTH/.test(sansCom(S.gt)));
  const PUBLIC = { page: S.page, essai: S.essai, llms: S.llms, temps: S.temps, equipe: S.equipe, registre: S.registre, guide: S.guide, kit: S.kit };
  const vieux = Object.entries(PUBLIC).filter(([, t]) => /\b(490|690|990)\b|10, 15 ou 20|10 à 20|(?:10|15|20)(?:&nbsp;| )?h d[’']accompagnement|heures d[’']accompagnement/.test(t)).map(([k]) => k);
  T('② plus aucun 490 / 690 / 990, ni volant de 10 à 20 h, sur le site, dans llms.txt, le guide et le kit des annuaires', vieux.length === 0, vieux.join(','));
  let J = null; try { J = JSON.parse((S.page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1]); } catch (e) { J = null; }
  const offres = J ? ((J['@graph'] || []).find((g) => g['@type'] === 'SoftwareApplication') || {}).offers || [] : [];
  const addOns = offres.filter((o) => o.addOn).map((o) => o.addOn);
  T('② JSON-LD : trois forfaits de mise en route à 250 €, la demi-journée dite',
    addOns.length === 3 && addOns.every((a) => a.price === '250' && a.priceSpecification.price === '250' && /demi-journée de formation/.test(a.description)));
  T('② logiciel-vigne : chaque carte, le bandeau, « Une seule fois », la FAQ et l’étape 3 disent 250 €',
    C.slice(0, 3).every((c) => c.mer === 'Mise en route 250 € une seule fois · demi-journée de formation comprise')
    && /\(\+&nbsp;250&nbsp;€ de mise en route unique\)/.test(S.page) && /<b>Une seule fois<\/b><p>250&nbsp;€ de mise en route, quelle que soit la formule/.test(S.page)
    && /<p>250&nbsp;€, payés une seule fois au démarrage, quelle que soit la formule\./.test(S.page) && /Le forfait unique de 250&nbsp;€ couvre/.test(S.page)
    && /mise en route unique de 250 €\. Démo libre/.test(S.page));
  T('② ce qui est hors forfait est dit, avec son prix et le devis : contours sans KML ni Telepac, anciennes données',
    /les contours à créer sans KML ni Telepac, et la reprise de vos anciennes données\. Je vous fais un devis avant/.test(S.page)
    && /on crée les contours ensemble, à 60&nbsp;€ de l’heure, hors forfait/.test(S.page) && !/c’est compris dans le forfait de mise en route/.test(S.page)
    && /les contours à créer sans KML ni Telepac, et la reprise des anciennes données\./.test(S.llms));
  for (const [cle, nom] of [['temps', 'suivi-temps-travail'], ['equipe', 'gestion-equipe'], ['registre', 'registre-2027']]) {
    const k = cartesDe(S[cle]);
    T(`② ${nom} : 250 € et la demi-journée sur chaque carte et dans la note`, k.length === 2 && k.every((c) => c.mer === 'Mise en route 250 € une seule fois · demi-journée de formation comprise') && /La mise en route \(250&nbsp;€, une seule fois\)/.test(S[cle]));
  }
  T('② llms.txt : 250 € sur chaque formule, la demi-journée', (S.llms.match(/\| 250 €, demi-journée de formation comprise \|/g) || []).length === 3 && /La mise en route coûte 250 €, une seule fois, quelle que soit la formule/.test(S.llms));

  /* ③ l'offre de lancement retirée de la console */
  const gtCode = sansCom(S.gt);
  T('③ plus d’« Offre de lancement » dans la console, ni de −50 % calculé d’office',
    !/Offre de lancement/.test(gtCode) && !/\/2\*100\)\/100/.test(gtCode) && !/-Math\.round\(_AGT_INST\[plan\]\/2\)/.test(gtCode)
    && /else if\(ty==='geste'\)\{  mnt=''; lib='Geste commercial'; \}/.test(S.gt) && /if\(mt\) mt\.value='';/.test(S.gt));
  T('③ un geste sans montant est refusé à l’enregistrement (le contrôle d’origine tient toujours)', /if\(isNaN\(m\)\|\|m===0\)\{ showToast\('Montant manquant'/.test(S.gt));

  /* ④ le contact direct */
  const suiteH = S.page.slice(S.page.indexOf('<section class="suite" id="suite">'));
  const vive = '<p class="direct">Vous préférez en parler de vive voix&nbsp;? Appelez-moi directement au <a href="tel:+33699424859">06&nbsp;99&nbsp;42&nbsp;48&nbsp;59</a> ou écrivez sur <a href="https://wa.me/33699424859" target="_blank" rel="noopener">WhatsApp</a>.</p>';
  T('④ sous « Demander un essai » et « Voir la démo » : la ligne de vive voix, téléphone et WhatsApp',
    new RegExp('Voir la démo</a></div>\\s*' + vive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(suiteH));
  const intro = (S.page.match(/<section class="section" id="objections">[\s\S]*?<\/div>/) || [''])[0];
  T('④ l’intro des objections : l’adresse, le téléphone et WhatsApp', /mailto:contact@mavigneapp\.fr/.test(intro) && /href="tel:\+33699424859"/.test(intro) && /href="https:\/\/wa\.me\/33699424859"/.test(intro));
  T('④ les trois pages « cas d’usage » donnent aussi le téléphone et WhatsApp', ['temps', 'equipe', 'registre'].every((k) => /appelez-moi au <a href="tel:\+33699424859">/.test(S[k]) && /wa\.me\/33699424859/.test(S[k])));

  /* ⑤ le modèle Excel */
  let M = null; try { M = fabriquer(S.reg); } catch (e) { M = { erreur: e.message }; }
  T('⑤ le modèle se fabrique depuis src/registre.js (chaque colonne de l’export a sa consigne)', !!M && !M.erreur, M && M.erreur);
  T('⑤ le fichier du dépôt est celui que donnent les colonnes d’aujourd’hui, octet pour octet', !!M && !M.erreur && Buffer.compare(M.buf, S.xlsx) === 0);
  let Z = null; try { Z = lireZip(S.xlsx); } catch (e) { Z = null; }
  const ent = Z ? [...(Z['xl/worksheets/sheet1.xml'] || '').matchAll(/<c r="[A-Z]+1"[^>]*><is><t[^>]*>([\s\S]*?)<\/t><\/is><\/c>/g)].map((m) => m[1].replace(/&amp;/g, '&')) : [];
  let cols = []; try { cols = Function('"use strict";return (' + /var MV_PHY_CSV_COLS = (\[[\s\S]*?\]);/.exec(S.reg)[1] + ');')(); } catch (e) { cols = []; }
  T('⑤ l’en-tête de l’onglet « Registre 2027 » EST la liste de l’export de l’appli', cols.length > 18 && ent.join('|') === cols.join('|'), ent.length + ' / ' + cols.length);
  T('⑤ deux onglets : « Registre 2027 » et « Mode d’emploi & Ma Vigne »', !!Z && /<sheet name="Registre 2027" sheetId="1"/.test(Z['xl/workbook.xml']) && /<sheet name="Mode d'emploi &amp; Ma Vigne" sheetId="2"/.test(Z['xl/workbook.xml']));
  const rels = Z ? Z['xl/worksheets/_rels/sheet2.xml.rels'] || '' : '';
  T('⑤ l’encadré Ma Vigne porte ses liens : la page, la démo, le téléphone', ['https://mavigneapp.fr/logiciel-vigne.html', 'https://mavigneapp.fr/demo.html', 'tel:+33699424859'].every((u) => rels.includes('Target="' + u + '"')) && /Ou appelez Nicolas Guéret au 06 99 42 48 59/.test(Z ? Z['xl/worksheets/sheet2.xml'] : ''));
  T('⑤ la conduite biologique n’accepte que oui ou non (comme l’export)', !!Z && /<formula1>"oui,non"<\/formula1>/.test(Z['xl/worksheets/sheet1.xml']) && /var bio = \(bioDom \|\| t\.modeAb\) \? 'oui' : 'non';/.test(S.reg));
  const bouton = '<a class="bt bt-trait" href="/downloads/registre-phyto-2027-mavigneapp.xlsx" download>';
  const micro = '<p class="note">Les colonnes de l’annexe II de l’arrêté du 24 décembre 2025 · Gratuit, sans inscription.</p>';
  T('⑤ logiciel-vigne : le bouton juste après « Ce que je ne vous dirai pas », sans formulaire, avec son micro-texte',
    new RegExp('un tableur correctement structuré peut suffire[^<]*</p></div>\\s*<div class="modele"[^>]*>' + bouton.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]{0,260}Télécharger le modèle Excel vierge 2027 \\(\\.xlsx\\)</a>' + micro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(S.page));
  T('⑤ registre-phytosanitaire-2027 : le même bouton, la même phrase', S.registre.includes(bouton) && S.registre.includes(micro) && /Le modèle vierge proposé sur cette page en reprend les colonnes/.test(S.registre));
  const chips = [...((S.page.match(/<div class="colonnes">([\s\S]*?)<\/div>/) || [])[1] || '').matchAll(/<span style="--i:\d+">([\s\S]*?)<\/span>/g)].map((m) => m[1]);
  T('⑤ les colonnes affichées suivent l’annexe II : deux horaires, la cible et le mode, plus de « Substance active » ni d’« Applicateur »',
    chips.join('|') === 'SIRET détenteur|SIRET bénéficiaire|Produit|N° AMM|Date|Heure de début|Heure de fin|Délai de rentrée anticipée|Dose et unité|Cible|Mode d’application|Coordonnées GPS|Surface traitée (ha)|Culture (code OEPP)|Stade BBCH|Conduite biologique'
    && chips.every((c, i) => /--i:/.test(S.page)) && cols.indexOf('Conduite biologique') === 17, chips.join('|'));
  T('⑤ llms.txt donne l’adresse du modèle', /https:\/\/mavigneapp\.fr\/downloads\/registre-phyto-2027-mavigneapp\.xlsx/.test(S.llms));
  return out;
}

const sur = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('mutant sans prise : ' + String(a).slice(0, 70)); return { ...S, [cle]: S[cle].replace(a, b) }; };
const MUTANTS = [
  ['le Planning revient en Domaine dans l’appli', sur('fb', "return oL !== null ? oL : (pr >= 2);", "return oL !== null ? oL : (pr >= 3);")],
  ['la console oublie le Planning de Vigneron', sur('gt', "vigneron:  { tracteur:true,  planning:true,", "vigneron:  { tracteur:true,  planning:false,")],
  ['essai.html ne coche plus le planning pour Vigneron', sur('essai', "mods: ['travaux', 'meteo', 'tracteur', 'phyto', 'planning'] }", "mods: ['travaux', 'meteo', 'tracteur', 'phyto'] }")],
  ['la carte Domaine relit le planning', sur('page', '<ul><li>Tout Vigneron</li><li>Cuvier et Chai</li>', '<ul><li>Tout Vigneron</li><li>Planning, heures et annualisation</li><li>Cuvier et Chai</li>')],
  ['le guide remet le Planning en Domaine', sur('guide', '{ic:eprouvette} Phyto <b>+</b> {ic:calendrier} Planning RH</td>', '{ic:eprouvette} Phyto</td>')],
  ['llms.txt remet le planning en Domaine', sur('llms', '| Tout Vigneron + Cuvier et Chai', '| Tout Vigneron + planning, Cuvier et Chai')],
  ['la page équipe garde le planning sur Domaine', sur('equipe', '<ul><li>Tout Vigneron&nbsp;: planning, tracteur, traitements</li>', '<ul><li>Planning, heures et annualisation</li>')],
  ['une étiquette « Domaine » revient sur l’annualisation', sur('temps', 'ont leurs heures et leurs jours. <span class="etiq">Vigneron et Domaine</span>', 'ont leurs heures et leurs jours. <span class="etiq dom">Domaine</span>')],
  ['la console facture encore 990 €', sur('gt', 'domaine:250 };  // mise en route', 'domaine:990 };  // mise en route')],
  ['le libellé « h incluses » revient', sur('gt', "+' \\u2014 '+_AGT_INST_INCLUS; }", "+' \\u2014 20 h incluses'; }")],
  ['un 690 € oublié sur une carte', sur('registre', '<p class="mer">Mise en route <b>250&nbsp;€</b>', '<p class="mer">Mise en route <b>690&nbsp;€</b>')],
  ['le kit des annuaires garde 490 / 690 / 990', sur('kit', 'one-time onboarding €250', 'one-time onboarding €490 / €690 / €990')],
  ['le JSON-LD garde un forfait à 990', sur('page', '"name": "Forfait de mise en route — Domaine",\n            "price": "250",', '"name": "Forfait de mise en route — Domaine",\n            "price": "990",')],
  ['les contours redeviennent compris dans le forfait', sur('page', 'on crée les contours ensemble, à 60&nbsp;€ de l’heure, hors forfait', 'on les crée ensemble pendant l’installation, c’est compris dans le forfait de mise en route')],
  ['l’offre de lancement revient', sur('gt', "mnt=''; lib='Geste commercial'; }", "mnt=-Math.round(_AGT_INST[plan]/2); lib='Offre de lancement'; }")],
  ['la ligne de vive voix disparaît', sur('page', '<p class="direct">', '<p class="direct-x">')],
  ['WhatsApp oublié dans les objections', sur('page', 'appelez-moi au <a href="tel:+33699424859">06&nbsp;99&nbsp;42&nbsp;48&nbsp;59</a> ou écrivez sur <a href="https://wa.me/33699424859" target="_blank" rel="noopener">WhatsApp</a>&nbsp;: je réponds moi-même.</p></div>', 'appelez-moi au <a href="tel:+33699424859">06&nbsp;99&nbsp;42&nbsp;48&nbsp;59</a>&nbsp;: je réponds moi-même.</p></div>')],
  ['une colonne ajoutée à l’export sans regénérer le modèle', sur('reg', "'Rentr\\u00e9e anticip\\u00e9e \\u2014 mesures de protection'];", "'Rentr\\u00e9e anticip\\u00e9e \\u2014 mesures de protection','Observations'];")],
  ['une colonne de l’export sans consigne', sur('reg', "'Applicateur',", "'Applicateur','Météo du jour',")],
  ['le fichier Excel du dépôt abîmé', (S) => { const b = Buffer.from(S.xlsx); b[b.length - 40] ^= 1; return { ...S, xlsx: b }; }],
  ['le bouton passe derrière un formulaire', sur('page', 'href="/downloads/registre-phyto-2027-mavigneapp.xlsx" download>', 'href="/essai.html?modele=1">')],
  ['« Substance active » revient dans les colonnes affichées', sur('page', '<span style="--i:15">Conduite biologique</span>', '<span style="--i:15">Conduite biologique</span><span style="--i:16">Substance active</span>')],
];

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  for (const [n, ok, d] of r) { console.log((ok ? '  ✓ ' : '  ✗ ') + n + (ok || !d ? '' : '  → ' + d)); if (!ok) ko++; }
  console.log(ko ? `✗ tarif1 : ${ko} rouge(s) sur ${r.length}` : `✓ tarif1 : ${r.length} vertes`);
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some(([, ok]) => !ok)) { console.log('✗ la suite doit être verte avant les contre-épreuves'); process.exit(1); }
  let ko = 0;
  for (const [nom, f] of MUTANTS) {
    let rouge;
    try { rouge = suite(f(S0)).find(([, ok]) => !ok); } catch (e) { console.log('  ✗ ' + nom + ' : ' + e.message); ko++; continue; }
    if (rouge) console.log('  ✓ ' + nom + ' → rougit (' + rouge[0] + ')'); else { console.log('  ✗ ' + nom + ' → reste vert'); ko++; }
  }
  console.log(ko ? `✗ contre-épreuve tarif1 : ${ko} mutant(s) non vus` : `✓ contre-épreuve tarif1 : ${MUTANTS.length}/${MUTANTS.length}`);
  process.exit(ko ? 1 : 0);
}
