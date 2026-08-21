export const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com';

/** Zoom multiplier applied to the splash art at the start of a round. */
export const INITIAL_ZOOM = 4.5;

/** How much the zoom is reduced after each wrong attempt. */
export const ZOOM_STEP = 0.5;

/** Zoom never goes below this (1 = full image visible). */
export const MIN_ZOOM = 1;

/** How long the splash stays visible in "Vulto" mode before disappearing. */
export const VULTO_REVEAL_MS = 1000;

/** Countdown (seconds) the player has to answer once the image vanishes in "Vulto" mode. */
export const VULTO_COUNTDOWN_S = 15;

/**
 * Multiplayer match constants. These are client-side mirrors only, purely
 * for knowing what to display and when to stop starting rounds — the SQL
 * functions (schema.sql) are the actual authority and hardcode their own
 * copies of the round-count/win-score thresholds. Keep them in sync manually.
 */
export const MULTIPLAYER_ROUND_S = 25;
export const MULTIPLAYER_ROUNDS = 5;
export const VULTO_WIN_POINTS = 3;
export const MULTIPLAYER_NEXT_ROUND_DELAY_MS = 3000;

/** How far apart each round card appears on the results screen. */
export const RESULTS_CARD_INTERVAL_MS = 1500;

/** Pause after the last round card before the winner reveal animates in. */
export const RESULTS_WINNER_PAUSE_MS = 1400;
