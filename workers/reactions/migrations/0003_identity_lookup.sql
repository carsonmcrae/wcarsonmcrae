-- Purpose: Bound the database work needed to erase a visitor’s pseudonymous identifiers.
-- Scope: Index visitor-hash lookup without changing any reactions, permanent totals, or secrets.
-- Does NOT belong: Rate-limit policy or resetting existing data.
-- Copyright (c) 2026 William Carson McRae. All rights reserved.
-- SPDX-License-Identifier: LicenseRef-Daysforth-Restricted
CREATE INDEX reactions_visitor_hash ON reactions(visitor_hash);
