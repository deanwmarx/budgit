/**
 * Global application state for user and household context
 */
class AppState {
	/** @type {string | null} */
	currentUserId = $state(null);

	/** @type {string | null} */
	currentHouseholdId = $state(null);

	/**
	 * Set the current user
	 * @param {string} userId
	 */
	setUser(userId) {
		this.currentUserId = userId;
	}

	/**
	 * Set the current household
	 * @param {string} householdId
	 */
	setHousehold(householdId) {
		this.currentHouseholdId = householdId;
	}

	/**
	 * Clear all state (logout)
	 */
	clear() {
		this.currentUserId = null;
		this.currentHouseholdId = null;
	}
}

/**
 * Global app state instance
 * @type {AppState}
 */
export const appState = new AppState();
