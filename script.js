/* ===========================================================================
   script.js — BlackBones Hub
   Modules :
   1) Twitch Player (parent auto)
   2) Badge LIVE (DecAPI)
   3) Menu mobile (burger)
   4) Sous-menu "Réseaux"
   5) Lightbox Galerie (exclut la 1ʳᵉ image)
   6) Année du footer (optionnel si <span id="year"> existe)
   7) Feature Panel (image 1) — titre/desc/points/vidéo
   8) (réservé)
   9) Galerie — Slideshow (image 2) auto + flèches + fondu + anti-copie
   =========================================================================== */

/* Utils */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* 1) Twitch Player : ajoute le "parent" automatiquement (local/dev/production) */
(function initTwitchPlayer(){
  const iframe = $("#twitchPlayer");
  if (!iframe) return;
  const channel = "blackbonesv2"; // ← Ton channel
  let parentHost = location.hostname || "localhost"; // pour file://
  const params = new URLSearchParams({ channel, parent: parentHost });
  iframe.src = `https://player.twitch.tv/?${params.toString()}`;
})();

/* 2) Badge LIVE : simple check via DecAPI */
(function initLiveBadge(){
  const badge = $("#liveBadge");
  if (!badge) return;
  const channel = "blackbonesv2";
  async function check(){
    try{
      const res = await fetch(`https://decapi.me/twitch/status/${encodeURIComponent(channel)}`, {cache:"no-store"});
      const txt = (await res.text()).toLowerCase();
      badge.hidden = !(txt.includes("live") && !txt.includes("offline"));
    }catch{ badge.hidden = true; }
  }
  check();
  // Optionnel : re-check toutes les minutes
  // setInterval(check, 60000);
})();

/* 3) Menu mobile */
(function initMobileMenu(){
  const btn = $("#btnMenu"), nav = $("#mainNav");
  if (!btn || !nav) return;
  btn.addEventListener("click", ()=>{
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", e=>{
    if (e.target.closest("a") && nav.classList.contains("open")) {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded","false");
    }
  });
  document.addEventListener("keydown", e=>{
    if (e.key==="Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open"); btn.setAttribute("aria-expanded","false"); btn.focus();
    }
  });
})();

/* 4) Sous-menu "Réseaux" */
(function initSubmenu(){
  const wrap = $(".has-submenu"); if (!wrap) return;
  const trigger = $(".submenu-trigger", wrap), menu = $(".submenu", wrap);
  if (!trigger || !menu) return;
  const open  = ()=>{ wrap.classList.add("open"); trigger.setAttribute("aria-expanded","true"); };
  const close = ()=>{ wrap.classList.remove("open"); trigger.setAttribute("aria-expanded","false"); };
  trigger.addEventListener("click", (e)=>{ e.stopPropagation(); wrap.classList.contains("open")?close():open(); });
  document.addEventListener("click", (e)=>{ if (!wrap.contains(e.target)) close(); });
  trigger.addEventListener("keydown", (e)=>{
    if (e.key==="ArrowDown"){ e.preventDefault(); open(); $("a", menu)?.focus(); }
    if (e.key==="Escape"){ close(); }
  });
  menu.addEventListener("keydown", (e)=>{ if (e.key==="Escape"){ close(); trigger.focus(); } });
})();

/* 5) Lightbox (sauf image 1) */
(function initLightbox(){
  const items = $$(".gallery-item:not(#galleryFeature)"); // exclut #galleryFeature
  const lightbox = $("#lightbox"), img = $("#lbImg"), caption=$("#lbCaption"), btnClose=$("#lbClose");
  if (!items.length || !lightbox || !img || !btnClose) return;

  const open = (src, alt="")=>{
    img.src = src; img.alt = alt; if (caption) caption.textContent = alt || "";
    lightbox.classList.add("open");
  };
  const close = ()=>{
    lightbox.classList.remove("open"); img.src=""; img.alt=""; if (caption) caption.textContent="";
  };

  items.forEach(el => el.addEventListener("click", ()=> open(el.src, el.alt)));
  btnClose.addEventListener("click", close);
  lightbox.addEventListener("click", e=>{ if (e.target===lightbox) close(); });
  document.addEventListener("keydown", e=>{ if (e.key==="Escape" && lightbox.classList.contains("open")) close(); });
})();

/* 6) Année footer (optionnel) */
(function setYear(){
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();

/* 7) Feature Panel (image 1) */
(function initFeaturePanel(){
  const trigger  = $("#galleryFeature"),
        panel    = $("#featurePanel"),
        backdrop = $("#fpBackdrop"),
        btnClose = $("#fpClose"),
        titleEl  = $("#fpTitle"),
        descEl   = $("#fpDesc"),
        videoEl  = $("#fpVideo"),
        pointsUl = $("#fpPoints");
  if (!trigger || !panel || !titleEl || !descEl || !videoEl || !pointsUl) return;

  function safeParseJSON(str){
    try{ return JSON.parse(str || "[]"); } catch{ return []; }
  }
  function renderPoints(points){
    pointsUl.innerHTML = "";
    pointsUl.hidden = true;
    if (!Array.isArray(points) || points.length === 0) return;
    const frag = document.createDocumentFragment();
    points.forEach(({label, url})=>{
      if (!label || !url) return;
      const li = document.createElement("li");
      const a  = document.createElement("a");
      a.href = url; a.target = "_blank"; a.rel = "noopener";
      a.textContent = label;
      li.appendChild(a);
      frag.appendChild(li);
    });
    pointsUl.appendChild(frag);
    pointsUl.hidden = false;
  }

  function openPanel(){
    const title = trigger.dataset.title || "Détail";
    const desc  = trigger.dataset.desc  || "";
    const video = trigger.dataset.video || ""; // ⚠️ URL embed
    titleEl.textContent = title;
    descEl.textContent  = desc;
    videoEl.src         = video;
    renderPoints( safeParseJSON(trigger.dataset.points) );

    panel.classList.add("open");
    panel.setAttribute("aria-hidden","false");
    // reset transition si spam :
    // eslint-disable-next-line no-unused-expressions
    panel.offsetHeight;
  }
  function closePanel(){
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden","true");
    videoEl.src = "";  // stop vidéo
    // eslint-disable-next-line no-unused-expressions
    panel.offsetHeight;
    trigger.focus();
  }

  trigger.addEventListener("click", (e)=>{ e.preventDefault(); openPanel(); });
  btnClose?.addEventListener("click", closePanel);
  backdrop?.addEventListener("click", closePanel);
  document.addEventListener("keydown", (e)=>{ if (e.key==="Escape" && panel.classList.contains("open")) closePanel(); });
})();

/* ===========================================================
   Crossfade Slideshow (2 <img> superposées, auto, anti-copie)
   =========================================================== */
function makeCrossfade(containerSelector, images, interval = 6000){
  const root = document.querySelector(containerSelector);
  if (!root || !Array.isArray(images) || images.length < 2) return;

  const imgs = root.querySelectorAll('.slide-img');
  if (imgs.length < 2) return;

  const topImg    = () => root.querySelector('.slide-img.is-top');
  const bottomImg = () => [...root.querySelectorAll('.slide-img')].find(i => !i.classList.contains('is-top'));

  // Anti-copie sur les deux <img>
  imgs.forEach(img => ['contextmenu','dragstart','selectstart'].forEach(ev => {
    img.addEventListener(ev, e => e.preventDefault());
  }));

  // IMPORTANT : ton HTML affiche déjà images[0] en haut et images[1] en bas
  let idx = 1; // on démarre la rotation à partir du 3e visuel (index 2)

  function next(){
    const top = topImg();
    const bottom = bottomImg();

    idx = (idx + 1) % images.length;
    const nextSrc = images[idx];

    const loader = new Image();
    loader.onload = () => {
      bottom.src = nextSrc;
      void bottom.offsetWidth;       // reflow
      bottom.classList.add('is-top'); // crossfade
      top.classList.remove('is-top');
    };
    loader.onerror = () => {
      bottom.src = nextSrc;
      bottom.classList.add('is-top');
      top.classList.remove('is-top');
    };
    loader.src = nextSrc;
  }

  let timer = setInterval(next, interval);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden){ clearInterval(timer); timer = null; }
    else if (!timer){ timer = setInterval(next, interval); }
  });
}

// Lance APRES que le DOM existe
document.addEventListener('DOMContentLoaded', () => {
  /* 🎞️ Slideshow #2 — 8 images */
  makeCrossfade('#ss-2', [
    'assets/gallery/slide2/slide-1.png',
    'assets/gallery/slide2/slide-2.png',
    'assets/gallery/slide2/slide-3.png',
    'assets/gallery/slide2/slide-4.png',
    'assets/gallery/slide2/slide-5.png',
    'assets/gallery/slide2/slide-6.png',
    'assets/gallery/slide2/slide-7.png',
    'assets/gallery/slide2/slide-8.png'
  ], 4000);   /* Ajustement de la vitesse de transition*/

  /* 🎞️ Slideshow #3 — 10 images */
  makeCrossfade('#ss-3', [
    'assets/gallery/slide3/slide-1.png',
    'assets/gallery/slide3/slide-2.png',
    'assets/gallery/slide3/slide-3.png',
    'assets/gallery/slide3/slide-4.png',
    'assets/gallery/slide3/slide-5.png',
    'assets/gallery/slide3/slide-6.png',
    'assets/gallery/slide3/slide-7.png',
    'assets/gallery/slide3/slide-8.png',
    'assets/gallery/slide3/slide-9.png',
    'assets/gallery/slide3/slide-10.png'
  ], 4000);  /* Ajustement de la vitesse de transition*/
});
/* ===========================================================
   Planning interactif (événements en cours + à venir)
   =========================================================== */

const EVENTS = [
  // ⚠️ Mets tes vraies dates ISO (incluant le fuseau si tu veux être précis)
  // Exemple : "2025-11-03T20:30:00+01:00"
  {
    title: "Soir découverte indés",
    start: "2025-11-10T20:30:00+01:00",
    end:   "2025-11-10T23:00:00+01:00",
    url:   "https://www.twitch.tv/blackbonesv2",
    tags:  ["Découverte"]
  },
  {
    title: "Collab surprise",
    start: "2025-11-12T21:00:00+01:00",
    end:   "2025-11-12T23:30:00+01:00",
    url:   "https://discord.gg/…",
    tags:  ["Collab"]
  },
  {
    title: "Late stream cosy",
    start: "2025-11-03T22:00:00+01:00",
    end:   "2025-11-04T00:30:00+01:00",
    url:   "https://www.twitch.tv/blackbonesv2",
    tags:  ["Cosy"]
  }
];

// Utilitaires
const toDate = s => new Date(s);
const fmt = d => d.toLocaleString("fr-FR", { dateStyle:"medium", timeStyle:"short" });

function getStatus(ev, now = new Date()){
  const s = toDate(ev.start), e = toDate(ev.end);
  if (now >= s && now < e) return "live";           // en cours
  if (now < s) return "upcoming";                   // à venir
  return "past";                                    // terminé
}

function relTime(target, now = new Date()){
  const diff = toDate(target) - now;
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric:"auto" });
  const mins = Math.round(diff / 60000);
  const hours = Math.round(mins/60);
  const days = Math.round(hours/24);
  if (Math.abs(mins) < 60) return rtf.format(mins, "minute");
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(days, "day");
}

/*function renderSchedule(filter = "all"){
  const now = new Date();
  // garder uniquement en cours + à venir
  const filtered = EVENTS
    .map(ev => ({...ev, __status: getStatus(ev, now)}))
    .filter(ev => ev.__status !== "past");

  // filtre bouton
  const filtered2 = filtered.filter(ev => {
    if (filter === "all") return true;
    return ev.__status === filter;
  });

  // tri : en cours d'abord, puis par date de début
  filtered2.sort((a, b) => {
    if (a.__status === "live" && b.__status !== "live") return -1;
    if (b.__status === "live" && a.__status !== "live") return 1;
    return toDate(a.start) - toDate(b.start);
  });

  const root = document.getElementById("scheduleList");
  root.innerHTML = filtered2.map(ev => {
    const start = toDate(ev.start), end = toDate(ev.end);
    const status = ev.__status;
    const when = status === "live" ? "En cours" : `Dans ${relTime(ev.start, now)}`;
    const badgeClass = status === "live" ? "badge badge-live" : "badge badge-soon";
    const tags = (ev.tags || []).map(t => `<span class="badge">${t}</span>`).join("");

    return `
      <article class="sched-card">
        <h3>${ev.title}</h3>
        <div class="sched-meta">${fmt(start)} → ${fmt(end)}</div>
        <div class="sched-badges">
          <span class="${badgeClass}">${when}</span>
          ${tags}
        </div>
        ${ev.url ? `<p style="margin-top:8px"><a href="${ev.url}" target="_blank" rel="noopener">Plus d'infos</a></p>` : ""}
      </article>
    `;
  }).join("");

  // état visuel des boutons
  document.querySelectorAll(".sched-filter").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.filter === filter);
  });
}

// boutons
document.addEventListener("click", (e)=>{
  const b = e.target.closest(".sched-filter");
  if (!b) return;
  renderSchedule(b.dataset.filter);
});

// 1er rendu
renderSchedule("all");*/
/* ===========================================================
   Planning interactif (LIVE / UPCOMING / PAST)
   - Tri auto selon l'état + dates
   - Recherche texte (titre/tags)
   - Filtres par tags (générés dynamiquement)
   - Compteurs par état
   - Modale détail (optionnelle)
=========================================================== */
(function scheduleInteractive(){
  const listEl   = document.getElementById('scheduleList');
  if (!listEl) return;

  // Réutilise ton tableau EVENTS s'il existe, sinon exemples
  const DATA = typeof window.EVENTS !== 'undefined' ? window.EVENTS : [
//    { title:'Soir chill',     start:'2025-10-10T20:30:00+02:00', end:'2025-10-10T23:00:00+02:00', url:'https://www.twitch.tv/blackbonesv2', tags:['Cosy'] },
//    { title:'Découverte indé',start:'2025-10-12T21:00:00+02:00', end:'2025-10-12T23:30:00+02:00', url:'',                                  tags:['Indé'] },
    { title:'Dernier Stream avant la pause',    start:'2025-09-12T22:30:00+02:00', end:'2025-09-13T00:30:00+02:00', url:'https://discord.gg/HVdTDEqfX9',    tags:['Late'] }
  ];

  const toDate = s => new Date(s);
  const fmt    = d => d.toLocaleString('fr-FR', { dateStyle:'medium', timeStyle:'short' });
  const now    = () => new Date();

  function getStatus(ev, ref = now()){
    const s = toDate(ev.start), e = toDate(ev.end);
    if (ref >= s && ref < e) return 'live';
    if (ref < s)             return 'upcoming';
    return 'past';
  }
  function relTime(target, ref = now()){
    const diff = toDate(target) - ref;
    const rtf  = new Intl.RelativeTimeFormat('fr', { numeric:'auto' });
    const mins = Math.round(diff/60000), hours = Math.round(mins/60), days = Math.round(hours/24);
    if (Math.abs(mins) < 60) return rtf.format(mins, 'minute');
    if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
    return rtf.format(days, 'day');
  }

  let state = { tab:'all', q:'', tags:new Set() };

  const tabs        = document.querySelectorAll('.sched-filter');
  const inputSearch = document.getElementById('scheduleSearch');
  const tagWrap     = document.getElementById('scheduleTags');
  const dlg         = document.getElementById('eventDialog');
  const dlgClose    = dlg?.querySelector('.sched-dialog-close');

  
// Helpers robustes pour ouvrir/fermer la modale (avec fallback)
function openDialogSafe() {
  if (!dlg) return;
  try { dlg.showModal(); }
  catch { dlg.setAttribute('open', ''); } // fallback si <dialog> non supporté
  // focus accessible sur la croix
  dlgClose?.focus();
}
function closeDialogSafe() {
  if (!dlg) return;
  try { dlg.close(); }
  catch { dlg.removeAttribute('open'); }
}
// Fermer via la croix
dlgClose?.addEventListener('click', (e)=> { 
  e.preventDefault(); 
  closeDialogSafe(); 
});

// Fermer en cliquant sur l'overlay (zone du <dialog> hors carte)
dlg?.addEventListener('click', (e)=> { 
  if (e.target === dlg) closeDialogSafe(); 
});

// Fermer avec la touche Échap
document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape' && dlg?.hasAttribute('open')) closeDialogSafe();
});

  const allTags = [...new Set(DATA.flatMap(ev => ev.tags || []))].sort();

  if (tagWrap){
    tagWrap.innerHTML = allTags.map(t => `
      <label class="tag-check"><input type="checkbox" value="${t}"> ${t}</label>
    `).join('');
    tagWrap.addEventListener('change', e=>{
      const cb = e.target.closest('input[type="checkbox"]');
      if (!cb) return;
      if (cb.checked) state.tags.add(cb.value); else state.tags.delete(cb.value);
      render();
    });
  }
  inputSearch?.addEventListener('input', e=>{ state.q = e.target.value.trim().toLowerCase(); render(); });
  tabs.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabs.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      state.tab = btn.dataset.filter;
      tabs.forEach(b => b.setAttribute('aria-selected', String(b===btn)));
      render();
    });
  });

  function filterAndSort(){
    const ref = now();
    let items = DATA.map(ev => ({...ev, __status: getStatus(ev, ref)}));
    if (state.tab !== 'all') items = items.filter(ev => ev.__status === state.tab);
    if (state.q){
      items = items.filter(ev => {
        const hay = (ev.title || '') + ' ' + (ev.tags || []).join(' ');
        return hay.toLowerCase().includes(state.q);
      });
    }
    if (state.tags.size){
      items = items.filter(ev => (ev.tags || []).some(t => state.tags.has(t)));
    }
    items.sort((a,b)=>{
      if (a.__status !== b.__status){
        const order = {live:0, upcoming:1, past:2};
        return order[a.__status] - order[b.__status];
      }
      if (a.__status === 'past') return toDate(b.start) - toDate(a.start);
      return toDate(a.start) - toDate(b.start);
    });
    return items;
  }

  function updateCounts(){
    const ref = now(); let live=0, upcoming=0, past=0;
    DATA.forEach(ev=>{ const s = getStatus(ev,ref); if (s==='live') live++; else if (s==='upcoming') upcoming++; else past++; });
    const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent=val; };
    set('count-all', live+upcoming+past); set('count-live', live); set('count-upcoming', upcoming); set('count-past', past);
  }

  function escapeHTML(str){ return (str||'').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }

  function render(){
    updateCounts();
    const items = filterAndSort();
    listEl.innerHTML = items.map(ev=>{
      const s = toDate(ev.start), e = toDate(ev.end);
      const status = ev.__status;
      const badge =
        status==='live'     ? `<span class="badge badge-live">En cours</span>` :
        status==='upcoming' ? `<span class="badge badge-soon">Dans ${relTime(ev.start)}</span>` :
                               `<span class="badge badge-past">Terminé</span>`;
      const tags = (ev.tags||[]).map(t=>`<span class="badge">${t}</span>`).join('');
      return `
        <article class="sched-card is-${status}">
          <h3>${ev.title}</h3>
          <div class="sched-meta">${fmt(s)} → ${fmt(e)}</div>
          <div class="sched-badges">${badge}${tags? ' ' + tags : ''}</div>
          <div class="sched-actions">
            ${ev.url ? `<a href="${ev.url}" target="_blank" rel="noopener">Plus d'infos</a>` : ''}
            <button class="btn-more" data-title="${escapeHTML(ev.title||'')}"
                                   data-start="${ev.start}" data-end="${ev.end}"
                                   data-url="${ev.url||''}" data-tags="${(ev.tags||[]).join(', ')}"
                                   data-desc="${escapeHTML(ev.desc||'')}">Détails</button>
          </div>
        </article>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-more').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if (!dlg) return;
        const title = btn.dataset.title || '';
        const start = btn.dataset.start, end = btn.dataset.end;
        const url   = btn.dataset.url;
        const tags  = (btn.dataset.tags||'').split(',').map(s=>s.trim()).filter(Boolean);
        const desc  = btn.dataset.desc || '';

        dlg.querySelector('#dlgTitle').textContent = title;
        dlg.querySelector('#dlgWhen').textContent  = `${fmt(toDate(start))} → ${fmt(toDate(end))}`;
        dlg.querySelector('#dlgTags').innerHTML    = tags.map(t=>`<span class="badge">${t}</span>`).join('') || '';
        dlg.querySelector('#dlgDesc').textContent  = desc;
        const wrap = dlg.querySelector('#dlgLinkWrap');
        wrap.innerHTML = url ? `<a href="${url}" target="_blank" rel="noopener">Lien / Détails</a>` : '';

        openDialogSafe();
      });
    });
  }

  const tick = setInterval(render, 60_000); // refresh auto
  window.addEventListener('beforeunload', ()=> clearInterval(tick));
  render();
})();
/* Chat Twitch : ajoute le parent automatiquement (lecture seule via overlay CSS) */
(function initTwitchChat(){
  const iframe = document.getElementById("twitchChat");
  if (!iframe) return;
  const channel = "blackbonesv2";
  const parentHost = location.hostname || "localhost";  // GH Pages = blackbonesv.github.io
  const params = new URLSearchParams({
    parent: parentHost,
    // Pour un thème sombre du chat avec badges/emotes
    darkpopout: "true"
  });
  // URL embed chat + channel
  iframe.src = `https://www.twitch.tv/embed/${channel}/chat?${params.toString()}`;
})();
