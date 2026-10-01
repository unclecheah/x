import $ from 'jquery';
import './MainScreen.scss';

export default class MainScreen {
	constructor({ username = '', date = MainScreen.today(), footerElement = null } = {}) {
		this.$element = $('<div>', { class: 'main-screen' });
		this.$header = this.createHeader(username, date);
		this.$main = this.createMain();
		this.$footer = this.createFooter(footerElement);

		this.$element.append(
			this.$header,
			this.$main,
			this.$footer
		);

		this.bindEvents();
	}

	static today() {
		const date = new Date();

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');

		return `${year}-${month}-${day}`;
	}

	createHeader(username, date) {
		const $header = $('<header>', { class: 'main-screen__header' });
		const $inner = $('<div>', { class: 'main-screen__header-inner' });

		$inner.append(
			this.createDateControls(date),
			this.createAccountControls(username)
		);

		return $header.append($inner);
	}

	createDateControls(date) {
		const $group = $('<div>', { class: 'main-screen__date-controls' });
		const $icon = $('<i>', { class: 'bi bi-music-note-beamed main-screen__icon', 'aria-hidden': 'true' });

		this.$date = $('<input>', { type: 'date', class: 'form-control main-screen__date ui-focus', 'aria-label': 'Event date' }).val(date);

		return $group.append($icon, this.$date);
	}

	createAccountControls(username) {
		const $group = $('<div>', { class: 'main-screen__account-controls' });
		this.$username = $('<span>', { class: 'main-screen__username', text: username, title: username });

		this.$logout = $('<button>', { type: 'button', class: 'btn ui-button ui-focus main-screen__logout', title: 'Log out',
			'aria-label': 'Log out'
		});

		this.$logout.append(
			$('<i>', { class: 'bi bi-box-arrow-right', 'aria-hidden': 'true' }),
			$('<span>', { class: 'main-screen__logout-label', text: 'Log out' })
		);

		return $group.append(this.$username, this.$logout);
	}

	createMain() {
		const $main = $('<main>', { class: 'main-screen__main' });
		const $title = $('<h1>', { class: 'ui-title main-screen__title', text: 'Choir events' });
		this.$events = $('<div>', { class: 'main-screen__events' });

		return $main.append($title, this.$events);
	}

	createFooter(footerElement) {
		const $host = $('<div>', { class: 'main-screen__footer' });

		if (footerElement) $host.append(footerElement);

		return $host;
	}

	bindEvents() {
		this.$date.on('change.mainScreen', () => {
			if (!this.date) return;

			this.$element.trigger('main:date-change', [{ date: this.date }]);
		});

		this.$logout.on('click.mainScreen', () => { this.$element.trigger('main:logout'); });
	}

	mount(target) {
		$(target).append(this.$element);

		return this;
	}

	unmount() {
		this.$element.detach();

		return this;
	}

	on(eventName, handler) {
		this.$element.on(eventName, handler);

		return this;
	}

	off(eventName, handler) {
		this.$element.off(eventName, handler);

		return this;
	}

	get date() {
		return this.$date.val();
	}

	setUsername(username) {
		this.$username.text(username).attr('title', username);
	}

	setLoggingOut(busy) {
		this.$logout.prop('disabled', busy);

		return this;
	}
}
