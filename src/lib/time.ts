export const nowIso = () => new Date().toISOString();

// ISO8601 to second precision, e.g. "2026-03-15T14:15:47" — used as default note title
export const nowIsoSeconds = () => new Date().toISOString().slice(0, 19);

// Filesystem-safe version of nowIsoSeconds (colons replaced with dashes)
export const nowIsoSecondsFilename = () => nowIsoSeconds().replace(/:/g, '-');
