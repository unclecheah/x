import $ from 'jquery';
import FloatingField from '../ui/FloatingField.js';
import './SignupView.scss';

export default class SignupView {
	static nextId = 0;

	constructor() {
		this.id = `signup-view-${++SignupView.nextId}`;
		this.feedbackId = `${this.id}-feedback`;

		this.$element = this.createElement();
		this.$feedback = this.createFeedback();
		this.$submit = this.createSubmit();
		this.$back = this.createBackButton();

		this.$element.append(
			this.createHeader(),
			this.createFields(),
			this.$feedback,
			this.$submit,
			this.createFooter()
		);

		this.bindEvents();
	}

	createElement() {
		return $('<form>', { class: 'signup-view', 'aria-labelledby': `${this.id}-title` }).prop('noValidate', true);
	}

	createHeader() {
		const $header = $('<header>');

		$('<h1>', { id: `${this.id}-title`, class: 'ui-title', text: 'Create an account' }).appendTo($header);
		$('<p>', { class: 'ui-copy', text: 'A few details to join CD choir.' }).appendTo($header);

		return $header;
	}

	createField(options) {
		const field = new FloatingField({ required: true, ...options });
		field.$input.attr('aria-describedby', this.feedbackId);

		return field;
	}

	createFields() {
		this.usernameField = this.createField({ name: 'username', label: 'Username', icon: 'bi-person', autocomplete: 'username' });
		this.emailField = this.createField({ name: 'email', label: 'Email address', type: 'email', icon: 'bi-envelope', autocomplete: 'email' });
		this.emailField.$input.attr({ autocapitalize: 'none', spellcheck: 'false' });
		this.passwordField = this.createField({ name: 'password', label: 'Password', type: 'password', icon: 'bi-lock', autocomplete: 'new-password' });
		this.confirmPasswordField = this.createField({ name: 'confirmPassword', label: 'Confirm password', type: 'password', icon: 'bi-shield-check', autocomplete: 'new-password' });

		this.fields = [ this.usernameField, this.emailField, this.passwordField, this.confirmPasswordField ];

		return $('<div>', { class: 'ui-field-stack signup-view__fields' }).append(...this.fields.map(field => field.$element));
	}

	createFeedback() {
		return $('<p>', { id: this.feedbackId, class: 'ui-feedback signup-view__feedback', role: 'status',
			'aria-live': 'polite', 'aria-atomic': 'true'
		});
	}

	createSubmit() {
		return $('<button>', { type: 'submit', class: 'btn ui-button ui-focus signup-view__submit' }).append(
			$('<span>', { text: 'Create account' }),
			$('<i>', { class: 'bi bi-arrow-right', 'aria-hidden': 'true' })
		);
	}

	createBackButton() {
		return $('<button>', { type: 'button', class: 'ui-link' }).append(
			$('<i>', { class: 'bi bi-arrow-left', 'aria-hidden': 'true' }),
			$('<span>', { text: 'Back to login' })
		);
	}

	createFooter() {
		return $('<div>', { class: 'signup-view__footer' }).append(this.$back);
	}

	bindEvents() {
		this.$element.on('submit', event => {
			event.preventDefault();
			this.clearFeedback();

			const values = this.getValues();
			this.usernameField.value = values.username;
			this.emailField.value = values.email;

			if (!this.validate(values)) return;

			this.$element.trigger('auth:register', [{
				username: values.username,
				email: values.email,
				password: values.password
			}]);
		});

		this.$element.on('input', '.floating-field__input', () => this.clearFeedback());
		this.$back.on('click', () => { this.$element.trigger('auth:login'); });
	}

	getValues() {
		return {
			username: this.usernameField.value.trim(),
			email: this.emailField.value.trim(),
			password: this.passwordField.value,
			confirmPassword: this.confirmPasswordField.value
		};
	}

	validate(values) {
		if (!values.username) return this.rejectField(this.usernameField, 'Please enter a username.');
		if (!values.email) return this.rejectField(this.emailField, 'Please enter your email address.');
		if (!this.emailField.$input[0].checkValidity()) return this.rejectField(this.emailField, 'Please enter a valid email address.');
		if (!values.password) return this.rejectField(this.passwordField, 'Please enter a password.');
		if (!values.confirmPassword) return this.rejectField(this.confirmPasswordField, 'Please confirm your password.');
		if (values.password !== values.confirmPassword) return this.rejectField(this.confirmPasswordField, 'Your passwords do not match.');

		return true;
	}

	rejectField(field, message) {
		this.showError(message);

		field.$input.attr('aria-invalid', 'true');
		field.focus();

		return false;
	}

	showError(message) {
		this.$feedback.removeClass('ui-feedback--success').text(message);
	}

	showSuccess(message) {
		for (const field of this.fields) field.$input.removeAttr('aria-invalid');

		this.$feedback.addClass('ui-feedback--success').text(message);
	}

	clearFeedback() {
		this.$feedback.removeClass('ui-feedback--success').text('');

		for (const field of this.fields) field.$input.removeAttr('aria-invalid');
	}

	focus() {
		this.usernameField.focus();
	}
}
