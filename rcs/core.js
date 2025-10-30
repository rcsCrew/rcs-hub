// src/rcs/core.js
(function (GM_xmlhttpRequest, GM_addStyle, GITHUB_BASE) {
  "use strict";

  const MANIFEST_URL = `${GITHUB_BASE}/src/rcs/manifest.json`;
  const SYNC_INTERVAL = 1000 * 60 * 3; // 3 min

  const RCSHub = (window.RCSHub = window.RCSHub || {
    version: "0.2.0",
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
      this.ui.refreshMenu && this.ui.refreshMenu();
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

  GM_addStyle(`
    :root {
      --rcs-bg: rgba(12, 12, 12, 0.78);
      --rcs-panel: rgba(11,11,11,.9);
      --rcs-text: #f9fafa;
      --rcs-muted: #bdc0c2;
      --rcs-accent: #38bdf8;
      --rcs-radius: 16px;
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
    .rcs-hub-panel {
      position: fixed;
      bottom: 160px;
      right: 24px;
      width: 360px;
      max-height: 480px;
      background: linear-gradient(160deg, rgba(10,10,10,0.92), rgba(10,10,10,0.45));
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 18px;
      box-shadow: 0 18px 40px rgba(0,0,0,.35);
      backdrop-filter: blur(22px);
      color: var(--rcs-text);
      z-index: var(--rcs-z);
      display: none;
      flex-direction: column;
      overflow: hidden;
    }
    .rcs-hub-header { height:46px; display:flex; align-items:center; justify-content:space-between; padding:0 12px 0 16px; border-bottom:1px solid rgba(255,255,255,0.02); cursor:move; gap:8px;}
    .rcs-hub-menu { display:flex; gap:4px; padding:8px 10px; border-bottom:1px solid rgba(255,255,255,0.03); overflow-x:auto; }
    .rcs-hub-tab { background:rgba(255,255,255,0.02); border:1px solid transparent; border-radius:9999px; padding:5px 12px; font-size:11px; cursor:pointer; white-space:nowrap; }
    .rcs-hub-tab.active { background:rgba(12,148,255,0.18); border-color:rgba(59,130,246,0.35); }
    .rcs-hub-body { flex:1; overflow-y:auto; padding:10px 12px 12px; font-size:12px; }
    .rcs-hub-modalbtn { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:9999px; padding:2px 7px; font-size:11px; cursor:pointer; display:flex; gap:4px; align-items:center; }
    .rcs-hub-close { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.04); border-radius:9999px; width:26px; height:26px; display:flex; align-items:center; justify-content:center; cursor:pointer; }
  `);

  function makeDraggable(el, handle) {
    const dragTarget = handle || el;
    let offsetX = 0,
      offsetY = 0,
      isDown = false;
    dragTarget.addEventListener("mousedown", (e) => {
      isDown = true;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      e.preventDefault();
    });
    function move(e) {
      if (!isDown) return;
      el.style.left = e.clientX - offsetX + "px";
      el.style.top = e.clientY - offsetY + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
      el.style.position = "fixed";
    }
    function up() {
      isDown = false;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    }
  }

  function createUI() {
    const fab = document.createElement("div");
    fab.className = "rcs-hub-fab";
    fab.textContent = "RCS";
    document.body.appendChild(fab);

    const panel = document.createElement("div");
    panel.className = "rcs-hub-panel";
    panel.innerHTML = `
      <div class="rcs-hub-header" id="rcs-hub-header">
        <div>
          <div style="font-weight:600;font-size:13px;">RCS HUB</div>
          <div style="font-size:9.5px;color:var(--rcs-muted);">overview / console / network</div>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
          <button class="rcs-hub-modalbtn" id="rcs-hub-modals-btn">modais</button>
          <div class="rcs-hub-close" id="rcs-hub-close">×</div>
        </div>
      </div>
      <div class="rcs-hub-menu" id="rcs-hub-menu"></div>
      <div class="rcs-hub-body" id="rcs-hub-body">
        <div style="color:var(--rcs-muted);font-size:11.5px;">Carregando…</div>
      </div>
    `;
    document.body.appendChild(panel);

    fab.addEventListener("click", () => {
      panel.style.display = panel.style.display === "flex" ? "none" : "flex";
    });
    panel.querySelector("#rcs-hub-close").addEventListener("click", () => {
      panel.style.display = "none";
    });
    panel
      .querySelector("#rcs-hub-modals-btn")
      .addEventListener("click", openModalsList);

    makeDraggable(fab);
    makeDraggable(panel, panel.querySelector("#rcs-hub-header"));

    RCSHub.ui.fab = fab;
    RCSHub.ui.panel = panel;
    RCSHub.ui.menu = panel.querySelector("#rcs-hub-menu");
    RCSHub.ui.body = panel.querySelector("#rcs-hub-body");
    RCSHub.ui.refreshMenu = buildMenu;
  }

  function buildMenu() {
    const menu = RCSHub.ui.menu;
    const body = RCSHub.ui.body;
    const cmds = Array.from(RCSHub.commands.values());
    menu.innerHTML = "";

    if (!cmds.length) {
      body.innerHTML = `<div style="color:var(--rcs-muted);">Sem comandos carregados…</div>`;
      return;
    }

    cmds.forEach((c, idx) => {
      const btn = document.createElement("button");
      btn.className = "rcs-hub-tab" + (idx === 0 ? " active" : "");
      btn.textContent = c.name || c.id;
      btn.addEventListener("click", () => {
        menu
          .querySelectorAll(".rcs-hub-tab")
          .forEach((t) => t.classList.remove("active"));
        btn.classList.add("active");
        renderCommand(c.id);
      });
      menu.appendChild(btn);
    });

    renderCommand(cmds[0].id);
  }

  function renderCommand(id) {
    const cmd = RCSHub.commands.get(id);
    const body = RCSHub.ui.body;
    if (!cmd) {
      body.innerHTML = `<div style="color:var(--rcs-muted);">Comando não encontrado: ${id}</div>`;
      return;
    }
    if (typeof cmd.render === "function") {
      const html = cmd.render();
      if (typeof html === "string") {
        body.innerHTML = html;
      } else {
        body.innerHTML = "";
        body.appendChild(html);
      }
      cmd.onShow && cmd.onShow(body);
    } else {
      body.innerHTML = `<div style="color:var(--rcs-muted);">Comando sem render.</div>`;
    }
  }

  function openModalsList() {
    const mods = Array.from(RCSHub.modals.values());
    const body = RCSHub.ui.body;
    if (!mods.length) {
      body.innerHTML = `<div style="color:var(--rcs-muted);font-size:11.5px;">Nenhum modal registrado…</div>`;
      return;
    }
    body.innerHTML = `<div style="display:flex;flex-direction:column;gap:6px;">
      ${mods
        .map(
          (m) => `
        <button style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:6px 8px;text-align:left;">
          <strong>${m.name || m.id}</strong><br>
          <span style="font-size:10px;color:var(--rcs-muted);">${
            m.desc || ""
          }</span>
        </button>
      `
        )
        .join("")}
    </div>`;
    Array.from(body.querySelectorAll("button")).forEach((btn, i) => {
      btn.addEventListener("click", () => {
        const m = mods[i];
        showModal(m);
      });
    });
  }

  function showModal(mod) {
    if (!mod || typeof mod.render !== "function") return;
    const panel = document.createElement("div");
    panel.style.cssText = `
      position:fixed;inset:0;z-index:2147483647;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,.35);
    `;
    const inner = document.createElement("div");
    const html = mod.render();
    inner.innerHTML =
      typeof html === "string"
        ? html
        : '<div style="background:#111;padding:12px;border-radius:12px;">Modal vazio</div>';
    panel.appendChild(inner);
    panel.addEventListener("click", (e) => {
      if (e.target === panel) panel.remove();
    });
    document.body.appendChild(panel);
    mod.onShow && mod.onShow(inner);
  }

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

  async function syncManifest() {
    try {
      const txt = await fetchRemote(MANIFEST_URL);
      const json = JSON.parse(txt);
      RCSHub.manifest = json;
      RCSHub.log("manifest:", json);

      if (Array.isArray(json.commands)) {
        for (const c of json.commands) {
          if (!c.entry) continue;
          const code = await fetchRemote(c.entry);
          const fn = new Function("RCSHub", code);
          fn(RCSHub);
        }
      }

      if (Array.isArray(json.modals)) {
        for (const m of json.modals) {
          if (!m.entry) continue;
          const code = await fetchRemote(m.entry);
          const fn = new Function("RCSHub", code);
          fn(RCSHub);
        }
      }

      RCSHub.ui.refreshMenu && RCSHub.ui.refreshMenu();
    } catch (e) {
      RCSHub.log("falhou manifest, usando fallback");
      RCSHub.registerCommand({
        id: "overview-local",
        name: "Overview (local)",
        render() {
          return `<div>Manifest não carregou. URL: ${location.href}</div>`;
        },
      });
      RCSHub.ui.refreshMenu && RCSHub.ui.refreshMenu();
    }
  }

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

  createUI();
  syncManifest();
  setInterval(syncManifest, SYNC_INTERVAL);
})(GM_xmlhttpRequest, GM_addStyle, GITHUB_BASE);
