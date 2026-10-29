/* ───────────────────────────────────────────────────────
   HARNAIS — COMPT-4 (§486) : LE COMPTEUR, LES FINITIONS (ce que COMPT-1 à 3 laissaient ouvert)
   Lancer :          node scripts/mv-harnais-compt4.mjs
   Contre-épreuves : node scripts/mv-harnais-compt4.mjs --contre

   POURQUOI IL EXISTE
   Ce harnais JOUE les vraies fonctions de tracteur.js : les jours ouvrés qui sautent les fériés du planning (_feriesY),
   « Corriger » borné entre le relevé d'avant et celui d'après, qui recalcule le dernier relevé et s'annule ; il garde la fiche
   « Plein fait » qui demande le compteur, le plein réservé aux tracteurs suivis, la date d'échéance au Pilotage, à l'accueil et
   au rapport, la bande des pastilles retirée, « heures de travail », l'aide du parc réécrite.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { tr: lire('src/tracteur.js') + '\n' + lire('src/compteur.js'), app: lire('src/app.js'), pil: lire('src/pilotage.js'), ut: lire('src/utils.js'), html: lire('index.html'), css: lire('src/styles.css'), couv: lire('scripts/tutos-couverture.json'), liste: lire('scripts/mv-harnais-liste.mjs') };
const sansCom = (x) => x.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond, detail) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail !== undefined ? '  → ' + detail : '')); } };
const FONCS = ['_trIso', '_trJours', '_trVrais', '_trUtc', '_trFerie', '_trJoursOuvres', '_trAjoutOuvres', '_relVal', '_relEtatCorr', '_trRelCorriger', '_relValiderCorr'].map((n) => 'function ' + n + '(');
function monde(S, o) {
  const toasts = [], els = {};
  const el = (id) => (els[id] = els[id] || { id, textContent: '', innerHTML: '', hidden: false });
  const ctx = {
    TRACTEURS_LIST: o.parc, _rel: { buf: '' },
    window: { _feriesY: () => ({ 0: { 1: 'Jour de l’An' }, 10: { 1: 'Toussaint', 11: 'Armistice' } }), showToastAnnuler: (m, a) => toasts.push({ m, a }) },
    document: { getElementById: el }, isAdmin: () => !!o.admin, showToast: (m) => toasts.push({ m }), _gnrNum: (n) => String(n), _fmtDate: (d) => d, _escHtml: (x) => String(x),
    _relRendu: () => {}, _openOv: () => {}, _closeOv: () => {}, _saveData: () => {}, renderTracteur: () => {}, renderEntretiens: () => {}, _gnrTodayISO: () => '2026-10-29',
  };
  vm.createContext(ctx);
  vm.runInContext(FONCS.map((d) => fonction(S.tr, d)).join('\n') + '\nthis.jo=_trJoursOuvres; this.plus=_trAjoutOuvres; this.etatC=_relEtatCorr; this.corriger=_trRelCorriger; this.valider=_relValiderCorr; this.rel=function(){ return _rel; }; this.taper=function(b){ _rel.buf=b; };', ctx);
  ctx.toasts = toasts; ctx.els = els;
  return ctx;
}
const NH = () => ({ id: 'nh', nom: 'New Holland', compteur_h: 1178, releves: [
  { d: '2026-10-20', ts: 3, h: 1154, src: 'jour', par: 'Marie' }, { d: '2026-10-23', ts: 5, h: 1163.5, src: 'plein', par: 'Jean' },
  { d: '2026-10-25', ts: 6, par: 'Jean', src: 'jour', manque: true }, { d: '2026-10-27', ts: 7, h: 1178, src: 'jour', par: 'Marie' }] });
function jouer(S) {
  const A = monde(S, { parc: [NH()], admin: true }), nh = A.TRACTEURS_LIST[0];
  t('① les jours ouvrés sautent les fériés du planning : du 9 au 13 nov., 3 (le 11 est l’Armistice) ; 14 jours ouvrés après le 29 oct. → le 19 nov.',
    A.jo('2026-11-09', '2026-11-13') === 3 && A.plus('2026-10-29', 14) === '2026-11-19', JSON.stringify([A.jo('2026-11-09', '2026-11-13'), A.plus('2026-10-29', 14)]));
  const b = { min: 1154, max: 1178 };
  t('② « Corriger » est borné : plus bas que le relevé d’avant, refusé ; plus haut que celui d’après, refusé ; entre les deux, accepté',
    A.etatC(1150, b).k === 'bas' && A.etatC(1180, b).k === 'imp' && A.etatC(1165, b).k === 'ok' && A.etatC(null, b).k === 'vide');
  A.corriger('nh', 5); const r = A.rel();
  t('③ la feuille s’ouvre bornée par les vrais relevés voisins (1154 et 1178), « pas devant le tracteur » ignoré, l’échappatoire cachée',
    r.src === 'correction' && r.borne.min === 1154 && r.borne.max === 1178 && r.borne.ts === 5 && A.els['rel-tard'].hidden === true && /corriger le relev\u00e9 du 2026-10-23/.test(A.els['rel-sub'].textContent));
  A.taper('1165'); A.valider();
  t('③ le bon chiffre remplace l’ancien, gardé dans « corrige » ; le dernier relevé reste 1178', nh.releves[1].h === 1165 && nh.releves[1].corrige === 1163.5 && nh.compteur_h === 1178 && /Relev\u00e9 corrig\u00e9 \u00b7 1165\u00a0h \(\u00e9tait 1163.5\u00a0h\)/.test(A.toasts[0] && A.toasts[0].m));
  A.toasts[0].a();
  t('③ « Annuler » remet l’ancien chiffre, sans trace de correction', nh.releves[1].h === 1163.5 && !('corrige' in nh.releves[1]));
  A.corriger('nh', 7); A.taper('1182'); A.valider();
  t('③ corriger le dernier relevé recalcule le compteur (1182), sans borne haute', A.rel().borne.max === Infinity && nh.compteur_h === 1182);
  const B = monde(S, { parc: [NH()], admin: false }); B.corriger('nh', 5);
  t('③ un non-admin ne corrige rien', B.rel().src === undefined);
  t('④ le plein (bouton) ne demande le compteur qu’à un tracteur suivi ; la fiche « Plein fait » le demande aussi',
    S.tr.includes("if(!window.__MV_TUTO&&_trPleinH==null&&_trSuivi(t)){ _relOuvrir(t.id,'plein',") && S.tr.includes("_relOuvrir(t.id,'plein',function(h){ _trEntH=h; try{ saveEntretien(); } finally { _trEntH=null; } }); return; }") && S.tr.includes('fiche.compteur_h=_trEntH;'));
  t('④ « Corriger » dans la fiche, la feuille du relevé bornée et redirigée', S.tr.includes('onclick="_trRelCorriger(\\\'\'+_escAttr(t.id)+\'\\\',\'+Number(r.ts)+\')">Corriger</button>') && S.tr.includes("e=(_rel.src==='correction'&&_rel.borne)?_relEtatCorr(v,_rel.borne):_relEtat(v,k)") && S.tr.includes("if(_rel.src==='correction') return _relValiderCorr();"));
  t('⑤ la date d’échéance : le Pilotage la reçoit et la dit (liste, révision à la date seule), l’accueil et le rapport aussi',
    S.pil.includes('revDate:(_ep&&_ep.date)||null, revJours:_ep?_ep.jours:null') && S.pil.includes("' \\u00b7 ou le '+((typeof window!=='undefined'&&window._trDateAn)") && S.pil.includes("'Révision le '+") && S.app.includes('window._trRevEtat(tc)') && (S.app.match(/window\._trRevEtat\(t\)\)/g) || []).length >= 1);
  t('⑥ la bande des pastilles est retirée : ni fonction, ni appel, ni élément, ni règle (commentaires mis à part)', !/renderTracParcPills/.test(sansCom(S.tr)) && !S.html.includes('trac-parc-pills') && !sansCom(S.css).includes('#trac-parc-pills') && !/\.tpc[\s{.:-]/.test(sansCom(S.css)));
  t('⑦ « heures de travail » partout où l’écran disait « heures de moteur »', S.html.includes('<div class="mvu-kpi-l">Heures de travail</div>') && S.tr.includes('<span class="l">Heures de travail</span>') && S.tr.includes("+' de travail</span></div>';") && !S.html.includes('Heures de moteur') && !S.tr.includes('<span class="l">Heures de moteur</span>'));
  const ex = (JSON.parse(S.couv).exempts) || {};
  t('⑧ l’aide du parc réécrite ; « Corriger » exempté de tuto ; la liste joue ce fichier et sa contre-épreuve',
    !S.ut.includes('s’affiche en pastilles sous les chiffres') && S.ut.includes("['Le parc', \"sur un ordinateur, dans la colonne de droite") && typeof ex._trRelCorriger === 'string' && S.liste.indexOf("mv-harnais-compt4.mjs'") > 0 && S.liste.indexOf("mv-harnais-compt4.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['les fériés comptent comme des jours ouvrés', m('tr', 'if(w>=1&&w<=5&&!_trFerie(d)) n++;', 'if(w>=1&&w<=5) n++;')],
    ['« Corriger » accepte plus bas que le relevé d’avant', m('tr', "if(v<b.min) return {k:'bas',", "if(false) return {k:'bas',")],
    ['« Corriger » accepte plus haut que le relevé d’après', m('tr', "if(v>b.max) return {k:'imp',", "if(false) return {k:'imp',")],
    ['la correction ne recalcule plus le dernier relevé', m('tr', 'var vr=_trVrais(t); if(vr.length) t.compteur_h=Number(vr[vr.length-1].h);', '')],
    ['un non-admin corrige', m('tr', "if(!isAdmin()){ showToast('R\\u00e9serv\\u00e9 \\u00e0 l\\u2019admin','#C0392B'); return; }\n  var t=(TRACTEURS_LIST||[]).find(function(x){ return x.id===tid; }); if(!t) return;\n  var r=(t.releves||[]).find(function(x){ return x&&x.ts===ts; }); if(!r||r.manque||r.ecarte) return;", "var t=(TRACTEURS_LIST||[]).find(function(x){ return x.id===tid; }); if(!t) return;\n  var r=(t.releves||[]).find(function(x){ return x&&x.ts===ts; }); if(!r||r.manque||r.ecarte) return;")],
    ['la fiche « Plein fait » ne demande plus le compteur', m('tr', "_relOuvrir(t.id,'plein',function(h){ _trEntH=h;", "_relOuvrirX(t.id,'plein',function(h){ _trEntH=h;")],
    ['le Pilotage ne reçoit plus la date', m('pil', 'revDate:(_ep&&_ep.date)||null,', 'revDate:null,')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-compt4.mjs'").join("mv-harnais-comptW.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
