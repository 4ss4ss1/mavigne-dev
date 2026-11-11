#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
   AJOUR-1 (§552) — CE QU'ON ENREGISTRE SE VOIT TOUT DE SUITE, SANS FERMER LA FICHE NI RELANCER L'APPLI
   ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
   Nico (06/11) : « quand on fait une modification, la mise à jour doit être instantanée ». Vécu au Tracteur :
   l'amendement à 100 % dans la fiche de la session, l'avancement d'avant sur la page une fois la fiche fermée par le
   retour. Ce harnais tient :
   A. LA MÉCANIQUE — le bloc réel de utils.js (entre ses deux bornes), rejoué dans un petit DOM : la page dessous
      redessinée à la fermeture d'une fenêtre après un enregistrement, et une seule fois ; jamais après un geste fait
      depuis la page ; la fiche déclarée repeinte quand elle redevient la fenêtre du dessus, défilement et sections
      ouvertes gardés, jamais pendant une saisie, jamais deux fois ; les mémos de calcul qui repartent.
   B. LE CÂBLAGE — fbSave prévient AVANT tout retour (démo et entraînement compris) ; chaque manière de fermer une
      fenêtre le signale ; chaque rendu de page note qu'elle est à jour ; les fiches vives sont déclarées et leur
      peinture se note fraîche.
   C. LE CLASSEMENT — chaque fenêtre de l'appli (.overlay d'index.html et celles que le code crée) a sa case : une
      fenêtre neuve sans case rougit. VIVE ⇔ déclarée dans le code (_mvFicheVive).
   --contre : chaque garde retirée, une à une, doit rougir.
   ───────────────────────────────────────────────────────────────────────────────────────────────────────────── */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const CONTRE = process.argv.includes('--contre');

const FICHIERS = {
  utils: 'src/utils.js', firebase: 'src/firebase.js', app: 'src/app.js', cuvier: 'src/cuvier.js',
  tracteur: 'src/tracteur.js', phyto: 'src/phyto.js', reglages: 'src/reglages.js', cave: 'src/cave.js',
  reserve: 'src/reserve.js', planning: 'src/planning.js', pilotage: 'src/pilotage.js', html: 'index.html',
};
const SRC0 = {};
for (const [k, f] of Object.entries(FICHIERS)) SRC0[k] = lire(f);
// Les fenêtres que le code crée lui-même : tous les modules sauf l'aide (tutos, nouveautés) et la console GT.
const MODULES = fs.readdirSync(path.join(RACINE, 'src')).filter(f => f.endsWith('.js') && !/^(tutos|whats-new|admin-gt|gt)\.js$/.test(f));
for (const f of MODULES) { const k = 'mod:' + f; if (!Object.values(FICHIERS).includes('src/' + f)) SRC0[k] = lire('src/' + f); }

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// C. LE CLASSEMENT DE CHAQUE FENÊTRE
//   VIVE       déclarée (_mvFicheVive) : redevenue la fenêtre du dessus après un enregistrement, elle se repeint.
//   MODULE     son module la repeint lui-même après chacun de ses gestes (vérifié, nommé).
//   FERME      elle se ferme avant toute modification (la page suit, AJOUR-1).
//   FORMULAIRE une saisie : son enregistrement la ferme (la page ou la fiche dessous suit, AJOUR-1).
//   LECTURE    rien ne s'y modifie.
//   A_REVOIR   pas encore vérifiée une à une (CLAUDE.md §28, bloc AJOUR-1) — la page dessous suit déjà.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
const CLASSES = {
  ovParcelle: ['VIVE', 'fiche parcelle — Valider, niveaux, passages, réparation ponctuelle posés sur elle (_dpPeindre)'],
  ovRecFiche: ['VIVE', 'fiche récolte au téléphone — Modifier, Ajouter une pesée (_recFichePeindre)'],
  ovMatFiche: ['VIVE', 'fiche maturité au téléphone — Noter une mesure, Classer (_matFichePeindre)'],
  ovMaTrace: ['VIVE', 'Ma trace — une parcelle touchée ouvre sa fiche par-dessus (renderMaTrace)'],
  ovSessionDetail: ['MODULE', 'renderSDParcelles, renderSessionProgress, renderSDTracEncart après chaque coche ; la page dessous suit à la fermeture'],
  ovCuveFiche: ['MODULE', 'CUVFICHE-1 : renderVendCuves la repeint (_vendFicheRafraichir), elle s’écarte et revient'],
  ovPlanFiche: ['MODULE', '_pl2Refresh et planFicheMois la repeignent'],
  ovCuveeDetail: ['MODULE', 'CAVE-3 : rouverte par openCuveeDetail après une opération ; Modifier et Supprimer la ferment d’abord'],
  ovMur: ['MODULE', 'saveMurMot, clearMurMot, setMurVisible appellent renderMur'],
  ovListeFiches: ['MODULE', 'deleteFiche, toggleAnomalieTraitee appellent renderListeFiches'],
  ovCommunes: ['MODULE', '_commAfterSave appelle renderCommunesBulk'],
  ovAocPlafonds: ['MODULE', 'saisie en ligne ; _aocSetMin/_aocSetMax repeignent la carte (_aocRenderCard)'],
  ovAocRattach: ['MODULE', 'saisie en ligne ; la carte suit (_aocRenderCard)'],
  ovTraitDetail: ['FERME', 'openTraitEdit la ferme avant d’ouvrir la modification'],
  ovMapQuick: ['FERME', 'Commencer, Valider, Fiche la ferment avant d’agir'],
  ovEditMembre: ['FORMULAIRE', 'saisie ; « Renommer » met son nom à jour (saveRenMembre)'],
  ovEditActTrac: ['FORMULAIRE', 'saisie ; « Renommer » met son nom à jour (saveRenActivite)'],
  ovRepPonct: ['FORMULAIRE', 'réparation ponctuelle'], ovCepage: ['FORMULAIRE', 'cépage'], ovArrachage: ['FORMULAIRE', 'arrachage'],
  ovSelParc: ['FORMULAIRE', 'choix de parcelles'], ovCregEdit: ['FORMULAIRE', 'réglage'], ovMatSaisie: ['FORMULAIRE', 'saisie en série'],
  ovMatCouleurs: ['FORMULAIRE', 'classer les couleurs'], ovCompte: ['FORMULAIRE', 'compte d’une parcelle'], ovComptes: ['FORMULAIRE', 'comptes en série (brouillon gardé)'],
  ovArrEtape: ['FORMULAIRE', 'étape d’arrachage'], ovArrCfg: ['FORMULAIRE', 'étapes de l’arrachage'], ovEqJour: ['FORMULAIRE', 'équipe du jour'],
  ovJEquipe: ['FORMULAIRE', 'équipe au journal'], ovCommune: ['FORMULAIRE', 'commune'], ovEditHha: ['FORMULAIRE', 'heures par hectare'],
  ovRenTache: ['FORMULAIRE', 'renommer'], ovRenParcelle: ['FORMULAIRE', 'renommer'], ovRenMembre: ['FORMULAIRE', 'renommer'], ovRenActivite: ['FORMULAIRE', 'renommer'],
  ovEditDomNom: ['FORMULAIRE', 'nom du domaine'], ovDanger: ['FORMULAIRE', 'confirmation'], ovPlanDay: ['FORMULAIRE', 'journée du planning'],
  ovPlanCP: ['FORMULAIRE', 'congés'], ovPlanInscr: ['FORMULAIRE', 'inscrire sur un modèle (Planning › Année, MODSUIVI-1 §555)'], ovPlanPrep: ['FORMULAIRE', 'préparer l’année suivante (Planning, menu « … », PREPAN-2 §560)'], ovCaveOp: ['FORMULAIRE', 'opération de cave'], ovCuveeMgmt: ['FORMULAIRE', 'cuvée'],
  ovVendRec: ['FORMULAIRE', 'récolte'], ovVendCuve: ['FORMULAIRE', 'cuve'], ovVendMesure: ['FORMULAIRE', 'mesure'], ovCaveConvert: ['FORMULAIRE', 'conversion'],
  ovCaveAnaEdit: ['FORMULAIRE', 'analyse'], ovCaveAna: ['FORMULAIRE', 'analyse'], ovSession: ['FORMULAIRE', 'nouvelle session'], ovActivite: ['FORMULAIRE', 'activité'],
  ovConducteur: ['FORMULAIRE', 'conducteur'], ovEditCond: ['FORMULAIRE', 'conducteur'], ovEditSession: ['FORMULAIRE', 'session'], ovTraitEdit: ['FORMULAIRE', 'traitement'],
  ovPriority: ['FORMULAIRE', 'message prioritaire'], ovValidation: ['FORMULAIRE', 'valider une tâche'], ovNiveaux: ['FORMULAIRE', 'niveaux'], ovPassages: ['FORMULAIRE', 'passages'],
  ovJournalEntry: ['FORMULAIRE', 'saisie du journal'], ovChangePwd: ['FORMULAIRE', 'mot de passe'], ovNewPwd: ['FORMULAIRE', 'mot de passe'], ovForgotPwd: ['FORMULAIRE', 'mot de passe'],
  ovSaison: ['FORMULAIRE', 'saison'], ovEditSaison: ['FORMULAIRE', 'saison'], ovTache: ['FORMULAIRE', 'tâche'], ovTacheCfg: ['FORMULAIRE', 'tâche'], ovMembre: ['FORMULAIRE', 'membre'],
  ovEmEvt: ['FORMULAIRE', 'événement d’un salarié'], ovEntretien: ['FORMULAIRE', 'entretien'], ovConfirmEntretien: ['FORMULAIRE', 'entretien'], ovPlein: ['FORMULAIRE', 'plein'],
  ovReleve: ['FORMULAIRE', 'relevé du compteur'], ovEditFiche: ['FORMULAIRE', 'fiche d’entretien'], ovTracAdd: ['FORMULAIRE', 'ajout'], ovReporter: ['FORMULAIRE', 'reporter'],
  ovAddTracteur: ['FORMULAIRE', 'tracteur'], ovEditTracteur: ['FORMULAIRE', 'tracteur'], ovPheno: ['FORMULAIRE', 'stade'], ovPhenoDate: ['FORMULAIRE', 'date du stade'],
  ovChampValidation: ['FORMULAIRE', 'valider la parcelle'], ovMode: ['FORMULAIRE', 'mode du jour'], ovConfirmDel: ['FORMULAIRE', 'confirmation'], ovPrompt: ['FORMULAIRE', 'question'],
  ovRetraitFut: ['FORMULAIRE', 'retrait de fût'], ovPTeam: ['FORMULAIRE', 'équipe'], 'mv-email-ov': ['FORMULAIRE', 'e-mail'],
  ovCloture: ['FORMULAIRE', 'clôture de campagne'], ovFerti: ['FORMULAIRE', 'amendement'], ovRsvAchat: ['FORMULAIRE', 'achat'], ovRsvFut: ['FORMULAIRE', 'fût de la réserve'],
  ovRsvInv: ['FORMULAIRE', 'inventaire'], ovRsvSep: ['FORMULAIRE', 'réserve'],
  ovRsvProd: ['MODULE', 'INTRANT-1 (§553) : « Retirer » un achat repeint sa liste et sa zone de suppression (_rsvPfListe), jamais ses champs ; « Enregistrer » et « Supprimer » la ferment'], ovTacheConv: ['FORMULAIRE', 'conversion de tâche'], ovTraitement: ['FORMULAIRE', 'traitement'],
  ovYAller: ['LECTURE', 'choix de l’application de guidage'], ovHubAide: ['LECTURE', 'documentation'], ovAide: ['LECTURE', 'aide'], ovInfo: ['LECTURE', 'information'],
  ovGraph: ['LECTURE', 'graphique'], ovEphyDetail: ['LECTURE', 'fiche du catalogue E-Phy'], ovDocs: ['LECTURE', 'documents et exports'], ovHistorique: ['LECTURE', 'historique'],
  ovRapportSaison: ['LECTURE', 'rapport'], ovExportEntretien: ['LECTURE', 'export'], ovMentions: ['LECTURE', 'mentions'], ovSaisonImg: ['LECTURE', 'Ma saison en images'],
  ovPFiltres: ['LECTURE', 'filtres de l’écran'], ovCaveExport: ['LECTURE', 'export'], ovWhatsNew: ['LECTURE', 'nouveautés'], ovSync: ['LECTURE', 'état de la synchro'],
  ovChatParcelle: ['LECTURE', 'module de discussion retiré (CHAT-0)'], ovTracOutils: ['LECTURE', 'menu des outils d’entretien'],
  ovJivExport: ['LECTURE', 'export'], ovSyntheseCuivre: ['LECTURE', 'synthèse cuivre'],
  ovReglVigne: ['A_REVOIR', 'réglages en ligne : les cartes calculées à côté des champs'], ovReglTracteur: ['A_REVOIR', 'réglages en ligne (_ecoCfgSet, setActHha) sans repeinte des cartes calculées'],
  ovReglPlanning: ['A_REVOIR', 'réglages en ligne'], ovReglPilotage: ['A_REVOIR', 'réglages en ligne (_ecoCfgSet) sans repeinte des cartes calculées'],
  ovReglPhyto: ['A_REVOIR', 'réglages en ligne'], ovReglReserve: ['A_REVOIR', 'réglages en ligne'],
  ovLabo: ['A_REVOIR', 'fiche labo'], ovReport: ['A_REVOIR', 'report (Pilotage)'], ovReparateur: ['A_REVOIR', 'réparateur'], ovRepBlock: ['A_REVOIR', 'blocage réparation'],
  ovPlanChaleur: ['A_REVOIR', 'chaleur (Planning)'], ovFerParc: ['A_REVOIR', 'fertilisation d’une parcelle'],
};
const CATEGORIES = ['VIVE', 'MODULE', 'FERME', 'FORMULAIRE', 'LECTURE', 'A_REVOIR'];

function fenetres(SRC) {
  const ids = new Set();
  const reHtml = /<div[^>]*class="[^"]*\boverlay\b[^"]*"[^>]*id="([^"]+)"|<div[^>]*id="([^"]+)"[^>]*class="[^"]*\boverlay\b[^"]*"/g;
  let m; while ((m = reHtml.exec(SRC.html))) ids.add(m[1] || m[2]);
  const reJs = /(?:id=\\?["']|\.id *= *['"])(ov[A-Za-z0-9_-]*)/g;
  for (const [k, s] of Object.entries(SRC)) { if (k === 'html') continue; reJs.lastIndex = 0; while ((m = reJs.exec(s))) ids.add(m[1]); }
  return ids;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// A. LE PETIT DOM — juste ce que le bloc lit : arbre, classes, attributs, défilement, <details>, sélecteurs simples.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
class El {
  constructor(tag, a = {}, kids = []) {
    this.tagName = tag.toUpperCase(); this.attrs = Object.assign({}, a); this.children = []; this.parentNode = null;
    this.scrollTop = 0; this.open = !!a.open; this._c = new Set(String(a.class || '').split(/\s+/).filter(Boolean));
    this.textContent = a.text || ''; kids.forEach(k => this.appendChild(k));
  }
  get id() { return this.attrs.id || ''; }
  get className() { return [...this._c].join(' '); }
  get classList() { const c = this._c; return { contains: x => c.has(x), add: x => c.add(x), remove: x => c.delete(x) }; }
  getAttribute(n) { return Object.prototype.hasOwnProperty.call(this.attrs, n) ? String(this.attrs[n]) : null; }
  appendChild(k) { k.parentNode = this; this.children.push(k); return k; }
  vider() { this.children.forEach(k => { k.parentNode = null; }); this.children = []; }
  contains(x) { for (let n = x; n; n = n.parentNode) if (n === this) return true; return false; }
  _desc() { const o = []; const w = e => e.children.forEach(c => { o.push(c); w(c); }); w(this); return o; }
  querySelectorAll(s) { return this._desc().filter(e => colle(e, s)); }
  querySelector(s) { return this.querySelectorAll(s)[0] || null; }
}
function colle(e, s) {
  if (s === '*') return true;
  if (s === 'details[open]') return e.tagName === 'DETAILS' && e.open;
  if (s.charAt(0) === '#') return e.id === s.slice(1);
  const m = /^([a-z]+)(?:\.([\w-]+))?$/.exec(s);
  if (m) return e.tagName === m[1].toUpperCase() && (!m[2] || e._c.has(m[2]));
  throw new Error('sélecteur non joué par le petit DOM : ' + s);
}

function bloc(utils) {
  const d = utils.indexOf('// ── AJOUR-1 : début du bloc ──'), f = utils.indexOf('// ── AJOUR-1 : fin du bloc ──');
  if (d < 0 || f < d) throw new Error('bornes du bloc AJOUR-1 introuvables dans utils.js');
  return utils.slice(d, f);
}

// Un monde : le bloc réel chargé, une page, des fenêtres, des images à faire passer à la main.
function monde(utils) {
  const imgs = [], journal = [];
  const ctx = {
    console, Object, Array, String, Math, Date, JSON, Error,
    currentUser: { nom: 'Nico' }, CSS: undefined,
    requestAnimationFrame: f => { imgs.push(f); return imgs.length; },
    setTimeout: (f) => { imgs.push(f); return imgs.length; },
    _mvAvale: e => journal.push('avale:' + (e && e.message)),
    _mvRgOublier: () => journal.push('rangs'), _cptInvalider: () => journal.push('comptes'),
    _mvSaisieEnCours: () => !!ctx.__saisie,
    __top: null, __saisie: false, __page: { id: 'page-tracteur' }, __rendus: 0,
    _mvTopSurface: () => ctx.__top ? { el: ctx.__top } : null,
    _mvRendrePageActive: () => { if (ctx.__saisie) return 'saisie'; ctx.__rendus++; ctx._mvAjourPage(ctx.__page.id); return ctx.__page.id; },
  };
  ctx.window = ctx;
  ctx.document = { querySelector: s => (s === '.page.active' ? ctx.__page : null), activeElement: null, body: {} };
  vm.createContext(ctx);
  vm.runInContext(bloc(utils) + '\nthis.__verifier = _mvAjourVerifier;', ctx);
  const image = () => { let n = 0; while (imgs.length) { const f = imgs.shift(); f(); n++; if (n > 50) throw new Error('images sans fin'); } return n; };
  return { ctx, image, journal, imgs };
}

// Une fiche : la fenêtre, une zone qui défile, deux sections ; sa peinture remplace le corps (éléments neufs).
function ficheAvec(id) {
  const corps = new El('div', { id: id + '-corps' });
  const modal = new El('div', { class: 'modal' }, [corps]);
  const ov = new El('div', { id, class: 'overlay open' }, [modal]);
  let n = 0;
  const peindre = (statut) => {
    corps.vider();
    corps.appendChild(new El('div', { class: 'statut', text: statut }));
    const d1 = new El('details', { 'data-k': 'hist' }, [new El('summary', { text: 'Historique' })]);
    const d2 = new El('details', {}, [new El('summary', { text: 'Pieds' })]);
    const liste = new El('div', { class: 'liste' });
    corps.appendChild(d1); corps.appendChild(d2); corps.appendChild(liste);
  };
  peindre('En cours');
  return { ov, modal, corps, peindre, compte: () => n, peintre: (statut) => () => { n++; peindre(statut()); } };
}

function scenarios(utils) {
  const R = [];
  const T = (nom, ok) => R.push([nom, !!ok]);
  try {
    // 1. Le cas du Tracteur : fiche non déclarée, coche, fermeture par le retour → la page se redessine, une fois.
    { const W = monde(utils), c = W.ctx;
      c._mvAjourPage('page-tracteur');
      c.__top = new El('div', { id: 'ovSessionDetail', class: 'overlay open' });
      c._mvAjourEcrit('sessions'); W.image();
      T('une coche dans la fiche (non déclarée) ne redessine pas la page tant que la fiche est ouverte', c.__rendus === 0);
      c.__top = null; c._mvAjourPlanifier(true); c._mvAjourPlanifier(true); W.image();
      T('la fiche fermée (retour, toucher à côté…) : la page dessous se redessine, une seule fois', c.__rendus === 1);
      c._mvAjourPlanifier(true); W.image();
      T('une seconde fermeture sans enregistrement ne la redessine plus', c.__rendus === 1); }
    // 2. Le module a déjà redessiné la page après l'enregistrement → pas de second rendu.
    { const W = monde(utils), c = W.ctx;
      c._mvAjourEcrit('sessions'); c._mvAjourPage('page-tracteur');
      c._mvAjourPlanifier(true); W.image();
      T('la page déjà redessinée par son module ne l’est pas une seconde fois (pas de lenteur)', c.__rendus === 0 && c.__verifier(true) === 'page-a-jour'); }
    // 3. Un geste fait depuis la page (aucune fenêtre) → la mécanique ne redessine pas la page elle-même.
    { const W = monde(utils), c = W.ctx;
      c._mvAjourPage('page-parcelles'); c.__page = { id: 'page-parcelles' };
      c._mvAjourEcrit('parcelles'); W.image();
      T('un enregistrement fait depuis la page ne la redessine pas une seconde fois (son geste le fait)', c.__rendus === 0); }
    // 4. Fiche déclarée sous une feuille : la feuille se ferme après l'enregistrement → la fiche se repeint, une fois,
    //    défilement et sections ouvertes gardés.
    { const W = monde(utils), c = W.ctx, F = ficheAvec('ovParcelle');
      let statut = 'En cours';
      c._mvFicheVive('ovParcelle', F.peintre(() => statut)); c._mvFicheFraiche('ovParcelle');
      const feuille = new El('div', { id: 'ovValidation', class: 'overlay open' });
      c.__top = feuille;
      F.ov.scrollTop = 0; F.modal.scrollTop = 240; F.corps.querySelector('details').open = true;
      F.corps.querySelectorAll('details')[1].open = true; F.corps.querySelector('div.liste').scrollTop = 35;
      statut = 'Validé'; c._mvAjourEcrit('parcelles'); W.image();
      T('la fiche cachée sous la feuille ne se repeint pas encore', F.compte() === 0);
      c.__top = F.ov; c._mvAjourPlanifier(true); W.image();
      T('la feuille fermée : la fiche dessous se repeint, une seule fois', F.compte() === 1);
      T('elle montre le nouvel état (« Validé »)', F.corps.querySelector('div.statut').textContent === 'Validé');
      T('le défilement de la fenêtre est gardé', F.modal.scrollTop === 240);
      T('le défilement d’une zone intérieure est gardé', F.corps.querySelector('div.liste').scrollTop === 35);
      const dets = F.corps.querySelectorAll('details');
      T('les sections ouvertes le restent (par data-k, puis par leur titre)', dets[0].open === true && dets[1].open === true);
      T('la page dessous n’est pas touchée tant qu’une fenêtre est ouverte', c.__rendus === 0);
      c._mvAjourPlanifier(true); W.image();
      T('à jour, elle ne se repeint plus', F.compte() === 1); }
    // 5. Le module la repeint déjà (sa peinture la note fraîche) → pas de seconde peinture.
    { const W = monde(utils), c = W.ctx, F = ficheAvec('ovRecFiche');
      c._mvFicheVive('ovRecFiche', F.peintre(() => 'x')); c.__top = F.ov;
      c._mvAjourEcrit('cave_vendange'); c._mvFicheFraiche('ovRecFiche'); W.image();
      T('une fiche déjà repeinte par son module (fraîche) ne l’est pas une seconde fois', F.compte() === 0); }
    // 6. Une saisie en cours dans la fiche n'est jamais écrasée.
    { const W = monde(utils), c = W.ctx, F = ficheAvec('ovMatFiche');
      c._mvFicheVive('ovMatFiche', F.peintre(() => 'x')); c.__top = F.ov;
      const champ = new El('input'); F.corps.appendChild(champ); c.document.activeElement = champ; c.__saisie = true;
      c._mvAjourEcrit('cave_vendange'); W.image();
      T('une saisie en cours dans la fiche : pas de repeinte', F.compte() === 0);
      c.__saisie = false; c.document.activeElement = null; c._mvAjourPlanifier(true); W.image();
      T('la saisie finie, la fiche se repeint à la fermeture suivante', F.compte() === 1); }
    // 7. Une fenêtre du dessus non déclarée : rien, la page reste.
    { const W = monde(utils), c = W.ctx;
      c.__top = new El('div', { id: 'ovPrompt', class: 'overlay open' }); c._mvAjourEcrit('config'); c._mvAjourPlanifier(true); W.image();
      T('une fenêtre non déclarée au-dessus : ni repeinte, ni page', c.__rendus === 0 && c.__verifier(true) === 'fenetre'); }
    // 8. Hors session : rien.
    { const W = monde(utils), c = W.ctx; c.currentUser = null; c._mvAjourEcrit('x'); c._mvAjourPlanifier(true); W.image();
      T('hors session : rien ne se redessine', c.__rendus === 0); }
    // 9. Plusieurs enregistrements et fermetures dans la même image : une seule vérification.
    { const W = monde(utils), c = W.ctx;
      c._mvAjourEcrit('a'); c._mvAjourEcrit('b'); c._mvAjourPlanifier(true); c._mvAjourPlanifier(true);
      T('plusieurs enregistrements et fermetures : une seule image planifiée', W.imgs.length === 1);
      W.image(); T('… et un seul rendu de la page', c.__rendus === 1); }
    // 10. Les mémos repartent : à l'enregistrement ET à la donnée reçue.
    { const W = monde(utils), c = W.ctx;
      c._mvAjourEcrit('journal'); const a = W.journal.slice(); c._mvAjourRecu('sessions');
      T('un enregistrement fait repartir les mémos (rangs, comptes)', a.includes('rangs') && a.includes('comptes'));
      T('une donnée reçue aussi', W.journal.filter(x => x === 'rangs').length === 2 && W.journal.filter(x => x === 'comptes').length === 2); }
    // 11. Une peinture en panne n'enraye pas la suite.
    { const W = monde(utils), c = W.ctx, F = ficheAvec('ovParcelle');
      c._mvFicheVive('ovParcelle', () => { throw new Error('panne'); }); c.__top = F.ov;
      c._mvAjourEcrit('parcelles'); W.image();
      T('une peinture en panne est avalée et notée', W.journal.some(x => x === 'avale:panne'));
      c.__top = null; c._mvAjourEcrit('parcelles'); c._mvAjourPlanifier(true); W.image();
      T('… et la mécanique continue (la page suit à la fermeture suivante)', c.__rendus === 1); }
    // 12. La saisie sur la page pendant la fermeture : la page attend la fermeture suivante.
    { const W = monde(utils), c = W.ctx;
      c._mvAjourEcrit('x'); c.__saisie = true; c._mvAjourPlanifier(true); W.image();
      T('une saisie sur la page : pas de rendu (elle se fera à la fermeture suivante)', c.__rendus === 0);
      c.__saisie = false; c._mvAjourPlanifier(true); W.image(); T('… et se fait ensuite', c.__rendus === 1); }
  } catch (e) { T('le bloc AJOUR-1 se rejoue sans erreur (' + (e && e.message) + ')', false); }
  return R;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
// B. LE CÂBLAGE
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
function corps(s, entete) {
  const i = s.indexOf(entete); if (i < 0) return '';
  let d = 0, k = s.indexOf('{', i);
  for (; k < s.length; k++) { const ch = s[k]; if (ch === '{') d++; else if (ch === '}') { d--; if (!d) break; } }
  return s.slice(i, k + 1);
}
const PAGES = [
  ['app', 'function renderHome(){', 'page-home', null],
  ['app', 'function renderParcelles(){', 'page-parcelles', "_mvSk('parcelles'); return; }"],
  ['app', 'function renderJournalList(){', 'page-journal', "_mvSk('journal'); return; }"],
  ['tracteur', 'function renderTracteur(){', 'page-tracteur', null],
  ['phyto', 'function renderPhyto(){', 'page-phyto', null],
  ['reglages', 'function renderReglages(){', 'page-reglages', "_mvSk('reglages'); return; }"],
  ['cave', 'function renderCave() {', 'page-cave', null],
  ['reserve', 'function renderReserve(){', 'page-reserve', null],
  ['planning', 'function renderPlanning(){', 'page-planning', "_mvSk('planning'); return; }"],
  ['pilotage', 'function renderPilotage(){', 'page-pilotage', null],
];
function cablage(SRC) {
  const R = [];
  const T = (nom, ok) => R.push([nom, !!ok]);
  // fbSave : le compteur avant tout retour.
  const fb = corps(SRC.firebase, 'window.fbSave = async function (key, value) {');
  const iHook = fb.indexOf('window._mvAjourEcrit(key)'), iDemo = fb.indexOf("TENANT_ID === 'domaine-dupont'"), iRo = fb.indexOf('_mvLectureSeule()');
  const premier = fb.split('\n').slice(1).map(l => l.trim()).filter(l => l && !l.startsWith('//'))[0] || '';
  T('fbSave prévient l’écran à chaque enregistrement (_mvAjourEcrit)', iHook > 0);
  T('… avant tout retour : démo, entraînement, lecture seule', iHook > 0 && iHook < iDemo && iHook < iRo && premier.indexOf('_mvAjourEcrit') >= 0);
  // Les fermetures.
  const ovs = corps(SRC.app, 'function _mvOvSync(){');
  const iPop = ovs.indexOf('_mvOvStack.splice(k,1);'), iFerme = ovs.indexOf('_ajFerme=true;'), iEmp = ovs.indexOf('// 2) empiler');
  T('_mvOvSync : une fenêtre dépilée signale une fermeture', iFerme > iPop && iFerme < iEmp
    && ovs.indexOf('if(_ajFerme && window._mvAjourPlanifier) window._mvAjourPlanifier(true);') > iFerme
    && ovs.indexOf('if(_ajFerme && window._mvAjourPlanifier) window._mvAjourPlanifier(true);') < iEmp);
  T('_mvBack : la surface fermée par le retour, de toute famille, le signale',
    corps(SRC.app, 'function _mvBack(){').includes('if(top){ top.close(); if(window._mvAjourPlanifier) window._mvAjourPlanifier(true); return true; }'));
  T('_mvdsClose : la feuille de fin, retirée du DOM, le signale', /removeChild\(bg\);[\s\S]*window\._mvAjourPlanifier\(true\)/.test(corps(SRC.app, 'function _mvdsClose(){')));
  T('_vendSheetClose : les feuilles du Cuvier et du Chai le signalent', corps(SRC.cuvier, 'function _vendSheetClose(){').includes('window._mvAjourPlanifier(true)'));
  T('applyFbData : une donnée reçue fait repartir les mémos', SRC.app.includes("  _mvKeyLoaded[key] = true;   // #wipe : cle chargee au moins une fois depuis Firestore\n  if(window._mvAjourRecu) window._mvAjourRecu(key);"));
  T('les mémos qui repartent : « qui est dans les rangs » se vide', SRC.utils.includes('window._mvRgOublier = function(){ _MV_RG = { t: 0, m: {} }; };'));
  // Les rendus de page.
  const rpa = corps(SRC.app, 'function _mvRendrePageActive(){');
  for (const [f, ent, pid, squelette] of PAGES) {
    const b = corps(SRC[f], ent), marque = "window._mvAjourPage('" + pid + "')";
    const lignes = b.split('\n'), iM = lignes.findIndex(l => l.includes(marque));
    T(ent.replace('function ', '').replace(/\s*\{$/, '') + ' note que ' + pid + ' est à jour (en tête)', iM >= 1 && iM <= 3);
    if (squelette) T(ent.replace('function ', '').replace(/\s*\{$/, '') + ' : la marque après le squelette (une page vide n’est pas « à jour »)', b.indexOf(marque) > b.indexOf(squelette) && b.indexOf(squelette) > 0);
    T('_mvRendrePageActive sait redessiner ' + pid, rpa.includes("pid==='" + pid + "'"));
  }
  // Les fiches vives.
  const dp = corps(SRC.app, 'function _dpPeindre(nom,repeinte){');
  T('fiche parcelle : sa peinture est à part (_dpPeindre) et se note fraîche', dp.includes("window._mvFicheFraiche('ovParcelle')") && dp.includes('return true;'));
  T('fiche parcelle : la repeinte garde la météo affichée (pas d’appel réseau à chaque geste)', dp.includes("if(!repeinte){ try{ _dpFillParcMeteo(p); }"));
  T('fiche parcelle : openDP peint puis ouvre', SRC.app.includes("function openDP(nom){\n  if(!_dpPeindre(nom)) return;\n  openOv('ovParcelle');\n}"));
  T('fiche parcelle : déclarée vive, repeinte sur la parcelle ouverte', SRC.app.includes("window._mvFicheVive('ovParcelle', function(){ if(_dpCurrentNom) _dpPeindre(_dpCurrentNom, true); });"));
  T('Ma trace : déclarée vive, sa peinture se note fraîche', SRC.app.includes("window._mvFicheVive('ovMaTrace', function(){ renderMaTrace(); });") && corps(SRC.app, 'function renderMaTrace(){').includes("window._mvFicheFraiche('ovMaTrace')"));
  const rec = corps(SRC.cuvier, 'function _recFichePeindre(){');
  const rs = corps(SRC.cuvier, 'function _recSel(nom){'), ms = corps(SRC.cuvier, 'function _matSel(nom){');
  // Déclarées dans leur ouverture, avant la peinture (cuvier.js n'exécute rien au chargement : mv-harnais-cuvier, règle F).
  T('fiche récolte : peinture à part, fraîche, déclarée vive à l’ouverture puis peinte', rec.includes("window._mvFicheFraiche('ovRecFiche')")
    && rs.indexOf("window._mvFicheVive('ovRecFiche', _recFichePeindre);") > 0 && rs.indexOf("window._mvFicheVive('ovRecFiche', _recFichePeindre);") < rs.indexOf('if(!_recFichePeindre()) return;'));
  const mat = corps(SRC.cuvier, 'function _matFichePeindre(ouvrir){');
  T('fiche maturité : peinture à part, fraîche, ouverture dans l’ordre (corps, fenêtre, courbes), déclarée vive', mat.includes("window._mvFicheFraiche('ovMatFiche')")
    && mat.indexOf('corps.innerHTML') < mat.indexOf("openOv('ovMatFiche')") && mat.indexOf("openOv('ovMatFiche')") < mat.indexOf('_matPeindreFiche(')
    && ms.indexOf("window._mvFicheVive('ovMatFiche', function(){ _matFichePeindre(false); });") > 0 && ms.indexOf("window._mvFicheVive('ovMatFiche', function(){ _matFichePeindre(false); });") < ms.indexOf('_matFichePeindre(true);'));
  return R;
}

function classement(SRC) {
  const R = [];
  const T = (nom, ok) => R.push([nom, !!ok]);
  const ids = fenetres(SRC);
  const sans = [...ids].filter(id => !CLASSES[id]);
  T('chaque fenêtre de l’appli a sa case' + (sans.length ? ' — sans case : ' + sans.join(', ') : ' (' + ids.size + ' fenêtres)'), sans.length === 0);
  const fantomes = Object.keys(CLASSES).filter(id => !ids.has(id));
  T('aucune case pour une fenêtre qui n’existe plus' + (fantomes.length ? ' — ' + fantomes.join(', ') : ''), fantomes.length === 0);
  T('chaque case est une catégorie connue, avec sa raison', Object.values(CLASSES).every(([c, p]) => CATEGORIES.includes(c) && p && p.length > 3));
  const tout = Object.values(SRC).join('\n');
  const declarees = new Set(); let m; const re = /window\._mvFicheVive\('([^']+)'/g; while ((m = re.exec(tout))) declarees.add(m[1]);
  const vives = Object.keys(CLASSES).filter(id => CLASSES[id][0] === 'VIVE');
  T('chaque fiche classée VIVE est déclarée dans le code', vives.every(id => declarees.has(id)));
  T('chaque fiche déclarée dans le code est classée VIVE', [...declarees].every(id => CLASSES[id] && CLASSES[id][0] === 'VIVE'));
  return R;
}

function tout(SRC) { return [].concat(scenarios(SRC.utils), cablage(SRC), classement(SRC)); }

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
if (!CONTRE) {
  console.log('\n── AJOUR-1 — ce qu’on enregistre se voit tout de suite\n');
  const R = tout(SRC0); let ko = 0;
  for (const [n, ok] of R) { console.log((ok ? '  ✓ ' : '  ✗ ') + n); if (!ok) ko++; }
  const n = Object.values(CLASSES).reduce((o, [c]) => { o[c] = (o[c] || 0) + 1; return o; }, {});
  console.log('\n  classement : ' + CATEGORIES.map(c => c + ' ' + (n[c] || 0)).join(' · '));
  console.log('\n  ' + (R.length - ko) + ' vertes, ' + ko + ' rouges\n');
  process.exit(ko ? 1 : 0);
}

const MUTANTS = [
  ['fbSave sans le compteur', 'firebase', "  if (window._mvAjourEcrit) { try { window._mvAjourEcrit(key); } catch (e) { if (window._mvAvale) window._mvAvale(e, 'firebase.js/fbSave#ajour'); } }\n", '', 'fbSave prévient'],
  ['le compteur après le retour de la démo', 'firebase', "  if (window._mvAjourEcrit) { try { window._mvAjourEcrit(key); } catch (e) { if (window._mvAvale) window._mvAvale(e, 'firebase.js/fbSave#ajour'); } }\n", '', 'avant tout retour',
    s => s.replace("    return { ok: true, local: true };\n  }\n", "    return { ok: true, local: true };\n  }\n  if (window._mvAjourEcrit) { try { window._mvAjourEcrit(key); } catch (e) {} }\n")],
  ['_mvOvSync ne signale plus la fermeture', 'app', '        _ajFerme=true;\n', '', '_mvOvSync'],
  ['_mvBack ne signale plus la fermeture', 'app', 'if(top){ top.close(); if(window._mvAjourPlanifier) window._mvAjourPlanifier(true); return true; }', 'if(top){ top.close(); return true; }', '_mvBack'],
  ['la feuille de fin ne signale plus', 'app', "  if(window._mvAjourPlanifier) window._mvAjourPlanifier(true);   // ★★ AJOUR-1 (§552) : la feuille de fin sort du DOM", '  // retiré', '_mvdsClose'],
  ['les feuilles du Cuvier ne signalent plus', 'cuvier', '  if(window._mvAjourPlanifier) window._mvAjourPlanifier(true);\n}\n', '}\n', '_vendSheetClose'],
  ['la donnée reçue ne fait plus repartir les mémos', 'app', '  if(window._mvAjourRecu) window._mvAjourRecu(key);', '', 'applyFbData'],
  ['« qui est dans les rangs » ne se vide plus', 'utils', 'window._mvRgOublier = function(){ _MV_RG = { t: 0, m: {} }; };', 'window._mvRgOublier = function(){};', 'rangs'],
  ['renderTracteur sans sa marque', 'tracteur', "  if(window._mvAjourPage) window._mvAjourPage('page-tracteur');", '', 'renderTracteur() note'],
  ['la marque du Planning avant son squelette', 'planning', "  if(window._mvAjourPage) window._mvAjourPage('page-planning');   // ★★ AJOUR-1 (§552) : la page est à jour de ce qui précède (utils.js)\n", '', 'après le squelette',
    s => s.replace("function renderPlanning(){\n", "function renderPlanning(){\n  if(window._mvAjourPage) window._mvAjourPage('page-planning');\n")],
  ['la fiche parcelle n’est plus déclarée', 'app', "if(window._mvFicheVive) window._mvFicheVive('ovParcelle', function(){ if(_dpCurrentNom) _dpPeindre(_dpCurrentNom, true); });\n", '', 'fiche parcelle : déclarée'],
  ['la fiche parcelle ne se note plus fraîche', 'app', "  if(window._mvFicheFraiche) window._mvFicheFraiche('ovParcelle');\n", '', 'se note fraîche'],
  ['la repeinte relance la météo', 'app', "  if(!repeinte){ try{ _dpFillParcMeteo(p); }", "  if(true){ try{ _dpFillParcMeteo(p); }", 'garde la météo'],
  ['la fiche récolte n’est plus déclarée', 'cuvier', "  if(window._mvFicheVive) window._mvFicheVive('ovRecFiche', _recFichePeindre);\n", '', 'fiche récolte'],
  ['la fiche maturité ouvre avant de peindre', 'cuvier', "  corps.innerHTML = _matFicheHtml(nom, r, spd, _matFour(), !ref);\n  if(ouvrir && typeof window.openOv === 'function') window.openOv('ovMatFiche');\n",
    "  if(ouvrir && typeof window.openOv === 'function') window.openOv('ovMatFiche');\n  corps.innerHTML = _matFicheHtml(nom, r, spd, _matFour(), !ref);\n", 'fiche maturité'],
  ['un geste depuis la page la redessine deux fois', 'utils', "  if(!fermeture) return 'rien';\n", '', 'fait depuis la page'],
  ['la page déjà redessinée l’est une seconde fois', 'utils', "  if(vu !== undefined && vu >= _MV_AJ.n) return 'page-a-jour';\n", '', 'pas une seconde fois'],
  ['la repeinte écrase une saisie', 'utils', "  if(a && a !== document.body && el.contains(a) && typeof window._mvSaisieEnCours === 'function' && window._mvSaisieEnCours()) return 'saisie';\n", '', 'saisie en cours dans la fiche'],
  ['le défilement n’est plus rendu', 'utils', '  _mvFicheRendre(el, etat);\n  // Une seconde fois', '  // Une seconde fois', 'zone intérieure',
    s => s.replace('  planifier(function(){ _mvFicheRendre(el, etat); });\n', '')],
  ['une fiche fraîche se repeint quand même', 'utils', 'if(f && f.n < _MV_AJ.n && el.classList.contains', 'if(f && true && el.classList.contains', 'pas une seconde fois'],
  ['les mémos ne repartent plus à l’enregistrement', 'utils', "window._mvAjourEcrit = function(key){ _MV_AJ.n++; _mvAjourOublier(); _mvAjourPlanifier(false); return _MV_AJ.n; };",
    "window._mvAjourEcrit = function(key){ _MV_AJ.n++; _mvAjourPlanifier(false); return _MV_AJ.n; };", 'fait repartir les mémos'],
  ['une fenêtre neuve sans case', 'html', '<div class="overlay" id="ovMur"', '<div class="overlay" id="ovNeuveAjour" onclick="closeOv(event,\'ovNeuveAjour\')"></div>\n<div class="overlay" id="ovMur"', 'a sa case'],
];
console.log('\n── AJOUR-1 — contre-épreuves\n');
let rates = 0;
for (const [nom, f, ancien, neuf, attendu, apres] of MUTANTS) {
  const SRC = Object.assign({}, SRC0);
  if (!SRC[f].includes(ancien)) { console.log('  ✗ MOTIF ABSENT  ' + nom); rates++; continue; }
  SRC[f] = SRC[f].replace(ancien, neuf);
  if (apres) SRC[f] = apres(SRC[f]);
  const rouges = tout(SRC).filter(([, ok]) => !ok);
  const vise = rouges.filter(([n]) => n.includes(attendu));
  if (vise.length) console.log('  DÉTECTÉ  ' + nom + ' (' + rouges.length + ' rouge' + (rouges.length > 1 ? 's' : '') + ')');
  else { console.log('  ✗ MANQUÉ  ' + nom + (rouges.length ? ' — rouges ailleurs : ' + rouges.map(r => r[0]).join(' | ') : '')); rates++; }
}
console.log('\n  ' + (MUTANTS.length - rates) + '/' + MUTANTS.length + ' contre-épreuves détectées\n');
process.exit(rates ? 1 : 0);
