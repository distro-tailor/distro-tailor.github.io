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
});

test("Recipe Selection: falls back to the best match's own generator", () => {
  assert.equal(selectRecipeGenerator({ useCase: 'kiosk-signage' }, distro('cage-appliance')), 'kiosk-web');
});

test('Recipe Selection: explicit customizations fall back to debootstrap, except for Arch', () => {
  assert.equal(selectRecipeGenerator({ enableNix: true }, distro('linux-mint')), 'debootstrap-debian');
  assert.equal(selectRecipeGenerator({ enableNix: true }, distro('arch')), undefined);
  assert.equal(selectRecipeGenerator({ useCase: 'desktop' }, distro('linux-mint')), undefined);
});
