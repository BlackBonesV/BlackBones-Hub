/* ===========================================================================
   script.js — BlackBones Hub
   Fonctions :
   1) Twitch Player (parent auto)
   2) Badge LIVE (DecAPI)
   3) Menu mobile (burger)
   4) Sous-menu "Réseaux"
   5) Lightbox Galerie (exclut la 1ʳᵉ image)
   6) Année du footer
   7) Feature Panel (panneau pour la 1ʳᵉ image) + 2 points cliquables
   =========================================================================== */

/* --- Utils --- */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const isLocal = () => ["localhost","127.0.0.1"].includes(location.hostname);

/* 1) Twitch Player (parent auto) */
(function initTwitchPlayer(){
  const iframe = $("#twitchPlayer");
  if (!iframe) return;
  const channel = "blackbonesv2"; // ← Ton channel
  let parentHost = location.hostname || "localhost"; // file:// -> localhost
  const params = new URLSearchParams({ channel, parent: parentHost });
  iframe.src = `https://player.twitch.tv/?${params.toString()}`;
})();

/* 2) Badge LIVE (DecAPI) */
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
  // setInterval(check, 60000); // optionnel (recheck chaque minute)
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

/* 5) Lightbox (sauf 1ʳᵉ image) */
(function initLightbox(){
  // Exclut #galleryFeature : elle ouvre le panneau custom
  const items = $$(".gallery-item:not(#galleryFeature)");
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

/* 6) Année footer (si <span id="year"> est présent) */
(function setYear(){
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();

/* 7) Feature Panel (panneau pour la 1ʳᵉ image) — avec points cliquables */
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

  // Parse JSON en sécurité (retourne [] si invalide/absent)
  function safeParseJSON(str){
    try{ return JSON.parse(str || "[]"); }
    catch{ return []; }
  }

  // Construit la liste <ul> des points cliquables
  function renderPoints(points){
    pointsUl.innerHTML = "";
    pointsUl.hidden = true;
    if (!Array.isArray(points) || points.length === 0) return;

    const frag = document.createDocumentFragment();
    points.forEach(({label, url}) => {
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
    // 1) Titre / Desc / Vidéo depuis data-*
    const title = trigger.dataset.title || "Détail";
    const desc  = trigger.dataset.desc  || "";
    const video = trigger.dataset.video || ""; // ⚠️ URL d'embed YouTube/Twitch

    titleEl.textContent = title;
    descEl.textContent  = desc;
    videoEl.src         = video;

    // 2) Points (2 exemples fournis à modifier dans index.html)
    const points = safeParseJSON(trigger.dataset.points);
    renderPoints(points);

    // 3) Ouvrir
    panel.classList.add("open");
    panel.setAttribute("aria-hidden","false");
  }

  function closePanel(){
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden","true");
    videoEl.src = "";   // Stop lecture
    trigger.focus();    // Focus retour
  }

  // Ouverture / Fermeture
  trigger.addEventListener("click", (e)=>{ e.preventDefault(); openPanel(); });
  btnClose?.addEventListener("click", closePanel);
  backdrop?.addEventListener("click", closePanel);
  document.addEventListener("keydown", (e)=>{ if (e.key==="Escape" && panel.classList.contains("open")) closePanel(); });
})();
