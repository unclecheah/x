import $ from 'jquery';
import { Collapse } from 'bootstrap';

import './EventAccordion.scss';

export default class EventAccordion {
	static nextId = 0;

	constructor({ events = [] } = {}) {
		this.id = `event-accordion-${++EventAccordion.nextId}`;
		this.collapses = [];

		this.$element = $('<div>', { class: 'event-accordion' });
		// events.forEach((event, index) => { this.createItem(event, index); });
		this.isAdmin = false;
		this.setEvents (events);
	}

	createItem(event, index, expanded = index === 0) {
		const headerId = `${this.id}-header-${index}`;
		const panelId = `${this.id}-panel-${index}`;

		const $item = $('<section>', { class: 'event-accordion__item' }).css('--event-colour', event.colour ?? 'var(--ui-border)');
		const $header = this.createHeader({ event, headerId, panelId, expanded });

		const $panel = $('<div>', { id: panelId, class: 'collapse', role: 'region', 'aria-labelledby': headerId }).toggleClass('show', expanded);
		const $body = $('<div>', { class: 'event-accordion__body' });

		const note = String(event.note ?? '').trim();

		if (note) {
			const $note = $('<div>', { class: 'event-accordion__note' });
			const $label = $('<span>', { class: 'event-accordion__note-label' }).append(
				$('<i>', { class: 'bi bi-info-circle', 'aria-hidden': 'true' }),
				$('<span>', { text: 'Note' })
			);

			$note.append($label, $('<p>', { class: 'event-accordion__note-text', text: note }));
			$body.append($note);
		}

		if (event.roles?.length) {
			$body.append(
				this.createDetailSection({ title: 'Roles', kind: 'roles', icon: 'bi-people',
					rows: event.roles, labelKey: 'role', valueKey: 'person'
				})
			);
		}

		if (event.hymns?.length) {
			$body.append(
				this.createDetailSection({ title: 'Hymns', kind: 'hymns', icon: 'bi-music-note-beamed',
					rows: event.hymns, labelKey: 'hymntype', valueKey: 'hymn'
				})
			);
		}


		$panel.append($body, this.createActions(event));
		$item.append($header, $panel);
		this.$element.append($item);

		const collapse = new Collapse($panel[0], { toggle: false, parent: this.$element[0] });
		const $button = $header.find('button');

		$button.on('click', () => { collapse.toggle(); });
		$panel[0].addEventListener('show.bs.collapse', () => { this.setHeaderExpanded($button, true); });
		$panel[0].addEventListener('hide.bs.collapse', () => { this.setHeaderExpanded($button, false); });

		this.collapses.push(collapse);
	}

	createDetailSection({ title, kind, icon, rows, labelKey, valueKey }) {
		const $section = $('<section>', { class: `event-accordion__section event-accordion__section--${kind}` });
		const $title = $('<h3>', { class: 'event-accordion__section-title' }).append(
			$('<i>', { class: `bi ${icon}`, 'aria-hidden': 'true' }),
			$('<span>', { text: title })
		);

		const $content = $('<div>', { class: 'event-accordion__section-content' });

		if (kind === 'hymns') {
			$content.append(
				$('<div>', { class: 'event-accordion__hymn-head', 'aria-hidden': 'true' }).append(
					$('<span>', { text: 'Type' }),
					$('<span>', { text: 'Title' }),
					$('<span>', { text: 'Media' })
				)
			);
		}

		const $list = $('<dl>', { class: 'event-accordion__details' });

		rows.forEach((row) => {
			const isHymn = valueKey === 'hymn';
			const $row = $('<div>', { class: 'event-accordion__detail-row' });
			const $value = $('<dd>', { class: 'event-accordion__detail-value' }).append(
				isHymn ? this.createHymnName(row) : $('<span>', { text: row[valueKey] ?? '' })
			);

			$row.append($('<dt>', { class: 'event-accordion__detail-label', text: row[labelKey] ?? '' }), $value);

			if (isHymn) $row.append(this.createHymnMedia(row));
			$list.append($row);
		});

		return $section.append($title, $content.append($list));
	}

	createHeader({ event, headerId, panelId, expanded }) {
		const $heading = $('<h2>', { class: 'event-accordion__heading' });

		const $button = $('<button>', {
			id: headerId, type: 'button', class: 'event-accordion__header', title: `Event ID: ${event.id}`,
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

	createHymnName(hymn) {
		const score = String(hymn.score ?? '').trim();

		if (score) {
			return $('<a>', { class: 'event-accordion__score-link', href: score, target: '_blank',
				rel: 'noopener noreferrer', text: hymn.hymn ?? '', title: 'Open score PDF in a new tab'
			});
		}

		return $('<span>', { class: 'event-accordion__score-unavailable', text: hymn.hymn ?? '',
			title: 'Score unavailable'
		});
	}

	createHymnMedia(hymn) {
		const $media = $('<dd>', { class: 'event-accordion__media' });
		const recording = String(hymn.recording ?? '').trim();
		const link = String(hymn.link ?? '').trim();

		if (recording) {
			$media.append(
				$('<audio>', {
					class: 'event-accordion__audio', src: recording, preload: 'none',
					'aria-label': `Recording of ${hymn.hymn}`
				}).prop('controls', true)
			);
		}

		if (link) {
			$media.append(
				$('<a>', {
					class: 'event-accordion__external-link ui-focus', href: link, target: '_blank',
					rel: 'noopener noreferrer', title: 'Open external link in a new tab',
					'aria-label': `External link for ${hymn.hymn} (opens in a new tab)`
				}).append(
					$('<i>', { class: 'bi bi-box-arrow-up-right', 'aria-hidden': 'true' })
				)
			);
		}

		if (!recording && !link) {
			$media.append(
				$('<span>', { class: 'event-accordion__media-empty', text: '—', 'aria-label': 'No media available' })
			);
		}

		return $media;
	}

	getNextEvent(eventId) {
		const index = this.events.findIndex((event) => String(event.id) === String(eventId));
		return index >= 0 ? this.events[index + 1] ?? null : null;
	}

	setEvents(events, { expandedEventId = null } = {}) {
		this.events = [...events];
		this.collapses.forEach((collapse) => { collapse.dispose(); });
		this.collapses = [];
		this.$element.empty();

		const requestedIndex = expandedEventId == null
			? 0
			: this.events.findIndex((event) => String(event.id) === String(expandedEventId));

		const expandedIndex = Math.max(0, requestedIndex);
		this.events.forEach((event, index) => { this.createItem(event, index, index === expandedIndex); });

		if (this.events.length === 0) this.$element.append($('<p>', { class: 'ui-copy', text: 'No events found for this date.' }));

		return this;
	}

	setAdmin(isAdmin) {
		this.isAdmin = isAdmin === true;
		this.$element.find('.event-accordion__actions').toggleClass('d-none', !this.isAdmin);

		return this;
	}

	setHeaderExpanded($button, expanded) {
		$button.attr('aria-expanded', String(expanded));
	}

	createActions(event) {
		const $actions = $('<div>', { class: 'event-accordion__actions', role: 'group',
			'aria-label': `Actions for ${event.title ?? 'event'}`
		}).toggleClass('d-none', !this.isAdmin);

		const buttons = [
			{ action: 'combine-hymns', label: 'Combine hymns', icon: 'bi-files' },
			{ action: 'edit', label: 'Edit', icon: 'bi-pencil-square' },
			{ action: 'delete', label: 'Delete', icon: 'bi-trash' }
		];

		buttons.forEach(({ action, label, icon }) => {
			const $button = $('<button>', { type: 'button', class: 'btn ui-button ui-focus event-accordion__action'
			}).toggleClass('event-accordion__action--danger', action === 'delete');

			$button.append(
				$('<i>', { class: `bi ${icon}`, 'aria-hidden': 'true' }),
				$('<span>', { text: label })
			);

			$button.on('click.eventAccordion', () => {
				if (!this.isAdmin) return;
				this.$element.trigger(`event:${action}`, [{ eventId: event.id, event }]);
			});

			$actions.append($button);
		});

		return $actions;
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
