// src/rcs.core.ts
namespace RCSHub {
  // ===== console global =====
  export type ConsoleLevel = "log" | "info" | "warn" | "error";

  export interface ConsoleEntry {
    level: ConsoleLevel;
    msg: string;
    ts: string;
  }

  const consoleBuffer: ConsoleEntry[] = [];
  let consoleHooked = false;

  function now(): string {
    return new Date().toTimeString().slice(0, 8);
  }

  /** devolve o buffer pra qualquer comando usar */
  export function getConsoleBuffer(): ConsoleEntry[] {
    return consoleBuffer;
  }

  /** hook global: roda assim que o core for carregado */
  export function hookConsoleGlobal(): void {
    if (consoleHooked) return;
    consoleHooked = true;

    const origLog = console.log;
    const origInfo = console.info;
    const origWarn = console.warn;
    const origErr = console.error;

    function capture(level: ConsoleLevel, args: any[]) {
      const msg = args
        .map((a) => {
          if (typeof a === "string") return a;
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(" ");

      const entry: ConsoleEntry = {
        level,
        msg,
        ts: now(),
      };

      consoleBuffer.push(entry);
      if (consoleBuffer.length > 250) {
        consoleBuffer.shift();
      }

      // se a tela de console já estiver montada, tenta renderizar direto
      const container = document.getElementById("rcs-hub-console-stream");
      if (container) {
        const row = document.createElement("div");
        row.className = `rcs-hub__console-line rcs-hub__console-line--${entry.level}`;
        row.innerHTML = `
          <span class="rcs-hub__console-ts">${entry.ts}</span>
          <span class="rcs-hub__console-level">${entry.level}</span>
          <span class="rcs-hub__console-msg">${entry.msg}</span>
        `;
        container.appendChild(row);
        container.scrollTop = container.scrollHeight;
      }
    }

    console.log = (...args: any[]) => {
      capture("log", args);
      return origLog.apply(console, args);
    };
    console.info = (...args: any[]) => {
      capture("info", args);
      return origInfo.apply(console, args);
    };
    console.warn = (...args: any[]) => {
      capture("warn", args);
      return origWarn.apply(console, args);
    };
    console.error = (...args: any[]) => {
      capture("error", args);
      return origErr.apply(console, args);
    };

    // marca no próprio console
    origInfo.call(console, "[RCS HUB] console hook global ativo");
  }

  // ===== registry de abas lazy =====
  const tabLoaders: Record<string, () => void> = {};
  const tabLoaded: Record<string, boolean> = {};

  export function registerTabLoader(tabId: string, loader: () => void): void {
    tabLoaders[tabId] = loader;
  }

  function ensureTab(tabId: string): void {
    if (tabLoaded[tabId]) return;
    const loader = tabLoaders[tabId];
    if (!loader) return;
    loader();
    tabLoaded[tabId] = true;
  }

  export function appendStyle(styleId: string, css: string): void {
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /** init do HUB */
  export function init(): void {
    // 1) HOOKA CONSOLE LOGO DE CARA
    hookConsoleGlobal();

    // 2) evita duplicar layout
    if (document.getElementById(ROOT_ID)) return;

    // fonte
    const interLink = document.createElement("link");
    interLink.rel = "stylesheet";
    interLink.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(interLink);

    // css base
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
        menuBtns.forEach((b) => b.classList.remove("rcs-hub__item--active"));
        btn.classList.add("rcs-hub__item--active");
        tabs.forEach((sec) => {
          const active = sec.getAttribute("data-rcs-content") === tab;
          sec.classList.toggle("rcs-hub__tab--active", active);
        });
        // carrega se for lazy
        ensureTab(tab);
      });
    });

    // infos básicas
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

    // overview marcado como carregado
    tabLoaded["overview"] = true;

    // log no monitor padrão
    const logbox = root.querySelector("#rcs-hub-logbox") as HTMLElement | null;
    if (logbox) {
      const p = document.createElement("p");
      p.textContent = `[${now()}] script rodando em ${location.hostname}`;
      logbox.appendChild(p);
    }
  }
}
