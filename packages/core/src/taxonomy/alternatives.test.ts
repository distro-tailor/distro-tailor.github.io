import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllAlternativeComparisons, getDistroAlternatives } from './alternatives.js';
import { DISTRO_REGISTRY } from './distros.js';

test('Alternative Comparisons: Linux Mint provides transparent rationale over Vanilla Ubuntu', () => {
  const mintAlts = getDistroAlternatives('linux-mint');
  assert.ok(mintAlts.length >= 1, 'Linux Mint should have alternative comparisons defined');
  const ubuntuComp = mintAlts.find(a => a.popularAlternative.includes('Ubuntu'));
  assert.ok(ubuntuComp, 'Must compare against Ubuntu');
  assert.ok(ubuntuComp.whyThisInstead.includes('Snap'));
  assert.ok(ubuntuComp.whyThisInstead.includes('Cinnamon'));
  assert.ok(ubuntuComp.headline.includes('Linux Mint'));
  assert.ok(ubuntuComp.tradeoffNotice?.includes('SLA'));
});

test('Alternative Comparisons: Fedora Workstation provides transparent rationale over Red Hat (RHEL)', () => {
  const fedoraAlts = getDistroAlternatives('fedora');
  assert.ok(fedoraAlts.length >= 1, 'Fedora should have alternative comparisons defined');
  const rhelComp = fedoraAlts.find(a => a.popularAlternative.includes('RHEL') || a.popularAlternative.includes('Red Hat'));
  assert.ok(rhelComp, 'Must compare against Red Hat (RHEL)');
  assert.ok(rhelComp.whyThisInstead.includes('Red Hat'));
  assert.ok(rhelComp.whyThisInstead.includes('subscription'));
  assert.ok(rhelComp.headline.includes('Fedora'));
});

test('Alternative Comparisons: Pop!_OS, Batocera, LibreELEC, DietPi, and Talos define valid comparative rationales', () => {
  const targetDistroIds = ['pop-os', 'batocera', 'libreelec', 'dietpi', 'talos', 'antix', 'ubuntu-studio'];

  for (const id of targetDistroIds) {
    const alts = getDistroAlternatives(id);
    assert.ok(alts.length >= 1, `Distro ${id} must have at least one alternative comparison`);
    for (const comp of alts) {
      assert.ok(comp.popularAlternative && comp.popularAlternative.length > 0);
      assert.ok(comp.relation && ['upstream', 'fork', 'competitor', 'enterprise-sibling'].includes(comp.relation));
      assert.ok(comp.headline && comp.headline.length > 0);
      assert.ok(comp.whyThisInstead && comp.whyThisInstead.length > 20);
    }
  }
});

test('Alternative Comparisons: getAllAlternativeComparisons returns non-empty catalog', () => {
  const catalog = getAllAlternativeComparisons();
  const keys = Object.keys(catalog);
  assert.ok(keys.length >= 7, 'Catalog must contain comparisons for multiple distributions');
  assert.ok(catalog['linux-mint']);
  assert.ok(catalog['fedora']);
});
