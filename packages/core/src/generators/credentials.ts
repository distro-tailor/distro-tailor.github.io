/**
 * Build-time login credentials for generated images.
 *
 * Recipes never contain a fixed password. Instead the Makefile, at build time on the user's
 * machine, authorizes their SSH public key (when one is found) and sets a random password
 * that is written only to an owner-readable credentials file. The random password is
 * generated inside the recipe shell, so it never appears in process arguments.
 */

/** Makefile variables shared by recipes that call credentialSetupSteps(). Requires OUTPUT_DIR. */
export const CREDENTIAL_MAKE_VARS = `# Login credentials are created at build time; no password is stored in this recipe.
#   SSH_PUBKEY=path/to/key.pub   authorize this key (default: your id_ed25519 / id_ecdsa / id_rsa .pub)
#   LOGIN_PASSWORD=...           use this password instead of a random one
INVOKING_HOME    ?= $(shell getent passwd "$\${SUDO_USER:-$$(id -un)}" | cut -d: -f6)
SSH_PUBKEY       ?= $(firstword $(wildcard $(INVOKING_HOME)/.ssh/id_ed25519.pub $(INVOKING_HOME)/.ssh/id_ecdsa.pub $(INVOKING_HOME)/.ssh/id_rsa.pub))
LOGIN_PASSWORD   ?=
CREDENTIALS_FILE ?= $(OUTPUT_DIR)/credentials.txt`;

export interface CredentialSetupOptions {
  /** Make expression for the image root, e.g. "$(ROOTFS_DIR)". */
  rootfs: string;
  /** Account to configure (an existing user inside the image). */
  user: string;
  /** Home directory of that user inside the image. */
  home: string;
  /** "sudo " when the Makefile itself runs unprivileged, "" when it runs under sudo make. */
  sudo: '' | 'sudo ';
  /** Expire the password so it must be changed at first login (needs shadow's passwd --expire). */
  expire: boolean;
}

/** Makefile recipe lines (tab-indented) that create the account's credentials. */
export function credentialSetupSteps({ rootfs, user, home, sudo, expire }: CredentialSetupOptions): string {
  const expireStep = expire ? `\n\t${sudo}chroot ${rootfs} passwd --expire ${user} >/dev/null; \\` : '';
  const passwordNote = expire
    ? 'This password must be changed at first login.'
    : 'Change this password after first login with: passwd';
  return `	@echo "[+] Creating login credentials for ${user}..."
	@set -e; umask 077; \\
	pw='$(LOGIN_PASSWORD)'; \\
	[ -n "$$pw" ] || pw=$$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 20); \\
	printf '%s:%s\\n' '${user}' "$$pw" | ${sudo}chroot ${rootfs} chpasswd; \\${expireStep}
	mkdir -p $(OUTPUT_DIR); \\
	printf 'user: %s\\npassword: %s\\n%s\\n' '${user}' "$$pw" '${passwordNote}' > $(CREDENTIALS_FILE); \\
	[ -z "$$SUDO_USER" ] || chown "$$SUDO_USER" $(CREDENTIALS_FILE); \\
	if [ -n '$(SSH_PUBKEY)' ] && [ -f '$(SSH_PUBKEY)' ]; then \\
		${sudo}install -d -m 700 ${rootfs}${home}/.ssh; \\
		${sudo}install -m 600 '$(SSH_PUBKEY)' ${rootfs}${home}/.ssh/authorized_keys; \\
		if [ -f ${rootfs}/etc/ssh/sshd_config ]; then \\
			echo 'PasswordAuthentication no' | ${sudo}tee -a ${rootfs}/etc/ssh/sshd_config >/dev/null; \\
		fi; \\
		echo "[+] Authorized SSH key $(SSH_PUBKEY); SSH password login disabled"; \\
	else \\
		echo "[!] No SSH public key found (set SSH_PUBKEY=path/to/key.pub); password login only"; \\
	fi; \\
	echo "[+] Login: ${user}, password saved to $(CREDENTIALS_FILE) (owner-readable only)"`;
}
