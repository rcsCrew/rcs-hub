/// <reference path="./console.layout.ts" />
/// <reference path="./console.style.ts" />
/// <reference path="../../rcs.core.ts" />

namespace RCSHub.Console {
  let currentFilter: RCSHub.ConsoleLevel | "all" = "all";

  function renderFromBuffer(): void {
    const container = document.getElementById("rcs-hub-console-stream");
    if (!container) return;

    container.innerHTML = "";

    const buffer = RCSHub.getConsoleBuffer();
    buffer.forEach((entry) => {
      if (currentFilter !== "all" && entry.level !== currentFilter) return;

      const row = document.createElement("div");
      row.className = `rcs-hub__console-line rcs-hub__console-line--${entry.level}`;
      row.innerHTML = `
        <span class="rcs-hub__console-ts">${entry.ts}</span>
        <span class="rcs-hub__console-level">${entry.level}</span>
        <span class="rcs-hub__console-msg">${entry.msg}</span>
      `;
      container.appendChild(row);
    });

    container.scrollTop = container.scrollHeight;
  }

  function bindActions(): void {
    const tab = document.querySelector<HTMLElement>(
      '[data-rcs-content="console-live"]'
    );
    if (!tab) return;

    tab.querySelectorAll("[data-rcs-console-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lvl = btn.getAttribute("data-rcs-console-filter") as
          | RCSHub.ConsoleLevel
          | "all";
        currentFilter = lvl || "all";
        renderFromBuffer();
      });
    });

    const clearBtn = document.getElementById("rcs-hub-console-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        // limpa só a view; se quiser zerar o buffer global, criaremos depois
        const container = document.getElementById("rcs-hub-console-stream");
        if (container) container.innerHTML = "";
      });
    }
  }

  export function init(): void {
    injectStyle();
    renderLayout();
    renderFromBuffer();
    bindActions();
  }

  // registra no core pra ser lazy
  RCSHub.registerTabLoader("console-live", init);
}
