// src/commands/console/console.ts
/// <reference path="./console.layout.ts" />
/// <reference path="./console.style.ts" />
/// <reference path="../../rcs.core.ts" />

namespace RCSHub.Console {
  type ConsoleLevel = "log" | "info" | "warn" | "error";

  const buffer: Array<{ level: ConsoleLevel; msg: string; ts: string }> = [];
  let hooked = false;
  let currentFilter: ConsoleLevel | "all" = "all";

  function now(): string {
    return new Date().toTimeString().slice(0, 8);
  }

  function renderEntry(entry: {
    level: ConsoleLevel;
    msg: string;
    ts: string;
  }) {
    const container = document.getElementById("rcs-hub-console-stream");
    if (!container) return;

    // filtro
    if (currentFilter !== "all" && entry.level !== currentFilter) {
      // mesmo assim guarda no buffer
      return;
    }

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

  function flushAll() {
    const container = document.getElementById("rcs-hub-console-stream");
    if (!container) return;
    container.innerHTML = "";
    buffer.forEach((entry) => {
      if (currentFilter === "all" || currentFilter === entry.level) {
        renderEntry(entry);
      }
    });
  }

  function hookConsole() {
    if (hooked) return;
    hooked = true;

    const origLog = console.log;
    const origInfo = console.info;
    const origWarn = console.warn;
    const origErr = console.error;

    function capture(level: ConsoleLevel, args: any[]) {
      const msg = args
        .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
        .join(" ");
      const entry = { level, msg, ts: now() };
      buffer.push(entry);
      if (buffer.length > 150) buffer.shift();
      renderEntry(entry);
    }

    console.log = function (...args: any[]) {
      capture("log", args);
      origLog.apply(console, args);
    };
    console.info = function (...args: any[]) {
      capture("info", args);
      origInfo.apply(console, args);
    };
    console.warn = function (...args: any[]) {
      capture("warn", args);
      origWarn.apply(console, args);
    };
    console.error = function (...args: any[]) {
      capture("error", args);
      origErr.apply(console, args);
    };
  }

  function bindActions() {
    // filtros
    const tab = document.querySelector<HTMLElement>(
      '[data-rcs-content="console-live"]'
    );
    if (!tab) return;

    tab.querySelectorAll("[data-rcs-console-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lvl = btn.getAttribute("data-rcs-console-filter") as
          | ConsoleLevel
          | "all";
        currentFilter = lvl || "all";
        flushAll();
      });
    });

    const clearBtn = document.getElementById("rcs-hub-console-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        buffer.length = 0;
        const container = document.getElementById("rcs-hub-console-stream");
        if (container) container.innerHTML = "";
      });
    }
  }

  // isso é o que o core vai chamar
  export function init(): void {
    injectStyle();
    renderLayout();
    hookConsole();
    bindActions();
  }

  // registra no core
  RCSHub.registerTabLoader("console-live", init);
}
