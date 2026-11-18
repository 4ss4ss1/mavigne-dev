#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — CHAINE-1 (§596) : UN CDD QUI DEVIENT CDI SANS COUPURE NE REMET PAS LE COMPTEUR À ZÉRO
   Lancer : node scripts/mv-harnais-chaine1.mjs          (le contrôle)
            node scripts/mv-harnais-chaine1.mjs --contre  (chaque défaut reposé doit rougir)

   ══ POURQUOI ══
   Nico, 18/11 : « quand un salarié passe d'un CDD à un CDI, je ne peux plus modifier la période où il était en CDD.
   De même, quand un CDD et un CDI s'enchaînent, le mois est compté comme un mois standard. C'est juste une formalité
   au niveau des papiers [...] au niveau du comptage d'heures, ça ne change strictement rien. » La règle était écrite
   depuis le 12/08 (deux contrats qui se touchent n'en font qu'un) ; seule la présence la suivait (_mvContrats). Le
   compteur (_planInContract) ne lisait que le contrat en cours : il repartait de zéro à la date du CDI, le mois du
   changement devenait un mois partiel, le CDD sortait en « compteur soldé » ; la grille mettait ses jours en lecture
   seule (CDDCDI-1, §589). Décidé avec Nico : un contrat séparé par une coupure garde son compteur, mais ses jours se
   saisissent ; un contrat payé à l'heure (TESA, saisonnier, extra) suivi d'un CDI garde son compte à part.

   ══ CE QU'IL TIENT (l'appli ENTIÈRE dans Node, mv-app-node) ══
     A. La chaîne (utils.js, _mvChaines) : contigus, chevauchants, une coupure, un changement de régime, une fiche
        jamais migrée ; le lendemain d'un 30 juin, d'un 31 décembre.
     B. Le compteur : le CDD devenu CDI compte comme un CDI depuis le début du CDD — l'année (_planAnnu) ET le mois du
        changement (_planSummary) à l'identique d'une fiche à un seul contrat ; après une coupure, ou après un TESA, le
        compteur repart de la date du CDI, comme avant ; la réponse gardée en mémoire suit un journal remplacé.
     C. La saisie : un jour d'un contrat archivé s'écrit, se coche (ligne entière) et s'affiche en case ordinaire ; un
        jour d'une coupure ou d'avant l'embauche reste « – » et ne s'écrit pas ; plus de « lecture seule ».
     D. La fiche du salarié : plus de « compteur soldé » pour un CDD suivi sans coupure ; il reste après une coupure ;
        aucun pour un contrat payé à l'heure.
     E. Le relevé : « même compteur » sans coupure, « compteur à part » après un TESA.
     F. Réglages : l'historique ne dit plus « Coupure de 0 jour… soldé » ; l'embauche dit « sans coupure : même
        compteur » ; l'effet d'une embauche le jour suivant la fin d'un CDD le dit avant d'enregistrer.
     G. Le branchement : l'aide, le guide, l'annonce, la liste.
   Contre-épreuve : chaque défaut est posé dans une copie HORS du dépôt et joué dans un processus à part — l'appli ne se
   charge qu'une fois par processus.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const VAR = process.env.MV_CHAINE1_VAR || '';
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');

const DEFAUTS = {
  compteur: ['src/planning.js', 'le compteur ne lit plus que le contrat en cours (le défaut d’origine)',
    "  var d0=_planDebutCompteur(mbr);\n  if(d0&&ds<d0)return false;", "  var d0=mbr.debut_contrat;\n  if(d0&&ds<d0)return false;"],
  regime: ['src/utils.js', 'un TESA suivi d’un CDI verse ses heures dans le compteur du CDI',
    "    if(c && c.annu === an && window._mvSuitSansCoupure(c, p)){", "    if(c && window._mvSuitSansCoupure(c, p)){"],
  coupure: ['src/utils.js', 'un jour de coupure ne sépare plus deux contrats',
    "  return String(b.debut) <= window._mvJourApres(a.fin);", "  return true;"],
  memo: ['src/planning.js', 'la réponse gardée en mémoire ne suit plus le journal',
    "  if(k&&k.h===H&&k.hn===(H?H.length:-1)&&", "  if(k&&"],
  saisie: ['src/planning.js', 'un jour d’un contrat archivé ne s’écrit plus (lecture seule)',
    "  return _planInContract(mbr,m,d)||_planJourCouvert(mbr,m,d);", "  return _planInContract(mbr,m,d);"],
  ligne: ['src/planning.js', 'cocher la ligne oublie les jours d’un contrat archivé',
    "  return _pl2DayCols().filter(function(d){return d!=null&&_planJourSaisissable(mbr,planMonth,d);});",
    "  return _pl2DayCols().filter(function(d){return d!=null&&_planInContract(mbr,planMonth,d);});"],
  solde: ['src/planning.js', 'le CDD suivi sans coupure ressort en « compteur soldé »',
    "    var allCtrs=(typeof window._mvChaines==='function')?(window._mvChaines(mbr)||[]):(window._mvPeriodes(mbr)||[]);",
    "    var allCtrs=window._mvPeriodes(mbr)||[];"],
  releve: ['src/planning.js', 'le relevé dit « même compteur » après un TESA',
    "      || window._mvAnnuType(P[i - 1].type) === window._mvAnnuType(", "      || true || window._mvAnnuType(P[i - 1].type) === window._mvAnnuType("],
  zero: ['src/reglages.js', 'l’historique redit « Coupure de 0 jour… soldé »', "      if(n>0)h+='<div class=\"emh-gap\">", "      h+='<div class=\"emh-gap\">"],
  effet: ['src/reglages.js', 'l’effet d’une embauche sans coupure annonce un compteur soldé',
    "    if(suit&&memeRegime){", "    if(false){"],
};

if (CONTRE) {
  console.log('\n── CHAINE-1 — contre-épreuve (un processus par défaut)\n');
  let tenues = 0, total = 0;
  for (const [cle, [f, quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++;
    const src = lire(f), n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-chaine1-')), fp = path.join(tmp, path.basename(f));
    fs.writeFileSync(fp, src.split(ancre).join(rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 180000,
      env: Object.assign({}, process.env, { MV_CHAINE1_VAR: cle, MV_CHAINE1_FICHIER: path.basename(f) + '=' + fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const vu = r.status !== 0, det = String(r.stdout || '').trim().split('\n').pop();
    if (vu) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.slice(0, 110) + ')' : '')); }
    else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`);
  process.exit(tenues === total ? 0 : 1);
}

const remplace = {};
if (process.env.MV_CHAINE1_FICHIER) { const v = process.env.MV_CHAINE1_FICHIER, i = v.indexOf('='); remplace[v.slice(0, i)] = v.slice(i + 1); }
const { chargerApp } = await import(pathToFileURL(path.join(R, 'scripts/mv-app-node.mjs')).href);
const A = await chargerApp({ remplace });
const { G, poser, setAuj, JOURNAL_ERR, ecran, viderEcran } = A;
let ok = 0, ko = 0;
const t = (x, c, d) => {
  if (c) { ok++; if (!VAR) console.log('  \x1b[32m✓\x1b[0m ' + x); }
  else { ko++; if (!VAR) console.log('  \x1b[31m✗\x1b[0m ' + x + (d !== undefined ? '\n      → ' + String(d).slice(0, 300) : '')); }
};
const essai = (x, f, d) => {
  let v; try { v = f(); } catch (e) { t(x + ' — plantage : ' + String(e && e.message).slice(0, 160), false); return; }
  let det; if (!v) { try { det = typeof d === 'function' ? d() : d; } catch (e) { det = String(e); } }
  t(x, !!v, det);
};

// ── Les fiches : chaque cas, et sa fiche de référence à un seul contrat ─────────
setAuj([2026, 10, 18]);
const emb = (d, type, fin) => Object.assign({ d, t: 'embauche', type }, fin ? { fin } : {});
const fiche = (nom, H) => ({ nom, statut: 'Actif', roles: ['ouvrier'], planning_id: 'standard', hist: H });
const FICHES = [
  fiche('Suivi', [emb('2026-03-01', 'CDD', '2026-08-31'), emb('2026-09-01', 'CDI')]),          // CDD → CDI, le lendemain
  fiche('Mars', [emb('2026-03-01', 'CDI')]),                                                     // la référence : un seul contrat dès mars
  fiche('Coupe', [emb('2026-03-01', 'CDD', '2026-06-15'), emb('2026-09-01', 'CDI')]),          // une coupure du 16 juin au 31 août
  fiche('Sept', [emb('2026-09-01', 'CDI')]),                                                     // la référence d'après coupure
  fiche('Tesa', [emb('2026-03-01', 'TESA', '2026-08-31'), emb('2026-09-01', 'CDI')]),          // payé à l'heure, puis CDI
  fiche('Mi', [emb('2026-03-01', 'CDD', '2026-11-15'), emb('2026-11-16', 'CDI')]),             // le changement au milieu du mois
  fiche('Chev', [emb('2026-03-01', 'CDD', '2026-12-31'), emb('2026-11-16', 'CDI')]),           // le CDI posé avant la fin prévue du CDD
];
FICHES.forEach(m => G._mvHistMirror(m));
// Une fiche jamais migrée : pas de journal, le contrat précédent dans contrats[].
FICHES.push({ nom: 'Ancien', statut: 'Actif', roles: ['ouvrier'], planning_id: 'standard', debut_contrat: '2026-09-01', fin_contrat: '', type_contrat: 'CDI',
  contrats: [{ debut: '2026-03-01', fin: '2026-08-31', type: 'CDD' }] });
poser({ membres: FICHES });
G.planSetYear(2026);
const mb = n => G.MEMBRES.find(m => m.nom === n);
const ch = n => G._mvChaines(mb(n)).map(c => [c.debut, c.fin, c.annu]);
const J = x => JSON.stringify(x);

// ── A. La chaîne ─────────────────────────────────────────────────────────────
if (!VAR) console.log('\n── A. La chaîne (utils.js)');
essai('un CDD suivi d’un CDI le lendemain : une seule chaîne, ouverte, depuis le 1er mars', () => J(ch('Suivi')) === J([['2026-03-01', '', true]]), () => J(ch('Suivi')));
essai('une coupure de deux mois et demi : deux chaînes', () => J(ch('Coupe')) === J([['2026-03-01', '2026-06-15', true], ['2026-09-01', '', true]]), () => J(ch('Coupe')));
essai('un TESA (payé à l’heure) puis un CDI sans coupure : deux chaînes, la première hors annualisation', () => J(ch('Tesa')) === J([['2026-03-01', '2026-08-31', false], ['2026-09-01', '', true]]), () => J(ch('Tesa')));
essai('un CDI posé avant la fin prévue du CDD (chevauchement) : une seule chaîne', () => ch('Chev').length === 1 && ch('Chev')[0][0] === '2026-03-01', () => J(ch('Chev')));
essai('une fiche jamais migrée (contrats[] + le couple) : une seule chaîne', () => J(ch('Ancien')) === J([['2026-03-01', '', true]]), () => J(ch('Ancien')));
essai('le lendemain d’un 30 juin, d’un 31 décembre ; un jour d’écart sépare', () => G._mvSuitSansCoupure({ fin: '2026-06-30' }, { debut: '2026-07-01' }) === true
  && G._mvSuitSansCoupure({ fin: '2026-12-31' }, { debut: '2027-01-01' }) === true && G._mvSuitSansCoupure({ fin: '2026-06-30' }, { debut: '2026-07-02' }) === false);

// ── B. Le compteur ───────────────────────────────────────────────────────────
if (!VAR) console.log('\n── B. Le compteur (planning.js)');
const inC = (n, mo, d) => G._planInContract(mb(n), mo, d);
essai('Suivi : le 15 août (CDD) est dans le compteur en cours ; le 15 février (avant l’embauche), non', () => inC('Suivi', 7, 15) === true && inC('Suivi', 1, 15) === false);
essai('Coupe : le 15 avril (contrat d’avant la coupure) n’est pas dans le compteur en cours ; le 15 septembre, si', () => inC('Coupe', 3, 15) === false && inC('Coupe', 8, 15) === true);
essai('Tesa : le 15 août (payé à l’heure) n’est pas dans le compteur du CDI', () => inC('Tesa', 7, 15) === false && inC('Tesa', 8, 15) === true);
essai('Mi : le 1er novembre (CDD, mois du changement) est dans le compteur', () => inC('Mi', 10, 1) === true);
const an = n => { const a = G._planAnnu(mb(n), 11); return J({ cumul: a.cumul, plafond: Math.round(a.plafond * 1000) / 1000, reste: Math.round(a.reste * 1000) / 1000 }); };
essai('l’année du CDD devenu CDI = celle d’un CDI depuis mars (cumul, plafond, reste)', () => an('Suivi') === an('Mars'), () => an('Suivi') + ' ≠ ' + an('Mars'));
essai('… idem pour la fiche jamais migrée, et pour le CDI posé avant la fin du CDD', () => an('Ancien') === an('Mars') && an('Chev') === an('Mars'), () => an('Ancien') + ' / ' + an('Chev'));
essai('après une coupure, l’année repart du CDI : = un CDI depuis septembre, comme avant', () => an('Coupe') === an('Sept'), () => an('Coupe') + ' ≠ ' + an('Sept'));
essai('après un TESA, l’année du CDI aussi : = un CDI depuis septembre', () => an('Tesa') === an('Sept'), () => an('Tesa') + ' ≠ ' + an('Sept'));
const mois = (n, m) => J(G._planSummary(mb(n), m));
essai('le mois du changement (novembre, CDI le 16) compte comme un mois standard : = novembre d’un CDI depuis mars', () => mois('Mi', 10) === mois('Mars', 10), () => mois('Mi', 10).slice(0, 200) + '\n   ≠ ' + mois('Mars', 10).slice(0, 200));
essai('… et le compteur de Mi sur l’année entière aussi', () => an('Mi') === an('Mars'), () => an('Mi') + ' ≠ ' + an('Mars'));
essai('un journal remplacé (une coupure d’un jour) se lit tout de suite : la mémoire ne garde pas l’ancienne réponse', () => {
  const m = mb('Suivi'); const avant = G._planInContract(m, 7, 15);
  const h0 = m.hist, d0 = m.debut_contrat;
  m.hist = [emb('2026-03-01', 'CDD', '2026-08-31'), emb('2026-09-02', 'CDI')]; G._mvHistMirror(m);
  const apres = G._planInContract(m, 7, 15);
  m.hist = h0; G._mvHistMirror(m);
  return avant === true && apres === false && G._planInContract(m, 7, 15) === true && m.debut_contrat === d0;
});
essai('… même quand seul le journal change (le CDD finit deux jours avant le CDI) : la mémoire suit le journal, pas seulement les dates du contrat en cours', () => {
  const m = mb('Suivi'); G._planInContract(m, 7, 15);
  const h0 = m.hist, c0 = m.contrats, d0 = m.debut_contrat;
  m.hist = [emb('2026-03-01', 'CDD', '2026-08-30'), emb('2026-09-01', 'CDI')];   // une coupure d'un jour, sans toucher au contrat en cours
  const apres = G._planInContract(m, 7, 15);
  m.hist = h0;
  return apres === false && m.contrats === c0 && m.debut_contrat === d0 && G._planInContract(m, 7, 15) === true;
});

// ── C. La saisie ─────────────────────────────────────────────────────────────
if (!VAR) console.log('\n── C. La saisie (planning.js)');
const ecrit = (n, mo, d) => { G.planGoMonth(mo); const r = G._planApplyHeures([n + '|' + d], { debut: '07:00', fin: '15:00' }); return r; };
essai('un jour du contrat archivé après une coupure (Coupe, 15 avril) s’écrit', () => { const r = ecrit('Coupe', 3, 15); return r.n === 1 && r.skip === 0 && !!((((G.PLANNING_ENTRIES.Coupe || {})[2026] || {})[3] || {})[15]); },
  () => J(ecrit('Coupe', 3, 15)));
essai('un jour du CDD devenu CDI (Suivi, 20 août) s’écrit', () => { const r = ecrit('Suivi', 7, 20); return r.n === 1 && r.skip === 0; });
essai('un jour de la coupure (Coupe, 20 juin) et d’avant l’embauche (Suivi, 15 février) ne s’écrivent pas', () => ecrit('Coupe', 5, 20).skip === 1 && ecrit('Suivi', 1, 15).skip === 1);
const ligne = (n, mo) => { G.pl2SetView('mo'); G.planGoMonth(mo); G.planSelClear(); G.planRowTap(n); const k = G._planSelKeys().length; G.planSelClear(); return k; };
essai('cocher la ligne de Coupe (vue du mois) coche ses 30 jours d’avril, et ses 15 jours de juin — pas la coupure', () => ligne('Coupe', 3) === 30 && ligne('Coupe', 5) === 15, () => ligne('Coupe', 3) + ' / ' + ligne('Coupe', 5));
const grille = mo => { G.pl2SetView('mo'); G.planGoMonth(mo); viderEcran(); G.renderPlanning(); return ecran(); };
essai('la grille d’avril : la case de Coupe est un bouton ordinaire (planCellTap), sans « lecture seule »', () => { const h = grille(3); return h.includes('data-cell="Coupe|15" onclick="planCellTap(\'Coupe\',15)"') && !/lecture seule/.test(h); });
essai('la grille d’août : la case du CDD de Suivi est un bouton ordinaire', () => { const h = grille(7); return h.includes('data-cell="Suivi|20" onclick="planCellTap(\'Suivi\',20)"') && !/lecture seule/.test(h); });
essai('la grille de juin : le 10 de Coupe est un bouton, le 20 (la coupure) reste un tiret', () => { const h = grille(5); return h.includes('data-cell="Coupe|10"') && !h.includes('data-cell="Coupe|20"') && h.includes('pl2c-hc'); });

// ── D. La fiche du salarié ───────────────────────────────────────────────────
if (!VAR) console.log('\n── D. La fiche du salarié (onglet Compteur)');
const compteur = n => { G.planGoMonth(10); viderEcran(); G.openPlanFiche(n); G.planFicheTab('hsup'); const h = ecran(); G.closePlanFiche(); return h; };
essai('Suivi : plus de « compteur soldé » pour le CDD — ses heures sont dans le compteur en cours', () => !/Compteur sold/.test(compteur('Suivi')) && /Compteur/.test(compteur('Suivi')));
essai('Coupe : le contrat d’avant la coupure garde sa carte « compteur soldé »', () => /Compteur sold/.test(compteur('Coupe')));
essai('Tesa : aucun compteur soldé pour un contrat payé à l’heure', () => !/Compteur sold/.test(compteur('Tesa')));
essai('le volet Jours de la fiche : chaque jour du CDD s’ouvre (planFicheOpenDay), aucun en lecture seule', () => {
  G.planGoMonth(7); viderEcran(); G.openPlanFiche('Suivi'); G.planFicheTab('jours'); const h = ecran(); G.closePlanFiche();
  return h.includes('onclick="planFicheOpenDay(20)"') && !/lecture seule/.test(h); });

// ── E. Le relevé ─────────────────────────────────────────────────────────────
if (!VAR) console.log('\n── E. Le relevé (les contrats de l’année)');
essai('Suivi : « se poursuit sans interruption · même compteur »', () => { const h = G._plRvContratsHtml(mb('Suivi')); return /se poursuit sans interruption/.test(h) && /même compteur/.test(h); });
essai('Tesa : sans interruption, mais « payé à l’heure avant · compteur à part »', () => { const h = G._plRvContratsHtml(mb('Tesa')); return /payé à l’heure avant · compteur à part/.test(h) && !/même compteur/.test(h); });

// ── F. Réglages › l'historique du salarié ────────────────────────────────────
if (!VAR) console.log('\n── F. Réglages (l’historique du salarié)');
const histo = n => { const el = G.document.getElementById('em-hist-wrap'); el.innerHTML = ''; G._emhRender(n); return el.innerHTML; };
essai('Suivi : plus de « Coupure de 0 jour » ; l’embauche du CDI dit « sans coupure : même compteur »', () => { const h = histo('Suivi'); return !/Coupure de 0/.test(h) && /sans coupure : même compteur/.test(h); }, () => histo('Suivi').slice(0, 600));
essai('Coupe : la vraie coupure garde son encart (« Coupure de 77 jours », le compteur soldé)', () => { const h = histo('Coupe'); return /Coupure de 77 jours/.test(h) && /soldé/.test(h) && !/sans coupure/.test(h); }, () => histo('Coupe').slice(0, 600));
const effet = (n, d, type) => { G._emhForm(n, 'embauche'); G._EMH.d = d; G._EMH.type = type; G._emhEff(); return G.document.getElementById('emh-eff').innerHTML; };
essai('une embauche en CDI le lendemain de la fin d’un CDD : « le même compteur continue », avant d’enregistrer', () => {
  const m = mb('Sept'), h0 = m.hist; m.hist = [emb('2026-03-01', 'CDD', '2026-10-31')]; G._mvHistMirror(m);
  const h = effet('Sept', '2026-11-01', 'CDI'); m.hist = h0; G._mvHistMirror(m);
  return /le même compteur continue/.test(h) && !/soldé/.test(h) && /CDD → CDI/.test(h); }, () => effet('Sept', '2026-11-01', 'CDI'));
essai('… et une embauche après une coupure dit toujours « Nouveau contrat », le compteur soldé', () => {
  const m = mb('Sept'), h0 = m.hist; m.hist = [emb('2026-03-01', 'CDD', '2026-10-31')]; G._mvHistMirror(m);
  const h = effet('Sept', '2026-11-10', 'CDI'); m.hist = h0; G._mvHistMirror(m);
  return /Nouveau contrat/.test(h) && /soldé/.test(h); });
essai('le choix « Embauche » le dit aussi : sans coupure, le même compteur continue', () => /Sans un jour de coupure \(un CDD qui devient CDI\), le m\\u00eame compteur continue/.test(lire('src/reglages.js')));

// ── G. Le branchement ────────────────────────────────────────────────────────
if (!VAR) console.log('\n── G. Le branchement');
const U = lire('src/utils.js'), GU = lire('guide/10-planning.html'), GR = lire('guide/12-reglages.html'), W = lire('src/whats-new.js'), L = lire('scripts/mv-harnais-liste.mjs');
t('l’aide du Planning dit la règle (sans coupure : un seul compteur ; les jours d’un contrat précédent se modifient)', /\['Un CDD devenu CDI', "[^"]*sans un jour de coupure[^"]*un seul compteur[^"]*se modifient/.test(U) && !/on les lit, on ne les modifie pas/.test(U));
t('le guide du Planning aussi, sans plus parler de lecture seule', /sans un jour de coupure/.test(GU) && /se modifient comme les autres/.test(GU) && !/on les lit, on ne les modifie pas/.test(GU));
t('le guide de Réglages : l’embauche sans coupure garde le même compteur', /sans un jour de coupure/.test(GR) && /même compteur/.test(GR));
const wn = W.slice(W.indexOf("  { v: '11.24',"), W.indexOf("  { v: '11.23',"));
t('l’annonce 11.24 le dit aux administrateurs, sans nommer personne', wn.length > 0 && /pour: \['admin'\]/.test(wn) && /CDD/.test(wn) && /CDI/.test(wn) && !/Rossignol|Alexandre/.test(wn));
t('ce harnais et ses contre-épreuves sont dans la liste', L.includes("['node scripts/mv-harnais-chaine1.mjs']") && L.includes("['node scripts/mv-harnais-chaine1.mjs --contre']"));
t('aucune erreur avalée pendant les essais', JOURNAL_ERR.length === 0, J(JOURNAL_ERR.slice(0, 3)));

console.log(VAR ? (ko ? 'ROUGE ' + ko : 'VERT') : `\n  ${ok} vert · ${ko} rouge\n`);
process.exit(ko ? 1 : 0);
