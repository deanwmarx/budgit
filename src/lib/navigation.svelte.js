/**
 * @typedef {'create-household' | 'dashboard' | 'transactions' | 'budgets' | 'components' | 'notes' | 'members' | 'settings'} ScreenType
 */

/**
 * Available screen identifiers for navigation
 * @type {Record<string, ScreenType>}
 */
export const SCREENS = {
	CREATE_HOUSEHOLD: 'create-household',
	DASHBOARD: 'dashboard',
	TRANSACTIONS: 'transactions',
	BUDGETS: 'budgets',
	COMPONENTS: 'components',
	NOTES: 'notes',
	MEMBERS: 'members',
	SETTINGS: 'settings'
};

// Navigation state manager for the application
class NavigationState {
	/** @type {ScreenType} */
	current_screen = $state(SCREENS.DASHBOARD);

	/** @type {ScreenType[]} */
	history = $state([]);

	/**
	 * Navigate to a specified screen
	 * @param {ScreenType} screen - The screen to navigate to
	 */
	navigateTo(screen) {
		this.history.push(this.current_screen);
		this.current_screen = screen;
	}

	// Navigate back to the previous screen in history
	goBack() {
		if (this.history.length === 0) return;
		const previous_screen = this.history.pop();
		if (previous_screen) {
			this.current_screen = previous_screen;
		}
	}
}

/**
 * Global navigation state instance
 * @type {NavigationState}
 */
export const navigation = new NavigationState();
