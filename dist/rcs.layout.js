"use strict";
/// <reference path="./rcs.core.ts" />
var RCSHub;
(function (RCSHub) {
    // 👇 NÃO declara ROOT_ID aqui!
    // usa o que veio do core
    function getLayoutHTML() {
        return `
    <div class="rcs-hub">
      <!-- FAB -->
      <button class="rcs-hub__fab" title="RCS HUB">
        <span class="rcs-hub__dot"></span>
        RCS
      </button>

      <!-- PANEL -->
      <div class="rcs-hub__panel rcs-hub--hidden">
        <div class="rcs-hub__frame">
          <!-- topbar console -->
          <header class="rcs-hub__topbar">
            <div class="rcs-hub__leds">
              <span class="rcs-hub__led rcs-hub__led--ok" title="online"></span>
              <span class="rcs-hub__led rcs-hub__led--idle" title="idle"></span>
              <span class="rcs-hub__led rcs-hub__led--off" title="off"></span>
            </div>
            <div class="rcs-hub__topinfo">
              <span class="rcs-hub__tag">RCS HUB :: CONSOLE</span>
              <span class="rcs-hub__path">host: <strong id="rcs-hub-host"></strong></span>
            </div>
            <button class="rcs-hub__close" aria-label="Fechar">×</button>
          </header>

          <div class="rcs-hub__body">
            <!-- SIDEBAR -->
            <aside class="rcs-hub__sidebar">
              <button class="rcs-hub__item rcs-hub__item--active" data-rcs-tab="overview">
                <span class="rcs-hub__item-title">/overview</span>
                <small>status</small>
              </button>
              <button class="rcs-hub__item" data-rcs-tab="tools">
                <span class="rcs-hub__item-title">/tools</span>
                <small>comandos</small>
              </button>
              <button class="rcs-hub__item" data-rcs-tab="monitor">
                <span class="rcs-hub__item-title">/monitor</span>
                <small>logs</small>
              </button>
              <button class="rcs-hub__item" data-rcs-tab="console-live">
                <span class="rcs-hub__item-title">/console</span>
                <small>runtime</small>
              </button>
              <button class="rcs-hub__item" data-rcs-tab="network">
                <span class="rcs-hub__item-title">/network</span>
                <small>requisições</small>
              </button>
              <button class="rcs-hub__item" data-rcs-tab="config">
                <span class="rcs-hub__item-title">/config</span>
                <small>prefs</small>
              </button>
            </aside>

            <!-- MAIN -->
            <main class="rcs-hub__content">
              <!-- OVERVIEW -->
              <section class="rcs-hub__tab rcs-hub__tab--active" data-rcs-content="overview">
                <h2 class="rcs-hub__section-title">overview</h2>
                <p class="rcs-hub__section-sub">visão rápida do ambiente</p>

                <div class="rcs-hub__grid">
                  <div class="rcs-hub__card">
                    <span class="rcs-hub__card-label">estado</span>
                    <span class="rcs-hub__status rcs-hub__status--ok">ONLINE</span>
                    <small class="rcs-hub__card-foot" id="rcs-hub-host-sm"></small>
                  </div>
                  <div class="rcs-hub__card">
                    <span class="rcs-hub__card-label">uptime</span>
                    <span class="rcs-hub__metric" id="rcs-hub-uptime">00:00</span>
                    <small class="rcs-hub__card-foot">since injection</small>
                  </div>
                  <div class="rcs-hub__card">
                    <span class="rcs-hub__card-label">modo</span>
                    <span class="rcs-hub__metric">LEGACY</span>
                    <small class="rcs-hub__card-foot">tampermonkey</small>
                  </div>
                </div>

                <div class="rcs-hub__terminal">
                  <div class="rcs-hub__terminal-title">console</div>
                  <div class="rcs-hub__terminal-body" id="rcs-hub-terminal">
                    <pre>>> boot RCS HUB...</pre>
                    <pre>>> env: dark-console</pre>
                    <pre>>> ready.</pre>
                  </div>
                </div>
              </section>

              <!-- TOOLS -->
              <section class="rcs-hub__tab" data-rcs-content="tools">
                <h2 class="rcs-hub__section-title">tools</h2>
                <p class="rcs-hub__section-sub">aqui vamos jogar os módulos (SIGA, SIMEQ, DOM, copy, etc.)</p>

                <div class="rcs-hub__tools-list">
                  <button class="rcs-hub__tool-btn">> scan DOM atual</button>
                  <button class="rcs-hub__tool-btn">> copiar tabela</button>
                  <button class="rcs-hub__tool-btn">> abrir painel SIGA</button>
                  <button class="rcs-hub__tool-btn">> exportar JSON</button>
                </div>
              </section>

              <!-- MONITOR -->
              <section class="rcs-hub__tab" data-rcs-content="monitor">
                <h2 class="rcs-hub__section-title">monitor</h2>
                <p class="rcs-hub__section-sub">últimas ações do hub nesta página</p>
                <div class="rcs-hub__logbox" id="rcs-hub-logbox">
                  <p>[00:00] monitor iniciado.</p>
                </div>
              </section>

              <!-- CONSOLE LIVE -->
              <section class="rcs-hub__tab" data-rcs-content="console-live" id="rcs-hub-console-tab">
                <!-- carregado on-demand -->
              </section>

              <!-- NETWORK -->
              <section class="rcs-hub__tab" data-rcs-content="network">
                <h2 class="rcs-hub__section-title">network</h2>
                <p class="rcs-hub__section-sub">fetch + XHR capturados pelo hub</p>
                <div class="rcs-hub__network-list" id="rcs-hub-network-list"></div>
              </section>

              <!-- CONFIG -->
              <section class="rcs-hub__tab" data-rcs-content="config">
                <h2 class="rcs-hub__section-title">config</h2>
                <p class="rcs-hub__section-sub">preferências locais</p>
                <label class="rcs-hub__toggle">
                  <input type="checkbox" id="rcs-hub-autoshow" />
                  <span>abrir painel ao carregar páginas RCS*</span>
                </label>
                <small class="rcs-hub__muted">* depois mapeamos por hostname: siga.lojasmm.com.br, simeq..., etc.</small>
              </section>
            </main>

            <!-- RIGHT / CONSOLE META -->
            <aside class="rcs-hub__meta">
              <div class="rcs-hub__meta-head">session</div>
              <div class="rcs-hub__meta-row">
                <span>tabId</span>
                <code id="rcs-hub-tabid">#LOCAL</code>
              </div>
              <div class="rcs-hub__meta-row">
                <span>url</span>
                <code id="rcs-hub-url"></code>
              </div>
              <div class="rcs-hub__meta-row">
                <span>ts</span>
                <code id="rcs-hub-ts"></code>
              </div>
              <div class="rcs-hub__meta-divider"></div>
              <div class="rcs-hub__meta-head">quick</div>
              <button class="rcs-hub__quick">ping()</button>
              <button class="rcs-hub__quick">reload()</button>
              <button class="rcs-hub__quick">clear()</button>
            </aside>
          </div>
        </div>
      </div>
    </div>
    `;
    }
    RCSHub.getLayoutHTML = getLayoutHTML;
})(RCSHub || (RCSHub = {}));
