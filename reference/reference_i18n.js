(function () {
  const SUPPORTED = ["en", "de", "fr", "nl"];
  const STORAGE_KEY = "mise-site-lang";

  const SCREEN_FILES = {
    planOverview: "plan-overview.png",
    preferencesVibes: "preferences-vibes.png",
    exploreByCuisine: "explore-by-cuisine.png",
    recipeDetail: "recipe-detail.png",
    preferencesSetup: "preferences-setup.png",
    spaghetti: "spaghetti-bolognese-recipe-detail.png",
  };

  function getQueryLang() {
    const param = new URLSearchParams(window.location.search).get("lang");
    return param && SUPPORTED.includes(param) ? param : null;
  }

  function detectLang() {
    return (
      getQueryLang()
      || localStorage.getItem(STORAGE_KEY)
      || (SUPPORTED.includes(navigator.language.slice(0, 2))
        ? navigator.language.slice(0, 2)
        : "en")
    );
  }

  function get(obj, path) {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
  }

  function interpolate(text, regional) {
    if (!text || typeof text !== "string") return text;
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => regional?.[key] ?? "");
  }

  function applyText(root, copy) {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      let value = get(copy, key);
      if (value == null) return;
      value = interpolate(value, copy.regional);
      el.textContent = value;
    });

    root.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      let value = get(copy, key);
      if (value == null) return;
      value = interpolate(value, copy.regional);
      el.innerHTML = value;
    });

    root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      let value = get(copy, key);
      if (value == null) return;
      el.setAttribute("aria-label", interpolate(value, copy.regional));
    });

    root.querySelectorAll("[data-i18n-quote]").forEach((el) => {
      const key = el.getAttribute("data-i18n-quote");
      let value = get(copy, key);
      if (value == null) return;
      el.textContent = `"${interpolate(value, copy.regional)}"`;
    });
  }

  function screenSrc(locale, file) {
    return `assets/screens/${locale}/${file}`;
  }

  function applyScreens(locale) {
    document.querySelectorAll("[data-screen]").forEach((img) => {
      const key = img.getAttribute("data-screen");
      const file = SCREEN_FILES[key];
      if (!file) return;
      img.src = screenSrc(locale, file);
      img.onerror = function onScreenError() {
        if (locale !== "en") {
          img.onerror = null;
          img.src = screenSrc("en", file);
        }
      };
    });
  }

  function applyMarquee(copy) {
    const track = document.getElementById("marqueeTrack");
    if (!track || !copy.regional?.marqueeStores) return;
    const stores = copy.regional.marqueeStores;
    const doubled = [...stores, ...stores];
    track.innerHTML = doubled.map((s) => `<span>${s}</span>`).join("");
  }

  function applyMeta(copy) {
    if (copy.meta?.title) document.title = copy.meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && copy.meta?.description) desc.setAttribute("content", copy.meta.description);
    document.documentElement.lang = copy.lang || "en";
  }

  function applyRegional(copy) {
    const saving = document.getElementById("statSaving");
    if (saving && copy.regional?.statSaving) saving.textContent = copy.regional.statSaving;

    const trust = document.getElementById("heroTrustCopy");
    if (trust && copy.regional?.heroTrust) trust.textContent = copy.regional.heroTrust;

    const budgetChip = document.getElementById("chipBudgetEmoji");
    if (budgetChip && copy.regional?.chipBudgetEmoji) {
      budgetChip.textContent = copy.regional.chipBudgetEmoji;
    }
  }

  function switchLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    sessionStorage.setItem("mise-scroll-top", "1");

    const url = new URL(window.location.href);
    url.hash = "";
    if (lang === "en") url.searchParams.delete("lang");
    else url.searchParams.set("lang", lang);

    const qs = url.searchParams.toString();
    window.location.replace(url.pathname + (qs ? `?${qs}` : ""));
  }

  function buildLangMenu(current) {
    const menu = document.getElementById("langMenu");
    const btn = document.getElementById("langBtn");
    if (!menu || !btn) return;

    const labels = { en: "English", de: "Deutsch", fr: "Français", nl: "Nederlands" };
    const flags = { en: "🇺🇸", de: "🇩🇪", fr: "🇫🇷", nl: "🇳🇱" };

    btn.innerHTML = `${flags[current] || "🌐"} <span>${labels[current] || current.toUpperCase()}</span>`;

    menu.innerHTML = SUPPORTED.map(
      (code) => `<button type="button" class="lang-menu__item${code === current ? " is-active" : ""}" data-lang="${code}">${flags[code]} ${labels[code]}</button>`,
    ).join("");

    menu.querySelectorAll("[data-lang]").forEach((item) => {
      item.addEventListener("click", () => {
        if (item.dataset.lang === current) return;
        switchLang(item.dataset.lang);
      });
    });
  }

  async function loadCopy(lang) {
    const res = await fetch(`locales/${lang}.json`);
    if (!res.ok) throw new Error(`locale ${lang} missing`);
    return res.json();
  }

  async function initI18n() {
    const lang = detectLang();
    if (!SUPPORTED.includes(lang)) return;

    let copy;
    try {
      copy = await loadCopy(lang);
    } catch {
      copy = await loadCopy("en");
    }

    applyMeta(copy);
    applyText(document, copy);
    applyRegional(copy);
    applyMarquee(copy);
    applyScreens(lang);
    buildLangMenu(lang);

    const btn = document.getElementById("langBtn");
    const menu = document.getElementById("langMenu");
    if (btn && menu) {
      btn.addEventListener("click", () => {
        const open = menu.classList.toggle("open");
        btn.setAttribute("aria-expanded", String(open));
      });
      document.addEventListener("click", (e) => {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
          menu.classList.remove("open");
          btn.setAttribute("aria-expanded", "false");
        }
      });
    }

    window.miseSiteLocale = lang;

    if (sessionStorage.getItem("mise-scroll-top")) {
      sessionStorage.removeItem("mise-scroll-top");
      window.scrollTo(0, 0);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void initI18n());
  } else {
    void initI18n();
  }
})();
