/**
 * Purpose: Compose count reads and explicit moment commands once optional actions become useful.
 * Scope: Shared hydrated choices, validated counts, action feedback, semantic activation, and cleanup.
 * Does NOT belong: Initial template/choice hydration, loading triggers, or database policy.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { initPostActions, type ActionWindow } from './post-actions';
import type { initActionChoices } from './action-choices';
import { initActionNotice } from './notices';
import { attachPostActionEvents } from './post-action-events';

export function initPostEnhancements(
  doc: Document,
  win: ActionWindow & Pick<Window, 'setTimeout' | 'clearTimeout'>,
  endpoint: string,
  choices: ReturnType<typeof initActionChoices>,
) {
  const state = initPostActions(doc, win, endpoint, choices);
  const notice = initActionNotice(doc, win);
  const events = attachPostActionEvents(doc, win, endpoint, state, notice.show);
  return {
    activate: events.activate,
    destroy: () => {
      events.destroy();
      notice.destroy();
      state.destroy();
    },
  };
}
