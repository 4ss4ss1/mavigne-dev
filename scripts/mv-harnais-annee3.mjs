/* ───────────────────────────────────────────────────────
   HARNAIS — ANNEE-3 (§614) : PLANNING › ANNÉE, PLUS DE « − / + »
   Lancer :          node scripts/mv-harnais-annee3.mjs
   Contre-épreuves : node scripts/mv-harnais-annee3.mjs --contre

   POURQUOI IL EXISTE
   La maquette v3 (« impeccable », 26/11) remplace les « − / + » du panneau par une grille des jours (lundi à dimanche, la
   semaine A et la B) et le choix d'une durée (repos, 4, 7, 7,5, 8, 8,5 ou une autre), et fait de la prise de poste et du
   début d'une saison des champs. Ce harnais joue les VRAIES fonctions (src/planning-annee.js, src/planning-annee-vue.js,
   _feriesY de src/planning.js) sur la VRAIE grille 2026 du modèle « standard », et tient :
     ① la grille : sept cases par semaine, l'ancre du vendredi, le choix sous la case touchée (six durées et « Autre durée »,
        l'ancre des tutos sur la durée voisine) ; nulle part dans le panneau un « − / + » ;
     ② une durée choisie va à TOUS les jours réguliers de ce jour-là dans la saison (pas aux jours à part), au quart d'heure ;
        hors du cadre (moins de 3 h 30 travaillées, plus que le maximum d'un jour, n'importe quoi) : refusée, un mot, pas de
        brouillon ; la même : pas de brouillon ;
     ③ « Changer le rythme » : de la semaine choisie à la fin de la saison, pas avant ; un jour à part : lui seul ;
     ④ la prise de poste : l'heure tapée va aux mois de la saison (bornée de 4 h à 12 h), la même ne fait pas de brouillon ;
        celle d'un jour se pose, et revenue à l'heure de sa saison, le jour n'est plus « décalé » ;
     ⑤ le début d'une saison : la liste de ses lundis (bornée), le lundi choisi déplace la coupe ; des jours pareils ne font
        pas de brouillon ;
     ⑥ les champs : une heure tapée au clavier attend la sortie du champ ; « Autre durée » sa validation ; la liste, son choix ;
        refusée, la valeur revient ; le rendu attend la fin du geste en cours ;
     ⑦ « une semaine sur deux » : l'interrupteur ouvre la B sans brouillon, la ferme sans brouillon si elle n'a pas été réglée ;
     ⑧ le panneau ne réécrit que ce qui change, et ne rend le focus qu'à une liste ; la feuille : 44 px au téléphone, 36 dès 768.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const sansPonts = (t) => t.replace(/^function (\w+)\(\)\{ return window\.\1\.apply\(null, arguments\); \}$/gm, '');
const S0 = { pl: lire('src/planning.js'), an: lire('src/planning-annee.js'), vu: lire('src/planning-annee-vue.js'), css: lire('src/annee.css'), tu: lire('src/tutos.js') };

function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
const ligneVar = (src, nom) => { const m = new RegExp('^var ' + nom + '=.*$', 'm').exec(src); if (!m) throw new Error('VAR ABSENTE : ' + nom); return m[0]; };
const NOMS = ['_paH', '_paHm', '_paMinT', '_paHHMM', '_planAnneeSaison', '_planAnneeLire', '_planAnneeDate', '_planAnneePlage', '_planAnneeResumeTxt', '_planAnneeResumeAB',
  '_planAnneeCopie', '_planAnneePose', '_planAnneeGrille', '_planAnneeMeta', '_planAnneeMetaCopie', '_planAnneeMetaEd', '_planAnneeBrouillon', '_planAnneeSemDefaut', '_planAnneeSemSel',
  '_planAnneeCible', '_planAnneeTotal', '_planAnneeCleS', '_planAnneePriseSaison', '_planAnneeHoraire', '_planAnneeHorairesTxt', '_planAnneeReguliers', '_planAnneePasVal', '_planAnneeVal',
  'planAnneePas', 'planAnneeJour', 'planAnneeDesIci', 'planAnneePrise', 'planAnneePriseJour', 'planAnneeCoupe', 'planAnneeAB', 'planAnneeUneSemaine',
  '_anvP', '_anvSom', '_anvRythme', '_anvParSem', '_anvCtx', '_anvSec', '_anvDec', '_anvHHMM', '_anvIso', '_anvMemeCel', '_anvCel', '_anvGrille', '_anvChoix', '_anvHeure',
  '_anvDebut', '_anvJourEd', '_anvPanSaison', '_anvPanSemaine', '_anvPanJours', 'planAnneeCel', 'planAnneeVal', 'planAnneeChamp', 'planAnneeBascule', '_planAnneeTuto', '_anvApres', '_anvAppuiEcoute'];

function monter(S, o) {
  const i0 = S.pl.indexOf('var PLAN_DEF = {'), j0 = S.pl.indexOf('};', i0);
  const PLAN_DEF = vm.runInNewContext('(' + S.pl.slice(i0 + 15, j0 + 1) + ')');
  const appels = [], toasts = [], rendus = [], minuteries = [];
  const ctx = vm.createContext({ window: { PLAN_MOIS: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'], PLANNING_ENTRIES: {},
      PLAN_PAUSE_MIN: 60, showToast: (m) => toasts.push(m) },
    _MV_FERIES_CACHE: {}, console, Date, setTimeout: (f) => minuteries.push(f) });
  ctx._E = o.E; ctx._rendus = rendus; ctx._saved = JSON.parse(JSON.stringify(PLAN_DEF.standard));
  ctx._planGetTpl = (pl, y) => (pl === 'standard' && y === 2026) ? ctx._saved : {};
  const AN = sansPonts(S.an), VU = sansPonts(S.vu), SRC = AN + '\n' + VU;
  const pre = 'function _paE(){return _E;}\nfunction _pY(){return 2026;}\nfunction isAdmin(){return true;}\n'
    + 'function _planLegal(){return {maxJour:10,maxHebdo:48,maxMoy:44,modulMax:250,hebdoLeg:35,plafAnnuel:1607};}\n'
    + 'function _planBaseActive(){return false;}\nfunction _planBaseAttendue(){return 1600;}\nfunction _planCreditFerie(){return 0;}\n'
    + 'function _planModelBrut(id,yr,G){var t=0;for(var m=0;m<12;m++)for(var k in (G[m]||{}))t+=parseFloat(G[m][k])||0;return t;}\n'
    + 'function _planMbrs(){return [];}\nfunction _planPlId(m){return "standard";}\nfunction _planModeles(){return ["standard"];}\n'
    + 'function _planSolidJour(){return null;}\nfunction _escHtml(s){return String(s);}\nfunction _escAttr(s){return String(s).replace(/"/g,"&quot;");}\n'
    + 'function _mvInfoSet(){}\nfunction _mvInfoBtn(k){return "<button class=\\"mv-i\\" data-mvi=\\""+k+"\\"></button>";}\n'
    + 'function _planAnneeFerieSem(){return "[ferie]";}\nfunction _planRenderAnnee(){if(_anvTenir)return;_rendus.push(1);}\n';
  vm.runInContext(pre + fonction(S.pl, '_mvEasterMD') + '\n' + fonction(S.pl, '_feriesY') + '\n' + ligneVar(AN, 'PLAN_MOIS_FR') + '\nwindow.PLAN_MOIS_FR=PLAN_MOIS_FR;\n'
    + ligneVar(VU, 'ANV_OV') + '\n' + ligneVar(VU, 'ANV_CHOIX') + '\n' + ligneVar(VU, '_anvTenir') + '\n'
    + NOMS.map((n) => fonction(SRC, n)).join('\n') + '\nthis.f={' + NOMS.join(',') + '};', ctx);
  ['planAnneePas', 'planAnneeJour', 'planAnneeDesIci', 'planAnneePrise', 'planAnneePriseJour', 'planAnneeCoupe', 'planAnneeAB', 'planAnneeUneSemaine'].forEach((n) => { ctx.window[n] = ctx.f[n]; });
  return { F: ctx.f, ctx, toasts, rendus, minuteries };
}
const G0 = (F) => F._planAnneeGrille();
const jours = (A, f) => A.J.filter(f);

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };

  // ① la grille
  essai('① la saison : une grille de sept cases, l’ancre au vendredi ; la case touchée ouvre le choix (six durées, « Autre durée »)', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); let p = F._anvPanSaison(F._anvCtx(E), 0);
    const cases = (p.c.match(/<button type="button" class="anv-cel[^"]*" data-k="s"/g) || []).length;
    F.planAnneeCel({ dataset: { k: 's', s: '0', l: '', g: '4' } }); p = F._anvPanSaison(F._anvCtx(E), 0);
    const chips = (p.c.match(/class="anv-chip/g) || []).length, voisine = /data-v="7" data-tuto="plan\.annee\.val"/.test(p.c);
    return [cases === 7 && p.c.includes('data-g="4" data-tuto="plan.annee.cel"') && chips === 6 && voisine && /data-f="autre"/.test(p.c) && E.cel && E.cel.k === 's', cases + ' cases, ' + chips + ' durées, voisine de 4 : 7 ' + voisine];
  });
  essai('① nulle part dans le panneau un « − / + » : la saison, la semaine (et son rythme), les jours à part', () => {
    const E = { annee: 'standard', pan: { t: 'w' } }; const { F } = monter(S, { E }); const C = F._anvCtx(E);
    const h = F._anvPanSaison(C, 0).c + F._anvPanSaison(C, 1).c + F._anvPanSemaine(C).c + F._anvPanJours(C).c;
    const pm = (h.match(/>\s*[\u2212+]\s*<\/button>/g) || []).length;
    return [pm === 0 && !/onclick="planAnnee(Pas|Jour|DesIci|Prise|PriseJour|Coupe)\(/.test(h) && (h.match(/data-k="r"/g) || []).length === 7, pm + ' « − / + »'];
  });
  // ② une durée choisie
  essai('② « 7 » sur le vendredi de la première saison : tous ses vendredis réguliers, aucun jour à part, un brouillon', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); const A0 = F._planAnneeLire('standard', 2026, G0(F)), S0x = A0.saisons[0];
    const reg = F._planAnneeReguliers(A0, 0, 4, ''); E.cel = { k: 's', s: '0', l: '', g: '4' };
    F.planAnneeVal({ dataset: { v: '7' } });
    const G = E.brouillon, tous = reg.every((x) => G[x.m][x.d] === 7), autres = jours(A0, (x) => !reg.includes(x)).every((x) => (parseFloat((G[x.m] || {})[x.d]) || 0) === x.h);
    return [E.n === 1 && reg.length > 4 && tous && autres && S0x.h[4] === 4, reg.length + ' vendredis'];
  });
  essai('② hors du cadre : 2 h, 11 h, −1, « abc » refusés (un mot, pas de brouillon) ; 7,3 devient 7,25 ; la même durée, rien', () => {
    const E = { annee: 'standard', cel: { k: 's', s: '0', l: '', g: '4' } }; const { F, toasts } = monter(S, { E });
    ['2', '11', '-1', 'abc'].forEach((v) => F.planAnneeVal({ dataset: { v } }));
    F.planAnneePas({ dataset: { s: '0', g: '4', l: '', v: '2' } }); F.planAnneeJour({ dataset: { m: '1', j: '6', v: '3' } });   // le geste lui-même tient le cadre, sans le choix
    const refus = toasts.length === 4 && !E.brouillon && !E.n;
    F.planAnneeVal({ dataset: { v: '4' } }); const meme = !E.brouillon;
    F.planAnneeVal({ dataset: { v: '7,3' } }); const reg = F._planAnneeReguliers(F._planAnneeLire('standard', 2026, E.brouillon), 0, 4, '');
    return [refus && meme && E.n === 1 && reg.length > 4 && reg.every((x) => E.brouillon[x.m][x.d] === 7.25), toasts.join(' | ')];
  });
  // ③ le rythme, un jour
  essai('③ « Changer le rythme » : le lundi, de la semaine choisie à la fin de la saison — rien avant ; un lundi hors de la saison : pas de brouillon', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); const A0 = F._planAnneeLire('standard', 2026, G0(F));
    const w = A0.J.find((x) => x.m === 1 && x.d === 9).w, si = A0.J.find((x) => x.m === 1 && x.d === 9).s, deb = A0.sem[w].j[0].i;
    E.cel = { k: 'r', w: String(w), g: '0' }; F.planAnneeVal({ dataset: { v: '8' } });
    const G = E.brouillon, ap = jours(A0, (x) => x.s === si && x.g === 0 && !x.fer && !x.ferme && !x.apart && x.h === A0.saisons[si].h[0]);
    const ok = ap.every((x) => (x.i >= deb ? G[x.m][x.d] === 8 : G[x.m][x.d] === x.h));
    const E2 = { annee: 'standard' }; const m2 = monter(S, { E: E2 }); const A2 = m2.F._planAnneeLire('standard', 2026, G0(m2.F)), wF = A2.saisons[0] ? A2.J.filter((x) => x.s === 0).slice(-1)[0].w : 0;
    E2.cel = { k: 'r', w: String(wF + 1), g: '5' }; m2.F.planAnneeVal({ dataset: { v: '0' } });
    return [ok && ap.some((x) => x.i < deb) && ap.some((x) => x.i >= deb) && E.n === 1 && !E2.brouillon, ap.length + ' lundis'];
  });
  essai('③ un jour à part : lui seul prend la durée', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); const A0 = F._planAnneeLire('standard', 2026, G0(F)), x = A0.jours[0];
    E.cel = { k: 'j', m: String(x.m), j: String(x.d) }; F.planAnneeVal({ dataset: { v: '7' } });
    const G = E.brouillon, diff = A0.J.filter((y) => (parseFloat((G[y.m] || {})[y.d]) || 0) !== y.h);
    return [diff.length === 1 && diff[0] === x && G[x.m][x.d] === 7, diff.length + ' jour(s)'];
  });
  // ④ la prise de poste
  essai('④ la prise d’une saison : l’heure tapée va à ses mois (bornée de 4 h à 12 h) ; la même, pas de brouillon', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); const A0 = F._planAnneeLire('standard', 2026, G0(F)), S0x = A0.saisons[0];
    const av = F._planAnneePriseSaison(A0, 0, F._planAnneeMeta(E)); F.planAnneePrise({ dataset: { s: '0', t: F._anvHHMM(av) } }); const meme = !E.brouillon && !E.n;
    F.planAnneePrise({ dataset: { s: '0', t: '06:30' } }); const mois = []; for (let m = S0x.m0; m <= S0x.m1; m++) mois.push(E.meta._timings[m] && E.meta._timings[m].d);
    F.planAnneePrise({ dataset: { s: '0', t: '03:00' } });
    return [meme && mois.every((d) => d === '06:30') && !E.meta._timings[S0x.m1 + 1] && E.meta._timings[S0x.m0].d === '04:00' && E.n === 2, mois.join(',')];
  });
  essai('④ la prise d’un jour : elle se pose ; revenue à l’heure de sa saison, le jour n’est plus « décalé »', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); const A0 = F._planAnneeLire('standard', 2026, G0(F)), x = A0.J.find((y) => y.m === 1 && y.g === 1 && y.h > 0 && !y.fer);
    const sais = F._anvHHMM(F._planAnneeHoraire(F._planAnneeMeta(E), x.m, x.d, x.h).d);
    F.planAnneePriseJour({ dataset: { m: String(x.m), j: String(x.d), t: '09:15' } }); const pose = E.meta._timings_jour[x.m][x.d] && E.meta._timings_jour[x.m][x.d].d === '09:15';
    F.planAnneePriseJour({ dataset: { m: String(x.m), j: String(x.d), t: sais } }); const retire = !(E.meta._timings_jour[x.m] && E.meta._timings_jour[x.m][x.d]);
    return [pose && retire && E.n === 2, sais];
  });
  // ⑤ le début d'une saison
  essai('⑤ le début de la deuxième saison : la liste de ses lundis (et son début d’aujourd’hui), bornée ; le lundi d’avant déplace la coupe', () => {
    const E = { annee: 'standard', pan: { t: 's', si: 1 } }; const { F } = monter(S, { E }); const C = F._anvCtx(E), A0 = C.A;
    const a = A0.J.find((x) => x.s === 1 && !x.ferme && !x.apart), h = F._anvDebut(C, 1, a.i);
    const opts = [...h.matchAll(/<option value="([\d-]+)"( selected)?>([^<]*)</g)];
    const lundis = opts.filter((o) => !o[2]).every((o) => /^lun\./.test(o[3])), sel = opts.filter((o) => o[2]);
    const avant = opts[opts.findIndex((o) => o[2]) - 1][1];
    F.planAnneeCoupe({ dataset: { s: '1', iso: avant } });
    const A1 = F._planAnneeLire('standard', 2026, E.brouillon), b1 = A1.J.find((x) => x.s === 1 && !x.ferme && !x.apart);
    return [opts.length > 3 && lundis && sel.length === 1 && sel[0][1] === F._anvIso(2026, a) && E.n === 1 && F._anvIso(2026, b1) <= avant && b1.i < a.i && F._planAnneeTuto('deb') === F._anvIso(2026, a),
      opts.length + ' choix, ' + sel[0][1] + ' → ' + F._anvIso(2026, b1)];
  });
  essai('⑤ un lundi qui ne change rien (des jours pareils, de repos) : pas de brouillon', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E }); const A0 = F._planAnneeLire('standard', 2026, G0(F)), a = A0.J.find((x) => x.s === 1 && !x.ferme && !x.apart);
    const lun = A0.J.find((x) => x.i > a.i && x.g === 0); const ok = A0.J.slice(a.i, lun.i).every((x) => !(x.h > 0) || x.fer);
    F.planAnneeCoupe({ dataset: { s: '1', iso: F._anvIso(2026, lun) } });
    return [!ok || (!E.brouillon && !E.n), a.d + '/' + (a.m + 1) + ' → ' + lun.d + '/' + (lun.m + 1)];
  });
  // ⑥ les champs
  essai('⑥ une heure tapée au clavier attend la sortie du champ ; la sortie l’enregistre ; le rendu attend son tour', () => {
    const E = { annee: 'standard' }; const { F, rendus, minuteries } = monter(S, { E });
    const el = { dataset: { f: 'prise', s: '0' }, type: 'time', value: '06:45', defaultValue: '08:00' };
    F.planAnneeChamp(el, { type: 'keydown', key: '0' }); F.planAnneeChamp(el, { type: 'input' }); F.planAnneeChamp(el, { type: 'change' });
    const attend = !E.n && el._clavier === true;
    F.planAnneeChamp(el, { type: 'blur' }); const fait = E.n === 1 && rendus.length === 0 && minuteries.length === 1;
    minuteries[0](); return [attend && fait && rendus.length === 1, 'n ' + E.n + ', rendus ' + rendus.length];
  });
  essai('⑥ sans clavier (une roue, un tuto), l’heure s’enregistre tout de suite ; « Autre durée » à sa validation ; la liste, à son choix', () => {
    const E = { annee: 'standard', cel: { k: 's', s: '0', l: '', g: '4' } }; const { F } = monter(S, { E });
    F.planAnneeChamp({ dataset: { f: 'prise', s: '0' }, type: 'time', value: '06:15' }, { type: 'input' }); const roue = E.n === 1;
    const au = { dataset: { f: 'autre' }, tagName: 'INPUT', type: 'number', value: '7.5', defaultValue: '4' };
    F.planAnneeChamp(au, { type: 'input' }); const tape = E.n === 1; F.planAnneeChamp(au, { type: 'change' }); const valide = E.n === 2;
    F.planAnneeChamp({ dataset: { f: 'debut', s: '1' }, tagName: 'SELECT', type: 'select-one', value: '2026-02-23', options: [] }, { type: 'input' });
    return [roue && tape && valide && E.n === 3, 'n ' + E.n];
  });
  essai('⑥ refusée (2 h), la valeur du champ revient ; un mot le dit', () => {
    const E = { annee: 'standard', cel: { k: 's', s: '0', l: '', g: '4' } }; const { F, toasts } = monter(S, { E });
    const au = { dataset: { f: 'autre' }, tagName: 'INPUT', type: 'number', value: '2', defaultValue: '4' }; F.planAnneeChamp(au, { type: 'change' });
    return [au.value === '4' && toasts.length === 1 && !E.n, au.value + ' | ' + toasts.join('')];
  });
  // ⑦ une semaine sur deux
  essai('⑦ l’interrupteur ouvre la semaine B sans brouillon ; refermé sans l’avoir réglée, rien ; réglée (« Repos »), il la rend à la A', () => {
    const E = { annee: 'standard' }; const { F } = monter(S, { E });
    F.planAnneeBascule({ dataset: { s: '0' } }); const ouverte = !E.brouillon && E.ab && Object.keys(E.ab).length === 1;
    let p = F._anvPanSaison(F._anvCtx(E), 0); const deux = (p.c.match(/data-k="s"/g) || []).length === 14 && p.c.includes('data-tuto="plan.annee.ab1"') && p.c.includes('data-tuto="plan.annee.abcel"');
    F.planAnneeBascule({ dataset: { s: '0', on: '1' } }); const fermee = !E.brouillon && !Object.keys(E.ab).length;
    F.planAnneeBascule({ dataset: { s: '0' } }); E.cel = { k: 's', s: '0', l: 'B', g: '4' }; F.planAnneeVal({ dataset: { v: '0' } });
    const alterne = F._planAnneeLire('standard', 2026, E.brouillon).saisons[0].ab;
    F.planAnneeBascule({ dataset: { s: '0', on: '1' } }); const rendue = !F._planAnneeLire('standard', 2026, E.brouillon).saisons[0].ab && E.n === 2;
    return [ouverte && deux && fermee && alterne && rendue, [ouverte, deux, fermee, alterne, rendue].join(',')];
  });
  // ⑧ le panneau, la feuille
  T('⑧ le panneau ne réécrit que ce qui change (en-tête, contenu, pied) et ne rend le focus qu’à une liste',
    /if\(hd\._anv!==H\)\{hd\.innerHTML=H;hd\._anv=H;\}/.test(S.vu) && /if\(c\._anv!==r\.c\)\{/.test(S.vu) && /if\(pd&&pd\._anv!==P\)\{pd\.innerHTML=P;pd\._anv=P;\}/.test(S.vu)
    && /gk=\(ae&&ae\.tagName==='SELECT'&&c\.contains\(ae\)\)/.test(S.vu));
  T('⑧ le rendu attend un champ quitté (_anvTenir) ; s’il vient d’un appui, il attend le clic ; le panneau ouvert suit les appuis', /^function _planRenderAnnee\(\)\{\n  if\(_anvTenir\)return;/m.test(S.vu) && /document\.addEventListener\('click',go\);setTimeout\(go,1500\);/.test(S.vu)
    && /_anvOv\(\);_anvAppuiEcoute\(\);_planRenderAnnee\(\);/.test(fonction(S.vu, '_anvOuvrir')));
  T('⑧ la feuille : les cases et les durées à 44 px au téléphone, 36 dès 768 px ; le choix en six colonnes ; aucune couleur en dur hors des replis',
    /\.anv-ov \.anv-cel\{[^}]*height:44px/.test(S.css) && /\.anv-ov \.anv-chip\{[^}]*height:44px/.test(S.css) && /@media \(min-width:768px\)\{\n  \.anv-ov \.anv-cel, \.anv-ov \.anv-chip, \.anv-ov \.anv-cel-v\{ height:36px; \}/.test(S.css)
    && S.css.includes('.anv-ov .anv-choix-l{ display:grid; grid-template-columns:repeat(6,minmax(0,1fr));')
    && (() => { const a = S.css.indexOf('★★ ANNEE-3 (§614)'), b = S.css.indexOf('/* ★ FIN ANNEE-3 */'); return a >= 0 && b > a && !/#[0-9a-fA-F]{3,6}\b/.test(S.css.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, '').replace(/var\(--[\w-]+,[^()]*(\([^()]*\))?[^()]*\)/g, '')); })());
  T('⑧ les tutos des champs : chaque exemple se lit à l’écran, et la valeur ENREGISTRÉE ne vaut pas réponse',
    /get exemple\(\) \{ var s = _q\('\[data-tuto="plan\.annee\.coupe"\]'\), r = window\._planAnneeTuto && window\._planAnneeTuto\('deb'\)/.test(S.tu)
    && (S.tu.match(/get exemple\(\) \{ var q = String\(\(window\._planAnneeTuto && window\._planAnneeTuto\('prj?'\)\)/g) || []).length === 2   // l'exemple part de la valeur enregistrée : le moteur vide le champ avant de lire l'exemple
    && (S.tu.match(/window\._planAnneeTuto\('(deb|pr|prj)'\); return [^;]*String\(x\)(\.slice\(0, 5\))? !== r;/g) || []).length === 3);
  return out;
}

if (!CONTRE) {
  console.log('\n── ANNEE-3 — Planning › Année, plus de « − / + »\n');
  const r = suite(S0); let ko = 0;
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 400) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['un « + » revient dans la grille', sur('vu', "+'<span class=\"anv-gr-tt\">'", "+'<button>+</button><span class=\"anv-gr-tt\">'")],
    ['la durée ne va qu’à la case touchée', sur('an', 'R.forEach(function(x){_planAnneePose(G,x.m,x.d,nv);});', 'R.slice(0,1).forEach(function(x){_planAnneePose(G,x.m,x.d,nv);});')],
    ['le jour réduit n’est plus refusé', sur('an', '(nv>0&&nv<3.5)||nv>_planLegal().maxJour)return null;', 'nv>_planLegal().maxJour)return null;')],
    ['le choix laisse passer 2 h', sur('vu', "if(v>0&&v<3.5)return non(", "if(false)return non(")],
    ['« Changer le rythme » part du début de la saison', sur('an', 'if(x.i>=debut&&x.s===si&&x.g===g', 'if(x.s===si&&x.g===g')],
    ['la prise d’une saison n’est plus bornée', sur('an', "nv=ds.t?_paHHMM(_paMinT(ds.t)):", "nv=ds.t?String(ds.t):")],
    ['la prise revenue à la saison reste « décalée »', sur('an', 'if(nv!=null&&sais&&nv===_paHHMM(_paMinT(sais.d)))nv=null;', '')],
    ['la liste des débuts offre tous les jours', sur('vu', 'if(x.i!==a&&(x.g!==0||P<0', 'if(x.i!==a&&(P<0')],
    ['un lundi qui ne change rien fait un brouillon', sur('an', "if(!n){_planRenderAnnee();return;}   // des jours pareils", "if(false){_planRenderAnnee();return;}   // des jours pareils")],
    ['une heure tapée s’enregistre à chaque morceau', sur('vu', "&&(foc||el._clavier))return;", "&&foc)return;")],
    ['« Autre durée » s’enregistre à chaque chiffre', sur('vu', "if(f==='autre'&&t&&t!=='change')return;", '')],
    ['refusée, la valeur reste', sur('vu', 'else el.value=el.defaultValue;}', '}')],
    ['les appuis ne sont jamais suivis', sur('vu', "_anvOv();_anvAppuiEcoute();_planRenderAnnee();", "_anvOv();_planRenderAnnee();")],
    ['le rendu n’attend plus le champ quitté', sur('vu', 'function _planRenderAnnee(){\n  if(_anvTenir)return;', 'function _planRenderAnnee(){\n  if(false)return;')],
    ['l’interrupteur fait un brouillon pour rien', sur('vu', "if(!S.ab){if(E.ab)delete E.ab[_planAnneeCleS(A,si)];_planRenderAnnee();return;}", '')],
    ['le panneau rend le focus à un champ heure', sur('vu', "gk=(ae&&ae.tagName==='SELECT'&&c.contains(ae))", "gk=(ae&&c.contains(ae))")],
    ['une couleur écrite en dur dans le bloc', sur('css', '.anv-ov .anv-chip.on{ border-color:var(--accent,#7A2850); background:var(--accent,#7A2850);', '.anv-ov .anv-chip.on{ border-color:#7A2850; background:var(--accent,#7A2850);')],
    ['un tuto accepte la valeur enregistrée', sur('tu', "window._planAnneeTuto('pr'); return /^\\d{2}:\\d{2}/.test(String(x || '')) && !!r && String(x).slice(0, 5) !== r;", "window._planAnneeTuto('pr'); return /^\\d{2}:\\d{2}/.test(String(x || ''));")],
  ];
  let ok = 0;
  for (const [n, f] of mutants) { let rouge = false, d = ''; try { rouge = suite(f(S0)).some((x) => !x[1]); } catch (e) { d = e.message; }
    if (rouge) ok++; console.log('  ' + (rouge ? '\x1b[32m✓\x1b[0m rougit' : '\x1b[31m✗\x1b[0m NE ROUGIT PAS') + ' : ' + n + (d ? ' (' + d + ')' : '')); }
  console.log('\n' + (ok === mutants.length ? '\x1b[32mVERT\x1b[0m — ' + ok + '/' + mutants.length + ' contre-épreuves rougissent' : '\x1b[31mROUGE\x1b[0m — ' + (mutants.length - ok) + ' contre-épreuve(s) muette(s)'));
  process.exit(ok === mutants.length ? 0 : 1);
}
