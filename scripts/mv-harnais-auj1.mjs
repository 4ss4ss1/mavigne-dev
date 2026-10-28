// HARNAIS — AUJ-1 (§260) : le cockpit d'Aujourd'hui, vue Terrain (src/cockpit.js).
// PIL-RANGE-1b (§441) : le rendu de secours de cockpit.js (_ckAuj et ses aides) est retiré avec l'ancien Aujourd'hui ; ce harnais ne garde
//   que ce qui vit encore et nourrit le cockpit v2. Les bulles « i » qu'on lit sont celles de cockpit-vue.js (INFO), plus MV_INFO pil.*.
//   node scripts/mv-harnais-auj1.mjs           → doit être vert
//   node scripts/mv-harnais-auj1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute le VRAI src/cockpit.js dans un monde minimal (le kit graphique simulé), et lit sur le texte
// des sources le branchement (pilotage.js, app.js), le style, l'aide, le guide et la nouveauté.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { vue: L('src/cockpit-vue.js'), ck: L('src/cockpit.js'), pil: L('src/pilotage.js'), app: L('src/app.js'), css: L('src/styles.css'), uti: (L('src/utils.js') + '\n' + L('src/whats-new.js')), guide: L('guide/11-pilotage.html') };

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


  const ph = [{ d: '2027-01-08', reste: 1300 }, { d: '2027-01-10', reste: 1200 }, { d: '2027-01-12', reste: 1190 }, { d: 'x' }, null];
  const se = W._ckChargeSerie(ph, { totalReste: 1150 }, '2027-01-12');
  T('la courbe : les photos dans l\u2019ordre, la photo du jour remplacée par le chiffre en direct',
    se.length === 3 && se[0].iso === '2027-01-08' && se[2].iso === '2027-01-12' && se[2].v === 1150);


  const P = S.pil;
  // PIL-RANGE-4a (§446) : les quatre blocs de l'ancien cockpit (résumé, chantiers, courbe, alertes) n'ont plus de case — le cockpit v2
  //   ne les lit pas ; la règle « une case = un lecteur » est gardée par mv-harnais-pilrange4a.
  T('« Afficher dans cet onglet » d’Aujourd’hui ne propose plus les blocs que le cockpit v2 ne lit pas', !/\['auj_resume',|\['auj_chantiers',|\['auj_courbe',/.test(S.pil) && /\['auj_cave',/.test(S.pil));
  T('le module est importé juste après pilotage.js, et reserve.js reste dernier',
    /import '\.\/pilotage\.js';\nimport '\.\/cockpit\.js';[^\n]*\nimport '\.\/cockpit-vue\.js';[^\n]*\n(?:import '[^']+';[^\n]*\n)*import '\.\/reserve\.js';/.test(S.app));
  // Les jetons portent leur repli (règle du socle, mv-harnais-jetons) : on lit le style SANS les var(…).
  // REF-1 (§266) : la feuille de cet ancien cockpit est remplacée par celle de la maquette validée, passée à la charte.
  T('l\u2019ancienne feuille a laissé la place à celle de la maquette (REF-1)', S.css.includes('★★★ REF-1 (§266) — LE COCKPIT D\'AUJOURD\'HUI : LA FEUILLE DE LA MAQUETTE VALIDÉE') && !S.css.includes('AUJ-1 (§260) — LE COCKPIT D\'AUJOURD\'HUI, VUE TERRAIN'));
  T('la bulle du fil (cockpit v2), l\u2019aide et le guide décrivent l\u2019écran', /\n  fil: '/.test(S.vue) && S.uti.includes('Aujourd’hui se lit d’un coup d’œil')
    && S.guide.includes("le fil <b>En direct</b> : d'abord qui est où en ce moment"));
  T('la nouveauté d\u2019AUJ-1 reste au Journal (bloc 8.32, pastille sur le fil, pour l\u2019admin)',
    /\{ v: '8\.32', d: '2026-10-07', items: \[\n    \{ niv: 1, pour: \['admin'\], cible: '#ck-fil'/.test(S.uti));   // PIL-FIX-2 (§442) : la pastille vise le fil du cockpit v2 (#ck-fil-pan est parti avec le rendu de secours)
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
    ['la photo du jour gardée à côté du direct', 'ck', " || x.d >= auj) return;", ") return;"],   // AUJ-5 : + filtre de période ; AUJ-6 : ancre suivie (_ckChargeSerie réécrite)
    ['le module du cockpit sorti de sa place (après pilotage.js)', 'app', "import './pilotage.js';\nimport './cockpit.js';", "import './pilotage.js';\nimport './reserve.js';\nimport './cockpit.js';"],
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
