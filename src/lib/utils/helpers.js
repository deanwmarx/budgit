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
