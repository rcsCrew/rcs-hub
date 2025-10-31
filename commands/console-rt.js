// src/commands/console-rt.js
(function (RCSHub) {
  const MAX_STRING = 10_000;
  const INDENT_STEP = 14;
  const buffer = RCSHub.consoleBuffer || [];
  const timers = RCSHub.__consoleTimers || new Map();
  const counters = RCSHub.__consoleCounters || new Map();
  let groupLevel = RCSHub.__consoleGroupLevel || 0;
  let seq = RCSHub.__consoleSeq || 1;

  function safePreview(v, depth, seen) {
    depth = depth || 0;
    seen = seen || new Set();
    try {
      if (v === null) return "null";
      const t = typeof v;
      if (t === "string")
        return v.length > MAX_STRING ? v.slice(0, MAX_STRING) + "…" : v;
      if (t === "number" || t === "boolean" || t === "bigint" || t === "symbol")
        return String(v);
      if (t === "undefined") return "undefined";
      if (t === "function") return "[Function " + (v.name || "anonymous") + "]";
      if (v instanceof Error)
        return v.name + ": " + v.message + "\n" + (v.stack || "");
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
        return (
          "[" +
          v
            .map(function (x) {
              return safePreview(x, depth + 1, seen);
            })
            .join(", ") +
          "]"
        );
      }
      const out = {};
      const keys = Object.keys(v).slice(0, 80);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        out[k] = safePreview(v[k], depth + 1, seen);
      }
      return JSON.stringify(out);
    } catch (e) {
      return String(v);
    }
  }

  function toTableData(arg) {
    if (
      Array.isArray(arg) &&
      arg.every(function (row) {
        return typeof row === "object";
      })
    ) {
      const cols = Array.from(
        new Set(
          arg
            .map(function (r) {
              return Object.keys(r);
            })
            .reduce(function (acc, cur) {
              return acc.concat(cur);
            }, [])
        )
      ).slice(0, 20);
      const rows = arg.slice(0, 50).map(function (r) {
        return cols.map(function (c) {
          return safePreview(r[c]);
        });
      });
      return { cols: cols, rows: rows };
    }
    if (arg && typeof arg === "object") {
      const cols = ["(index)", "value"];
      const rows = Object.entries(arg)
        .slice(0, 50)
        .map(function (pair) {
          return [pair[0], safePreview(pair[1])];
        });
      return { cols: cols, rows: rows };
    }
    return { cols: ["value"], rows: [[safePreview(arg)]] };
  }

  function pushEvent(ev) {
    ev.__id = ev.__id || seq++;
    buffer.unshift(ev);
    RCSHub.__consoleSeq = seq;
    RCSHub.consoleBuffer = buffer;
  }

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
    methods.forEach(function (m) {
      orig[m] = console[m] ? console[m].bind(console) : undefined;
    });

    function wrapSimple(type) {
      return function () {
        pushEvent({
          type: type,
          ts: Date.now(),
          args: Array.prototype.slice.call(arguments),
          indent: groupLevel,
        });
        if (orig[type]) orig[type].apply(console, arguments);
      };
    }

    console.log = wrapSimple("log");
    console.info = wrapSimple("info");
    console.warn = wrapSimple("warn");
    console.debug = wrapSimple("debug");

    console.error = function () {
      const args = Array.prototype.slice.call(arguments);
      if (
        !args.some(function (a) {
          return a instanceof Error;
        })
      ) {
        try {
          args.push(new Error().stack);
        } catch (e) {}
      }
      pushEvent({
        type: "error",
        ts: Date.now(),
        args: args,
        indent: groupLevel,
      });
      if (orig.error) orig.error.apply(console, args);
    };

    console.trace = function () {
      const args = Array.prototype.slice.call(arguments);
      const stack = new Error("trace").stack;
      pushEvent({
        type: "trace",
        ts: Date.now(),
        args: args.concat(stack),
        indent: groupLevel,
      });
      if (orig.trace) orig.trace.apply(console, arguments);
    };

    console.group = function () {
      const label = Array.prototype.slice.call(arguments);
      pushEvent({
        type: "group",
        ts: Date.now(),
        args: label,
        indent: groupLevel,
      });
      groupLevel++;
      if (orig.group) orig.group.apply(console, label);
    };
    console.groupCollapsed = function () {
      const label = Array.prototype.slice.call(arguments);
      pushEvent({
        type: "groupCollapsed",
        ts: Date.now(),
        args: label,
        indent: groupLevel,
      });
      groupLevel++;
      if (orig.groupCollapsed) orig.groupCollapsed.apply(console, label);
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
        tbl.cols = tbl.cols.filter(function (c) {
          return columns.indexOf(c) !== -1;
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

    console.time = function (label) {
      label = label || "default";
      timers.set(label, performance.now());
      pushEvent({
        type: "time",
        ts: Date.now(),
        args: [label],
        indent: groupLevel,
      });
      if (orig.time) orig.time(label);
    };
    console.timeLog = function (label) {
      label = label || "default";
      const extra = Array.prototype.slice.call(arguments, 1);
      const t0 = timers.get(label);
      const delta = t0 != null ? performance.now() - t0 : undefined;
      pushEvent({
        type: "timeLog",
        ts: Date.now(),
        args: [label, delta].concat(extra),
        indent: groupLevel,
      });
      if (orig.timeLog) orig.timeLog.apply(console, [label].concat(extra));
    };
    console.timeEnd = function (label) {
      label = label || "default";
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

    console.assert = function (cond) {
      const rest = Array.prototype.slice.call(arguments, 1);
      if (!cond) {
        pushEvent({
          type: "assert",
          ts: Date.now(),
          args: rest,
          indent: groupLevel,
        });
      }
      if (orig.assert) orig.assert(cond);
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
    console.dirxml = function () {
      const args = Array.prototype.slice.call(arguments);
      pushEvent({
        type: "dirxml",
        ts: Date.now(),
        args: args,
        indent: groupLevel,
      });
      if (orig.dirxml) orig.dirxml.apply(console, args);
    };

    console.clear = function () {
      pushEvent({
        type: "clear",
        ts: Date.now(),
        args: [],
        indent: 0,
      });
      if (orig.clear) orig.clear();
    };

    console.count = function (label) {
      label = label || "default";
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
    console.countReset = function (label) {
      label = label || "default";
      counters.set(label, 0);
      pushEvent({
        type: "countReset",
        ts: Date.now(),
        args: [label],
        indent: groupLevel,
      });
      if (orig.countReset) orig.countReset(label);
    };

    window.addEventListener("error", function (ev) {
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
    window.addEventListener("unhandledrejection", function (ev) {
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

  // puxa erros da network e joga no console
  if (!RCSHub.__consoleNetWatcher) {
    const seen = new Set();
    RCSHub.__consoleNetWatcher = setInterval(function () {
      const net = RCSHub.networkLog || [];
      for (let i = 0; i < net.length; i++) {
        const req = net[i];
        if (!req) continue;
        const id =
          req.__id ||
          (req.__id =
            (req.ts || req.time || Date.now()) +
            ":" +
            (req.method || "GET") +
            ":" +
            req.url);
        if (seen.has(id)) continue;

        if (typeof req.status === "number" && req.status >= 400) {
          pushEvent({
            type: "network-error",
            ts: req.ts || req.time || Date.now(),
            args: [
              (req.method || "GET") + " " + req.url,
              "status " + req.status,
              req.duration != null ? req.duration + "ms" : "",
            ],
            indent: 0,
          });
        }
        seen.add(id);
      }
    }, 600);
  }

  RCSHub.injectCSS(`
    .rcs-con-wrap { display:flex; flex-direction:column; gap:6px; height:100%; }
    .rcs-con-list { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:4px; }
    .rcs-con-line { background:rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.02); border-radius:8px; padding:6px 8px; }
    .rcs-con-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:2px; }
    .rcs-con-type { font-size:10px; text-transform:uppercase; letter-spacing:.04em; }
    .rcs-con-ts { font-size:9px; color:rgba(255,255,255,.35); }
    .rcs-con-msg { font-size:11px; white-space:pre-wrap; word-break:break-word; }
  `);

  RCSHub.registerCommand({
    id: "console-rt",
    name: "Console (RT)",
    render: function () {
      return (
        '<div class="rcs-con-wrap">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<div><h3 style="margin:0;">Console — tempo real</h3>' +
        '<p style="margin:0;font-size:10px;color:rgba(255,255,255,.4);">append-only • console.*, erros globais e network 4xx/5xx</p>' +
        "</div>" +
        '<span id="rcs-con-count" style="font-size:10px;color:rgba(255,255,255,0.45);">' +
        (RCSHub.consoleBuffer || []).length +
        " eventos</span>" +
        "</div>" +
        '<div class="rcs-con-list" id="rcs-con-list"></div>' +
        "</div>"
      );
    },
    onShow: function (container) {
      const list = container.querySelector("#rcs-con-list");
      const countEl = container.querySelector("#rcs-con-count");
      if (!list) return;

      let lastRendered = 0;

      function renderNew() {
        const items = RCSHub.consoleBuffer || [];
        const pending = [];
        for (let i = items.length - 1; i >= 0; i--) {
          const ev = items[i];
          if (!ev.__id) continue;
          if (ev.__id > lastRendered) pending.push(ev);
        }
        pending
          .sort(function (a, b) {
            return a.__id - b.__id;
          })
          .forEach(function (ev) {
            const el = document.createElement("div");
            el.className = "rcs-con-line";
            const colors = {
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
            };
            const color = colors[ev.type] || "#e2e8f0";
            const ts = new Date(ev.ts).toLocaleTimeString();
            const indent = (ev.indent || 0) * INDENT_STEP;
            el.style.marginLeft = indent + "px";

            if (ev.type === "table" && ev.table) {
              const cols = ev.table.cols;
              const rows = ev.table.rows;
              const thead =
                "<tr>" +
                cols
                  .map(function (c) {
                    return "<th>" + c + "</th>";
                  })
                  .join("") +
                "</tr>";
              const tbody = rows
                .map(function (r) {
                  return (
                    "<tr>" +
                    r
                      .map(function (c) {
                        return "<td>" + c + "</td>";
                      })
                      .join("") +
                    "</tr>"
                  );
                })
                .join("");
              el.innerHTML =
                '<div class="rcs-con-head">' +
                '<div class="rcs-con-type" style="color:' +
                color +
                '">' +
                ev.type +
                "</div>" +
                '<div class="rcs-con-ts">' +
                ts +
                "</div>" +
                "</div>" +
                '<div class="rcs-con-msg">' +
                '<table style="width:100%;border-collapse:collapse;font-size:10.5px;">' +
                thead +
                tbody +
                "</table>" +
                "</div>";
            } else {
              const msg =
                ev.args && ev.args.length
                  ? ev.args
                      .map(function (a) {
                        return safePreview(a);
                      })
                      .join(" ")
                  : "";
              el.innerHTML =
                '<div class="rcs-con-head">' +
                '<div class="rcs-con-type" style="color:' +
                color +
                '">' +
                ev.type +
                "</div>" +
                '<div class="rcs-con-ts">' +
                ts +
                "</div>" +
                "</div>" +
                '<div class="rcs-con-msg">' +
                msg +
                "</div>";
            }

            list.appendChild(el);
            lastRendered = ev.__id;
          });

        if (countEl) {
          countEl.textContent =
            (RCSHub.consoleBuffer || []).length + " eventos";
        }
      }

      renderNew();

      const int = setInterval(function () {
        if (!container.isConnected) return clearInterval(int);
        renderNew();
      }, 800);
    },
  });
})(RCSHub);
