/**
 * Shared shell snippets for multi-distro bootstrap scripts (Debian/Ubuntu, Alpine, Fedora,
 * openSUSE, Void, Arch, and Gentoo).
 */

export const PKG_MGR_DETECT_SCRIPT = `# Detect host package manager (Debian/Ubuntu, Alpine, Fedora, openSUSE, Void, Arch, Gentoo)
if command -v apk >/dev/null 2>&1; then
  PKG_MGR="apk"
elif command -v apt-get >/dev/null 2>&1; then
  PKG_MGR="apt"
elif command -v dnf >/dev/null 2>&1; then
  PKG_MGR="dnf"
elif command -v zypper >/dev/null 2>&1; then
  PKG_MGR="zypper"
elif command -v xbps-install >/dev/null 2>&1; then
  PKG_MGR="xbps"
elif command -v pacman >/dev/null 2>&1; then
  PKG_MGR="pacman"
elif command -v emerge >/dev/null 2>&1; then
  PKG_MGR="emerge"
else
  PKG_MGR="unknown"
fi`;

export const FLATPAK_INSTALL_SNIPPET = `if ! command -v flatpak >/dev/null 2>&1; then
  if [ "$PKG_MGR" = "apt" ]; then
    apt-get update -y && apt-get install -y --no-install-recommends flatpak
  elif [ "$PKG_MGR" = "apk" ]; then
    apk update && apk add --no-cache flatpak
  elif [ "$PKG_MGR" = "dnf" ]; then
    dnf install -y flatpak
  elif [ "$PKG_MGR" = "zypper" ]; then
    zypper --non-interactive install flatpak
  elif [ "$PKG_MGR" = "xbps" ]; then
    xbps-install -Sy flatpak
  elif [ "$PKG_MGR" = "pacman" ]; then
    pacman -S --noconfirm --needed flatpak
  elif [ "$PKG_MGR" = "emerge" ]; then
    emerge --getbinpkg --usepkg sys-apps/flatpak
  fi
fi`;
