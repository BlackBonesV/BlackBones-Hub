// ===== Thème =====
const root = document.body;
const btnTheme = document.getElementById('btnTheme');
const yearSpan = document.getElementById('year');
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  root.classList.remove('theme-dark');
  root.classList.add('theme-light');
}
function toggleTheme(){
  const light = root.classList.toggle('theme-light');
  root.classList.toggle('theme-dark', !light);
  localStorage.setItem('theme', light ? 'light' : 'dark');
  btnTheme.textContent = light ? '☀️' : '🌙';
}
if (btnTheme){
  btnTheme.addEventListener('click', toggleTheme);
  btnTheme.textContent = root.classList.contains('theme-light') ? '☀️' : '🌙';
}
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// ===== Menu mobile =====
const btnMenu = document.getElementById('btnMenu');
const mainNav = document.getElementById('mainNav');
if (btnMenu && mainNav){
  btnMenu.addEventListener('click', () => {
    const opened = mainNav.classList.toggle('open');
    btnMenu.setAttribute('aria-expanded', opened ? 'true' : 'false');
  });
}

// ===== Sous-menu =====
document.querySelectorAll('.has-submenu').forEach(item => {
  const trigger = item.querySelector('.submenu-trigger');
  trigger.addEventListener('click', () => {
    const opened = item.classList.toggle('open');
    trigger.setAttribute('aria-expanded', opened ? 'true' : 'false');
  });
});

// ===== Lightbox galerie =====
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCaption = document.getElementById('lbCaption');
const lbClose = document.getElementById('lbClose');
function openLightbox(src, alt){
  lbImg.src = src; lbImg.alt = alt || '';
  lbCaption.textContent = alt || '';
  lb.classList.add('open'); lb.setAttribute('aria-hidden','false');
}
function closeLightbox(){
  lb.classList.remove('open'); lb.setAttribute('aria-hidden','true');
  lbImg.src = ''; lbCaption.textContent = '';
}
document.querySelectorAll('.gallery-item').forEach(img=>{
  img.addEventListener('click', ()=> openLightbox(img.src, img.alt));
});
lbClose.addEventListener('click', closeLightbox);
lb.addEventListener('click', (e)=>{ if(e.target===lb) closeLightbox(); });

// ===== Twitch parent auto =====
(function () {
  const channel = "BlackBonesV2"; // ← remplace par ton vrai channel
  const parent = location.hostname; // localhost en local, github.io en prod
  const player = document.getElementById("twitchPlayer");
  if (player) {
    player.src = `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(parent)}`;
  }
})();
