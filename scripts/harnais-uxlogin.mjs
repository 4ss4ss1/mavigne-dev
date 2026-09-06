#!/usr/bin/env node
// ── HARNAIS UX-LOGIN : la tuile unique à l'ouverture ─────────────────────────
//
// Ce que le lot promet, et que ce harnais mesure :
//   1. _loginRenderTuiles n'affiche qu'une tuile quand l'appareil se souvient.
//   2. ⚠️ L'INDEX D'ORIGINE dans MEMBRES est conservé : selectProfile(idx) et la
//      couleur en dépendent. Réindexer un tableau filtré ouvrirait la fiche de
//      quelqu'un d'autre — c'est LE piège de ce lot, et le seul qui soit grave.
//   3. Les garde-fous : un seul membre, un souvenir orphelin, un Inactif,
//      « Ce n'est pas moi » → liste entière.
//   4. La mémoire est par DOMAINE et le souvenir n'est écrit qu'au succès.
//
// ⚠️ On EXÉCUTE le vrai _loginRenderTuiles extrait de app.js contre un faux DOM
// minimal. On ne cherche pas un motif de texte : trois assertions d'un lot
// précédent étaient vertes à tort pour cette raison (§53).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ICI, '..');
const lire = (rel) => readFileSync(join(RACINE, rel), 'utf8');

let ok = 0, ko = 0;
const c = { g:(s)=>`\x1b[32m${s}\x1b[0m`, r:(s)=>`\x1b[31m${s}\x1b[0m`, d:(s)=>`\x1b[2m${s}\x1b[0m` };
const verifie = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  ' + c.g('✓') + ' ' + nom); }
  else { ko++; console.log('  ' + c.r('✗') + ' ' + nom + (detail ? c.d('  → ' + detail) : '')); }
};

function decoupe(src, debut, fin, quoi) {
  const i = src.indexOf(debut);
  if (i < 0) throw new Error('borne de debut introuvable : ' + quoi);
  const j = src.indexOf(fin, i + debut.length);
  if (j < 0) throw new Error('borne de fin introuvable : ' + quoi);
  return src.slice(i, j + fin.length);
}

const app = lire('src/app.js');
// Garde de montage : sans ces ancres, un renommage ferait verdir un harnais vide (§40).
verifie('_loginRenderTuiles existe', /function _loginRenderTuiles\(\)\{/.test(app));
verifie('_loginMemLire existe',      /function _loginMemLire\(\)\{/.test(app));
verifie('_loginVoirTousProfils existe', /function _loginVoirTousProfils\(\)\{/.test(app));
verifie('le souvenir est ecrit au succes', app.includes('_loginMemEcrire(m.nom);'));
verifie('logout oublie le souvenir',       app.includes('_loginMemOublier();'));

const blocRender = decoupe(app, 'function _loginRenderTuiles(){', "\n}\n", '_loginRenderTuiles');
// ⚠ La borne s'arretait a window._loginMemOublier, donc AVANT _loginVoirTousProfils :
// le stub ne le voyait pas. La borne doit couvrir tout ce que l'API expose.
const blocMem    = decoupe(app, 'function _loginMemKey(){', 'window._loginVoirTousProfils = _loginVoirTousProfils;', 'memoire + voir tous');

// ── Faux DOM minimal : juste ce que la fonction touche ──
function fauxDoc() {
  // ⚠ innerHTML doit Être un SETTER qui vide les enfants. Une simple propriété
  // laissait les tuiles s'accumuler d'un rendu à l'autre : « voir tous » affichait
  // 1+3 tuiles et l'assertion échouait sur un défaut du harnais, pas du code.
  const el = (id) => {
    const n = { id, style: {}, textContent: '', enfants: [],
                appendChild(x){ this.enfants.push(x); } };
    Object.defineProperty(n, 'innerHTML', {
      get(){ return ''; },
      set(v){ if (v === '') this.enfants.length = 0; },
    });
    return n;
  };
  const noeuds = { 'login-profiles': el('login-profiles'),
                   'login-autres':   el('login-autres'),
                   'login-sub-txt':  el('login-sub-txt') };
  return {
    noeuds,
    getElementById: (id) => noeuds[id] || null,
    createElement: () => ({ className:'', style:{}, textContent:'', enfants:[],
                            clics:[], appendChild(n){ this.enfants.push(n); },
                            addEventListener(t,f){ if(t==='clic'||t==='click') this.clics.push(f); } }),
  };
}

function monte({ membres, memoire = '', tenant = 'mg', voirTous = false }) {
  const store = {};
  if (memoire) store['mavigne_profil_' + tenant] = memoire;
  store['mavigne_tenant'] = tenant;
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  const document = fauxDoc();
  const ouverts = [];
  const prelude = `
    var _loginVoirTous = ${voirTous ? 'true' : 'false'};
    var _loginMemAlerte = false;
    var MEMBRES = membres;
    var LP_COLORS = ['#c1','#c2','#c3','#c4','#c5'];
    function getRoleLabel(r){ return (r||[]).join('+'); }
    function selectProfile(idx){ ouverts.push(idx); }
    function _loginMemSignale(){}
  `;
  const f = new Function('membres','localStorage','document','ouverts','window',
    prelude + blocMem + '\n' + blocRender +
    '\n return { rendre:_loginRenderTuiles, voirTous:_loginVoirTousProfils, ' +
    'oublier:_loginMemOublier, ecrire:_loginMemEcrire, lire:_loginMemLire, cle:_loginMemKey };');
  const api = f(membres, localStorage, document, ouverts, { logError(){} });
  return { api, document, ouverts, store };
}

const EQUIPE = [
  { nom:'Alexandre', roles:['admin'],   statut:'Actif' },
  { nom:'Nico',      roles:['ouvrier'], statut:'Actif' },
  { nom:'Parti',     roles:['ouvrier'], statut:'Inactif' },
  { nom:'Simon',     roles:['ouvrier'], statut:'Actif' },
];
const tuiles = (d) => d.noeuds['login-profiles'].enfants;
const nomAffiche = (t) => t.enfants.find((x) => x.className === 'lp-name').textContent;

console.log('\n1. La tuile unique');
{
  const { api, document } = monte({ membres: EQUIPE, memoire: 'Nico' });
  api.rendre();
  verifie('une seule tuile est rendue', tuiles(document).length === 1, 'rendu ' + tuiles(document).length);
  verifie('c\'est bien la bonne personne', nomAffiche(tuiles(document)[0]) === 'Nico');
  verifie('le lien de sortie est VISIBLE', document.noeuds['login-autres'].style.display === 'block');
  verifie('le sous-titre change', document.noeuds['login-sub-txt'].textContent === 'Bon retour');
  const grille = document.noeuds['login-profiles'].style;
  verifie('la tuile seule est centree', grille.justifyContent === 'center', grille.justifyContent);
  verifie('la grille passe a une colonne bornee',
    grille.gridTemplateColumns === 'minmax(0, 240px)', grille.gridTemplateColumns);
}

console.log('\n2. ⚠️ L\'index d\'origine — le piège du lot');
{
  const { api, document, ouverts } = monte({ membres: EQUIPE, memoire: 'Simon' });
  api.rendre();
  // Simon est l'indice 3 de MEMBRES. Filtré puis réindexé, il deviendrait 2 (ou 0)
  // et le clic ouvrirait la fiche de quelqu'un d'autre.
  tuiles(document)[0].clics.forEach((f) => f());
  verifie('le clic passe l\'index MEMBRES (3), pas un index de tableau filtre',
    ouverts.length === 1 && ouverts[0] === 3, 'recu ' + JSON.stringify(ouverts));
  verifie('la couleur suit aussi l\'index d\'origine',
    tuiles(document)[0].enfants.find((x) => x.className === 'lp-avatar').style.background === '#c4');
}

console.log('\n3. Les garde-fous');
{
  const { api, document } = monte({ membres: EQUIPE, memoire: '' });
  api.rendre();
  verifie('aucun souvenir → liste entiere (3 actifs sur 4)', tuiles(document).length === 3);
  verifie('l\'Inactif reste masque', !tuiles(document).some((t) => nomAffiche(t) === 'Parti'));
  verifie('le lien de sortie est masque', document.noeuds['login-autres'].style.display === 'none');
  verifie('le sous-titre reste celui d\'origine',
    document.noeuds['login-sub-txt'].textContent === 'Choisissez votre profil');
  const g3 = document.noeuds['login-profiles'].style;
  verifie('liste entiere : grille a deux colonnes, non centree',
    g3.justifyContent === '' && g3.gridTemplateColumns === '');
}
{
  const { api, document } = monte({ membres: EQUIPE, memoire: 'Quelqun-Dautre' });
  api.rendre();
  verifie('souvenir orphelin → liste entiere, sans rien casser', tuiles(document).length === 3);
}
{
  const { api, document } = monte({ membres: EQUIPE, memoire: 'Parti' });
  api.rendre();
  verifie('souvenir pointant un Inactif → liste entiere', tuiles(document).length === 3);
}
{
  const seul = [{ nom:'Nico', roles:['admin'], statut:'Actif' }];
  const { api, document } = monte({ membres: seul, memoire: 'Nico' });
  api.rendre();
  verifie('domaine a UN seul membre → pas de lien de sortie inutile',
    tuiles(document).length === 1 && document.noeuds['login-autres'].style.display === 'none');
}
{
  const { api, document } = monte({ membres: EQUIPE, memoire: 'nico' });
  api.rendre();
  verifie('la casse du souvenir ne compte pas', tuiles(document).length === 1);
}

console.log('\n4. « Ce n\'est pas moi »');
{
  const { api, document } = monte({ membres: EQUIPE, memoire: 'Nico' });
  api.rendre();
  api.voirTous();
  verifie('le lien rouvre la liste entiere', tuiles(document).length === 3);
  verifie('le lien se masque une fois la liste ouverte',
    document.noeuds['login-autres'].style.display === 'none');
  // ⚠ Sans remise a zero, la liste entiere s'afficherait en UNE colonne etroite.
  const g2 = document.noeuds['login-profiles'].style;
  verifie('le centrage est ANNULE au retour a la liste',
    g2.justifyContent === '' && g2.gridTemplateColumns === '',
    JSON.stringify([g2.justifyContent, g2.gridTemplateColumns]));
  verifie('le souvenir n\'est PAS efface (on regarde, on ne renonce pas)',
    api.lire() === 'Nico', api.lire());
}

console.log('\n5. La memoire est par domaine');
{
  const a = monte({ membres: EQUIPE, memoire: 'Nico', tenant: 'marchand-grillot' });
  verifie('la cle porte le tenant', a.api.cle() === 'mavigne_profil_marchand-grillot');
  const b = monte({ membres: EQUIPE, memoire: '', tenant: 'chapelle' });
  b.api.ecrire('Alexandre');
  verifie('ecrire sur un domaine ne touche pas l\'autre',
    b.store['mavigne_profil_chapelle'] === 'Alexandre' && !('mavigne_profil_marchand-grillot' in b.store));
  b.api.oublier();
  verifie('oublier efface bien', b.api.lire() === '');
}

console.log('\n' + (ko === 0 ? c.g(`✓ UX-LOGIN : ${ok} verifications, 0 rouge`) : c.r(`✗ UX-LOGIN : ${ko} rouge(s) sur ${ok + ko}`)));
process.exit(ko === 0 ? 0 : 1);
