import $ from 'jquery';

import './FloatingField.scss';

export default class FloatingField {
	static nextId = 0;

	constructor({name, label, type = 'text', icon = 'bi-person', value = '', autocomplete = 'off', required = false} = {}) {
		if (!name || !label) throw new Error('FloatingField requires a name and label.');

		this.options = { name, label, type, icon, value, autocomplete, required };
		this.id = `floating-field-${++FloatingField.nextId}`;
		this.$element = this.createElement();
		this.$input = this.createInput();
		this.$label = this.createLabel();

		this.$element.append(this.$input, this.$label);

		if (type === 'password') {
			this.$toggle = this.createPasswordToggle();
			this.$element.addClass('floating-field--password').append(this.$toggle);
		}

		this.bindEvents();
	}

	createElement() {
		return $('<div>', { class: 'floating-field' });
	}

	createInput() {
		const { name, type, value, autocomplete, required } = this.options;

		return $('<input>', {id: this.id, name, type, autocomplete, placeholder: ' ', class: 'form-control floating-field__input'})
			.prop('required', required)
			.val(value);
	}

	createLabel() {
		const $label = $('<label>', { for: this.id, class: 'floating-field__label' });

		if (this.options.icon) $('<i>', { class: 'bi', 'aria-hidden': 'true' }).addClass(this.options.icon).appendTo($label);

		$('<span>', { text: this.options.label }).appendTo($label);

		return $label;
	}

	createPasswordToggle() {
		const $button = $('<button>', { type: 'button', class: 'floating-field__toggle ui-focus',
			'aria-label': `Show ${this.options.label.toLowerCase()}`,
			'aria-controls': this.id
		});

		$('<i>', { class: 'bi bi-eye', 'aria-hidden': 'true' }).appendTo($button);

		return $button;
	}

	bindEvents() {
		if (this.$toggle) {
			this.$toggle.on('click', () => {
				const isHidden = this.$input.attr('type') === 'password';

				this.setPasswordVisible(isHidden);
			});
		}
	}

	setPasswordVisible(visible) {
		if (!this.$toggle) return;

		this.$input.attr('type', visible ? 'text' : 'password');
		this.$toggle.attr('aria-label', `${visible ? 'Hide' : 'Show'} ${this.options.label.toLowerCase()}`);
		this.$toggle.find('i').toggleClass('bi-eye', !visible).toggleClass('bi-eye-slash', visible);
	}

	get value() {
		return this.$input.val();
	}

	set value(value) {
		this.$input.val(value ?? '');
	}

	focus() {
		this.$input[0].focus();
	}
}
