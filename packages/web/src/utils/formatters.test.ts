import test from 'node:test';
import assert from 'node:assert/strict';
import { formatConstraint, generateMarkdownSummary } from './formatters.js';
import { evaluateCriteria } from '@distro-tailor/core';

test('Formatters: formatConstraint accurately maps all primary criteria dimensions', () => {
  // Experience level
  assert.deepEqual(formatConstraint('experienceLevel', 'beginner'), {
    label: 'Beginner / Goal-Oriented',
    icon: '🌱'
  });
  assert.deepEqual(formatConstraint('experienceLevel', 'systems-engineer'), {
    label: 'Systems Hacker',
    icon: '🌳'
  });

  // Use case
  assert.deepEqual(formatConstraint('useCase', 'media-center'), {
    label: 'Living Room Media Center',
    icon: '📺'
  });
  assert.deepEqual(formatConstraint('useCase', 'hypervisor-vms'), {
    label: 'Homelab Virtualization & Hypervisor',
    icon: '🖧'
  });

  // Hardware Architecture
  assert.deepEqual(formatConstraint('architecture', 'arm64'), {
    label: 'ARM64 (Raspberry Pi 4/5 / Apple Silicon / Snapdragon)',
    icon: '📱'
  });
  assert.deepEqual(formatConstraint('architecture', 'nommu'), {
    label: 'Microcontroller (NOMMU)',
    icon: '🔌'
  });

  // RAM budget
  assert.deepEqual(formatConstraint('maxRamMb', 1024), {
    label: '1024 MB RAM',
    icon: '🧠'
  });

  // Immutability & State
  assert.deepEqual(formatConstraint('statePreference', 'declarative'), {
    label: 'Declarative (NixOS / Guix)',
    icon: '❄️'
  });
  assert.deepEqual(formatConstraint('statePreference', 'mutable'), {
    label: 'Traditional Mutable (apt/dnf)',
    icon: '✏️'
  });
  assert.deepEqual(formatConstraint('statePreference', 'stateless-ram'), {
    label: 'Stateless / Run from RAM',
    icon: '⚡'
  });

  // C Libraries (including uclibc-ng)
  assert.deepEqual(formatConstraint('cLibPreference', 'uclibc-ng'), {
    label: 'uClibc-ng (Embedded)',
    icon: '🔌'
  });
  assert.deepEqual(formatConstraint('cLibPreference', 'uclibc'), {
    label: 'uClibc-ng (Embedded)',
    icon: '🔌'
  });
});

test('Formatters: formatConstraint safely handles dynamic apps, desktop envs and unknown keys', () => {
  // Known Docker app
  const pihole = formatConstraint('dockerApp', 'pihole');
  assert.ok(pihole.label.includes('Pi-hole'));
  assert.equal(pihole.icon, '🛡️');

  // Unknown Docker app with XSS payload
  const xssDocker = formatConstraint('dockerApp', '<script>evil()</script>');
  assert.equal(xssDocker.label, 'Docker: &lt;script&gt;evil()&lt;/script&gt;');

  // Desktop apps array
  assert.deepEqual(formatConstraint('desktopApps', ['firefox', 'vscode', 'vlc']), {
    label: 'Desktop Apps: 3 selected',
    icon: '📦'
  });

  // Emulator apps array
  assert.deepEqual(formatConstraint('emulatorApps', ['retroarch', 'dolphin']), {
    label: 'Emulators: 2 selected',
    icon: '🎮'
  });

  // Unknown arbitrary key with special characters
  const arbitrary = formatConstraint('customFeature', '<inject>');
  assert.equal(arbitrary.label, 'customFeature: &lt;inject&gt;');
  assert.equal(arbitrary.icon, '📌');
});

test('Formatters: generateMarkdownSummary formats complete recommendation summary', () => {
  const evalOutput = evaluateCriteria({
    useCase: 'media-center',
    experienceLevel: 'beginner'
  });

  const markdown = generateMarkdownSummary(
    evalOutput,
    { useCase: 'media-center', experienceLevel: 'beginner' },
    'https://distrotailor.dev/#?useCase=media-center'
  );

  assert.ok(markdown.includes('DistroTailor Recommendation'));
  assert.ok(markdown.includes('LibreELEC'));
  assert.ok(markdown.includes('Living Room Media Center'));
  assert.ok(markdown.includes('https://distrotailor.dev/#?useCase=media-center'));
});
