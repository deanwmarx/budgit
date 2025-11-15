/**
 * Utility helper functions
 */

/**
 * Format currency amount from cents to display format (ZAR)
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted currency string
 */
export function formatCurrency(cents) {
	return `R${(cents / 100).toLocaleString('en-ZA', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}`;
}

/**
 * Parse currency string to cents
 * @param {string} currency - Currency string like "R12.34" or "12.34"
 * @returns {number} Amount in cents
 */
export function parseCurrency(currency) {
	const cleaned = currency.replace(/[R\s,]/g, '');
	return Math.round(parseFloat(cleaned) * 100);
}

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
 * Parse ISO date string to Date object
 * @param {string} isoDate - ISO date string
 * @returns {Date} Date object
 */
export function parseDateFromStorage(isoDate) {
	return new Date(isoDate);
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
	const inputDate = new Date(date_string + 'T00:00:00');
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	const diffTime = inputDate.getTime() - today.getTime();
	const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
	
	if (diffDays === 0) return 'Today';
	if (diffDays === -1) return 'Yesterday';
	if (diffDays === 1) return 'Tomorrow';
	
	// Format as "Fri, 24 Oct 2025" using the existing formatDate function
	return formatDate(date_string, {
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
		COLOR_TO_BG_CLASS[/** @type {keyof typeof COLOR_TO_BG_CLASS} */ (color_name)] || 'bg-gray-500'
	);
}
