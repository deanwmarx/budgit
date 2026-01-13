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

	/** @type {'add' | 'delete' | 'update' | 'none'} */
	header_mode = $state('none');

	/** @type {(() => void) | null} */
	header_onclick = $state(null);

	/** @type {(() => void) | null} */
	header_undo = $state(null);

	/**
	 * Navigate to a specified screen
	 * @param {ScreenType} screen - The screen to navigate to
	 */
	navigateTo(screen) {
		// If navigating to the same screen, do nothing (don't reset header mode)
		if (screen === this.current_screen) return;
		this.history.push(this.current_screen);
		this.current_screen = screen;
		// Reset header when navigating
		this.header_mode = 'none';
		this.header_onclick = null;
	}

	/**
	 * Set the header button mode and action
	 * @param {'add' | 'update' | 'delete' | 'none'} mode - The header button mode
	 * @param {(() => void) | null} onclick - The click handler
	 */
	setHeaderMode(mode, onclick = null) {
		this.header_mode = mode;
		this.header_onclick = onclick;
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
