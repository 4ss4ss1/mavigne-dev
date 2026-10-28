// HARNAIS — ACCV-2 (§417) : l'Accueil Vigne en sept cartes (maquette, lots 2 à 4 ensemble).
//   node scripts/mv-harnais-accv2.mjs           → doit être vert
//   node scripts/mv-harnais-accv2.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES _accSavoirItems, renderHomeSaison, renderHomeMoi, renderHomeTrac, renderHomeDirect (extraites par leurs
// accolades) sur un faux DOM et de fausses données ; lit la page, la feuille, l'aide, le guide et la liste des contrôles.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { app: L('src/app.js'), css: L('src/styles.css'), uti: (L('src/utils.js') + '\n' + L('src/whats-new.js')), guide: L('guide/04-vigne.html'), html: L('index.html'), liste: L('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function bloc(css) { const i = css.indexOf('★ ACCV-2 (§417)'); if (i < 0) return ''; const j = css.indexOf('★ FIN ACCV-2', i); return css.slice(i, j < 0 ? undefined : j); }
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ISO = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const VEN = new Date(2026, 9, 23, 11, 50);             // le temps : un vendredi — samedi et dimanche viennent AVANT le lundi pluvieux
const F = k => ISO(new Date(2026, 9, 23 + k));
const N0 = new Date(), LUN = new Date(N0.getFullYear(), N0.getMonth(), N0.getDate() - ((N0.getDay() + 6) % 7));   // le journal : la semaine réelle
const J = k => ISO(new Date(LUN.getFullYear(), LUN.getMonth(), LUN.getDate() + k));
const LUNDI = VEN;
// ★ WN-COUPE-1 (§469) — une horloge figée pour la carte « À savoir » : renderHomeSavoir lit _accSavoirItems(new Date()), l’heure RÉELLE, et
//   les lignes attendues sont calculées au vendredi 23/10, 11 h 50. Passé 14 h le 27/10 (le vent du mardi après-midi), le compte divergeait
//   (vert à 7 h, rouge à 18 h, déjà sur la base) ; tous les jours suivants aussi. Le paramètre `Date` du monde ne fige que le monde qui le demande.
const horlogeFigee = (t0) => class extends Date { constructor(...a) { if (a.length) super(...a); else super(t0.getTime()); } static now() { return t0.getTime(); } };
function monde(S, o) {
  o = o || {};
  const els = {}, el = id => (els[id] = els[id] || { id, innerHTML: '', textContent: '', className: '', style: {}, classList: { toggle() {}, add() {} } });
  const blocs = {}; const bl = w => (blocs[w] = blocs[w] || { style: {} });
  const doc = { getElementById: id => el(id), querySelector: s => { const m = /data-w="(\w+)"/.exec(s); return m ? bl(m[1]) : null; } };
  const fn = 'var _accDirectOuvert=false;\n' + ['function _accNoms(l){', 'function _accHa(v){', 'function _accSavoirItems(now){', 'function renderHomeSavoir(){', 'function renderHomeSaison(){', 'function renderHomeMoi(){', 'function renderHomeTrac(){', 'function renderHomeDirect(){'].map(d => fonction(S.app, d)).join('\n');
  const P = [{ nom: 'Les Crais', surface: '1' }, { nom: 'Bel Air', surface: '0,5' }, { nom: 'En Champs', surface: '0,5' }];
  const ST = { 'Réparation': { 'Les Crais': 'Validé', 'Bel Air': 'En cours' }, 'Arrachage': {} };
  const hexDe = (h, m) => new Date(LUN.getFullYear(), LUN.getMonth(), LUN.getDate(), h, m).getTime().toString(16);
  const JR = [
    { id: hexDe(11, 48) + '-x', date: J(0), parcelle: 'Bel Air', tache: 'Réparation', qui: 'Jean', membresEquipe: ['Sophie'], statut: 'En cours' },
    { id: hexDe(11, 42) + '-x', date: J(0), parcelle: 'Les Crais', tache: 'Réparation', qui: 'Sophie', membresEquipe: ['Jean'], statut: 'Validé' },
    { id: hexDe(9, 0) + '-x', date: J(0), parcelle: 'En Champs', tache: 'Réparation', qui: 'Paul', statut: 'Validé' },
    { id: hexDe(8, 0) + '-x', date: J(0), parcelle: 'En Champs', tache: 'Réparation', qui: 'Paul', statut: 'Validé' }
  ].concat(o.long ? [1, 2, 3, 4].map(k => ({ id: hexDe(8, k) + '-x', date: J(-1), parcelle: 'P' + k, tache: 'Réparation', qui: 'Paul', statut: 'Validé' })) : []);
  const win = {
    METEO_DAILY: { time: [F(0), F(1), F(2), F(3), F(4)], pp: [5, 90, 10, 85, 5], tmin: [5, 6, 6, -2, 4], tmax: [15, 15, 12, 14, 15], code: [1, 61, 3, 61, 1] },
    METEO_HOURLY: { time: [F(3) + 'T07:00', F(3) + 'T08:00', F(3) + 'T15:00', F(4) + 'T14:00', F(1) + 'T14:00'], precip: [0, 0.9, 0.9, 0, 0.9], wind: [9, 12, 14, 31, 40] },
    _mvJalons: o.jalons ? { compteurs: { km: 23.1, val: 46 }, gagnes: { 'ha1.reparation': '2026-10-18', 'val.25': '2026-10-01' } } : null,
    _mvJalonsProchains: () => [{ titre: '50 validations', ratio: 0.92, reste: '46 sur 50' }, { titre: 'Un marathon de rangs', ratio: 0.55, reste: '23,1 sur 42,195' }, { titre: 'Trois', ratio: 0.1, reste: 'x' }],
    _mvJalonLibelle: id => ({ titre: id === 'ha1.reparation' ? 'Premier hectare de réparation' : id }),
    _mvPrepOn: () => !!o.prep, TRACTEURS_LIST: [{ id: 't1', nom: 'New Holland', compteur_h: 482, revision_h: 500 }],
    CONFIG: { gnr: { niveau: 180, capacite: 1000 } }, _sessInSaison: () => true, _mvAvale: () => {}
  };
  const S2 = [{ date: J(-2), activite: 'Griffage', conducteur: 'Jean', tracteurId: 't1', parcellesFaites: ['a', 'b', 'c'], statut: 'Terminé' }, { date: J(0), activite: 'Intercep', conducteur: 'Marie', statut: 'En cours' }];
  const noms = ['document', 'window', 'currentUser', 'PARCELLES', 'JOURNAL', 'SESSIONS', 'getTachesSaison', 'getSaisonActive', '_parcConcern', 'getTacheStatut', 'tNom', '_escHtml', '_mvIcon', '_hvJour', '_hvHeure', '_mvToday', '_prioItems', 'getHomeCardData', '_visuSaison', '_arrEquipeFiniePartout', '_mvTraceData', '_mvPartTache', '_mvPartCalc', 'isTractoriste', '_mvMoiAdmin', 'fmtDate', '_homeDreLignes', 'Date'];
  const f = new Function(...noms, fn + '\nreturn { savoir: _accSavoirItems, rS: renderHomeSavoir, rSa: renderHomeSaison, rM: renderHomeMoi, rT: renderHomeTrac, rD: renderHomeDirect };');
  const now = LUNDI;
  const X = f(doc, win, { nom: o.qui || 'Sophie' }, P, JR, S2,
    () => [{ nom: 'Réparation' }, { nom: 'Taille' }, { nom: 'Arrachage' }, { nom: 'Entreplantation' }], () => ({ nom: 'Après-vendange', debut: '2026-10-05', echeances: { 'Taille': { d1: '2026-12-01' }, 'Entreplantation': { d1: '2026-10-12' }, 'Réparation': { d1: '2026-10-05' } } }),
    t => (t === 'Arrachage' ? [{ nom: 'Arr', surface: '0,3' }] : (t === 'Entreplantation' ? [{ nom: 'En Champs', surface: '0,5' }] : P)), (p, t) => (ST[t] || {})[p.nom] || 'Non démarré', t => t, esc, n => '<svg data-i="' + n + '"></svg>',
    d => (d === J(0) ? 'Aujourd’hui' : d === J(-1) ? 'Hier' : d), j => { const m = /^([0-9a-f]{10,12})-/.exec(j.id || ''); if (!m) return ''; const d = new Date(parseInt(m[1], 16)); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); },
    () => J(0), () => [{ t: 'Réparation' }], () => ({ pctGlobal: 41, rienAMesurer: false }), () => 'Après-vendange 2026-2027', () => true,
    () => (o.vide ? { total: 0, jours: 0 } : { total: 2.31, jours: 12 }), (out) => 'Réparation', () => ({ mine: 1, done: 1.5, them: 0.5, tot: 2, rest: 0.5 }),
    () => !!o.trac, () => !!o.admin, d => 'le ' + d, (now2) => (o.dre ? [{ g: { parcelles: ['Les Crais', 'Bel Air'], produits: ['Produit A'] }, fin: new Date(2026, 9, 23, 16, 0), diffH: 4.2 }] : []), o.maintenant ? horlogeFigee(o.maintenant) : Date);
  return { X, els, blocs, now, win };
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css);
  let A, Dr, Sa, Mo, MoP, MoV, Tr, Ad, Ou, Di, DiL;
  try {
    A = monde(S, {}); const it = A.X.savoir(A.now);
    Dr = monde(S, { dre: true }).X.savoir(LUNDI);
    T('À savoir : la pluie du lundi (85 %) avec ses heures ; le samedi pluvieux, avant lui, ne compte pas', it.some(x => x.t === 'pluie' && /lundi/.test(x.ti) && x.v === '85\u00a0%' && /entre 8\u00a0h et 16\u00a0h/.test(x.d)) && !it.some(x => /samedi/.test(x.ti)));
    T('À savoir : le gel du lundi, le vent du mardi après-midi (31 km/h) ; le vent du samedi ne compte pas', it.some(x => x.t === 'att' && /Gel annonc\u00e9 lundi/.test(x.ti) && x.v === '-2\u00b0') && it.some(x => /Vent mardi apr\u00e8s-midi/.test(x.ti) && x.v === '31\u00a0km/h') && !it.some(x => /40/.test(x.v)));
    T('À savoir : un délai de rentrée en cours passe en tête, en rouge, avec ses parcelles et son heure de fin', Dr[0] && Dr[0].t === 'dan' && Dr[0].d.startsWith('Les Crais et Bel Air') && Dr[0].v === 'jusqu\u2019\u00e0 16\u00a0h\u00a000');
    const Ah = monde(S, { maintenant: LUNDI }); Ah.X.rS(); T('la carte À savoir rend ses lignes et son compte', Ah.els['home-savoir'].innerHTML.includes('class="hk-as-l pluie"') && Ah.els['home-savoir-n'].textContent === String(it.length) && Ah.els['home-savoir-n'].className === 'mvpas mvpas-compteur');
    Sa = monde(S, {}); Sa.X.rSa(); const h = Sa.els['home-saison'].innerHTML; if (process.env.MV_VOIR) console.log(h);
    T('La saison : le pourcentage de la saison (getHomeCardData), la priorité marquée, ce qui reste en hectares et en parcelles', h.includes('41<small>') && /Réparation<span class="mvpas mvpas-etiquette">/.test(h) && h.includes('reste 1,00\u00a0ha, 2 parcelles') && !/\d\s?h restantes|heures/.test(h));
    T('La saison : en cours par date de début, puis à venir avec sa date (« dès le 1er déc. »), puis terminé — l’arrachage fini pour l’équipe', h.indexOf('>Réparation<') < h.indexOf('>Entreplantation<') && h.indexOf('À venir') < h.indexOf('dès le 1er déc.') && h.includes('fini pour l\u2019\u00e9quipe') && h.indexOf('Terminé') > h.indexOf('dès le 1er déc.'));
    Mo = monde(S, { jalons: true }); Mo.X.rM(); const m = Mo.els['home-moi'].innerHTML;
    T('Ma saison : la part de la saison, les jours, les kilomètres de rangs (jalons.js)', m.includes('2,31<small>') && m.includes('>12<') && m.includes('23,1<small>'));
    T('Ma saison : la semaine en hectares — une parcelle faite à deux compte pour moitié, une parcelle validée par un autre ne compte pas', /<div( class="auj")?><em>0,50<\/em>/.test(m) && m.includes('Cette semaine</b><span>0,50') && (m.match(/class="auj"/g) || []).length === ((N0.getDay() + 6) % 7 < 5 ? 1 : 0));
    T('Ma saison : les deux jalons les plus proches, puis le dernier gagné', (m.match(/class="hk-jal"/g) || []).length === 2 && m.includes('Premier hectare de réparation') && !m.includes('>Trois<'));
    MoP = monde(S, { prep: true }); MoP.X.rM(); MoV = monde(S, { vide: true }); MoV.X.rM();
    T('Ma saison : cachée en mode préparation (PREP-1) ; une saison qui commence le dit', MoP.blocs.moi.style.display === 'none' && MoV.els['home-moi'].innerHTML.includes('Votre saison commence'));
    Ou = monde(S, {}); Ou.X.rT(); Tr = monde(S, { trac: true, qui: 'Jean' }); Tr.X.rT(); Ad = monde(S, { admin: true, qui: 'Marie' }); Ad.X.rT();
    T('Au tracteur : caché chez l’ouvrier ; chez le tractoriste, sa dernière session, la révision dans 18 h, ses sessions et le bouton', Ou.blocs.trac.style.display === 'none' && Tr.els['home-trac'].innerHTML.includes('Griffage, le ' + J(-2)) && Tr.els['home-trac'].innerHTML.includes('r\u00e9vision dans 18\u00a0h') && Tr.els['home-trac'].innerHTML.includes('Vos sessions') && Tr.els['home-trac'].innerHTML.includes('class="mvbtn mvbtn-secondaire" onclick="goTo(\'tracteur\');openNewSession()"'));
    T('Au tracteur : chez l’administrateur, la cuve de GNR basse (18 %), pas de bouton s’il n’est pas tractoriste', Ad.els['home-trac'].innerHTML.includes('Cuve de GNR') && Ad.els['home-trac'].innerHTML.includes('mvpas-surveiller">basse') && !Ad.els['home-trac'].innerHTML.includes('openNewSession'));
    Di = monde(S, {}); Di.X.rD(); const d = Di.els['home-direct'].innerHTML; DiL = monde(S, { long: true }); DiL.X.rD();
    T('En direct : la parcelle commencée par votre équipe en tête, depuis son heure ; la session ouverte de Marie', d.indexOf('En cours') < d.indexOf('Aujourd') && d.includes('<b>Votre \u00e9quipe</b><span>Réparation, Bel Air</span>') && d.includes('depuis 11:48') && d.includes('Marie, au tracteur'));
    T('En direct : « Vous et Jean avez validé », « Paul a validé » ; « Tout voir » au-delà de cinq lignes', d.includes('<b>Vous et Jean</b> avez valid\u00e9 <b>Les Crais</b>') && d.includes('<b>Paul</b> a valid\u00e9') && !d.includes('Tout voir') && DiL.els['home-direct'].innerHTML.includes('Tout voir ('));
  } catch (e) { T('plantage : ' + e.message, false); }
  T('la page porte les cinq cartes, au jeu commun (CHARTE-5), « Au tracteur » cachée d’office', ['savoir', 'saison', 'moi', 'direct'].every(w => S.html.includes('<div class="home-w hk mvcarte" data-w="' + w + '">')) && S.html.includes('<div class="home-w hk mvcarte" data-w="trac" style="display:none">'));
  T('ACCV-3 (§418) : les blocs d’avant sont retirés (ni HOME_RETIRES ni leurs fonctions), « À savoir » ne se masque jamais, la grille range les cartes', !/HOME_RETIRES|function renderHomeCard\(|function renderHomeMaPart\(|function renderHomeDRE\(|function renderHomeRaccourcis\(|function renderHomeMaSemaine\(/.test(S.app) && S.app.includes("const HOME_WIDGETS=['demarrage','savoir','meteo5','saison','moi','trac','direct'];") && S.app.includes("lay.hidden=lay.hidden.filter(function(w){return w!=='savoir';});") && S.app.includes("['savoir','meteo5','direct'].forEach") && S.app.includes("if(typeof _accZones==='function') _accZones();"));
  T('la feuille : un seul cadre, l’ordre du matin au téléphone, deux colonnes et la colonne collée sur ordinateur, sans aucune couleur écrite', B.length > 4000 && !B.includes('.home-w-retire{') && B.includes('#page-home .home-w[data-w="savoir"]{ order:2; }') && B.includes('#page-home #home-droite.colle{ position:sticky;') && !/#[0-9A-Fa-f]{3,8}\b|rgba?\(/.test(B) && S.css.indexOf('★ ACCV-2 (§417)') > S.css.indexOf('★ FIN ACCV-1') && S.css.indexOf('★ FIN ACCV-2') < S.css.indexOf('/* ★ TETE-2 (§329)'));
  T('Personnaliser : l’œil seul — ni glisser, ni taille, ni largeur dans le code ; la carte du jour et « À savoir » portent l’épingle', !/homeWidgetSize|homeWidgetLarge|homeWidgetMove|_homeDragMove/.test(S.app) && S.app.includes("if(id===HOME_PINNED||id==='savoir'){") && B.includes('#page-home .hk-seg{ margin-left:auto;'));
  T('l’aide, le guide et les nouveautés disent les sept cartes', S.uti.includes("['À savoir', \" : en tête de la colonne de droite") && S.uti.includes("['Au tracteur', \" : chez le tractoriste") && S.uti.includes("titre: 'L’Accueil rangé en sept cartes'") && S.guide.includes("L'Accueil en sept cartes"));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-accv2.mjs'],") && S.liste.includes("['node scripts/mv-harnais-accv2.mjs --contre'],"));
  const vueOk = (() => { try {
    const i = S.app.indexOf('window._homeMeteoVue=function(v){'); if (i < 0) return false; const code = S.app.slice(i, S.app.indexOf('\n};', i) + 3);
    const el = (d) => ({ style: { display: d || '' }, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; } });
    const b1 = el(), b2 = el(); b1.attrs['data-vue'] = 'vignoble'; b2.attrs['data-vue'] = 'secteurs';
    const seg = Object.assign(el(), { querySelectorAll: () => [b1, b2] }), m5 = el(), mc = el('none'), win = {};
    const doc = { getElementById: id => ({ 'home-meteo-vue': seg, 'home-meteo5': m5, 'home-meteo-communes': mc })[id] };
    new Function('window', 'document', code)(win, doc);
    win._homeMeteoVue('secteurs');
    const a = m5.style.display === 'none' && mc.style.display === '' && b2.attrs['aria-pressed'] === 'true' && b1.attrs['aria-pressed'] === 'false';
    seg.style.display = 'none'; win._homeMeteoVue('secteurs');
    const b = m5.style.display === '' && mc.style.display === 'none' && win._homeMeteoVueEtat === 'vignoble';
    return a && b; } catch (e) { return false; } })();
  T('ACCV-3 (§418) : la carte Météo bascule — « Secteurs » montre les communes et cache les cinq jours ; sans bascule (moins de deux communes), « Vignoble » reste', vueOk && S.html.includes('<div id="home-meteo-communes" style="display:none"></div>') && !S.html.includes('data-w="meteosect"'));
  return out;
}
function lancer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = lancer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['le samedi pluvieux revient dans « À savoir »', 'app', "return w!==0&&w!==6; };\n  var nomJ", "return true; };\n  var nomJ", 0],
    ['la semaine compte toute la parcelle à chacun', 'app', "sem[di]+=(parseFloat(String(p.surface||0).replace(',','.'))||0)/eq.length;", "sem[di]+=(parseFloat(String(p.surface||0).replace(',','.'))||0);", 7],
    ['le délai de rentrée n’est plus dans « À savoir »', 'app', ".filter(function(r){ return r.diffH>0; }).sort(function(a,b){ return a.fin-b.fin; })", ".filter(function(r){ return false; }).sort(function(a,b){ return a.fin-b.fin; })", 2],
    ['« Au tracteur » s’affiche chez l’ouvrier', 'app', "if(!tr&&!adm){ if(w) w.style.display='none'; c.innerHTML=''; return; }", "if(false){ }", 10],
    ['« À savoir » redevient masquable', 'app', "lay.hidden=lay.hidden.filter(function(w){return w!=='savoir';});", "", 15],
    ['une couleur écrite en dur dans le bloc', 'css', '#page-home .hk-as-i{ display:flex;', '#page-home .hk-as-i{ color:#7A2850; display:flex;', 16],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-accv2.mjs'],", '', 19],
    ['« Secteurs » s’affiche sans bascule', 'app', "var sect=(v==='secteurs')&&!!seg&&seg.style.display!=='none';", "var sect=(v==='secteurs');", 20]
  ];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible]) => {
    const S = Object.assign({}, S0); if (!S[f].includes(de)) { console.log('  !! MOTIF ABSENT : ' + nom); return; }
    S[f] = S[f].replace(de, vers); if (S[f] === S0[f]) { console.log('  !! MUTATION SANS EFFET : ' + nom); return; }
    const r = lancer(S), ok = r[cible] && !r[cible][1]; console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  process.exit(mord === DEF.length ? 0 : 1);
}
process.exit(ko ? 1 : 0);
