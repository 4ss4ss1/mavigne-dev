// HARNAIS — ACCV-4 (§419) : l'Accueil dit vrai, et l'administrateur corrige l'équipe d'une validation au Journal.
//   node scripts/mv-harnais-accv4.mjs           → doit être vert
//   node scripts/mv-harnais-accv4.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES _mvTFaite, renderHomeSaison, _jFaitPar, _jEqCibles, _jEqAppliquer et _jEqBtn (extraites par leurs accolades) sur de
// fausses données — quatre parcelles arrachées aux deux tiers, le cas de Nico le 21/10 — et lit le reste dans les sources.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { app: L('src/app.js'), jal: L('src/jalons.js'), html: L('index.html'), tut: L('src/tutos.js'), uti: (L('src/utils.js') + '\n' + L('src/whats-new.js')), guide: L('guide/04-vigne.html'), liste: L('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const el = () => ({ innerHTML: '', textContent: '', style: {}, attrs: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; } });
// les noms qu'on ne fournit pas répondent par une fonction vide : seul compte ce que la carte calcule
function jouer(code, ctx) { const px = new Proxy(ctx, { has: () => true, get: (t, k) => (k in t ? t[k] : (k === Symbol.unscopables ? undefined : (k in globalThis ? globalThis[k] : () => ''))) }); return new Function('__c', 'with(__c){' + code + '}')(px); }
function saison(S, pilote) {
  const els = {}; const P = [{ nom: 'Bras', surface: 0.1144 }, { nom: 'Charreux', surface: 0.1139 }, { nom: 'Chaziere', surface: 0.087 }, { nom: 'Marchais', surface: 0.035 }];
  const ctx = { document: { getElementById: id => (els[id] = els[id] || el()), querySelector: () => null, querySelectorAll: () => [] }, window: {},
    getTachesSaison: () => [{ nom: 'Arrachage' }], getSaisonActive: () => ({ nom: 'Hiver', debut: '2026-10-01', echeances: {} }), _mvToday: () => '2026-10-21', _prioItems: () => [],
    getHomeCardData: () => ({ rienAMesurer: false, pctGlobal: 20 }), _visuSaison: () => 'Hiver', _parcConcern: () => P, getTacheStatut: () => 'En cours',
    _arrActif: () => true, _arrFraction: () => 2 / 3, _arrEquipeFiniePartout: () => false, tNom: n => n, _escHtml: esc, _escAttr: esc, _mvIcon: () => '',
    calcHeures: pilote ? () => ({ data: [{ nom: 'Arrachage', pct: 67, surf_done: 0.2335, surf_total: 0.3503 }], totalTotal: 120, totalReste: 70 }) : () => '' };
  try { jouer(fonction(S.app, 'function _mvTFaite(') + '\n' + fonction(S.app, 'function renderHomeSaison(') + '\nrenderHomeSaison();', ctx); } catch (e) { return 'plantage ' + e.message; }
  return (els['home-saison'] || el()).innerHTML;
}
function equipe(S) {
  const code = ['function _jFaitPar(', 'function _jEqCibles(', 'function _jEqAppliquer(', 'function _jEqBtn('].map(f => fonction(S.app, f)).join('\n') + '\nreturn { _jFaitPar, _jEqCibles, _jEqAppliquer, _jEqBtn };';
  const etat = { admin: true }, J = [];
  const F = jouer(code, { JOURNAL: J, isAdmin: () => etat.admin, _escAttr: esc, _escHtml: esc, _mvIcon: () => '' });
  return { F, J, etat };
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  const s1 = saison(S, false), s2 = saison(S, true);
  T('« La saison » compte les étapes d’un arrachage (règle commune) : quatre parcelles arrachées aux deux tiers sortent à 67 %, pas 0 %', s1.includes('67\u00a0%') && !/>0\u00a0%</.test(s1));
  T('avec les chiffres du Pilotage : la tâche prend son pourcentage, la saison la jauge du Pilotage (120 h prévues, 70 restantes → 42 %)', s2.includes('42<small>') && s2.includes('67\u00a0%'));
  let ok = false, ok2 = false, ok3 = false, ok4 = false;
  try {
    const { F, J, etat } = equipe(S);
    ok = F._jFaitPar({ qui: 'Nico', quiHors: true, membresEquipe: ['Alicia', 'Victor', 'Alicia'] }).join() === 'Alicia,Victor' && F._jFaitPar({ qui: 'Nico', membresEquipe: ['Alicia'] }).join() === 'Nico,Alicia' && F._jFaitPar({ qui: 'Equipe', membresEquipe: ['Jean'] }).join() === 'Jean';
    const a = { id: 'a', qui: 'Nico', membresEquipe: [], eqJour: true }, b = { id: 'b', qui: 'Nico', membresEquipe: ['Jean'], quiHors: true };
    const n1 = F._jEqAppliquer([a], ['Alicia', 'Victor'], 'Nico', '2026-10-21T20:00:00Z'), n2 = F._jEqAppliquer([b], ['Nico'], 'Nico', 'x'), n3 = F._jEqAppliquer([b], [], 'Nico', 'y');
    ok2 = n1 === 1 && a.quiHors === true && a.membresEquipe.join() === 'Alicia,Victor' && a.equipe === true && !('eqJour' in a) && a.eqCorr.par === 'Nico'
      && n2 === 1 && !('quiHors' in b) && b.equipe === false && b.membresEquipe.length === 0 && n3 === 0 && b.eqCorr.le === 'x';
    J.push({ id: '1', date: '2026-10-20', tache: 'Arrachage', qui: 'Nico', statut: 'Validé', parcelle: 'Bras' }, { id: '2', date: '2026-10-20', tache: 'Arrachage', qui: 'Nico', statut: 'Validé', parcelle: 'Charreux' },
      { id: '3', date: '2026-10-20', tache: 'Taille', qui: 'Nico', statut: 'Validé', parcelle: 'Bras' }, { id: '4', date: '2026-10-21', tache: 'Arrachage', qui: 'Nico', statut: 'Validé', parcelle: 'Bras' },
      { id: '5', date: '2026-10-20', tache: 'Arrachage', qui: 'Alicia', statut: 'Validé', parcelle: 'Chaziere' }, { id: '6', date: '2026-10-20', meteo: true });
    ok3 = F._jEqCibles('1', true).map(x => x.id).join() === '1,2' && F._jEqCibles('1', false).map(x => x.id).join() === '1' && F._jEqCibles('zz', true).length === 0;
    const btn = F._jEqBtn({ id: '1', parcelle: 'Bras' }); etat.admin = false; const btnO = F._jEqBtn({ id: '1', parcelle: 'Bras' }); etat.admin = true;
    ok4 = btn.includes('data-tuto="journal.equipe"') && btn.includes("openJEquipe('1')") && btnO === '' && F._jEqBtn({ id: '6', meteo: true }) === '';
  } catch (e) { /* une plante = rouge */ }
  T('_jFaitPar : l’auteur hors du groupe ne compte pas, le vieux « Equipe » non plus, pas de doublon', ok);
  T('_jEqAppliquer : le groupe dit qui a travaillé, l’auteur reste l’auteur, la trace s’écrit ; un groupe vide est refusé', ok2);
  T('« Toute la journée » : même jour, même tâche, même auteur, même état — rien d’autre', ok3);
  T('le bouton « Équipe » : administrateur seulement, sur une entrée de parcelle', ok4);
  const OJ = fonction(S.app, 'function openJEquipe('), SJ = fonction(S.app, 'function saveJEquipe(');
  T('la fenêtre et l’enregistrement refusent hors administrateur', /^function openJEquipe\(id\)\{\s*if\(typeof isAdmin!=='function'\|\|!isAdmin\(\)\) return;/.test(OJ) && /^function saveJEquipe\(\)\{\s*if\(typeof isAdmin!=='function'\|\|!isAdmin\(\)\) return;/.test(SJ) && SJ.includes("saveData('journal')"));
  T('« En direct » : les sessions de la saison, comme le Tracteur', fonction(S.app, 'function renderHomeDirect(').includes("&&(typeof window._sessInSaison!=='function'||window._sessInSaison(s))"));
  T('la carte du jour compte la part faite (règle commune)', fonction(S.app, 'function _homePrioCarte(').includes("f=(typeof _mvTFaite==='function')?_mvTFaite(p,t)") && fonction(S.app, 'function _homePrioCarte(').includes('fait+=sf*_mvTFaite(p,t)'));
  T('« Ma saison », « Ma trace », « En direct » et les jalons lisent qui a travaillé par _jFaitPar', ['function _mvTraceData(', 'function _mvPartCalc(', 'function renderHomeMoi(', 'function renderHomeDirect('].every(f => fonction(S.app, f).includes('_jFaitPar')) && (S.jal.match(/\[j\.qui\]\.concat\(j\.membresEquipe/g) || []).length === 1 && S.jal.includes('window._jFaitPar(j)'));
  T('la page porte la fenêtre ; le Journal, le bouton et la trace', S.html.includes('id="ovJEquipe"') && S.html.includes('data-tuto="journal.equipe.ok"') && S.html.includes("closeOv(null,'ovJEquipe')") && S.app.includes('${_jEqTrace(r)}') && S.app.includes('${_jEqBtn(r)}'));
  T('le tuto, la nouveauté, l’aide et le guide le disent', S.tut.includes("id: 'jequipe'") && S.tut.includes("couvre: ['openJEquipe', '_jEqBasc', 'saveJEquipe']") && S.uti.includes("v: '9.79'") && S.uti.includes("['Corriger l’équipe'") && S.guide.includes("<b>Corriger l'équipe</b>"));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-accv4.mjs'],") && S.liste.includes("['node scripts/mv-harnais-accv4.mjs --contre'],"));
  return out;
}
function lancer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = lancer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['« La saison » revient à « Validé » seulement', 'app', 'f=tf(p,t.nom)||0;', "f=(getTacheStatut(p,t.nom)==='Valid\\u00e9'?1:0);", 0],
    ['« La saison » oublie la jauge du Pilotage', 'app', 'G={vide:!(hT>0), pct:hT>0?Math.round(Math.max(0,hT-hR)/hT*100):0};', 'G={vide:D.rienAMesurer, pct:D.pctGlobal};', 1],
    ['_jFaitPar compte encore l’auteur hors du groupe', 'app', 'var l=(j.quiHors?[]:[j.qui]).concat(j.membresEquipe||[]);', 'var l=[j.qui].concat(j.membresEquipe||[]);', 2],
    ['la correction garde l’auteur dans le groupe', 'app', 'var autres=W.filter(function(n){ return n!==e.qui; }), hors=W.indexOf(e.qui)<0;', 'var autres=W.slice(), hors=W.indexOf(e.qui)<0;', 3],
    ['« Toute la journée » prend toutes les tâches du jour', 'app', 'x.date===e.date&&x.tache===e.tache&&', 'x.date===e.date&&', 4],
    ['le bouton s’affiche chez un salarié', 'app', "if(!r||r.meteo||!r.parcelle||typeof isAdmin!=='function'||!isAdmin()) return '';", "if(!r||r.meteo||!r.parcelle) return '';", 5],
    ['« En direct » reprend toutes les sessions', 'app', "&&(typeof window._sessInSaison!=='function'||window._sessInSaison(s))", '', 7],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-accv4.mjs'],", '', 12]
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
