// src/commands/console-rt.js
(function (RCSHub) {
  const BUFFER_LIMIT = 300; // mais profundo
  const INDENT_STEP = 14; // px por nível de group()
  const MAX_STRING = 10_000; // corta payloads gigantes
  const buffer = RCSHub.consoleBuffer || [];
  const timers = RCSHub.__consoleTimers || new Map();
  const counters = RCSHub.__consoleCounters || new Map();
  let groupLevel = RCSHub.__consoleGroupLevel || 0;
  const mimicConsoleClear = false; // true = limpa buffer no console.clear()

  // ===== util: safe stringify (circular / tipos especiais) =====
  function safePreview(v, depth = 0, seen = new Set()) {
    try {
      if (v === null) return "null";
      const t = typeof v;
      if (t === "string")
        return v.length > MAX_STRING ? v.slice(0, MAX_STRING) + "…" : v;
      if (t === "number" || t === "boolean" || t === "bigint" || t === "symbol")
        return String(v);
      if (t === "undefined") return "undefined";
      if (t === "function") return `[Function ${v.name || "anonymous"}]`;
      if (v instanceof Error)
        return `${v.name}: ${v.message}\n${v.stack || ""}`;
      if (v instanceof Date) return v.toISOString();
      if (v instanceof RegExp) return v.toString();
      if (typeof Element !== "undefined" && v instanceof Element) {
        const html = v.outerHTML || v.tagName;
        return html.length > MAX_STRING
          ? html.slice(0, MAX_STRING) + "…"
          : html;
      }
      if (seen.has(v)) return "[Circular]";
      if (depth > 3) return "[Object]";
      seen.add(v);
      if (Array.isArray(v)) {
        return `[${v.map((x) => safePreview(x, depth + 1, seen)).join(", ")}]`;
      }
      // plain object-ish
      const out = {};
      const keys = Object.keys(v).slice(0, 100);
      for (const k of keys) out[k] = safePreview(v[k], depth + 1, seen);
      return JSON.stringify(out);
    } catch (e) {
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    }
  }

  // ===== util: tiny table extractor =====
  function toTableData(arg) {
    // console.table aceita array de objetos, objeto, Map, etc. Vamos cobrir os comuns.
    if (Array.isArray(arg) && arg.every((row) => typeof row === "object")) {
      const cols = Array.from(
        new Set(arg.flatMap((r) => Object.keys(r)))
      ).slice(0, 20);
      const rows = arg
        .slice(0, 50)
        .map((r) => cols.map((c) => safePreview(r[c])));
      return { cols, rows };
    }
    if (arg && typeof arg === "object") {
      const cols = ["(index)", "value"];
      const rows = Object.entries(arg)
        .slice(0, 50)
        .map(([k, v]) => [k, safePreview(v)]);
      return { cols, rows };
    }
    return { cols: ["value"], rows: [[safePreview(arg)]] };
  }

  function pushEvent(ev) {
    buffer.unshift(ev);
    if (buffer.length > BUFFER_LIMIT) buffer.pop();
  }

  // ===== hook apenas uma vez =====
  if (!RCSHub.__consoleHookedAll) {
    const orig = {};
    const methods = [
      "log",
      "info",
      "warn",
      "error",
      "debug",
      "trace",
      "group",
      "groupCollapsed",
      "groupEnd",
      "table",
      "time",
      "timeLog",
      "timeEnd",
      "assert",
      "dir",
      "dirxml",
      "clear",
      "count",
      "countReset",
      // profile/profileEnd/timeStamp não são consistentes; adiciona se quiser
    ];

    // guarda originais
    methods.forEach(
      (m) => (orig[m] = console[m] ? console[m].bind(console) : undefined)
    );

    // básicos
    function wrapSimple(type) {
      return function (...args) {
        pushEvent({ type, ts: Date.now(), args, indent: groupLevel });
        if (orig[type]) orig[type](...args);
      };
    }

    console.log = wrapSimple("log");
    console.info = wrapSimple("info");
    console.warn = wrapSimple("warn");
    console.error = function (...args) {
      // tenta anexar stack se não vier
      if (!args.some((a) => a instanceof Error)) {
        try {
          args.push(new Error().stack);
        } catch {}
      }
      pushEvent({ type: "error", ts: Date.now(), args, indent: groupLevel });
      if (orig.error) orig.error(...args);
    };
    console.debug = wrapSimple("debug");

    console.trace = function (...args) {
      const stack = new Error("trace").stack;
      pushEvent({
        type: "trace",
        ts: Date.now(),
        args: [...args, stack],
        indent: groupLevel,
      });
      if (orig.trace) orig.trace(...args);
    };

    console.group = function (...label) {
      pushEvent({
        type: "group",
        ts: Date.now(),
        args: label,
        indent: groupLevel,
      });
      groupLevel++;
      if (orig.group) orig.group(...label);
    };
    console.groupCollapsed = function (...label) {
      pushEvent({
        type: "groupCollapsed",
        ts: Date.now(),
        args: label,
        indent: groupLevel,
      });
      groupLevel++;
      if (orig.groupCollapsed) orig.groupCollapsed(...label);
    };
    console.groupEnd = function () {
      groupLevel = Math.max(0, groupLevel - 1);
      pushEvent({
        type: "groupEnd",
        ts: Date.now(),
        args: [],
        indent: groupLevel,
      });
      if (orig.groupEnd) orig.groupEnd();
    };

    console.table = function (data, columns) {
      // columns (opcional) não suportado 100%, mas respeitamos se array
      let tbl = toTableData(data);
      if (Array.isArray(columns) && columns.length) {
        tbl.cols = tbl.cols.filter((c) => columns.includes(c));
        tbl.rows = tbl.rows.map((r, i) => {
          const rowObj = {};
          tbl.cols.forEach((c, idx) => (rowObj[c] = r[idx]));
          return tbl.cols.map((c) => rowObj[c]);
        });
      }
      pushEvent({
        type: "table",
        ts: Date.now(),
        table: tbl,
        indent: groupLevel,
      });
      if (orig.table) orig.table(data, columns);
    };

    console.time = function (label = "default") {
      timers.set(label, performance.now());
      pushEvent({
        type: "time",
        ts: Date.now(),
        args: [label],
        indent: groupLevel,
      });
      if (orig.time) orig.time(label);
    };
    console.timeLog = function (label = "default", ...args) {
      const t0 = timers.get(label);
      const delta = t0 != null ? performance.now() - t0 : undefined;
      pushEvent({
        type: "timeLog",
        ts: Date.now(),
        args: [label, delta, ...args],
        indent: groupLevel,
      });
      if (orig.timeLog) orig.timeLog(label, ...args);
    };
    console.timeEnd = function (label = "default") {
      const t0 = timers.get(label);
      const delta = t0 != null ? performance.now() - t0 : undefined;
      timers.delete(label);
      pushEvent({
        type: "timeEnd",
        ts: Date.now(),
        args: [label, delta],
        indent: groupLevel,
      });
      if (orig.timeEnd) orig.timeEnd(label);
    };

    console.assert = function (cond, ...args) {
      if (!cond) {
        pushEvent({ type: "assert", ts: Date.now(), args, indent: groupLevel });
      }
      if (orig.assert) orig.assert(cond, ...args);
    };

    console.dir = function (obj, opts) {
      pushEvent({
        type: "dir",
        ts: Date.now(),
        args: [obj, opts],
        indent: groupLevel,
      });
      if (orig.dir) orig.dir(obj, opts);
    };
    console.dirxml = function (...args) {
      pushEvent({ type: "dirxml", ts: Date.now(), args, indent: groupLevel });
      if (orig.dirxml) orig.dirxml(...args);
    };

    console.clear = function () {
      pushEvent({ type: "clear", ts: Date.now(), args: [], indent: 0 });
      if (mimicConsoleClear) buffer.length = 0;
      if (orig.clear) orig.clear();
    };

    console.count = function (label = "default") {
      const n = (counters.get(label) || 0) + 1;
      counters.set(label, n);
      pushEvent({
        type: "count",
        ts: Date.now(),
        args: [label, n],
        indent: groupLevel,
      });
      if (orig.count) orig.count(label);
    };
    console.countReset = function (label = "default") {
      counters.set(label, 0);
      pushEvent({
        type: "countReset",
        ts: Date.now(),
        args: [label],
        indent: groupLevel,
      });
      if (orig.countReset) orig.countReset(label);
    };

    // erros não tratados
    window.addEventListener("error", (ev) => {
      const { message, filename, lineno, colno, error } = ev;
      pushEvent({
        type: "uncaught",
        ts: Date.now(),
        args: [
          message,
          filename,
          lineno,
          colno,
          error && error.stack ? error.stack : error,
        ],
        indent: 0,
      });
    });
    window.addEventListener("unhandledrejection", (ev) => {
      const reason = ev.reason;
      pushEvent({
        type: "unhandledrejection",
        ts: Date.now(),
        args: [
          reason instanceof Error
            ? reason.stack || reason.message
            : safePreview(reason),
        ],
        indent: 0,
      });
    });

    // expõe estados
    RCSHub.consoleBuffer = buffer;
    RCSHub.__consoleTimers = timers;
    RCSHub.__consoleCounters = counters;
    RCSHub.__consoleGroupLevel = groupLevel;
    RCSHub.__consoleHookedAll = true;
  }

  // ===== estilos do viewer =====
  RCSHub.injectCSS(`
    .rcs-con-wrap { display:flex; flex-direction:column; gap:8px; }
    .rcs-con-list { max-height:360px; overflow-y:auto; display:flex; flex-direction:column; gap:4px; }
    .rcs-con-line { background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.02); border-radius:8px; padding:6px 8px; }
    .rcs-con-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:2px; }
    .rcs-con-type { font-size:10px; text-transform:uppercase; letter-spacing:.04em; }
    .rcs-con-ts { font-size:9px; color:rgba(255,255,255,.35); }
    .rcs-con-msg { font-size:11px; white-space:pre-wrap; word-break:break-word; }
    .rcs-con-indent { margin-left: var(--rcs-indent, 0px); }
    .rcs-con-table { width:100%; border-collapse: collapse; font-size:10.5px; }
    .rcs-con-table th, .rcs-con-table td { border:1px solid rgba(255,255,255,0.06); padding:3px 6px; }
    .rcs-con-table th { background:rgba(168,85,247,.12); }
  `);

  // ===== UI (render) =====
  RCSHub.registerCommand({
    id: "console-rt",
    name: "Console (RT)",
    render() {
      const items = RCSHub.consoleBuffer || [];
      const colorFor = (t) =>
        ({
          log: "#e2e8f0",
          info: "#38bdf8",
          warn: "#f97316",
          error: "#f43f5e",
          debug: "#94a3b8",
          trace: "#a855f7",
          assert: "#fb7185",
          group: "#c084fc",
          groupCollapsed: "#c084fc",
          groupEnd: "#c084fc",
          table: "#22c55e",
          time: "#60a5fa",
          timeLog: "#60a5fa",
          timeEnd: "#60a5fa",
          dir: "#eab308",
          dirxml: "#eab308",
          clear: "#94a3b8",
          count: "#34d399",
          countReset: "#34d399",
          uncaught: "#ef4444",
          unhandledrejection: "#ef4444",
        }[t] || "#e2e8f0");

      function renderItem(ev) {
        const ts = new Date(ev.ts).toLocaleTimeString();
        const indent = (ev.indent || 0) * INDENT_STEP;
        const styleIndent = `style="--rcs-indent:${indent}px"`;
        const head = `
          <div class="rcs-con-head">
            <div class="rcs-con-type" style="color:${colorFor(ev.type)}">${
          ev.type
        }</div>
            <div class="rcs-con-ts">${ts}</div>
          </div>
        `;

        // special types
        if (ev.type === "table" && ev.table) {
          const { cols, rows } = ev.table;
          const thead = `<tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>`;
          const tbody = rows
            .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
            .join("");
          return `<div class="rcs-con-line rcs-con-indent" ${styleIndent}>${head}<div class="rcs-con-msg"><table class="rcs-con-table">${thead}${tbody}</table></div></div>`;
        }

        if (ev.type === "group" || ev.type === "groupCollapsed") {
          const label =
            ev.args && ev.args.length
              ? ev.args.map((a) => safePreview(a)).join(" ")
              : "(group)";
          return `<div class="rcs-con-line rcs-con-indent" ${styleIndent}>${head}<div class="rcs-con-msg">▼ ${label}</div></div>`;
        }
        if (ev.type === "groupEnd") {
          return `<div class="rcs-con-line rcs-con-indent" ${styleIndent}>${head}<div class="rcs-con-msg">▲ groupEnd</div></div>`;
        }

        if (
          ev.type === "time" ||
          ev.type === "timeLog" ||
          ev.type === "timeEnd"
        ) {
          const [label, delta, ...rest] = ev.args || [];
          const extra =
            rest && rest.length
              ? " — " + rest.map((a) => safePreview(a)).join(" ")
              : "";
          const msg =
            delta != null
              ? `${label}: ${delta.toFixed(2)} ms${extra}`
              : `${label}${extra}`;
          return `<div class="rcs-con-line rcs-con-indent" ${styleIndent}>${head}<div class="rcs-con-msg">${msg}</div></div>`;
        }

        if (ev.type === "count" || ev.type === "countReset") {
          const [label, n] = ev.args || [];
          const msg =
            ev.type === "count" ? `${label}: ${n}` : `${label}: reset`;
          return `<div class="rcs-con-line rcs-con-indent" ${styleIndent}>${head}<div class="rcs-con-msg">${msg}</div></div>`;
        }

        // generic
        const msg =
          ev.args && ev.args.length
            ? ev.args.map((a) => safePreview(a)).join(" ")
            : "";
        return `<div class="rcs-con-line rcs-con-indent" ${styleIndent}>${head}<div class="rcs-con-msg">${msg}</div></div>`;
      }

      return `
        <div class="rcs-con-wrap">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h3 style="margin:0;">Console — tempo real</h3>
              <p style="margin:0;font-size:10px;color:rgba(255,255,255,.4);">
                Captura TODOS os métodos do console + erros não tratados
              </p>
            </div>
            <span style="font-size:10px;color:rgba(255,255,255,0.45);">${
              items.length
            } eventos</span>
          </div>
          <div class="rcs-con-list">
            ${
              items.length
                ? items.map(renderItem).join("")
                : `
              <div style="font-size:11px;color:rgba(255,255,255,.45);">
                Sem eventos ainda… faça um <code>console.log('oi rcs')</code>.
              </div>
            `
            }
          </div>
        </div>
      `;
    },
    onShow(container) {
      const int = setInterval(() => {
        if (!container.isConnected) return clearInterval(int);
        container.innerHTML = this.render();
      }, 1200);
    },
  });
})(RCSHub);
