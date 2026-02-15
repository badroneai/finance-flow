// Stage 7 — Stable Exports Map (post-0.2: re-exports from merged modules)
// Single source of truth for importing core modules to reduce path drift.

// Core intelligence/analytics — بعد الدمج في برومبت 0.2
export * as ledgerBrain from './ledger-health.js';
export * as ledgerForecast from './ledger-planner.js';
export * as ledgerVariance from './ledger-analytics.js';
export * as ledgerIntelligenceV1 from './ledger-health.js';

// Optional: keep adding exports here over time (without breaking).
