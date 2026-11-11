/*
 * Server Card Plus - visual Lovelace card editor.
 *
 * Uses native HA UI elements, exactly like calendar-card-plus:
 *   - ha-selector  : the official HA selector component (select, text, number)
 *   - ha-expansion-panel : grouping
 *
 * The "Server" field is a `ha-selector` with a `select` selector whose
 * options are populated dynamically from discoverSystems(hass) -> every
 * Proxmox node / VM / LXC. Selection is reported via @value-changed with
 * ev.detail.value (the HA-native pattern).
 */
import { LitElement, html, css, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { HomeAssistant, LovelaceCardEditor } from "./ha/types";
import { fireEvent } from "./ha/fire_event";
import { discoverSystems, displayName, detectControls } from "./detect";
import { CardConfig, SystemOverride } from "./config";
import { systemIcon } from "./icons";
import { t } from "./i18n";

type StyleField = "warn" | "crit" | "color_ok" | "color_warn" | "color_crit" | "accent";

// Thresholds + colours: global in the card, and again per system as override.
const STYLE_FIELDS: Array<[StyleField, Record<string, any>, Parameters<typeof t>[1]]> = [
  ["warn", { number: { min: 0, max: 100, mode: "box" } }, "e_warn"],
  ["crit", { number: { min: 0, max: 100, mode: "box" } }, "e_crit"],
  ["color_ok", { color_rgb: {} }, "e_color_ok"],
  ["color_warn", { color_rgb: {} }, "e_color_warn"],
  ["color_crit", { color_rgb: {} }, "e_color_crit"],
  ["accent", { color_rgb: {} }, "e_accent"],
];
const DEFAULTS: Partial<Record<StyleField, number>> = { warn: 75, crit: 90 };

@customElement("server-card-plus-editor")
export class ServerCardPlusEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config: CardConfig = {
    type: "custom:server-card-plus",
  };

  @state() private _expanded = new Set<string>();

  public set config(c: CardConfig) {
    this.setConfig(c);
  }

  public setConfig(config: CardConfig): void {
    this._config = config;
  }

  private _t(key: Parameters<typeof t>[1]): string {
    return t(this.hass, key);
  }

  private _commit(config: CardConfig) {
    this._config = config;
    fireEvent(this, "config-changed", { config });
  }

  private _toggleHidden(ev: Event, systemKey: string) {
    ev.stopPropagation();
    const hidden = new Set(this._config.hidden_systems ?? []);
    if (!hidden.delete(systemKey)) hidden.add(systemKey);
    this._commit({ ...this._config, hidden_systems: [...hidden] });
  }

  private _toggleExpand(ev: Event, systemKey: string) {
    ev.stopPropagation();
    const next = new Set(this._expanded);
    if (!next.delete(systemKey)) next.add(systemKey);
    this._expanded = next;
  }

  private _overrideChanged(ev: CustomEvent, systemKey: string, field: keyof SystemOverride) {
    const value = ev.detail?.value;
    const overrides = { ...(this._config.overrides ?? {}) };
    const current: Record<string, any> = { ...(overrides[systemKey] ?? {}) };
    if (value === undefined || value === null || value === "") delete current[field];
    else current[field] = value;
    if (Object.keys(current).length === 0) delete overrides[systemKey];
    else overrides[systemKey] = current;
    this._commit({ ...this._config, overrides });
  }

  private _valueChanged(field: string, value: unknown): void {
    if (this._config[field] === value) return;
    const next: CardConfig = { ...this._config };
    if (value === undefined || value === null || value === "") delete next[field];
    else next[field] = value;
    this._commit(next);
  }

  private _field(selector: Record<string, any>, label: string, value: unknown, onChange: (ev: CustomEvent) => void) {
    return html`<ha-selector
      .hass=${this.hass}
      .selector=${selector}
      .value=${value}
      .label=${label}
      @value-changed=${onChange}
    ></ha-selector>`;
  }

  /** Config field bound to the top-level card config. */
  private _cfg(selector: Record<string, any>, label: string, field: string, fallback: unknown = "") {
    return this._field(selector, label, this._config[field] ?? fallback, (ev) =>
      this._valueChanged(field, ev.detail?.value),
    );
  }

  private _select(options: Array<[string, Parameters<typeof t>[1] | string]>, raw = false) {
    return {
      select: {
        mode: "dropdown",
        options: options.map(([value, label]) => ({
          value,
          label: raw ? label : this._t(label as Parameters<typeof t>[1]),
        })),
      },
    };
  }

  protected render(): TemplateResult {
    if (!this.hass) return html``;
    const ids = Object.keys(this.hass.states);
    const systems = discoverSystems(ids);
    const dashboard = this._config.mode === "dashboard";
    const kindShort = (k: string) => this._t(`short_${k}` as Parameters<typeof t>[1]);
    const noButtons =
      this._config.show_controls &&
      !systems.some((s) => Object.values(detectControls(s.key, ids)).some(Boolean));

    return html`
      ${this._cfg(
        this._select([
          ["single", "e_mode_single"],
          ["dashboard", "e_mode_dashboard"],
        ]),
        this._t("e_mode"),
        "mode",
        "single",
      )}
      ${this._cfg(
        this._select([
          ["classic", "e_design_classic"],
          ["circles", "e_design_circles"],
          ["rack", "e_design_rack"],
        ]),
        this._t("e_design"),
        "design",
        "classic",
      )}
      ${this._cfg({ boolean: {} }, this._t("e_hdd"), "show_hdd_temp", false)}
      ${this._cfg({ boolean: {} }, "Application logos (selfh.st / Community Scripts)", "show_service_icons", true)}
      ${this._cfg({ boolean: {} }, this._t("e_controls"), "show_controls", false)}
      ${noButtons ? html`<div class="hint">${this._t("e_no_buttons")}</div>` : ""}

      ${!dashboard
        ? html`
            ${this._cfg(
              this._select(
                [
                  ["auto", this._t("e_auto")],
                  ...systems.map(
                    (s) => [s.key, `${kindShort(s.kind)} — ${displayName(s.key)}`] as [string, string],
                  ),
                ],
                true,
              ),
              this._t("e_server"),
              "node",
              "auto",
            )}
            ${this._cfg({ text: {} }, this._t("e_title"), "title")}
            ${this._cfg({ icon: {} }, this._t("e_icon"), "icon")}
          `
        : ""}

      ${!dashboard && this._config.design === "rack" ? html`
        <ha-expansion-panel outlined .header=${"Rack: host hardware"}>
          <div class="panel">
            ${this._cfg({ entity: { domain: "sensor" } }, "CPU temperature sensor", "cpu_temp_entity")}
            ${this._cfg({ entity: { domain: "sensor" } }, "GPU usage sensor", "gpu_entity")}
            <div class="hint">Individual SSD/HDD usage, temperature and SMART sensors can be added under disk_details in YAML.</div>
          </div>
        </ha-expansion-panel>
      ` : ""}
      <ha-expansion-panel outlined .header=${this._t("e_style")}>
        <div class="panel">
          ${STYLE_FIELDS.map(([field, selector, label]) =>
            this._cfg(selector, this._t(label), field, DEFAULTS[field] ?? ""),
          )}
        </div>
      </ha-expansion-panel>

      ${dashboard && systems.length
        ? html`
            <div class="list-title">${this._t("e_systems")}</div>
            <div class="entities-list">
              ${systems.map((s) => {
                const isHidden = (this._config.hidden_systems ?? []).includes(s.key);
                const open = this._expanded.has(s.key);
                const ov = (this._config.overrides ?? {})[s.key] ?? {};
                const ovField = (selector: Record<string, any>, label: string, field: keyof SystemOverride, value: unknown) =>
                  this._field(selector, label, value, (e) => this._overrideChanged(e, s.key, field));
                return html`
                  <div class="entity-row ${isHidden ? "disabled" : ""}">
                    <div class="entity-row-top">
                      <ha-icon icon=${ov.icon || systemIcon(s.key)} class="system-icon"></ha-icon>
                      <div class="entity-info">
                        <span class="entity-name">${ov.title || displayName(s.key)}</span>
                        <span class="entity-id">${kindShort(s.kind)} · ${s.key}</span>
                      </div>
                      <ha-button
                        size="small"
                        appearance="filled"
                        variant="brand"
                        class="${isHidden ? "action-show" : "action-hide"}"
                        @click=${(e: Event) => this._toggleHidden(e, s.key)}
                      >
                        ${this._t(isHidden ? "e_show" : "e_hide")}
                      </ha-button>
                      <ha-icon-button
                        .label=${this._t(open ? "e_collapse" : "e_expand")}
                        @click=${(e: Event) => this._toggleExpand(e, s.key)}
                      >
                        <ha-icon icon=${open ? "mdi:chevron-up" : "mdi:chevron-down"}></ha-icon>
                      </ha-icon-button>
                    </div>
                    ${open
                      ? html`
                          <div class="entity-row-bottom">
                            ${ovField({ text: {} }, this._t("e_title"), "title", ov.title ?? "")}
                            ${ovField({ icon: {} }, this._t("e_icon"), "icon", ov.icon ?? "")}
                            ${STYLE_FIELDS.map(([field, selector, label]) =>
                              ovField(
                                selector,
                                this._t(label),
                                field,
                                ov[field] ?? this._config[field] ?? DEFAULTS[field] ?? "",
                              ),
                            )}
                          </div>
                        `
                      : ""}
                  </div>
                `;
              })}
            </div>
          `
        : ""}

      ${systems.length === 0 ? html`<div class="error">${this._t("e_none")}</div>` : ""}
    `;
  }

  static styles = css`
    :host {
      display: block;
      padding: 4px 0;
    }
    ha-selector {
      display: block;
      margin-bottom: 12px;
    }
    ha-expansion-panel {
      margin-bottom: 12px;
    }
    .panel {
      padding-top: 12px;
    }
    .hint {
      margin: -4px 0 12px;
      font-size: 0.8rem;
      color: var(--warning-color, #ffa600);
    }
    .error {
      margin-top: 8px;
      color: var(--error-color);
    }
    .list-title {
      margin: 4px 0 6px;
      font-size: 0.78rem;
      color: var(--secondary-text-color);
    }
    .entities-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-bottom: 12px;
    }
    .entity-row {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--divider-color, #eee);
      border-radius: 8px;
      transition: opacity 0.2s;
    }
    .entity-row-top {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }
    .entity-row-bottom {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 4px;
    }
    .entity-row.disabled {
      opacity: 0.55;
    }
    .system-icon {
      --mdc-icon-size: 20px;
      color: var(--secondary-text-color);
      flex-shrink: 0;
    }
    .entity-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .entity-name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .entity-id {
      font-size: 0.85em;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .entity-row-top ha-button,
    .entity-row-top ha-icon-button {
      flex-shrink: 0;
    }
    .action-hide {
      --mdc-theme-primary: var(--error-color, #db4437);
    }
    .action-show {
      --mdc-theme-primary: var(--primary-color, #03a9f4);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "server-card-plus-editor": ServerCardPlusEditor;
  }
}
