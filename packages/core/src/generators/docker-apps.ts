import { CpuArchitecture, DockerAppId, UserCriteria } from '../types.js';

export interface DockerAppDefinition {
  id: DockerAppId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  defaultPort: string;
  webUrl: string;
  category: 'media' | 'homelab' | 'smart-home' | 'ai' | 'cloud' | 'web';
  /** Optional group name for mutually similar tools where users typically pick one (e.g. 'DNS Ad-Blocker'). */
  pairGroup?: string;
  /** Official upstream compose / docs URL so users can inspect latest upstream env vars. */
  upstreamComposeUrl?: string;
  minRamMb: number;
  architectures: CpuArchitecture[];
  generateCompose: (criteria: UserCriteria) => string;
}

export interface AppCompatibility {
  compatible: boolean;
  warnings: string[];
  blocker?: string;
}

export function checkDockerAppCompatibility(
  app: DockerAppDefinition,
  criteria: UserCriteria
): AppCompatibility {
  const warnings: string[] = [];

  // Hard blocker 1: NOMMU / Microcontrollers
  if (criteria.architecture === 'nommu') {
    return {
      compatible: false,
      warnings: [],
      blocker: 'Microcontrollers (NOMMU) lack hardware memory management and cannot run Docker container engines.'
    };
  }

  // Hard blocker 2: Architecture compatibility
  if (criteria.architecture && !app.architectures.includes(criteria.architecture)) {
    return {
      compatible: false,
      warnings: [],
      blocker: `${app.name} container images do not support ${criteria.architecture} hardware.`
    };
  }

  // Soft warning / Budget check: RAM
  if (criteria.maxRamMb && criteria.maxRamMb < app.minRamMb) {
    const formatted = app.minRamMb >= 1024 ? `${(app.minRamMb / 1024).toFixed(0)} GB` : `${app.minRamMb} MB`;
    warnings.push(`Exceeds your ${criteria.maxRamMb} MB budget (requires ~${formatted} RAM).`);
  }

  // Soft warning: ComfyUI CUDA acceleration requires proprietary NVIDIA drivers when strictly FOSS is requested
  if (app.id === 'comfyui' && criteria.driverPhilosophy === 'free-software-only') {
    warnings.push('ComfyUI CUDA acceleration requires proprietary NVIDIA drivers (CPU-only generation is very slow).');
  }

  return {
    compatible: true,
    warnings
  };
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
    pairGroup: 'Photo Library',
    upstreamComposeUrl: 'https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml',
    minRamMb: 4096,
    architectures: ['x86_64', 'arm64'],
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
    minRamMb: 1024,
    architectures: ['x86_64', 'arm64', 'armv7'],
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
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64'],
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
    pairGroup: 'DNS Ad-Blocker',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Pi-hole Network-Wide Ad Blocker
# DNS Sinkhole for Wi-Fi Telemetry & Tracker Blocking
# Admin Dashboard: http://localhost:80/admin
# There is no preset password; Pi-hole generates one on first start. Find it with
#   docker logs pihole | grep -i password
# and set your own with: docker exec -it pihole pihole setpassword
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
    upstreamComposeUrl: 'https://github.com/open-webui/open-webui/blob/main/docker-compose.yaml',
    minRamMb: 8192,
    architectures: ['x86_64', 'arm64'],
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
    minRamMb: 1536,
    architectures: ['x86_64', 'arm64', 'armv7'],
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
    tagline: 'Classic LAMP Stack (Apache, PHP, MariaDB)',
    description: 'The definitive web development staple: Apache, PHP, MariaDB, and WordPress pre-wired with persistence.',
    icon: '🌐',
    defaultPort: '8000',
    webUrl: 'http://localhost:8000',
    category: 'web',
    pairGroup: 'Web CMS',
    minRamMb: 1024,
    architectures: ['x86_64', 'arm64', 'armv7'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Classic LAMP + WordPress Stack
# Web Application Stack (Apache, PHP 8, MariaDB & WordPress)
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
    minRamMb: 128,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64', 'mips'],
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
    minRamMb: 512,
    architectures: ['x86_64', 'arm64', 'armv7'],
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
  },
  {
    id: 'vaultwarden',
    name: 'Vaultwarden (Passwords)',
    tagline: 'Bitwarden-Compatible Password Manager',
    description: 'Lightweight Rust-based self-hosted password vault compatible with all official Bitwarden browser & mobile apps.',
    icon: '🔐',
    defaultPort: '8080',
    webUrl: 'http://localhost:8080',
    category: 'homelab',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64', 'armv7'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Vaultwarden Self-Hosted Password Manager
# Compatible with Bitwarden Desktop, Mobile & Browser Extensions
# Web Vault: http://localhost:8080
# ==============================================================================
services:
  vaultwarden:
    image: vaultwarden/server:latest
    container_name: vaultwarden
    volumes:
      - /opt/vaultwarden/data:/data
    ports:
      - "8080:80"
    restart: unless-stopped
`
  },
  {
    id: 'gitea',
    name: 'Gitea (Self-Hosted Git)',
    tagline: 'Lightweight GitHub-Style Code Forge',
    description: 'Fast, painless self-hosted Git service with pull requests, issue tracker, package registry, and Actions CI.',
    icon: '🍵',
    defaultPort: '3000',
    webUrl: 'http://localhost:3000',
    category: 'homelab',
    pairGroup: 'Git Forge',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64', 'armv7'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Gitea Self-Hosted Git Forge
# Web UI: http://localhost:3000 | SSH Git: port 2222
# Complete initial admin setup in the web installer on first launch.
# ==============================================================================
services:
  gitea:
    image: gitea/gitea:latest
    container_name: gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
    volumes:
      - /opt/gitea/data:/data
    ports:
      - "3000:3000"
      - "2222:22"
    restart: unless-stopped
`
  },
  {
    id: 'nginx-proxy-manager',
    name: 'Nginx Proxy Manager',
    tagline: 'Visual Reverse Proxy & Auto-HTTPS',
    description: 'Point-and-click web UI to expose your self-hosted services with automatic free Let’s Encrypt SSL certificates.',
    icon: '🚦',
    defaultPort: '81',
    webUrl: 'http://localhost:81',
    category: 'web',
    pairGroup: 'Reverse Proxy',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Nginx Proxy Manager
# HTTP: 80 | HTTPS: 443 | Admin UI: http://localhost:81
# ==============================================================================
services:
  npm:
    image: jc21/nginx-proxy-manager:latest
    container_name: nginx-proxy-manager
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - /opt/npm/data:/data
      - /opt/npm/letsencrypt:/etc/letsencrypt
    restart: unless-stopped
`
  },
  {
    id: 'portainer',
    name: 'Portainer CE (Docker UI)',
    tagline: 'Visual Container & Stack Management',
    description: 'Clean web dashboard to inspect, update, and manage Docker containers, volumes, networks, and Compose stacks.',
    icon: '🐳',
    defaultPort: '9443',
    webUrl: 'https://localhost:9443',
    category: 'homelab',
    pairGroup: 'Docker UI',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64', 'armv7'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Portainer Community Edition
# Create your admin password on first visit at https://localhost:9443
# ==============================================================================
services:
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    ports:
      - "9443:9443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /opt/portainer/data:/data
    restart: unless-stopped
`
  },
  {
    id: 'ghost',
    name: 'Ghost CMS',
    tagline: 'Modern Node.js Publishing & Newsletters',
    description: 'Fast, clean alternative to WordPress for blogs, publications, memberships, and email newsletters.',
    icon: '👻',
    defaultPort: '2368',
    webUrl: 'http://localhost:2368/ghost',
    category: 'web',
    pairGroup: 'Web CMS',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Ghost Modern Publishing Stack
# Create your admin account on first visit at http://localhost:2368/ghost
# ==============================================================================
services:
  ghost:
    image: ghost:5-alpine
    container_name: ghost
    environment:
      - url=http://localhost:2368
    volumes:
      - /opt/ghost/content:/var/lib/ghost/content
    ports:
      - "2368:2368"
    restart: unless-stopped
`
  },
  {
    id: 'wikijs',
    name: 'Wiki.js',
    tagline: 'Modern Markdown & Git-Synced Wiki',
    description: 'Sleek, extensible team knowledge base with Markdown editor, diagram support, and Git repository backup.',
    icon: '📚',
    defaultPort: '3000',
    webUrl: 'http://localhost:3000',
    category: 'cloud',
    pairGroup: 'Wiki',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Wiki.js Knowledge Base
# Web UI: http://localhost:3000 (SQLite storage, zero external DB required)
# ==============================================================================
services:
  wikijs:
    image: ghcr.io/requarks/wiki:2
    container_name: wikijs
    environment:
      - DB_TYPE=sqlite
      - DB_FILEPATH=/wiki/data/wiki.sqlite
    volumes:
      - /opt/wikijs/data:/wiki/data
    ports:
      - "3000:3000"
    restart: unless-stopped
`
  },
  {
    id: 'comfyui',
    name: 'ComfyUI (AI Image Gen)',
    tagline: 'Node-Based Stable Diffusion & Flux Studio',
    description: 'Visual node graph for local Stable Diffusion, Flux, LoRA, and video generation workflows (GPU recommended).',
    icon: '🎨',
    defaultPort: '8188',
    webUrl: 'http://localhost:8188',
    category: 'ai',
    upstreamComposeUrl: 'https://github.com/YanWenKun/ComfyUI-Docker',
    minRamMb: 8192,
    architectures: ['x86_64'],
    generateCompose: (criteria) => `# ==============================================================================
# DistroTailor: ComfyUI Local AI Image Generation Studio
# Web UI: http://localhost:8188
# ==============================================================================
services:
  comfyui:
    image: yanwk/comfyui-boot:cu124-slim
    container_name: comfyui
    ports:
      - "8188:8188"
    volumes:
      - /opt/comfyui/storage:/root${
        criteria.driverPhilosophy === 'seamless-proprietary' || criteria.useCase === 'ai-gpu-compute'
          ? `
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]`
          : ''
      }
    restart: unless-stopped
`
  },
  {
    id: 'paperless-ngx',
    name: 'Paperless-ngx (Docs OCR)',
    tagline: 'Self-Hosted Document & Receipt Archive',
    description: 'Scan, OCR, auto-tag, and full-text search PDFs, invoices, and tax documents in a private web archive.',
    icon: '🗂️',
    defaultPort: '8000',
    webUrl: 'http://localhost:8000',
    category: 'cloud',
    upstreamComposeUrl: 'https://github.com/paperless-ngx/paperless-ngx/tree/main/docker/compose',
    minRamMb: 1024,
    architectures: ['x86_64', 'arm64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Paperless-ngx Document Management & OCR
# Web UI: http://localhost:8000
# Create initial admin user after startup: docker compose exec webserver createsuperuser
# ==============================================================================
services:
  broker:
    image: redis:7-alpine
    container_name: paperless-redis
    restart: unless-stopped

  webserver:
    image: ghcr.io/paperless-ngx/paperless-ngx:latest
    container_name: paperless-webserver
    depends_on:
      - broker
    ports:
      - "8000:8000"
    environment:
      - PAPERLESS_REDIS=redis://broker:6379
    volumes:
      - /opt/paperless/data:/usr/src/paperless/data
      - /opt/paperless/media:/usr/src/paperless/media
      - /opt/paperless/consume:/usr/src/paperless/consume
    restart: unless-stopped
`
  },
  {
    id: 'n8n',
    name: 'n8n (Workflows)',
    tagline: 'Visual Workflow & API Automation',
    description: 'Self-hosted Zapier/Make alternative with 400+ integrations, webhooks, cron triggers, and AI agent nodes.',
    icon: '⚡',
    defaultPort: '5678',
    webUrl: 'http://localhost:5678',
    category: 'homelab',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: n8n Workflow Automation
# Web Editor: http://localhost:5678
# ==============================================================================
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: n8n
    ports:
      - "5678:5678"
    volumes:
      - /opt/n8n/data:/home/node/.n8n
    restart: unless-stopped
`
  },
  {
    id: 'filebrowser',
    name: 'FileBrowser (Web Share)',
    tagline: 'Lightweight Web File Manager & Share Links',
    description: 'Single-container web file manager to upload, browse, preview, and generate password-protected share links.',
    icon: '📂',
    defaultPort: '8080',
    webUrl: 'http://localhost:8080',
    category: 'cloud',
    minRamMb: 128,
    architectures: ['x86_64', 'arm64', 'armv7'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: FileBrowser Lightweight Web File Sharing
# Web UI: http://localhost:8080 (check container logs for initial random admin password)
# ==============================================================================
services:
  filebrowser:
    image: filebrowser/filebrowser:latest
    container_name: filebrowser
    ports:
      - "8080:80"
    volumes:
      - /opt/filebrowser/srv:/srv
      - /opt/filebrowser/database:/database
      - /opt/filebrowser/config:/config
    restart: unless-stopped
`
  },
  {
    id: 'thelounge',
    name: 'The Lounge (Web IRC)',
    tagline: 'Always-On Self-Hosted Web IRC Bouncer',
    description: 'Modern web IRC client that stays connected in the background, keeps scrollback history, and sends push alerts.',
    icon: '💬',
    defaultPort: '9000',
    webUrl: 'http://localhost:9000',
    category: 'homelab',
    minRamMb: 128,
    architectures: ['x86_64', 'arm64', 'armv7'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: The Lounge Self-Hosted Web IRC Client
# Web UI: http://localhost:9000
# Add user: docker compose exec thelounge thelounge add <username>
# ==============================================================================
services:
  thelounge:
    image: ghcr.io/thelounge/thelounge:latest
    container_name: thelounge
    ports:
      - "9000:9000"
    volumes:
      - /opt/thelounge/config:/var/opt/thelounge
    restart: unless-stopped
`
  },
  {
    id: 'sabnzbd',
    name: 'SABnzbd (Usenet)',
    tagline: 'Automated Open-Source Usenet Downloader',
    description: 'Web-based Usenet binary newsreader with NZB queue automation, PAR2 repair, and archive unpacking.',
    icon: '📥',
    defaultPort: '8080',
    webUrl: 'http://localhost:8080',
    category: 'media',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: SABnzbd Self-Hosted Usenet Client
# Web UI: http://localhost:8080
# ==============================================================================
services:
  sabnzbd:
    image: lscr.io/linuxserver/sabnzbd:latest
    container_name: sabnzbd
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC
    volumes:
      - /opt/sabnzbd/config:/config
      - /opt/sabnzbd/downloads:/downloads
      - /opt/sabnzbd/incomplete:/incomplete-downloads
    ports:
      - "8080:8080"
    restart: unless-stopped
`
  },
  {
    id: 'frigate',
    name: 'Frigate NVR (Cameras)',
    tagline: 'Local AI Object Detection Security NVR',
    description: 'Real-time local AI security camera NVR with person/vehicle detection, Home Assistant integration, and RTSP recording.',
    icon: '📹',
    defaultPort: '5000',
    webUrl: 'http://localhost:5000',
    category: 'smart-home',
    upstreamComposeUrl: 'https://docs.frigate.video/frigate/installation/',
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Frigate NVR (Local AI Security Camera Recorder)
# Web UI: http://localhost:5000 | RTSP Restream: 8554
# ==============================================================================
services:
  frigate:
    image: ghcr.io/blakeblackshear/frigate:stable
    container_name: frigate
    shm_size: "128mb"
    ports:
      - "5000:5000"
      - "8554:8554"
    volumes:
      - /opt/frigate/config:/config
      - /opt/frigate/media:/media/frigate
      - type: tmpfs
        target: /tmp/cache
        tmpfs:
          size: 1000000000
    restart: unless-stopped
`
  },
  {
    id: 'gitlab-ce',
    name: 'GitLab CE (DevSecOps)',
    tagline: 'Full Enterprise Git, CI/CD & Registry',
    description: 'All-in-one self-hosted DevOps platform with Git, CI/CD pipelines, container registry, and issue boards (requires 4+ GB RAM).',
    icon: '🦊',
    defaultPort: '8929',
    webUrl: 'http://localhost:8929',
    category: 'homelab',
    pairGroup: 'Git Forge',
    minRamMb: 4096,
    architectures: ['x86_64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: GitLab Community Edition
# Web UI: http://localhost:8929 | SSH Git: 2224
# Initial root password is written to /etc/gitlab/initial_root_password inside the container.
# ==============================================================================
services:
  gitlab:
    image: gitlab/gitlab-ce:latest
    container_name: gitlab
    ports:
      - "8929:8929"
      - "2224:22"
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'http://localhost:8929'
        gitlab_rails['gitlab_shell_ssh_port'] = 2224
    volumes:
      - /opt/gitlab/config:/etc/gitlab
      - /opt/gitlab/logs:/var/log/gitlab
      - /opt/gitlab/data:/var/opt/gitlab
    shm_size: '256m'
    restart: unless-stopped
`
  },
  {
    id: 'bookstack',
    name: 'BookStack (WYSIWYG Wiki)',
    tagline: 'Friendly Books, Chapters & Pages Wiki',
    description: 'Simple, visual self-hosted wiki organized like Books & Chapters with WYSIWYG editing for teams & families.',
    icon: '📖',
    defaultPort: '6875',
    webUrl: 'http://localhost:6875',
    category: 'cloud',
    pairGroup: 'Wiki',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: BookStack Self-Hosted Wiki
# Web UI: http://localhost:6875
# Set strong DB passwords in .env before running in production.
# ==============================================================================
services:
  bookstack_db:
    image: lscr.io/linuxserver/mariadb:latest
    container_name: bookstack_db
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC
      - MYSQL_ROOT_PASSWORD=\${BOOKSTACK_DB_ROOT_PW:-changeme_on_first_boot}
      - MYSQL_DATABASE=bookstackapp
      - MYSQL_USER=bookstack
      - MYSQL_PASSWORD=\${BOOKSTACK_DB_PW:-changeme_on_first_boot}
    volumes:
      - /opt/bookstack/db:/config
    restart: unless-stopped

  bookstack:
    image: lscr.io/linuxserver/bookstack:latest
    container_name: bookstack
    depends_on:
      - bookstack_db
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC
      - APP_URL=http://localhost:6875
      - DB_HOST=bookstack_db
      - DB_PORT=3306
      - DB_USER=bookstack
      - DB_PASS=\${BOOKSTACK_DB_PW:-changeme_on_first_boot}
      - DB_DATABASE=bookstackapp
    volumes:
      - /opt/bookstack/config:/config
    ports:
      - "6875:80"
    restart: unless-stopped
`
  },
  {
    id: 'navidrome',
    name: 'Navidrome (Music Server)',
    tagline: 'Self-Hosted Personal Spotify & Subsonic',
    description: 'Ultra-fast, lightweight open-source music streaming server compatible with all Subsonic mobile & desktop apps.',
    icon: '🎵',
    defaultPort: '4533',
    webUrl: 'http://localhost:4533',
    category: 'media',
    minRamMb: 128,
    architectures: ['x86_64', 'arm64', 'armv7'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Navidrome Personal Music Streaming Server
# Web UI: http://localhost:4533
# ==============================================================================
services:
  navidrome:
    image: deluan/navidrome:latest
    container_name: navidrome
    ports:
      - "4533:4533"
    volumes:
      - /opt/navidrome/data:/data
      - /opt/navidrome/music:/music:ro
    restart: unless-stopped
`
  },
  {
    id: 'adguard-home',
    name: 'AdGuard Home (DNS)',
    tagline: 'Network Ad-Blocker with Native DoH/DoT',
    description: 'Modern network-wide ad & tracker blocker with built-in DNS-over-HTTPS, DNS-over-TLS, and parental controls.',
    icon: '🛡️',
    defaultPort: '3000',
    webUrl: 'http://localhost:3000',
    category: 'homelab',
    pairGroup: 'DNS Ad-Blocker',
    minRamMb: 128,
    architectures: ['x86_64', 'arm64', 'armv7'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: AdGuard Home Network DNS & Ad Blocker
# Setup Wizard: http://localhost:3000 | DNS Port: 53
# ==============================================================================
services:
  adguardhome:
    image: adguard/adguardhome:latest
    container_name: adguardhome
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "3000:3000/tcp"
    volumes:
      - /opt/adguardhome/work:/opt/adguardhome/work
      - /opt/adguardhome/conf:/opt/adguardhome/conf
    restart: unless-stopped
`
  },
  {
    id: 'dockge',
    name: 'Dockge (Compose Manager)',
    tagline: 'Interactive Docker Compose Stack Manager',
    description: 'Sleek, lightweight web UI for managing per-folder stacks/<app>/docker-compose.yml files with live logs.',
    icon: '⚓',
    defaultPort: '5001',
    webUrl: 'http://localhost:5001',
    category: 'homelab',
    pairGroup: 'Docker UI',
    minRamMb: 128,
    architectures: ['x86_64', 'arm64', 'armv7'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Dockge Compose Stack Manager
# Web UI: http://localhost:5001
# ==============================================================================
services:
  dockge:
    image: louislam/dockge:1
    container_name: dockge
    ports:
      - "5001:5001"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /opt/dockge/data:/app/data
      - /opt/stacks:/opt/stacks
    environment:
      - DOCKGE_STACKS_DIR=/opt/stacks
    restart: unless-stopped
`
  },
  {
    id: 'caddy',
    name: 'Caddy (Auto-HTTPS Proxy)',
    tagline: 'Minimal Reverse Proxy with Automatic TLS',
    description: 'Zero-config, memory-safe reverse proxy that automatically provisions and renews Let’s Encrypt SSL certificates.',
    icon: '🔐',
    defaultPort: '80',
    webUrl: 'http://localhost:80',
    category: 'web',
    pairGroup: 'Reverse Proxy',
    minRamMb: 64,
    architectures: ['x86_64', 'arm64', 'armv7'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Caddy Reverse Proxy with Automatic HTTPS
# ==============================================================================
services:
  caddy:
    image: caddy:2-alpine
    container_name: caddy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /opt/caddy/Caddyfile:/etc/caddy/Caddyfile
      - /opt/caddy/data:/data
      - /opt/caddy/config:/config
    restart: unless-stopped
`
  },
  {
    id: 'lychee',
    name: 'Lychee (Light Photo Gallery)',
    tagline: 'Lightweight Self-Hosted Photo Album',
    description: 'Fast, minimal photo gallery and album sharing server—great lightweight alternative to Immich for low-RAM boards.',
    icon: '🖼️',
    defaultPort: '8080',
    webUrl: 'http://localhost:8080',
    category: 'cloud',
    pairGroup: 'Photo Library',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Lychee Lightweight Photo Gallery
# Web UI: http://localhost:8080
# ==============================================================================
services:
  lychee:
    image: lscr.io/linuxserver/lychee:latest
    container_name: lychee
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC
    volumes:
      - /opt/lychee/config:/config
      - /opt/lychee/pictures:/pictures
    ports:
      - "8080:80"
    restart: unless-stopped
`
  },
  {
    id: 'meilisearch',
    name: 'Meilisearch (Fast Search)',
    tagline: 'Lightweight Instant Full-Text Search',
    description: 'Blazing-fast, typo-tolerant Rust search engine (lightweight alternative to Elasticsearch for apps & docs).',
    icon: '🔍',
    defaultPort: '7700',
    webUrl: 'http://localhost:7700',
    category: 'homelab',
    pairGroup: 'Search Engine',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Meilisearch Instant Search Engine
# API & Search Preview: http://localhost:7700
# Set MEILI_MASTER_KEY in .env before exposing beyond localhost.
# ==============================================================================
services:
  meilisearch:
    image: getmeili/meilisearch:latest
    container_name: meilisearch
    environment:
      - MEILI_ENV=development
    volumes:
      - /opt/meilisearch/data:/meili_data
    ports:
      - "7700:7700"
    restart: unless-stopped
`
  },
  {
    id: 'opensearch',
    name: 'OpenSearch (Analytics)',
    tagline: 'Elasticsearch-Compatible Search & Logs',
    description: 'Full-featured Apache-2.0 distributed search, log analytics, and vector database engine (requires 2+ GB RAM).',
    icon: '🔎',
    defaultPort: '9200',
    webUrl: 'http://localhost:9200',
    category: 'homelab',
    pairGroup: 'Search Engine',
    minRamMb: 2048,
    architectures: ['x86_64', 'arm64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: OpenSearch Single-Node Search & Analytics
# REST API: http://localhost:9200
# For production, enable security plugin and set OPENSEARCH_INITIAL_ADMIN_PASSWORD in .env.
# ==============================================================================
services:
  opensearch:
    image: opensearchproject/opensearch:latest
    container_name: opensearch
    environment:
      - discovery.type=single-node
      - DISABLE_SECURITY_PLUGIN=true
      - OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m
    volumes:
      - /opt/opensearch/data:/usr/share/opensearch/data
    ports:
      - "9200:9200"
      - "9600:9600"
    restart: unless-stopped
`
  },
  {
    id: 'searxng',
    name: 'SearXNG (Private Search)',
    tagline: 'Self-Hosted Privacy Metasearch Engine',
    description: 'Ad-free, tracking-free metasearch engine aggregating 70+ search services with no user profiling.',
    icon: '🕵️',
    defaultPort: '8080',
    webUrl: 'http://localhost:8080',
    category: 'homelab',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64', 'armv7'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: SearXNG Private Metasearch Engine
# Web UI: http://localhost:8080
# ==============================================================================
services:
  searxng:
    image: searxng/searxng:latest
    container_name: searxng
    volumes:
      - /opt/searxng/config:/etc/searxng
    ports:
      - "8080:8080"
    restart: unless-stopped
`
  },
  {
    id: 'prowlarr',
    name: 'Prowlarr (Indexer Hub)',
    tagline: 'Unified NZB & Torrent Indexer Manager',
    description: 'Modern indexer manager that searches Usenet NZB and torrent trackers and syncs directly with SABnzbd & qBittorrent.',
    icon: '📡',
    defaultPort: '9696',
    webUrl: 'http://localhost:9696',
    category: 'media',
    pairGroup: 'NZB / Media Indexer',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: Prowlarr Unified NZB & Torrent Indexer Manager
# Web UI: http://localhost:9696
# ==============================================================================
services:
  prowlarr:
    image: lscr.io/linuxserver/prowlarr:latest
    container_name: prowlarr
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC
    volumes:
      - /opt/prowlarr/config:/config
    ports:
      - "9696:9696"
    restart: unless-stopped
`
  },
  {
    id: 'nzbhydra2',
    name: 'NZBHydra2 (NZB Search)',
    tagline: 'Dedicated Usenet Meta-Search & Stats',
    description: 'Meta-search aggregator across multiple Newznab/Usenet indexers with unified API and download stats for SABnzbd.',
    icon: '🐍',
    defaultPort: '5076',
    webUrl: 'http://localhost:5076',
    category: 'media',
    pairGroup: 'NZB / Media Indexer',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64'],
    generateCompose: () => `# ==============================================================================
# DistroTailor: NZBHydra2 Usenet Meta-Search Aggregator
# Web UI: http://localhost:5076
# ==============================================================================
services:
  nzbhydra2:
    image: lscr.io/linuxserver/nzbhydra2:latest
    container_name: nzbhydra2
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC
    volumes:
      - /opt/nzbhydra2/config:/config
    ports:
      - "5076:5076"
    restart: unless-stopped
`
  }
];

export function getDockerApp(id?: DockerAppId): DockerAppDefinition | undefined {
  if (!id || id === 'none') return undefined;
  return DOCKER_APPS_REGISTRY.find((app) => app.id === id);
}

/** Resolves all selected Docker stacks (supporting both legacy single `dockerApp` and multi-select `dockerApps`). */
export function getSelectedDockerApps(criteria: UserCriteria): DockerAppDefinition[] {
  const ids = new Set<DockerAppId>();
  if (criteria.dockerApps) {
    for (const id of criteria.dockerApps) {
      if (id && id !== 'none') ids.add(id);
    }
  }
  if (criteria.dockerApp && criteria.dockerApp !== 'none') {
    ids.add(criteria.dockerApp);
  }
  return Array.from(ids)
    .map((id) => getDockerApp(id))
    .filter((app): app is DockerAppDefinition => !!app);
}

export interface ResolvedDockerStack {
  app: DockerAppDefinition;
  hostPort: string;
  reassignedFrom?: string;
  conflictWith?: string;
}

/**
 * Resolves host ports for selected Docker stacks, automatically suggesting the next
 * free port when two selected stacks share the same numeric defaultPort.
 */
export function resolveDockerStackPorts(apps: readonly DockerAppDefinition[]): ResolvedDockerStack[] {
  const usedPorts = new Map<string, string>(); // port -> app.name
  return apps.map((app) => {
    const rawPort = app.defaultPort.trim();
    if (!/^\d+$/.test(rawPort)) {
      return { app, hostPort: rawPort };
    }
    if (!usedPorts.has(rawPort)) {
      usedPorts.set(rawPort, app.name);
      return { app, hostPort: rawPort };
    }
    const conflictWith = usedPorts.get(rawPort)!;
    let candidate = Number(rawPort) + 1;
    while (usedPorts.has(String(candidate))) {
      candidate++;
    }
    const hostPort = String(candidate);
    usedPorts.set(hostPort, app.name);
    return { app, hostPort, reassignedFrom: rawPort, conflictWith };
  });
}

function applyHostPortOverride(compose: string, fromPort: string, toPort: string, conflictWith: string): string {
  const portPattern = new RegExp(`"${fromPort}:(\\d+)"`, 'g');
  const updated = compose.replace(portPattern, `"${toPort}:$1" # Adjusted from ${fromPort} (conflict with ${conflictWith}; edit to customize)`);
  return updated.replace(new RegExp(`http://localhost:${fromPort}`, 'g'), `http://localhost:${toPort}`);
}

function withUpstreamReference(compose: string, app: DockerAppDefinition): string {
  if (!app.upstreamComposeUrl) return compose;
  return `# Upstream Compose Reference: ${app.upstreamComposeUrl}\n${compose}`;
}

/**
 * Generates isolated per-stack Compose files:
 * - 1 stack: root `docker-compose.yml` (classic single-app layout)
 * - 2+ stacks: `stacks/<id>/docker-compose.yml` per stack (Dockge / Portainer ready)
 */
export function generateDockerStackFiles(criteria: UserCriteria): {
  files: Array<{ filename: string; description: string; content: string }>;
  quickstartCommands: string[];
  summaryLabel?: string;
} {
  const apps = getSelectedDockerApps(criteria);
  if (apps.length === 0) {
    return { files: [], quickstartCommands: [] };
  }
  if (apps.length === 1) {
    const app = apps[0];
    return {
      files: [
        {
          filename: 'docker-compose.yml',
          description: `Turnkey Docker Compose configuration for ${app.name} (${app.tagline})`,
          content: withUpstreamReference(app.generateCompose(criteria), app)
        }
      ],
      quickstartCommands: [`docker compose up -d  # Launch ${app.name} at ${app.webUrl}`],
      summaryLabel: app.name
    };
  }
  const resolved = resolveDockerStackPorts(apps);
  return {
    files: resolved.map(({ app, hostPort, reassignedFrom, conflictWith }) => {
      const baseCompose = withUpstreamReference(app.generateCompose(criteria), app);
      const content =
        reassignedFrom && conflictWith
          ? applyHostPortOverride(baseCompose, reassignedFrom, hostPort, conflictWith)
          : baseCompose;
      return {
        filename: `stacks/${app.id}/docker-compose.yml`,
        description: reassignedFrom
          ? `Isolated Dockge-ready stack for ${app.name} (host port ${hostPort}; adjusted from ${reassignedFrom})`
          : `Isolated Dockge-ready Docker Compose stack for ${app.name} (${app.tagline})`,
        content
      };
    }),
    quickstartCommands: resolved.map(({ app, hostPort, reassignedFrom }) => {
      const url = reassignedFrom ? app.webUrl.replace(`:${reassignedFrom}`, `:${hostPort}`) : app.webUrl;
      const note = reassignedFrom ? ` [port ${reassignedFrom} -> ${hostPort}]` : '';
      return `docker compose -f stacks/${app.id}/docker-compose.yml up -d  # ${app.name} (${url})${note}`;
    }),
    summaryLabel: `${apps.length} Stacks (${apps.map((a) => a.name).join(', ')})`
  };
}
