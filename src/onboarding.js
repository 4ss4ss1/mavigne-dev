// ════════════════════════════════════════════════════════════════
// MA VIGNE — src/onboarding.js
// Onboarding initial (nouveau tenant) + Login caché GUERETTECH
// Phase 2a — extrait depuis app.js
// © 2026 Nicolas GUERET / GUERETTECH
// ════════════════════════════════════════════════════════════════
//
// Dépendances (via window.*) :
//   window.fbSave, window.fbSetTenant    ← firebase.js
//   window.TACHES, window.PARCELLES, window.MEMBRES,
//   window.SAISONS, window.CONFIG, window.DOMAINE_NOM
//   window.currentUser                   ← app.js globals
//   window.applyDomNom, window.applyRoles,
//   window.updateNavForRoles, window.goHub, window.fetchMeteo ← app.js
//   firebase.auth()                      ← CDN global (SDK compat)
//
// GT_ADMIN_EMAIL importé depuis utils.js — source de vérité unique
import { GT_ADMIN_EMAIL, _escHtml } from './utils.js';
// ════════════════════════════════════════════════════════════════

const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if(DEBUG) console.log('[Ma Vigne] onboarding.js chargé');

// ════ VARIABLES D'ÉTAT ONBOARDING ════
var _obStep = 1;
var _obDomaine = { nom:'', slug:'', lat:'', lon:'' };
var _obParcelles = [];
var _obMembres = []; // membres supplémentaires (hors admin)
var _obRolesActifs = {};
var _obTachesCustom = [];
var _obTachesSel = [];

var OB_TACHES = [
  {nom:'Taille',        label:'Taille',        hha:70, saison:'Hiver'},
  {nom:'Tirage',        label:'Tirage',         hha:40, saison:'Hiver'},
  {nom:'Brulage',       label:'Brûlage',        hha:40, saison:'Hiver'},
  {nom:'Reparation',    label:'Réparation',     hha:30, saison:'Printemps'},
  {nom:'Pliage',        label:'Pliage',         hha:45, saison:'Printemps'},
  {nom:'Plantation',    label:'Plantation',     hha:15, saison:'Printemps'},
  {nom:'Ebourgeonnage', label:'Ébourgeonnage',  hha:35, saison:'Printemps'},
  {nom:'Pioche',        label:'Pioche',         hha:40, saison:'Printemps'},
  {nom:'Relevage',      label:'Relevage',       hha:100, saison:'Printemps', type:'niveaux', niveaux:[{num:1,hha:50},{num:2,hha:25},{num:3,hha:25}], skipRule:true},
  {nom:'Accolage',      label:'Accolage',       hha:50, saison:'Printemps'},
  {nom:'Palissage',     label:'Palissage',      hha:50, saison:'Printemps'}
];

var OB_MBR_COLORS = ['#1A4A7A','#7A4F2E','#5B2D8E','#B8913A','#C0392B','#1A5276','#2E86C1'];

function obSlugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').substring(0,40);
}

function obShowToast(msg) {
  var t = document.getElementById('ob-toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(function(){ t.classList.remove('show'); }, 2500);
}

function obHighlight(id) {
  var el = document.getElementById(id);
  if(!el) return;
  el.classList.add('ob-error');
  setTimeout(function(){ el.classList.remove('ob-error'); }, 1500);
}

// ── Slug ──
function obUpdateSlug() {
  var val = document.getElementById('ob-domaine').value.trim();
  var derived = obSlugify(val);
  // Domaine ouvert via lien d'invitation GT → le slug technique est IMPOSÉ (déjà au
  // registre, status « en attente »). Le prospect ne saisit que le nom d'affichage.
  var linkSlug = ''; try { linkSlug = localStorage.getItem('mavigne_tenant')||''; } catch(e){}
  var slug = linkSlug || derived;
  _obDomaine.nom = val; _obDomaine.slug = slug;
  var preview = document.getElementById('ob-slug-preview');
  if(slug){ preview.style.display='flex'; document.getElementById('ob-slug-val').textContent=slug; }
  else { preview.style.display='none'; }
}

// ── Parcelles ──
function obAddParcelle() {
  var nom = document.getElementById('ob-parc-nom').value.trim();
  var surf = parseFloat(document.getElementById('ob-parc-surf').value);
  if(!nom){ obShowToast('Nom de parcelle requis'); return; }
  if(!surf||surf<=0){ obShowToast('Surface invalide'); return; }
  _obParcelles.push({nom:nom,surface:surf,statut:'Active',taches:{}});
  document.getElementById('ob-parc-nom').value='';
  document.getElementById('ob-parc-surf').value='';
  obRenderParcelles();
}
function obRemoveParcelle(i){ _obParcelles.splice(i,1); obRenderParcelles(); }
function obRenderParcelles() {
  var list = document.getElementById('ob-parcelle-list');
  var total = _obParcelles.reduce(function(s,p){return s+p.surface;},0);
  var totalEl = document.getElementById('ob-total-surf');
  if(_obParcelles.length===0){list.innerHTML='';totalEl.style.display='none';return;}
  totalEl.style.display='block';
  document.getElementById('ob-surf-val').textContent=total.toFixed(2);
  list.innerHTML=_obParcelles.map(function(p,i){
    return '<div class="ob-parcelle-item">'
      +'<div class="ob-parcelle-nom">'+_escHtml(p.nom)+'</div>'
      +'<div class="ob-parcelle-surf">'+p.surface.toFixed(2)+' ha</div>'
      +'<div class="ob-parcelle-del" onclick="obRemoveParcelle('+i+')">✕</div>'
      +'</div>';
  }).join('');
}

// ── Membres supplémentaires ──
function obToggleRole(role, el) {
  if(_obRolesActifs[role]){delete _obRolesActifs[role];el.classList.remove('active');}
  else{_obRolesActifs[role]=true;el.classList.add('active');}
}
function obAddMembre() {
  var nom = document.getElementById('ob-mbr-nom').value.trim();
  var email = document.getElementById('ob-mbr-email').value.trim();
  var roles = Object.keys(_obRolesActifs);
  if(!nom){obShowToast('Prénom requis');return;}
  if(!email){obShowToast('Email requis');return;}
  if(roles.length===0){obShowToast('Sélectionnez au moins un rôle');return;}
  _obMembres.push({nom:nom,email:email,roles:roles,couleur:OB_MBR_COLORS[_obMembres.length%OB_MBR_COLORS.length]});
  document.getElementById('ob-mbr-nom').value='';
  document.getElementById('ob-mbr-email').value='';
  _obRolesActifs={};
  document.querySelectorAll('#ob-roles-row .ob-role-chip').forEach(function(c){c.classList.remove('active');});
  obRenderMembres();
}
function obRemoveMembre(i){ _obMembres.splice(i,1); obRenderMembres(); }
function obRenderMembres() {
  var list = document.getElementById('ob-membre-list');
  if(_obMembres.length===0){list.innerHTML='';return;}
  list.innerHTML=_obMembres.map(function(m,i){
    return '<div class="ob-membre-item">'
      +'<div class="ob-mbr-avatar" style="background:'+m.couleur+'">'+m.nom.charAt(0).toUpperCase()+'</div>'
      +'<div class="ob-mbr-info"><div class="ob-mbr-nom">'+_escHtml(m.nom)+'</div>'
      +'<div class="ob-mbr-roles">'+m.roles.join(', ')+' · '+_escHtml(m.email)+'</div></div>'
      +'<div class="ob-mbr-del" onclick="obRemoveMembre('+i+')">✕</div>'
      +'</div>';
  }).join('');
}

// ── Force mot de passe ──
function obCheckPwd() {
  var pwd = document.getElementById('ob-admin-pwd').value;
  var bar = document.getElementById('ob-pwd-strength');
  var score = 0;
  if(pwd.length>=8) score++;
  if(/[A-Z]/.test(pwd)) score++;
  if(/[0-9]/.test(pwd)) score++;
  if(/[^A-Za-z0-9]/.test(pwd)) score++;
  var colors = ['#A0291E','#B85A1A','#B8913A','#3D6B27'];
  var widths = ['25%','50%','75%','100%'];
  bar.style.width = pwd.length>0 ? widths[score-1]||'10%' : '0';
  bar.style.background = pwd.length>0 ? colors[score-1]||'#A0291E' : '#A0291E';
}

// ── Tâches ──
function obInitTaches() {
  if(_obTachesSel.length===0){
    _obTachesSel = OB_TACHES.filter(function(t){return t.saison==='Printemps';}).map(function(t){return t.nom;});
  }
  obRenderTachesGrid();
}
function obRenderTachesGrid() {
  var toutes = OB_TACHES.concat(_obTachesCustom);
  var grid = document.getElementById('ob-taches-grid');
  if(!grid) return;
  grid.innerHTML = toutes.map(function(t){
    var isActive = _obTachesSel.indexOf(t.nom)>=0;
    var cls = 'ob-tache-chip'+(isActive?' active':'')+(t.custom?' ob-custom':'');
    return '<div class="'+cls+'" onclick="obToggleTache(\'' + t.nom + '\',this)">'
      +'<div class="ob-tache-nom">'+t.label+(t.custom?' <span style="font-size:9px;opacity:0.5">✦</span>':'')+'</div>'
      +'<div class="ob-tache-hha">'+(t.hha||'—')+' h/ha</div>'
      +'</div>';
  }).join('');
}
function obToggleTache(nom, el) {
  var idx = _obTachesSel.indexOf(nom);
  if(idx>=0){_obTachesSel.splice(idx,1);el.classList.remove('active');}
  else{_obTachesSel.push(nom);el.classList.add('active');}
  obUpdateRecap();
}
function obAddTacheCustom() {
  var nom = document.getElementById('ob-tache-custom').value.trim();
  var hha = parseInt(document.getElementById('ob-tache-hha').value)||0;
  if(!nom){obShowToast('Nom de tâche requis');return;}
  var toutes = OB_TACHES.concat(_obTachesCustom);
  if(toutes.some(function(t){return t.label.toLowerCase()===nom.toLowerCase();})){obShowToast('Tâche déjà présente');return;}
  var slug = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'_');
  _obTachesCustom.push({nom:slug,label:nom,hha:hha,custom:true});
  _obTachesSel.push(slug);
  document.getElementById('ob-tache-custom').value='';
  document.getElementById('ob-tache-hha').value='';
  obRenderTachesGrid();
  obUpdateRecap();
}

// ── Récap ──
function obUpdateRecap() {
  var surfTot = _obParcelles.reduce(function(s,p){return s+p.surface;},0);
  var adminNom = document.getElementById('ob-admin-nom').value.trim()||'—';
  var toutes = OB_TACHES.concat(_obTachesCustom);
  var tachesLabels = _obTachesSel.map(function(n){
    var t = toutes.filter(function(t){return t.nom===n;})[0];
    return t?t.label:n;
  }).join(', ')||'—';
  var el = document.getElementById('ob-recap');
  if(!el) return;
  el.innerHTML =
    '<div class="ob-recap-row"><span class="ob-recap-key">Domaine</span><span class="ob-recap-val">'+_escHtml(_obDomaine.nom||'—')+'</span></div>'
    +'<div class="ob-recap-row"><span class="ob-recap-key">Identifiant</span><span class="ob-recap-val" style="font-family:monospace;color:#B8913A">'+(_obDomaine.slug||'—')+'</span></div>'
    +'<div class="ob-recap-row"><span class="ob-recap-key">Parcelles</span><span class="ob-recap-val">'+_obParcelles.length+' · '+surfTot.toFixed(2)+' ha</span></div>'
    +'<div class="ob-recap-row"><span class="ob-recap-key">Admin</span><span class="ob-recap-val">'+_escHtml(adminNom)+'</span></div>'
    +'<div class="ob-recap-row"><span class="ob-recap-key">Équipe</span><span class="ob-recap-val">'+(_obMembres.length+1)+' membres</span></div>'
    +'<div class="ob-recap-row"><span class="ob-recap-key">Saison</span><span class="ob-recap-val">'+(document.getElementById('ob-saison')?document.getElementById('ob-saison').value:'—')+'</span></div>'
    +'<div class="ob-recap-row"><span class="ob-recap-key">Tâches</span><span class="ob-recap-val">'+tachesLabels+'</span></div>';
}

// ── Navigation ──
function obGoToStep(n) {
  document.querySelectorAll('.ob-screen').forEach(function(s){s.classList.remove('active');});
  var screen = document.getElementById('ob-screen-'+n);
  if(screen) screen.classList.add('active');
  for(var i=1;i<=4;i++){
    var bar=document.getElementById('ob-bar-'+i);
    var lbl=document.getElementById('ob-lbl-'+i);
    if(!bar) continue;
    bar.className='ob-step'+(i<n?' done':i===n?' active':'');
    lbl.className='ob-step-lbl'+(i<n?' done':i===n?' active':'');
  }
  var btnBack=document.getElementById('ob-btn-back');
  var btnNext=document.getElementById('ob-btn-next');
  var footer=document.getElementById('ob-footer');
  if(btnBack) btnBack.style.display=(n>1&&n<=4)?'':'none';
  if(n===4){
    if(btnNext){btnNext.textContent='✓ Lancer Ma Vigne';btnNext.classList.add('ob-green');}
  } else if(n===5){
    if(footer) footer.style.display='none';
  } else {
    if(btnNext){btnNext.textContent='Suivant →';btnNext.classList.remove('ob-green');}
  }
  if(n===2) obRenderParcelles();
  if(n===3) obRenderMembres();
  if(n===4){ obInitTaches(); obUpdateRecap(); }
  _obStep=n;
}
function obNextStep(){ if(obValidateStep(_obStep)) obGoToStep(_obStep+1); }
function obPrevStep(){ if(_obStep>1) obGoToStep(_obStep-1); }

// ── Validation ──
function obValidateStep(n){
  if(n===1){
    if(!_obDomaine.nom){obShowToast('Nom du domaine requis');obHighlight('ob-domaine');return false;}
    if(!_obDomaine.slug){obShowToast('Nom invalide');return false;}
    var _RESERVED=['demo','guerettech','admin','mavigne','test','api','www','app','staging'];
    if(_RESERVED.indexOf(_obDomaine.slug)>=0){
      obShowToast('\u274C Identifiant "\u202F'+_obDomaine.slug+'\u202F" r\u00e9serv\u00e9 \u2014 choisissez un autre nom');
      obHighlight('ob-domaine');
      return false;
    }
    _obDomaine.lat=document.getElementById('ob-lat').value;
    _obDomaine.lon=document.getElementById('ob-lon').value;
    return true;
  }
  if(n===2){
    if(_obParcelles.length===0){obShowToast('Ajoutez au moins une parcelle');return false;}
    return true;
  }
  if(n===3){
    var nom=document.getElementById('ob-admin-nom').value.trim();
    var email=document.getElementById('ob-admin-email').value.trim();
    var pwd=document.getElementById('ob-admin-pwd').value;
    var pwd2=document.getElementById('ob-admin-pwd2').value;
    if(!nom){obShowToast('Prénom requis');obHighlight('ob-admin-nom');return false;}
    if(!email||!email.includes('@')){obShowToast('Email invalide');obHighlight('ob-admin-email');return false;}
    if(pwd.length<8){obShowToast('Mot de passe trop court (8 caractères min.)');obHighlight('ob-admin-pwd');return false;}
    if(pwd!==pwd2){obShowToast('Les mots de passe ne correspondent pas');obHighlight('ob-admin-pwd2');return false;}
    return true;
  }
  if(n===4){
    var saisonNom=document.getElementById('ob-saison').value.trim();
    if(!saisonNom){obShowToast('Nom de saison requis');obHighlight('ob-saison');return false;}
    if(_obTachesSel.length===0){obShowToast('Sélectionnez au moins une tâche');return false;}
    var cguCheck=document.getElementById('ob-cgu-check');
    if(!cguCheck||!cguCheck.checked){obShowToast('Veuillez accepter les CGU pour continuer');obHighlight('ob-cgu-check');return false;}
    return true;
  }
  return true;
}

// ── CGU acceptance ──
function obToggleCGU(checked) {
  var btn = document.getElementById('ob-btn-next');
  if(!btn) return;
  // Le bouton "Finaliser" (step 4) est visuellement grisé si CGU non cochée
  btn.style.opacity = checked ? '1' : '0.45';
  btn.style.pointerEvents = checked ? '' : 'none';
  // Note : le guard réel est dans obValidateStep(4)
  // Un tap sur le bouton grisé affiche le toast explicatif
  if(!checked) {
    btn.style.pointerEvents = '';
    btn.style.opacity = '';
  }
}

// ── Finalisation ──
async function obFinalize() {
  var screen5 = document.getElementById('ob-screen-5');
  var finSub = document.getElementById('ob-finish-sub');
  var finBadges = document.getElementById('ob-finish-badges');

  // Récupérer les valeurs finales
  var adminNom   = document.getElementById('ob-admin-nom').value.trim();
  var adminEmail = document.getElementById('ob-admin-email').value.trim();
  var adminPwd   = document.getElementById('ob-admin-pwd').value;
  var saisonNom  = document.getElementById('ob-saison').value.trim();

  obGoToStep(5);
  if(finSub) finSub.textContent='Vérification de l\u2019identifiant…';

  try {
    // 0. Vérifier que le tenant n'existe pas déjà
    var _linkSlugNow = ''; try { _linkSlugNow = localStorage.getItem('mavigne_tenant')||''; } catch(e){}
    // La garde de collision ne vaut que pour un slug choisi librement (sans lien). Pour un
    // domaine ouvert via lien GT, le slug EST déjà au registre (« en attente ») — c'est
    // onboardTenant qui tranche côté serveur (statut + absence de membres). On saute donc.
    if(window.fbCheckTenantExists && _obDomaine.slug !== _linkSlugNow) {
      var _tenantPris = await window.fbCheckTenantExists(_obDomaine.slug);
      if(_tenantPris) {
        obShowToast('\u274C Cet identifiant est d\u00e9j\u00e0 utilis\u00e9 \u2014 choisissez un autre nom de domaine');
        var footer2 = document.getElementById('ob-footer');
        if(footer2) footer2.style.display='';
        var btnNext2 = document.getElementById('ob-btn-next');
        var btnBack2 = document.getElementById('ob-btn-back');
        if(btnNext2){btnNext2.textContent='\u2713 Lancer Ma Vigne';btnNext2.classList.add('ob-green');btnNext2.onclick=obFinalize;}
        if(btnBack2){btnBack2.style.display='';btnBack2.onclick=function(){obGoToStep(1);};}
        if(finSub) finSub.textContent='\u274C Identifiant d\u00e9j\u00e0 utilis\u00e9';
        return;
      }
    }
    if(finSub) finSub.textContent='Préparation des données…';

    // 1. Construire les données initiales du domaine
    var adminMembre = {nom:adminNom, email:adminEmail, roles:['admin','ouvrier','tractoriste'], couleur:'#3D6B27', statut:'actif'};
    var tousLesMembres = [adminMembre].concat(_obMembres.map(function(m,i){
      return {nom:m.nom,email:m.email,roles:m.roles,couleur:m.couleur,statut:'actif'};
    }));

    // Ajouter les tâches custom au catalogue global TACHES
    _obTachesCustom.forEach(function(tc){
      if(!window.TACHES.find(function(t){return t.nom===tc.nom;})){
        window.TACHES.push({nom:tc.nom,hha:tc.hha,saison:'Custom'});
      }
    });

    // Modele « periode par dates » (refonte campagne) : _saisonForDate() exige debut ET fin.
    // Sans elles la periode est INVISIBLE : journal non rattache, frise annuelle vide, Pilotage aveugle.
    // Defaut = annee civile courante (convention millesime du projet, aucun trou dans la frise).
    // Le domaine affine ensuite dans Reglages > Campagne.
    var _obSaisY = new Date().getFullYear();
    var saisonObj = [{nom:saisonNom, periode:'janv. '+_obSaisY+' – déc. '+_obSaisY,
                     debut:_obSaisY+'-01-01', fin:_obSaisY+'-12-31',
                     active:true, taches:_obTachesSel}];
    var configObj = {domaine_nom:_obDomaine.nom, lat:parseFloat(_obDomaine.lat)||47.22, lon:parseFloat(_obDomaine.lon)||4.97, onboarding_done:true};

    // 2. Création SERVEUR : compte admin AVEC le claim tenant (+ plan/essai posés par GT
    //    dans le registre) ET écriture des docs initiaux via l'Admin SDK. Indispensable :
    //    sans le claim tenant, toute écriture Firestore du nouveau domaine est refusée
    //    par les règles (c'était la cause du « la synchro ne fonctionne pas »).
    if(finSub) finSub.textContent='Création du domaine…';
    await window._fbOnboardTenant({
      slug:      _obDomaine.slug,
      email:     adminEmail,
      password:  adminPwd,
      adminNom:  adminNom,
      membres:   tousLesMembres,
      parcelles: _obParcelles,
      saisons:   saisonObj,
      taches:    window.TACHES,
      config:    configObj
    });

    // 3. Activer le tenant côté client puis se connecter (charge les custom claims)
    localStorage.setItem('mavigne_tenant', _obDomaine.slug);
    if(window.fbSetTenant) window.fbSetTenant(_obDomaine.slug);
    if(finSub) finSub.textContent='Connexion…';
    var cred = await firebase.auth().signInWithEmailAndPassword(adminEmail, adminPwd);
    try { await cred.user.getIdToken(true); } catch(e){}   // claims tenant/plan/essai frais

    // 4. Appliquer dans les variables globales
    window.PARCELLES.length=0; _obParcelles.forEach(function(p){window.PARCELLES.push(p);});
    window.MEMBRES = tousLesMembres;
    window.SAISONS = saisonObj;
    // window.TACHES — synchronisé via push() ci-dessus
    window.CONFIG = configObj;
    window.DOMAINE_NOM = _obDomaine.nom;

    // 5. Poser le flag migration (pas de migration sur un nouveau domaine)
    localStorage.setItem('mavigne_migrated_v1','1');

    // 6. Badges de confirmation
    if(finSub) finSub.textContent='Votre domaine est prêt !';
    var surfTot = _obParcelles.reduce(function(s,p){return s+p.surface;},0);
    var badges = [_obDomaine.nom, _obParcelles.length+' parcelles · '+surfTot.toFixed(2)+' ha', tousLesMembres.length+' membres', saisonNom];
    if(finBadges) finBadges.innerHTML = badges.map(function(b){return '<span class="ob-finish-badge">'+_escHtml(b)+'</span>';}).join('');

    // 7. Lancer l'app après 2s
    setTimeout(function(){
      document.getElementById('onboarding-screen').style.display='none';
      if(window.setCurrentUser) window.setCurrentUser(adminMembre);
      else window.currentUser = adminMembre;
      window.currentUser._firebaseUser = cred.user;
      if(window.applyDomNom) window.applyDomNom();
      if(window.applyRoles) window.applyRoles();
      if(window.updateNavForRoles) window.updateNavForRoles();
      if(window._mvApplyTrialGating) window._mvApplyTrialGating();   // bandeau J-X si essai 15 j
      if(window.goHub) window.goHub();
      if(window.fetchMeteo) window.fetchMeteo();
      if(navigator.onLine && window._fbLoadAfterAuth) window._fbLoadAfterAuth();
    }, 2000);

  } catch(e) {
    console.error('[Onboarding] Erreur:', e);
    var _ac = (e && e.details && e.details.authCode) || (e && e.code) || '';
    var msg = (String(_ac).indexOf('email-already') >= 0)
      ? '❌ Cet email est déjà utilisé. Choisissez-en un autre.'
      : (String(_ac).indexOf('weak-password') >= 0)
      ? '❌ Mot de passe trop faible (6 caractères minimum).'
      : '❌ ' + ((e && e.message) || 'Erreur — réessayez.');
    obShowToast(msg);
    // Revenir a l'ecran 4 (recap + champs admin/email) pour corriger et relancer.
    // obGoToStep(4) reaffiche le footer, repositionne les barres d'etapes et restaure
    // le bouton Retour ; on rebranche ensuite le bouton principal sur la finalisation.
    obGoToStep(4);
    var btnNext = document.getElementById('ob-btn-next');
    var btnBack = document.getElementById('ob-btn-back');
    if(btnNext){btnNext.textContent='\u2713 Lancer Ma Vigne';btnNext.classList.add('ob-green');btnNext.onclick=obFinalize;}
    if(btnBack){btnBack.style.display='';btnBack.onclick=obPrevStep;}
  }
}

// ── Point d'entrée ──
function obStart() {
  // Si step 4 → lancer la finalisation au lieu de nextStep
  if(_obStep===4){
    if(obValidateStep(4)) obFinalize();
    return;
  }
  obNextStep();
}

function showOnboarding() {
  window._obAuthCred = null; // repartir propre a chaque ouverture d'onboarding
  // Pré-poser le slug du lien d'invitation (s'il existe) au cas où le prospect
  // validerait sans avoir déclenché obUpdateSlug.
  try { var _ls = localStorage.getItem('mavigne_tenant'); if(_ls) _obDomaine.slug = _ls; } catch(e){}
  // Le modele par TYPE de saison est mort : le nom d'une periode est libre. Le defaut
  // « Printemps 2026 » d'index.html est a la fois un nom de type et une annee figee en dur.
  // Corrige ici en JS (onboarding.js seul = aucun bump).
  try {
    var _obSaIn = document.getElementById('ob-saison');
    if(_obSaIn && (!_obSaIn.value.trim() || /^(Printemps|Été|Ete|Automne|Hiver)\s+\d{4}$/.test(_obSaIn.value.trim())))
      _obSaIn.value = 'Campagne ' + new Date().getFullYear();
  } catch(e){ if(window.logError) window.logError({level:'info', cat:'onboarding', msg:'defaut nom campagne'}); }
  var screen = document.getElementById('onboarding-screen');
  if(screen){ screen.style.display='flex'; obGoToStep(1); }
  // Rebrancher le bouton next sur obStart
  var btnNext = document.getElementById('ob-btn-next');
  if(btnNext) btnNext.onclick = obStart;
}


// ── Accueil public — mavigneapp.fr sans domaine ───────────────────────────
// Avant : tout visiteur sans tenant (ni localStorage, ni claim) tombait sur l'assistant
// « Configuration initiale ». Il ne pouvait pas aboutir — onboardTenant refuse côté serveur
// tout slug absent du registre GUERETTECH. Mauvaise porte d'entrée pour un prospect.
// Ici : les trois portes réelles, dans l'écran de connexion existant (aucun HTML nouveau).
// Le logo reste tapable 5 fois → panneau GT, même sans tenant.
var _mvLandingTapOn = false;

function _mvLandingQ(sel) {
  var pr = document.getElementById('login-profiles');
  return pr ? pr.querySelector(sel) : null;   // C11 : ids generes en JS → classes + querySelector
}

function _mvLandingTile(fn, ico, titre, sub, or_) {
  var bg = or_ ? 'rgba(184,145,58,0.10)' : 'rgba(255,255,255,0.05)';
  var bd = or_ ? 'rgba(184,145,58,0.30)' : 'rgba(255,255,255,0.12)';
  return '<div onclick="' + fn + '" style="display:flex;align-items:center;gap:12px;background:' + bg
    + ';border:1px solid ' + bd + ';border-radius:13px;padding:14px;margin-bottom:10px;'
    + 'cursor:pointer;min-height:44px;box-sizing:border-box">'
    + '<span style="font-size:19px;line-height:1">' + ico + '</span>'
    + '<span style="flex:1">'
    + '<span style="display:block;font-size:14px;color:rgba(255,255,255,0.92)">' + titre + '</span>'
    + '<span style="display:block;font-size:11px;color:rgba(255,255,255,0.42);margin-top:2px">' + sub + '</span>'
    + '</span>'
    + '<span style="font-size:15px;color:rgba(255,255,255,0.3)">&#8250;</span>'
    + '</div>';
}

// Appelée depuis firebase.js (_fbLoad) → déclarée en window.* (C15).
window.showPublicLanding = function () {
  var scr = document.getElementById('onboarding-screen');
  if (scr) scr.style.display = 'none';
  var log = document.getElementById('login-screen');
  if (log) log.style.display = 'flex';
  var sub = document.getElementById('login-sub-txt');
  if (sub) sub.textContent = 'Gestion viticole';
  var pw = document.getElementById('login-pwd-panel');
  if (pw) pw.style.display = 'none';
  var fg = document.getElementById('login-forgot-panel');
  if (fg) fg.style.display = 'none';
  if (!_mvLandingTapOn && typeof window.initGTLoginTap === 'function') {
    window.initGTLoginTap(); _mvLandingTapOn = true;
  }
  var pr = document.getElementById('login-profiles');
  if (!pr) return;
  pr.style.display = 'block';   // .login-profiles est en grid 2 colonnes → un seul enfant
  pr.innerHTML =
      '<div style="max-width:340px;margin:0 auto">'
    + '<div class="mvl-choix">'
    + _mvLandingTile('mvLandingSite()', '&#128214;', 'Découvrir Ma Vigne', 'Fonctions, formules, tarifs', true)
    + _mvLandingTile('mvLandingDemo()', '&#9654;&#65039;', 'Voir la démo', 'Visite guidée, sans compte', false)
    + _mvLandingTile('mvLandingLink()', '&#128279;', 'J’ai un lien d’installation', 'Coller le lien reçu', false)
    + '</div>'
    + '<div class="mvl-form" style="display:none">'
    + '<div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.45);margin-bottom:6px;letter-spacing:.06em">LIEN OU IDENTIFIANT DU DOMAINE</div>'
    + '<input class="mvl-input" type="text" placeholder="mavigneapp.fr/?tenant=…" autocomplete="off" autocapitalize="off" spellcheck="false"'
    + ' style="width:100%;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.15);border-radius:12px;'
    + 'padding:13px 14px;font-size:16px;color:#F5EEDF;box-sizing:border-box"'
    + ' onkeydown="if(event.keyCode===13)mvLandingGo()">'
    + '<div class="mvl-err" style="display:none;font-size:12px;color:#E07060;margin-top:8px"></div>'
    + '<button onclick="mvLandingGo()" style="width:100%;margin-top:12px;background:var(--or);color:#0C1A0A;border:none;'
    + 'border-radius:12px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:Outfit,sans-serif">Ouvrir mon domaine</button>'
    + '<div onclick="mvLandingBack()" style="text-align:center;margin-top:14px;font-size:12px;color:rgba(255,255,255,0.45);cursor:pointer;padding:8px">&#8249; Retour</div>'
    + '</div>'
    + '<div style="text-align:center;margin-top:22px;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.7">'
    + 'Accès réservé aux domaines clients<br>'
    + '<a href="tel:+33699424859" style="color:var(--or);text-decoration:none">06 99 42 48 59</a></div>'
    + '</div>';
};

function mvLandingSite() { location.href = '/logiciel-vigne.html'; }
function mvLandingDemo() { location.href = '/?demo=visite'; }

function mvLandingLink() {
  var c = _mvLandingQ('.mvl-choix'), f = _mvLandingQ('.mvl-form');
  if (c) c.style.display = 'none';
  if (f) f.style.display = 'block';
  setTimeout(function () { var i = _mvLandingQ('.mvl-input'); if (i) i.focus(); }, 80);
}

function mvLandingBack() {
  var c = _mvLandingQ('.mvl-choix'), f = _mvLandingQ('.mvl-form');
  if (f) f.style.display = 'none';
  if (c) c.style.display = 'block';
  var e = _mvLandingQ('.mvl-err');
  if (e) { e.style.display = 'none'; e.textContent = ''; }
}

// Accepte le lien complet (https://mavigneapp.fr/?tenant=slug) ou le seul identifiant.
function mvLandingGo() {
  var inp = _mvLandingQ('.mvl-input'), err = _mvLandingQ('.mvl-err');
  if (!inp) return;
  var v = (inp.value || '').trim();
  var m = v.match(/[?&]tenant=([^&#\s]+)/i);
  var slug = (m ? m[1] : v).trim().toLowerCase();
  slug = slug.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug) || slug.length > 50) {
    if (err) { err.style.display = 'block'; err.textContent = 'Lien non reconnu. Collez le lien reçu de GUERETTECH.'; }
    return;
  }
  if (err) err.style.display = 'none';
  location.href = '/?tenant=' + encodeURIComponent(slug);
}


// ── Login caché GUERETTECH ────────────────────────────────────────────────────
// Déclenché par 5 taps rapides sur le logo (dans les 2s) — invisible aux utilisateurs
var _gtTapCount = 0, _gtTapTimer = null;

function initGTLoginTap() {
  var logo = document.getElementById('login-logo-tap');
  if (!logo) return;
  logo.addEventListener('click', function() {
    _gtTapCount++;
    clearTimeout(_gtTapTimer);
    if (_gtTapCount >= 5) {
      _gtTapCount = 0;
      showGTLoginPanel();
      return;
    }
    _gtTapTimer = setTimeout(function() { _gtTapCount = 0; }, 2000);
  });
}

function showGTLoginPanel() {
  // SEC-GT/2 — l'ecran peut avoir ete laisse en mode « saisie du code » par une
  // tentative precedente : on repart toujours de l'etat mot de passe.
  var _ob=document.getElementById('gt-otp-box');   if(_ob) _ob.style.display='none';
  var _lb=document.getElementById('gt-login-btn'); if(_lb){ _lb.style.display=''; _lb.disabled=false; _lb.textContent='Connexion'; }
  var _pw=document.getElementById('gt-login-pwd'); if(_pw){ _pw.disabled=false; }
  var _oc=document.getElementById('gt-otp-code');  if(_oc){ _oc.value=''; }
  var panel    = document.getElementById('gt-login-panel');
  var profiles = document.getElementById('login-profiles');
  var pwdPanel = document.getElementById('login-pwd-panel');
  if (profiles) profiles.style.display = 'none';
  if (pwdPanel) pwdPanel.style.display = 'none';
  if (panel) {
    panel.style.display = 'block';
    setTimeout(function() {
      var inp = document.getElementById('gt-login-email');
      if (inp) inp.focus();
    }, 100);
  }
}

function hideGTLoginPanel() {
  var panel    = document.getElementById('gt-login-panel');
  var profiles = document.getElementById('login-profiles');
  if (panel)    panel.style.display    = 'none';
  if (profiles) profiles.style.display = 'grid';
  var err = document.getElementById('gt-login-error');
  if (err) { err.style.display = 'none'; err.textContent = ''; }
  var inp = document.getElementById('gt-login-pwd');
  if (inp) inp.value = '';
}

// ============================================================================
// SEC-GT/2 — SECOND FACTEUR PAR E-MAIL
// ============================================================================
// Le mot de passe prouve QUI, le code prouve QUE C'EST BIEN MAINTENANT et que
// la personne a acces a la boite de l'operateur. Sans le code, le compte est
// authentifie mais ne franchit AUCUNE regle Firestore (claim `gts` absent) :
// la protection ne depend donc pas de cette interface, et un attaquant qui
// passerait par le SDK directement n'obtiendrait rien de plus.

// Entree effective dans le panneau. Extraite de confirmGTLogin parce qu'on y
// arrive desormais par deux chemins : session deja ouverte, ou code valide.
function _gtEnterPanel(fbUser) {
  // Utilisateur synthetique — absent de MEMBRES, invisible partout dans l'app
  var _gtUser = {
    nom: 'GUERETTECH',
    email: GT_ADMIN_EMAIL,
    roles: [],
    statut: 'Actif',
    _isGTAdmin: true,          // pose APRES lecture du claim serveur (SEC-GT)
    _gtSince: Date.now(),
    _firebaseUser: fbUser
  };
  // setCurrentUser sync la variable locale app.js ET window.currentUser
  if(window.setCurrentUser) window.setCurrentUser(_gtUser);
  else window.currentUser = _gtUser;

  if(DEBUG) console.log('\u2705 Login GUERETTECH OK');
  var _ls = document.getElementById('login-screen');
  if(_ls) _ls.style.display = 'none';
  document.body.style.background = '#0F1319';
  window._dataReady = true;
  if(window.applyRoles) window.applyRoles();
  if(window.updateNavForRoles) window.updateNavForRoles();
  if(window.goHub) window.goHub();
}

// Bascule l'ecran de connexion sur la saisie du code.
function _gtShowOtp(r) {
  var box  = document.getElementById('gt-otp-box');
  var info = document.getElementById('gt-otp-info');
  var btn  = document.getElementById('gt-login-btn');
  var pwd  = document.getElementById('gt-login-pwd');
  var code = document.getElementById('gt-otp-code');
  var err  = document.getElementById('gt-login-error');
  if(err) err.style.display = 'none';
  if(btn){ btn.style.display = 'none'; }
  if(pwd){ pwd.disabled = true; pwd.value = ''; }
  if(box) box.style.display = 'block';
  if(info){
    var mn = Math.max(1, Math.round(((r && r.ttlMs) || 600000)/60000));
    info.textContent = 'Envoy\u00e9 \u00e0 ' + GT_ADMIN_EMAIL + ' \u00b7 valable ' + mn + ' minutes.';
  }
  // iOS : la valeur d'un champ pose apres coup s'assigne EN JS.
  if(code){ code.value = ''; setTimeout(function(){ code.focus(); }, 120); }
}

async function confirmGTOtp() {
  var code = document.getElementById('gt-otp-code');
  var info = document.getElementById('gt-otp-info');
  var btn  = document.getElementById('gt-otp-btn');
  if(!code) return;
  var v = String(code.value || '').replace(/\D/g, '');
  if(v.length !== 6){
    if(info){ info.textContent = '\u274C Le code compte 6 chiffres.'; }
    code.focus();
    return;
  }
  if(btn){ btn.disabled = true; btn.textContent = '\u23F3 V\u00e9rification\u2026'; }
  try{
    await window.fbCallFn('gtVerifyOtp', { code: v }, { timeout: 30000 });
    // ⚠️ Rafraichissement OBLIGATOIRE : sans lui le claim `gts` n'apparait pas
    // dans le jeton avant une heure, et toutes les lectures seraient refusees.
    var cl = window._fbClaims ? await window._fbClaims(true) : null;
    if(!(window._fbGtSessOk ? window._fbGtSessOk(cl) : (cl && typeof cl.gts === 'number' && cl.gts > Date.now()))){
      if(info){ info.textContent = '\u274C Session non ouverte \u2014 rechargez la page.'; }
      if(btn){ btn.disabled = false; btn.textContent = 'Ouvrir la session'; }
      return;
    }
    code.value = '';
    var u = (firebase.auth().currentUser) || null;
    _gtEnterPanel(u);
  }catch(e){
    if(info){ info.textContent = '\u274C ' + ((e && e.message) || 'Code refus\u00e9.'); }
    if(btn){ btn.disabled = false; btn.textContent = 'Ouvrir la session'; }
    code.focus();
    if(window.logError) window.logError({ level:'warning', cat:'auth', msg:'Code GT refuse', detail:(e && e.code) || String(e) });
  }
}

async function gtOtpResend() {
  var info = document.getElementById('gt-otp-info');
  if(info) info.textContent = '\u23F3 Envoi\u2026';
  try{
    var r = await window.fbCallFn('gtRequestOtp', {}, { timeout: 30000 });
    if(info) info.textContent = 'Nouveau code envoy\u00e9 \u00e0 ' + GT_ADMIN_EMAIL + '.';
    var c = document.getElementById('gt-otp-code');
    if(c){ c.value = ''; c.focus(); }
  }catch(e){
    if(info) info.textContent = '\u274C ' + ((e && e.message) || 'Envoi impossible.');
  }
}

async function confirmGTLogin() {
  var emailInp = document.getElementById('gt-login-email');
  var pwdInp   = document.getElementById('gt-login-pwd');
  var errDiv   = document.getElementById('gt-login-error');
  var btn      = document.getElementById('gt-login-btn');
  if (!emailInp || !pwdInp) return;

  var email = emailInp.value.trim();
  var pwd   = pwdInp.value;

  if (!email || !pwd) {
    errDiv.textContent = '❌ Renseignez l\'email et le mot de passe.';
    errDiv.style.display = 'block';
    return;
  }
  if (email !== GT_ADMIN_EMAIL) {
    errDiv.textContent = '❌ Ce panneau est réservé à l\'opérateur GUERETTECH.';
    errDiv.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Connexion…';
  errDiv.style.display = 'none';

  try {
    // SEC-GT — la session GUERETTECH ne survit pas à la fermeture de l'onglet.
    // Posé AVANT le signIn : setPersistence ne vaut que pour les connexions suivantes.
    if (window._fbSessionOnly) await window._fbSessionOnly();

    var cred = await firebase.auth().signInWithEmailAndPassword(email, pwd);

    // SEC-GT — vérité serveur. Le mot de passe prouve l'IDENTITÉ, le claim prouve
    // le DROIT. Sans gtAdmin on déconnecte : _isGTAdmin ne doit plus jamais être
    // posé « parce que l'e-mail correspond » — c'est ce drapeau que toute l'app lit
    // ensuite pour router vers le panneau.
    var _cl = window._fbClaims ? await window._fbClaims(true) : null;
    if (!_cl || _cl.gtAdmin !== true) {
      try { await firebase.auth().signOut(); }
      catch(_e) { if (window.logError) window.logError({ level:'info', cat:'auth', msg:'signOut apres refus GT', detail:(_e && _e.code) || String(_e) }); }
      errDiv.textContent = '\u274C Ce compte n\u2019a pas le droit GUERETTECH.';
      errDiv.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Connexion';
      return;
    }

    // SEC-GT/2 — le mot de passe a prouve l'IDENTITE. Reste le DROIT : le claim
    // `gts` (fin de session, en millisecondes) que seule gtVerifyOtp sait poser.
    // Session encore ouverte (rechargement, reconnexion dans la journee) : on
    // entre sans redemander de code.
    if (window._fbGtSessOk ? window._fbGtSessOk(_cl) : (typeof _cl.gts === 'number' && _cl.gts > Date.now())) {
      _gtEnterPanel(cred.user);
      return;
    }

    // Sinon : demander un code a usage unique et basculer sur sa saisie.
    btn.textContent = '\u23F3 Envoi du code\u2026';
    var _r = null;
    try {
      _r = await window.fbCallFn('gtRequestOtp', {}, { timeout: 30000 });
    } catch (e) {
      // Echec de l'envoi : on NE laisse PAS une session a moitie ouverte.
      try { await firebase.auth().signOut(); }
      catch(_e2) { if (window.logError) window.logError({ level:'info', cat:'auth', msg:'signOut apres echec OTP', detail:(_e2 && _e2.code) || String(_e2) }); }
      errDiv.textContent = '\u274C Code non envoy\u00e9 : ' + ((e && e.message) || 'r\u00e9essayez.');
      errDiv.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Connexion';
      return;
    }
    _gtShowOtp(_r);
    return;

  } catch(e) {
    var msg = '❌ Connexion impossible.';
    if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = '❌ Mot de passe incorrect.';
    if (e.code === 'auth/user-not-found')         msg = '❌ Compte introuvable dans Firebase.';
    if (e.code === 'auth/network-request-failed') msg = '❌ Pas de connexion réseau.';
    errDiv.textContent = msg;
    errDiv.style.display = 'block';
  }
  btn.disabled = false;
  btn.textContent = 'Connexion';
}


// ════ EXPOSITION GLOBALE ════
window.obAddMembre        = obAddMembre;
window.obAddParcelle      = obAddParcelle;
window.obAddTacheCustom   = obAddTacheCustom;
window.obCheckPwd         = obCheckPwd;
window.obNextStep         = obNextStep;
window.obPrevStep         = obPrevStep;
window.obRemoveMembre     = obRemoveMembre;
window.obRemoveParcelle   = obRemoveParcelle;
window.obToggleCGU        = obToggleCGU;
window.obToggleRole       = obToggleRole;
window.obToggleTache      = obToggleTache;
window.obUpdateRecap      = obUpdateRecap;
window.obUpdateSlug       = obUpdateSlug;
window.obStart            = obStart;
window.showOnboarding     = showOnboarding;
// Accueil public (mavigneapp.fr sans domaine)
window.mvLandingSite      = mvLandingSite;
window.mvLandingDemo      = mvLandingDemo;
window.mvLandingLink      = mvLandingLink;
window.mvLandingBack      = mvLandingBack;
window.mvLandingGo        = mvLandingGo;
// Login caché GUERETTECH
window.initGTLoginTap     = initGTLoginTap;
window.showGTLoginPanel   = showGTLoginPanel;
window.confirmGTOtp       = confirmGTOtp;
window.gtOtpResend        = gtOtpResend;
window._gtEnterPanel      = _gtEnterPanel;
window.hideGTLoginPanel   = hideGTLoginPanel;
window.confirmGTLogin     = confirmGTLogin;
