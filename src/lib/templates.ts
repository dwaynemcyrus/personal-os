/**
 * Template variable replacement utilities
 *
 * Supported variables:
 * - {{date}} - Current date in YYYY-MM-DD format
 * - {{date:format}} - Current date with custom format
 * - {{time}} - Current time in HH:mm format
 * - {{datetime}} - Current date and time
 * - {{title}} - Template title or custom title
 * - {{year}} - Current year
 * - {{month}} - Current month (01-12)
 * - {{day}} - Current day (01-31)
 * - {{weekday}} - Day of week (Monday, Tuesday, etc.)
 */

export type TemplateVariables = {
  title?: string;
  date?: Date;
};

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatDate(date: Date, format?: string): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const weekday = WEEKDAYS[date.getDay()];
  const monthName = MONTHS[date.getMonth()];

  if (!format) {
    return `${year}-${month}-${day}`;
  }

  // Simple format replacements
  return format
    .replace(/YYYY/g, year.toString())
    .replace(/YY/g, year.toString().slice(-2))
    .replace(/MMMM/g, monthName)
    .replace(/MMM/g, monthName.slice(0, 3))
    .replace(/MM/g, month)
    .replace(/M/g, (date.getMonth() + 1).toString())
    .replace(/DD/g, day)
    .replace(/D/g, date.getDate().toString())
    .replace(/dddd/g, weekday)
    .replace(/ddd/g, weekday.slice(0, 3));
}

function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Replace template variables in content
 */
export function replaceTemplateVariables(
  content: string,
  variables: TemplateVariables = {}
): string {
  const date = variables.date ?? new Date();
  const title = variables.title ?? 'Untitled';

  let result = content;

  // Replace {{date:format}} first (more specific)
  result = result.replace(/\{\{date:([^}]+)\}\}/g, (_, format) =>
    formatDate(date, format)
  );

  // Replace simple variables
  const replacements: Record<string, string> = {
    date: formatDate(date),
    time: formatTime(date),
    datetime: formatDateTime(date),
    title: title,
    year: date.getFullYear().toString(),
    month: pad(date.getMonth() + 1),
    day: pad(date.getDate()),
    weekday: WEEKDAYS[date.getDay()],
  };

  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  return result;
}

/**
 * Find the position to place cursor after template insertion
 * Returns the position after the first empty line or task item
 */
export function findCursorPosition(content: string): number {
  // Look for empty task items first
  const emptyTaskMatch = content.match(/- \[ \] (\n|$)/);
  if (emptyTaskMatch && emptyTaskMatch.index !== undefined) {
    // Position cursor after "- [ ] "
    return emptyTaskMatch.index + 6;
  }

  // Look for first empty line after a heading
  const lines = content.split('\n');
  let position = 0;
  let foundHeading = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#')) {
      foundHeading = true;
    } else if (foundHeading && line.trim() === '') {
      // Return position at start of next line (or end of empty line)
      return position + line.length + 1;
    }
    position += line.length + 1; // +1 for newline
  }

  // Default to end of content
  return content.length;
}
