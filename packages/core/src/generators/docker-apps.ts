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
  }
];

export function getDockerApp(id?: DockerAppId): DockerAppDefinition | undefined {
  if (!id || id === 'none') return undefined;
  return DOCKER_APPS_REGISTRY.find((app) => app.id === id);
}
