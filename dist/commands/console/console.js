"use strict";
/// <reference path="./console.layout.ts" />
/// <reference path="./console.style.ts" />
/// <reference path="../../rcs.core.ts" />
var RCSHub;
(function (RCSHub) {
    var Console;
    (function (Console) {
        let currentFilter = "all";
        function renderFromBuffer() {
            const container = document.getElementById("rcs-hub-console-stream");
            if (!container)
                return;
            container.innerHTML = "";
            const buffer = RCSHub.getConsoleBuffer();
            buffer.forEach((entry) => {
                if (currentFilter !== "all" && entry.level !== currentFilter)
                    return;
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
        function bindActions() {
            const tab = document.querySelector('[data-rcs-content="console-live"]');
            if (!tab)
                return;
            tab.querySelectorAll("[data-rcs-console-filter]").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const lvl = btn.getAttribute("data-rcs-console-filter");
                    currentFilter = lvl || "all";
                    renderFromBuffer();
                });
            });
            const clearBtn = document.getElementById("rcs-hub-console-clear");
            if (clearBtn) {
                clearBtn.addEventListener("click", () => {
                    // limpa só a view; se quiser zerar o buffer global, criaremos depois
                    const container = document.getElementById("rcs-hub-console-stream");
                    if (container)
                        container.innerHTML = "";
                });
            }
        }
        function init() {
            Console.injectStyle();
            Console.renderLayout();
            renderFromBuffer();
            bindActions();
        }
        Console.init = init;
        // registra no core pra ser lazy
        RCSHub.registerTabLoader("console-live", init);
    })(Console = RCSHub.Console || (RCSHub.Console = {}));
})(RCSHub || (RCSHub = {}));
