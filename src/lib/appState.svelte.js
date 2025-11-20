import { Preferences } from '@capacitor/preferences';
import { initDB, setCurrentDevice, getUserHouseholds } from '$lib/db';
import { Device } from '@capacitor/device';

/**
 * Preference keys
 */
const PREF_KEYS = {
	DEFAULT_USER_ID: 'default_user_id', // The last logged-in user for this device
	USER_ID: 'current_user_id',
	USER_EMAIL: 'current_user_email',
	USER_NAME: 'current_user_name',
	HOUSEHOLD_ID: 'current_household_id',
	LAST_HOUSEHOLD_ID: 'last_household_id',
	HOUSEHOLD_NAME: 'current_household_name'
};

/**
 * Global application state for user and household context
 */
class AppState {
	/** @type {string | null} */
	current_user_id = $state(null);

	/** @type {string | null} */
	current_user_email = $state(null);

	/** @type {string | null} */
	current_user_name = $state(null);

	/** @type {string | null} */
	current_household_id = $state(null);

	/** @type {string | null} */
	last_household_id = $state(null);

	/** @type {string | null} */
	current_household_name = $state(null);

	/** @type {Array<{id: string, name: string, role: string}>} */
	households = $state([]);

	/** @type {boolean} */
	is_loading = $state(true);

	/** @type {boolean} */
	is_initialized = $state(false);

	/** @type {string | null} */
	device_id = $state(null);

	/**
	 * Initialize the app - load saved preferences and setup database
	 */
	async initialize() {
		this.is_loading = true;

		try {
			// Initialize database
			await initDB();

			// Get device info
			const device_info = await Device.getId();
			this.device_id = device_info.identifier;

			// Load default user for this device (the ONE user for this device)
			const { value: default_user_id } = await Preferences.get({ key: PREF_KEYS.DEFAULT_USER_ID });
			const { value: default_user_email } = await Preferences.get({ key: PREF_KEYS.USER_EMAIL });
			const { value: default_user_name } = await Preferences.get({ key: PREF_KEYS.USER_NAME });
			
			// Load current household selection
			const { value: household_id } = await Preferences.get({ key: PREF_KEYS.HOUSEHOLD_ID });
			const { value: household_name } = await Preferences.get({
				key: PREF_KEYS.HOUSEHOLD_NAME
			});
			
			// Load last household ID
			const { value: last_household_id } = await Preferences.get({ key: PREF_KEYS.LAST_HOUSEHOLD_ID });
			if (last_household_id) {
				this.last_household_id = last_household_id;
			}

			if (default_user_id && default_user_email && default_user_name) {
				this.current_user_id = default_user_id;
				this.current_user_email = default_user_email;
				this.current_user_name = default_user_name;

				// Set device tracking
				setCurrentDevice(this.device_id);

				// Load user's households
				const households = await getUserHouseholds(default_user_id);
				this.households = households.map((h) => ({
					id: h.id,
					name: h.name,
					role: h.role
				}));

				// If household is saved in preferences, use it
				if (household_id && household_name) {
					this.current_household_id = household_id;
					this.current_household_name = household_name;
					this.is_initialized = true;
				}
				// If no saved household but user has households, they need to select one
				// isInitialized stays false to show selection screen
			}
		} catch (error) {
			console.error('Failed to initialize app:', error);
		} finally {
			this.is_loading = false;
		}
	}

	/**
	 * Set the current user and save to preferences (this is the default user for this device)
	 * @param {string} user_id
	 * @param {string} user_email
	 * @param {string} user_name
	 */
	async setUser(user_id, user_email, user_name) {
		this.current_user_id = user_id;
		this.current_user_email = user_email;
		this.current_user_name = user_name;

		// Save as the default user for this device (permanent)
		await Preferences.set({ key: PREF_KEYS.DEFAULT_USER_ID, value: user_id });
		await Preferences.set({ key: PREF_KEYS.USER_EMAIL, value: user_email });
		await Preferences.set({ key: PREF_KEYS.USER_NAME, value: user_name });

		// Set device tracking
		if (this.device_id) {
			setCurrentDevice(this.device_id);
		}

		// Load households
		const households = await getUserHouseholds(user_id);
		this.households = households.map((h) => ({
			id: h.id,
			name: h.name,
			role: h.role
		}));
	}

	/**
	 * Set the current household and save to preferences
	 * @param {string} household_id
	 * @param {string} household_name
	 */
	async setHousehold(household_id, household_name) {
		this.current_household_id = household_id;
		this.current_household_name = household_name;
		this.is_initialized = true;

		// Save to preferences
		await Preferences.set({ key: PREF_KEYS.HOUSEHOLD_ID, value: household_id });
		await Preferences.set({ key: PREF_KEYS.HOUSEHOLD_NAME, value: household_name });
	}

	/**
	 * Add a household to the list
	 * @param {string} id
	 * @param {string} name
	 * @param {string} role
	 */
	addHousehold(id, name, role) {
		this.households.push({ id, name, role });
	}

	/**
	 * Logout - clear household selection and return to household selection screen
	 */
	async logout() {
		// Save current household ID as last household before clearing
		if (this.current_household_id) {
			this.last_household_id = this.current_household_id;
			await Preferences.set({ key: PREF_KEYS.LAST_HOUSEHOLD_ID, value: this.current_household_id });
		}
		
		this.current_household_id = null;
		this.current_household_name = null;
		this.is_initialized = false;

		// Clear only household preferences (keep user)
		await Preferences.remove({ key: PREF_KEYS.HOUSEHOLD_ID });
		await Preferences.remove({ key: PREF_KEYS.HOUSEHOLD_NAME });
	}
}

/**
 * Global app state instance
 * @type {AppState}
 */
export const appState = new AppState();

