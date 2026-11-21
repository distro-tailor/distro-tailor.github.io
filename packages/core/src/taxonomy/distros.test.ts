import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_LICENSE_MODELS, DISTRO_REGISTRY } from './distros.js';
import { PAID_ALTERNATIVES } from './paid-alternatives.js';
import { getDistroLegalCaveats, LEGAL_CAVEATS } from './legal-caveats.js';
import { evaluateCriteria } from '../engine/matcher.js';
import { QuestionFlow } from '../engine/question-flow.js';
import { QUESTIONS } from './questions.js';
import { deserializeCriteriaFromParams, serializeCriteriaToParams } from '../migrations/url-schema.js';
import { DistroProfile } from '../types.js';

test('Licensing policy: every registered distro is free and/or open source', () => {
  for (const distro of DISTRO_REGISTRY) {
    assert.ok(
      ALLOWED_LICENSE_MODELS.includes(distro.licensing.model),
      `${distro.id} has license model "${distro.licensing.model}", which the free/open-source policy does not allow`
    );
    assert.ok(distro.licensing.license.trim().length > 0, `${distro.id} must name its license`);
  }
});

test('Licensing policy: optional-paid and firmware models explain what is optional or closed', () => {
  for (const distro of DISTRO_REGISTRY) {
    if (distro.licensing.model === 'foss-optional-paid' || distro.licensing.model === 'foss-with-firmware') {
      assert.ok(distro.licensing.note, `${distro.id} (${distro.licensing.model}) needs a note on what is paid or closed`);
    }
  }
});

test('Licensing policy: closed-core or usage-capped systems stay out of the registry', () => {
  const ids = DISTRO_REGISTRY.map((d) => d.id);
  for (const removed of ['hiveos', 'porteus-kiosk']) {
    assert.ok(!ids.includes(removed), `${removed} was removed for a closed-source core / paid usage cap`);
  }
  const v86 = DISTRO_REGISTRY.find((d) => d.id === 'webvm-v86')!;
  assert.ok(!v86.website.includes('webvm.io'), 'link the open-source v86 emulator, not the proprietary CheerpX-based WebVM');
});

test('Paid alternatives: catalogued with caveats, never registered, and backed by free options', () => {
  const registryIds = new Set(DISTRO_REGISTRY.map((d) => d.id));
  for (const alt of PAID_ALTERNATIVES) {
    assert.ok(!ALLOWED_LICENSE_MODELS.includes(alt.licensing.model), `${alt.id} is free/open source, so it belongs in the registry`);
    assert.ok(!registryIds.has(alt.id), `${alt.id} must not share an id with a registered distro`);
    assert.ok(alt.caveat.length > 0 && alt.pitch.length > 0, `${alt.id} needs a pitch and a caveat`);
    assert.ok(alt.freeOptionIds.length > 0, `${alt.id} must point to at least one free option`);
    for (const id of alt.freeOptionIds) assert.ok(registryIds.has(id), `${alt.id} free option ${id} must be registered`);
  }
});

test('Paid alternatives: shown for the matching use case only, beside a free top pick', () => {
  const mining = evaluateCriteria({ useCase: 'ai-gpu-compute', platform: 'server', prefersGui: false });
  assert.deepEqual(mining.paidAlternatives.map((a) => a.id), ['hiveos']);
  assert.ok(ALLOWED_LICENSE_MODELS.includes(mining.bestMatch.distro.licensing.model));

  assert.deepEqual(evaluateCriteria({ useCase: 'nas-storage' }).paidAlternatives.map((a) => a.id), ['unraid']);
  assert.deepEqual(evaluateCriteria({ useCase: 'desktop' }).paidAlternatives, []);
  assert.deepEqual(evaluateCriteria({}).paidAlternatives, []);
});

test('Matcher: a paid or closed-core system is never scored, even with a perfect fit', () => {
  const base = DISTRO_REGISTRY.find((d) => d.id === 'ubuntu')!;
  const paid: DistroProfile = {
    ...base,
    id: 'paid-perfect-fit',
    name: 'Paid Perfect Fit',
    primaryUseCases: ['ai-gpu-compute'],
    licensing: { model: 'freemium-closed', license: 'Proprietary' }
  };
  const result = evaluateCriteria({ useCase: 'ai-gpu-compute' }, [paid, ...DISTRO_REGISTRY]);
  assert.ok(!result.allMatches.some((m) => m.distro.id === 'paid-perfect-fit'));
});

test('Legal caveats: every caveat targets something and every distro id exists', () => {
  const registryIds = new Set(DISTRO_REGISTRY.map((d) => d.id));
  for (const caveat of LEGAL_CAVEATS) {
    assert.ok(caveat.distroIds?.length || caveat.appliesTo, `${caveat.id} must target distros or criteria`);
    for (const id of caveat.distroIds ?? []) assert.ok(registryIds.has(id), `${caveat.id} targets unknown distro ${id}`);
    assert.ok(caveat.title.length > 0 && caveat.text.length > 0);
  }
});

test('Legal caveats: surfaced for the top match and the chosen criteria', () => {
  const ids = (c: Parameters<typeof evaluateCriteria>[0]) => evaluateCriteria(c).legalCaveats.map((x) => x.id);

  assert.ok(ids({ useCase: 'gaming', footprint: 'lean', platform: 'bare-metal' }).includes('game-roms-and-bios'));
  assert.ok(ids({ useCase: 'security-pentest' }).includes('authorized-security-testing'));
  const gpu = ids({ useCase: 'ai-gpu-compute', platform: 'server', prefersGui: false });
  assert.ok(gpu.includes('nvidia-geforce-datacenter'));
  assert.ok(gpu.includes('crypto-mining-law'));
  assert.ok(ids({ useCase: 'media-center' }).includes('kodi-third-party-addons'));
  assert.deepEqual(ids({ useCase: 'home-office' }), []);

  assert.deepEqual(getDistroLegalCaveats('tails').map((c) => c.id), ['tor-restrictions']);
  assert.deepEqual(getDistroLegalCaveats('debian'), []);
});

test('Legal caveats: the NVIDIA note follows the driver choice and where the machine runs', () => {
  const nvidia = (c: Parameters<typeof evaluateCriteria>[0]) =>
    evaluateCriteria(c).legalCaveats.some((x) => x.id === 'nvidia-geforce-datacenter');
  const gpu = { useCase: 'ai-gpu-compute', platform: 'server', prefersGui: false } as const;

  assert.equal(nvidia(gpu), true, 'unknown site: show it to be safe');
  assert.equal(nvidia({ ...gpu, driverPhilosophy: 'free-software-only' }), false, 'no proprietary NVIDIA driver in use');
  assert.equal(nvidia({ ...gpu, deploymentSite: 'home' }), false, 'home rigs and homelabs are covered by the licence');
  assert.equal(nvidia({ ...gpu, deploymentSite: 'office' }), true);
  assert.equal(nvidia({ ...gpu, deploymentSite: 'datacenter' }), true);
  // Crypto-mining note is about local law, not where the rig sits
  assert.ok(evaluateCriteria({ ...gpu, deploymentSite: 'home' }).legalCaveats.some((x) => x.id === 'crypto-mining-law'));
});

test('Deployment site: asked only for GPU or proprietary-driver servers, never scored, and URL-safe', () => {
  const flow = new QuestionFlow(QUESTIONS);
  const asked = (c: Parameters<typeof evaluateCriteria>[0]) => flow.getEligibleQuestions(c).some((q) => q.id === 'deployment_site');
  assert.equal(asked({ experienceLevel: 'intermediate', useCase: 'ai-gpu-compute' }), true);
  assert.equal(asked({ experienceLevel: 'intermediate', useCase: 'server', platform: 'server', driverPhilosophy: 'seamless-proprietary' }), true);
  assert.equal(asked({ experienceLevel: 'intermediate', useCase: 'ai-gpu-compute', driverPhilosophy: 'free-software-only' }), false);
  assert.equal(asked({ experienceLevel: 'intermediate', useCase: 'desktop' }), false);

  const base = { useCase: 'ai-gpu-compute', platform: 'server' } as const;
  const scores = (r: ReturnType<typeof evaluateCriteria>) => r.allMatches.map((m) => `${m.distro.id}:${m.score}`);
  assert.deepEqual(scores(evaluateCriteria({ ...base, deploymentSite: 'datacenter' })), scores(evaluateCriteria(base)));

  const params = serializeCriteriaToParams({ ...base, deploymentSite: 'office' });
  assert.equal(deserializeCriteriaFromParams(params).deploymentSite, 'office');
  assert.equal(deserializeCriteriaFromParams({ ...params, deploymentSite: 'moon-base' }).deploymentSite, undefined);
});

test('Game servers: free server OS on the hardware you have, with paid hosts only as alternatives', () => {
  const goal = QUESTIONS.find((q) => q.id === 'beginner_goal')!.options.find((o) => o.id === 'game_server_lan')!;
  const device = (id: string) => QUESTIONS.find((q) => q.id === 'beginner_device')!.options.find((o) => o.id === id)!.appliesCriteria;

  // As in the wizard, the device answer replaces every hardware key it owns (platform, footprint, …)
  const deviceKeys = new Set(QUESTIONS.find((q) => q.id === 'beginner_device')!.options.flatMap((o) => Object.keys(o.appliesCriteria)));
  const goalOnly = Object.fromEntries(Object.entries(goal.appliesCriteria).filter(([k]) => !deviceKeys.has(k)));
  const pc = evaluateCriteria({ experienceLevel: 'beginner', ...goalOnly, ...device('standard_desktop') });
  assert.equal(pc.bestMatch.distro.id, 'ubuntu');
  const pi = evaluateCriteria({ experienceLevel: 'beginner', useCase: 'game-server', prefersGui: false, ...device('raspberry_pi') });
  assert.equal(pi.bestMatch.distro.id, 'dietpi');

  assert.deepEqual(pc.paidAlternatives.map((a) => a.id), ['cubecoders-amp', 'minecraft-realms']);
  assert.ok(pc.legalCaveats.some((c) => c.id === 'game-server-terms'));

  // Headless server: no audio or peripheral questions
  const flow = new QuestionFlow(QUESTIONS);
  const ids = flow.getEligibleQuestions({ experienceLevel: 'beginner', useCase: 'game-server', platform: 'bare-metal' }).map((q) => q.id);
  assert.ok(!ids.includes('audio_latency'));
  assert.ok(!ids.includes('attached_peripherals'));
});
