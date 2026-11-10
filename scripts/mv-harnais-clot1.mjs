#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — CLOT-1 (§557) : PASSER À LA PÉRIODE SUIVANTE SANS PERDRE LE TRAVAIL EN COURS
   Lancer : node scripts/mv-harnais-clot1.mjs          (le contrôle)
            node scripts/mv-harnais-clot1.mjs --contre  (chaque défaut reposé doit rougir)

   ══ POURQUOI ══
   Remonté du terrain le 10/11 : un domaine a clôturé sa période cinq jours avant sa fin et a vu toutes ses parcelles
   repartir de zéro. Rien n'était effacé (l'avancement de l'ancienne reste rangé sous son nom), mais trois défauts y
   menaient : toucher une période basculait toute l'équipe sans rien demander ; la clôture proposait la même période un an
   plus tard et ne contrôlait aucune date ; rien ne disait qu'une période court encore.

   ══ CE QU'IL TIENT (l'appli ENTIÈRE dans Node, mv-app-node) ══
     A. Toucher une période (Réglages › Campagne) DEMANDE : la confirmation dit l'effet, chiffres à l'appui ; « Juste la
        consulter » ne change que la période regardée ; « Rendre active » bascule, l'ancienne rangée sous son nom ; le
        retour se fait sans perte ; la période déjà active ne demande rien.
     B. L'écran de clôture d'une période qui court : la suivante commence le lendemain, nom et fin à saisir, un exemple en
        filigrane ; l'avertissement ; « Préparer sans clôturer » ; plus de « même période un an plus tard », plus de
        période passée à activer.
     C. L'étape 2 ne laisse passer ni nom vide, ni fin manquante, ni chevauchement, ni nom déjà pris ; la confirmation dit
        « Clôturer quand même » ; la période tapée s'affiche sous les dates.
     D. « Préparer sans clôturer » : la période naît inactive, avec la liste de travaux de l'actuelle ; rien d'archivé,
        rien d'activé.
     E. « Activer une préparée » la propose avec ses dates ; clôturer quand même bascule, photo comprise.
     F. _clotExec contrôle elle-même : appelée sans date de fin, ni photo ni bascule.
     G. Une période finie : ni avertissement, ni « Préparer », « Clôturer la campagne ».
   Contre-épreuve : chaque défaut est posé dans une copie HORS du dépôt et joué dans un processus à part — l'appli ne se
   charge qu'une fois par processus.
   ⚠️ CHEMINS : fileURLToPath.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const VAR = process.env.MV_CLOT1_VAR || '';
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const DEFAUTS = {
  toucher: ['src/reglages.js', 'toucher une période la rend de nouveau active sans rien demander',
    "el.addEventListener('click',function(){_perActiverDemande(window.SAISONS[+el.dataset.idx].nom);});",
    "el.addEventListener('click',function(){activateSaison(window.SAISONS[+el.dataset.idx].nom);});"],
  confirme: ['src/reglages.js', 'la demande bascule l’équipe avant la confirmation',
    '  var t=_perActiverTexte(nom, act, window.SAISONS, window.PARCELLES,',
    '  activateSaison(nom); var t=_perActiverTexte(nom, act, window.SAISONS, window.PARCELLES,'],
  anplus: ['src/reglages.js', 'la suivante redevient la même période un an plus tard',
    "return { nom:'', deb:_cmpISO(_cmpN(sa.fin)+1), fin:'' };",
    "return { nom:'', deb:String(parseInt(String(sa.debut).slice(0,4),10)+1)+String(sa.debut).slice(4), fin:'' };"],
  chevauche: ['src/reglages.js', 'des dates qui chevauchent une autre période passent', '    if(chev.length) return ', '    if(false) return '],
  porte: ['src/reglages.js', 'l’étape 2 laisse passer une saisie incomplète', 'if((_CLOT.step||1)===2){', 'if(false){'],
  exec: ['src/reglages.js', 'la clôture ne contrôle plus les dates avant d’archiver',
    "  if(_m){ if(window.showToast)showToast(_m,'#B85A1A'); return; }\n  _CLOT_EN_COURS = true;", '  _CLOT_EN_COURS = true;'],
  prepare: ['src/reglages.js', '« Préparer sans clôturer » rend la nouvelle période active',
    "  window.SAISONS.push({ nom:v.nom, periode:_nsPeriode(v.d0.v,v.f0.v), debut:v.d0.v, fin:v.f0.v, active:false, taches:_herit });",
    "  window.SAISONS.push({ nom:v.nom, periode:_nsPeriode(v.d0.v,v.f0.v), debut:v.d0.v, fin:v.f0.v, active:false, taches:_herit }); activateSaison(v.nom);"],
  court: ['src/reglages.js', 'l’écran ne dit plus qu’une période court encore', 'var court=!!(sa.fin&&auj&&auj<=String(sa.fin));', 'var court=false;'],
};

if (CONTRE) {
  console.log('\n── CLOT-1 — contre-épreuve (un processus par défaut)\n');
  let tenues = 0, total = 0;
  for (const [cle, [f, quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++;
    const src = lire(f), n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-clot1-')), fp = path.join(tmp, path.basename(f));
    fs.writeFileSync(fp, src.split(ancre).join(rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 180000,
      env: Object.assign({}, process.env, { MV_CLOT1_VAR: cle, MV_CLOT1_FICHIER: path.basename(f) + '=' + fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const vu = r.status !== 0, det = String(r.stdout || '').trim().split('\n').pop();
    if (vu) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.slice(0, 110) + ')' : '')); }
    else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`);
  process.exit(tenues === total ? 0 : 1);
}

const remplace = {};
if (process.env.MV_CLOT1_FICHIER) { const v = process.env.MV_CLOT1_FICHIER, i = v.indexOf('='); remplace[v.slice(0, i)] = v.slice(i + 1); }
const lireSrc = f => { const b = path.basename(f); return remplace[b] ? fs.readFileSync(remplace[b], 'utf8') : lire(f); };
const { chargerApp } = await import(pathToFileURL(path.join(R, 'scripts/mv-app-node.mjs')).href);
const A = await chargerApp({ remplace });
const { G, poser, setAuj, JOURNAL_ERR } = A;
let ok = 0, ko = 0;
const t = (x, c, d) => {
  if (c) { ok++; if (!VAR) console.log('  \x1b[32m✓\x1b[0m ' + x); }
  else { ko++; if (!VAR) console.log('  \x1b[31m✗\x1b[0m ' + x + (d !== undefined ? '\n      → ' + String(d).slice(0, 300) : '')); }
};
const essai = (x, f, d) => {
  let v; try { v = f(); } catch (e) { t(x + ' — plantage : ' + String(e && e.message).slice(0, 120), false); return; }
  let det; if (!v) { try { det = typeof d === 'function' ? d() : d; } catch (e) { det = String(e); } }
  t(x, !!v, det);
};
const el = id => G.document.getElementById(id);
const actNom = () => ((G.getSaisonActive && G.getSaisonActive()) || {}).nom;
const crais = () => (G.PARCELLES || []).find(p => p && p.nom === 'Les Crais');
const etape = () => [1, 2, 3].find(i => (el('clot-s' + i).style || {}).display === 'block') || 0;
// showToast est importée de utils.js par reglages.js : on lit ce qu'elle écrit (#mv-toast-msg).
const toasts = { vider() { el('mv-toast-msg').textContent = ''; }, lu() { return String(el('mv-toast-msg').textContent || ''); } };
// Posées par l'initialisation d'app.js, qui ne tourne pas dans Node : activateSaison les appelle en dernier.
if (typeof G.renderParcelles !== 'function') G.renderParcelles = () => {};
if (typeof G.computePStats !== 'function') G.computePStats = () => {};
let cap = null; G.openConfirmDel = (titre, sub, cb, icone, lib, coul, alt) => { cap = { titre, sub, cb, lib, alt }; };
const ce = G.document.createElement;
function ouvrir() {
  const cree = []; G.document.createElement = function () { const e = ce.apply(this, arguments); cree.push(e); return e; };
  try { G.openClotureFlow(); } catch (e) { t('l’écran de clôture s’ouvre — plantage : ' + String(e && e.message).slice(0, 120), false); }
  finally { G.document.createElement = ce; }
  return cree.map(e => e.innerHTML || '').join('\n');
}

if (!VAR) console.log('\n── CLOT-1 — passer à la période suivante sans perdre le travail en cours\n');
for (const f of ['_perActiverDemande', '_perActiverTexte', 'openClotureFlow', '_clotNext', '_clotSeg', '_clotPreparer', '_clotExec', '_switchSaison', '_visuSaison'])
  if (typeof G[f] !== 'function') t('0 la fonction ' + f + ' est posée sur window', false);

setAuj([2026, 10, 10]);   // mardi 10 novembre 2026 — « Automne 2026 » court jusqu'au 15
poser({
  config: { domaine_nom: 'Domaine fictif' },
  taches: [{ nom: 'Taille', hha: 70 }, { nom: 'Tirage', hha: 40 }, { nom: 'Ebourgeonnage', hha: 35, type: 'passages' }],
  saisons: [
    { nom: 'Printemps 2026', active: false, debut: '2026-03-01', fin: '2026-08-20', taches: ['Ebourgeonnage'] },
    { nom: 'Automne 2026', active: true, debut: '2026-09-16', fin: '2026-11-15', taches: ['Taille', 'Tirage'] },
  ],
  parcelles: [
    { nom: 'Les Crais', surface: 1.2, statut: 'Actif', taches: { Taille: 'Validé', Tirage: 'Validé' }, tachesAll: { 'Printemps 2026': { Ebourgeonnage: { p1: 'Validé', p2: 'Validé' } } }, _tachesSaison: 'Automne 2026' },
    { nom: 'Champ Franc', surface: 0.8, statut: 'Actif', taches: { Taille: 'Validé' }, tachesAll: {}, _tachesSaison: 'Automne 2026' },
  ],
  sessions: [],
  journal: [],
});

// ── A. Toucher une période ───────────────────────────────────────────────────
const ecoute = sansCom(lireSrc('src/reglages.js'));
t('A1 toucher une période de la liste appelle la demande, plus la bascule',
  /querySelectorAll\('\.sc-info'\)\.forEach\(function\(el\)\{\s*el\.addEventListener\('click',function\(\)\{_perActiverDemande\(window\.SAISONS\[\+el\.dataset\.idx\]\.nom\);\}\);/.test(ecoute)
  && !/el\.addEventListener\('click',function\(\)\{activateSaison\(/.test(ecoute));
essai('A2 la demande ouvre une confirmation — et rien n’a basculé', () => { G._perActiverDemande('Printemps 2026'); return !!cap && actNom() === 'Automne 2026' && crais().taches.Taille === 'Validé'; },
  () => JSON.stringify({ cap: !!cap, act: actNom() }));
essai('A3 elle dit l’effet, chiffres à l’appui', () => cap.titre === 'Rendre « Printemps 2026 » active\u00a0?'
  && cap.sub.includes('Toute l’équipe passera sur « Printemps 2026 » : les parcelles afficheront son avancement (1 travail noté).')
  && cap.sub.includes('Celui de « Automne 2026 » (3 travaux notés) reste rangé sous son nom : rien n’est effacé')
  && cap.sub.includes('« Automne 2026 » court encore jusqu’au 15 nov. 2026.')
  && cap.sub.includes('« Printemps 2026 » est finie depuis le 20 août 2026.')
  && !/undefined|NaN/.test(cap.titre + cap.sub), () => cap && (cap.titre + ' | ' + cap.sub));
essai('A4 « Juste la consulter » change la période regardée, pas celle de l’équipe', () => { cap.alt.cb(); return cap.alt.label === 'Juste la consulter, sur cet appareil' && G._visuSaison() === 'Printemps 2026' && actNom() === 'Automne 2026' && crais().taches.Taille === 'Validé'; },
  () => JSON.stringify({ vue: G._visuSaison(), act: actNom() }));
essai('A5 « Rendre active » bascule l’équipe — l’avancement de l’ancienne rangé sous son nom', () => { cap = null; G._perActiverDemande('Printemps 2026'); const lib = cap.lib; cap.cb(); const p = crais();
  return lib === 'Rendre active pour l’équipe' && actNom() === 'Printemps 2026' && p.tachesAll['Automne 2026'].Taille === 'Validé' && p.taches.Ebourgeonnage.p2 === 'Validé'; },
  () => JSON.stringify({ act: actNom(), p: crais() }).slice(0, 300));
essai('A6 et l’on revient sur « Automne 2026 » sans rien perdre', () => { cap = null; G._perActiverDemande('Automne 2026'); cap.cb(); const p = crais();
  return actNom() === 'Automne 2026' && p.taches.Taille === 'Validé' && p.taches.Tirage === 'Validé' && p.tachesAll['Printemps 2026'].Ebourgeonnage.p2 === 'Validé'; },
  () => JSON.stringify(crais()).slice(0, 300));
essai('A7 toucher la période déjà active ne demande rien', () => { cap = null; toasts.vider(); G._perActiverDemande('Automne 2026'); return cap === null && /est déjà la période active/.test(toasts.lu()); },
  () => toasts.lu());

// ── B. La clôture d'une période qui court encore ─────────────────────────────
G._switchSaison('Automne 2026', true);
const ecr = ouvrir();
t('B1 la suivante commence le lendemain de la fin (16 nov. 2026) ; le nom et la fin sont à saisir',
  /id="clot-deb" type="date" value="2026-11-16"/.test(ecr) && /id="clot-fin" type="date" value=""/.test(ecr) && /id="clot-name" value=""/.test(ecr),
  (ecr.match(/<input id="clot-[^>]*>/g) || []).join(' | ').slice(0, 400));
t('B2 un exemple de nom en filigrane, pas une proposition', /placeholder="ex\. Hiver 2026 – 2027"/.test(ecr), (ecr.match(/placeholder="[^"]*"/) || ['aucun'])[0]);
t('B3 l’écran dit que « Automne 2026 » court encore, et ce que la clôture ferait',
  /« Automne 2026 » n’est pas finie : elle court jusqu’au 15 nov\. 2026/.test(ecr) && /repartir les parcelles de zéro pour toute l’équipe/.test(ecr)
  && /Pas encore finie/.test(ecr) && !/belle campagne/.test(ecr), (ecr.match(/[^>]{0,60}court jusqu[^<]{0,80}/) || ['absent'])[0]);
t('B4 la confirmation porte « Préparer sans clôturer »', /id="clot-preparer"/.test(ecr) && /» sans clôturer<\/button>/.test(ecr));
t('B5 plus de « même période un an plus tard », plus de période passée à activer',
  !/décalée d’un an/.test(ecr) && !/<option value="Printemps 2026"/.test(ecr) && /Aucune période préparée après « Automne 2026 »/.test(ecr),
  (ecr.match(/<option[^<]*<\/option>/g) || []).join(' | ') || 'aucune option');

// ── C. On ne passe pas l'étape 2 sans un nom et des dates qui tiennent ───────
G._clotNext();
t('C0 « Continuer » mène à la prochaine période', etape() === 2, etape());
el('clot-name').value = ''; el('clot-deb').value = '2026-11-16'; el('clot-fin').value = '';
toasts.vider(); G._clotNext();
t('C1 sans nom : on reste à l’étape 2, et l’écran dit pourquoi', etape() === 2 && /Donnez un nom/.test(toasts.lu()), etape() + ' | ' + toasts.lu());
el('clot-name').value = 'Hiver 2026 – 2027'; toasts.vider(); G._clotNext();
t('C2 sans date de fin : refusé', etape() === 2 && /Début et fin obligatoires/.test(toasts.lu()), etape() + ' | ' + toasts.lu());
el('clot-fin').value = '2027-02-28'; el('clot-deb').value = '2026-11-01'; toasts.vider(); G._clotNext();
t('C3 des dates qui chevauchent « Automne 2026 » : refusées', etape() === 2 && /chevauchent Automne 2026/.test(toasts.lu()), etape() + ' | ' + toasts.lu());
el('clot-deb').value = '2026-11-16'; el('clot-name').value = 'automne 2026'; toasts.vider(); G._clotNext();
t('C4 un nom déjà pris (casse comprise) : refusé', etape() === 2 && /existe déjà/.test(toasts.lu()), etape() + ' | ' + toasts.lu());
el('clot-name').value = 'Hiver 2026 – 2027'; toasts.vider(); G._clotNext();
t('C5 un nom et des dates qui tiennent : la confirmation', etape() === 3 && !toasts.lu(), etape() + ' | ' + toasts.lu());
t('C6 elle dit « Clôturer quand même » et montre « Préparer sans clôturer »',
  el('clot-next').textContent === 'Clôturer quand même' && el('clot-preparer').style.display === 'block', el('clot-next').textContent + ' / ' + el('clot-preparer').style.display);
const note = el('clot-note').innerHTML || '';
t('C7 sous les dates : la période tapée', /Période : <b>nov\. 2026 – févr\. 2027<\/b>/.test(note), note.slice(0, 200));

// ── D. Préparer sans clôturer ────────────────────────────────────────────────
const H0 = JSON.stringify(G.HISTORIQUE || []);
const saves = []; G.saveData = k => { saves.push(k); };
toasts.vider();
try { G._clotPreparer(); } catch (e) { t('D0 la préparation passe — plantage : ' + e.message, false); }
const prep = (G.SAISONS || []).find(s => s && s.nom === 'Hiver 2026 – 2027');
t('D1 « Hiver 2026 – 2027 » est préparée, avec ses dates et la liste de travaux d’« Automne 2026 »',
  !!prep && prep.active === false && prep.debut === '2026-11-16' && prep.fin === '2027-02-28' && JSON.stringify(prep.taches) === JSON.stringify(['Taille', 'Tirage']), JSON.stringify(prep));
t('D2 « Automne 2026 » reste active, ses travaux à l’écran', actNom() === 'Automne 2026' && crais().taches.Taille === 'Validé', actNom());
t('D3 rien n’est archivé, seules les périodes sont enregistrées', JSON.stringify(G.HISTORIQUE || []) === H0 && saves.join() === 'saisons', saves.join());
t('D4 le message le dit', /est prête — « Automne 2026 » reste active jusqu’à sa clôture/.test(toasts.lu()), toasts.lu());

// ── E. Activer la préparée en clôturant quand même ───────────────────────────
const ecr2 = ouvrir();
t('E1 « Activer une préparée » la propose, avec ses dates',
  /<option value="Hiver 2026 – 2027">Hiver 2026 – 2027 · 16 nov\. 2026 → 28 févr\. 2027<\/option>/.test(ecr2), (ecr2.match(/<option[^<]*<\/option>/g) || []).join(' | ') || 'aucune option');
G._clotNext(); G._clotSeg('activate'); el('clot-prep').value = 'Hiver 2026 – 2027'; toasts.vider(); G._clotNext();
t('E2 la confirmation — sans « Préparer » (elle existe déjà), « Clôturer quand même »',
  etape() === 3 && el('clot-preparer').style.display === 'none' && el('clot-next').textContent === 'Clôturer quand même',
  etape() + ' / ' + el('clot-preparer').style.display + ' / ' + el('clot-next').textContent + ' / ' + toasts.lu());
G.fbSave = async () => ({ ok: true });
try { await G._clotExec(); } catch (e) { t('E3 la clôture passe — plantage : ' + e.message, false); }
t('E3 clôturer quand même : la préparée devient active, l’avancement d’« Automne 2026 » rangé sous son nom',
  actNom() === 'Hiver 2026 – 2027' && ((crais().tachesAll || {})['Automne 2026'] || {}).Taille === 'Validé' && !crais().taches.Taille, JSON.stringify(crais()).slice(0, 300));
t('E4 et sa photo est dans l’historique', (G.HISTORIQUE || []).some(h => h && h.saisonNom === 'Automne 2026'), (G.HISTORIQUE || []).map(h => h && h.saisonNom).join(', '));

// ── F. La clôture contrôle aussi elle-même ───────────────────────────────────
setAuj([2026, 10, 20]);
ouvrir(); G._clotNext();
el('clot-name').value = 'Printemps 2027'; el('clot-deb').value = '2027-03-01'; el('clot-fin').value = '';
const H1 = JSON.stringify(G.HISTORIQUE || []), a1 = actNom(); toasts.vider();
try { await G._clotExec(); } catch (e) { t('F1 plantage : ' + e.message, false); }
t('F1 appelée sans date de fin, la clôture refuse : ni photo, ni bascule',
  actNom() === a1 && JSON.stringify(G.HISTORIQUE || []) === H1 && /obligatoires/.test(toasts.lu()), actNom() + ' | ' + toasts.lu());

// ── G. Une période finie ─────────────────────────────────────────────────────
setAuj([2027, 2, 5]);   // 5 mars 2027 : « Hiver 2026 – 2027 » est finie
const ecr3 = ouvrir();
t('G1 une période finie : ni avertissement ni « Préparer », la suivante au lendemain',
  !/n’est pas finie/.test(ecr3) && !/id="clot-preparer"/.test(ecr3) && /belle campagne/.test(ecr3) && /id="clot-deb" type="date" value="2027-03-01"/.test(ecr3),
  (ecr3.match(/<input id="clot-deb[^>]*>/) || ['absent'])[0]);
G._clotNext(); el('clot-name').value = 'Printemps 2027'; el('clot-deb').value = '2027-03-01'; el('clot-fin').value = '2027-07-31'; toasts.vider(); G._clotNext();
t('G2 sa confirmation dit « Clôturer la campagne »', etape() === 3 && el('clot-next').textContent === 'Clôturer la campagne', etape() + ' / ' + el('clot-next').textContent + ' / ' + toasts.lu());
t('H1 aucune erreur avalée dans la clôture ni dans la demande',
  !JOURNAL_ERR.some(e => /reglages\.js|_clot|_perAct|_perNb|_perBloc/.test(String(e && e.msg))), JOURNAL_ERR.map(e => e.msg).join(' | ').slice(0, 300));

if (!VAR) console.log(`\n  ${ok} vertes, ${ko} rouge(s)\n`);
else console.log(ko ? 'rouge : ' + ko : 'vert');
process.exit(ko ? 1 : 0);
