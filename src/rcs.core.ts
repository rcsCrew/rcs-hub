/// <reference path="./rcs.layout.ts" />
/// <reference path="./rcs.styles.ts" />

// pra tampermonkey
declare const unsafeWindow: any;

namespace RCSHub {
  /* =====================================
     IDENTIDADE GLOBAL DO HUB
     ===================================== */
  // 👉 SÓ AQUI define ROOT_ID
  export const ROOT_ID = "rcs-hub-root";

  /* =====================================
     CONSOLE GLOBAL (buffer)
     ===================================== */
  export type ConsoleLevel = "log" | "info" | "warn" | "error";

  export interface ConsoleEntry {
    level: ConsoleLevel;
    msg: string;
    ts: string;
  }

  const CONSOLE_MAX = 200;
  const consoleBuffer: ConsoleEntry[] = [];
  let consoleHooked = false;

  export function getConsoleBuffer(): ReadonlyArray<ConsoleEntry> {
    return consoleBuffer;
  }

  export function pushConsoleEntry(entry: ConsoleEntry): void {
    consoleBuffer.push(entry);
    if (consoleBuffer.length > CONSOLE_MAX) {
      consoleBuffer.shift();
    }
  }

  function nowHHMMSS(): string {
    return new Date().toTimeString().slice(0, 8);
  }

  /**
   * tenta aplicar o patch num alvo (obj ou proto)
   */
  function tryPatchMethod(target: any, level: ConsoleLevel): boolean {
    if (!target) return false;
    const orig = target[level];
    if (!orig || typeof orig !== "function") return false;

    try {
      const bound = orig.bind(target);
      target[level] = (...args: any[]) => {
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

        pushConsoleEntry({
          level,
          msg,
          ts: nowHHMMSS(),
        });

        return bound(...args);
      };
      return true;
    } catch (e) {
      // read-only
      return false;
    }
  }

  /**
   * Hook global de console — não quebra se for read-only
   */
  export function hookConsoleGlobal(): void {
    if (consoleHooked) return;
    consoleHooked = true;

    const targets: any[] = [];

    // prioridade: página real
    if (typeof unsafeWindow !== "undefined" && unsafeWindow.console) {
      targets.push(unsafeWindow.console);
    }
    if (typeof window !== "undefined" && window.console) {
      targets.push(window.console);
    }
    // fallback: console do próprio userscript
    targets.push(console);

    const levels: ConsoleLevel[] = ["log", "info", "warn", "error"];

    levels.forEach((level) => {
      let hookedThisLevel = false;

      for (const t of targets) {
        // 1) tenta direto
        if (tryPatchMethod(t, level)) {
          hookedThisLevel = true;
          break;
        }
        // 2) tenta no prototype
        const proto = Object.getPrototypeOf(t);
        if (proto && tryPatchMethod(proto, level)) {
          hookedThisLevel = true;
          break;
        }
      }

      if (!hookedThisLevel) {
        // não deu pra interceptar — mas não vamos quebrar o script
        pushConsoleEntry({
          level: "warn",
          msg: `console.${level} não pôde ser interceptado (provavelmente read-only)`,
          ts: nowHHMMSS(),
        });
      }
    });
  }

  /* =====================================
     LAZY TABS
     ===================================== */
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

  /* =====================================
     HELPER CSS
     ===================================== */
  export function appendStyle(id: string, css: string): void {
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* =====================================
     INIT
     ===================================== */
  export function init(): void {
    // evita duplicar
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

    // layout
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

    // troca de abas
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
        // lazy
        ensureTab(tab);
      });
    });

    // infos
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

    // overview = carregado
    tabLoaded["overview"] = true;

    // 👇 HOOK DO CONSOLE (agora não quebra)
    hookConsoleGlobal();
  }
}
