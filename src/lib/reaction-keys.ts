/**
 * Purpose: Keep existing hearts while adding independent reaction choices.
 * Scope: Stable moment/image database keys, preserving legacy post IDs for the heart reaction.
 * Does NOT belong: Database schema, counts, or UI state.
 * Copyright (c) 2026 William Carson McRae. All rights reserved.
 * SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
 */
import { reactions, type ReactionKind } from '../data/reactions';
export function reactionKey(post: string, kind: ReactionKind): string {
  return kind === 'heart' ? post : `${post}--${kind}`;
}
export function reactionKeys(posts: string[]): string[] {
  return posts.flatMap((post) => reactions.map((reaction) => reactionKey(post, reaction.id)));
}
