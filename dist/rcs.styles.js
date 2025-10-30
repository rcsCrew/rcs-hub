"use strict";
// src/rcs.styles.ts
/// <reference path="./rcs.layout.ts" />
var RCSHub;
(function (RCSHub) {
    RCSHub.hubCSS = `
    :root {
      /* PALHETA PRINCIPAL RCS */
      --rcs-bg-p: #0d0d0f;
      --rcs-bg-s: #111119;
      --rcs-bg-t: rgba(18, 19, 24, 0.55);
      --rcs-bg-q: #1d1e26;
      --rcs-bg-a: #0a0a0d;

      --rcs-surface: rgba(23, 24, 31, 0.5);
      --rcs-surface-solid: #191a22;

      --rcs-txt-s: rgba(249, 250, 250, 0.96);
      --rcs-txt-h: rgba(220, 223, 228, 0.65);
      --rcs-txt-m: rgba(220, 223, 228, 0.45);
      --rcs-txt-muted: rgba(220, 223, 228, 0.28);

      --rcs-accent: #4f8cff;
      --rcs-accent-soft: rgba(79, 140, 255, 0.08);
      --rcs-green: #2ecc71;
      --rcs-danger: #ff5c5c;
      --rcs-warn: #f6c744;

      --rcs-border: rgba(79, 140, 255, 0.08);
      --rcs-radius-lg: 18px;
      --rcs-radius-md: 12px;

      --rcs-shadow-1: 0 16px 50px rgba(0, 0, 0, 0.4);
    }

    #${RCSHub.ROOT_ID}, #${RCSHub.ROOT_ID} * {
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-sizing: border-box;
    }

    /* =============================
       WRAPPER
    ============================== */
    .rcs-hub {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 999999;
      pointer-events: none;
    }

    /* =============================
       FAB
    ============================== */
    .rcs-hub__fab {
      pointer-events: auto;
      background: radial-gradient(circle at 20% 20%, rgba(79,140,255,.35), rgba(13,13,15,1));
      border: 1px solid rgba(79,140,255,0.3);
      color: #fff;
      border-radius: 999px;
      padding: 6px 20px 6px 36px;
      font-weight: 600;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      position: relative;
      cursor: pointer;
      box-shadow: 0 14px 25px rgba(0,0,0,0.35);
      backdrop-filter: blur(22px);
    }
    .rcs-hub__fab:hover {
      background: radial-gradient(circle at 20% 20%, rgba(79,140,255,.5), rgba(13,13,15,1));
    }
    .rcs-hub__dot {
      width: 13px;
      height: 13px;
      background: var(--rcs-green);
      border-radius: 999px;
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      box-shadow: 0 0 20px rgba(46,204,113,.6);
    }

    /* =============================
       PANEL
    ============================== */
    .rcs-hub__panel {
      pointer-events: auto;
      position: fixed;
      bottom: 66px;
      right: 16px;
      width: 900px;
      max-width: calc(100vw - 32px);
      height: 520px;
      background:
        radial-gradient(circle at top, rgba(16,16,17,0.8), rgba(5,5,6,0.95)),
        linear-gradient(180deg, rgba(16, 16, 19, 0.7) 0%, rgba(5,5,5,1) 100%);
      border: 1px solid var(--rcs-border);
      border-radius: var(--rcs-radius-lg);
      box-shadow: var(--rcs-shadow-1);
      backdrop-filter: blur(14px);
      transition: opacity .15s ease-out, transform .15s ease-out;
      color: var(--rcs-txt-s);
    }
    .rcs-hub--hidden {
      opacity: 0;
      transform: translateY(12px);
      pointer-events: none;
    }

    .rcs-hub__frame {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-image:
        linear-gradient(0deg, rgba(255,255,255,0.012) 1px, rgba(0,0,0,0) 1px),
        linear-gradient(90deg, rgba(255,255,255,0.012) 1px, rgba(0,0,0,0) 1px);
      background-size: 24px 24px;
      border-radius: var(--rcs-radius-lg);
      overflow: hidden;
    }

    /* =============================
       TOPBAR
    ============================== */
    .rcs-hub__topbar {
      height: 36px;
      background: linear-gradient(90deg, rgba(11,11,12,1) 0%, rgba(13,19,30,1) 100%);
      border-bottom: 1px solid rgba(79,140,255,0.08);
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 12px;
    }
    .rcs-hub__leds {
      display: flex;
      gap: 5px;
    }
    .rcs-hub__led {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      opacity: .85;
    }
    .rcs-hub__led--ok { background: #2ecc71; box-shadow: 0 0 10px rgba(46,204,113,.7); }
    .rcs-hub__led--idle { background: #f1c40f; }
    .rcs-hub__led--off { background: #e74c3c; }
    .rcs-hub__topinfo {
      display: flex;
      flex-direction: column;
      line-height: 1.08;
    }
    .rcs-hub__tag {
      font-size: 11px;
      color: rgba(249,250,250,0.9);
      letter-spacing: .03em;
    }
    .rcs-hub__path {
      font-size: 10px;
      color: rgba(249,250,250,0.42);
    }
    .rcs-hub__close {
      margin-left: auto;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.03);
      color: #fff;
      width: 22px;
      height: 22px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      transition: background .12s ease-out;
    }
    .rcs-hub__close:hover {
      background: rgba(231,76,60,0.35);
    }

    /* =============================
       BODY
    ============================== */
    .rcs-hub__body {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    /* =============================
       SIDEBAR
    ============================== */
    .rcs-hub__sidebar {
      width: 155px;
      border-right: 1px solid rgba(79,140,255,0.02);
      background: radial-gradient(circle, rgba(12,12,12,0.4) 0%, rgba(0,0,0,0) 70%), rgba(0,0,0,0.1);
      padding: 10px 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .rcs-hub__item {
      background: rgba(12,12,12,0.08);
      border: 1px solid rgba(255,255,255,0.005);
      color: rgba(249,250,250,0.82);
      border-radius: 10px;
      padding: 7px 8px;
      text-align: left;
      cursor: pointer;
      transition: background .1s ease-out, border .1s ease-out, transform .1s ease-out;
    }
    .rcs-hub__item-title {
      display: block;
      font-size: 12px;
    }
    .rcs-hub__item small {
      font-size: 10px;
      color: rgba(250,250,250,0.28);
    }
    .rcs-hub__item--active,
    .rcs-hub__item:hover {
      background: radial-gradient(circle at top, rgba(79,140,255,0.23), rgba(10,10,10,0));
      border: 1px solid rgba(79,140,255,0.35);
      color: #fff;
      transform: translateY(-1px);
    }

    /* =============================
       CONTENT
    ============================== */
    .rcs-hub__content {
      flex: 1.4;
      padding: 12px 14px;
      overflow-y: auto;
    }
    .rcs-hub__section-title {
      font-size: 12px;
      text-transform: lowercase;
      color: rgba(249,250,250,0.96);
      margin-bottom: 2px;
      letter-spacing: .01em;
    }
    .rcs-hub__section-sub {
      font-size: 11px;
      color: rgba(249,250,250,0.35);
      margin-bottom: 10px;
    }

    .rcs-hub__tab { display: none; }
    .rcs-hub__tab--active { display: block; }

    /* =============================
       GRID / CARDS
    ============================== */
    .rcs-hub__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    }
    .rcs-hub__card {
      background: linear-gradient(140deg, rgba(25,25,27,0.58), rgba(15,16,20,0));
      border: 1px solid rgba(79,140,255,0.025);
      border-radius: 12px;
      padding: 8px 9px 7px;
      backdrop-filter: blur(10px);
    }
    .rcs-hub__card-label {
      font-size: 10px;
      text-transform: uppercase;
      color: rgba(249,250,250,0.55);
      letter-spacing: .06em;
    }
    .rcs-hub__status {
      display: inline-flex;
      margin-top: 4px;
      font-weight: 600;
      font-size: 12.5px;
      align-items: center;
      gap: 5px;
    }
    .rcs-hub__status--ok::before {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: #2ecc71;
      box-shadow: 0 0 10px rgba(46,204,113,.6);
    }
    .rcs-hub__metric {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
    }
    .rcs-hub__card-foot {
      display: block;
      margin-top: 3px;
      font-size: 10px;
      color: rgba(249,250,250,0.25);
    }

    /* =============================
       TERMINAL
    ============================== */
    .rcs-hub__terminal {
      margin-top: 8px;
      background: radial-gradient(circle, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 60%), rgba(0,0,0,0.1);
      border: 1px solid rgba(79,140,255,0.025);
      border-radius: 10px;
      overflow: hidden;
    }
    .rcs-hub__terminal-title {
      background: rgba(255,255,255,0.015);
      padding: 5px 8px;
      color: rgba(249,250,250,0.65);
      font-size: 11px;
      border-bottom: 1px solid rgba(79,140,255,0.02);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .rcs-hub__terminal-title::after {
      content: '● ● ●';
      font-size: 8px;
      color: rgba(249,250,250,0.09);
      letter-spacing: 0.25em;
    }
    .rcs-hub__terminal-body {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 11.3px;
      padding: 6px 8px 10px;
      max-height: 150px;
      overflow-y: auto;
      line-height: 1.4;
      background: radial-gradient(circle at 15% 20%, rgba(79,140,255,0.02), rgba(0,0,0,0));
    }
    .rcs-hub__terminal-body pre {
      margin: 0;
      color: rgba(248, 251, 255, 0.8);
    }
    .rcs-hub__terminal-body pre:nth-child(1) { color: #4f8cff; }
    .rcs-hub__terminal-body pre:nth-child(2) { color: rgba(248,251,255,0.55); }

    /* =============================
       TOOLS
    ============================== */
    .rcs-hub__tools-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .rcs-hub__tool-btn {
      background: rgba(0,0,0,0.25);
      border: 1px solid rgba(79,140,255,0.14);
      color: #fff;
      border-radius: 8px;
      font-size: 11.5px;
      padding: 6px 10px;
      cursor: pointer;
      transition: background .12s ease-out, transform .12s ease-out;
    }
    .rcs-hub__tool-btn:hover {
      background: rgba(79,140,255,0.22);
      transform: translateY(-1px);
    }

    /* =============================
       LOGBOX
    ============================== */
    .rcs-hub__logbox {
      background: rgba(0,0,0,0.15);
      border: 1px solid rgba(79,140,255,0.02);
      border-radius: 10px;
      min-height: 90px;
      max-height: 240px;
      overflow-y: auto;
      font-size: 11px;
      padding: 6px 7px 10px;
      line-height: 1.5;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    .rcs-hub__logbox p {
      margin: 0 0 3px;
      color: rgba(249,250,250,0.73);
    }

    /* =============================
       CONFIG
    ============================== */
    .rcs-hub__toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      color: rgba(249,250,250,0.85);
      cursor: pointer;
      margin-bottom: 4px;
    }
    .rcs-hub__toggle input {
      accent-color: var(--rcs-accent);
    }
    .rcs-hub__muted {
      font-size: 10px;
      color: rgba(249,250,250,0.35);
    }

    /* =============================
       META (LADO DIREITO)
    ============================== */
    .rcs-hub__meta {
      width: 180px;
      border-left: 1px solid rgba(79,140,255,0.03);
      background: radial-gradient(circle, rgba(79,140,255,0.08) 0%, rgba(7,7,7,0) 50%), rgba(7,7,7,0.12);
      padding: 10px 9px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .rcs-hub__meta-head {
      font-size: 10.6px;
      text-transform: uppercase;
      color: rgba(249,250,250,0.45);
      letter-spacing: .06em;
      margin-bottom: 3px;
    }
    .rcs-hub__meta-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .rcs-hub__meta-row span {
      font-size: 10px;
      color: rgba(249,250,250,0.38);
    }
    .rcs-hub__meta-row code {
      font-size: 10px;
      background: rgba(0,0,0,0.35);
      border: 1px solid rgba(255,255,255,0.014);
      border-radius: 6px;
      padding: 2px 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rcs-hub__meta-divider {
      height: 1px;
      background: rgba(249,250,250,0.02);
      margin: 4px 0;
    }
    .rcs-hub__quick {
      background: rgba(0,0,0,0.24);
      border: 1px solid rgba(79,140,255,0.05);
      color: #fff;
      border-radius: 6px;
      padding: 4px 6px;
      font-size: 10.5px;
      text-align: left;
      cursor: pointer;
      transition: background .12s ease-out;
    }
    .rcs-hub__quick:hover {
      background: rgba(79,140,255,0.12);
    }

    /* =============================
       SCROLLBAR
    ============================== */
    .rcs-hub__content::-webkit-scrollbar,
    .rcs-hub__terminal-body::-webkit-scrollbar,
    .rcs-hub__logbox::-webkit-scrollbar {
      width: 6px;
    }
    .rcs-hub__content::-webkit-scrollbar-thumb,
    .rcs-hub__terminal-body::-webkit-scrollbar-thumb,
    .rcs-hub__logbox::-webkit-scrollbar-thumb {
      background: rgba(249,250,250,.14);
      border-radius: 99px;
    }

    /* =============================
       RESPONSIVO
    ============================== */
    @media (max-width: 1000px) {
      .rcs-hub__meta { display: none; }
      .rcs-hub__panel { width: calc(100vw - 32px); }
    }
    @media (max-width: 720px) {
      .rcs-hub__sidebar { display: none; }
      .rcs-hub__content { flex: 1; }
    }
          /* ====== CONSOLE LIVE ====== */
    .rcs-hub__console-toolbar {
      display: flex;
      gap: 6px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }
    .rcs-hub__console-stream {
      background: rgba(0,0,0,0.25);
      border: 1px solid rgba(79,140,255,0.02);
      border-radius: 8px;
      max-height: 230px;
      overflow-y: auto;
      padding: 4px 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 11.5px;
    }
    .rcs-hub__console-line {
      display: grid;
      grid-template-columns: 52px 48px 1fr;
      gap: 6px;
      align-items: center;
      padding: 2px 0;
    }
    .rcs-hub__console-ts {
      color: rgba(249,250,250,0.28);
      font-size: 10px;
    }
    .rcs-hub__console-level {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: .05em;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.01);
      border-radius: 4px;
      padding: 1px 4px 0;
      text-align: center;
    }
    .rcs-hub__console-msg {
      word-break: break-word;
    }
    .rcs-hub__console-line--log .rcs-hub__console-level { color: #fff; }
    .rcs-hub__console-line--info .rcs-hub__console-level { color: #4f8cff; }
    .rcs-hub__console-line--warn .rcs-hub__console-level { color: #f6c744; }
    .rcs-hub__console-line--error .rcs-hub__console-level { color: #ff5c5c; }

    /* ====== NETWORK ====== */
    .rcs-hub__network-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 260px;
      overflow-y: auto;
    }
    .rcs-hub__network-item {
      background: rgba(0,0,0,0.16);
      border: 1px solid rgba(79,140,255,0.02);
      border-radius: 8px;
      padding: 5px 6px 3px;
    }
    .rcs-hub__network-head {
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      gap: 6px;
      align-items: center;
      margin-bottom: 4px;
    }
    .rcs-hub__network-method {
      font-size: 10px;
      text-transform: uppercase;
      background: rgba(79,140,255,0.12);
      border: 1px solid rgba(79,140,255,0.2);
      border-radius: 4px;
      padding: 1px 6px 0;
      color: rgba(249,250,250,0.9);
    }
    .rcs-hub__network-url {
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: rgba(249,250,250,0.88);
    }
    .rcs-hub__network-status {
      font-size: 11px;
      font-weight: 600;
    }
    .rcs-hub__network-status--2 { color: #2ecc71; }
    .rcs-hub__network-status--3 { color: #f6c744; }
    .rcs-hub__network-status--4,
    .rcs-hub__network-status--5 { color: #ff5c5c; }
    .rcs-hub__network-ts {
      font-size: 10px;
      color: rgba(249,250,250,0.35);
      text-align: right;
    }
    .rcs-hub__network-body {
      display: grid;
      gap: 3px;
    }
    .rcs-hub__network-payload,
    .rcs-hub__network-response {
      background: rgba(0,0,0,0.25);
      border-radius: 6px;
      padding: 3px 4px 4px;
      font-size: 10.5px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .rcs-hub__network-payload--empty,
    .rcs-hub__network-response--empty {
      color: rgba(249,250,250,0.2);
    }

  `;
})(RCSHub || (RCSHub = {}));
