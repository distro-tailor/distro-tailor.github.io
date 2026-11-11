import { DistroScore, GeneratedRecipe, RecommendationOutput } from '@distro-tailor/core';
import { AddonCombo } from '../app-suites.js';
import { AppState } from '../../state/store.js';

/** Values derived once per render and shared by every results-view section. */
export interface ResultsViewContext {
  evaluation: RecommendationOutput;
  state: AppState;
  best: DistroScore;
  recipe: GeneratedRecipe | undefined;
  combos: AddonCombo[];
  isServer: boolean;
  selectedAppsCount: number;
  hasSelectedApps: boolean;
  hasFrankenstein: boolean;
  hasFlatpakDefault: boolean;
}
