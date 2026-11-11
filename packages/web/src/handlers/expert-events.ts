import { UserCriteria } from '@distro-tailor/core';
import { EXPERT_FIELDS } from '../data/expert-options.js';
import { router } from '../state/router.js';
import { store } from '../state/store.js';

export function closeExpertMatrix(): void {
  store.setTab('wizard');
  router.saveStateToUrl(store.getState(), true);
}

/** Expert matrix select inputs and apply / close buttons. */
export function bindExpertEvents(): void {
  // Expert Matrix inputs
  const bindExpertSelect = <K extends keyof UserCriteria>(id: string, key: K) => {
    document.getElementById(id)?.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value;
      const newCrit = { ...store.getState().criteria };
      if (val) {
        newCrit[key] = val as UserCriteria[K];
      } else {
        delete newCrit[key];
      }
      store.update({ criteria: newCrit });
    });
  };

  EXPERT_FIELDS.forEach((field) => {
    bindExpertSelect(field.id, field.criteriaKey);
  });

  document.getElementById('btn-close-expert')?.addEventListener('click', closeExpertMatrix);
  document.getElementById('btn-cancel-expert')?.addEventListener('click', closeExpertMatrix);

  document.getElementById('btn-apply-expert')?.addEventListener('click', () => {
    store.setTab('results');
    router.saveStateToUrl(store.getState(), true);
  });
}
