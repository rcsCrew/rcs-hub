// src/rcs/core.js
(function (GM_xmlhttpRequest, GM_addStyle, GITHUB_BASE) {
  ("use strict");

  const MANIFEST_URL = `${GITHUB_BASE}/rcs/manifest.json`;
  const SYNC_INTERVAL = 1000 * 60 * 3; // 3 min
  const START_TS = Date.now();

  // namespace
  const RCSHub = (window.RCSHub = window.RCSHub || {
    version: "0.3.5",
    commands: new Map(),
    manifest: null,
    ui: {},
    debug: true,
    log: function () {
      if (this.debug) console.log("[RCS-HUB]", ...arguments);
    },
    registerCommand: function (def) {
      if (!def || !def.id) return;
      this.commands.set(def.id, def);
      this.ui.refreshNav && this.ui.refreshNav();
    },
    injectCSS: function (css) {
      const el = document.createElement("style");
      el.textContent = css;
      document.head.appendChild(el);
    },
  });

  // =============== ESTILO ===============
  GM_addStyle(`
    :root {
      --rcs-bg: #0b0e11;
      --rcs-panel: rgba(9,11,13,0.9);
      --rcs-surface: rgba(12,15,18,0.8);
      --rcs-text: #e2e8f0;
      --rcs-muted: rgba(148,163,184,.55);
      --rcs-green: #4ade80;
      --rcs-purple: #a855f7;
      --rcs-border: rgba(255,255,255,0.03);
      --rcs-z: 2147483000;
      font-family: Inter, system-ui, sans-serif;
    }
    .rcs-hub-fab {
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 52px;
      height: 52px;
      background: radial-gradient(circle at 30% 30%, #0f172a, #020617);
      border: 1px solid rgba(255, 255, 255, .14);
      border-radius: 9999px;
      box-shadow: 0 12px 25px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      cursor: pointer;
      z-index: var(--rcs-z);
      backdrop-filter: blur(18px);
      user-select: none;
    }
    .rcs-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.45);
      z-index: calc(var(--rcs-z) + 1);
      display: none;
      align-items: center;
      justify-content: center;
    }
    .rcs-shell {
      width: 1100px;
      height: 600px;
      background: radial-gradient(circle at 20% 20%, rgba(12,14,16,1) 0%, rgba(8,9,11,0.9) 40%, rgba(5,5,7,0.75) 100%);
      border: 1px solid rgba(163, 166, 173, 0.12);
      border-radius: 20px;
      overflow: hidden;
      display: grid;
      grid-template-columns: 215px 1fr 230px;
      box-shadow: 0 24px 50px rgba(0,0,0,.45);
      backdrop-filter: blur(18px);
      color: var(--rcs-text);
      position: relative;
      transition: grid-template-columns .14s ease, width .14s ease;
    }
    /* quando colapsar esquerda */
    .rcs-shell.rcs-nav-collapsed {
      grid-template-columns: 46px 1fr 230px;
    }
    /* quando colapsar direita */
    .rcs-shell.rcs-side-collapsed {
      grid-template-columns: 215px 1fr 32px;
    }
    /* quando colapsar as duas */
    .rcs-shell.rcs-nav-collapsed.rcs-side-collapsed {
      grid-template-columns: 46px 1fr 32px;
    }

    .rcs-nav {
      background: radial-gradient(circle at 0% 0%, rgba(16,18,22,.9) 0%, rgba(14,15,18,0) 65%);
      border-right: 1px solid rgba(255,255,255,0.018);
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 14px 10px 10px 12px;
      position: relative;
    }
    .rcs-nav-inner {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    /* esconde conteúdo quando colapsado */
    .rcs-shell.rcs-nav-collapsed .rcs-nav-inner > *:not(.rcs-nav-title) {
      display: none !important;
    }
    .rcs-shell.rcs-nav-collapsed .rcs-nav-title small {
      display: none;
    }
    .rcs-shell.rcs-nav-collapsed .rcs-nav {
      padding-right: 4px;
      padding-left: 6px;
    }

    .rcs-nav-title {
      font-size: 13px;
      font-weight: 600;
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 6px;
      justify-content: space-between;
    }
    .rcs-nav-title small {
      font-size: 9px;
      color: var(--rcs-muted);
    }
    .rcs-nav-btn {
      background: transparent;
      border: 0;
      color: rgba(226,232,240,.5);
      font-size: 11.5px;
      display: flex;
      gap: 7px;
      align-items: center;
      padding: 5px 6px 5px 2px;
      border-radius: 9px;
      cursor: pointer;
      transition: .12s ease;
    }
    .rcs-nav-btn small {
      font-size: 9px;
      color: rgba(148,163,184,.43);
    }
    .rcs-nav-btn.active,
    .rcs-nav-btn:hover {
      background: rgba(144,148,255,0.12);
      color: #fff;
    }
    .rcs-main {
      display: flex;
      flex-direction: column;
      background: radial-gradient(circle farthest-side at 100% 0%, rgba(168,85,247,.05) 0%, rgba(168,85,247,0) 55%);
    }
    .rcs-topbar {
      height: 42px;
      border-bottom: 1px solid rgba(255,255,255,0.015);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
    }
    .rcs-top-title {
      font-size: 11.5px;
      font-weight: 500;
    }
    .rcs-top-sub {
      font-size: 9.5px;
      color: var(--rcs-muted);
    }
    .rcs-top-right {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .rcs-btn-sm {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 9999px;
      padding: 2px 9px 3px;
      font-size: 10px;
      cursor: pointer;
    }
    .rcs-close {
      width: 24px;height: 24px;
      border-radius: 999px;
      background: rgba(255,255,255,.03);
      display: flex;align-items:center;justify-content:center;
      cursor: pointer;
      border: 1px solid rgba(255,255,255,.04);
    }
    .rcs-body {
      flex: 1;
      padding: 10px 12px 12px 12px;
      overflow-y: auto;
      position: relative;
    }
    .rcs-body::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px),
        linear-gradient(180deg, rgba(255,255,255,0.012) 1px, transparent 1px);
      background-size: 44px 44px;
      pointer-events: none;
    }
    .rcs-body > * {
      position: relative;
      z-index: 1;
    }
    .rcs-overview-cards {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    .rcs-card {
      background: radial-gradient(circle at 20% 10%, rgba(26,27,30,.8) 0%, rgba(9,9,10,0.25) 100%);
      border: 1px solid rgba(255,255,255,0.018);
      border-radius: 12px;
      padding: 8px 10px 8px;
      min-width: 140px;
    }
    .rcs-card small {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: rgba(148,163,184,.6);
    }
    .rcs-card .val {
      font-size: 16px;
      font-weight: 600;
      margin-top: 3px;
    }
    .rcs-status-dot {
      width: 7px;height:7px;border-radius:999px;
      background: #22c55e;
      display:inline-block;
      margin-right: 4px;
    }
    .rcs-console-box {
      background: rgba(3,3,3,0.12);
      border: 1px solid rgba(255,255,255,0.02);
      border-radius: 12px;
      margin-top: 6px;
      min-height: 210px;
      padding: 8px 8px 8px 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 11px;
    }
    .rcs-console-line { display:flex;gap:6px; }
    .rcs-console-prompt { color: rgba(148,163,184,.55); }
    .rcs-console-text { color: #e2e8f0; white-space: pre-wrap; word-break: break-word; }

    .rcs-side {
      background: radial-gradient(circle at 50% 50%, rgba(8,9,11,0.6) 0%, rgba(6,7,9,0.1) 75%);
      border-left: 1px solid rgba(255,255,255,0.015);
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 10px 10px 8px 10px;
      position: relative;
    }
    .rcs-side-title {
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: rgba(255,255,255,.4);
    }
    .rcs-side-box {
      background: rgba(255,255,255,0.012);
      border: 1px solid rgba(255,255,255,0.018);
      border-radius: 10px;
      padding: 6px 8px 7px;
    }
    .rcs-side-row {
      font-size: 11px;
      display: flex;
      justify-content: space-between;
      gap: 6px;
      margin-bottom: 3px;
    }
    .rcs-side-key { color: rgba(255,255,255,.45); font-size: 10px; }
    .rcs-side-val {
      font-size: 10px;
      color: #fff;
      text-align: right;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* colapso da barra lateral direita */
    .rcs-shell.rcs-side-collapsed .rcs-side-title,
    .rcs-shell.rcs-side-collapsed .rcs-side-box {
      display: none !important;
    }
    .rcs-shell.rcs-side-collapsed .rcs-side {
      padding: 10px 4px 8px 4px;
    }

    /* botões de colapso */
    .rcs-collapse-btn {
      position: absolute;
      top: 9px;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(15,15,15,.25);
      color: #fff;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      backdrop-filter: blur(6px);
      transition: .12s ease;
    }
    .rcs-collapse-btn:hover {
      background: rgba(168,85,247,.55);
    }
    .rcs-nav-toggle {
      right: -10px;
    }
    .rcs-side-toggle {
      left: -10px;
    }
    .rcs-shell.rcs-nav-collapsed .rcs-nav-toggle {
      right: -10px;
      transform: rotate(180deg);
    }
    .rcs-shell.rcs-side-collapsed .rcs-side-toggle {
      left: -10px;
      transform: rotate(180deg);
    }

    .rcs-quick-btn {
      width: 100%;
      background: rgba(255,255,255,0.01);
      border: 1px solid rgba(255,255,255,0.015);
      border-radius: 8px;
      padding: 5px 6px 5px;
      text-align: left;
      color: rgba(255,255,255,.7);
      font-size: 11px;
      cursor: pointer;
      transition: .12s;
    }
    .rcs-quick-btn:hover { background: rgba(168,85,247,.12); color: #fff; }
  `);

  // =============== UI ===============
  function createUI() {
    // FAB
    const fab = document.createElement("div");
    fab.className = "rcs-hub-fab";
    fab.textContent = "RCS";
    document.body.appendChild(fab);

    // OVERLAY
    const ov = document.createElement("div");
    ov.className = "rcs-overlay";
    ov.innerHTML = `
      <div class="rcs-shell" id="rcs-shell">
        <div class="rcs-nav" id="rcs-nav">
          <div class="rcs-nav-inner" id="rcs-nav-inner">
            <div class="rcs-nav-title">
              <span>RCS HUB</span>
              <small>${location.hostname}</small>
            </div>
          </div>
          <button class="rcs-collapse-btn rcs-nav-toggle" id="rcs-nav-toggle">◀</button>
        </div>
        <div class="rcs-main">
          <div class="rcs-topbar">
            <div>
              <div class="rcs-top-title" id="rcs-top-title">/overview</div>
              <div class="rcs-top-sub">visão rápida do ambiente</div>
            </div>
            <div class="rcs-top-right">
              <button class="rcs-btn-sm" id="rcs-btn-sync">sync</button>
              <div class="rcs-close" id="rcs-btn-close">×</div>
            </div>
          </div>
          <div class="rcs-body" id="rcs-body"></div>
        </div>
        <div class="rcs-side" id="rcs-side">
          <div>
            <div class="rcs-side-title">SESSION</div>
            <div class="rcs-side-box" id="rcs-session-box">
              <div class="rcs-side-row">
                <span class="rcs-side-key">tabId</span>
                <span class="rcs-side-val">#local</span>
              </div>
              <div class="rcs-side-row">
                <span class="rcs-side-key">url</span>
                <span class="rcs-side-val" id="rcs-url-val">${location.pathname}</span>
              </div>
              <div class="rcs-side-row">
                <span class="rcs-side-key">ts</span>
                <span class="rcs-side-val" id="rcs-ts-val">--:--:--</span>
              </div>
            </div>
          </div>
          <div>
            <div class="rcs-side-title">QUICK</div>
            <div class="rcs-side-box" style="display:flex;flex-direction:column;gap:4px;">
              <button class="rcs-quick-btn" data-q="ping">ping()</button>
              <button class="rcs-quick-btn" data-q="reload">reload()</button>
              <button class="rcs-quick-btn" data-q="clear">clear()</button>
            </div>
          </div>
          <button class="rcs-collapse-btn rcs-side-toggle" id="rcs-side-toggle">▶</button>
        </div>
      </div>
    `;
    document.body.appendChild(ov);

    const shell = ov.querySelector("#rcs-shell");

    fab.addEventListener("click", function () {
      ov.style.display = "flex";
    });
    ov.querySelector("#rcs-btn-close").addEventListener("click", function () {
      ov.style.display = "none";
    });
    ov.addEventListener("click", function (e) {
      if (e.target === ov) ov.style.display = "none";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") ov.style.display = "none";
    });

    ov.querySelector("#rcs-btn-sync").addEventListener("click", function () {
      syncManifest(true);
    });

    // colapso ESQUERDA
    ov.querySelector("#rcs-nav-toggle").addEventListener("click", function () {
      shell.classList.toggle("rcs-nav-collapsed");
    });

    // colapso DIREITA
    ov.querySelector("#rcs-side-toggle").addEventListener("click", function () {
      shell.classList.toggle("rcs-side-collapsed");
    });

    // quick actions
    ov.querySelectorAll(".rcs-quick-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const q = btn.dataset.q;
        if (q === "ping") {
          pushConsole(">> ping()", "info");
        } else if (q === "reload") {
          location.reload();
        } else if (q === "clear") {
          const body = RCSHub.ui.body;
          const con = body && body.querySelector("#rcs-mini-console");
          if (con) con.innerHTML = "";
          pushConsole(">> console limpo", "info");
        }
      });
    });

    // save refs
    RCSHub.ui.overlay = ov;
    RCSHub.ui.shell = shell;
    RCSHub.ui.nav = ov.querySelector("#rcs-nav-inner");
    RCSHub.ui.body = ov.querySelector("#rcs-body");
    RCSHub.ui.title = ov.querySelector("#rcs-top-title");
    RCSHub.ui.refreshNav = buildNav;
  }

  // =============== console mini do overview ===============
  function pushConsole(msg, type) {
    if (!RCSHub.__miniBuffer) RCSHub.__miniBuffer = [];
    RCSHub.__miniBuffer.unshift({
      msg: msg,
      type: type || "log",
      ts: Date.now(),
    });
    // continua limitado a 40
    if (RCSHub.__miniBuffer.length > 40) RCSHub.__miniBuffer.pop();
    if (RCSHub.__currentView === "overview") renderOverview();
  }

  // =============== NAV ===============
  function buildNav() {
    const nav = RCSHub.ui.nav;
    if (!nav) return;

    const list = document.createElement("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "4px";

    const items = [
      { id: "overview", label: "/overview", sub: "status" },
      { id: "console", label: "/console", sub: "runtime" },
      { id: "network", label: "/network", sub: "requisições" },
      { id: "sql", label: "/sql", sub: "assistente", needs: "sql-assistant" },
      { id: "config", label: "/config", sub: "prefs", disabled: true },
    ];

    items.forEach(function (item, idx) {
      const btn = document.createElement("button");
      btn.className = "rcs-nav-btn" + (idx === 0 ? " active" : "");
      btn.dataset.view = item.id;
      btn.disabled = !!item.disabled;
      btn.innerHTML = `
        <span style="width:18px;text-align:center;">
          ${
            item.id === "overview"
              ? "●"
              : item.id === "console"
              ? "⌘"
              : item.id === "network"
              ? "⟲"
              : "•"
          }
        </span>
        <div style="display:flex;flex-direction:column;align-items:flex-start;">
          <span>${item.label}</span>
          <small>${item.sub || ""}</small>
        </div>
      `;
      if (item.disabled) {
        btn.style.opacity = 0.35;
        btn.style.cursor = "not-allowed";
      } else {
        btn.addEventListener("click", function () {
          nav.querySelectorAll(".rcs-nav-btn").forEach(function (b) {
            b.classList.remove("active");
          });
          btn.classList.add("active");
          showView(item.id);
        });
      }
      list.appendChild(btn);
    });

    // limpa e poe de novo
    nav.innerHTML = `
      <div class="rcs-nav-title">
        <span>RCS HUB</span>
        <small>${location.hostname}</small>
      </div>
    `;
    nav.appendChild(list);

    showView("overview");
  }

  // =============== VIEWS ===============
  function showView(view) {
    RCSHub.__currentView = view;
    RCSHub.ui.title.textContent = "/" + view;

    if (view === "overview") {
      renderOverview();
      return;
    }
    if (view === "console") {
      renderConsoleView();
      return;
    }
    if (view === "network") {
      renderNetworkView();
      return;
    }
    if (view === "sql") {
      const cmd = RCSHub.commands.get("sql-assistant");
      if (cmd && typeof cmd.render === "function") {
        const html = cmd.render();
        const body = RCSHub.ui.body;
        if (typeof html === "string") {
          body.innerHTML = html;
        } else {
          body.innerHTML = "";
          body.appendChild(html);
        }
        cmd.onShow && cmd.onShow(body);
        return;
      } else {
        RCSHub.ui.body.innerHTML = `<div style="color:#fff;font-size:12px;">sql-assistant não carregou do GitHub.</div>`;
        return;
      }
    }

    RCSHub.ui.body.innerHTML =
      '<div class="rcs-hub-empty">view ' + view + " não implementada.</div>";
  }

  function renderOverview() {
    const body = RCSHub.ui.body;
    const uptime = formatUptime(Date.now() - START_TS);
    body.innerHTML = `
      <div class="rcs-overview-cards">
        <div class="rcs-card">
          <small>ESTADO</small>
          <div class="val"><span class="rcs-status-dot"></span>ONLINE</div>
          <div style="font-size:9px;color:rgba(226,232,240,.25);margin-top:3px;">${location.hostname}</div>
        </div>
        <div class="rcs-card">
          <small>UPTIME</small>
          <div class="val" id="rcs-uptime">${uptime}</div>
          <div style="font-size:9px;color:rgba(226,232,240,.25);margin-top:3px;">since injection</div>
        </div>
        <div class="rcs-card">
          <small>MODO</small>
          <div class="val">LEGACY</div>
          <div style="font-size:9px;color:rgba(226,232,240,.25);margin-top:3px;">tampermonkey</div>
        </div>
      </div>
      <div class="rcs-console-box" id="rcs-mini-console"></div>
    `;

    const con = body.querySelector("#rcs-mini-console");
    const buf = RCSHub.__miniBuffer || [];
    if (!buf.length) {
      con.innerHTML =
        '<div class="rcs-console-line"><span class="rcs-console-prompt">&gt;&gt;</span><span class="rcs-console-text"> boot RCS HUB...</span></div>' +
        '<div class="rcs-console-line"><span class="rcs-console-prompt">&gt;&gt;</span><span class="rcs-console-text"> env: dark-console</span></div>' +
        '<div class="rcs-console-line"><span class="rcs-console-prompt">&gt;&gt;</span><span class="rcs-console-text"> ready.</span></div>';
    } else {
      con.innerHTML = buf
        .map(function (l) {
          return (
            '<div class="rcs-console-line"><span class="rcs-console-prompt">&gt;&gt;</span><span class="rcs-console-text">' +
            l.msg +
            "</span></div>"
          );
        })
        .join("");
    }
  }

  function renderConsoleView() {
    const body = RCSHub.ui.body;
    const cmd = RCSHub.commands.get("console-rt");
    if (cmd && typeof cmd.render === "function") {
      const html = cmd.render();
      if (typeof html === "string") {
        body.innerHTML = html;
      } else {
        body.innerHTML = "";
        body.appendChild(html);
      }
      cmd.onShow && cmd.onShow(body);
    } else {
      body.innerHTML =
        '<div style="color:#fff;font-size:12px;">console-rt não carregou do GitHub.</div>';
    }
  }

  function renderNetworkView() {
    const body = RCSHub.ui.body;
    const cmd = RCSHub.commands.get("network-rt");
    if (cmd && typeof cmd.render === "function") {
      const html = cmd.render();
      if (typeof html === "string") {
        body.innerHTML = html;
      } else {
        body.innerHTML = "";
        body.appendChild(html);
      }
      cmd.onShow && cmd.onShow(body);
    } else {
      body.innerHTML =
        '<div style="color:#fff;font-size:12px;">network-rt não carregou do GitHub.</div>';
    }
  }

  // =============== FETCH MANIFEST ===============
  function fetchRemote(url) {
    const busted = url + (url.includes("?") ? "&" : "?") + "_=" + Date.now();
    return new Promise(function (resolve, reject) {
      GM_xmlhttpRequest({
        method: "GET",
        url: busted,
        headers: { "Cache-Control": "no-cache" },
        onload: function (res) {
          if (res.status >= 200 && res.status < 300) resolve(res.responseText);
          else reject(new Error("HTTP " + res.status));
        },
        onerror: reject,
      });
    });
  }

  async function syncManifest(verbose) {
    try {
      const txt = await fetchRemote(MANIFEST_URL);
      const json = JSON.parse(txt);
      RCSHub.manifest = json;
      if (verbose) RCSHub.log("manifest:", json);

      if (Array.isArray(json.commands)) {
        for (const c of json.commands) {
          if (!c.entry) continue;
          try {
            const code = await fetchRemote(c.entry);
            const fn = new Function("RCSHub", code);
            fn(RCSHub);
            pushConsole(">> cmd ok: " + (c.id || c.name || c.entry), "info");
          } catch (err) {
            pushConsole(
              "!! cmd FAIL: " + (c.id || c.entry) + " — " + err.message,
              "error"
            );
            RCSHub.log("cmd error", c, err);
          }
        }
      }

      RCSHub.ui.refreshNav && RCSHub.ui.refreshNav();
      pushConsole(">> manifest sync ok", "info");
    } catch (e) {
      RCSHub.log("manifest fail", e);
      pushConsole("!! manifest error — usando fallback", "error");
      if (!RCSHub.commands.has("console-rt")) {
        RCSHub.registerCommand({
          id: "console-rt",
          name: "Console (RT)",
          render: function () {
            return '<div style="color:#fff;font-size:12px;">fallback console</div>';
          },
        });
      }
      if (!RCSHub.commands.has("network-rt")) {
        RCSHub.registerCommand({
          id: "network-rt",
          name: "Network (RT)",
          render: function () {
            return '<div style="color:#fff;font-size:12px;">fallback network</div>';
          },
        });
      }
      RCSHub.ui.refreshNav && RCSHub.ui.refreshNav();
    }
  }

  // expor pra botão
  RCSHub._forceSync = function () {
    return syncManifest(true);
  };

  // =============== NETWORK HOOK (append-only) ===============
  (function instrumentNetwork() {
    const reqLog = RCSHub.networkLog || [];
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    let seq = RCSHub.__netSeq || 1;

    XMLHttpRequest.prototype.open = function (method, url) {
      this.__rcs_meta = { method: method, url: url, ts: Date.now() };
      return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      const meta = this.__rcs_meta;
      const start = Date.now();
      this.addEventListener("loadend", function () {
        const entry = {
          __id: seq++,
          method: (meta && meta.method) || "GET",
          url: (meta && meta.url) || "",
          ts: (meta && meta.ts) || Date.now(),
          duration: Date.now() - start,
          status: this.status,
          ok: this.status >= 200 && this.status < 300,
        };
        reqLog.unshift(entry);
        if (
          !entry.ok &&
          window.RCSHub &&
          Array.isArray(window.RCSHub.consoleBuffer)
        ) {
          window.RCSHub.consoleBuffer.unshift({
            __id: "net-" + entry.__id,
            type: "network-error",
            ts: entry.ts,
            args: [
              entry.method + " " + entry.url,
              "status " + entry.status,
              entry.duration + "ms",
            ],
            indent: 0,
          });
        }
        RCSHub.__netSeq = seq;
      });
      return origSend.call(this, body);
    };

    RCSHub.networkLog = reqLog;
  })();

  // =============== UTILS ===============
  function formatUptime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return (
      String(h).padStart(2, "0") +
      ":" +
      String(m).padStart(2, "0") +
      ":" +
      String(s).padStart(2, "0")
    );
  }

  // relógio sessão
  setInterval(function () {
    const el = document.querySelector("#rcs-ts-val");
    const up = document.querySelector("#rcs-uptime");
    if (el) {
      const d = new Date();
      el.textContent = d.toTimeString().slice(0, 8);
    }
    if (up) {
      up.textContent = formatUptime(Date.now() - START_TS);
    }
  }, 1000);

  // =============== INIT ===============
  createUI();
  syncManifest();
  setInterval(syncManifest, SYNC_INTERVAL);
})(
  GM_xmlhttpRequest,
  GM_addStyle,
  "https://raw.githubusercontent.com/rcsCrew/rcs-hub/main"
);
