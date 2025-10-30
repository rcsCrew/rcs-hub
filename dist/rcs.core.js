"use strict";
// src/rcs.core.ts
var RCSHub;
(function (RCSHub) {
    const consoleBuffer = [];
    let consoleHooked = false;
    function now() {
        return new Date().toTimeString().slice(0, 8);
    }
    /** devolve o buffer pra qualquer comando usar */
    function getConsoleBuffer() {
        return consoleBuffer;
    }
    RCSHub.getConsoleBuffer = getConsoleBuffer;
    /** hook global: roda assim que o core for carregado */
    function hookConsoleGlobal() {
        if (consoleHooked)
            return;
        consoleHooked = true;
        const origLog = console.log;
        const origInfo = console.info;
        const origWarn = console.warn;
        const origErr = console.error;
        function capture(level, args) {
            const msg = args
                .map((a) => {
                if (typeof a === "string")
                    return a;
                try {
                    return JSON.stringify(a);
                }
                catch {
                    return String(a);
                }
            })
                .join(" ");
            const entry = {
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
        console.log = (...args) => {
            capture("log", args);
            return origLog.apply(console, args);
        };
        console.info = (...args) => {
            capture("info", args);
            return origInfo.apply(console, args);
        };
        console.warn = (...args) => {
            capture("warn", args);
            return origWarn.apply(console, args);
        };
        console.error = (...args) => {
            capture("error", args);
            return origErr.apply(console, args);
        };
        // marca no próprio console
        origInfo.call(console, "[RCS HUB] console hook global ativo");
    }
    RCSHub.hookConsoleGlobal = hookConsoleGlobal;
    // ===== registry de abas lazy =====
    const tabLoaders = {};
    const tabLoaded = {};
    function registerTabLoader(tabId, loader) {
        tabLoaders[tabId] = loader;
    }
    RCSHub.registerTabLoader = registerTabLoader;
    function ensureTab(tabId) {
        if (tabLoaded[tabId])
            return;
        const loader = tabLoaders[tabId];
        if (!loader)
            return;
        loader();
        tabLoaded[tabId] = true;
    }
    function appendStyle(styleId, css) {
        if (document.getElementById(styleId))
            return;
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }
    RCSHub.appendStyle = appendStyle;
    /** init do HUB */
    function init() {
        // 1) HOOKA CONSOLE LOGO DE CARA
        hookConsoleGlobal();
        // 2) evita duplicar layout
        if (document.getElementById(RCSHub.ROOT_ID))
            return;
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
        root.id = RCSHub.ROOT_ID;
        root.innerHTML = RCSHub.getLayoutHTML();
        document.body.appendChild(root);
        const panel = root.querySelector(".rcs-hub__panel");
        const fab = root.querySelector(".rcs-hub__fab");
        const closeBtn = root.querySelector(".rcs-hub__close");
        const menuBtns = root.querySelectorAll(".rcs-hub__item");
        const tabs = root.querySelectorAll(".rcs-hub__tab");
        function togglePanel(show) {
            if (!panel)
                return;
            if (show === true)
                panel.classList.remove("rcs-hub--hidden");
            else if (show === false)
                panel.classList.add("rcs-hub--hidden");
            else
                panel.classList.toggle("rcs-hub--hidden");
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
        const hostEl = root.querySelector("#rcs-hub-host");
        const hostSmEl = root.querySelector("#rcs-hub-host-sm");
        const urlEl = root.querySelector("#rcs-hub-url");
        const tsEl = root.querySelector("#rcs-hub-ts");
        if (hostEl)
            hostEl.textContent = location.hostname;
        if (hostSmEl)
            hostSmEl.textContent = location.hostname;
        if (urlEl)
            urlEl.textContent = location.pathname || "/";
        if (tsEl)
            tsEl.textContent = new Date().toLocaleTimeString();
        // uptime
        const uptimeEl = root.querySelector("#rcs-hub-uptime");
        const start = Date.now();
        setInterval(() => {
            const diff = Math.floor((Date.now() - start) / 1000);
            const m = String(Math.floor(diff / 60)).padStart(2, "0");
            const s = String(diff % 60).padStart(2, "0");
            if (uptimeEl)
                uptimeEl.textContent = `${m}:${s}`;
        }, 1000);
        // overview marcado como carregado
        tabLoaded["overview"] = true;
        // log no monitor padrão
        const logbox = root.querySelector("#rcs-hub-logbox");
        if (logbox) {
            const p = document.createElement("p");
            p.textContent = `[${now()}] script rodando em ${location.hostname}`;
            logbox.appendChild(p);
        }
    }
    RCSHub.init = init;
})(RCSHub || (RCSHub = {}));
