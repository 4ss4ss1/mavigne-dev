#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────────
   HARNAIS PROT-1 + INACTION-1 (§218)
   Lancer :  node scripts/mv-harnais-protection.mjs            (scénarios)
             node scripts/mv-harnais-protection.mjs --contre   (contre-épreuves)
   Le bloc PROT/INACTION est extrait de src/pilotage.js (horloge figée au 16 juin
   2026) ; le réglage de reglages.js (_ecoCfgSet, groupe 'prot') est exécuté pour
   de vrai. Doublés avec leur signature : _rfPair(d), _rfSim(ctx, prof), _rfProf.
   Prouvé : mode d'action déduit de la substance (inconnu → contact, dit) ; un
   mélange protège comme son produit le plus rémanent ; reste = rémanence − jours ;
   jamais traitée et à nu en tête ; réglages lus, défauts 10/12/14 ; le coût de
   l'inaction = heures induites × taux, « rien à rattraper » quand ça boucle.
   ───────────────────────────────────────────────────────────────────────── */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const CONTRE = process.argv.includes('--contre');
const PIL = readFileSync('src/pilotage.js', 'utf8'), REG = readFileSync('src/reglages.js', 'utf8'), APP = readFileSync('src/app.js', 'utf8');
function corps(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut);
  let j = src.indexOf('{', i), n = 0; for (let k = j; k < src.length; k++) { if (src[k] === '{') n++; else if (src[k] === '}') { n--; if (n === 0) return src.slice(i, k + 1); } } throw new Error('accolades : ' + debut); }
function bloc(src) { const a = src.indexOf('var _PIL_PROT_DEF='), b = src.indexOf('function _pilCkTraiter(){'); if (a < 0 || b < a) throw new Error('bloc PROT introuvable'); return src.slice(a, b); }
const RealDate = Date, FIXED = new RealDate('2026-06-16T10:00:00').getTime();
function FakeDate(...a) { return a.length ? new RealDate(...a) : new RealDate(FIXED); }
FakeDate.prototype = RealDate.prototype; FakeDate.now = () => FIXED; FakeDate.parse = RealDate.parse;

function charger(src, o = {}) {
  const ctx = { Math, Object, Array, String, Number, isFinite, console, Date: FakeDate,
    CONFIG: { conformite: o.cfg || {} },
    PARCELLES: [{ nom: 'A', surface: 1 }, { nom: 'B', surface: 0.5 }, { nom: 'C', surface: 0.8 }, { nom: 'D', surface: 0.4, statut: 'Arrachee' }, { nom: 'E', surface: 0.3 }, { nom: 'F', surface: 0.6 }, { nom: 'G', surface: 0.2 }],
    TRAITEMENTS: [
      { date: '2026-06-01', parcelles: ['A', 'B'], produits: [{ nom: 'Bordo', sub: 'sulfate de cuivre' }] },                         // contact, 15 j → A,B a nu
      { date: '2026-06-10', parcelles: ['A'], produits: [{ nom: 'Mix', sub: 'cymoxanil' }, { nom: 'Cu', sub: 'oxychlorure de cuivre' }] }, // penetrant 12 j, 6 j → reste 6
      { date: '2026-06-14', parcelles: ['C'], produits: [{ nom: 'Phos', sub: 'phosphonates de potassium' }] },                       // systemique 14 j, 2 j → reste 12
      { date: '2026-06-05', parcelles: ['E'], produits: [{ nom: 'Mystere', sub: '' }] },                                              // inconnu → contact 10 j, 11 j → a nu depuis 1 j
      { date: '2026-06-12', parcelles: ['F'], produits: [{ nom: 'Bordo', sub: 'sulfate de cuivre' }] },                                // contact, 4 j → 6 j par les jours, mais 21,5 mm → lessivee
      { date: '2026-06-14', parcelles: ['G'], produits: [{ nom: 'Bordo', sub: 'sulfate de cuivre' }] },                                // contact, 2 j → 8 j ; 7 mm de pluie
    ],
    METEO_PLUIE: o.pluie === undefined ? { ts: FIXED, jours: { '2026-06-13': 12, '2026-06-14': 9.5, '2026-06-15': 4, '2026-06-16': 3 }, auj: { iso: '2026-06-16', mm: 3 } } : o.pluie,
    _mvInfoBtn: k => '<button class="mv-i" data-info="' + k + '">i</button>',
    _pluieCharger: () => Promise.resolve(false), renderPilotage: () => {},
    _rfPair: d => (o.rf === 'none' ? null : { dec: { c: { k: 0.15 }, rate: 23, noRate: !!o.noRate }, fini: !!o.fini }),
    _rfProf: (ctx, sel) => [0, 0, 0],
    _rfSim: (ctx, prof) => { if (!Array.isArray(prof)) throw new Error('signature'); return o.sim || { induit: 214, horsDelai: 2, deborde: false }; },
  };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext([corps(src, 'function _pilEsc('), corps(src, 'function _pilNum('), corps(src, 'function _pilHa('), corps(src, 'function _pilDfr('), corps(src, 'function _ecoEur('), corps(src, 'function _pilPhotoIso('), bloc(src)].join('\n'), ctx, { filename: 'prot-extrait.js' });
  return ctx;
}
function chargerReg(src) {
  const ctx = { CONFIG: { conformite: { ift_ref: 12 } }, saveData: () => {}, _ecoNum: v => Number(v), Number, String, Object, Array, isFinite,
    showToast: () => {}, isAdmin: () => true, _ecoRenderIftCard: () => {}, _ecoRenderTauxCard: () => {}, renderReglages: () => {}, renderPilotage: () => {}, _pilExoOublier: () => {} };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(corps(src, 'window._ecoCfgSet=function(group,key,val){'), ctx, { filename: 'reg-extrait.js' });
  return ctx;
}

function scenarios(pil, reg, journal, app) {
  const APP = app || readFileSync('src/app.js', 'utf8');
  let ok = 0, ko = 0;
  const t = (nom, cond, det) => { if (cond) { ok++; if (journal) console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; if (journal) console.log('  \x1b[31m✗\x1b[0m ' + nom + (det != null ? '\n      → ' + det : '')); } };
  try {
    const X = charger(pil);
    t('mode d’action déduit de la substance : cuivre → contact, cymoxanil → pénétrant, phosphonate → systémique',
      X._pilProtType({ sub: 'sulfate de cuivre' }).mode === 'contact' && X._pilProtType({ sub: 'cymoxanil' }).mode === 'penetrant' && X._pilProtType({ sub: 'phosphonates de potassium' }).mode === 'systemique');
    t('substance absente : le nom du produit sert ; rien de connu → contact, et c’est dit (deduit)', X._pilProtType({ nom: 'Fosétyl-Al' }).mode === 'systemique' && X._pilProtType({ nom: 'Mystère', sub: '' }).deduit === true && X._pilProtType({ nom: 'Mystère', sub: '' }).mode === 'contact' && X._pilProtType({ sub: 'cymoxanil' }).deduit === false);
    const c0 = X._pilProtCfg();
    t('défauts 10 / 12 / 14 jours sans réglage', c0.contact === 10 && c0.penetrant === 12 && c0.systemique === 14);
    const X2 = charger(pil, { cfg: { prot_contact_j: 8, prot_systemique_j: 0 } });
    const c2 = X2._pilProtCfg();
    t('réglage lu (contact 8) ; un réglage à zéro retombe sur le défaut (systémique 14)', c2.contact === 8 && c2.systemique === 14 && c2.penetrant === 12);
    const P = X._pilProtData();
    const R = n => P.rows.find(r => r.nom === n);
    t('arrachée hors ; 6 parcelles actives', P.n === 6 && !R('D'));
    t('A : dernier traitement le 10/06, mélange cuivre + cymoxanil → pénétrant 12 j, reste 6', R('A').date === '2026-06-10' && R('A').mode === 'penetrant' && R('A').rem === 12 && R('A').j === 6 && R('A').reste === 6, JSON.stringify(R('A')));
    t('B : cuivre le 01/06 → contact 10 j, 15 j écoulés → à nu depuis 5 j', R('B').mode === 'contact' && R('B').reste === -5);
    t('C : systémique 14 j, 2 j écoulés → encore 12', R('C').reste === 12);
    t('E : substance inconnue → contact (prudent), marqué déduit, à nu depuis 1 j', R('E').mode === 'contact' && R('E').deduit === true && R('E').reste === -1);
    t('tri : à nu d’abord (B, E, F lessivée), puis les plus proches (A, G, C)', P.rows.slice(0, 3).map(r => r.nom).sort().join('') === 'BEF' && P.rows[3].nom === 'A' && P.rows[4].nom === 'G' && P.rows[5].nom === 'C', P.rows.map(r => r.nom).join(''));
    t('3 à nu (1,4 ha), 0 bientôt, 1 mode déduit', P.nu.length === 3 && Math.abs(P.haNu - 1.4) < 1e-9 && P.bientot.length === 0 && P.nDed === 1);
    t('PLUIE : F, cuivre du 12/06, 6 j par les jours mais 28,5 mm depuis (13 → 16 juin) → lessivée, à nu', R('F').lessive === true && R('F').reste === 0 && Math.abs(R('F').pluie - 28.5) < 1e-9, JSON.stringify(R('F')));
    t('PLUIE : G, cuivre du 14/06 : 7 mm (le 15 et les heures passées du 16, pas le jour du traitement), encore 8 j', R('G').lessive === false && R('G').reste === 8 && Math.abs(R('G').pluie - 7) < 1e-9, JSON.stringify(R('G')));
    t('PLUIE : un pénétrant ne se lessive pas (A : pluie non lue)', R('A').pluie === null && R('A').lessive === false);
    t('PLUIE : un jour manquant → pluie inconnue (null), jamais zéro', X._pilProtPluie('2026-06-10', { jours: { '2026-06-12': 5, '2026-06-13': 5, '2026-06-14': 1, '2026-06-15': 1, '2026-06-16': 1 } }, '2026-06-16') === null && X._pilProtPluie('2026-06-14', null, '2026-06-16') === null);
    t('PLUIE : résumé — 1 lessivée, lessivage à 20 mm, 3 mm aujourd’hui', P.nLess === 1 && P.pluieOk === true && P.pluieAuj === 3 && P.cfg.lessivage === 20);
    const Xp = charger(pil, { pluie: null }), Pp = Xp._pilProtData();
    t('PLUIE : sans relevé, F reste protégée par les jours (6 j) et l’écran dit « pluie inconnue »', Pp.rows.find(r => r.nom === 'F').reste === 6 && Pp.pluieOk === false && Xp._pilProtHtml().includes('pluie inconnue'));
    const Xl = charger(pil, { cfg: { prot_lessivage_mm: 30 } });
    t('PLUIE : seuil réglé à 30 mm → F (28,5 mm) n’est plus lessivée', Xl._pilProtData().rows.find(r => r.nom === 'F').lessive === false && Xl._pilProtCfg().lessivage === 30);
    // _pluieLire (app.js) : la reponse Open-Meteo lue, le jour meme = heures passees seulement
    const ctxL = { Math, Number, String, Array, isFinite, Date: FakeDate }; ctxL.window = ctxL; vm.createContext(ctxL);
    vm.runInContext([corps(APP, 'function _pluieIsoLocal('), corps(APP, 'function _pluieLire(')].join('\n'), ctxL, { filename: 'pluie-extrait.js' });
    const rep = { daily: { time: ['2026-06-14', '2026-06-15', '2026-06-16'], precipitation_sum: [9.5, 4, 11] },
      hourly: { time: ['2026-06-16T08:00', '2026-06-16T09:00', '2026-06-16T10:00', '2026-06-16T11:00', '2026-06-16T18:00'], precipitation: [1, 1.5, 0.5, 6, 2] } };
    const L1 = ctxL._pluieLire(rep, new FakeDate());
    t('_pluieLire : les jours passés gardent leur cumul, le jour même ne compte que ses heures passées (3 mm à 10 h, pas 11)', L1 && L1.jours['2026-06-15'] === 4 && L1.jours['2026-06-16'] === 3 && L1.auj.mm === 3, JSON.stringify(L1));
    const L2 = ctxL._pluieLire({ daily: rep.daily }, new FakeDate());
    t('_pluieLire : sans heures, le jour même est inconnu (pas la prévision de 11 mm)', L2 && L2.jours['2026-06-16'] === undefined && L2.auj.mm === null);
    t('_pluieLire : réponse vide → null', ctxL._pluieLire(null) === null && ctxL._pluieLire({}) === null);
    t('PLUIE : branché — la carte demande la pluie, le réglage « lessivage » existe', /_pilPluieDemander\(\);\s*var P=_pilProtData\(\)/.test(pil) && /prot_lessivage_mm=_ecoNum\(val\)/.test(reg) && /window\._pluieCharger=_pluieCharger/.test(APP));
    const H = X._pilProtHtml();
    t('rendu : « 3 parcelles à nu », 1,4 ha, rémanences écrites, « ? » sur le mode déduit, lessivée dite', H.includes('3 parcelles à nu') && H.includes('1,4 ha sans protection') && H.includes('lessivée · 28,5 mm') && H.includes('rémanences 10 / 12 / 14 j') && H.includes('contact ?'));
    t('rendu : jamais traitée dite comme telle, aucun undefined / NaN', !/undefined|NaN/.test(H) && (H.match(/<div[ >]/g) || []).length === (H.match(/<\/div>/g) || []).length);
    // jamais traitee
    const X3 = charger(pil); X3.TRAITEMENTS.length = 0; const P3 = X3._pilProtData();
    t('sans aucun traitement : toutes « jamais traitées », toutes à nu', P3.nu.length === 6 && P3.rows.every(r => r.jamais) && X3._pilProtHtml().includes('jamais traitée'));
    // inaction
    const I = X._pilCkInaction({});
    t('inaction : + 214 h · ≈ 4 922 € (214 × 23), 2 tâches hors délai, modèle +15 % écrit', I.includes('+ 214 h · env. ') && /4[\s\u202f\u00a0]922 €/.test(I) && I.includes('2 tâches hors délai') && I.includes('+15 % par semaine'), I);
    t('inaction : le bouton mène à Décider (cible renfort)', I.includes('data-diag="renfort"') && /cible==='renfort'/.test(pil));
    const X4 = charger(pil, { sim: { induit: 0, horsDelai: 0, deborde: false } });
    t('tout boucle : « Rien à rattraper », pas de bouton', X4._pilCkInaction({}).includes('Rien à rattraper') && !X4._pilCkInaction({}).includes('data-diag'));
    t('campagne finie, ou sans taux, ou sans simulateur : rien', charger(pil, { fini: true })._pilCkInaction({}) === '' && charger(pil, { noRate: true })._pilCkInaction({}) === '' && charger(pil, { rf: 'none' })._pilCkInaction({}) === '');
    t('branché : « Traiter ? » appelle la protection, le cockpit appelle l’inaction', /\+body\+_pilProtHtml\(\)\+/.test(pil) && /_pilShow\('auj_inaction'\)\) cockpit\+=_pilCkInaction\(d\)/.test(pil));
    // le reglage, pour de vrai
    const RG = chargerReg(reg);
    RG._ecoCfgSet('prot', 'penetrant', '11'); RG._ecoCfgSet('prot', 'autre', '99');
    t('réglage : _ecoCfgSet(\'prot\',\'penetrant\',11) écrit CONFIG.conformite.prot_penetrant_j, une clé inconnue est refusée',
      RG.CONFIG.conformite.prot_penetrant_j === 11 && RG.CONFIG.conformite.prot_autre_j === undefined && RG.CONFIG.conformite.ift_ref === 12, JSON.stringify(RG.CONFIG.conformite));
    t('réglage : les trois champs sont dans la carte Conformité', /_ecoCfgSet\(\\'prot\\',\\''\+r\[0\]\+'\\'/.test(reg) && reg.includes("['contact','Contact'") && reg.includes("['systemique','Syst"));
  } catch (e) { t('les scénarios s’exécutent sans planter', false, e.stack); }
  return { ok, ko };
}
console.log('\n\x1b[1mMA VIGNE — Harnais PROT-1 + INACTION-1 · ' + (CONTRE ? 'contre-épreuves' : 'scénarios') + '\x1b[0m');
if (!CONTRE) { const r = scenarios(PIL, REG, true); console.log('\n  ' + r.ok + ' vertes, ' + r.ko + ' rouges\n'); process.exit(r.ko ? 1 : 0); }
const DEFAUTS = [
  ['pil', 'un mélange prend la rémanence la plus COURTE', 'if(cfg[ty.mode]>rem){', 'if(rem===0||cfg[ty.mode]<rem){'],
  ['pil', 'une substance inconnue devient systémique', "return {mode:'contact', deduit:true};", "return {mode:'systemique', deduit:true};"],
  ['pil', 'le réglage n’est plus lu', "o[k]=(isFinite(v)&&v>0)?v:_PIL_PROT_DEF[k];", 'o[k]=_PIL_PROT_DEF[k];'],
  ['pil', 'les jours écoulés ne sont plus retirés', 'var reste=(j==null?null:e.rem-j), pluie=null', 'var reste=(j==null?null:e.rem), pluie=null'],
  ['pil', 'les arrachées reviennent', "if(!p||p.statut==='Arrachee') return;\n    var e=der[p.nom];", "if(!p) return;\n    var e=der[p.nom];"],
  ['pil', 'les euros oublient le taux', 'eur=h*(ctx.rate||0);', 'eur=h;'],
  ['pil', 'l’inaction s’affiche même quand la campagne est finie', 'if(!P||!P.dec||P.fini||P.dec.noRate) return', 'if(!P||!P.dec||P.dec.noRate) return'],
  ['pil', 'le seuil de lessivage n’est plus lu', "if(pluie!=null&&pluie>=cfg.lessivage){ lessive=true; reste=0; }", "if(false){ lessive=true; reste=0; }"],
  ['pil', 'le jour du traitement compte dans la pluie', "for(;;){ d.setDate(d.getDate()+1); var iso=_pilPhotoIso(d);", "for(var k0=0;;k0++){ if(k0) d.setDate(d.getDate()+1); var iso=_pilPhotoIso(d);"],
  ['pil', 'un jour manquant compte zéro', "if(v==null||!isFinite(Number(v))) return null; mm+=Number(v); }", "if(v==null||!isFinite(Number(v))) continue; mm+=Number(v); }"],
  ['app', 'le jour même prend la prévision entière', "if(vu) jours[auj]=Math.round(mm*10)/10; else delete jours[auj];", "if(false) jours[auj]=Math.round(mm*10)/10;"],
  ['reg', 'le réglage accepte n’importe quelle clé', "if(['contact','penetrant','systemique'].indexOf(key)>=0) C.conformite['prot_'+key+'_j']=_ecoNum(val);", "C.conformite['prot_'+key+'_j']=_ecoNum(val);"],
];
let rougit = 0;
for (const [f, nom, a, b] of DEFAUTS) {
  const src = f === 'reg' ? REG : (f === 'app' ? APP : PIL), n = src.split(a).length - 1;
  if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté (' + n + ') : ' + nom); continue; }
  const r = f === 'reg' ? scenarios(PIL, REG.replace(a, b), false, APP) : (f === 'app' ? scenarios(PIL, REG, false, APP.replace(a, b)) : scenarios(PIL.replace(a, b), REG, false, APP));
  if (r.ko > 0) { rougit++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + r.ko + ' rouge' + (r.ko > 1 ? 's' : '') + ')\x1b[0m'); } else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
}
console.log('\n  ' + rougit + '/' + DEFAUTS.length + ' contre-épreuves rougissent\n');
process.exit(rougit === DEFAUTS.length ? 0 : 1);
