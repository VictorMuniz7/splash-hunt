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
