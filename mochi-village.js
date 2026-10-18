/* Mochi Village — surcouche non destructive pour Mochi Check */
(()=>{'use strict';
const CORE='b2y-mochi-check-v1',STORE='b2y-mochi-village-v1';
const ZONES=[
{id:'maison',name:'Ma maison',x:18,y:46,s:'🏡',desc:'Entre dans ton petit cocon.'},
{id:'jardin',name:'Mon jardin',x:70,y:36,s:'🌱',desc:'Un jardin pour tes compétences.'},
{id:'missions',name:'Les missions',x:48,y:82,s:'📜',desc:'Tes petits objectifs personnels.'},
{id:'boutique',name:'La boutique',x:87,y:70,s:'🎁',desc:'Des objets pour décorer ta maison.'},
{id:'foret',name:'Bois des idées',x:10,y:16,s:'🌳',cost:4,desc:'Une forêt de conseils pour apprendre.'},
{id:'etang',name:'Étang paisible',x:76,y:17,s:'🪷',cost:7,desc:'Un endroit pour regarder le chemin parcouru.'},
{id:'prairie',name:'Prairie fleurie',x:80,y:92,s:'🌸',cost:9,desc:'Un coin de nature à découvrir.'}
];
const ITEMS=[
{id:'plant',name:'Plante matcha',icon:'plant',cost:0},
{id:'lamp',name:'Petite branche décorative',icon:'leaf',cost:3},
{id:'mush',name:'Champignon rose',icon:'mush',cost:4},
{id:'books',name:'Livres illustrés',icon:'books',cost:3},
{id:'plush',name:'Peluche chat',icon:'cat',cost:5},
{id:'flower',name:'Branche de sakura',icon:'blossom',cost:3},
{id:'globe',name:'Globe miniature',icon:'globe',cost:5},
{id:'cloud',name:'Coussin vert',icon:'pillow',cost:4},
{id:'trophy',name:'Appareil photo rétro',icon:'camera',cost:6},
{id:'tea',name:'Bubble tea',icon:'boba',cost:4},
{id:'duck',name:'Caneton jaune',icon:'duck',cost:3},
{id:'tent',name:'Tipi de lecture',icon:'tent',cost:7},
{id:'bear',name:'Peluche ourson',icon:'bear',cost:4},
{id:'bag',name:'Sac d’aventure',icon:'backpack',cost:5},
{id:'charm',name:'Feuille porte-bonheur',icon:'leaf',cost:2}
];
let subjects=[],avatars={},mode='village',subId='en',modal=null,origin=false,move={x:43,y:61},started=false,profileDraft=null;
function from(key,fallback){try{let obj=JSON.parse(localStorage.getItem(key));return obj&&typeof obj==='object'?obj:fallback}catch{return fallback}}
let village=from(STORE,{spent:0,zones:[],items:['plant'],placed:{a:'plant'}});
function save(){try{localStorage.setItem(STORE,JSON.stringify(village))}catch{}}
function base(){let o=from(CORE,{});return {...o,profile:o.profile||null,snaps:Array.isArray(o.snaps)?o.snaps:[],goals:Array.isArray(o.goals)?o.goals:[],badges:o.badges||{}}}
function total(){let c=base(),hits=new Set(),steps=0,badges=0;c.snaps.forEach((s,i)=>hits.add((s.day||i)+'|'+(s.subject||i)));c.goals.forEach(g=>{steps+=(g.done?4:(g.steps||[]).filter(s=>s.d).length)});Object.values(c.badges).forEach(b=>{if(b)badges++});return 2+hits.size+steps+badges}
function wallet(){return Math.max(0,total()-(village.spent||0))}
function own(id){return village.zones.includes(id)}
function have(id){return village.items.includes(id)}
function v(){return document.getElementById('view')}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ICONS={village:'nav-home',maison:'nav-house',jardin:'nav-garden',missions:'nav-missions',collection:'nav-collection',boutique:'collection',check:'garden',profile:'cat',foret:'leaf',etang:'duck',prairie:'blossom'};
function icon(name,cls=''){return `<img class="mv-art ${cls}" src="assets/icons/${esc(name)}.webp" alt="" aria-hidden="true" loading="lazy">`}
function itemIcon(item,cls=''){return icon(item?.icon||'plant',cls)}
// Nouveaux pictogrammes originaux de matières, sans textes ni emojis superposés.
const ANIMAL_NAMES={chat:'Chat roux',lapin:'Lapin',panda:'Panda',pingouin:'Pingouin',renard:'Renard',koala:'Koala',poussin:'Poussin',chatbleu:'Chat bleu',lion:'Lion',grenouille:'Grenouille',calico:'Chat calico',hamster:'Hamster',chiot:'Chiot',phoque:'Phoque',cochon:'Cochon',hibou:'Hibou',pandaroux:'Panda roux',licorne:'Licorne',chatnoir:'Chat noir',herisson:'Hérisson'};
function subjectKind(s){
 const x=((s?.id||'')+' '+(s?.n||'')+' '+(s?.s||'')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_-]/g,' ');
 if(/mathem|maths|calcul/.test(x))return 'maths';
 if(/francais|\bfr\b|lettres/.test(x))return 'fr';
 if(/anglais|english|\ben\b/.test(x))return 'en';
 if(/espagnol|spanish|\bes\b/.test(x))return 'espagnol';
 if(/allemand|german|\bde\b/.test(x))return 'allemand';
 if(/italien|italian/.test(x))return 'italien';
 if(/latin/.test(x))return 'latin';
 if(/grec|greek/.test(x))return 'grec';
 if(/histoire|geograph|\bhg\b|hist geo/.test(x))return 'hg';
 if(/\bemc\b|civique|citoyen|moral/.test(x))return 'emc';
 if(/svt|sciences? de la vie|biolog|natur/.test(x))return 'svt';
 if(/physique|chimie|\bpc\b|phys/.test(x))return 'pc';
 if(/technolog|informatique|numerique|\btech\b/.test(x))return 'techno';
 if(/\beps\b|physique et sport|education physique|sport/.test(x))return 'eps';
 if(/arts? plastique|dessin|visuel/.test(x))return 'arts';
 if(/musique|musical/.test(x))return 'musique';
 return 'other';
}
function subjectArt(s,cls=''){return `<img class="mv-subject-art ${cls}" src="assets/subjects/${subjectKind(s)}.svg" alt="" aria-hidden="true" loading="lazy">`}
function enhanceOriginalSubjectButtons(){
 const overlay=document.getElementById('overlay');if(!overlay)return;
 overlay.querySelectorAll('[data-act="ci-subject"],[data-act="g-subj"]').forEach(btn=>{
  if(btn.dataset.mvSubjectReady)return;
  const subj=subjects.find(s=>s.id===btn.dataset.v);
  if(!subj)return;
  btn.dataset.mvSubjectReady='1';btn.classList.add('mv-original-subject');
  let span=btn.querySelector('span');
  if(span){span.textContent='';span.innerHTML=subjectArt(subj);}
  else {btn.insertAdjacentHTML('afterbegin',subjectArt(subj));
    for(const child of btn.childNodes)if(child.nodeType===3){child.textContent=child.textContent.replace(/^[^\p{L}\p{N}]+/u,' ').trimStart();break;}
  }
 });
}
function draftProfile(){const p=base().profile||{};return {name:String(p.name||'').slice(0,24),level:['6e','5e','4e','3e'].includes(p.level)?p.level:'5e',animal:avatars[p.animal]?p.animal:(avatars.chat?'chat':Object.keys(avatars)[0]||'chat')};}
function profileView(){
 if(!profileDraft)profileDraft=draftProfile();const d=profileDraft,c=base(),animals=Object.keys(ANIMAL_NAMES).filter(id=>avatars[id]);
 const levels=['6e','5e','4e','3e'].map(level=>`<button type="button" data-mv="profile-level" data-id="${level}" aria-pressed="${d.level===level}" class="mv-profile-grade ${d.level===level?'on':''}">${level}</button>`).join('');
 const pets=animals.map(id=>`<button type="button" class="mv-profile-pet ${d.animal===id?'on':''}" aria-pressed="${d.animal===id}" data-mv="profile-animal" data-id="${id}"><img loading="lazy" draggable="false" src="${avatars[id]}" alt=""><span>${esc(ANIMAL_NAMES[id])}</span></button>`).join('');
 v().innerHTML=`<div class="mv-page mv-profile-page">${hud()}
  <div class="mv-title-intro mv-illustrated-title"><span>${icon('cat')} MON CARNET D'AVENTURES</span><h2>Mon petit profil</h2><p>Ton prénom, ta classe et ton compagnon sont modifiables à tout moment.</p></div>
  <div class="mv-profile-layout">
    <section class="mv-profile-card mv-profile-fields"><h3>🌸 C'est moi !</h3>
      <label for="mv-edit-name">Mon prénom</label><input id="mv-edit-name" maxlength="24" autocomplete="off" placeholder="Ton prénom" value="${esc(d.name)}">
      <fieldset class="mv-profile-level"><legend>Ma classe</legend><div class="mv-profile-grade-row">${levels}</div></fieldset>
      <div class="mv-profile-preview"><div class="mv-profile-preview-pet" id="mv-profile-preview-pet">${avatars[d.animal]?`<img src="${avatars[d.animal]}" alt="Mon compagnon">`:icon('cat')}</div><div><b id="mv-profile-preview-name">${esc(d.name||'Mon aventure')}</b><span id="mv-profile-preview-level">Classe de ${d.level}</span><small>Un monde à ton image ✿</small></div></div>
    </section>
    <section class="mv-profile-card mv-profile-friends"><h3>🐾 Choisis ton compagnon</h3><p>Choisis l'animal qui t'accompagnera dans ton village.</p><div class="mv-profile-pets">${pets||`<p>Les compagnons seront disponibles avec les données de Mochi Check.</p>`}</div></section>
  </div>
  <p id="mv-profile-message" class="mv-profile-message" role="status" aria-live="polite"></p>
  <div class="mv-profile-actions"><button class="mv-primary" data-mv="profile-save">🌷 Enregistrer mes changements</button><button class="mv-cream-btn" data-mv="profile-cancel">Annuler</button></div>
  <div class="mv-profile-old"><p>Tu cherches les réglages, les badges ou l'export de ton bilan ?</p><button class="mv-cream-btn" data-mv="old-profile">⚙️ Réglages et bilan</button></div>
  </div>`;updateNav();
}
function highlightProfile(choice,selected){
 v().querySelectorAll(`[data-mv="profile-${choice}"]`).forEach(b=>{let on=b.dataset.id===selected;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});
}
function profileSave(){
 const el=document.getElementById('mv-edit-name'),msg=document.getElementById('mv-profile-message');
 if(!el||!profileDraft)return;
 const name=el.value.trim().replace(/\s+/g,' '),level=profileDraft.level,animal=profileDraft.animal;
 if(!name||name.length>24){msg.textContent='Écris un prénom de 1 à 24 caractères.';el.focus();return}
 if(!['6e','5e','4e','3e'].includes(level)){msg.textContent='Choisis une classe.';return}
 if(!avatars[animal]){msg.textContent='Choisis un compagnon disponible.';return}
 try{
  const data=base(),profile={...(data.profile||{}),name,level,animal,color:data.profile?.color||'#FFFFFF'};
  localStorage.setItem(CORE,JSON.stringify({...data,profile}));
  profileDraft=null;
  // L'application d'origine garde une copie du profil en mémoire : rechargement nécessaire.
  // Les sauvegardes originales ET les décorations sont conservées.
  msg.textContent='Profil enregistré ! Retour au village…';
  setTimeout(()=>window.location.reload(),150);
 }catch(err){msg.textContent='Enregistrement impossible : vérifie que le stockage du navigateur est autorisé.';}
}

const DEFAULT_SPOTS=[[18,69],[80,65],[35,35],[56,80],[11,39],[59,35],[86,38],[35,78],[52,53],[70,84],[27,48],[92,83],[45,63],[78,22],[16,83],[90,51],[45,19],[68,67],[30,87],[58,23],[7,70],[87,17],[63,91],[41,43]];
let activeDecor=null;
function initializeDecor(){
 if(!Array.isArray(village.decorations)){
  village.decorations=Object.entries(village.placed||{}).map(([key,id],i)=>{
   const position=DEFAULT_SPOTS[({a:0,b:1,c:2,d:3}[key]??i)%DEFAULT_SPOTS.length];
   return {uid:'migrated-'+key,id,x:position[0],y:position[1]};
  }).filter(o=>ITEMS.some(item=>item.id===o.id));
 }
 village.decorations=village.decorations.filter(o=>o&&ITEMS.some(item=>item.id===o.id)).slice(0,36).map((o,i)=>({uid:String(o.uid||'legacy-'+i),id:o.id,x:Math.max(6,Math.min(94,Number(o.x)||50)),y:Math.max(10,Math.min(90,Number(o.y)||66))}));
 village.villageVersion=2;
 save();
}
function roomTier(){return Math.min(4,Math.floor(village.decorations.length/4)+1)}
function updateDecor(uid,x,y){let o=village.decorations.find(o=>o.uid===uid);if(!o)return; o.x=Math.max(6,Math.min(94,Math.round(x*10)/10));o.y=Math.max(10,Math.min(90,Math.round(y*10)/10));save()}
function pal(s){return `<span class="mv-icon">${s}</span>`}
function user(){return base().profile?.name||'explorateur·rice'}
function animal(css=''){let id=base().profile?.animal||'chat',src=avatars[id]||avatars.chat;return src?`<img class="mv-animal ${css}" src="${src}" alt="Ton compagnon" draggable="false">`:icon('cat','mv-animal '+css)}
function skillList(s){if(!s)return[];let cy=base().profile?.level==='6e'?'c3':'c4',arr=s[cy]||s.c4||s.c3||[];if(!arr.length&&s.copy){let other=subjects.find(x=>x.id===s.copy);arr=other?.[cy]||other?.c4||other?.c3||[]}return arr.map((x,i)=>Array.isArray(x)?{id:s.id+'-'+cy+'-'+i,t:x[0],g:x[1]}:x)}
function levels(sid){let o={};base().snaps.forEach(s=>{if(s.subject===sid)(s.ratings||[]).forEach(r=>o[r.k]=Number(r.v)||0)});return o}
function growth(n){let c=Math.max(0,Math.min(4,n||0));return `<svg class="mv-growth" viewBox="0 0 110 110" aria-hidden="true"><ellipse cx="55" cy="100" rx="43" ry="9" fill="#ceb599" opacity=".4"/><path d="M16 98q35-17 79 0" fill="none" stroke="#bd956d" stroke-width="8" stroke-linecap="round"/><path d="M55 96q${c>1?8:0}-25 0-${c>2?72:c>1?56:31}" stroke="#6eaa77" fill="none" stroke-width="6" stroke-linecap="round"/>${[...Array(c===0?2:c===1?2:c===2?4:6)].map((_,i)=>{let x=i%2?73:36,y=75-i*9;return `<ellipse cx="${x}" cy="${y}" rx="${c>2?19:14}" ry="10" fill="${i%2?'#a6d18e':'#80c098'}" transform="rotate(${i%2?-27:27} ${x} ${y})"/>`}).join('')}${c>=3?'<circle cx="55" cy="28" r="23" fill="#b3d88e" stroke="#80b68a" stroke-width="3"/>':''}${c===4?[0,1,2,3,4].map(i=>{let a=i*6.28/5;return `<circle cx="${55+Math.cos(a)*18}" cy="${27+Math.sin(a)*19}" r="8" fill="#ffd0dc"/><circle cx="${55+Math.cos(a)*18}" cy="${27+Math.sin(a)*19}" r="2.5" fill="#f3ba62"/>`}).join(''):''}</svg>`}
function hud(){return `<div class="mv-hud"><span class="mv-chip">🍃 <b>${wallet()}</b> feuilles</span><span class="mv-chip mv-chip-soft">✨ ${base().snaps.length} checks</span><button class="mv-profile-link" type="button" data-mv="profil" aria-label="Modifier mon prénom, ma classe ou mon compagnon" title="Modifier mon profil">✏️ <span>Mon profil</span></button><button data-mv="help" class="mv-help" aria-label="À propos du village">?</button></div>`}
function section(label,title){return `<div class="mv-heading"><div><small>${label}</small><h2>${title}</h2></div></div>`}
function updateNav(){document.querySelectorAll('.mv-nav').forEach(b=>{let t=b.dataset.mv,active=mode===t||(t==='maison'&&mode==='boutique')||(t==='missions'&&mode==='objectifs')||(t==='collection'&&mode==='album');b.classList.toggle('on',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
function villageView(){let c=base(),locs=ZONES.map(z=>{let locked=z.cost&&!own(z.id);return `<button class="mv-loc ${locked?'mv-locked':''}" style="left:${z.x}%;top:${z.y}%" data-mv="zone" data-id="${z.id}" aria-label="${esc(z.name)}${locked?' : à débloquer':''}"><span class="mv-loc-icon">${locked?icon('leaf'):icon(ICONS[z.id]||'nav-home')}</span><span class="mv-loc-name">${esc(z.name)}</span></button>`}).join('');
 v().innerHTML=`<div class="mv-page mv-village">${hud()}<div class="mv-welcome"><div class="mv-welcome-text"><span class="mv-eyebrow">✿ MON PETIT MONDE ✿</span><h2>Coucou, ${esc(user())} !</h2><button class="mv-name-edit" type="button" data-mv="profil" aria-label="Changer mon prénom, ma classe et mon compagnon">✎ Personnaliser mon profil</button><p>${c.profile?'Content de te revoir ! Chaque petit effort fait grandir ton village.':'Bienvenue ! Choisis ton compagnon pour commencer ton aventure.'}</p><button class="mv-primary" data-act="start-check">🌷 Faire mon check</button></div>${animal('mv-welcome-animal')}</div>${section('EXPLORE TON MONDE','Le village des découvertes')}<div class="mv-village-sub">Touche un lieu pour te promener et découvrir ses secrets. <b>${village.zones.length} / 3 lieux ouverts</b></div><div class="mv-map-scroll" tabindex="0" role="region" aria-label="Carte interactive du village, défilement horizontal sur petit écran"><div class="mv-map"><img src="assets/village-map.svg" alt="Carte illustrée d'un village avec chemins, arbres et maisons" class="mv-map-image"><div class="mv-player" id="mv-player" style="left:${move.x}%;top:${move.y}%">${animal('mv-player-animal')}<span>${esc(user())}</span></div>${locs}</div></div><p class="mv-map-help">👆 Clique sur les lieux. Certains terrains sont à agrandir grâce à tes feuilles !</p><div class="mv-shortcuts"><button data-mv="jardin">${icon('nav-garden')}<b>Mon jardin</b><small>Compétences</small></button><button data-mv="missions">${icon('nav-missions')}<b>Mes missions</b><small>Objectifs</small></button><button data-mv="collection">${icon('nav-collection')}<b>Collection</b><small>Mes trésors</small></button><button data-mv="maison">${icon('nav-house')}<b>Ma maison</b><small>Déco</small></button></div><div class="mv-tip"><span>🌤️</span><p><b>La pensée de Mochi</b><br>Tu n’as pas besoin d’être parfait·e pour progresser. Chaque essai compte !</p></div><button class="mv-oldlink" data-mv="feed">Retrouver mon ancien fil de souvenirs →</button></div>`;updateNav();const scroll=v().querySelector('.mv-map-scroll');if(scroll&&scroll.scrollWidth>scroll.clientWidth){scroll.scrollLeft=Math.max(0,(scroll.scrollWidth-scroll.clientWidth)*.29)}}
function gardenView(){let c=base(),list=subjects.filter(s=>!s.lv||s.lv.includes(c.profile?.level||'5e'));if(!list.length)list=subjects;if(!list.some(s=>s.id===subId))subId=list[0]?.id||'';let s=list.find(s=>s.id===subId),sk=skillList(s),found=levels(subId),checked=sk.filter(x=>found[x.id]).length;
let tabs=list.map(x=>`<button data-mv="subject" data-id="${esc(x.id)}" class="mv-subject ${x.id===subId?'on':''}" aria-pressed="${x.id===subId}">${subjectArt(x)} <span>${esc(x.s||x.n)}</span></button>`).join('');
let plants=sk.map(k=>{let n=found[k.id]||0;return `<button class="mv-plant" data-mv="skill" data-id="${esc(k.id)}"><span class="mv-plant-art">${growth(n)}</span><b>${esc(k.t)}</b><small>${['À découvrir','Je débute','J’avance','Je progresse','Je maîtrise'][n]}</small><span class="mv-dots" aria-label="Niveau ${n} sur 4">${[1,2,3,4].map(i=>`<i class="${i<=n?'filled':''}"></i>`).join('')}</span></button>`}).join('');
v().innerHTML=`<div class="mv-page mv-garden">${hud()}<div class="mv-title-intro"><span>${icon('nav-garden')} MON JARDIN DES COMPÉTENCES</span><h2>Chaque petite graine a son histoire</h2><p>Ces plantes représentent ton ressenti, pas une note. Elles grandissent à ton rythme.</p></div><div class="mv-subject-intro">${icon('blossom')} &nbsp; Choisis une matière à explorer</div><div class="mv-subject-list">${tabs}</div><div class="mv-field"><div class="mv-field-title"><h3>${subjectArt(s)} ${esc(s?.n||'Mes compétences')}</h3><span>${checked} / ${sk.length} découvertes</span></div><div class="mv-plants">${plants||'<p>Ton jardin accueillera bientôt des graines.</p>'}</div></div><div class="mv-tip"><span>🪴</span><p><b>Les plantes ne fanent jamais.</b><br>Tu peux refaire ton check et faire évoluer ton ressenti quand tu le souhaites.</p></div><button class="mv-primary mv-wide" data-act="start-check">🌸 Faire pousser mes compétences</button></div>`;updateNav()}
function missionsView(){
 const goals=base().goals,active=goals.filter(g=>!g.done),completed=goals.filter(g=>g.done);
 const buddies=['cat','bear','duck'];
 const cards=active.map((g,i)=>{
  let steps=Array.isArray(g.steps)?g.steps:[],done=steps.filter(step=>step.d).length,pct=steps.length?Math.round(done/steps.length*100):0;
  return `<article class="mv-mission-card"><div class="mv-mission-pet">${icon(buddies[i%buddies.length])}</div><div class="mv-mission-main"><small>${steps.length?done+' / '+steps.length+' étapes':'MA PETITE MISSION'}</small><h3>${esc(g.text||'Ma prochaine étape')}</h3><div class="mv-mission-progress" role="progressbar" aria-label="Progression de cette mission" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div><button class="mv-cream-btn" data-mv="old-missions">Continuer ma mission →</button></div></article>`;
 }).join('');
 v().innerHTML=`<div class="mv-page mv-missions">${hud()}
 <div class="mv-title-intro mv-illustrated-title"><span>${icon('nav-missions')} MES PETITES MISSIONS</span><h2>Un petit pas après l’autre</h2><p>Découpe chaque objectif en étapes. Tu peux avancer à ton rythme, sans course contre les autres.</p></div>
 <div class="mv-mission-filters"><span>${active.length} en cours</span><span>${completed.length} terminée${completed.length>1?'s':''}</span></div>
 <div class="mv-mission-list">${cards||`<div class="mv-empty"><span>${icon('duck')}</span><h3>Une nouvelle aventure t’attend !</h3><p>Choisis un petit objectif concret et prépare les étapes pour y arriver.</p></div>`}</div>
 <button class="mv-primary mv-wide" data-mv="old-missions">${icon('nav-missions')} ${active.length?'Gérer mes missions':'Créer ma première mission'}</button>
 ${completed.length?`<p class="mv-mission-done">🌸 ${completed.length} mission${completed.length>1?'s':''} terminée${completed.length>1?'s':''} !</p>`:''}
 </div>`;updateNav()
}
function collectionView(){
 const discovered=village.items.length,rows=ITEMS.map(o=>{
  let got=have(o.id);return `<article class="mv-collect-tile ${got?'is-owned':'is-locked'}"><div>${itemIcon(o)}</div><b>${esc(o.name)}</b><small>${got?'✓ Découvert':'À découvrir'}</small></article>`;
 }).join('');
 let progress=Math.round(100*discovered/ITEMS.length);
 v().innerHTML=`<div class="mv-page mv-collection">${hud()}
 <div class="mv-title-intro mv-illustrated-title"><span>${icon('nav-collection')} MES PETITS TRÉSORS</span><h2>Ma collection enchantée</h2><p>Découvre des objets illustrés, puis choisis ceux qui décorent ta chambre.</p></div>
 <div class="mv-collect-summary"><span>${icon('backpack')}</span><div><b>Objets découverts : ${discovered} / ${ITEMS.length}</b><div class="mv-collection-track" role="progressbar" aria-label="Collection découverte" aria-valuemin="0" aria-valuemax="${ITEMS.length}" aria-valuenow="${discovered}"><i style="width:${progress}%"></i></div></div></div>
 <div class="mv-collect-grid">${rows}</div>
 <div class="mv-collection-actions"><button class="mv-primary" data-mv="maison">${icon('nav-house')} Décorer ma maison</button><button class="mv-cream-btn" data-mv="boutique">${icon('nav-collection')} Découvrir des objets</button></div>
 <div class="mv-whitepanel mv-old-album"><h3>${icon('cat')} Mes stickers et mes badges</h3><p>Ton album d'origine est toujours là, avec les pochettes et toutes tes récompenses.</p><button class="mv-cream-btn" data-mv="old-collection">Ouvrir mon album de récompenses →</button></div>
 </div>`;updateNav()
}
function houseView(){
 const tier=roomTier();
 const decorations=village.decorations.map((d,index)=>{
  let o=ITEMS.find(i=>i.id===d.id);if(!o)return '';
  return `<button type="button" class="mv-decor ${activeDecor===d.uid?'mv-decor-active':''}" data-mv="selectdecor" data-id="${esc(d.uid)}" style="left:${d.x}%;top:${d.y}%;z-index:${Math.round(d.y)}" aria-label="${esc(o.name)} : choisir ou déplacer. Utilise les flèches du clavier pour déplacer." title="${esc(o.name)} · glisser pour déplacer">${itemIcon(o)}</button>`;
 }).join('');
 let inventory=village.items.map(id=>{
  const item=ITEMS.find(it=>it.id===id);if(!item)return '';
  return `<button type="button" class="mv-inventory-card" data-mv="adddecor" data-id="${esc(id)}" aria-label="Ajouter ${esc(item.name)} dans la chambre">${itemIcon(item)}<span>${esc(item.name)}</span><small>+ Placer</small></button>`;
 }).join('');
 let selected=village.decorations.find(o=>o.uid===activeDecor), selectedItem=selected&&ITEMS.find(it=>it.id===selected.id);
 v().innerHTML=`<div class="mv-page mv-house">${hud()}
 <div class="mv-row-head">${section('MON PETIT COCON','Ma chambre à inventer')}<button class="mv-cream-btn" data-mv="boutique">${icon('nav-collection')} Boutique</button></div>
 <div class="mv-room-note"><b>🎀 ${village.decorations.length} décorations installées</b><span>${tier===4?'Une chambre pleine de vie !':`Ton cocon prend forme · étape ${tier} / 4`}</span></div>
 <div class="mv-room mv-room-tier-${tier}" id="mv-room" aria-label="Ma chambre à décorer : déplace les objets avec la souris, le doigt ou les boutons">
  <div class="mv-room-wallpaper" aria-hidden="true"></div><div class="mv-room-fairy" aria-hidden="true"></div>
  <div class="mv-room-decor">${decorations}</div>
 </div>
 <div class="mv-room-editor mv-whitepanel">
 <div><h3>🧸 Ma petite décoration</h3><p>Choisis un objet pour l'ajouter. Tu peux placer <b>plus de 4 objets</b>, plusieurs exemplaires d'un même trésor, puis les déplacer librement.</p></div>
 ${selected?`<div class="mv-selection"><span>${itemIcon(selectedItem)} <b>${esc(selectedItem?.name||'Objet')}</b> sélectionné</span><div class="mv-move-controls"><button data-mv="move-decor" data-id="left" aria-label="Déplacer vers la gauche">←</button><button data-mv="move-decor" data-id="up" aria-label="Déplacer vers le haut">↑</button><button data-mv="move-decor" data-id="down" aria-label="Déplacer vers le bas">↓</button><button data-mv="move-decor" data-id="right" aria-label="Déplacer vers la droite">→</button><button data-mv="delete-decor" class="mv-remove" aria-label="Ranger cet objet">Ranger</button></div></div>`:'<p class="mv-muted">💡 Touche un objet dans la chambre pour le déplacer ou le ranger.</p>'}
 <h4>Mes objets à placer <small>· clique pour ajouter</small></h4>
 <div class="mv-inventory">${inventory}</div>
 ${village.items.length<ITEMS.length?`<button class="mv-cream-btn mv-shop-open" data-mv="boutique">✿ Découvrir d'autres objets à la boutique</button>`:''}
 </div>
 <div class="mv-tip"><span>${icon('leaf')}</span><p><b>Une chambre qui évolue avec toi</b><br>De petites décorations apparaissent au fil de tes créations. Tu peux tout réorganiser, sans perdre tes objets.</p></div>
 </div>`;
 updateNav();
}
function shopView(){let cards=ITEMS.map(o=>{let has=have(o.id);return `<article class="mv-shop-card">${itemIcon(o,'mv-shop-icon')}<b>${esc(o.name)}</b><small>${has?'Dans ta collection !':'Un trésor pour ta chambre'}</small><button class="mv-cream-btn ${has?'mv-owned':''}" data-mv="buy" data-id="${o.id}" ${has?'disabled':''}>${has?'✓ Obtenu':o.cost?`🍃 ${o.cost} feuilles`:'🎁 Offert'}</button></article>`}).join('');v().innerHTML=`<div class="mv-page mv-shop">${hud()}<div class="mv-title-intro mv-illustrated-title"><span>${icon('nav-collection')} LA BOUTIQUE DE MOCHI</span><h2>Des trésors pour ma chambre</h2><p>Découvre les objets inspirés de notre collection illustrée. Un objet obtenu peut être placé plusieurs fois.</p></div><div class="mv-shop-grid">${cards}</div><button class="mv-primary mv-wide" data-mv="maison">${icon('nav-house')} Retour à ma chambre</button></div>`;updateNav()}
function bonusView(id){let zone=ZONES.find(x=>x.id===id);let tip=id==='foret'?'Essaie de reformuler une leçon avec tes propres mots.':id==='etang'?'Pense à une chose dont tu peux être fier·ère aujourd’hui.':'Chacun apprend à son rythme, comme les fleurs qui ne s’ouvrent pas toutes le même jour.';v().innerHTML=`<div class="mv-page mv-extra">${hud()}<button class="mv-oldlink" data-mv="village">← Retour au village</button><div class="mv-scenery mv-scene-${id}">${icon(ICONS[id]||'leaf','mv-scenery-picture')}<i>✿ ✨ ✿</i></div><div class="mv-title-intro"><span>✨ NOUVEL ENDROIT DÉCOUVERT</span><h2>${esc(zone.name)}</h2><p>${esc(zone.desc)}</p></div><div class="mv-tip"><span>🌟</span><p><b>Un conseil de Mochi</b><br>${esc(tip)}</p></div><button class="mv-primary mv-wide" data-mv="village">🏡 Continuer ma promenade</button></div>`;updateNav()}
function render(next){mode=next;closeModal();let elem=v();if(!elem)return;elem.scrollTop=0;switch(next){case 'village':villageView();break;case 'jardin':gardenView();break;case 'maison':houseView();break;case 'missions':missionsView();break;case 'collection':collectionView();break;case 'boutique':shopView();break;case 'profil':profileView();break;case 'foret':case 'etang':case 'prairie':bonusView(next);break;default:villageView()}}
function closeModal(){modal=null;document.getElementById('mv-dialog')?.remove()}
function showModal(title,icon,text,buttons){closeModal();modal={title,icon,text,buttons};let el=document.createElement('div');el.id='mv-dialog';el.className='mv-dialog-wrap';el.innerHTML=`<div class="mv-mask" data-mv="close"></div><div class="mv-dialog" role="dialog" aria-modal="true" aria-labelledby="mv-dialog-label"><button class="mv-x" data-mv="close" aria-label="Fermer">×</button><span class="mv-dialog-icon">${icon}</span><h2 id="mv-dialog-label">${esc(title)}</h2><div class="mv-dialog-copy">${text}</div><div class="mv-dialog-btns">${buttons.map((b,i)=>`<button class="${i===0?'mv-primary':'mv-cream-btn'}" data-mv="${b.act}" data-id="${esc(b.id||'')}">${b.title}</button>`).join('')}</div></div>`;document.getElementById('app').appendChild(el);el.querySelector('.mv-x').focus()}
function toast(t){let e=document.createElement('div');e.className='mv-toast';e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),3200)}
function zoneClick(id){let z=ZONES.find(z=>z.id===id);if(!z)return;move={x:z.x,y:Math.min(94,z.y+9)};let player=document.getElementById('mv-player');if(player){player.style.left=move.x+'%';player.style.top=move.y+'%'}
setTimeout(()=>{if(z.cost&&!own(id))showModal(z.name,z.s,`<p>${esc(z.desc)}</p><p>Pour agrandir ton village et visiter ce lieu, il te faut <strong>${z.cost} feuilles</strong>.</p><p class="mv-muted">Ton panier : ${wallet()} feuilles.</p>`,[{title:`🍃 ${z.cost} feuilles · Agrandir`,act:'unlock',id},{title:'Plus tard',act:'close'}]);else showModal(z.name,z.s,`<p>${esc(z.desc)}</p><p>Que souhaites-tu faire ?</p>`,[{title:id==='jardin'?'Explorer mes compétences':id==='maison'?'Entrer dans ma maison':id==='missions'?'Lire mes missions':id==='boutique'?'Voir les objets':'Visiter ce lieu',act:'travel',id},{title:'Poursuivre ma balade',act:'close'}])},230)}
function skillClick(id){let s=subjects.find(s=>s.id===subId),sk=skillList(s).find(s=>s.id===id);if(!sk)return;let n=levels(subId)[id]||0;showModal(sk.t,'🌱',`<div class="mv-modal-plant">${growth(n)}</div><p><b>${['Pas encore évaluée','Je découvre cette compétence','Je commence à comprendre','Je progresse','Je me sens à l’aise !'][n]}</b></p><p>Ton dernier ressenti : ${n} / 4.</p><p class="mv-muted">Il est normal que ton ressenti change avec le temps.</p>`,[{title:'🌸 Faire un check',act:'check'},{title:'Fermer',act:'close'}])}
function addLeaf(cost){if(wallet()<cost){showModal('Encore quelques feuilles','🍃',`<p>Il te manque ${cost-wallet()} feuille${cost-wallet()>1?'s':''}. Tu en gagnes en faisant des checks réfléchis et en accomplissant les étapes de tes objectifs.</p>`,[{title:'D’accord',act:'close'}]);return false}village.spent+=cost;save();return true}
function unlock(id){let z=ZONES.find(x=>x.id===id);if(!z||!z.cost||own(id))return;if(addLeaf(z.cost)){village.zones.push(id);save();render('village');toast('🌸 Ton village s’agrandit !')}}
function buy(id){let o=ITEMS.find(x=>x.id===id);if(!o||have(id))return;if(addLeaf(o.cost)){village.items.push(id);save();render('boutique');toast('🎀 '+o.name+' rejoint ta collection !')}}
function addDecor(id){
 if(!have(id))return;
 if(village.decorations.length>=36){toast('Ton cocon est bien rempli ! Range un objet pour en ajouter.');return}
 let place=DEFAULT_SPOTS[village.decorations.length%DEFAULT_SPOTS.length];let offset=Math.floor(village.decorations.length/DEFAULT_SPOTS.length)*4;
 let item={uid:'d'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),id,x:Math.min(94,place[0]+offset),y:Math.max(10,place[1]-offset)};
 village.decorations.push(item);activeDecor=item.uid;save();render('maison');toast('🌷 '+ITEMS.find(o=>o.id===id).name+' rejoint ta chambre !');
}
function moveDecor(direction){let o=village.decorations.find(d=>d.uid===activeDecor);if(!o)return;
 const dx=direction==='left'?-4:direction==='right'?4:0,dy=direction==='up'?-4:direction==='down'?4:0;
 updateDecor(o.uid,o.x+dx,o.y+dy);render('maison');
}
function deleteDecor(){if(!activeDecor)return;village.decorations=village.decorations.filter(d=>d.uid!==activeDecor);activeDecor=null;save();render('maison');toast('Objet rangé dans ta collection 🎀')}
function dragDecor(e){if(mode!=='maison')return;const target=e.target.closest?.('.mv-decor');if(!target||e.button>0)return;
 let uid=target.dataset.id,room=document.getElementById('mv-room');if(!room)return;
 activeDecor=uid;const rect=room.getBoundingClientRect();let moved=false,startX=e.clientX,startY=e.clientY;
 function pos(ev){const x=(ev.clientX-rect.left)/rect.width*100,y=(ev.clientY-rect.top)/rect.height*100;updateDecor(uid,x,y);let o=village.decorations.find(o=>o.uid===uid);if(o){target.style.left=o.x+'%';target.style.top=o.y+'%'}}
 function motion(ev){if(Math.hypot(ev.clientX-startX,ev.clientY-startY)>5){moved=true;pos(ev)}}
 function finish(ev){target.removeEventListener('pointermove',motion);target.removeEventListener('pointerup',finish);target.removeEventListener('pointercancel',finish);try{target.releasePointerCapture(ev.pointerId)}catch{}if(moved){save();render('maison')}}
 try{target.setPointerCapture(e.pointerId)}catch{}target.addEventListener('pointermove',motion);target.addEventListener('pointerup',finish);target.addEventListener('pointercancel',finish);
}
function decorateLegacy(){if(!['objectifs','album','legacy-profile','feed'].includes(mode))return;
 let root=v();if(!root||root.querySelector('.mv-legacy-header')||!root.children.length)return;
 let list={objectifs:['MES MISSIONS','Un petit pas après l’autre','nav-missions'],album:['MA COLLECTION','Tous mes petits trésors','nav-collection'],'legacy-profile':['MON PROFIL','Mon carnet d’aventures','cat'],feed:['MES SOUVENIRS','Le chemin parcouru','nav-home']};
 let [k,label,art]=list[mode]||list.feed;
 let head=document.createElement('div');head.className='mv-legacy-header';head.innerHTML=`<span>${icon(art)} ${k}</span><h2>${label}</h2><p>Chaque petit effort compte, à ton rythme. 🌱</p>`;root.insertBefore(head,root.firstChild);
}
function help(){showModal('Un village qui grandit','🌿',`<p>🍃 <b>Gagne des feuilles</b> grâce à tes checks, à tes petites étapes de missions et à tes badges.</p><p>🏡 <b>Visite les lieux</b> en cliquant sur la carte. Débloque la forêt, l’étang et la prairie pour agrandir le village.</p><p>🎀 <b>Décore ta maison</b> avec des objets à collectionner.</p><p>💛 Il n’y a ni classement, ni pénalité en cas d’absence : les récompenses encouragent les démarches, pas les notes.</p><p class="mv-muted">Les données restent enregistrées dans ce navigateur.</p>`,[{title:'C’est parti !',act:'close'}])}
function simulate(action,tab){let b=document.createElement('button');b.hidden=true;b.dataset.act=action;if(tab)b.dataset.tab=tab;document.body.appendChild(b);origin=true;b.click();origin=false;b.remove()}
function legacy(tab){mode=tab==='objectifs'?'objectifs':tab==='album'?'album':tab==='moi'?'legacy-profile':'feed';closeModal();simulate('tab',tab);updateNav();setTimeout(decorateLegacy,30)}
function click(e){let el=e.target.closest?.('[data-mv]'),original=e.target.closest?.('[data-act="tab"]'),oldEdit=e.target.closest?.('[data-act="edit-profile"]');
 if(oldEdit&&!origin){e.preventDefault();e.stopImmediatePropagation();profileDraft=null;render('profil');return}
 if(original&&!origin){if(original.dataset.tab==='moi'||original.dataset.tab==='fil'){e.preventDefault();e.stopImmediatePropagation();if(original.dataset.tab==='moi')profileDraft=null;render(original.dataset.tab==='moi'?'profil':'village');return}mode=original.dataset.tab==='objectifs'?'missions':'collection';updateNav();return}
 if(!el)return;e.preventDefault();e.stopImmediatePropagation();let a=el.dataset.mv,id=el.dataset.id;
 if(['village','jardin','maison','boutique'].includes(a)){profileDraft=null;render(a);return}
 if(a==='profil'){profileDraft=null;render('profil');return}
 if(a==='profile-level'){if(profileDraft){profileDraft.level=id;highlightProfile('level',id);let badge=document.getElementById('mv-profile-preview-level');if(badge)badge.textContent='Classe de '+id;}return}
 if(a==='profile-animal'){if(profileDraft&&avatars[id]){profileDraft.animal=id;highlightProfile('animal',id);document.getElementById('mv-profile-preview-pet').innerHTML=`<img src="${avatars[id]}" alt="Mon compagnon">`;}return}
 if(a==='profile-save'){profileSave();return}
 if(a==='profile-cancel'){profileDraft=null;render('village');return}
 if(a==='old-profile'){profileDraft=null;legacy('moi');return}
 if(a==='missions'){render('missions');return}if(a==='collection'){render('collection');return}if(a==='old-missions'){legacy('objectifs');return}if(a==='old-collection'){legacy('album');return}if(a==='profil'){profileDraft=null;render('profil');return}if(a==='feed'){legacy('fil');return}
 if(a==='zone'){zoneClick(id);return}if(a==='subject'){subId=id;render('jardin');return}if(a==='skill'){skillClick(id);return}
 if(a==='close'){closeModal();return}if(a==='help'){help();return}if(a==='buy'){buy(id);return}if(a==='unlock'){unlock(id);return}
 if(a==='adddecor'){addDecor(id);return}if(a==='selectdecor'){activeDecor=id;render('maison');return}if(a==='move-decor'){moveDecor(id);return}if(a==='delete-decor'){deleteDecor();return}
 if(a==='travel'){render(id);return}if(a==='check'){closeModal();simulate('start-check');return}
}
function boot(){if(started||!v())return;started=true;
try{subjects=JSON.parse(document.getElementById('data-subjects')?.textContent||'[]');avatars=JSON.parse(document.getElementById('data-avatars')?.textContent||'{}')}catch(e){console.warn('Mochi Village : données incomplètes',e)}
village.zones=Array.isArray(village.zones)?village.zones:[];village.items=Array.isArray(village.items)?village.items:['plant'];village.placed=village.placed||{};village.spent=Number(village.spent)||0;if(!have('plant'))village.items.unshift('plant');
initializeDecor();const nav=document.querySelector('nav.bottom');if(nav)nav.innerHTML=`<button class="mv-nav" data-mv="village">${icon('nav-home')}Village</button><button class="mv-nav" data-mv="jardin">${icon('nav-garden')}Jardin</button><button class="mv-nav" data-mv="missions">${icon('nav-missions')}Missions</button><button class="mv-nav" data-mv="collection">${icon('nav-collection')}Collection</button><button class="mv-nav" data-mv="maison">${icon('nav-house')}Maison</button>`;
let title=document.querySelector('.top h1');if(title)title.innerHTML='<strong>Mochi <em>Village</em></strong><small>my little world of progress</small>';
let action=document.createElement('button');action.className='mv-check-float';action.setAttribute('data-act','start-check');action.setAttribute('aria-label','Faire un check');action.textContent='✦';document.getElementById('app').appendChild(action);
v().addEventListener('touchend',e=>{if(['village','jardin','maison','boutique','missions','collection','foret','etang','prairie','profil'].includes(mode))e.stopImmediatePropagation()},true);
document.addEventListener('click',click,true);
 v().addEventListener('input',e=>{if(e.target.id==='mv-edit-name'&&profileDraft){profileDraft.name=e.target.value;let preview=document.getElementById('mv-profile-preview-name');if(preview)preview.textContent=e.target.value.trim()||'Mon aventure';}});
 v().addEventListener('pointerdown',dragDecor,true);
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&modal){e.stopImmediatePropagation();closeModal();return}
  if(mode==='maison'&&e.target.closest?.('.mv-decor')&&e.key.startsWith('Arrow')){
   e.preventDefault();const x={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key];activeDecor=e.target.dataset.id;if(x)moveDecor(x);
  }
 },true);
document.title='Mochi Village — mon petit monde de progrès';render('village');
/* L'ancien moteur redessine la page à la fin d'un check : la nouvelle interface revient aussitôt. */
let view=v();let observer=new MutationObserver(()=>{if(['village','jardin','maison','boutique','missions','collection','foret','etang','prairie','profil'].includes(mode)&&!view.querySelector('.mv-page'))render(mode);else if(['objectifs','album','legacy-profile','feed'].includes(mode))decorateLegacy()});observer.observe(view,{childList:true});
const ov=document.getElementById('overlay');if(ov){const ovObs=new MutationObserver(enhanceOriginalSubjectButtons);ovObs.observe(ov,{childList:true,subtree:true});enhanceOriginalSubjectButtons();}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
