"use strict";
// src/commands/console/console.ts
/// <reference path="./console.layout.ts" />
/// <reference path="./console.style.ts" />
/// <reference path="../../rcs.core.ts" />
var RCSHub;
(function (RCSHub) {
    var Console;
    (function (Console) {
        const buffer = [];
        let hooked = false;
        let currentFilter = "all";
        function now() {
            return new Date().toTimeString().slice(0, 8);
        }
        function renderEntry(entry) {
            const container = document.getElementById("rcs-hub-console-stream");
            if (!container)
                return;
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
            if (!container)
                return;
            container.innerHTML = "";
            buffer.forEach((entry) => {
                if (currentFilter === "all" || currentFilter === entry.level) {
                    renderEntry(entry);
                }
            });
        }
        function hookConsole() {
            if (hooked)
                return;
            hooked = true;
            const origLog = console.log;
            const origInfo = console.info;
            const origWarn = console.warn;
            const origErr = console.error;
            function capture(level, args) {
                const msg = args
                    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
                    .join(" ");
                const entry = { level, msg, ts: now() };
                buffer.push(entry);
                if (buffer.length > 150)
                    buffer.shift();
                renderEntry(entry);
            }
            console.log = function (...args) {
                capture("log", args);
                origLog.apply(console, args);
            };
            console.info = function (...args) {
                capture("info", args);
                origInfo.apply(console, args);
            };
            console.warn = function (...args) {
                capture("warn", args);
                origWarn.apply(console, args);
            };
            console.error = function (...args) {
                capture("error", args);
                origErr.apply(console, args);
            };
        }
        function bindActions() {
            // filtros
            const tab = document.querySelector('[data-rcs-content="console-live"]');
            if (!tab)
                return;
            tab.querySelectorAll("[data-rcs-console-filter]").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const lvl = btn.getAttribute("data-rcs-console-filter");
                    currentFilter = lvl || "all";
                    flushAll();
                });
            });
            const clearBtn = document.getElementById("rcs-hub-console-clear");
            if (clearBtn) {
                clearBtn.addEventListener("click", () => {
                    buffer.length = 0;
                    const container = document.getElementById("rcs-hub-console-stream");
                    if (container)
                        container.innerHTML = "";
                });
            }
        }
        // isso é o que o core vai chamar
        function init() {
            Console.injectStyle();
            Console.renderLayout();
            hookConsole();
            bindActions();
        }
        Console.init = init;
        // registra no core
        RCSHub.registerTabLoader("console-live", init);
    })(Console = RCSHub.Console || (RCSHub.Console = {}));
})(RCSHub || (RCSHub = {}));
