import $ from 'jquery';

import AuthModal from './AuthModal.js';
import LoginView from './LoginView.js';
import ForgotPasswordView from './ForgotPasswordView.js';
import SignupView from './SignupView.js';
import ChangePasswordView from './ChangePasswordView.js';

export default class AuthComponent {
	constructor(options = {}) {
		this.$events = $({});

		this.currentViewName = null;
		this.isClosing = false;

		this.modal = new AuthModal(options);
		this.views = this.createViews(options);

		this.bindNavigation();
		this.bindSubmissions();
		this.bindModalEvents();

		this.services = null;
		this.isAuthenticated = false;
		this.isBusy = false;
	}

	async initialise({ auth, session, overlay }) {
		this.services = { auth, session, overlay };
		this.bindAuthentication();
		const active = await session.isactive();
		this.setAuthenticated(active === true);

		if (this.isAuthenticated) this.close();
		else await this.open('login');

		return this.isAuthenticated;
	}

	setAuthenticated(active) {
		this.isAuthenticated = active;
		this.$events.trigger('auth:session-changed', [active]);
	}

	bindAuthentication() {
		this.$events
			.off('auth:submit.backend')
			.on('auth:submit.backend', async (event, values) => { await this.authenticate(values); });
	}

	setLoginBusy(busy) {
		this.isBusy = busy;
		const loginView = this.views.login;

		loginView.$submit.prop('disabled', busy);
		loginView.$element.attr('aria-busy', String(busy));
	}

	async authenticate({ username, password }) {
		if (this.isBusy) return false;

		const { auth, session, overlay } = this.services;
		this.clearFeedback('login');
		this.setLoginBusy(true);

		try {
			let authenticated;

			try {
				overlay.start();
				authenticated = await auth.authenticate({ username, password });
			} finally {
				overlay.stop();
			}

			if (authenticated != 1) {
				this.showError('login', 'Login unsuccessful. Please check your username and password.');

				return false;
			}

			const started = await session.start({ action: 'session_start', username });
			if (started == false) throw new Error('Unable to start the session.');

			// Clear the password after successful authentication.
			this.views.login.passwordField.value = '';
			this.views.login.passwordField.setPasswordVisible(false);

			this.setAuthenticated(true);
			this.close();

			return true;

		} catch {
			this.showError('login', 'Unable to complete login. Please try again.');
			return false;

		} finally {
			this.setLoginBusy(false);
		}
	}

	async logout() {
		if (this.isBusy) return false;
		this.isBusy = true;

		try {
			const destroyed = await this.services.session.destroy();
			if (destroyed === false) throw new Error('Unable to destroy the session.');
			this.setAuthenticated(false);

		} finally {
			this.isBusy = false;
		}

		this.clearFeedback('login');
		await this.open('login');

		return true;
	}

	createViews(options) {
		return {
			login:			new LoginView(options),
			forgotPassword:	new ForgotPasswordView(),
			signup:			new SignupView(),
			changePassword:	new ChangePasswordView()
		};
	}

	bindNavigation() {
		const { login, forgotPassword, signup, changePassword } = this.views;

		login.$element.on('auth:forgot-password',	async () => { await this.navigate('forgotPassword'); });
		login.$element.on('auth:sign-up',			async () => { await this.navigate('signup'); });
		forgotPassword.$element.on('auth:login',	async () => { await this.navigate('login', { direction: 'back' }); });
		signup.$element.on('auth:login',			async () => { await this.navigate('login', { direction: 'back' }); });
		changePassword.$element.on('auth:back',			  () => { this.close(); });
	}

	bindSubmissions() {
		const events = {
			login: 'auth:submit',
			forgotPassword: 'auth:recover',
			signup: 'auth:register',
			changePassword: 'auth:change-password'
		};

		for (const [viewName, eventName] of Object.entries(events)) {
			this.views[viewName].$element.on(
				eventName,
				(event, values) => { this.$events.trigger(eventName, [values]); }
			);
		}
	}

	bindModalEvents() {
		const element = this.modal.$element[0];

		element.addEventListener('hide.bs.modal', () => { this.isClosing = true; });
		element.addEventListener('hidden.bs.modal', () => {
			this.isClosing = false;
			this.views.changePassword.reset();
			this.$events.trigger('auth:closed');
		});
	}

	getView(viewName) {
		const view = this.views[viewName];

		if (!Object.hasOwn(this.views, viewName)) throw new Error(`Unknown authentication view: ${viewName}`);

		return view;
	}

	clearFeedback(viewName) {
		const view = this.getView(viewName);

		if (viewName === 'login') view.clearError();
		else view.clearFeedback();
	}

	async navigate(viewName, { direction = 'forward', animate = true } = {}) {
		if (this.isBusy || this.isClosing || this.modal.isSwitching) return false;

		const view = this.getView(viewName);
		if (viewName === this.currentViewName) return false;
		this.clearFeedback(viewName);

		const changed = await this.modal.showView(view, { direction, animate });
		if (changed) this.currentViewName = viewName;

		return changed;
	}

	async open(viewName = 'login') {
		if (this.isBusy || this.isClosing || this.modal.isSwitching) return false;

		await this.navigate(viewName, { animate: this.modal.isOpen });
		if (!this.modal.$element.hasClass('show')) this.modal.show();

		return true;
	}

	close() {
		this.modal.hide();
	}

	showError(viewName, message) {
		this.getView(viewName).showError(message);
	}

	showSuccess(viewName, message) {
		const view = this.getView(viewName);

		if (typeof view.showSuccess !== 'function') throw new Error(`The ${viewName} view does not display success messages.`);
		view.showSuccess(message);
	}

	on(eventName, handler) {
		this.$events.on(eventName, handler);

		return this;
	}

	off(eventName, handler) {
		this.$events.off(eventName, handler);

		return this;
	}
}
