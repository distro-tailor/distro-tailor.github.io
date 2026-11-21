import test from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_LICENSE_MODELS, DISTRO_REGISTRY } from './distros.js';
import { PAID_ALTERNATIVES } from './paid-alternatives.js';
import { getDistroLegalCaveats, LEGAL_CAVEATS } from './legal-caveats.js';
import { evaluateCriteria } from '../engine/matcher.js';
import { QuestionFlow, withVisibleOptions } from '../engine/question-flow.js';
import { applyAnswer, type AnswerState } from '../engine/answer-replay.js';
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

test('Deployment site: asked for server builds, inferred in Goal mode, tunes stability, and URL-safe', () => {
  const flow = new QuestionFlow(QUESTIONS);
  const asked = (c: Parameters<typeof evaluateCriteria>[0]) => flow.getEligibleQuestions(c).some((q) => q.id === 'deployment_site');
  assert.equal(asked({ experienceLevel: 'intermediate', useCase: 'ai-gpu-compute' }), true);
  assert.equal(asked({ experienceLevel: 'intermediate', useCase: 'server' }), true);
  assert.equal(asked({ experienceLevel: 'intermediate', useCase: 'community-network' }), true);
  assert.equal(asked({ experienceLevel: 'intermediate', useCase: 'desktop' }), false);
  // Goal mode infers it for home and community goals, so beginners are not asked again
  assert.equal(asked({ experienceLevel: 'beginner', useCase: 'server', deploymentSite: 'home' }), false);

  // Shared and remote sites mark down rolling releases; home has no preference
  const score = (c: Parameters<typeof evaluateCriteria>[0], id: string) => evaluateCriteria(c).allMatches.find((m) => m.distro.id === id)!.score;
  // Pick a rolling distro that scores above zero for a server request, so the penalty is visible
  const base = { useCase: 'server' } as const;
  const rolling = evaluateCriteria(base).allMatches.find((m) => m.distro.rollingRelease && m.score > 0)!;
  assert.ok(rolling, 'needs a rolling distro with a positive server score');
  const id = rolling.distro.id;
  assert.equal(score({ ...base, deploymentSite: 'home' }, id), score(base, id));
  assert.ok(score({ ...base, deploymentSite: 'datacenter' }, id) < score(base, id));
  assert.equal(score({ ...base, deploymentSite: 'datacenter' }, 'debian'), score(base, 'debian'));
  // Workstations at an office are not penalised (e.g. a rolling pentest distro)
  assert.equal(
    evaluateCriteria({ useCase: 'security-pentest', deploymentSite: 'office' }).bestMatch.distro.id,
    evaluateCriteria({ useCase: 'security-pentest' }).bestMatch.distro.id
  );

  const params = serializeCriteriaToParams({ ...base, deploymentSite: 'community' });
  assert.equal(deserializeCriteriaFromParams(params).deploymentSite, 'community');
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

test('Community networks: mesh firmware on routers and boards, an OPNsense gateway on PCs', () => {
  const opt = (q: string, id: string) => QUESTIONS.find((x) => x.id === q)!.options.find((o) => o.id === id)!.appliesCriteria;
  const deviceKeys = new Set(QUESTIONS.find((q) => q.id === 'beginner_device')!.options.flatMap((o) => Object.keys(o.appliesCriteria)));
  const wizard = (goal: string, device: string) => ({
    experienceLevel: 'beginner' as const,
    ...Object.fromEntries(Object.entries(opt('beginner_goal', goal)).filter(([k]) => !deviceKeys.has(k))),
    ...opt('beginner_device', device)
  });

  assert.equal(evaluateCriteria(wizard('community_wifi', 'wifi_router')).bestMatch.distro.id, 'libremesh');
  assert.equal(evaluateCriteria(wizard('community_wifi', 'raspberry_pi')).bestMatch.distro.id, 'libremesh');
  assert.equal(evaluateCriteria(wizard('community_wifi', 'standard_desktop')).bestMatch.distro.id, 'opnsense');
  assert.equal(evaluateCriteria(wizard('offline_library', 'raspberry_pi')).bestMatch.distro.id, 'internet-in-a-box');

  const community = evaluateCriteria(wizard('community_wifi', 'wifi_router'));
  assert.deepEqual(community.paidAlternatives.map((a) => a.id), ['splynx']);
  for (const id of ['radio-regulations', 'sharing-internet-access']) {
    assert.ok(community.legalCaveats.some((c) => c.id === id), id);
  }
  assert.ok(evaluateCriteria(wizard('offline_library', 'raspberry_pi')).legalCaveats.some((c) => c.id === 'offline-content-licences'));
});

test('Specialist builds lose to their general distro unless their specialty is requested', () => {
  assert.equal(evaluateCriteria({ platform: 'router-firewall', architecture: 'mips', useCase: 'router-networking' }).bestMatch.distro.id, 'openwrt');
  assert.notEqual(evaluateCriteria({ useCase: 'education-kids' }).bestMatch.distro.id, 'internet-in-a-box');
});

test('Option visibility: the Wi-Fi router device is only offered for network goals', () => {
  const device = QUESTIONS.find((q) => q.id === 'beginner_device')!;
  const ids = (useCase: Parameters<typeof evaluateCriteria>[0]['useCase']) =>
    withVisibleOptions(device, { experienceLevel: 'beginner', useCase }).options.map((o) => o.id);
  assert.ok(ids('community-network').includes('wifi_router'));
  assert.ok(ids('router-networking').includes('wifi_router'));
  assert.ok(!ids('desktop').includes('wifi_router'));
  assert.ok(ids('desktop').includes('standard_desktop'));
});

test('Remote sites: power and internet questions appear only for community builds and steer picks', () => {
  const flow = new QuestionFlow(QUESTIONS);
  const asked = (c: Parameters<typeof evaluateCriteria>[0]) => flow.getEligibleQuestions(c).map((q) => q.id);
  for (const c of [{ useCase: 'community-network' }, { useCase: 'offline-library' }, { useCase: 'server', deploymentSite: 'community' }] as const) {
    assert.ok(asked({ experienceLevel: 'beginner', ...c }).includes('power_supply'), JSON.stringify(c));
    assert.ok(asked({ experienceLevel: 'beginner', ...c }).includes('internet_uplink'), JSON.stringify(c));
  }
  assert.ok(!asked({ experienceLevel: 'beginner', useCase: 'server', deploymentSite: 'home' }).includes('power_supply'));
  assert.ok(!asked({ experienceLevel: 'beginner', useCase: 'desktop' }).includes('internet_uplink'));

  const pc = { experienceLevel: 'beginner', useCase: 'server', architecture: 'x86_64', platform: 'bare-metal', formFactor: 'desktop', prefersGui: false, deploymentSite: 'community' } as const;
  assert.equal(evaluateCriteria({ ...pc, powerSupply: 'mains', uplink: 'fast' }).bestMatch.distro.id, 'ubuntu');
  assert.equal(evaluateCriteria({ ...pc, powerSupply: 'solar-battery', uplink: 'none' }).bestMatch.distro.id, 'dietpi');

  // Offline sites mark down rolling releases
  const offline = evaluateCriteria({ useCase: 'desktop', uplink: 'none' });
  const arch = offline.allMatches.find((m) => m.distro.id === 'arch')!;
  assert.ok(arch.reasons.some((r) => r.feature === 'Offline-First' && !r.matched));

  const params = serializeCriteriaToParams({ powerSupply: 'solar-battery', uplink: 'slow' });
  const back = deserializeCriteriaFromParams(params);
  assert.equal(back.powerSupply, 'solar-battery');
  assert.equal(back.uplink, 'slow');
});

test('Chromebooks and budget laptops: distros with standard drivers and Chromebook fixes win', () => {
  const opt = (q: string, id: string) => QUESTIONS.find((x) => x.id === q)!.options.find((o) => o.id === id)!.appliesCriteria;
  const deviceKeys = new Set(QUESTIONS.find((q) => q.id === 'beginner_device')!.options.flatMap((o) => Object.keys(o.appliesCriteria)));
  const onChromebook = (goal: string) =>
    evaluateCriteria({
      experienceLevel: 'beginner',
      ...Object.fromEntries(Object.entries(opt('beginner_goal', goal)).filter(([k]) => !deviceKeys.has(k))),
      ...opt('beginner_device', 'budget_laptop'),
      maxRamMb: 4096
    });

  for (const goal of ['daily_desktop', 'coding_dev', 'freelance_office_docs']) {
    assert.ok(['ubuntu', 'linux-mint', 'fedora'].includes(onChromebook(goal).bestMatch.distro.id), goal);
  }
  assert.equal(onChromebook('kids_education').bestMatch.distro.id, 'endless-os');
  // Devices are assumed to be owned by the user, so there is no ownership warning
  assert.ok(!onChromebook('kids_education').legalCaveats.some((c) => /chromebook|managed/i.test(c.id)));
});

test('Private everyday computer: privacy-by-default desktops, kept apart from Tails/Kali', () => {
  const goal = QUESTIONS.find((q) => q.id === 'beginner_goal')!.options.find((o) => o.id === 'private_everyday')!.appliesCriteria;
  assert.equal(goal.privacyFocus, true);
  // As in the wizard, the laptop device answer replaces the goal's hardware keys (platform, footprint, …)
  const deviceKeys = new Set(QUESTIONS.find((q) => q.id === 'beginner_device')!.options.flatMap((o) => Object.keys(o.appliesCriteria)));
  const laptop = QUESTIONS.find((q) => q.id === 'beginner_device')!.options.find((o) => o.id === 'standard_laptop')!.appliesCriteria;
  const goalOnly = Object.fromEntries(Object.entries(goal).filter(([k]) => !deviceKeys.has(k)));
  const pick = evaluateCriteria({ experienceLevel: 'beginner', ...goalOnly, ...laptop }).bestMatch;
  assert.ok(['linux-mint', 'fedora', 'fedora-silverblue', 'debian'].includes(pick.distro.id), pick.distro.id);
  assert.ok(pick.reasons.some((r) => r.feature === 'Privacy by Default' && r.matched));
  assert.ok(!['tails', 'kali-linux'].includes(pick.distro.id));

  const params = serializeCriteriaToParams({ privacyFocus: true });
  assert.equal(deserializeCriteriaFromParams(params).privacyFocus, true);
});

test('Small business office: a quiet file and backup server with a data-protection note', () => {
  const opt = (q: string, id: string) => QUESTIONS.find((x) => x.id === q)!.options.find((o) => o.id === id)!.appliesCriteria;
  const deviceKeys = new Set(QUESTIONS.find((q) => q.id === 'beginner_device')!.options.flatMap((o) => Object.keys(o.appliesCriteria)));
  const office = (device: string) =>
    evaluateCriteria({
      experienceLevel: 'beginner',
      ...Object.fromEntries(Object.entries(opt('beginner_goal', 'small_business_office')).filter(([k]) => !deviceKeys.has(k))),
      ...opt('beginner_device', device)
    });

  assert.equal(office('standard_desktop').bestMatch.distro.id, 'openmediavault');
  assert.equal(office('used_server_rack').bestMatch.distro.id, 'truenas-scale');
  assert.ok(office('raspberry_pi').legalCaveats.some((c) => c.id === 'business-data-protection'));
  assert.deepEqual(office('standard_desktop').paidAlternatives.map((a) => a.id), ['unraid']);

  // The office site is inferred in Goal mode, so beginners are not asked where it runs
  const flow = new QuestionFlow(QUESTIONS);
  const ids = flow.getEligibleQuestions({ experienceLevel: 'beginner', ...opt('beginner_goal', 'small_business_office') }).map((q) => q.id);
  assert.ok(!ids.includes('deployment_site'));
});

test('Matcher: a clear error, not a crash, when no free/open-source candidate is left', () => {
  const base = DISTRO_REGISTRY.find((d) => d.id === 'ubuntu')!;
  const paidOnly: DistroProfile = { ...base, id: 'paid-only', licensing: { model: 'proprietary', license: 'Proprietary' } };
  assert.throws(() => evaluateCriteria({ useCase: 'desktop' }, [paidOnly]), /licensing policy/);
});

test('applyAnswer: shared web/CLI answer handling lets the device replace the goal hardware guesses', () => {
  const opt = (q: string, id: string) => QUESTIONS.find((x) => x.id === q)!.options.find((o) => o.id === id)!.appliesCriteria;
  let s: AnswerState = { criteria: {}, patches: {}, answeredIds: new Set<string>() };
  s = applyAnswer(s, 'user_familiarity', opt('user_familiarity', 'beginner'));
  s = applyAnswer(s, 'beginner_goal', opt('beginner_goal', 'home_server'));
  assert.equal(s.criteria.footprint, 'lean');
  assert.equal(s.criteria.platform, 'embedded-sbc');
  s = applyAnswer(s, 'beginner_device', opt('beginner_device', 'standard_desktop'));
  assert.equal(s.criteria.platform, 'bare-metal', 'device platform wins');
  assert.equal(s.criteria.footprint, undefined, 'device owns footprint, so the goal guess is dropped');
  assert.equal(s.criteria.useCase, 'server');
  assert.ok(s.answeredIds.has('beginner_device'));
});

test('Goal mode never asks beginners the release-model question: every goal infers it', () => {
  const flow = new QuestionFlow(QUESTIONS);
  const goals = QUESTIONS.find((q) => q.id === 'beginner_goal')!.options;
  for (const goal of goals) {
    const criteria = { experienceLevel: 'beginner' as const, ...goal.appliesCriteria };
    const asked = flow.getEligibleQuestions(criteria).some((q) => q.id === 'release_cadence');
    assert.equal(asked, false, `${goal.id} must infer releaseCadence instead of asking beginners`);
  }
  // Technical mode still asks it
  assert.ok(flow.getEligibleQuestions({ experienceLevel: 'intermediate', useCase: 'desktop' }).some((q) => q.id === 'release_cadence'));
});
