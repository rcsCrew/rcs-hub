// src/rcs/core.js
(function (GM_xmlhttpRequest, GM_addStyle, GITHUB_BASE) {
  "use strict";

  // pega os comandos que vamos carregar
  const MANIFEST_URL = `${GITHUB_BASE}/rcs/manifest.json`;
  const SYNC_INTERVAL = 1000 * 60 * 3; // 3 min

  // namespace global
  const RCSHub = (window.RCSHub = window.RCSHub || {
    version: "0.3.0",
    commands: new Map(),
    modals: new Map(),
    manifest: null,
    ui: {},
    debug: true,
    log(...a) {
      if (this.debug) console.log("[RCS-HUB]", ...a);
    },
    registerCommand(def) {
      if (!def || !def.id) return;
      this.commands.set(def.id, def);
      this.ui.refreshSide && this.ui.refreshSide();
    },
    registerModal(def) {
      if (!def || !def.id) return;
      this.modals.set(def.id, def);
    },
    injectCSS(css) {
      const el = document.createElement("style");
      el.textContent = css;
      document.head.appendChild(el);
    },
  });

  // ====== ESTILO BASE ======
  GM_addStyle(`
    :root {
      --rcs-bg: rgba(18,18,18,0.85);
      --rcs-panel: rgba(15,15,15,.9);
      --rcs-text: #f9fafb;
      --rcs-muted: #bdc0c2;
      --rcs-accent: #a855f7;
      --rcs-border: rgba(168,85,247,.25);
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
    .rcs-hub-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.35);
      z-index: calc(var(--rcs-z) + 1);
      display: none;
      align-items: center;
      justify-content: center;
    }
    .rcs-hub-shell {
      width: 880px;
      height: 520px;
      background: radial-gradient(circle at 10% 10%, rgba(23,23,24,1) 0%, rgba(11,11,11,0.8) 40%, rgba(8,8,8,0.65) 100%);
      border: 1px solid rgba(168,85,247,.25);
      border-radius: 18px;
      box-shadow: 0 24px 50px rgba(0,0,0,.45);
      display: grid;
      grid-template-columns: 190px 1fr;
      overflow: hidden;
      backdrop-filter: blur(20px);
      color: #f9fafb;
    }
    .rcs-hub-sidebar {
      background: linear-gradient(180deg, rgba(12,12,12,.35) 0%, rgba(12,12,12,0) 35%);
      border-right: 1px solid rgba(255,255,255,0.02);
      display: flex;
      flex-direction: column;
      padding: 14px 10px 10px 12px;
      gap: 10px;
    }
    .rcs-hub-sidebar-title {
      font-size: 13px;
      font-weight: 700;
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .rcs-hub-nav {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .rcs-hub-nav-btn {
      border: 0;
      background: rgba(255,255,255,0.01);
      color: rgba(249,250,250,.7);
      display: flex;
      gap: 7px;
      align-items: center;
      font-size: 11.5px;
      border-radius: 10px;
      padding: 5px 7px 5px 6px;
      cursor: pointer;
      transition: .12s ease;
    }
    .rcs-hub-nav-btn.active,
    .rcs-hub-nav-btn:hover {
      background: rgba(168,85,247,.13);
      color: #fff;
    }
    .rcs-hub-main {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .rcs-hub-topbar {
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px 0 14px;
      border-bottom: 1px solid rgba(255,255,255,0.02);
    }
    .rcs-hub-title-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .rcs-hub-title {
      font-size: 13px;
      font-weight: 600;
    }
    .rcs-hub-sub {
      font-size: 10px;
      color: rgba(249,250,250,.4);
    }
    .rcs-hub-top-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .rcs-hub-btn {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px;
      height: 24px;
      padding: 0 8px;
      font-size: 10.5px;
      color: #fff;
      cursor: pointer;
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .rcs-hub-close {
      width: 26px; height: 26px;
      display: flex; align-items:center; justify-content:center;
      cursor: pointer;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 9999px;
    }
    .rcs-hub-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px 14px 14px 14px;
      background: radial-gradient(circle farthest-side at 100% 0%, rgba(168,85,247,.06) 0%, rgba(168,85,247,0) 50%);
    }
    .rcs-hub-empty {
      color: rgba(249,250,250,.4);
      font-size: 11.5px;
    }
  `);

  // ===== UI PRINCIPAL (FAB + painel) =====
  function createUI() {
    // FAB
    const fab = document.createElement("div");
    fab.className = "rcs-hub-fab";
    fab.textContent = "RCS";
    document.body.appendChild(fab);

    // OVERLAY + SHELL
    const overlay = document.createElement("div");
    overlay.className = "rcs-hub-overlay";
    overlay.innerHTML = `
      <div class="rcs-hub-shell">
        <div class="rcs-hub-sidebar" id="rcs-hub-sidebar">
          <div class="rcs-hub-sidebar-title">
            <span style="width:20px;height:20px;border-radius:6px;background:radial-gradient(circle at 20% 20%, rgba(168,85,247,1) 0%, rgba(15,23,42,.1) 100%);display:inline-block;"></span>
            RCS HUB
          </div>
          <div class="rcs-hub-nav" id="rcs-hub-nav">
            <!-- será preenchido -->
          </div>
          <div style="margin-top:auto;font-size:10px;color:rgba(249,250,250,.32);">
            v${RCSHub.version} • rcsCrew
          </div>
        </div>
        <div class="rcs-hub-main">
          <div class="rcs-hub-topbar">
            <div class="rcs-hub-title-block">
              <div class="rcs-hub-title">Painel de Monitoramento</div>
              <div class="rcs-hub-sub">Console e Network em tempo real</div>
            </div>
            <div class="rcs-hub-top-actions">
              <button class="rcs-hub-btn" id="rcs-hub-refresh">recarregar</button>
              <div class="rcs-hub-close" id="rcs-hub-close">×</div>
            </div>
          </div>
          <div class="rcs-hub-content" id="rcs-hub-content">
            <div class="rcs-hub-empty">Carregando módulos remotos…</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // FAB abre/fecha
    fab.addEventListener("click", () => {
      overlay.style.display =
        overlay.style.display === "flex" ? "none" : "flex";
    });
    // close
    overlay.querySelector("#rcs-hub-close").addEventListener("click", () => {
      overlay.style.display = "none";
    });
    // ESC fecha
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") overlay.style.display = "none";
    });
    // refresh
    overlay.querySelector("#rcs-hub-refresh").addEventListener("click", () => {
      syncManifest(true);
    });

    // salva na lib
    RCSHub.ui.fab = fab;
    RCSHub.ui.overlay = overlay;
    RCSHub.ui.sidebar = overlay.querySelector("#rcs-hub-nav");
    RCSHub.ui.content = overlay.querySelector("#rcs-hub-content");
    RCSHub.ui.refreshSide = buildSide;
  }

  // ===== monta sidebar com os comandos carregados =====
  function buildSide() {
    const side = RCSHub.ui.sidebar;
    const content = RCSHub.ui.content;
    const cmds = Array.from(RCSHub.commands.values());

    // queremos só console e network → se tiver outros, ignora na UI
    const filtered = cmds.filter(
      (c) => c.id === "console-rt" || c.id === "network-rt"
    );

    side.innerHTML = "";

    if (!filtered.length) {
      content.innerHTML = `<div class="rcs-hub-empty">Sem comandos (esperando console-rt e network-rt)</div>`;
      return;
    }

    filtered.forEach((c, idx) => {
      const btn = document.createElement("button");
      btn.className = "rcs-hub-nav-btn" + (idx === 0 ? " active" : "");
      btn.dataset.cmd = c.id;
      btn.innerHTML = `
        <span style="width:17px;text-align:center;">${
          c.id === "console-rt" ? "🖥" : "🌐"
        }</span>
        ${c.name || c.id}
      `;
      btn.addEventListener("click", () => {
        side
          .querySelectorAll(".rcs-hub-nav-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderCommand(c.id);
      });
      side.appendChild(btn);
    });

    // render o primeiro
    renderCommand(filtered[0].id);
  }

  // ===== renderiza comando no painel =====
  function renderCommand(id) {
    const cmd = RCSHub.commands.get(id);
    const content = RCSHub.ui.content;
    if (!cmd) {
      content.innerHTML = `<div class="rcs-hub-empty">Comando não encontrado: ${id}</div>`;
      return;
    }
    if (typeof cmd.render === "function") {
      const html = cmd.render();
      if (typeof html === "string") {
        content.innerHTML = html;
      } else {
        content.innerHTML = "";
        content.appendChild(html);
      }
      cmd.onShow && cmd.onShow(content);
    } else {
      content.innerHTML = `<div class="rcs-hub-empty">Comando sem render.</div>`;
    }
  }

  // ===== fetch remoto =====
  function fetchRemote(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url,
        headers: { "Cache-Control": "no-cache" },
        onload: (res) => {
          if (res.status >= 200 && res.status < 300) resolve(res.responseText);
          else reject(new Error("HTTP " + res.status));
        },
        onerror: reject,
      });
    });
  }

  async function syncManifest(forceLog) {
    try {
      const txt = await fetchRemote(MANIFEST_URL);
      const json = JSON.parse(txt);
      RCSHub.manifest = json;
      if (forceLog) RCSHub.log("manifest recarregado:", json);

      // limpa comandos antigos?
      // opcional, mas vamos manter
      // RCSHub.commands = new Map(); // se quiser resetar 100%

      if (Array.isArray(json.commands)) {
        for (const c of json.commands) {
          if (!c.entry) continue;
          const code = await fetchRemote(c.entry);
          const fn = new Function("RCSHub", code);
          fn(RCSHub);
        }
      }

      // depois de carregar, monta sidebar
      RCSHub.ui.refreshSide && RCSHub.ui.refreshSide();
    } catch (e) {
      RCSHub.log("falhou manifest, criando fallback console/network");
      // FALLBACK: cria dois comandos simples
      if (!RCSHub.commands.has("console-rt")) {
        RCSHub.registerCommand({
          id: "console-rt",
          name: "Console (RT)",
          render() {
            return `<div class="rcs-hub-empty">console-rt não veio do GitHub.</div>`;
          },
        });
      }
      if (!RCSHub.commands.has("network-rt")) {
        RCSHub.registerCommand({
          id: "network-rt",
          name: "Network (RT)",
          render() {
            return `<div class="rcs-hub-empty">network-rt não veio do GitHub.</div>`;
          },
        });
      }
      RCSHub.ui.refreshSide && RCSHub.ui.refreshSide();
    }
  }

  // expõe pra modal chamar
  RCSHub._forceSync = () => syncManifest(true);

  // ====== HOOK DE NETWORK (pra network-rt usar) ======
  (function instrumentNetwork() {
    const reqLog = [];
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this.__rcs_meta = { method, url, ts: Date.now() };
      return origOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function (body) {
      const meta = this.__rcs_meta;
      const start = Date.now();
      this.addEventListener("loadend", () => {
        reqLog.unshift({
          ...meta,
          duration: Date.now() - start,
          status: this.status,
          ok: this.status >= 200 && this.status < 300,
        });
        if (reqLog.length > 120) reqLog.pop();
      });
      return origSend.call(this, body);
    };
    RCSHub.networkLog = reqLog;
  })();

  // ===== init =====
  createUI();
  syncManifest();
  setInterval(syncManifest, SYNC_INTERVAL);
})(GM_xmlhttpRequest, GM_addStyle, GITHUB_BASE);
