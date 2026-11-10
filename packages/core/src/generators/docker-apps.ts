import { DockerAppId, UserCriteria } from '../types.js';

export interface DockerAppDefinition {
  id: DockerAppId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  defaultPort: string;
  webUrl: string;
  category: 'media' | 'homelab' | 'smart-home' | 'ai' | 'cloud' | 'web';
  generateCompose: (criteria: UserCriteria) => string;
}

export const DOCKER_APPS_REGISTRY: DockerAppDefinition[] = [
  {
    id: 'immich',
    name: 'Immich',
    tagline: 'Self-Hosted AI Photo & Video Backup',
    description: 'High-performance Google Photos & iCloud replacement with face recognition, map view, and mobile auto-upload.',
    icon: '📸',
    defaultPort: '2283',
    webUrl: 'http://localhost:2283',
    category: 'cloud',
    generateCompose: () => `# ==============================================================================
# DistroTailor: Immich Turnkey Docker Stack
# Google Photos & iCloud Replacement with Mobile Auto-Backup & Vector Search
# Web Interface: http://localhost:2283
# ==============================================================================
name: immich

services:
  immich-server:
    container_name: immich_server
    image: ghcr.io/immich-app/immich-server:release
    volumes:
      - /opt/immich/upload:/usr/src/app/upload
      - /etc/localtime:/etc/localtime:ro
    environment:
      - NODE_ENV=production
      - DB_HOSTNAME=immich_postgres
      - DB_USERNAME=postgres
      - DB_PASSWORD=postgrespassword
      - DB_DATABASE_NAME=immich
      - REDIS_HOSTNAME=immich_redis
    ports:
      - "2283:2283"
    depends_on:
      - redis
      - database
    restart: always

  immich-machine-learning:
    container_name: immich_machine_learning
    image: ghcr.io/immich-app/immich-machine-learning:release
    volumes:
      - model-cache:/cache
    restart: always

  redis:
    container_name: immich_redis
    image: registry.hub.docker.com/library/redis:6.2-alpine
    restart: always

  database:
    container_name: immich_postgres
    image: registry.hub.docker.com/tensorchord/pgvecto-rs:pg14-v0.2.0
    environment:
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_USER: postgres
      POSTGRES_DB: immich
      POSTGRES_INITDB_ARGS: '--data-checksums'
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: always

volumes:
  pgdata:
  model-cache:
`
  },
  {
    id: 'home-assistant',
    name: 'Home Assistant',
    tagline: 'Local-First Smart Home Hub',
    description: 'Connect Zigbee, Matter, Z-Wave, and smart appliances without vendor clouds or proprietary bridges.',
    icon: '🏡',
    defaultPort: '8123',
    webUrl: 'http://localhost:8123',
    category: 'smart-home',
    generateCompose: () => `# ==============================================================================
# DistroTailor: Home Assistant Turnkey Docker Stack
# Local-First Smart Home Hub (Zigbee, Matter, HomeKit & MQTT)
# Web Interface: http://localhost:8123
# ==============================================================================
services:
  homeassistant:
    container_name: homeassistant
    image: ghcr.io/home-assistant/home-assistant:stable
    volumes:
      - /opt/homeassistant/config:/config
      - /etc/localtime:/etc/localtime:ro
      - /run/dbus:/run/dbus:ro
    restart: unless-stopped
    privileged: true
    network_mode: host
`
  },
  {
    id: 'jellyfin',
    name: 'Jellyfin',
    tagline: 'Private Media & Movie Streaming Server',
    description: '100% Free Software alternative to Plex/Emby with zero tracking, free hardware transcoding, and client apps for all devices.',
    icon: '🎬',
    defaultPort: '8096',
    webUrl: 'http://localhost:8096',
    category: 'media',
    generateCompose: () => `# ==============================================================================
# DistroTailor: Jellyfin Media Server Stack
# Self-Hosted Movie, TV & Music Streaming (Free Hardware Transcoding)
# Web Interface: http://localhost:8096
# ==============================================================================
services:
  jellyfin:
    container_name: jellyfin
    image: jellyfin/jellyfin:latest
    user: 1000:1000
    network_mode: 'bridge'
    volumes:
      - /opt/jellyfin/config:/config
      - /opt/jellyfin/cache:/cache
      - /opt/jellyfin/media:/media
    ports:
      - "8096:8096"
    restart: unless-stopped
`
  },
  {
    id: 'pihole',
    name: 'Pi-hole',
    tagline: 'Network-Wide Ad & Tracker Blocker',
    description: 'DNS sinkhole protecting every phone, laptop, and smart TV on your home Wi-Fi from malicious telemetry and invasive ads.',
    icon: '🛡️',
    defaultPort: '80',
    webUrl: 'http://localhost:80/admin',
    category: 'homelab',
    generateCompose: () => `# ==============================================================================
# DistroTailor: Pi-hole Network-Wide Ad Blocker
# DNS Sinkhole for Wi-Fi Telemetry & Tracker Blocking
# Admin Dashboard: http://localhost:80/admin (Default password: admin)
# ==============================================================================
services:
  pihole:
    container_name: pihole
    image: pihole/pihole:latest
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "80:80/tcp"
    environment:
      TZ: 'UTC'
      WEBPASSWORD: 'admin'
    volumes:
      - '/opt/pihole/etc-pihole:/etc/pihole'
      - '/opt/pihole/etc-dnsmasq.d:/etc/dnsmasq.d'
    restart: unless-stopped
`
  },
  {
    id: 'ollama',
    name: 'Ollama + Open-WebUI',
    tagline: 'Private Local AI LLM ChatGPT Stack',
    description: 'Run Llama 3, DeepSeek, and Mistral 100% locally with a modern ChatGPT-style web UI and zero cloud data leaks.',
    icon: '🤖',
    defaultPort: '3000',
    webUrl: 'http://localhost:3000',
    category: 'ai',
    generateCompose: () => `# ==============================================================================
# DistroTailor: Ollama + Open-WebUI Local AI LLM Stack
# Run DeepSeek, Llama 3, and Mistral with Private ChatGPT Web UI
# Web Interface: http://localhost:3000 | Ollama API: http://localhost:11434
# ==============================================================================
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    restart: unless-stopped

  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: open-webui
    volumes:
      - open_webui_data:/app/backend/data
    ports:
      - "3000:8080"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped
    depends_on:
      - ollama

volumes:
  ollama_data:
  open_webui_data:
`
  },
  {
    id: 'nextcloud',
    name: 'Nextcloud Hub',
    tagline: 'Private Cloud Storage, Office & Calendar',
    description: 'Full-featured self-hosted Google Drive / Dropbox alternative with file sync, WebDAV, notes, and collaborative office suite.',
    icon: '☁️',
    defaultPort: '8080',
    webUrl: 'http://localhost:8080',
    category: 'cloud',
    generateCompose: () => `# ==============================================================================
# DistroTailor: Nextcloud Hub Private Cloud Stack
# File Storage, WebDAV, Calendar & Document Collaboration
# Web Interface: http://localhost:8080
# ==============================================================================
services:
  db:
    image: mariadb:10.11
    command: --transaction-isolation=READ-COMMITTED --binlog-format=ROW
    restart: always
    volumes:
      - db_data:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=nextcloudsecret
      - MYSQL_PASSWORD=nextcloudsecret
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud

  app:
    image: nextcloud:apache
    restart: always
    ports:
      - "8080:80"
    volumes:
      - nextcloud_data:/var/www/html
    environment:
      - MYSQL_PASSWORD=nextcloudsecret
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_HOST=db
    depends_on:
      - db

volumes:
  db_data:
  nextcloud_data:
`
  },
  {
    id: 'lamp-wordpress',
    name: 'LAMP + WordPress',
    tagline: 'Classic LAMP Stack (PuPHPet Homage)',
    description: 'The definitive web development staple: Apache, PHP, MariaDB, and WordPress pre-wired with persistence.',
    icon: '🌐',
    defaultPort: '8000',
    webUrl: 'http://localhost:8000',
    category: 'web',
    generateCompose: () => `# ==============================================================================
# DistroTailor: Classic LAMP + WordPress Stack
# Homage to PuPHPet (Apache, PHP 8, MariaDB & WordPress)
# Web Interface: http://localhost:8000 | MySQL: localhost:3306
# ==============================================================================
services:
  db:
    image: mariadb:10.11
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: lamprootpassword
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wpuser
      MYSQL_PASSWORD: wppassword
    volumes:
      - db_data:/var/lib/mysql

  wordpress:
    image: wordpress:latest
    restart: always
    ports:
      - "8000:80"
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_USER: wpuser
      WORDPRESS_DB_PASSWORD: wppassword
      WORDPRESS_DB_NAME: wordpress
    volumes:
      - wp_data:/var/www/html
    depends_on:
      - db

volumes:
  db_data:
  wp_data:
`
  },
  {
    id: 'tailscale',
    name: 'Tailscale Subnet Router',
    tagline: 'Zero-Config Mesh VPN & Remote Access',
    description: 'Secure WireGuard mesh network to access your home server from anywhere without port forwarding or public IPs.',
    icon: '🔒',
    defaultPort: 'N/A',
    webUrl: 'https://login.tailscale.com/admin',
    category: 'homelab',
    generateCompose: () => `# ==============================================================================
# DistroTailor: Tailscale Subnet Router & Mesh VPN
# Secure Remote Access Without Port Forwarding
# Dashboard: https://login.tailscale.com/admin
# ==============================================================================
services:
  tailscale:
    image: tailscale/tailscale:latest
    container_name: tailscale
    hostname: tailored-node
    environment:
      - TS_STATE_DIR=/var/lib/tailscale
      - TS_USERSPACE=false
    volumes:
      - /opt/tailscale/state:/var/lib/tailscale
      - /dev/net/tun:/dev/net/tun
    cap_add:
      - NET_ADMIN
      - NET_RAW
    restart: unless-stopped
`
  },
  {
    id: 'uptime-kuma',
    name: 'Uptime Kuma',
    tagline: 'Self-Hosted Uptime & Service Monitor',
    description: 'Fancy status page and uptime monitor for HTTP, TCP, Ping, DNS, and Docker containers with Discord/Telegram alerts.',
    icon: '📊',
    defaultPort: '3001',
    webUrl: 'http://localhost:3001',
    category: 'homelab',
    generateCompose: () => `# ==============================================================================
# DistroTailor: Uptime Kuma Self-Hosted Monitoring
# Real-Time Service Status, Health Checks & Incident Alerts
# Web Dashboard: http://localhost:3001
# ==============================================================================
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    volumes:
      - /opt/uptime-kuma/data:/app/data
    ports:
      - "3001:3001"
    restart: always
`
  }
];

export function getDockerApp(id?: DockerAppId): DockerAppDefinition | undefined {
  if (!id || id === 'none') return undefined;
  return DOCKER_APPS_REGISTRY.find((app) => app.id === id);
}
