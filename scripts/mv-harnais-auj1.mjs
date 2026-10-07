// HARNAIS — AUJ-1 (§260) : le cockpit d'Aujourd'hui, vue Terrain (src/cockpit.js).
//   node scripts/mv-harnais-auj1.mjs           → doit être vert
//   node scripts/mv-harnais-auj1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute le VRAI src/cockpit.js dans un monde minimal (le kit graphique simulé), et lit sur le texte
// des sources le branchement (pilotage.js, app.js), le style, l'aide, le guide et la nouveauté.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { ck: L('src/cockpit.js'), pil: L('src/pilotage.js'), app: L('src/app.js'), css: L('src/styles.css'), uti: L('src/utils.js'), guide: L('guide/11-pilotage.html') };

function monde(S) {
  const appels = { vide: 0, suivre: 0, minuteur: 0, compter: [] };
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite,
    setTimeout: () => { appels.minuteur++; return 0; } };
  ctx.window = ctx;
  ctx._mvGraphCadre = (w, h) => ({ w, h, padL: 60, padR: 14, padT: 26, padB: 34, iw: w - 74, ih: h - 60,
    col: { mesure: 'var(--terre)', prevu: 'var(--or)', grille: 'var(--gris-clair)', texte: 'var(--texte-doux)', alerte: 'var(--rouge)' },
    trait: { mesure: 2, prevu: 1.5, grille: 1 } });
  ctx._mvGraphSvg = (c, aria, corps) => '<svg aria-label="' + aria + '">' + corps + '</svg>';
  ctx._mvGraphHit = (c, x, y, xa, xb, tt) => '<rect class="mvg-hit" data-tt="' + tt.replace(/"/g, '&quot;') + '"/>';
  ctx._mvGraphVide = (q, g) => { appels.vide++; return '<div class="vide">' + q + '</div>'; };
  ctx._mvInfoBtn = k => '<button data-info="' + k + '">i</button>';
  ctx._mvGraphSuivre = () => { appels.suivre++; };
  vm.createContext(ctx);
  vm.runInContext(S.ck, ctx);
  return { ctx, appels };
}
const hex = t => Math.floor(t).toString(16);
const ISO = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const w = monde(S), W = w.ctx;
  const now = Date.now(), auj = ISO(new Date()), hier = ISO(new Date(now - 86400000));
  const J = [
    { id: hex(now - 3600000), date: auj, parcelle: 'Les Crais 2', tache: 'Taille', qui: 'Victor', statut: 'Validé', equipe: true, membresEquipe: ['Victor', 'Shana'] },
    { id: hex(now - 300000), date: auj, parcelle: 'En Champs 3', tache: 'Taille', qui: 'Alicia', statut: 'En cours', equipe: false, membresEquipe: [] },
    // Une entrée météo qui se dirait « Validé » : c'est le drapeau meteo qui l'écarte, pas son statut.
    { id: 'meteo-' + auj, date: auj, parcelle: 'Domaine', tache: 'Météo', qui: 'Auto', statut: 'Validé', meteo: true },
    { id: hex(now - 7200000), date: hier, parcelle: 'Les Charmes', tache: 'Tirage', qui: 'Nico', statut: 'Validé' },
    // Un identifiant qui COMMENCE comme une heure mais n'en a pas la forme : aucune heure n'en est tirée.
    { id: hex(now - 600000) + '-p1', date: auj, parcelle: 'Domaine', tache: 'Pliage', qui: '<img src=x onerror=alert(1)>', statut: 'Validé' },
  ];
  const fil = W._ckFilDonnees(J, auj);
  T('le fil ne garde que le jour, les validations et les débuts (ni la météo, ni hier) : 3 lignes', fil.length === 3);
  T('… du plus récent au plus ancien, l\u2019heure lue dans l\u2019identifiant ; sans heure lisible, en dernier',
    fil[0].e.parcelle === 'En Champs 3' && fil[1].e.parcelle === 'Les Crais 2' && fil[2].ts === null);
  const h1 = W._ckFilHtml(fil, null, now);
  T('une équipe « a validé » au pluriel, une personne au singulier, un début « a commencé »',
    h1.includes('<b>Victor et Shana</b> ont validé <b>Taille</b>') && h1.includes('<b>Alicia</b> a commencé <b>Taille</b>'));
  T('les noms sont échappés (aucune balise ne passe)', !h1.includes('<img') && h1.includes('&lt;img'));
  T('l\u2019heure se dit « il y a 5 min » ; une ligne sans heure connue n\u2019en invente pas',
    h1.includes('il y a 5\u00a0min') && /<\/span><time><\/time><\/li><\/ol>$/.test(h1));
  T('au premier dessin, rien ne s\u2019éclaire', !h1.includes('ck-ev neuf'));
  const vus = new Set([fil[1].e.id, fil[2].e.id]);
  const h2 = W._ckFilHtml(fil, vus, now);
  T('au dessin suivant, seule la ligne nouvelle s\u2019éclaire', (h2.match(/ck-ev neuf/g) || []).length === 1 && /ck-ev neuf[^]*En Champs 3/.test(h2.split('</li>')[0]));
  T('fil vide : une phrase, pas une liste vide', W._ckFilHtml([], null, now).includes('Aucune validation aujourd’hui'));

  const R1 = W._ckResumeHtml({ marge: 5 }, { totalReste: 1113.4 }, 3);
  T('le résumé dit la marge, les heures à faire et les validations du jour',
    R1.includes('<b>5 jours d’avance</b> sur l’objectif') && R1.includes('data-ck-fin="1113"') && R1.includes('>3</b> validations aujourd’hui'));
  T('… au singulier quand il le faut, et le retard comme le pile', W._ckResumeHtml({ marge: 1 }, {}, 1).includes('1 jour d’avance')
    && W._ckResumeHtml({ marge: -3 }, {}, 0).includes('3 jours de retard') && W._ckResumeHtml({ marge: 0 }, {}, 0).includes('pile à l’heure')
    && W._ckResumeHtml({ marge: 0 }, {}, 1).includes('validation aujourd’hui'));
  T('… et se tait sur ce qu\u2019il ne sait pas (marge inconnue, reste inconnu)',
    !W._ckResumeHtml({ marge: null }, { totalReste: null }, 0).includes('objectif') && !W._ckResumeHtml({}, {}, 0).includes('à faire'));

  const ph = [{ d: '2027-01-08', reste: 1300 }, { d: '2027-01-10', reste: 1200 }, { d: '2027-01-12', reste: 1190 }, { d: 'x' }, null];
  const se = W._ckChargeSerie(ph, { totalReste: 1150 }, '2027-01-12');
  T('la courbe : les photos dans l\u2019ordre, la photo du jour remplacée par le chiffre en direct',
    se.length === 3 && se[0].iso === '2027-01-08' && se[2].iso === '2027-01-12' && se[2].v === 1150);
  T('moins de deux points : l\u2019état vide du kit, jamais une ligne plate', W._ckChargeSvg(600, se.slice(0, 1), {}).includes('class="vide"') && w.appels.vide === 1);
  const svg = W._ckChargeSvg(600, se, { proj: new Date(2027, 1, 24), obj: new Date(2027, 2, 1) });
  const mesure = (svg.match(/<path d="M[^"]+" fill="none" stroke="var\(--terre\)"[^>]*>/) || [''])[0];
  T('la mesure est un trait du kit (plein, sans remplissage, épaisseur « mesure ») : MOUV-1 la dessine en direct',
    mesure.includes('stroke-width="2"') && !mesure.includes('dasharray'));
  T('la projection va en pointillé jusqu\u2019à la fin prévue ; l\u2019objectif a son trait', svg.includes('stroke="var(--or)" stroke-width="1.5" stroke-dasharray="4 4"') && svg.includes('>objectif</text>'));
  T('une zone de touche par photo (l\u2019infobulle suit la souris et le doigt)', (svg.match(/class="mvg-hit"/g) || []).length === 3);

  const html = W._ckAuj({ d: { totalReste: 900 }, m: { marge: 2 }, hero: '<div class="pil-hero">H</div>', inaction: '<div class="pil-inaction">I</div>',
    kpis: '<div class="pil-ck">K</div>', dec: '<div>D</div>', det: '<div>E</div>', alertes: '<div class="pil-sec-h">Alertes matériel</div>A',
    chantiers: '<div class="mvk-ligne">C</div>', photos: ph, journal: J, montrer: { resume: true, charge: true, fil: true } });
  T('la mise en page range TOUS les blocs d\u2019avant (fin prévue, inaction, décision, indicateurs, alertes)',
    ['pil-hero', 'pil-inaction', 'La décision du jour', 'pil-dec2', 'pil-cks', 'Alertes matériel'].every(k => html.includes(k)));
  T('… à gauche ce qui décide, à droite ce qui arrive', html.indexOf('ck-main') < html.indexOf('pil-hero') && html.indexOf('pil-hero') < html.indexOf('ck-side')
    && html.indexOf('ck-side') < html.indexOf('ck-fil-pan') && html.indexOf('ck-fil-pan') < html.indexOf('pil-cks'));
  T('… avec le résumé, les chantiers, la courbe et le fil, chacun avec sa bulle d\u2019info', html.includes('ck-resume') && html.includes('ck-chantiers')
    && html.includes('id="ck-charge"') && html.includes('data-info="pil.charge"') && html.includes('data-info="pil.fil"'));
  T('… et prépare l\u2019après-dessin (la courbe s\u2019inscrit au kit)', w.appels.minuteur === 1);
  const sans = W._ckAuj({ d: {}, m: {}, montrer: { resume: false, charge: false, fil: false } });
  T('chaque bloc neuf se masque depuis « Choisir les indicateurs »', !sans.includes('ck-resume') && !sans.includes('ck-charge') && !sans.includes('ck-fil-pan'));

  const P = S.pil;
  T('_pilTabAuj confie au cockpit les morceaux qu\u2019il calcule déjà, sans en recalculer aucun',
    /return window\._ckAuj\(\{ d:d, m:m, hero:_ckHero, inaction:_ckInac, kpis:kpis, dec:dec, det:det, alertes:H\.slice\(_ckAl0\),/.test(P)
    && /chantiers:\(_pilShow\('auj_chantiers'\)\?window\._mvkAvancement\(d\.data,_pilRetards\(\)\):''\)/.test(P)
    && /montrer:\{ resume:_pilShow\('auj_resume'\), charge:_pilShow\('auj_courbe'\), fil:_pilShow\('auj_fil'\) \}/.test(P));
  T('… et garde l\u2019ancien ordre si le cockpit manque ou plante (jamais d\u2019écran blanc)',
    /if\(H && typeof window\._ckAuj==='function'\)\{\n    try\{/.test(P) && /catch\(e\)\{ if\(window\._mvAvale\) window\._mvAvale\(e,'pilotage\.js\/_pilTabAuj#cockpit'\); \}/.test(P)
    && P.includes("if(_pilShow('auj_alertes')) H+='<div class=\"pil-sec-h\">Alertes matériel</div>'+_pilCkAlertes(d);"));
  T('« Choisir les indicateurs » propose les quatre blocs neufs, et « Charge restante » garde sa clé à lui',
    ["['auj_resume',", "['auj_chantiers',", "['auj_courbe',", "['auj_fil',"].every(k => P.includes(k)) && (P.match(/\['auj_charge',/g) || []).length === 1);
  T('le module est importé juste après pilotage.js, et reserve.js reste dernier',
    /import '\.\/pilotage\.js';\nimport '\.\/cockpit\.js';[^\n]*\nimport '\.\/reserve\.js';/.test(S.app));
  // Les jetons portent leur repli (règle du socle, mv-harnais-jetons) : on lit le style SANS les var(…).
  const css = S.css.slice(S.css.indexOf('AUJ-1 (§260) — LE COCKPIT')).replace(/var\([^)]*\)/g, 'JETON');
  T('le style du cockpit ne passe que par les jetons (espacements et tailles de texte)',
    css.length > 500 && !/(?:margin|padding|gap)(?:-[a-z]+)?:[^;}]*\d+px/.test(css) && !/font-size:\s*\d/.test(css) && /\.ck-cols\{[^}]*\}/.test(css));
  T('l\u2019aide, les bulles et le guide décrivent le nouvel écran', /'pil\.fil': \{ t: 'En direct'/.test(S.uti) && /'pil\.charge': \{ t: 'La charge restante'/.test(S.uti)
    && S.uti.includes('Aujourd’hui se lit d’un coup d’œil') && S.guide.includes('le fil <b>En direct</b> des validations'));
  T('la version et sa nouveauté vont ensemble (8.32, pastille sur le fil, pour l\u2019admin)',
    /export const APP_VERSION = '8\.32';/.test(S.uti) && /\{ v: '8\.32', d: '2026-10-07', items: \[\n    \{ niv: 1, pour: \['admin'\], cible: '#ck-fil-pan'/.test(S.uti));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['le fil qui garde la météo', 'ck', "if(!e || e.date !== auj || e.meteo || !e.tache", "if(!e || e.date !== auj || !e.tache"],
    ['une heure inventée pour un identifiant quelconque', 'ck', "if(typeof id !== 'string' || !/^[0-9a-f]{10,12}$/.test(id)) return null;", "if(typeof id !== 'string') return null;"],
    ['une équipe au singulier', 'ck', "(pl ? 'ont validé' : 'a validé')", "'a validé'"],
    ['les noms non échappés', 'ck', "_ckEsc(noms.join(' et ') || 'Quelqu’un')", "(noms.join(' et ') || 'Quelqu’un')"],
    ['tout qui s\u2019éclaire au premier dessin', 'ck', 'var neuf = vus && !vus.has(e.id);', 'var neuf = !vus || !vus.has(e.id);'],
    ['une marge inconnue lue comme zéro', 'ck', 'if(m && m.marge != null){', 'if(m){'],
    ['la photo du jour gardée à côté du direct', 'ck', "typeof x.reste === 'number' && x.d !== auj) s.push", "typeof x.reste === 'number') s.push"],
    ['une ligne plate au lieu de l\u2019état vide', 'ck', 'if(!serie || serie.length < 2){', 'if(!serie || serie.length < 1){'],
    ['la mesure tracée en pointillé (MOUV-1 ne la dessinerait plus)', 'ck', "'\" stroke-width=\"' + tr.mesure + '\" stroke-linejoin", "'\" stroke-width=\"' + tr.mesure + '\" stroke-dasharray=\"3 2\" stroke-linejoin"],
    ['un bloc d\u2019avant oublié (les alertes)', 'ck', "    + (o.alertes || '');", "    + '';"],
    ['plus de repli : écran blanc si le cockpit plante', 'pil', "    }catch(e){ if(window._mvAvale) window._mvAvale(e,'pilotage.js/_pilTabAuj#cockpit'); }", "    }finally{}"],
    ['la courbe sur la clé de l\u2019indicateur', 'pil', "charge:_pilShow('auj_courbe')", "charge:_pilShow('auj_charge')"],
    ['le module importé après reserve.js', 'app', "import './cockpit.js';   // AUJ-1 (§260) : le cockpit d'Aujourd'hui (pilotage.js approche 950 Ko)\nimport './reserve.js';", "import './reserve.js';\nimport './cockpit.js';"],
    ['un espacement écrit à la main', 'css', '.ck-pan-hd{margin-bottom:var(--e-3,12px)}', '.ck-pan-hd{margin-bottom:12px}'],
  ];
  let manques = 0;
  DEF.forEach(([nom, f, a, b]) => {
    const S = Object.assign({}, SRC0);
    if (S[f].split(a).length !== 2) { console.log('  ??  ancre introuvable ou multiple : ' + nom); manques++; return; }
    S[f] = S[f].replace(a, b);
    const rouge = jouer(S).some(x => !x[1]);
    if (!rouge) manques++;
    console.log((rouge ? '  ok  rougit : ' : '  KO  reste vert : ') + nom);
  });
  console.log('\n' + (manques ? 'CONTRE-ÉPREUVES ROUGES ' + manques : 'CONTRE-ÉPREUVES VERTES') + ' \u2014 ' + DEF.length + ' défauts réinjectés');
  process.exit(ko || manques ? 1 : 0);
}
process.exit(ko ? 1 : 0);
