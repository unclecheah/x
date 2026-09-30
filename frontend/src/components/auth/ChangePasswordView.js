import $ from 'jquery';
import FloatingField from '../ui/FloatingField.js';
import './ChangePasswordView.scss';

export default class ChangePasswordView {
	static nextId = 0;

	constructor() {
		this.id = `change-password-view-${++ChangePasswordView.nextId}`;
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
		return $('<form>', { class: 'change-password-view', 'aria-labelledby': `${this.id}-title` }).prop('noValidate', true);
	}

	createHeader() {
		const $header = $('<header>');

		$('<h1>', { id: `${this.id}-title`, class: 'ui-title', text: 'Change password' }).appendTo($header);
		$('<p>', { class: 'ui-copy', text: 'Enter your current password and choose a new one.' }).appendTo($header);

		return $header;
	}

	createField(options) {
		const field = new FloatingField({ type: 'password', required: true, ...options });
		field.$input.attr('aria-describedby', this.feedbackId);

		return field;
	}

	createFields() {
		this.currentPasswordField = this.createField({
			name: 'currentPassword',
			label: 'Current password',
			icon: 'bi-lock',
			autocomplete: 'current-password'
		});

		this.newPasswordField = this.createField({
			name: 'newPassword',
			label: 'New password',
			icon: 'bi-key',
			autocomplete: 'new-password'
		});

		this.confirmPasswordField = this.createField({
			name: 'confirmPassword',
			label: 'Confirm password',
			icon: 'bi-shield-check',
			autocomplete: 'new-password'
		});

		this.fields = [ this.currentPasswordField, this.newPasswordField, this.confirmPasswordField ];

		return $('<div>', { class: 'ui-field-stack change-password-view__fields' }).append(
			...this.fields.map(field => field.$element)
		);
	}

	createFeedback() {
		return $('<p>', {
			id: this.feedbackId,
			class: 'ui-feedback change-password-view__feedback',
			role: 'status',
			'aria-live': 'polite',
			'aria-atomic': 'true'
		});
	}

	createSubmit() {
		return $('<button>', { type: 'submit', class: 'btn ui-button ui-focus change-password-view__submit' }).append(
			$('<span>', { text: 'Update password' }),
			$('<i>', { class: 'bi bi-arrow-right', 'aria-hidden': 'true' })
		);
	}

	createBackButton() {
		return $('<button>', { type: 'button', class: 'ui-link' }).append(
			$('<i>', { class: 'bi bi-arrow-left', 'aria-hidden': 'true' }),
			$('<span>', { text: 'Back' })
		);
	}

	createFooter() {
		return $('<div>', { class: 'change-password-view__footer' }).append(this.$back);
	}

	bindEvents() {
		this.$element.on('submit', event => {
			event.preventDefault();
			this.clearFeedback();

			const values = this.getValues();
			if (!this.validate(values)) return;

			this.$element.trigger('auth:change-password', [{
				currentPassword: values.currentPassword,
				newPassword: values.newPassword
			}]);
		});

		this.$element.on('input', '.floating-field__input', () => this.clearFeedback());
		this.$back.on('click', () => { this.$element.trigger('auth:back'); });
	}

	getValues() {
		return {
			currentPassword: this.currentPasswordField.value,
			newPassword: this.newPasswordField.value,
			confirmPassword: this.confirmPasswordField.value
		};
	}

	validate(values) {
		if (!values.currentPassword) {
			return this.rejectField(this.currentPasswordField, 'Please enter your current password.');
		}

		if (!values.newPassword) {
			return this.rejectField(this.newPasswordField, 'Please enter a new password.');
		}

		if (!values.confirmPassword) {
			return this.rejectField(this.confirmPasswordField, 'Please confirm your new password.');
		}

		if (values.newPassword !== values.confirmPassword) {
			return this.rejectField(this.confirmPasswordField, 'Your new passwords do not match.');
		}

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
		this.reset();

		this.$feedback.addClass('ui-feedback--success').text(message);
	}

	clearFeedback() {
		this.$feedback.removeClass('ui-feedback--success').text('');

		for (const field of this.fields) field.$input.removeAttr('aria-invalid');
	}

	reset() {
		for (const field of this.fields) {
			field.value = '';
			field.setPasswordVisible(false);
		}

		this.clearFeedback();
	}

	focus() {
		this.currentPasswordField.focus();
	}
}
