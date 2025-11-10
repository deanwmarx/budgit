import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';
import { navigation } from '$lib/navigation.svelte.js';

export async function load() {
	const prefers_dark = window.matchMedia('(prefers-color-scheme: dark)');
	await updateSystemBars(prefers_dark.matches);

	// Update dynamically when user/system changes theme
	prefers_dark.addEventListener('change', (event) => {
		updateSystemBars(event.matches);
	});

	// Handle Android back button
	if (Capacitor.isNativePlatform()) {
		App.addListener('backButton', () => {
			if (navigation.history.length > 0) {
				// We have navigation history, go back in app
				navigation.goBack();
			} else {
				// No history, minimize the app
				App.minimizeApp();
			}
		});
	}
}

/**
 * Update system bars colors based on theme
 * @param {boolean} is_dark
 */
async function updateSystemBars(is_dark) {
	const background_color = is_dark ? '#26272B' : '#F7F8F8';

	try {
		// Edge‑to‑Edge first — paints background and puts the window into immersive mode
		await EdgeToEdge.setBackgroundColor({ color: background_color });
	} catch (err) {
		console.error('Failed to update system bars:', err);
	}
}
