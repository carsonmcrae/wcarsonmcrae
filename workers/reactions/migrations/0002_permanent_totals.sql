-- Purpose: Preserve aggregate reaction counts when deduplication identifiers are erased or expire.
-- Scope: Remove the decrement trigger; existing counts and votes remain unchanged.
-- Does NOT belong: Resetting totals or rotating identity secrets.
-- Copyright (c) 2026 William Carson McRae. All rights reserved.
-- SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
DROP TRIGGER reaction_removed;
