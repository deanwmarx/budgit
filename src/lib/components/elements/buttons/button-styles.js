export const size_classes = {
	small: ['py-1', 'px-1.5'].join(' '),
	medium: ['py-2', 'px-3.5'].join(' '),
	large: ['py-3', 'px-6'].join(' ')
};

export const button_round_size_classes = {
	small: ['p-1'].join(' '),
	medium: ['p-2'].join(' '),
	large: ['p-3'].join(' ')
};

export const color_classes = {
	primary: ['bg-primary-600', 'active:bg-primary-500', 'disabled:active:bg-primary-600'].join(' '),
	secondary: [
		'bg-secondary-700',
		'active:bg-secondary-600',
		'disabled:active:bg-secondary-700'
	].join(' '),
	tertiary: ['bg-transparent', 'active:bg-secondary-700', 'disabled:active:bg-transparent'].join(
		' '
	),
	danger: ['bg-danger-600', 'active:bg-danger-500', 'disabled:active:bg-danger-600'].join(' ')
};
