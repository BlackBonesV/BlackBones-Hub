/* ===========================================================================
   script.js — BlackBones Hub
   Fonctions incluses :
   1) Twitch Player (parent auto)
   2) Badge LIVE (DecAPI)
   3) Menu mobile (burger)
   4) Sous-menu "Réseaux" (ouverture/fermeture + clavier)
   5) Lightbox Galerie
   6) Année du footer
   =========================================================================== */

/* ---------------------------------------------------------------------------
   0) Utilitaires simples
   --------------------------------------------------------------------------- */

/** Raccourcis pour query */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Ajoute/retire une classe en sécurité */
const toggleClass = (el, className, force) => {
  if (!el) return;
  if (typeof force === "boolean") el.classList.toggle(className, force);
  else el.classList.toggle(className);
};

/** Petite aide pour savoir si on est en local (utile pour Twitch parent) */
const isLocal = () => {
  const h = location.hostname;
  return h === "localhost" || h === "127.0.0.1";
};

/* ---------------------------------------------------------------------------
   1) Twitch Player (parent auto)
   - Twitch impose un paramètre ?parent=<domaine> sur l'iframe
   - On construit l'URL dynamiquement selon location.hostname
   - Si on est en file:// (aucun hostname), on force "localhost" pour tester
   --------------------------------------------------------------------------- */
(function initTwitchPlayer() {
  const iframe = $("#twitchPlayer");
  if (!iframe) return;

  const channel = "blackbonesv2";              // ← Ton channel
  let parentHost = location.hostname || "localhost";

  // Cas particuliers utiles en dev
  if (parentHost === "") parentHost = "localhost"; // file://
  // Optionnel : si tu préfères forcer "github.io" en prod, à activer :
  // if (!isLocal()) parentHost = "tonutilisateur.github.io";

  const params = new URLSearchParams({
    channel,
    parent: parentHost,
    // Autres options possibles :
    // autoplay: "false",
    // muted: "false",
  });

  const src = `https://player.twitch.tv/?${params.toString()}`;
  iframe.src = src;
})();

/* ---------------------------------------------------------------------------
   2) Badge LIVE (via DecAPI — pas de clé nécessaire)
   - Affiche "LIVE" si la chaîne est en direct
   - Vérifie au chargement (et optionnellement toutes les 60s)
   --------------------------------------------------------------------------- */
(function initLiveBadge() {
  const badge = $("#liveBadge");
  if (!badge) return;

  const channel = "blackbonesv2"; // ← Ton channel
  const endpoint = `https://decapi.me/twitch/status/${encodeURIComponent(channel)}`;

  async function checkLiveOnce() {
    try {
      const res = await fetch(endpoint, { cache: "no-store" });
      const txt = (await res.text()).toLowerCase();
      const online = txt.includes("live") && !txt.includes("offline");
      badge.hidden = !online;
    } catch (e) {
      console.warn("LIVE badge error:", e);
      badge.hidden = true; // on cache en cas d'erreur réseau
    }
  }

  checkLiveOnce();
  // Option : réactiver pour rechecker régulièrement (ex. toutes les 60s)
  // setInterval(checkLiveOnce, 60000);
})();

/* ---------------------------------------------------------------------------
   3) Menu mobile (burger)
   - Le bouton #btnMenu ouvre/ferme la nav (ajoute .open sur .nav)
   - Gère aria-expanded pour accessibilité
   --------------------------------------------------------------------------- */
(function initMobileMenu() {
  const btn = $("#btnMenu");
  const nav = $("#mainNav");
  if (!btn || !nav) return;

  function toggleMenu() {
    const isOpen = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(isOpen));
  }

  btn.addEventListener("click", toggleMenu);

  // Fermer le menu si on clique sur un lien du menu (utile en mobile)
  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && nav.classList.contains("open")) {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
  });

  // Fermer sur "Escape"
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      btn.focus();
    }
  });
})();

/* ---------------------------------------------------------------------------
   4) Sous-menu "Réseaux"
   - Ouverture au clic sur .submenu-trigger
   - Fermeture si clic à l'extérieur ou Escape
   - Support clavier (ArrowDown passe le focus sur le premier lien)
   --------------------------------------------------------------------------- */
(function initSubmenu() {
  const container = $(".has-submenu");
  if (!container) return;

  const trigger = $(".submenu-trigger", container);
  const menu = $(".submenu", container);

  if (!trigger || !menu) return;

  function openMenu() {
    container.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
  }
  function closeMenu() {
    container.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  }
  function toggleMenu() {
    if (container.classList.contains("open")) closeMenu();
    else openMenu();
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Clic en dehors -> fermeture
  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) closeMenu();
  });

  // Clavier : Escape pour fermer ; ArrowDown pour focus 1er lien
  trigger.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openMenu();
      const firstLink = $("a", menu);
      firstLink?.focus();
    }
    if (e.key === "Escape") {
      closeMenu();
    }
  });
  menu.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMenu();
      trigger.focus();
    }
  });
})();

/* ---------------------------------------------------------------------------
   5) Lightbox Galerie
   - Clique sur .gallery-item => ouvre #lightbox avec l'image en grand
   - Clique sur la croix / fond / Escape => ferme
   - Le <p id="lbCaption"> reprend l'attribut alt si présent
   --------------------------------------------------------------------------- */
(function initLightbox() {
  const items = $$(".gallery-item");
  const lightbox = $("#lightbox");
  const img = $("#lbImg");
  const caption = $("#lbCaption");
  const btnClose = $("#lbClose");

  if (!items.length || !lightbox || !img || !btnClose) return;

  function open(src, alt = "") {
    img.src = src;
    img.alt = alt;
    if (caption) caption.textContent = alt || "";
    toggleClass(lightbox, "open", true);
    // Empêche le scroll de fond si tu veux :
    // document.body.style.overflow = "hidden";
  }

  function close() {
    toggleClass(lightbox, "open", false);
    img.src = "";
    img.alt = "";
    if (caption) caption.textContent = "";
    // document.body.style.overflow = "";
  }

  // Ouvrir au clic sur l'aperçu
  items.forEach((el) => {
    el.addEventListener("click", () => open(el.src, el.alt));
  });

  // Fermer via la croix
  btnClose.addEventListener("click", close);

  // Fermer si clic en dehors de l'image
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });

  // Fermer via clavier
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("open")) close();
  });
})();

/* ---------------------------------------------------------------------------
   6) Année du footer
   - Injecte l'année courante dans <span id="year"> si présent
   --------------------------------------------------------------------------- */
(function setFooterYear() {
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
})();

/* ---------------------------------------------------------------------------
   Fin — Ajoute ici d'autres fonctions si nécessaire.
   Astuces :
   - Pour modifier l'API LIVE (Twitch Helix officielle), je peux te fournir
     une version avec Client-ID/Token côté client ou via une micro-fonction.
   - Pour smooth-scroll, tu peux ajouter : html { scroll-behavior: smooth; }
   --------------------------------------------------------------------------- */
