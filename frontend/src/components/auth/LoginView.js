import $ from 'jquery';
import FloatingField from '../ui/FloatingField.js';
import './LoginView.scss';

export default class LoginView {
	static nextId = 0;

	constructor({ defaultUsername = '', showRememberMe = true, showForgotPassword = true, showSignup = true } = {}) {
		this.options = { defaultUsername, showRememberMe, showForgotPassword, showSignup };

		this.id = `login-view-${++LoginView.nextId}`;
		this.feedbackId = `${this.id}-feedback`;

		this.$element = this.createElement();
		this.$feedback = this.createFeedback();
		this.$submit = this.createSubmit();

		this.$element.append(
			this.createHeader(),
			this.createFields(),
			this.createOptions(),
			this.$feedback,
			this.$submit,
			this.createSignup()
		);

		this.bindEvents();
	}

	createElement() {
		return $('<form>', { class: 'login-view', 'aria-labelledby': `${this.id}-title` }).prop('noValidate', true);
	}

	createHeader() {
		const $header = $('<header>');

		$('<h1>', { id: `${this.id}-title`, class: 'ui-title', text: 'Welcome back' }).appendTo($header);
		$('<p>', { class: 'ui-copy', text: 'Sign in to CD choir.' }).appendTo($header);

		return $header;
	}

	createFields() {
		this.usernameField = new FloatingField({
			name: 'username',
			label: 'Username',
			icon: 'bi-person',
			value: this.options.defaultUsername,
			autocomplete: 'username',
			required: true
		});

		this.passwordField = new FloatingField({
			name: 'password',
			label: 'Password',
			type: 'password',
			icon: 'bi-lock',
			autocomplete: 'current-password',
			required: true
		});

		for (const field of [ this.usernameField, this.passwordField ]) {
			field.$input.attr('aria-describedby', this.feedbackId);
		}

		return $('<div>', { class: 'ui-field-stack login-view__fields' }).append(
			this.usernameField.$element,
			this.passwordField.$element
		);
	}

	createOptions() {
		const $options = $('<div>', { class: 'login-view__options' });

		if (this.options.showRememberMe) $options.append(this.createRememberMe());
		if (this.options.showForgotPassword) $options.append(this.createForgotPassword());

		return $options.children().length ? $options : null;
	}

	createRememberMe() {
		this.$remember = $('<input>', { type: 'checkbox', name: 'remember', class: 'ui-focus' });

		return $('<label>', { class: 'ui-check' }).append(
			this.$remember,
			$('<span>', { text: 'Remember me' })
		);
	}

	createForgotPassword() {
		this.$forgot = $('<button>', { type: 'button', class: 'ui-link login-view__forgot', text: 'Forgot password?' });

		return this.$forgot;
	}

	createFeedback() {
		return $('<p>', { id: this.feedbackId, class: 'ui-feedback login-view__feedback', role: 'alert', 'aria-atomic': 'true' });
	}

	createSubmit() {
		return $('<button>', { type: 'submit', class: 'btn ui-button ui-focus login-view__submit' }).append(
			$('<span>', { text: 'Log in' }),
			$('<i>', { class: 'bi bi-arrow-right', 'aria-hidden': 'true' })
		);
	}

	createSignup() {
		if (!this.options.showSignup) return null;

		this.$signup = $('<button>', { type: 'button', class: 'ui-link', text: 'Create an account' });

		return $('<div>', { class: 'login-view__footer' }).append(
			$('<span>', { text: 'New here?' }),
			this.$signup
		);
	}

	bindEvents() {
		this.$element.on('submit', event => {
			event.preventDefault();
			this.clearError();
			const values = this.getValues();

			if (!this.validate(values)) return;
			this.$element.trigger('auth:submit', [values]);
		});

		this.$element.on('input', '.floating-field__input', () => this.clearError());
		this.$forgot?.on('click', () => { this.$element.trigger('auth:forgot-password'); });
		this.$signup?.on('click', () => { this.$element.trigger('auth:sign-up'); });
	}

	getValues() {
		return {
			username: this.usernameField.value.trim(),
			password: this.passwordField.value,
			remember: this.$remember?.prop('checked') ?? false
		};
	}

	setDefaultUsername(username) {
		// Preserve an existing username.
		if (!this.usernameField.value.trim()) this.usernameField.value = username;
	}

	validate(values) {
		if (!values.username) {
			this.showError('Please enter your username.');
			this.usernameField.$input.attr('aria-invalid', 'true');
			this.usernameField.focus();

			return false;
		}

		if (!values.password) {
			this.showError('Please enter your password.');
			this.passwordField.$input.attr('aria-invalid', 'true');
			this.passwordField.focus();

			return false;
		}

		return true;
	}

	showError(message) {
		this.$feedback.text(message);
	}

	clearError() {
		this.$feedback.text('');

		this.usernameField.$input.removeAttr('aria-invalid');
		this.passwordField.$input.removeAttr('aria-invalid');
	}

	focus() {
		this.passwordField.focus();
	}
}
