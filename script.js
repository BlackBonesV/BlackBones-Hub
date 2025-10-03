/* ============================================================================
   Boot
   ============================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  initSubmenu();
  initTwitchEmbeds();
  initLightbox();
  initFeaturePanel();
  initCrossfades();
  initSchedule();          // planning auto (live / upcoming / past)
  reorderAboutBoxes();      // place Horaires à côté de Qui suis-je
  initModalsGeneric();     // fermeture via [data-close], etc.
  initGamesCarousel();     // carrousel jeux (centrage carte active)
  initLoLBuilds();         // bouton "Mes builds" -> flux 3 modales
});

/* Utils */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
// Debounce util (évite de filtrer à chaque caractère)
const debounce = (fn, d = 180) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), d); };
};


/* ============================================================================
   Navigation (burger)
   ============================================================================ */
function initMenu(){
  const btn = document.getElementById("btnMenu");
  const nav = document.getElementById("mainNav");
  if(!btn || !nav) return;
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

/* Sous-menu “Réseaux” */
function initSubmenu(){
  const wrap = document.querySelector(".has-submenu");
  if(!wrap) return;
  const trigger = wrap.querySelector(".submenu-trigger");
  trigger.addEventListener("click", () => {
    const open = wrap.classList.toggle("open");
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", (e)=>{
    if(!wrap.contains(e.target)) {
      wrap.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    }
  });
}

/* ============================================================================
   Twitch embeds
   ============================================================================ */
function initTwitchEmbeds(){
  const host = location.hostname;
  const player = document.getElementById("twitchPlayer");
  const chat   = document.getElementById("twitchChat");
  if(player){
    player.src = `https://player.twitch.tv/?channel=blackbonesv2&parent=${host}&muted=true`;
  }
  if(chat){
    chat.src = `https://www.twitch.tv/embed/blackbonesv2/chat?parent=${host}`;
  }
}

/* ============================================================================
   Lightbox
   ============================================================================ */
function initLightbox(){
  const lb = document.getElementById("lightbox");
  if(!lb) return;
  const lbImg = document.getElementById("lbImg");
  const lbCaption = document.getElementById("lbCaption");
  const lbClose = document.getElementById("lbClose");
  const items = document.querySelectorAll(".gallery-item:not(#galleryFeature)");

  items.forEach(el => {
    el.addEventListener("click", () => {
      lbImg.src = el.src;
      lbCaption.textContent = el.alt || "";
      lb.classList.add("open");
    });
  });
  lbClose.addEventListener("click", () => lb.classList.remove("open"));
  lb.addEventListener("click", (e) => {
    if(e.target === lb) lb.classList.remove("open");
  });
}

/* ============================================================================
   Panneau “feature”
   ============================================================================ */
function initFeaturePanel(){
  const trigger = document.getElementById("galleryFeature");
  const panel   = document.getElementById("featurePanel");
  if(!trigger || !panel) return;

  const fpTitle  = document.getElementById("fpTitle");
  const fpDesc   = document.getElementById("fpDesc");
  const fpPoints = document.getElementById("fpPoints");
  const fpVideo  = document.getElementById("fpVideo");
  const fpClose  = document.getElementById("fpClose");
  const fpBack   = document.getElementById("fpBackdrop");

  trigger.addEventListener("click", () => {
    fpTitle.textContent = trigger.dataset.title || "Détail";
    fpDesc.textContent  = trigger.dataset.desc || "";
    fpPoints.innerHTML = "";
    const pts = safeParseJSON(trigger.dataset.points) || [];
    if(pts.length){
      fpPoints.hidden = false;
      pts.forEach(p => {
        const li = document.createElement("li");
        const a  = document.createElement("a");
        a.href = p.url; a.target = "_blank"; a.rel = "noopener";
        a.textContent = p.label;
        li.appendChild(a);
        fpPoints.appendChild(li);
      });
    }else{
      fpPoints.hidden = true;
    }
    fpVideo.src = trigger.dataset.video || "";
    panel.classList.add("open");
  });

  const close = () => {
    panel.classList.remove("open");
    fpVideo.src = "";
  };
  fpClose.addEventListener("click", close);
  fpBack .addEventListener("click", close);
}
function safeParseJSON(str){ try{ return JSON.parse(str); } catch{ return null; } }

/* ============================================================================
   Crossfades (galerie)
   ============================================================================ */
function initCrossfades(){
  document.querySelectorAll(".x-slideshow").forEach(el=>{
    const imgs = Array.from(el.querySelectorAll(".slide-img"));
    if(imgs.length < 2) return;
    let idx = 0;
    setInterval(()=>{
      imgs[idx].classList.remove("is-top");
      idx = (idx + 1) % imgs.length;
      imgs[idx].classList.add("is-top");
    }, 3000);
  });
}

/* ============================================================================
   Planning (live / upcoming / past + recherche)
   ============================================================================ */
function initSchedule(){
  const list = document.getElementById("scheduleList");
  if(!list) return;

  const now = () => new Date();
  const cards = Array.from(list.querySelectorAll(".sched-card"));

  cards.forEach(card=>{
    const start = new Date(card.dataset.start);
    let end;
    if(card.dataset.end) end = new Date(card.dataset.end);
    else if(card.dataset.duration){
      end = new Date(start.getTime() + parseInt(card.dataset.duration,10)*60000);
    }
    card.dataset._startTs = start.getTime();
    card.dataset._endTs   = end ? end.getTime() : start.getTime();
  });

  function refreshBadges(){
    const t = now().getTime();
    let cAll=0, cLive=0, cUp=0, cPast=0;
    cards.forEach(card=>{
      cAll++;
      const s = +card.dataset._startTs;
      const e = +card.dataset._endTs;
      card.classList.remove("is-live","is-upcoming","is-past");
      const badgeWrap = card.querySelector(".sched-badges");
      badgeWrap.innerHTML = "";
      if(t >= s && t <= e){
        cLive++; card.classList.add("is-live");
        addBadge(badgeWrap, "En cours", "badge-live");
      }else if(t < s){
        cUp++; card.classList.add("is-upcoming");
        addBadge(badgeWrap, "À venir", "badge-soon");
      }else{
        cPast++; card.classList.add("is-past");
        addBadge(badgeWrap, "Terminé", "badge-past");
      }
    });
    setCount("count-all", cAll);
    setCount("count-live", cLive);
    setCount("count-upcoming", cUp);
    setCount("count-past", cPast);
  }
  const addBadge = (wrap, txt, cls) => {
    const b = document.createElement("span");
    b.className = `badge ${cls||""}`; b.textContent = txt;
    wrap.appendChild(b);
  };
  const setCount = (id, n) => {
    const el = document.getElementById(id); if(el) el.textContent = n;
  };

  const tabs = document.querySelectorAll(".sched-filter");
  tabs.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      tabs.forEach(b=>b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const f = btn.dataset.filter;
      filterCards(f, searchInput.value.trim().toLowerCase());
    });
  });

  const searchInput = document.getElementById("scheduleSearch");
  if(searchInput){
    searchInput.addEventListener("input", ()=>{
      const active = document.querySelector(".sched-filter.is-active")?.dataset.filter || "all";
      filterCards(active, searchInput.value.trim().toLowerCase());
    });
  }

  function filterCards(filter, q){
    cards.forEach(card=>{
      const isLive = card.classList.contains("is-live");
      const isUp   = card.classList.contains("is-upcoming");
      const isPast = card.classList.contains("is-past");
      let ok = (filter==="all")
            || (filter==="live" && isLive)
            || (filter==="upcoming" && isUp)
            || (filter==="past" && isPast);
      if(ok && q){
        const title = (card.querySelector("h3")?.textContent || "").toLowerCase();
        const tags  = (card.dataset.tags || "").toLowerCase();
        ok = title.includes(q) || tags.includes(q);
      }
      card.style.display = ok ? "" : "none";
    });
  }

  refreshBadges();
  setInterval(refreshBadges, 60000);
}


/* ============================================================================
   Réorganisation des box "À propos" (placer Horaires à côté de "Qui suis-je ?")
   ============================================================================ */
function reorderAboutBoxes(){
  const stack = document.querySelector('.about-stack');
  if(!stack) return;
  const boxes = Array.from(stack.querySelectorAll('.about-box'));
  const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();

  boxes.forEach(box => {
    const titleEl = box.querySelector('h3, .about-title, .box-title, h2');
    const t = norm(titleEl?.textContent);
    if (t.includes('qui suis-je') || t.includes('qui suis je')) {
      box.classList.add('about-box--qui');
    } else if (t.includes('horaire') || t.includes('horaires')) {
      box.classList.add('about-box--horaires');
    } else if (t.includes('jeux du moment') || t.includes('jeux')) {
      box.classList.add('about-box--jeux');
    }
  });
}

/* ============================================================================
   Modales génériques — fermeture (x / backdrop)
   ============================================================================ */
function initModalsGeneric(){
  document.querySelectorAll(".modal .modal-close,[data-close]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.dataset.close || btn.closest(".modal")?.id;
      if(!id) return;
      const m = document.getElementById(id);
      m.classList.remove("animate-in");
      m.classList.add("animate-out");
      setTimeout(()=>{ m.classList.add("is-hidden"); m.classList.remove("is-open","animate-out"); }, 180);
    });
  });
}

/* Helpers modales pour la partie LoL */
function openModalById(id){
  const m = document.getElementById(id);
  if(!m) return;
  m.classList.remove("is-hidden");
  m.classList.add("is-open","animate-in");
  setTimeout(()=>m.classList.remove("animate-in"), 220);
}
function closeModal(id){
  const m = document.getElementById(id);
  if(!m) return;
  m.classList.remove("animate-in");
  m.classList.add("animate-out");
  setTimeout(()=>{ m.classList.add("is-hidden"); m.classList.remove("is-open","animate-out"); }, 180);
}
/* ============================================================================
   Carrousel — cartes centrées
   ============================================================================ */
function initGamesCarousel(){
  const root = document.getElementById("gamesCarousel");
  if (!root) return;

  const viewport = root.querySelector(".gc-viewport");
  const track    = root.querySelector(".gc-track");
  const slides   = Array.from(root.querySelectorAll(".gc-slide"));
  const btnPrev  = root.querySelector(".gc-prev");
  const btnNext  = root.querySelector(".gc-next");
  const dotsWrap = root.querySelector(".gc-dots");
  if (!viewport || !track || slides.length === 0) return;

  const centerOffsetFor = (i) => {
    const vpW   = viewport.clientWidth;
    const slide = slides[i];
    const left  = slide.offsetLeft;
    const w     = slide.offsetWidth;
    const center= left + w/2;
    return center - vpW/2;
  };

  let index = 0;

  const goTo = (i) => {
    index = clamp(i, 0, slides.length - 1);
    const x = centerOffsetFor(index);
    track.style.transform = `translate3d(${-x}px,0,0)`;
    updateDots();
  };
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  const dots = slides.map((_, i) => {
    const d = document.createElement("button");
    d.type = "button";
    d.className = "gc-dot";
    d.setAttribute("aria-label", `Aller au slide ${i+1}`);
    d.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(d);
    return d;
  });
  function updateDots(){ dots.forEach((d,i)=>d.classList.toggle("is-active", i===index)); }

  let dragging = false, startX = 0, startTx = 0, dx = 0;
  const currentTranslateX = () => {
    const s = getComputedStyle(track).transform;
    const m = /matrix\(1, 0, 0, 1, (-?\d+(?:\.\d+)?),/.exec(s) ||
              /translate3d\((-?\d+(?:\.\d+)?)px,/.exec(s);
    return m ? parseFloat(m[1]) : 0;
  };

  const onDown = (clientX) => {
    dragging = true; dx = 0; startX = clientX; startTx = currentTranslateX();
    track.style.transition = "none";
  };
  const onMove = (clientX) => {
    if (!dragging) return;
    dx = clientX - startX;
    track.style.transform = `translate3d(${startTx + dx}px,0,0)`;
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false; track.style.transition = "";
    const threshold = Math.min(140, viewport.clientWidth * 0.2);
    if (dx >  threshold) prev();
    else if (dx < -threshold) next();
    else goTo(index);
  };

  viewport.addEventListener("mousedown", e => onDown(e.clientX));
  window.addEventListener("mousemove", e => onMove(e.clientX));
  window.addEventListener("mouseup", onUp);
  viewport.addEventListener("touchstart", e => onDown(e.touches[0].clientX), {passive:true});
  window.addEventListener("touchmove",  e => onMove(e.touches[0].clientX),  {passive:true});
  window.addEventListener("touchend", onUp);

  slides.forEach(slide => {
    slide.addEventListener("click", () => {
      if (Math.abs(dx) > 6) return;
      const url = slide.dataset.link;
      if (url) window.open(url, "_blank", "noopener");
    });
  });

  if(btnNext) btnNext.addEventListener("click", next);
  if(btnPrev) btnPrev.addEventListener("click", prev);

  root.setAttribute("tabindex","0");
  root.addEventListener("keydown", e=>{
    if (e.key === "ArrowLeft")  { e.preventDefault(); prev(); }
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
  });

  window.addEventListener("resize", () => goTo(index));
  goTo(0);
}

/* ============================================================================
   LoL — Chargement JSON + 3 modales (adapté à data/lol/)
   ============================================================================ */
const CHAMPIONS_URL = 'data/lol/champions.json';
const RUNES_URL     = 'data/lol/runes.json';
// Dev: recharger les JSON à chaque ouverture (évite le cache)
const DEV_FETCH_NO_CACHE = true;
const withBust  = (url) => DEV_FETCH_NO_CACHE ? `${url}?v=${Date.now()}` : url;
const FETCH_OPTS = DEV_FETCH_NO_CACHE ? { cache: 'no-store' } : { cache: 'force-cache' };

const state = {
  championsIndex: new Map(), // slug -> {slug,name,icon}
  runesByChampion: new Map(),// slug -> {slug,name,portrait,configs:[...] }
  selectedChampionSlug: null,
  selectedChampionName: null,
  selectedConfig: null,
};

async function loadAllData(){
  const [chRes, ruRes] = await Promise.all([
    fetch(withBust(CHAMPIONS_URL), FETCH_OPTS),
    fetch(withBust(RUNES_URL),     FETCH_OPTS),
  ]);
  if(!chRes.ok) throw new Error('champions.json introuvable');
  if(!ruRes.ok) throw new Error('runes.json introuvable');

  const championsList = await chRes.json(); // [{slug,name,icon}]
  const runesData     = await ruRes.json(); // { champions:[...] }

  championsList.forEach(c=>{
    if(!c?.slug) return;
    state.championsIndex.set(String(c.slug).toLowerCase(), c);
  });

  if(Array.isArray(runesData.champions)){
    runesData.champions.forEach(entry=>{
      const slug = String(entry.slug||'').toLowerCase();
      if(!slug) return;
      state.runesByChampion.set(slug, entry);
    });
  }
}

/* Bouton overlay "Mes builds" dans le slide LoL */
function initLoLBuilds(){
  const btn =
    document.querySelector('#gamesCarousel .gc-slide[data-label="League of Legends"] .gc-builds-btn')
    || document.querySelector('.gc-builds-btn');
  if(!btn) return;

  btn.addEventListener('click', async (e)=>{
    e.stopPropagation();
    try{
      if(!state.championsIndex.size || !state.runesByChampion.size){
        await loadAllData();
      }
      renderChampionSelect();
      openModalById('gameModal');
    }catch(err){
      console.error(err);
      alert('Impossible de charger les données LoL (data/lol/*).');
    }
  });
}

/* === Modale 1 : sélection champions ======================================= */
function renderChampionSelect(){
  const body  = document.getElementById("gameModalBody");
  const title = document.getElementById("gameModalTitle");
  if(!body) return;
  title && (title.textContent = 'League of Legends — Champions');

  body.innerHTML = `
    <div class="modal-search">
      <input id="championSearch" type="search" placeholder="Rechercher un champion…" />
    </div>
  `;
  const grid = document.createElement('div');
  grid.className = 'champ-grid';

  const slugs = Array.from(state.runesByChampion.keys()).sort();
  slugs.forEach(slug=>{
    const r = state.runesByChampion.get(slug);
    const c = state.championsIndex.get(slug);
    const name = c?.name || r?.name || slug;
    const icon = c?.icon || r?.portrait || '';

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'champ-card';
    card.setAttribute('data-slug', slug);
    card.innerHTML = `
      <img src="${icon}" alt="${name}">
      <div class="champ-name">${name}</div>
    `;
    card.addEventListener('click', ()=>{
      state.selectedChampionSlug = slug;
      state.selectedChampionName = name;
      renderPresetsForChampion(slug);
      closeModal('gameModal');
      openModalById('presetModal');
    });
    grid.appendChild(card);
  });

  body.appendChild(grid);

  ensureGameModalOverlay();   // overlay + spinner
  wireLolSearch();            // wiring de la recherche avec animations

}
// Crée l'overlay de chargement (spinner) si absent
function ensureGameModalOverlay() {
  const gm = document.getElementById('gameModal');
  if (!gm || gm.querySelector('.loading-overlay')) return;
  const ov = document.createElement('div');
  ov.className = 'loading-overlay';
  ov.innerHTML = '<div class="spinner" aria-hidden="true"></div>';
  gm.appendChild(ov);
}

// Branche la recherche + animations (stagger)
function wireLolSearch() {
  const gm = document.getElementById('gameModal');
  if (!gm) return;

  // Sélecteurs ADAPTÉS à ton code :
  const input = gm.querySelector('#championSearch');  // ton input existant
  const grid  = gm.querySelector('.champ-grid');      // ta grille
  const cards = () => Array.from(grid.querySelectorAll('.champ-card')); // tes cartes

  if (!input || !grid) return;

  const startLoading = () => gm.classList.add('is-loading');
  const endLoading   = () => gm.classList.remove('is-loading');

  const readName = (card) => {
    // Tu utilises déjà .champ-name → on lit ce texte
    const el = card.querySelector('.champ-name') || card;
    return el.textContent || '';
  };

  const applyStagger = (visible) => {
    visible.forEach((card, i) => {
      card.classList.remove('anim-in');
      card.style.setProperty('--delay', (i * 18) + 'ms');
      void card.offsetWidth; // reset animation
      card.classList.add('anim-in');
    });
  };

  const showNoResults = (show) => {
    let n = gm.querySelector('.no-results');
    if (!n) {
      n = document.createElement('div');
      n.className = 'no-results';
      n.textContent = 'Aucun champion trouvé.';
      grid.parentElement.appendChild(n);
    }
    n.style.display = show ? '' : 'none';
  };

  const doFilter = (qRaw) => {
    const q = (qRaw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
    const all = cards();
    if (!all.length) return;

    startLoading();
    requestAnimationFrame(() => {
      const visible = [];
      for (const c of all) {
        const name = readName(c).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
        const match = !q || name.includes(q);
        c.style.display = match ? '' : 'none';
        if (match) visible.push(c);
      }
      showNoResults(visible.length === 0);
      applyStagger(visible);
      setTimeout(endLoading, 120);
    });
  };

  // Premier rendu + écouteur (debounced)
  doFilter('');
  input.removeEventListener('input', input._lolSearchHandler || (()=>{}));
  input._lolSearchHandler = (e) => debounce(doFilter, 220)(e.target.value);
  input.addEventListener('input', input._lolSearchHandler);
}
/* === Modale 2 : presets ==================================================== */
function renderPresetsForChampion(slug){
  const body  = document.getElementById("presetModalBody");
  const title = document.getElementById("presetModalTitle");
  if(!body) return;
  title && (title.textContent = 'Configurations');

  const entry = state.runesByChampion.get(slug);
  const configs = Array.isArray(entry?.configs) ? entry.configs : [];

  if(!configs.length){
    body.innerHTML = `<p class="empty">Aucun preset pour ${state.selectedChampionName}.</p>`;
    return;
  }

  const wrap = document.createElement('div');
  wrap.style.display = 'grid';
  wrap.style.gridTemplateColumns = 'repeat(auto-fit,minmax(240px,1fr))';
  wrap.style.gap = '12px';

  configs.forEach(cfg=>{
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'game-trigger';
    card.setAttribute('data-game','lol');
    const kIcon = cfg?.primary?.keystone?.icon || '';
    const kLbl  = cfg?.primary?.keystone?.label || '';
    const label = cfg?.label || cfg?.id || 'Preset';
    const title2= cfg?.title ? ` – ${cfg.title}` : '';

    card.innerHTML = `
      ${kIcon ? `<img src="${kIcon}" alt="${kLbl}" style="width:28px;height:28px;border-radius:6px;object-fit:cover;">` : ''}
      <div style="display:grid;gap:2px;text-align:left">
        <strong>${label}${title2}</strong>
        <small style="opacity:.8">${cfg?.primary?.tree?.name || '—'} • ${cfg?.secondary?.tree?.name || '—'}</small>
      </div>
    `;
    card.addEventListener('click', ()=>{
      state.selectedConfig = cfg;
      renderRunesPreset(cfg);           // remplit la modale 3
      closeModal('presetModal');
      openModalById('runesModal');      // ouvre la modale 3
    });
    wrap.appendChild(card);
  });

  body.innerHTML = '';
  body.appendChild(wrap);
}

/* === Modale 3 : résultat (runes + shards à côté + objets dessous en 4 sections) */
function renderRunesPreset(cfg){
  const body  = document.getElementById("runesModalBody");
  const title = document.getElementById("runesModalTitle");
  if(!body) return;

  title && (title.textContent =
    `Runes — ${state.selectedChampionName} — ${cfg.label || cfg.id || 'Build'}`);

  const primary   = cfg.primary   || {};
  const secondary = cfg.secondary || {};
  const shards    = Array.isArray(cfg.shards) ? cfg.shards : [];

  // Items: supporte itemsByStage (starter/early/core/situational) sinon fallback à cfg.items -> Core
  const byStage = cfg.itemsByStage || {};
  const flat = Array.isArray(cfg.items) ? cfg.items.map(x => ({ name: x.name, icon: x.icon })) : [];
  const itemsStarter = Array.isArray(byStage.starter) ? byStage.starter : [];
  const itemsEarly   = Array.isArray(byStage.early)   ? byStage.early   : [];
  const itemsCore    = Array.isArray(byStage.core)    ? byStage.core    : (flat.length ? flat : []);
  const itemsSitu    = Array.isArray(byStage.situational) ? byStage.situational : [];

  // Helpers UI
  const el = (tag, cls, html) => { const n = document.createElement(tag); if(cls) n.className = cls; if(html!==undefined) n.innerHTML = html; return n; };

  const runeRow = (r) => {
    if(!r) return null;
    const row = el('div','rune-row');
    const ic  = el('div','rune-icon');
    if(r.icon){ const img = new Image(); img.src = r.icon; img.alt = r.label||''; img.width=28; img.height=28; ic.appendChild(img); }
    const name= el('div','rune-name', r.label||'');
    row.append(ic, name);
    return row;
  };

  const shardRow = (s) => {
    const row = el('div','shard-row');
    const ic  = el('div','shard-icon');
    if(s?.icon){ const img = new Image(); img.src = s.icon; img.alt = s.label||''; img.width=24; img.height=24; ic.appendChild(img); }
    row.append(ic, el('div','shard-label', s?.label||''));
    return row;
  };

  const itemRow = (it) => {
    const row = el('div','item-row');
    const ic  = el('div','item-icon');
    if(it?.icon){ const img = new Image(); img.src = it.icon; img.alt = it.name||''; img.width=32; img.height=32; ic.appendChild(img); }
    row.append(ic, el('div','item-name', it?.name||''));
    return row;
  };

  const mkTreeBlock = (tree, fallbackName) => {
    const wrap = el('div', 'runes-head');
    if(tree?.emblem){
      const img = new Image(); img.src = tree.emblem; img.alt = tree?.name || fallbackName || ''; img.className = 'runes-emblem';
      wrap.appendChild(img);
    }
    const h = el('h3', null, (tree?.name || fallbackName || '—').toUpperCase());
    wrap.appendChild(h);
    return wrap;
  };

  // Grille
  const grid = el('div','runes-modal__grid');

  // Panneau : voie principale
  const prim = el('div','rm-panel runes-primary');
  prim.appendChild(mkTreeBlock(primary.tree, 'Voie principale'));
  if(primary.keystone) prim.appendChild(runeRow(primary.keystone));
  (primary.minors||[]).forEach(m => prim.appendChild(runeRow(m)));

  // Panneau : voie secondaire
  const sec = el('div','rm-panel runes-secondary');
  sec.appendChild(mkTreeBlock(secondary.tree, 'Voie secondaire'));
  (secondary.minors||[]).forEach(m => sec.appendChild(runeRow(m)));

  // Panneau : shards (à côté)
  const sh = el('div','rm-panel runes-shards');
  sh.append(el('h3', null, 'Fragments (Shards)'));
  shards.forEach(s => sh.appendChild(shardRow(s)));

  // Section items (4 colonnes dessous)
  const itemsSection = el('div','items-section');
  const itemsGrid = el('div','items-grid');

  const mkSection = (label, list) => {
    const card = el('div','item-card');
    card.append(el('h4', null, label));
    const lst = el('div','item-list');
    (list||[]).forEach(it => lst.appendChild(itemRow(it)));
    if(!list || list.length===0){
      const empty = el('div','item-row');
      empty.append(el('div','item-icon'), el('div','item-name','<span style="opacity:.6">—</span>'));
      lst.appendChild(empty);
    }
    card.appendChild(lst);
    return card;
  };

  itemsGrid.append(
    mkSection('Starter', itemsStarter),
    mkSection('Early',   itemsEarly),
    mkSection('Core',    itemsCore),
    mkSection('Items Situationnels', itemsSitu)
  );
  itemsSection.appendChild(itemsGrid);

  // Injecte dans la modale
  grid.append(prim, sec, sh, itemsSection);
  body.innerHTML = '';
  body.appendChild(grid);
}
