export default class ColourTheme {
	static colours = ['blue', 'green', 'gold', 'plum'];

	static storageKey = 'app-colour';

	static get() {
		const colour = document.documentElement.dataset.colour;

		return this.colours.includes(colour) ? colour : 'blue';
	}

	static set(colour, { remember = false } = {}) {
		if (!this.colours.includes(colour)) {
			throw new Error(`Unknown colour scheme: ${colour}`);
		}

		document.documentElement.dataset.colour = colour;

		if (remember) {
			try {
				localStorage.setItem(this.storageKey, colour);
			} catch {
				// The theme still changes if storage is unavailable.
			}
		}
	}

	static restore() {
		try {
			const colour = localStorage.getItem(this.storageKey);

			if (this.colours.includes(colour)) {
				this.set(colour);
			}
		} catch {
			// Keep the theme selected in the HTML.
		}
	}
}
