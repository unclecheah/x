import $ from 'jquery';

export default class AppController {
	constructor({ auth, mainScreen, footer, services, target = '#app' }) {
		this.auth = auth;
		this.mainScreen = mainScreen;
		this.footer = footer;
		this.services = services;
		this.$target = $(target);

		if (this.$target.length !== 1) throw new Error('AppController requires one mounting container.');

		this.started = false;
		this.isLoggingOut = false;
		this.sessionRevision = 0;

		this.$status = $('<p>', { class: 'ui-feedback m-3', role: 'alert', hidden: true });
	}

	async start() {
		if (this.started) return;

		this.started = true;

		this.mainScreen.unmount();
		this.$target.prepend(this.$status);
		this.footer.mount(this.mainScreen.$footer);

		this.bindEvents();

		try {
			await this.auth.initialise(this.services);
		} catch (error) {
			this.showError('Unable to initialise authentication. Please reload to try again.', error);
		}
	}

	bindEvents() {
		this.auth.on('auth:session-changed', (event, active) => { void this.handleSessionChanged(active); });
		this.mainScreen.on('main:logout', () => { void this.logout(); });
	}

	async handleSessionChanged(active) {
		const revision = ++this.sessionRevision;

		this.clearError();
		this.mainScreen.setUsername('');

		if (active !== true) {
			this.mainScreen.unmount();
			return;
		}

		this.mainScreen.mount(this.$target);

		try {
			const username = await this.services.session.getvar('username');

			if (revision !== this.sessionRevision) return;
			this.mainScreen.setUsername(username ?? '');
		} catch (error) {
			if (revision !== this.sessionRevision) return;

			this.showError('Unable to load your username. Please reload to try again.', error);
		}
	}

	async logout() {
		if (this.isLoggingOut) return;

		this.isLoggingOut = true;
		this.mainScreen.setLoggingOut(true);
		this.clearError();

		try {
			await this.auth.logout();
		} catch (error) {
			this.showError('Unable to complete logout. Please try again.', error);
		} finally {
			this.isLoggingOut = false;
			this.mainScreen.setLoggingOut(false);
		}
	}

	clearError() {
		this.$status.text('').prop('hidden', true);
	}

	showError(message, error) {
		console.error('[AppController]', message, error);

		this.$status.text(message).prop('hidden', false);
	}
}
