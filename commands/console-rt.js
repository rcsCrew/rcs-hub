// src/commands/console-rt.js
(function (RCSHub) {
  const BUFFER_LIMIT = 300;
  const INDENT_STEP = 14;
  const MAX_STRING = 10_000;
  const buffer = RCSHub.consoleBuffer || [];
  const timers = RCSHub.__consoleTimers || new Map();
  const counters = RCSHub.__consoleCounters || new Map();
  let groupLevel = RCSHub.__consoleGroupLevel || 0;

  // ===== utils =====
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
      if (Array.isArray(v))
        return `[${v.map((x) => safePreview(x, depth + 1, seen)).join(", ")}]`;
      const out = {};
      const keys = Object.keys(v).slice(0, 80);
      for (const k of keys) out[k] = safePreview(v[k], depth + 1, seen);
      return JSON.stringify(out);
    } catch {
      return String(v);
    }
  }

  function toTableData(arg) {
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

  // ===== 1) hook completo do console =====
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
    ];
    methods.forEach(
      (m) => (orig[m] = console[m] ? console[m].bind(console) : undefined)
    );

    function wrapSimple(type) {
      return function (...args) {
        pushEvent({ type, ts: Date.now(), args, indent: groupLevel });
        if (orig[type]) orig[type](...args);
      };
    }

    console.log = wrapSimple("log");
    console.info = wrapSimple("info");
    console.warn = wrapSimple("warn");
    console.debug = wrapSimple("debug");

    console.error = function (...args) {
      // tenta anexar stack
      if (!args.some((a) => a instanceof Error)) {
        try {
          args.push(new Error().stack);
        } catch {}
      }
      pushEvent({ type: "error", ts: Date.now(), args, indent: groupLevel });
      if (orig.error) orig.error(...args);
    };

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
      let tbl = toTableData(data);
      if (Array.isArray(columns) && columns.length) {
        tbl.cols = tbl.cols.filter((c) => columns.includes(c));
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
      if (!cond)
        pushEvent({ type: "assert", ts: Date.now(), args, indent: groupLevel });
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

    // erros globais
    window.addEventListener("error", (ev) => {
      pushEvent({
        type: "uncaught",
        ts: Date.now(),
        args: [
          ev.message,
          ev.filename,
          ev.lineno,
          ev.colno,
          ev.error && ev.error.stack ? ev.error.stack : ev.error,
        ],
        indent: 0,
      });
    });
    window.addEventListener("unhandledrejection", (ev) => {
      pushEvent({
        type: "unhandledrejection",
        ts: Date.now(),
        args: [
          ev.reason instanceof Error
            ? ev.reason.stack || ev.reason.message
            : safePreview(ev.reason),
        ],
        indent: 0,
      });
    });

    RCSHub.consoleBuffer = buffer;
    RCSHub.__consoleTimers = timers;
    RCSHub.__consoleCounters = counters;
    RCSHub.__consoleGroupLevel = groupLevel;
    RCSHub.__consoleHookedAll = true;
  }

  // ===== 2) VIGIA NETWORKLOG E TRANSFORMA 4xx/5xx EM EVENTO DE CONSOLE =====
  // se o core já está salvando em RCSHub.networkLog, a gente só consome aqui
  if (!RCSHub.__consoleNetWatcher) {
    const seen = new Set();
    RCSHub.__consoleNetWatcher = setInterval(() => {
      const net = RCSHub.networkLog || [];
      for (const req of net) {
        if (!req) continue;
        // dá um id estável
        const id =
          req.__id ||
          (req.__id = `${req.ts || req.time || Date.now()}:${
            req.method || "GET"
          }:${req.url}`);
        if (seen.has(id)) continue;

        // só loga se for erro
        if (typeof req.status === "number" && req.status >= 400) {
          pushEvent({
            type: "network-error",
            ts: req.ts || req.time || Date.now(),
            args: [
              `${req.method || "GET"} ${req.url}`,
              `status ${req.status}`,
              req.duration != null ? `${req.duration}ms` : "",
            ],
            indent: 0,
          });
        } else if (typeof req.status === "number") {
          // se quiser ver TUDO da rede, comenta o if acima e descomenta aqui
          // pushEvent({ type: 'network', ... })
        }

        seen.add(id);
      }
    }, 600);
  }

  // ===== 3) estilos =====
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

  // ===== 4) comando =====
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
          "network-error": "#f97316",
        }[t] || "#e2e8f0");

      function renderItem(ev) {
        const ts = new Date(ev.ts).toLocaleTimeString();
        const indent = (ev.indent || 0) * INDENT_STEP;
        const head = `
          <div class="rcs-con-head">
            <div class="rcs-con-type" style="color:${colorFor(ev.type)}">${
          ev.type
        }</div>
            <div class="rcs-con-ts">${ts}</div>
          </div>
        `;

        if (ev.type === "table" && ev.table) {
          const { cols, rows } = ev.table;
          const thead = `<tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>`;
          const tbody = rows
            .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
            .join("");
          return `<div class="rcs-con-line rcs-con-indent" style="--rcs-indent:${indent}px">${head}<div class="rcs-con-msg"><table class="rcs-con-table">${thead}${tbody}</table></div></div>`;
        }

        const msg =
          ev.args && ev.args.length
            ? ev.args.map((a) => safePreview(a)).join(" ")
            : "";

        return `<div class="rcs-con-line rcs-con-indent" style="--rcs-indent:${indent}px">${head}<div class="rcs-con-msg">${msg}</div></div>`;
      }

      return `
        <div class="rcs-con-wrap">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h3 style="margin:0;">Console — tempo real</h3>
              <p style="margin:0;font-size:10px;color:rgba(255,255,255,.4);">Captura console.*, erros globais e 4xx/5xx da network</p>
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
