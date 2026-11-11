<h1 id="top" align="center">Server Card Plus</h1>

<p align="center">
  <a href="https://github.com/hacs/integration">
    <img src="https://img.shields.io/badge/hacs-custom-orange.svg?style=for-the-badge" alt="HACS">
  </a>
  <a href="https://github.com/braticks/server-card-plus/releases/">
    <img src="https://img.shields.io/github/release/xBourner/server-card-plus?style=for-the-badge" alt="GitHub release">
  </a>
  <a href="https://github.com/braticks/server-card-plus/issues">
    <img src="https://img.shields.io/github/issues/xBourner/server-card-plus?style=for-the-badge" alt="Issues">
  </a>
</p>

## Overview

**Server Card Plus** is a system monitor card for Home Assistant and the Proxmox VE
integration. It finds your host, VMs and containers automatically and shows CPU, RAM,
disk usage and online status – in three designs, with optional disk temperatures and
start / reboot / shutdown / stop controls.

## 📖 Documentation

Installation, configuration and troubleshooting:
**[xbourner.github.io/card-docu/server-card-plus](https://xbourner.github.io/card-docu/server-card-plus/)**

## 📥 Installation

### HACS

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=xBourner&repository=server-card-plus&category=plugin)

Add `https://github.com/braticks/server-card-plus` as a custom repository (category
**Dashboard**), install the card and clear your browser cache.

### Manual

Copy `dist/server-card-plus.js` to `config/www/` and register it as a resource
(`/local/server-card-plus.js`, type **JavaScript Module**).

Then add the card via **Edit dashboard → Add card → Server Card Plus**.

## 🛠️ Development

```bash
npm install
npm run build   # → dist/server-card-plus.js
```

## License

MIT – see [LICENSE](LICENSE).

## Braticks fork: extended Rack details and application logos

This fork keeps the upstream Rack / Classic / Circles designs and adds:

- Application logo detection for Proxmox guests, based on the **selfh.st icon library used by Community Scripts**. A missing/unrecognized app keeps an MDI icon. Actual HA friendly names are preferred over stale entity IDs.
- Optional `gpu_entity` and `cpu_temp_entity` (host, Rack layout).
- Optional `disk_details` with usage %, temperature, SMART health; compact rows in Rack view.
- Updated visual editor toggles for brand icons, CPU temperature and GPU sensors.

**The logos are fetched from a public CDN.** Set `show_service_icons: false` to use only MDI icons. No runtime access to community-scripts.org or Proxmox credentials is required.

### Example: generic Proxmox host (replace placeholder entity IDs)

The configuration below is **illustrative**; substitute entity IDs from your own Home Assistant installation. Do not copy internal hostnames, addresses or private sensors into a public issue or repository.

```yaml
type: custom:server-card-plus
mode: single
node: node_yourhost
title: Proxmox Host
design: rack
show_controls: false
show_service_icons: true
show_hdd_temp: false
cpu_temp_entity: sensor.example_cpu_temperature
gpu_entity: sensor.example_gpu_usage
disk_details:
  - name: SSD
    usage_entity: sensor.example_ssd_used_percent
    temperature_entity: sensor.example_ssd_temperature
    health_entity: binary_sensor.example_ssd_health
    temp_warning: 40
    temp_critical: 60
  - name: HDD1
    usage_entity: sensor.example_hdd1_used_percent
    temperature_entity: sensor.example_hdd1_temperature
    health_entity: binary_sensor.example_hdd1_health
    temp_warning: 35
    temp_critical: 50
```

Disk details support as many drives as needed. The health indicator currently treats `off` as OK and `on` as warning; check whether your integration uses the same convention. Missing sensors display `–`, not `0`. CPU/RAM/Disk percentage bars are detected from Proxmox sensors, or can be provided through HA Template Helpers.

### Showing LXC/VM application logos

```yaml
type: custom:server-card-plus
mode: dashboard
design: rack
show_service_icons: true
show_controls: false
hidden_systems:
  - node_yourhost
```

Known services (AdGuard Home, Frigate, Plex, Emby, Music Assistant, Node-RED, qBittorrent, etc.) receive images; an unsupported or missing image falls back to MDI. Icons are matched by the Proxmox integration's displayed friendly name when possible, so a renamed guest can still match.

**Install:** Remove the upstream `xBourner/server-card-plus` resource before installing this fork from HACS (Dashboard repository `braticks/server-card-plus`). Both builds register the same `custom:server-card-plus` type and must not be active simultaneously. Do not delete your dashboard cards: their YAML remains compatible. Use Ctrl+Shift+R after installing.

Original project: [xBourner/server-card-plus](https://github.com/xBourner/server-card-plus).
