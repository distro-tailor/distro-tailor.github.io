import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DISTRO_REGISTRY } from '../taxonomy/distros.js';
import { selectRecipeGenerator } from './recipe-selection.js';

const distro = (id: string) => {
  const found = DISTRO_REGISTRY.find((d) => d.id === id);
  assert.ok(found, `missing fixture distro ${id}`);
  return found;
};

test('Recipe Selection: deployment target overrides the best match recipe', () => {
  assert.equal(selectRecipeGenerator({ platform: 'wsl2' }, distro('cage-appliance')), 'wsl2-debian');
  assert.equal(selectRecipeGenerator({ platform: 'vm' }, distro('cage-appliance')), 'cloud-init-qcow2');
});

test('Recipe Selection: use-case rules apply before the best match recipe', () => {
  assert.equal(selectRecipeGenerator({ useCase: 'hypervisor-vms' }, distro('cage-appliance')), 'proxmox-lxc');
  assert.equal(selectRecipeGenerator({ useCase: 'iot-embedded' }, distro('cage-appliance')), 'buildroot-embedded');
  assert.equal(selectRecipeGenerator({ useCase: 'iot-embedded' }, distro('yocto')), undefined);
  assert.equal(selectRecipeGenerator({ useCase: 'iot-embedded' }, distro('zephyr')), undefined);
});

test("Recipe Selection: falls back to the best match's own generator", () => {
  assert.equal(selectRecipeGenerator({ useCase: 'kiosk-signage' }, distro('cage-appliance')), 'kiosk-web');
});

test('Recipe Selection: explicit customizations pick Alpine for Alpine-based distros and debootstrap otherwise, except for Arch', () => {
  assert.equal(selectRecipeGenerator({ enableNix: true }, distro('linux-mint')), 'debootstrap-debian');
  assert.equal(selectRecipeGenerator({ dockerApps: ['pihole'] }, distro('postmarketos')), 'alpine-chroot');
  assert.equal(selectRecipeGenerator({ dockerApps: ['pihole'] }, distro('fedora')), 'fedora-dnf');
  assert.equal(selectRecipeGenerator({ desktopApps: ['firefox'] }, distro('bazzite')), 'fedora-dnf');
  assert.equal(selectRecipeGenerator({ dockerApps: ['pihole'] }, distro('rocky-linux')), 'fedora-dnf');
  assert.equal(selectRecipeGenerator({ dockerApps: ['pihole'] }, distro('opensuse-tumbleweed')), 'opensuse-zypper');
  assert.equal(selectRecipeGenerator({ dockerApps: ['pihole'] }, distro('void-linux')), 'void-xbps');
  assert.equal(selectRecipeGenerator({ enableNix: true }, distro('arch')), 'arch-pacstrap');
  assert.equal(selectRecipeGenerator({ dockerApps: ['pihole'] }, distro('gentoo')), 'gentoo-portage');
  assert.equal(selectRecipeGenerator({ dockerApps: ['pihole'] }, distro('freebsd')), 'freebsd-pkg');
  assert.equal(selectRecipeGenerator({ desktopApps: ['neovim'] }, distro('openbsd')), 'openbsd-pkg');
  assert.equal(selectRecipeGenerator({ useCase: 'desktop' }, distro('linux-mint')), undefined);
});
