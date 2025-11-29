/**
 * Calculate the start and end timestamps for a budget month
 * @param {string} month_id - Format: YYYY-MM (represents the calendar month the budget period ENDS)
 * @param {number} start_day - Day of month when budget cycle starts (1-31)
 * @returns {{startDate: number, endDate: number}}
 */
export function calculateMonthDates(month_id, start_day) {
	const [year, month] = month_id.split('-').map(Number);

	// Start date: start_day of PREVIOUS calendar month at 00:00:00
	const start_date = new Date(year, month - 1 - 1, start_day, 0, 0, 0, 0);

	// End date: (start_day - 1) of THIS calendar month at 23:59:59
	const end_date = new Date(year, month - 1, start_day - 1, 23, 59, 59, 999);

	return {
		startDate: start_date.getTime(),
		endDate: end_date.getTime()
	};
}

/**
 * Get the current budget month ID based on today and the budget cycle start day
 * @param {number} start_day - Day of month when budget cycle starts
 * @returns {string} Month ID in YYYY-MM format
 */
export function getCurrentBudgetMonthId(start_day) {
	const now = new Date();
	const current_day = now.getDate();

	let year = now.getFullYear();
	let month = now.getMonth(); // 0-indexed

	// If we've reached the start day or passed it, the budget month is NEXT calendar month
	if (current_day >= start_day) {
		month += 1;
		if (month > 11) {
			month = 0;
			year += 1;
		}
	}

	// Format as YYYY-MM (month + 1 because getMonth is 0-indexed)
	return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Check if the next budget month can be created
 * @param {string} latest_month_id - The latest existing month ID
 * @param {number} start_day - Budget cycle start day
 * @returns {boolean}
 */
export function canCreateNextMonth(latest_month_id, start_day) {
	const [year, month] = latest_month_id.split('-').map(Number);

	// The next month would start on start_day of THIS calendar month
	const next_start_date = new Date(year, month - 1, start_day, 0, 0, 0, 0);
	const now = new Date();

	return now >= next_start_date;
}

/**
 * Month utility functions for budget cycle management
 */

/**
 * Get the current actual month in YYYY-MM format
 * @returns {string} Current month ID (e.g., "2025-10")
 */
export function getCurrentMonthId() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	return `${year}-${month}`;
}

/**
 * Navigate to the previous month
 * @param {string} month_id - Current month ID in YYYY-MM format
 * @returns {string} Previous month ID
 */
export function getPreviousMonthId(month_id) {
	const [year, month] = month_id.split('-').map(Number);

	if (month === 1) {
		// January -> December of previous year
		return `${year - 1}-12`;
	} else {
		// Decrement month
		return `${year}-${String(month - 1).padStart(2, '0')}`;
	}
}

/**
 * Navigate to the next month
 * @param {string} month_id - Current month ID in YYYY-MM format
 * @returns {string} Next month ID
 */
export function getNextMonthId(month_id) {
	const [year, month] = month_id.split('-').map(Number);

	if (month === 12) {
		// December -> January of next year
		return `${year + 1}-01`;
	} else {
		// Increment month
		return `${year}-${String(month + 1).padStart(2, '0')}`;
	}
}

/**
 * Check if two month IDs are equal
 * @param {string} month_id_1 - First month ID
 * @param {string} month_id_2 - Second month ID
 * @returns {boolean} True if months are equal
 */
export function isSameMonth(month_id_1, month_id_2) {
	return month_id_1 === month_id_2;
}

/**
 * Format month ID for display
 * @param {string} month_id - Month ID in YYYY-MM format
 * @param {string} [start_date] - Optional start date for date range display
 * @param {string} [end_date] - Optional end date for date range display
 * @returns {string} Formatted month string (e.g., "October 2025" or "October 2025 (25 Sep - 24 Oct)")
 */
export function formatMonthDisplay(month_id, start_date, end_date) {
	const [year, month] = month_id.split('-').map(Number);
	const date = new Date(year, month - 1, 1);
	const month_name = date.toLocaleDateString('en-US', { month: 'long' });

	if (start_date && end_date) {
		const start = new Date(start_date);
		const end = new Date(end_date);

		const start_day = start.getDate();
		const start_month = start.toLocaleDateString('en-US', { month: 'short' });
		const end_day = end.getDate();
		const end_month = end.toLocaleDateString('en-US', { month: 'short' });

		return `${month_name} ${year} (${start_day} ${start_month} - ${end_day} ${end_month})`;
	}

	return `${month_name} ${year}`;
}

/**
 * Compare two month IDs
 * @param {string} month_id_1 - First month ID
 * @param {string} month_id_2 - Second month ID
 * @returns {number} -1 if month_id_1 < month_id_2, 0 if equal, 1 if month_id_1 > month_id_2
 */
export function compareMonths(month_id_1, month_id_2) {
	if (month_id_1 < month_id_2) return -1;
	if (month_id_1 > month_id_2) return 1;
	return 0;
}

/**
 * Check if a month is before another month
 * @param {string} month_id - Month to check
 * @param {string} reference_month_id - Reference month
 * @returns {boolean} True if month_id is before reference_month_id
 */
export function isMonthBefore(month_id, reference_month_id) {
	return compareMonths(month_id, reference_month_id) < 0;
}

/**
 * Check if a month is after another month
 * @param {string} month_id - Month to check
 * @param {string} reference_month_id - Reference month
 * @returns {boolean} True if month_id is after reference_month_id
 */
export function isMonthAfter(month_id, reference_month_id) {
	return compareMonths(month_id, reference_month_id) > 0;
}
