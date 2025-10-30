"use strict";
// src/commands/console/console.ts (versão browser pura)
/// <reference path="../../rcs.core.ts" />

var RCSHub;
(function (RCSHub) {
  var Console;
  (function (Console) {
    // buffer global (pra mesmo se carregar de novo, não perder)
    var g = typeof window !== "undefined" ? window : globalThis;
    if (!g.__RCS_HUB_CONSOLE_BUFFER) {
      g.__RCS_HUB_CONSOLE_BUFFER = [];
    }
    var buffer = g.__RCS_HUB_CONSOLE_BUFFER;

    var hooked = false;
    var currentFilter = "all";

    function now() {
      return new Date().toTimeString().slice(0, 8);
    }

    function renderEntry(entry) {
      var container = document.getElementById("rcs-hub-console-stream");
      if (!container) return;

      // respeita filtro
      if (currentFilter !== "all" && entry.level !== currentFilter) {
        return;
      }

      var row = document.createElement("div");
      row.className =
        "rcs-hub__console-line rcs-hub__console-line--" + entry.level;
      row.innerHTML =
        '<span class="rcs-hub__console-ts">' +
        entry.ts +
        "</span>" +
        '<span class="rcs-hub__console-level">' +
        entry.level +
        "</span>" +
        '<span class="rcs-hub__console-msg">' +
        entry.msg +
        "</span>";

      container.appendChild(row);
      container.scrollTop = container.scrollHeight;
    }

    function flushAll() {
      var container = document.getElementById("rcs-hub-console-stream");
      if (!container) return;
      container.innerHTML = "";
      for (var i = 0; i < buffer.length; i++) {
        var entry = buffer[i];
        if (currentFilter === "all" || currentFilter === entry.level) {
          renderEntry(entry);
        }
      }
    }

    // ====== HOOK EARLY (roda já na carga do arquivo) ======
    function hookConsoleEarly() {
      if (hooked) return;
      hooked = true;

      var origLog = console.log;
      var origInfo = console.info;
      var origWarn = console.warn;
      var origErr = console.error;

      function capture(level, args) {
        var msg = args
          .map(function (a) {
            if (typeof a === "string") return a;
            try {
              return JSON.stringify(a);
            } catch (e) {
              return String(a);
            }
          })
          .join(" ");

        var entry = {
          level: level,
          msg: msg,
          ts: now(),
        };

        buffer.push(entry);
        if (buffer.length > 200) {
          buffer.shift();
        }

        // se a aba já estiver aberta, renderiza na hora
        renderEntry(entry);
      }

      console.log = function () {
        capture("log", Array.prototype.slice.call(arguments));
        return origLog.apply(console, arguments);
      };
      console.info = function () {
        capture("info", Array.prototype.slice.call(arguments));
        return origInfo.apply(console, arguments);
      };
      console.warn = function () {
        capture("warn", Array.prototype.slice.call(arguments));
        return origWarn.apply(console, arguments);
      };
      console.error = function () {
        capture("error", Array.prototype.slice.call(arguments));
        return origErr.apply(console, arguments);
      };

      // registra que o hook entrou
      // (isso já vai aparecer no buffer e depois na UI)
      buffer.push({
        level: "info",
        msg: "[rcs-hub] console hook ativo",
        ts: now(),
      });
    }

    // ====== UI (carrega só quando clicar na aba) ======
    function renderLayout() {
      var tab = document.querySelector('[data-rcs-content="console-live"]');
      if (!tab) return;

      tab.innerHTML =
        "" +
        '<h2 class="rcs-hub__section-title">console runtime</h2>' +
        '<p class="rcs-hub__section-sub">tudo que cair em console.* desta aba aparece aqui</p>' +
        '<div class="rcs-hub__console-toolbar">' +
        '  <button class="rcs-hub__tool-btn" data-rcs-console-filter="all">all</button>' +
        '  <button class="rcs-hub__tool-btn" data-rcs-console-filter="log">log</button>' +
        '  <button class="rcs-hub__tool-btn" data-rcs-console-filter="info">info</button>' +
        '  <button class="rcs-hub__tool-btn" data-rcs-console-filter="warn">warn</button>' +
        '  <button class="rcs-hub__tool-btn" data-rcs-console-filter="error">error</button>' +
        '  <button class="rcs-hub__tool-btn" id="rcs-hub-console-clear">clear</button>' +
        "</div>" +
        '<div class="rcs-hub__console-stream" id="rcs-hub-console-stream"></div>';
    }

    function bindActions() {
      var tab = document.querySelector('[data-rcs-content="console-live"]');
      if (!tab) return;

      // filtros
      var btns = tab.querySelectorAll("[data-rcs-console-filter]");
      for (var i = 0; i < btns.length; i++) {
        (function (btn) {
          btn.addEventListener("click", function () {
            var lvl = btn.getAttribute("data-rcs-console-filter");
            currentFilter = lvl || "all";
            flushAll();
          });
        })(btns[i]);
      }

      // clear
      var clearBtn = document.getElementById("rcs-hub-console-clear");
      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          buffer.length = 0;
          var container = document.getElementById("rcs-hub-console-stream");
          if (container) container.innerHTML = "";
        });
      }
    }

    function init() {
      // injeta CSS do console
      if (RCSHub && typeof RCSHub.appendStyle === "function") {
        // mesmo CSS da tua console.style.ts
        var css =
          "" +
          ".rcs-hub__console-toolbar{display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap;}" +
          '.rcs-hub__console-stream{background:rgba(0,0,0,.25);border:1px solid rgba(79,140,255,.02);border-radius:8px;max-height:230px;overflow-y:auto;padding:4px 6px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:11.5px;}' +
          ".rcs-hub__console-line{display:grid;grid-template-columns:52px 48px 1fr;gap:6px;align-items:center;padding:2px 0;}" +
          ".rcs-hub__console-ts{color:rgba(249,250,250,.28);font-size:10px;}" +
          ".rcs-hub__console-level{font-size:10px;text-transform:uppercase;letter-spacing:.05em;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.01);border-radius:4px;padding:1px 4px 0;text-align:center;}" +
          ".rcs-hub__console-msg{word-break:break-word;}" +
          ".rcs-hub__console-line--info .rcs-hub__console-level{color:#4f8cff;}" +
          ".rcs-hub__console-line--warn .rcs-hub__console-level{color:#f6c744;}" +
          ".rcs-hub__console-line--error .rcs-hub__console-level{color:#ff5c5c;}";
        RCSHub.appendStyle("rcs-hub-console-style", css);
      }

      renderLayout();
      bindActions();
      flushAll(); // mostra o que já tinha no buffer
    }

    // registra no core pra carregar SÓ quando clicar na aba
    if (RCSHub && typeof RCSHub.registerTabLoader === "function") {
      RCSHub.registerTabLoader("console-live", init);
    }

    // IMPORTANTÍSSIMO: hooka já!
    hookConsoleEarly();
  })((Console = RCSHub.Console || (RCSHub.Console = {})));
})(RCSHub || (RCSHub = {}));
