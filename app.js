/* ================================================================
   مدونتي — منطق التطبيق
   ================================================================ */

const state = {
  lang: "ar",
  category: "all",
  posts: [],
  view: "home", // home | article
  currentArticle: null,
};

const $ = (s) => document.querySelector(s);

const TEXTS = {
  ar: {
    loading: "جارٍ تحميل المقالات…",
    empty: "لا توجد مقالات في هذا القسم",
    emptyHint: "جرّب قسماً آخر أو غيّر اللغة",
    home: "الرئيسية",
    readMore: "اقرأ المزيد ←",
    back: "→ رجوع",
    articles: "مقالة",
    title: "أحدث المقالات",
    categories: { all: "الكل", tech: "تقنية", cars: "سيارات", life: "حياة" },
  },
  en: {
    loading: "Loading articles…",
    empty: "No articles in this category",
    emptyHint: "Try another category or change language",
    home: "Home",
    readMore: "Read more →",
    back: "← Back",
    articles: "articles",
    title: "Latest Articles",
    categories: { all: "All", tech: "Tech", cars: "Cars", life: "Life" },
  },
  fr: {
    loading: "Chargement des articles…",
    empty: "Aucun article dans cette catégorie",
    emptyHint: "Essayez une autre catégorie ou changez de langue",
    home: "Accueil",
    readMore: "Lire la suite →",
    back: "← Retour",
    articles: "articles",
    title: "Derniers articles",
    categories: { all: "Tout", tech: "Tech", cars: "Voitures", life: "Vie" },
  },
};

/* ===== تحميل المقالات ===== */
async function loadPosts() {
  try {
    const res = await fetch("posts.json?t=" + Date.now());
    const data = await res.json();
    state.posts = data.posts || [];
    return state.posts;
  } catch (err) {
    console.error("فشل تحميل المقالات:", err);
    return [];
  }
}

/* ===== تصفية المقالات ===== */
function getFilteredPosts() {
  return state.posts.filter(p => {
    const matchLang = p.lang === state.lang;
    const matchCat = state.category === "all" || p.category === state.category;
    return matchLang && matchCat;
  });
}

/* ===== تنسيق التاريخ ===== */
function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    const locales = { ar: "ar-EG", en: "en-US", fr: "fr-FR" };
    return d.toLocaleDateString(locales[state.lang] || "en-US", {
      year: "numeric", month: "long", day: "numeric"
    });
  } catch { return dateStr; }
}

/* ===== رسم الصفحة الرئيسية ===== */
function renderHome() {
  const t = TEXTS[state.lang];
  const posts = getFilteredPosts();
  const main = $("#content");

  main.innerHTML = `
    <div class="section-head">
      <h2>${t.title}</h2>
      <span class="count">${posts.length} ${t.articles}</span>
    </div>
    <div class="articles-grid" id="grid"></div>
  `;

  const grid = $("#grid");

  if (!posts.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="emoji">📝</div>
        <h3>${t.empty}</h3>
        <p>${t.emptyHint}</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = posts.map(p => `
    <article class="article-card" data-id="${p.id}">
      <div class="article-image">
        <img src="${p.image}" alt="${escapeHTML(p.title)}" loading="lazy"
             onerror="this.style.display='none'">
      </div>
      <div class="article-body">
        <div class="article-meta">
          <span class="article-category">${t.categories[p.category] || p.category}</span>
          <span>${formatDate(p.date)}</span>
        </div>
        <h3 class="article-title">${escapeHTML(p.title)}</h3>
        <p class="article-excerpt">${escapeHTML(p.excerpt)}</p>
        <div class="article-footer">
          <span>✍️ ${escapeHTML(p.author)}</span>
          <span class="read-more">${t.readMore}</span>
        </div>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll(".article-card").forEach(card => {
    card.addEventListener("click", () => openArticle(parseInt(card.dataset.id, 10)));
  });
}

/* ===== فتح مقال ===== */
function openArticle(id) {
  const post = state.posts.find(p => p.id === id && p.lang === state.lang);
  if (!post) return;

  state.view = "article";
  state.currentArticle = post;
  const t = TEXTS[state.lang];
  const main = $("#content");

  document.title = post.title + " — مدونتي";

  main.innerHTML = `
    <div class="article-single">
      <a href="#" class="back-link" id="back-link">${t.back}</a>
      <h1>${escapeHTML(post.title)}</h1>
      <div class="meta">
        <span>✍️ ${escapeHTML(post.author)}</span>
        <span>📅 ${formatDate(post.date)}</span>
        <span class="article-category">${t.categories[post.category] || post.category}</span>
      </div>
      <div class="featured">
        <img src="${post.image}" alt="" onerror="this.parentElement.style.display='none'">
      </div>
      <div class="content">${post.content}</div>
    </div>
  `;

  $("#back-link").addEventListener("click", (e) => {
    e.preventDefault();
    state.view = "home";
    renderHome();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ===== أداة escape ===== */
function escapeHTML(str) {
  return String(str ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

/* ===== تبديل اللغة ===== */
function setLang(lang) {
  state.lang = lang;
  state.view = "home";
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === "ar") ? "rtl" : "ltr";
  document.querySelectorAll(".lang-switcher a").forEach(a => {
    a.classList.toggle("active", a.dataset.lang === lang);
  });
  localStorage.setItem("blog:lang", lang);
  renderHome();
}

/* ===== تبديل الفئة ===== */
function setCategory(cat) {
  state.category = cat;
  document.querySelectorAll(".main-nav a").forEach(a => {
    a.classList.toggle("active", a.dataset.cat === cat);
  });
  if (state.view !== "home") state.view = "home";
  renderHome();
}

/* ===== الوضع الليلي ===== */
function setupTheme() {
  const btn = $("#theme-btn");
  const saved = localStorage.getItem("blog:theme");
  if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
    btn.textContent = "☀️";
  }
  btn.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    const isDark = document.documentElement.classList.contains("dark");
    btn.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("blog:theme", isDark ? "dark" : "light");
  });
}

/* ===== Back to top ===== */
function setupBackToTop() {
  const btn = $("#back-to-top");
  window.addEventListener("scroll", () => {
    btn.classList.toggle("show", window.scrollY > 400);
  });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ===== الإعداد ===== */
async function init() {
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  setupTheme();
  setupBackToTop();

  // اللغة المحفوظة
  const savedLang = localStorage.getItem("blog:lang") || "ar";
  state.lang = savedLang;
  document.documentElement.lang = savedLang;
  document.documentElement.dir = (savedLang === "ar") ? "rtl" : "ltr";
  document.querySelectorAll(".lang-switcher a").forEach(a => {
    a.classList.toggle("active", a.dataset.lang === savedLang);
  });

  // مستمعو الأحداث
  document.querySelectorAll(".lang-switcher a").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      setLang(a.dataset.lang);
    });
  });

  document.querySelectorAll(".main-nav a").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      setCategory(a.dataset.cat);
    });
  });

  // تحميل المقالات
  await loadPosts();
  renderHome();
}

document.addEventListener("DOMContentLoaded", init);
window.goHome = (e) => { e.preventDefault(); state.view = "home"; renderHome(); };