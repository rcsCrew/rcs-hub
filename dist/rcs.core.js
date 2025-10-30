"use strict";
/// <reference path="./rcs.layout.ts" />
/// <reference path="./rcs.styles.ts" />
var RCSHub;
(function (RCSHub) {
    /* =====================================
       IDENTIDADE GLOBAL DO HUB
       ===================================== */
    // 👉 SÓ AQUI define ROOT_ID
    RCSHub.ROOT_ID = "rcs-hub-root";
    const CONSOLE_MAX = 200;
    const consoleBuffer = [];
    let consoleHooked = false;
    function getConsoleBuffer() {
        return consoleBuffer;
    }
    RCSHub.getConsoleBuffer = getConsoleBuffer;
    function pushConsoleEntry(entry) {
        consoleBuffer.push(entry);
        if (consoleBuffer.length > CONSOLE_MAX) {
            consoleBuffer.shift();
        }
    }
    RCSHub.pushConsoleEntry = pushConsoleEntry;
    function nowHHMMSS() {
        return new Date().toTimeString().slice(0, 8);
    }
    /**
     * tenta aplicar o patch num alvo (obj ou proto)
     */
    function tryPatchMethod(target, level) {
        if (!target)
            return false;
        const orig = target[level];
        if (!orig || typeof orig !== "function")
            return false;
        try {
            const bound = orig.bind(target);
            target[level] = (...args) => {
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
                pushConsoleEntry({
                    level,
                    msg,
                    ts: nowHHMMSS(),
                });
                return bound(...args);
            };
            return true;
        }
        catch (e) {
            // read-only
            return false;
        }
    }
    /**
     * Hook global de console — não quebra se for read-only
     */
    function hookConsoleGlobal() {
        if (consoleHooked)
            return;
        consoleHooked = true;
        const targets = [];
        // prioridade: página real
        if (typeof unsafeWindow !== "undefined" && unsafeWindow.console) {
            targets.push(unsafeWindow.console);
        }
        if (typeof window !== "undefined" && window.console) {
            targets.push(window.console);
        }
        // fallback: console do próprio userscript
        targets.push(console);
        const levels = ["log", "info", "warn", "error"];
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
    RCSHub.hookConsoleGlobal = hookConsoleGlobal;
    /* =====================================
       LAZY TABS
       ===================================== */
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
    /* =====================================
       HELPER CSS
       ===================================== */
    function appendStyle(id, css) {
        if (document.getElementById(id))
            return;
        const style = document.createElement("style");
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
    }
    RCSHub.appendStyle = appendStyle;
    /* =====================================
       INIT
       ===================================== */
    function init() {
        // evita duplicar
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
        // layout
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
        // monitor padrão
        const logbox = root.querySelector("#rcs-hub-logbox");
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
    RCSHub.init = init;
})(RCSHub || (RCSHub = {}));
