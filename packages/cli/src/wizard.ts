import * as p from '@clack/prompts';
import pc from 'picocolors';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  evaluateCriteria,
  QuestionFlow,
  QUESTIONS,
  UserCriteria
} from '@distro-tailor/core';

export async function runInteractiveWizard(): Promise<void> {
  console.clear();
  p.intro(pc.bold(pc.cyan('🐧 DistroTailor — Linux Distro Selector & Recipe Generator')));

  const criteria: UserCriteria = {};
  const answeredQuestionIds = new Set<string>();
  const flow = new QuestionFlow(QUESTIONS);

  let nextQuestion = flow.getNextQuestion(criteria, answeredQuestionIds);

  while (nextQuestion) {
    const progress = flow.getProgress(criteria, answeredQuestionIds);
    const progressLabel = pc.dim(`[Step ${progress.current + 1}/${progress.total}]`);

    const selectedOptionId = await p.select({
      message: `${progressLabel} ${pc.bold(nextQuestion.prompt)}`,
      options: nextQuestion.options.map((opt) => ({
        value: opt.id,
        label: `${opt.icon ? opt.icon + ' ' : ''}${opt.label}`,
        hint: opt.description
      }))
    });

    if (p.isCancel(selectedOptionId)) {
      p.cancel('DistroTailor wizard cancelled.');
      process.exit(0);
    }

    const matchedOption = nextQuestion.options.find((opt) => opt.id === selectedOptionId);
    if (matchedOption) {
      Object.assign(criteria, matchedOption.appliesCriteria);
    }

    answeredQuestionIds.add(nextQuestion.id);
    nextQuestion = flow.getNextQuestion(criteria, answeredQuestionIds);
  }

  const s = p.spinner();
  s.start('Matching distributions and generating custom build harness...');
  await new Promise((resolve) => setTimeout(resolve, 350));
  const result = evaluateCriteria(criteria);
  s.stop('Analysis complete!');

  // Display Top Matches
  p.note(
    result.topMatches
      .map(
        (m, idx) =>
          `${pc.bold(`${idx + 1}. ${m.distro.name}`)} (${pc.green(`${m.score}% match`)})\n` +
          `   ${pc.italic(m.distro.tagline)}\n` +
          `   ${pc.dim(`• Footprint: ${m.distro.footprint} | Init: ${m.distro.initSystems.join(', ')} | Libc: ${m.distro.cLibraries.join(', ')}`)}\n` +
          `   ${pc.cyan(`• Website: ${m.distro.website}`)}`
      )
      .join('\n\n'),
    '🎯 Top Distribution Matches'
  );

  // If Prebuilt image info exists
  if (result.bestMatch.distro.prebuiltImage) {
    const img = result.bestMatch.distro.prebuiltImage;
    p.note(
      `${img.downloadUrl ? `Download: ${img.downloadUrl}\n` : ''}` +
      `${img.dockerPull ? `Container: ${img.dockerPull}\n` : ''}` +
      `${img.quickstartCommand ? `Launch: ${img.quickstartCommand}` : ''}`,
      '📦 Official Prebuilt Image'
    );
  }

  // If a custom recipe was generated
  if (result.recommendedRecipe) {
    const recipe = result.recommendedRecipe;
    p.note(
      `${pc.bold(recipe.title)}\n` +
      `${recipe.summary}\n\n` +
      `${pc.dim(`Estimated build time: ~${recipe.estimatedBuildTimeMinutes} mins`)}\n` +
      `${pc.dim(`Host dependencies: ${recipe.hostDependencies.join(', ')}`)}\n\n` +
      `Generated files: ${recipe.files.map((f) => pc.yellow(f.filename)).join(', ')}`,
      '🛠️ Custom Build Recipe Available'
    );

    const shouldExport = await p.confirm({
      message: 'Would you like to export the custom build recipe (Makefile & configs) to disk?',
      initialValue: true
    });

    if (shouldExport && !p.isCancel(shouldExport)) {
      const outputDir = (await p.text({
        message: 'Destination folder for build recipe:',
        defaultValue: './distro-recipe',
        placeholder: './distro-recipe'
      })) as string;

      if (!p.isCancel(outputDir)) {
        const targetPath = path.resolve(process.cwd(), outputDir);
        await fs.mkdir(targetPath, { recursive: true });

        for (const file of recipe.files) {
          const filePath = path.join(targetPath, file.filename);
          await fs.writeFile(filePath, file.content, 'utf-8');
          if (file.executable) {
            await fs.chmod(filePath, 0o755);
          }
        }

        p.log.success(
          pc.green(`Build recipe written to ${pc.bold(targetPath)}!`)
        );
        p.log.info(
          pc.cyan(`Next steps:\n  cd ${outputDir}\n  ${recipe.quickstartCommands[0] || 'make'}`)
        );
      }
    }
  }

  p.outro(pc.bold(pc.green('🐧 Tailoring complete. Enjoy your Linux journey!')));
}
