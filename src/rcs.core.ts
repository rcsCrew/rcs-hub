/// <reference path="./rcs.layout.ts" />
/// <reference path="./rcs.styles.ts" />

namespace RCSHub {
  // registry de abas lazy
  const tabLoaders: Record<string, () => void> = {};
  const tabLoaded: Record<string, boolean> = {};

  // registrar loader de aba
  export function registerTabLoader(tabId: string, loader: () => void): void {
    tabLoaders[tabId] = loader;
  }

  // carregar (se ainda não carregou)
  function ensureTab(tabId: string): void {
    if (tabLoaded[tabId]) return;
    const loader = tabLoaders[tabId];
    if (!loader) return;
    loader();
    tabLoaded[tabId] = true;
  }

  // util pra injetar css de comandos
  export function appendStyle(styleId: string, css: string): void {
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  export function init(): void {
    // evita duplicar
    if (document.getElementById(ROOT_ID)) return;

    // fonte
    const interLink = document.createElement("link");
    interLink.rel = "stylesheet";
    interLink.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(interLink);

    // css base do hub
    const baseStyle = document.createElement("style");
    baseStyle.textContent = RCSHub.hubCSS;
    document.head.appendChild(baseStyle);

    // layout base
    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.innerHTML = getLayoutHTML();
    document.body.appendChild(root);

    const panel = root.querySelector(".rcs-hub__panel") as HTMLElement | null;
    const fab = root.querySelector(".rcs-hub__fab") as HTMLButtonElement | null;
    const closeBtn = root.querySelector(
      ".rcs-hub__close"
    ) as HTMLButtonElement | null;
    const menuBtns = root.querySelectorAll(".rcs-hub__item");
    const tabs = root.querySelectorAll(".rcs-hub__tab");

    function togglePanel(show?: boolean) {
      if (!panel) return;
      if (show === true) panel.classList.remove("rcs-hub--hidden");
      else if (show === false) panel.classList.add("rcs-hub--hidden");
      else panel.classList.toggle("rcs-hub--hidden");
    }

    fab?.addEventListener("click", () => togglePanel());
    closeBtn?.addEventListener("click", () => togglePanel(false));

    // troca de abas + lazy
    menuBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-rcs-tab") || "";
        // ativa botão
        menuBtns.forEach((b) => b.classList.remove("rcs-hub__item--active"));
        btn.classList.add("rcs-hub__item--active");
        // ativa section
        tabs.forEach((sec) => {
          const active = sec.getAttribute("data-rcs-content") === tab;
          sec.classList.toggle("rcs-hub__tab--active", active);
        });
        // carrega se for lazy
        ensureTab(tab);
      });
    });

    // preencher infos
    const hostEl = root.querySelector("#rcs-hub-host") as HTMLElement | null;
    const hostSmEl = root.querySelector(
      "#rcs-hub-host-sm"
    ) as HTMLElement | null;
    const urlEl = root.querySelector("#rcs-hub-url") as HTMLElement | null;
    const tsEl = root.querySelector("#rcs-hub-ts") as HTMLElement | null;

    if (hostEl) hostEl.textContent = location.hostname;
    if (hostSmEl) hostSmEl.textContent = location.hostname;
    if (urlEl) urlEl.textContent = location.pathname || "/";
    if (tsEl) tsEl.textContent = new Date().toLocaleTimeString();

    // uptime
    const uptimeEl = root.querySelector(
      "#rcs-hub-uptime"
    ) as HTMLElement | null;
    const start = Date.now();
    setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const m = String(Math.floor(diff / 60)).padStart(2, "0");
      const s = String(diff % 60).padStart(2, "0");
      if (uptimeEl) uptimeEl.textContent = `${m}:${s}`;
    }, 1000);

    // monitor padrão
    const logbox = root.querySelector("#rcs-hub-logbox") as HTMLElement | null;
    if (logbox) {
      const p = document.createElement("p");
      p.textContent = `[${new Date()
        .toTimeString()
        .slice(0, 8)}] script rodando em ${location.hostname}`;
      logbox.appendChild(p);
    }

    // overview pode ser marcado como "carregado"
    tabLoaded["overview"] = true;
  }
}
