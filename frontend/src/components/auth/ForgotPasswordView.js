import $ from 'jquery';
import FloatingField from '../ui/FloatingField.js';
import './ForgotPasswordView.scss';

export default class ForgotPasswordView {
	static nextId = 0;

	constructor({ defaultEmail = '' } = {}) {
		this.options = { defaultEmail };

		this.id = `forgot-password-view-${++ForgotPasswordView.nextId}`;
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
		return $('<form>', { class: 'forgot-password-view', 'aria-labelledby': `${this.id}-title` }).prop('noValidate', true);
	}

	createHeader() {
		const $header = $('<header>');

		$('<h1>', { id: `${this.id}-title`, class: 'ui-title', text: 'Forgot password?' }).appendTo($header);
		$('<p>', { class: 'ui-copy', text: 'Enter the email address associated with your account.' }).appendTo($header);

		return $header;
	}

	createFields() {
		this.emailField = new FloatingField({
			name: 'email',
			label: 'Email address',
			type: 'email',
			icon: 'bi-envelope',
			value: this.options.defaultEmail,
			autocomplete: 'email',
			required: true
		});

		this.emailField.$input.attr({ 'aria-describedby': this.feedbackId, autocapitalize: 'none', spellcheck: 'false' });

		return $('<div>', { class: 'ui-field-stack forgot-password-view__fields' }).append(this.emailField.$element);
	}

	createFeedback() {
		return $('<p>', { id: this.feedbackId, class: 'ui-feedback forgot-password-view__feedback', role: 'status',
			'aria-live': 'polite', 'aria-atomic': 'true'
		});
	}

	createSubmit() {
		return $('<button>', { type: 'submit', class: 'btn ui-button ui-focus forgot-password-view__submit' }).append(
			$('<span>', { text: 'Send reset link' }),
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
		return $('<div>', { class: 'forgot-password-view__footer' }).append(this.$back);
	}

	bindEvents() {
		this.$element.on('submit', event => {
			event.preventDefault();
			this.clearFeedback();
			const values = this.getValues();

			// Keep the displayed value consistent with the submitted value.
			this.emailField.value = values.email;

			if (!this.validate(values)) return;
			this.$element.trigger('auth:recover', [values]);
		});

		this.emailField.$input.on('input', () => { this.clearFeedback(); });
		this.$back.on('click', () => { this.$element.trigger('auth:login'); });
	}

	getValues() {
		return { email: this.emailField.value.trim() };
	}

	validate(values) {
		let message = '';

		if (!values.email) message = 'Please enter your email address.';
		else if (!this.emailField.$input[0].checkValidity()) message = 'Please enter a valid email address.';

		if (message) {
			this.showError(message);
			this.emailField.$input.attr('aria-invalid', 'true');
			this.emailField.focus();

			return false;
		}

		return true;
	}

	showError(message) {
		this.$feedback.removeClass('ui-feedback--success').text(message);
	}

	showSuccess(message = 'If the email is registered, a reset link will be sent.') {
		this.emailField.$input.removeAttr('aria-invalid');
		this.$feedback.addClass('ui-feedback--success').text(message);
	}

	clearFeedback() {
		this.$feedback.removeClass('ui-feedback--success').text('');
		this.emailField.$input.removeAttr('aria-invalid');
	}

	focus() {
		this.emailField.focus();
	}
}
