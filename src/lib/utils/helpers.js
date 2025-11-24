/**
 * Utility helper functions
 */

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
export function generateId() {
	return crypto.randomUUID();
}

/**
 * Format date to ISO string for storage (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} ISO date string
 */
export function formatDateForStorage(date) {
	return date.toISOString().split('T')[0];
}

/**
 * Format date for display
 * @param {string} date_string - ISO date string
 * @param {Intl.DateTimeFormatOptions} [options] - Format options (defaults to dd MMM yyyy)
 * @returns {string} Formatted date string
 */
export function formatDate(
	date_string,
	options = {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	}
) {
	return new Date(date_string).toLocaleDateString('en-ZA', options);
}

/**
 * Format date for display with relative terms (Today, Yesterday, Tomorrow)
 * @param {string} date_string - ISO date string (YYYY-MM-DD)
 * @returns {string} Formatted date string
 */
export function formatRelativeDate(date_string) {
	const input_date = new Date(date_string + 'T00:00:00');
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	const diff_time = input_date.getTime() - today.getTime();
	const diff_days = Math.round(diff_time / (1000 * 60 * 60 * 24));
	
	if (diff_days === 0) return 'Today';
	if (diff_days === -1) return 'Yesterday';
	if (diff_days === 1) return 'Tomorrow';
	
	// Check if date is in current year
	const current_year = today.getFullYear();
	const input_year = input_date.getFullYear();
	const is_current_year = current_year === input_year;
	
	// Format as "Fri, 24 Oct" for current year or "Fri, 24 Oct 2025" for other years
	return formatDate(date_string, is_current_year ? {
		weekday: 'short',
		day: 'numeric',
		month: 'short'
	} : {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

/**
 * Available member colors with simple one-word names
 */
export const MEMBER_COLORS = [
	'red',
	'orange',
	'amber',
	'yellow',
	'lime',
	'green',
	'emerald',
	'teal',
	'cyan',
	'sky',
	'blue',
	'indigo',
	'violet',
	'purple',
	'fuchsia',
	'pink',
	'rose',
	'slate',
	'gray',
	'zinc'
];

/**
 * Map of color names to Tailwind CSS background classes
 */
const COLOR_TO_BG_CLASS = {
	red: 'bg-red-500',
	orange: 'bg-orange-500',
	amber: 'bg-amber-500',
	yellow: 'bg-yellow-500',
	lime: 'bg-lime-500',
	green: 'bg-green-500',
	emerald: 'bg-emerald-500',
	teal: 'bg-teal-500',
	cyan: 'bg-cyan-500',
	sky: 'bg-sky-500',
	blue: 'bg-blue-500',
	indigo: 'bg-indigo-500',
	violet: 'bg-violet-500',
	purple: 'bg-purple-500',
	fuchsia: 'bg-fuchsia-500',
	pink: 'bg-pink-500',
	rose: 'bg-rose-500',
	slate: 'bg-slate-500',
	gray: 'bg-gray-500',
	zinc: 'bg-zinc-500'
};

/**
 * Get all available member colors
 * @returns {string[]} Array of color names
 */
export function getMemberColors() {
	return [...MEMBER_COLORS];
}

/**
 * Convert a color name to Tailwind CSS background class
 * @param {string} color_name - Color name (e.g., 'red', 'blue')
 * @returns {string} Tailwind CSS background class (e.g., 'bg-red-500')
 */
export function getColorBgClass(color_name) {
	return (
		COLOR_TO_BG_CLASS[/** @type {keyof typeof COLOR_TO_BG_CLASS} */ (color_name)] || 'bg-grey-500'
	);
}
