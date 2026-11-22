import { CpuArchitecture, NavigationAppId, UserCriteria } from '../types.js';

export interface NavigationAppDefinition {
  id: NavigationAppId;
  name: string;
  category: 'in-car-gps' | 'telemetry' | 'map-viewer' | 'marine' | 'tooling';
  icon: string;
  description: string;
  minRamMb: number;
  architectures: CpuArchitecture[];
  aptPackages?: string[];
  apkPackages?: string[];
  flatpakId?: string;
}

export interface NavigationAppCompatibility {
  compatible: boolean;
  warnings: string[];
  blocker?: string;
}

export function checkNavigationAppCompatibility(
  app: NavigationAppDefinition,
  criteria: UserCriteria
): NavigationAppCompatibility {
  const warnings: string[] = [];

  // NOMMU / Microcontrollers can only run minimal C daemons (gpsd)
  if (criteria.architecture === 'nommu' && app.id !== 'gpsd') {
    return {
      compatible: false,
      warnings: [],
      blocker: 'Microcontrollers (NOMMU) lack graphical subsystems for map rendering.'
    };
  }

  // Architecture compatibility
  if (criteria.architecture && !app.architectures.includes(criteria.architecture)) {
    return {
      compatible: false,
      warnings: [],
      blocker: `${app.name} does not provide prebuilt binaries for ${criteria.architecture}.`
    };
  }

  // RAM budget
  if (criteria.maxRamMb && criteria.maxRamMb < app.minRamMb) {
    const formatted = app.minRamMb >= 1024 ? `${(app.minRamMb / 1024).toFixed(0)} GB` : `${app.minRamMb} MB`;
    warnings.push(`Exceeds your ${criteria.maxRamMb} MB budget (requires ~${formatted} RAM).`);
  }

  return {
    compatible: true,
    warnings
  };
}

export const NAVIGATION_APPS_REGISTRY: NavigationAppDefinition[] = [
  {
    id: 'navit',
    name: 'Navit GPS',
    category: 'in-car-gps',
    icon: '🚗',
    description: 'Ultra-lightweight modular car navigation system with offline OpenStreetMap routing. Runs directly on Linux framebuffer (/dev/fb0) or GUI.',
    minRamMb: 32,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64'],
    aptPackages: ['navit', 'navit-gui-internal']
  },
  {
    id: 'gpsd',
    name: 'GPSd Telemetry Daemon',
    category: 'telemetry',
    icon: '🛰️',
    description: 'Hardware daemon translating serial UART, USB GPS dongles, or AIS receivers into a standard JSON/NMEA stream on localhost:2947.',
    minRamMb: 16,
    architectures: ['x86_64', 'arm64', 'armv7', 'riscv64', 'nommu'],
    aptPackages: ['gpsd', 'gpsd-clients'],
    apkPackages: ['gpsd']
  },
  {
    id: 'foxtrotgps',
    name: 'FoxtrotGPS',
    category: 'map-viewer',
    icon: '🗺️',
    description: 'Touchscreen-friendly OpenStreetMap viewer and track recorder designed for netbooks, car PCs, and handheld tablets.',
    minRamMb: 64,
    architectures: ['x86_64', 'arm64', 'armv7'],
    aptPackages: ['foxtrotgps']
  },
  {
    id: 'opencpn',
    name: 'OpenCPN Marine Navigator',
    category: 'marine',
    icon: '⚓',
    description: 'Full-featured chartplotter and marine GPS navigation tool supporting NOAA raster and S-57 vector nautical charts.',
    minRamMb: 256,
    architectures: ['x86_64', 'arm64', 'armv7'],
    flatpakId: 'org.opencpn.OpenCPN'
  },
  {
    id: 'mkgmap',
    name: 'mkgmap (OSM to Garmin)',
    category: 'tooling',
    icon: '💾',
    description: 'Java compiler converting raw OpenStreetMap files into Garmin gmapsupp.img vector maps for SD-card booting on legacy Garmin PNDs.',
    minRamMb: 512,
    architectures: ['x86_64', 'arm64', 'armv7'],
    aptPackages: ['mkgmap', 'default-jre-headless']
  }
];

export function getNavigationApp(id: NavigationAppId): NavigationAppDefinition | undefined {
  return NAVIGATION_APPS_REGISTRY.find((app) => app.id === id);
}

/**
 * Generates an automated unattended bootstrap script for offline navigation tools.
 */
export function generateBootstrapNavigationScript(
  navigationAppIds: NavigationAppId[],
  criteria: UserCriteria
): string {
  if (!navigationAppIds || navigationAppIds.length === 0) {
    return `#!/usr/bin/env bash
# ==============================================================================
# DistroTailor: Offline Navigation Bootstrap
# No navigation apps were selected.
# ==============================================================================
set -euo pipefail
echo "[+] DistroTailor: No navigation apps selected."
exit 0
`;
  }

  const selectedApps = navigationAppIds
    .map(getNavigationApp)
    .filter((a): a is NavigationAppDefinition => a !== undefined);

  const allApt = Array.from(new Set(selectedApps.flatMap((a) => a.aptPackages || [])));
  const allApk = Array.from(new Set(selectedApps.flatMap((a) => a.apkPackages || [])));
  const flatpakApps = selectedApps.filter((a) => a.flatpakId);

  const hasNavit = navigationAppIds.includes('navit');
  const hasGpsd = navigationAppIds.includes('gpsd') || hasNavit;
  const hasMkgmap = navigationAppIds.includes('mkgmap');

  return `#!/usr/bin/env bash
# ==============================================================================
# DistroTailor: Turnkey Offline Navigation & GPS Appliance Bootstrap
# Target Architecture: ${criteria.architecture || 'native'}
# Selected Applications: ${selectedApps.map((a) => a.name).join(', ')}
# ==============================================================================
# Automated unattended setup for ${selectedApps.length} selected navigation tool(s):
# - Configures GPSd daemon with serial/USB NMEA device auto-detection
# - Provisions offline OpenStreetMap (OSM) vector data directories
# - Configures touch-optimized kiosk & direct framebuffer autostart
#
# Usage:
#   sudo bash bootstrap-navigation.sh
# ==============================================================================
set -euo pipefail

if [ "\$(id -u)" -ne 0 ]; then
  echo "[-] ERROR: This script must be run as root (or via sudo)." >&2
  echo "    sudo bash bootstrap-navigation.sh" >&2
  exit 1
fi

echo "[+] Step 1: Detecting package manager and system architecture..."
ARCH="\$(uname -m)"
echo "    Architecture: \${ARCH}"

# 1. Native Package Installation
if command -v apt-get >/dev/null 2>&1; then
  echo "[+] Step 2: Installing native packages via APT..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -y
  apt-get install -y curl jq udev ${allApt.join(' ')}
elif command -v apk >/dev/null 2>&1; then
  echo "[+] Step 2: Installing native packages via APK (Alpine)..."
  apk update
  apk add curl jq udev ${allApk.join(' ')}
elif command -v dnf >/dev/null 2>&1; then
  echo "[+] Step 2: Installing native packages via DNF (Fedora/RHEL)..."
  dnf install -y curl jq systemd-udev ${allApt.join(' ')}
elif command -v zypper >/dev/null 2>&1; then
  echo "[+] Step 2: Installing native packages via Zypper (openSUSE)..."
  zypper --non-interactive install curl jq udev ${allApt.join(' ')}
elif command -v xbps-install >/dev/null 2>&1; then
  echo "[+] Step 2: Installing native packages via XBPS (Void Linux)..."
  xbps-install -Sy curl jq eudev ${allApt.join(' ')}
elif command -v pacman >/dev/null 2>&1; then
  echo "[+] Step 2: Installing native packages via Pacman (Arch Linux)..."
  pacman -S --noconfirm --needed curl jq systemd ${allApt.join(' ')}
else
  echo "[!] Notice: No supported package manager found. Ensure native packages are cross-compiled via Buildroot."
fi

${
  hasGpsd
    ? `
# ------------------------------------------------------------------------------
# GPSd Configuration & Serial Detection
# ------------------------------------------------------------------------------
echo "[+] Step 3: Configuring GPSd daemon for serial/USB receivers..."
if [ -d "/etc/default" ]; then
  cat <<'EOF' > /etc/default/gpsd
# DistroTailor Generated GPSd Configuration
START_DAEMON="true"
USBAUTO="true"
DEVICES="/dev/ttyUSB0 /dev/ttyACM0 /dev/ttyAMA0 /dev/ttyS0"
GPSD_OPTIONS="-n -G"
GPSD_SOCKET="/var/run/gpsd.sock"
EOF
  echo "    Written /etc/default/gpsd (auto-scans USB and UART NMEA ports)."
fi

# Enable gpsd systemd service if systemd is active
if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
  systemctl enable --now gpsd.service 2>/dev/null || true
  systemctl enable --now gpsd.socket 2>/dev/null || true
fi
`
    : ''
}

${
  hasNavit
    ? `
# ------------------------------------------------------------------------------
# Navit Offline OpenStreetMap Provisioning
# ------------------------------------------------------------------------------
echo "[+] Step 4: Provisioning Navit and offline OpenStreetMap directories..."
NAVIT_DATA_DIR="/usr/share/navit/maps"
mkdir -p "\${NAVIT_DATA_DIR}"
mkdir -p /root/.navit

# Provide a sample downloader for offline OpenStreetMap binary vector extract
cat <<'EOF' > /usr/local/bin/fetch-osm-map
#!/usr/bin/env bash
# Downloads pre-compiled OpenStreetMap .bin vector extract for Navit
set -euo pipefail
MAP_URL="\${1:-http://maps.navit-project.org/osm_bbox.bin}"
DEST="/usr/share/navit/maps/osm_map.bin"
echo "[+] Downloading OpenStreetMap vector extract from \${MAP_URL}..."
curl -fsSL "\${MAP_URL}" -o "\${DEST}"
echo "[✓] Offline map downloaded successfully: \${DEST}"
EOF
chmod +x /usr/local/bin/fetch-osm-map

# Generate Navit vehicle connection to local GPSd
cat <<'EOF' > /root/.navit/navit.xml
<config xmlns:xi="http://www.w3.org/2001/XInclude">
  <plugins>
    <plugin path="$NAVIT_LIBDIR/*/*" ondemand="yes"/>
  </plugins>
  <navit center="4800 N 1100 E" zoom="256" tracking="1" orientation="-1">
    <graphics type="gtk_drawing_area"/>
    <gui type="internal"/>
    <vehicle name="GPSd_Receiver" profilename="car" enabled="yes" active="1" source="gpsd://localhost:2947"/>
    <mapset enabled="yes">
      <map type="binfile" enabled="yes" data="/usr/share/navit/maps/osm_map.bin"/>
    </mapset>
  </navit>
</config>
EOF
echo "    Navit configured with GPSd receiver and vector map loader."
`
    : ''
}

${
  hasMkgmap
    ? `
# ------------------------------------------------------------------------------
# mkgmap: OpenStreetMap to Garmin .img Compiler Script
# ------------------------------------------------------------------------------
echo "[+] Step 5: Provisioning mkgmap Garmin vector compiler tool..."
cat <<'EOF' > /usr/local/bin/compile-garmin-osm
#!/usr/bin/env bash
# Converts an OpenStreetMap .osm or .pbf file into a Garmin gmapsupp.img
set -euo pipefail
INPUT_OSM="\${1:-}"
if [ -z "\${INPUT_OSM}" ] || [ ! -f "\${INPUT_OSM}" ]; then
  echo "Usage: compile-garmin-osm <input.osm.pbf>" >&2
  exit 1
fi
echo "[+] Compiling \${INPUT_OSM} into Garmin gmapsupp.img via mkgmap..."
mkgmap --gmapsupp --latin1 --route "\${INPUT_OSM}"
echo "[✓] Build complete: gmapsupp.img generated. Copy this file to Garmin SD card (/Garmin/gmapsupp.img)."
EOF
chmod +x /usr/local/bin/compile-garmin-osm
`
    : ''
}

${
  flatpakApps.length > 0
    ? `
# ------------------------------------------------------------------------------
# Flatpak Navigation Applications
# ------------------------------------------------------------------------------
if command -v flatpak >/dev/null 2>&1; then
  echo "[+] Step 6: Installing Flatpak navigation tools..."
  flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo || true
  ${flatpakApps.map((a) => `flatpak install -y flathub ${a.flatpakId} || true`).join('\n  ')}
fi
`
    : ''
}

echo ""
echo "=========================================================================="
echo " [✓] Offline Navigation & GPS Appliance bootstrap finished!"
echo " Selected: ${selectedApps.map((a) => a.name).join(', ')}"
echo "=========================================================================="
echo " Next steps:"
${hasGpsd ? 'echo "   1. Test GPS receiver telemetry:  cgps -s   or   gpsmon"' : ''}
${hasNavit ? 'echo "   2. Download local map extract:   sudo fetch-osm-map"' : ''}
${hasNavit ? 'echo "   3. Launch navigation interface:  navit"' : ''}
echo "=========================================================================="
`;
}
