/**
 * RCS HUB — Console interno de logs
 * Tipos: info, debug, error, post, get
 * Mostra no console e envia para o painel HUB (se presente)
 */

export type LogType = "info" | "debug" | "error" | "post" | "get";

interface RCSLogEntry {
  type: LogType;
  time: string;
  message: string;
}

export class RCSConsole {
  private static logBox: HTMLElement | null = null;
  private static logs: RCSLogEntry[] = [];

  /** Inicializa ligação com o painel */
  static init(selector = "#rcs-hub-logbox"): void {
    this.logBox = document.querySelector(selector);
    this.info("RCSConsole iniciado");
  }

  /** Log geral com tipo */
  private static write(type: LogType, message: string): void {
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);
    const entry: RCSLogEntry = { type, time, message };

    // salva em memória
    this.logs.push(entry);

    // imprime no console do navegador
    const color =
      type === "error"
        ? "#e74c3c"
        : type === "debug"
        ? "#9b59b6"
        : type === "post"
        ? "#3498db"
        : type === "get"
        ? "#1abc9c"
        : "#bdc3c7";
    console.log(
      `%c[${type.toUpperCase()}] %c${time} → %c${message}`,
      `color:${color}; font-weight:700;`,
      "color:gray;",
      "color:white;"
    );

    // adiciona ao painel HUB
    if (this.logBox) {
      const p = document.createElement("p");
      p.className = `rcs-log rcs-log--${type}`;
      p.textContent = `[${time}] (${type}) ${message}`;
      this.logBox.appendChild(p);
      this.logBox.scrollTop = this.logBox.scrollHeight;
    }
  }

  /* Métodos públicos */
  static info(msg: string): void {
    this.write("info", msg);
  }
  static debug(msg: string): void {
    this.write("debug", msg);
  }
  static error(msg: string): void {
    this.write("error", msg);
  }
  static post(url: string): void {
    this.write("post", `POST → ${url}`);
  }
  static get(url: string): void {
    this.write("get", `GET → ${url}`);
  }

  /** Recupera logs em JSON */
  static export(): RCSLogEntry[] {
    return this.logs;
  }
}
