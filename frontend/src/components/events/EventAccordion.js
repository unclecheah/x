import $ from 'jquery';
import { Collapse } from 'bootstrap';

import './EventAccordion.scss';

export default class EventAccordion {
	static nextId = 0;

	constructor({ events = [] } = {}) {
		this.id = `event-accordion-${++EventAccordion.nextId}`;
		this.collapses = [];

		this.$element = $('<div>', { class: 'event-accordion' });
		events.forEach((event, index) => { this.createItem(event, index); });
	}

	createItem(event, index) {
		const expanded = index === 0;
		const headerId = `${this.id}-header-${index}`;
		const panelId = `${this.id}-panel-${index}`;

		const $item = $('<section>', { class: 'event-accordion__item' }).css('--event-colour', event.colour ?? 'var(--ui-border)');
		const $header = this.createHeader({ event, headerId, panelId, expanded });

		const $panel = $('<div>', { id: panelId, class: 'collapse', role: 'region', 'aria-labelledby': headerId }).toggleClass('show', expanded);
		const $body = $('<div>', { class: 'event-accordion__body' });

		$panel.append($body);
		$item.append($header, $panel);
		this.$element.append($item);

		const collapse = new Collapse($panel[0], { toggle: false, parent: this.$element[0] });
		const $button = $header.find('button');

		$button.on('click', () => { collapse.toggle(); });
		$panel[0].addEventListener('show.bs.collapse', () => { this.setHeaderExpanded($button, true); });
		$panel[0].addEventListener('hide.bs.collapse', () => { this.setHeaderExpanded($button, false); });

		this.collapses.push(collapse);
	}

	createHeader({ event, headerId, panelId, expanded }) {
		const $heading = $('<h2>', { class: 'event-accordion__heading' });

		const $button = $('<button>', {
			id: headerId, type: 'button', class: 'event-accordion__header',
			'aria-expanded': String(expanded), 'aria-controls': panelId
		});

		const $icon = $('<i>', { class: 'bi bi-calendar-event event-accordion__icon', 'aria-hidden': 'true' });
		const $text = $('<span>', { class: 'event-accordion__header-text' });
		$text.append(
			$('<span>', { class: 'event-accordion__title', text: event.title }),
			$('<span>', { class: 'event-accordion__timestamp', text: event.timestamp })
		);

		const $chevron = $('<i>', { class: 'bi bi-chevron-down event-accordion__chevron', 'aria-hidden': 'true' });
		$button.append($icon, $text, $chevron);

		return $heading.append($button);
	}

	setHeaderExpanded($button, expanded) {
		$button.attr('aria-expanded', String(expanded));
	}

	mount(target) {
		$(target).append(this.$element);

		return this;
	}

	destroy() {
		this.collapses.forEach((collapse) => { collapse.dispose(); });
		this.collapses = [];
		this.$element.remove();
	}
}
