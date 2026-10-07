// HARNAIS — AUJ-2 (§261) : « À savoir » au cockpit d'Aujourd'hui.
//   node scripts/mv-harnais-auj2.mjs           → doit être vert
//   node scripts/mv-harnais-auj2.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute le VRAI src/cockpit.js et la VRAIE _pilEtatEntree (pilotage.js) ; lit le reste sur le texte des sources.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { ck: L('src/cockpit.js'), pil: L('src/pilotage.js'), css: L('src/styles.css'), uti: L('src/utils.js'), guide: L('guide/11-pilotage.html') };
const fn = (src, sig) => { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); };

function monde(S) {
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0,
    localStorage: { getItem: () => null } };
  ctx.window = ctx;
  ctx._mvInfoBtn = k => '<button data-info="' + k + '">i</button>';
  vm.createContext(ctx);
  vm.runInContext(S.ck, ctx);
  vm.runInContext(fn(S.pil, 'function _pilEtatEntree(e){') + 'window._pilEtatEntree=_pilEtatEntree;', ctx);
  return ctx;
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const W = monde(S), now = new Date(2027, 0, 12, 9, 0);
  const H = { time: [], precip: [], wind: [] };
  for (let h = 0; h < 24; h++) { H.time.push('2027-01-13T' + String(h).padStart(2, '0') + ':00'); H.precip.push(h >= 8 && h <= 10 ? 2 : 0); H.wind.push(15); }
  for (let h = 0; h < 24; h++) { H.time.push('2027-01-14T' + String(h).padStart(2, '0') + ':00'); H.precip.push(0); H.wind.push(h === 15 ? 45 : 10); }
  const brul = [{ nom: 'Brulage', pct: 40 }];
  const m1 = W._ckSvMeteo(H, brul, now);
  T('pluie de demain : le cumul et la plage horaire (6 mm, de 8 h à 11 h)', m1.length === 2 && m1[0].quand === 'Demain' && m1[0].titre === 'Pluie annoncée : 6\u202fmm, de 8\u00a0h à 11\u00a0h');
  T('un brûlage pas fini : la ligne dit qu\u2019il attendra, et passe en tête', m1[0].prio === 1 && m1[0].sous.includes('brûlage en cours attendra'));
  T('vent fort d\u2019après-demain, sans pluie : il est dit seul', /^Vent annoncé à 45\u202fkm\/h$/.test(m1[1].titre) && m1[1].quand === 'Jeudi');
  const m2 = W._ckSvMeteo(H, [{ nom: 'Brulage', pct: 100 }], now);
  T('aucun chantier sensible en cours : ligne d\u2019information', m2[0].prio === 2 && m2[0].sous.includes('Aucun chantier'));
  const faible = { time: H.time.slice(0, 24), precip: H.precip.slice(0, 24).map(v => v ? 0.5 : 0), wind: H.wind.slice(0, 24) };
  T('sous les seuils (1,5 mm, vent 15 km/h) : rien', W._ckSvMeteo(faible, brul, now).length === 0);
  T('sans prévisions : rien, jamais d\u2019invention', W._ckSvMeteo(undefined, brul, now).length === 0 && W._ckSvMeteo({ time: [], precip: [] }, brul, now).length === 0);

  const PE = { Marion: { 2027: { 0: { 13: { type: 'cp' }, 14: { type: 'cp' }, 15: { type: 'cp' } } } },
    Thomas: { 2027: { 0: { 12: { absent: true, comment: 'x' }, 14: { absent: true, comment: 'Formation Certiphyto' } } } },
    Chloe: { 2027: { 0: { 13: { type: 'cp' } } } }, Paul: { 2027: { 0: { 16: { absent: true, comment: 'Maladie' } } } } };
  const membres = [{ nom: 'Marion' }, { nom: 'Thomas' }, { nom: 'Chloe', bureau: true }, { nom: 'Paul' }, { nom: 'Ancien', statut: 'Inactif' }];
  const ab = W._ckSvAbsences(membres, PE, W._pilEtatEntree, now);
  const par = n => ab.find(x => x.titre.startsWith(n));
  T('un congé sur trois jours : une ligne, la plage et le retour', !!par('Marion') && par('Marion').titre === 'Marion en congé'
    && par('Marion').quand.startsWith('Du ') && par('Marion').sous.startsWith('De retour le'));
  T('une absence avec son motif ; aujourd\u2019hui n\u2019est pas compté (déjà dans « Présences »)', par('Thomas') && par('Thomas').sous === 'Formation Certiphyto' && !par('Thomas').quand.includes('12'));
  T('le bureau et les fiches inactives n\u2019y sont pas ; la maladie se dit « en arrêt »', !par('Chloe') && !par('Ancien') && par('Paul').titre === 'Paul en arrêt');
  T('l\u2019état du jour est la règle commune (_pilEtatEntree)', W._pilEtatEntree({ type: 'recup' }).etat === 'recup' && W._pilEtatEntree(null).etat === 'present');

  const ct = W._ckSvContrats([{ nom: 'Paul', fin_contrat: '2027-01-29' }, { nom: 'Léo', fin_contrat: '2027-03-01' }, { nom: 'Ana', fin_contrat: '2027-01-02' },
    { nom: 'Zoé', fin_contrat: '2027-01-20', statut: 'Inactif' }], now);
  T('les contrats qui finissent dans les 30 jours, et eux seuls', ct.length === 1 && ct[0].titre === 'Fin du contrat de Paul' && ct[0].action === 'renfort');
  const rt = W._ckSvRetards([{ nom: 'Reparation', pct: 95 }, { nom: 'Taille', pct: 100 }, { nom: 'Tirage', pct: 40 }], { Reparation: true, Taille: true });
  T('en retard = fenêtre passée ET tâche pas finie', rt.length === 1 && rt[0].titre.startsWith('Reparation') && rt[0].sous.includes('95\u00a0%'));

  const h = W._ckSavoirHtml([{ cat: 'equipe', prio: 2, quand: 'Demain', titre: '<img onerror=1>', sous: 'x', action: 'planning' }].concat(rt, ct), '<div class="mat">M</div>');
  T('le plus pressant d\u2019abord, textes échappés, un bouton qui agit', h.indexOf('ck-sv-retard') < h.indexOf('ck-sv-equipe') && !h.includes('<img') && h.includes('&lt;img')
    && h.includes("onclick=\"goTo('planning')\"") && h.includes("onclick=\"_pilSetTab('sim')\"") && h.includes("onclick=\"_pilSetTab('camp')\""));
  T('le matériel et la cave se rangent au bas de l\u2019encart ; rien à dire : une phrase', h.endsWith('<div class="mat">M</div>') && W._ckSavoirHtml([], '').includes('Rien à signaler'));
  W.METEO_HOURLY = H; W.MEMBRES = membres; W.PLANNING_ENTRIES = PE;
  const o = { d: { data: brul }, m: {}, kpis: 'K', alertes: '<div class="pil-sec-h">Alertes matériel</div>A', cave: '<div class="cv">C</div>', retards: {}, journal: [] };
  const avec = W._ckAuj(Object.assign({ montrer: { savoir: true, fil: true } }, o));
  T('l\u2019encart ouvre la colonne de droite, avant le fil, avec le matériel et la cave dedans',
    avec.includes('id="ck-savoir"') && avec.indexOf('ck-side') < avec.indexOf('ck-savoir') && avec.indexOf('ck-savoir') < avec.indexOf('Alertes matériel')
    && avec.indexOf('class="cv"') < avec.indexOf('ck-fil-pan') && avec.includes('data-info="pil.savoir"'));
  const sans = W._ckAuj(Object.assign({ montrer: { savoir: false, fil: true } }, o));
  T('« À savoir » masqué : le matériel et la cave reviennent à leur place, rien ne se perd',
    !sans.includes('ck-savoir') && sans.indexOf('ck-fil-pan') < sans.indexOf('Alertes matériel') && sans.includes('class="cv"'));

  const P = S.pil;
  T('pilotage.js écrit l\u2019état du jour une seule fois, et les présences le lisent',
    (P.match(/if\(e\.type==='cp'\) etat='cp';/g) || []).length === 1 && P.includes('var _ee=_pilEtatEntree(e), etat=_ee.etat, motif=_ee.motif;') && P.includes('window._pilEtatEntree=_pilEtatEntree;'));
  T('la Cave part des indicateurs vers l\u2019encart, les retards sont passés, l\u2019encart se masque',
    P.includes('kpis:kpis.slice(0,_ckK0), cave:_ckCave, retards:_pilRetards(),') && P.includes("savoir:_pilShow('auj_savoir')") && P.includes("['auj_savoir',"));
  // REF-1 (§266) : la feuille de cet ancien cockpit est remplacée par celle de la maquette validée, passée à la charte.
  T('l\u2019ancienne feuille a laissé la place à celle de la maquette (REF-1)', S.css.includes('★★★ REF-1 (§266) — LE COCKPIT D\'AUJOURD\'HUI : LA FEUILLE DE LA MAQUETTE VALIDÉE') && !S.css.includes('AUJ-2 (§261) — « À SAVOIR »'));
  T('aide, bulle, guide et nouveauté (8.33, pastille sur l\u2019encart)', /'pil\.savoir': \{ t: 'À savoir'/.test(S.uti) && S.guide.includes('<b>À savoir</b>')
    && /\{ v: '8\.33', d: '2026-10-07', items: \[\n    \{ niv: 1, pour: \['admin'\], cible: '#ck-savoir'/.test(S.uti));   // la version a avancé : on garde le bloc
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['la pluie dite à partir de 0 mm', 'ck', 'var _CK_SV = { jours: 7, contrat: 30, pluie: 2, vent: 40 };', 'var _CK_SV = { jours: 7, contrat: 30, pluie: 0, vent: 40 };'],
    ['un brûlage fini qui « attendra » encore', 'ck', "/br[uû]l/i.test(String(r.nom || '')) && (r.pct || 0) < 100", "/br[uû]l/i.test(String(r.nom || ''))"],
    ['les absences du jour recomptées', 'ck', 'for(var k = 1; k <= _CK_SV.jours; k++){', 'for(var k = 0; k <= _CK_SV.jours; k++){'],
    ['le bureau compté dans les absences', 'ck', "if(!m || m.statut === 'Inactif' || m.bureau || !m.nom) return;", "if(!m || m.statut === 'Inactif' || !m.nom) return;"],
    ['un contrat à 40 jours annoncé', 'ck', "m.fin_contrat < auj || m.fin_contrat > lim) return;", "m.fin_contrat < auj) return;"],
    ['une tâche finie dite en retard', 'ck', "if(!r || !R[r.nom] || (r.pct || 0) >= 100) return;", "if(!r || !R[r.nom]) return;"],
    ['des textes non échappés', 'ck', '_ckEsc(x.titre)', 'x.titre'],
    ['le matériel perdu quand l\u2019encart est affiché', 'ck', "window._ckSavoirHtml(sv, (o.alertes || '') + cave)", "window._ckSavoirHtml(sv, '')"],
    ['l\u2019état du jour réécrit à côté', 'pil', 'var _ee=_pilEtatEntree(e), etat=_ee.etat, motif=_ee.motif;', "var etat='present', motif=''; if(e){ if(e.type==='cp') etat='cp'; }"],
    ['la Cave affichée deux fois', 'pil', 'kpis:kpis.slice(0,_ckK0), cave:_ckCave,', 'kpis:kpis, cave:_ckCave,'],
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
