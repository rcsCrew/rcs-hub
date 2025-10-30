"use strict";
/// <reference path="./rcs.layout.ts" />
/// <reference path="./rcs.styles.ts" />
var RCSHub;
(function (RCSHub) {
    // registry de abas lazy
    const tabLoaders = {};
    const tabLoaded = {};
    // registrar loader de aba
    function registerTabLoader(tabId, loader) {
        tabLoaders[tabId] = loader;
    }
    RCSHub.registerTabLoader = registerTabLoader;
    // carregar (se ainda não carregou)
    function ensureTab(tabId) {
        if (tabLoaded[tabId])
            return;
        const loader = tabLoaders[tabId];
        if (!loader)
            return;
        loader();
        tabLoaded[tabId] = true;
    }
    // util pra injetar css de comandos
    function appendStyle(styleId, css) {
        if (document.getElementById(styleId))
            return;
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }
    RCSHub.appendStyle = appendStyle;
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
        // css base do hub
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
        // overview pode ser marcado como "carregado"
        tabLoaded["overview"] = true;
    }
    RCSHub.init = init;
})(RCSHub || (RCSHub = {}));
