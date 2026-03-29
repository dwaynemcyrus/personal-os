/**
 * Generates a cuid in the format YYYYMMDDHHMMSS + 4 random hex chars.
 * Matches the schema convention: "{{date:YYYYMMDD}}{{time:HHmmss}}"
 */
export function generateCuid(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const date =
    String(now.getFullYear()) +
    pad(now.getMonth() + 1) +
    pad(now.getDate());
  const time =
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());
  const rand = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `${date}${time}${rand}`;
}
