/**
 * Simple form validation utility using Svelte 5 runes
 */

/**
 * Create a validator with reactive error state
 * @param {Record<string, Array<(value: any) => string | null>>} rules - Validation rules per field
 * @returns {{ errors: Record<string, string>, validate: (values: Record<string, any>) => boolean, clear: () => void, clearError: (field: string) => void, setError: (field: string, message: string) => void }}
 */
export function createValidator(rules) {
	// Create reactive error state for each field
	const errors = $state(
		Object.keys(rules).reduce((acc, key) => {
			acc[key] = '';
			return acc;
		}, /** @type {Record<string, string>} */ ({}))
	);

	/**
	 * Validate all fields - only SETS errors, never clears them.
	 * Use clearError() on input change to clear errors.
	 * @param {Record<string, any>} values
	 * @returns {boolean} True if valid
	 */
	function validate(values) {
		for (const [field, field_rules] of Object.entries(rules)) {
			for (const rule of field_rules) {
				const error = rule(values[field]);
				if (error) {
					errors[field] = error;
					break;
				}
			}
		}

		return !Object.values(errors).some((e) => e);
	}

	/**
	 * Clear all errors
	 */
	function clear() {
		for (const key of Object.keys(errors)) {
			errors[key] = '';
		}
	}

	/**
	 * Clear a specific field's error
	 * @param {string} field
	 */
	function clearError(field) {
		if (field in errors) {
			errors[field] = '';
		}
	}

	/**
	 * Manually set an error for a field (e.g., from server response)
	 * @param {string} field
	 * @param {string} message
	 */
	function setError(field, message) {
		if (field in errors) {
			errors[field] = message;
		}
	}

	return { errors, validate, clear, clearError, setError };
}

// ============ Validation Rules ============

/**
 * Required field validation
 * @param {string} message - Error message
 * @returns {(value: any) => string | null}
 */
export function required(message = 'This field is required.') {
	return (value) => {
		if (value === null || value === undefined) return message;
		if (typeof value === 'string' && !value.trim()) return message;
		if (typeof value === 'number' && value === 0) return message;
		return null;
	};
}

/**
 * Minimum length validation
 * @param {number} min - Minimum length
 * @param {string} message - Error message
 * @returns {(value: any) => string | null}
 */
export function minLength(min, message) {
	return (value) => {
		if (typeof value === 'string' && value.length < min) {
			return message || `Must be at least ${min} characters.`;
		}
		return null;
	};
}

/**
 * Maximum length validation
 * @param {number} max - Maximum length
 * @param {string} message - Error message
 * @returns {(value: any) => string | null}
 */
export function maxLength(max, message) {
	return (value) => {
		if (typeof value === 'string' && value.length > max) {
			return message || `Must be no more than ${max} characters.`;
		}
		return null;
	};
}

/**
 * Minimum value validation (for numbers)
 * @param {number} min - Minimum value
 * @param {string} message - Error message
 * @returns {(value: any) => string | null}
 */
export function minValue(min, message) {
	return (value) => {
		if (typeof value === 'number' && value < min) {
			return message || `Must be at least ${min}.`;
		}
		return null;
	};
}

/**
 * Pattern validation (regex)
 * @param {RegExp} pattern - Regex pattern
 * @param {string} message - Error message
 * @returns {(value: any) => string | null}
 */
export function pattern(pattern, message = 'Invalid format.') {
	return (value) => {
		if (typeof value === 'string' && !pattern.test(value)) {
			return message;
		}
		return null;
	};
}
