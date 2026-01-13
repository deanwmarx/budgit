import { getDB } from './connection.js';

// Analytics and dashboard calculation functions

/**
 * Get total income breakdown for a month.
 * @param {string} month_id - The month ID
 * @returns {Promise<{salary: number, oneTime: number, interest: number, total: number}>} Income breakdown
 */
export async function getMonthIncomes(month_id) {
	const db = getDB();
	if (!db) return { salary: 0, oneTime: 0, interest: 0, total: 0 };

	const result = await db.query(
		`SELECT 
			SUM(CASE WHEN category = 'salary' THEN amount ELSE 0 END) as salary,
			SUM(CASE WHEN category = 'one_time' THEN amount ELSE 0 END) as oneTime,
			SUM(CASE WHEN category = 'interest' THEN amount ELSE 0 END) as interest,
			SUM(amount) as total
		FROM transactions 
		WHERE monthId = ? AND type = 'income' AND deletedAt IS NULL`,
		[month_id]
	);

	const row = result.values?.[0];
	return {
		salary: row?.salary || 0,
		oneTime: row?.oneTime || 0,
		interest: row?.interest || 0,
		total: row?.total || 0
	};
}

/**
 * Get total expenses breakdown for a month.
 * @param {string} month_id - The month ID
 * @returns {Promise<{fixed: number, variable: number, incidental: number, total: number}>} Expenses breakdown
 */
export async function getMonthExpenses(month_id) {
	const db = getDB();
	if (!db) return { fixed: 0, variable: 0, incidental: 0, total: 0 };

	const result = await db.query(
		`SELECT 
			SUM(CASE WHEN category = 'fixed' THEN amount ELSE 0 END) as fixed,
			SUM(CASE WHEN category = 'variable' THEN amount ELSE 0 END) as variable,
			SUM(CASE WHEN category = 'incidental' THEN amount ELSE 0 END) as incidental,
			SUM(amount) as total
		FROM transactions 
		WHERE monthId = ? AND type = 'expense' AND deletedAt IS NULL`,
		[month_id]
	);

	const row = result.values?.[0];
	return {
		fixed: row?.fixed || 0,
		variable: row?.variable || 0,
		incidental: row?.incidental || 0,
		total: row?.total || 0
	};
}

/**
 * Get budget progress for each budget group in a month.
 * @param {string} month_id - The month ID
 * @returns {Promise<Array<{groupName: string, percentage: number}>>} Array of budget progress percentages
 */
export async function getBudgetProgress(month_id) {
	const db = getDB();
	if (!db) return [];

	// Get budgets and join with actual spending
	const result = await db.query(
		`SELECT 
			b.groupName,
			b.amount as budgeted,
			COALESCE(SUM(t.amount), 0) as spent
		FROM budgets b
		LEFT JOIN transactions t ON 
			t.monthId = b.monthId AND 
			t.budgetGroup = b.id AND 
			t.type = 'expense' AND 
			t.category = 'variable' AND 
			t.deletedAt IS NULL
		WHERE b.monthId = ?
		GROUP BY b.id, b.groupName, b.amount`,
		[month_id]
	);

	if (!result.values) return [];

	return result.values.map((row) => ({
		groupName: row.groupName,
		percentage: row.budgeted > 0 ? Math.round((row.spent / row.budgeted) * 100) : 0
	}));
}

/**
 * Get total budget progress for a month (overall percentage across all budgets).
 * @param {string} month_id - The month ID
 * @returns {Promise<{percentage: number, totalBudgeted: number, totalSpent: number}>} Overall budget progress
 */
export async function getTotalBudgetProgress(month_id) {
	const db = getDB();
	if (!db) return { percentage: 0, totalBudgeted: 0, totalSpent: 0 };

	// Get total budgets
	const budget_result = await db.query(
		'SELECT SUM(amount) as totalBudgeted FROM budgets WHERE monthId = ?',
		[month_id]
	);
	const total_budgeted = budget_result.values?.[0]?.totalBudgeted || 0;

	// Get total variable spending
	const spending_result = await db.query(
		`SELECT SUM(amount) as totalSpent 
		FROM transactions 
		WHERE monthId = ? AND type = 'expense' AND category = 'variable' AND deletedAt IS NULL`,
		[month_id]
	);
	const total_spent = spending_result.values?.[0]?.totalSpent || 0;

	const percentage = total_budgeted > 0 ? Math.round((total_spent / total_budgeted) * 100) : 0;

	return {
		percentage,
		totalBudgeted: total_budgeted,
		totalSpent: total_spent
	};
}

/**
 * Get savings calculations for a month.
 * @param {string} month_id - The month ID
 * @returns {Promise<{projected: number, actual: number}>} Projected and actual savings
 */
export async function getMonthSavings(month_id) {
	const db = getDB();
	if (!db) return { projected: 0, actual: 0 };

	// Get total income
	const incomes = await getMonthIncomes(month_id);
	const total_income = incomes.total;

	// Get expense breakdown
	const expenses = await getMonthExpenses(month_id);

	// Get total budgets
	const budget_result = await db.query(
		'SELECT SUM(amount) as totalBudgets FROM budgets WHERE monthId = ?',
		[month_id]
	);
	const total_budgets = budget_result.values?.[0]?.totalBudgets || 0;

	// Projected: Income - Fixed (actual) - Variable (budgets)
	const projected = total_income - expenses.fixed - total_budgets;

	// Actual: Income - All expenses
	const actual = total_income - expenses.total;

	return {
		projected,
		actual
	};
}