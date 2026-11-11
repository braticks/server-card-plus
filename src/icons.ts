/* Auto icon per system (simple-icons for known apps, mdi fallback per kind). */
const SI: Record<string, string> = {
  adguard: 'simple-icons:adguard',
  authentik: 'simple-icons:authentik',
  changedetection: 'simple-icons:changedetection',
  cloudflared: 'simple-icons:cloudflare',
  docker: 'simple-icons:docker',
  frigate: 'simple-icons:frigate',
  homepage: 'simple-icons:homepage',
  immich: 'simple-icons:immich',
  nginxproxymanager: 'simple-icons:nginx',
  omada: 'simple-icons:omadacloud',
  paperless: 'simple-icons:paperless',
  uptimekuma: 'simple-icons:uptimekuma',
  vaultwarden: 'simple-icons:bitwarden',
  bitwarden: 'simple-icons:bitwarden',
  homeassistant: 'simple-icons:homeassistant',
  haos: 'simple-icons:homeassistant',
  pve: 'simple-icons:proxmox',
  proxmox: 'simple-icons:proxmox',
  pihole: 'simple-icons:pihole',
  plex: 'simple-icons:plex',
  jellyfin: 'simple-icons:jellyfin',
  nextcloud: 'simple-icons:nextcloud',
  wireguard: 'simple-icons:wireguard',
  tailscale: 'simple-icons:tailscale',
  grafana: 'simple-icons:grafana',
  portainer: 'simple-icons:portainer',
  truenas: 'simple-icons:truenas',
  unifi: 'simple-icons:ubiquiti',
  homebridge: 'simple-icons:homebridge',
  nodered: 'simple-icons:nodered',
  esphome: 'simple-icons:esphome',
  zigbee2mqtt: 'simple-icons:zigbee',
};

export function systemIcon(key: string): string {
  const name = key
    .replace(/^(node|lxc|qemu)_/, '')
    .replace(/_\d+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (SI[name]) return SI[name];
  if (key.startsWith('lxc_')) return 'mdi:docker';
  if (key.startsWith('qemu_')) return 'mdi:chip';
  return 'mdi:server';
}

// Community Scripts uses the selfh.st icon library for application logos.
// Only known slugs are requested; unknown software keeps its built-in MDI icon.
// The real displayed Home Assistant name takes priority over an old entity_id.
const SELFHST_SLUGS: Record<string, string> = {
  adguard: "adguard-home", adguardhome: "adguard-home",
  actual: "actual-budget", actualbudget: "actual-budget",
  authentik: "authentik", changedetection: "changedetection-io",
  cloudflared: "cloudflare", cloudflare: "cloudflare",
  debian: "debian", docker: "docker", duplicati: "duplicati",
  emby: "emby", esphome: "esphome", frigate: "frigate",
  grafana: "grafana", glances: "glances", haiptv: "home-assistant",
  homeassistant: "home-assistant", homeassistantos: "home-assistant",
  haos: "home-assistant", homepage: "homepage", immich: "immich",
  jellyfin: "jellyfin", mariadb: "mariadb",
  musicassistant: "music-assistant", navidrome: "navidrome",
  nodered: "node-red", nginxproxymanager: "nginx-proxy-manager",
  paperless: "paperless-ngx", plex: "plex", portainer: "portainer",
  proxmox: "proxmox", pve: "proxmox", qbittorrent: "qbittorrent",
  radarr: "radarr", samba: "samba", sonarr: "sonarr",
  tailscale: "tailscale", truenas: "truenas",
  uptimekuma: "uptime-kuma", vaultwarden: "vaultwarden",
  wireguard: "wireguard", zigbee2mqtt: "zigbee2mqtt",
};

function appSlug(value: string): string {
  return value.toLowerCase()
    .replace(/\(\d+\).*$/, "")
    .replace(/^(lxc|qemu|vm|node)[ _-]+/, "")
    .replace(/[ _-]+(status|locked|health)$/, "")
    .replace(/[^a-z0-9]/g, "");
}

export function serviceLogoUrl(key: string, friendlyName?: string | null): string | null {
  if (key.startsWith("node_")) return null;
  const keyName = key.replace(/^(lxc|qemu)_/, "").replace(/_\d+$/, "");
  const slug = (friendlyName && SELFHST_SLUGS[appSlug(friendlyName)])
    || SELFHST_SLUGS[appSlug(keyName)];
  return slug
    ? `https://cdn.jsdelivr.net/gh/selfhst/icons@main/webp/${slug}.webp`
    : null;
}
