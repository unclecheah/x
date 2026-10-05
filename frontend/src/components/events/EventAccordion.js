import $ from 'jquery';
import { Collapse } from 'bootstrap';

import './EventAccordion.scss';

export default class EventAccordion {
	static nextId = 0;
	static nextAudioId = 0;

	constructor({ events = [] } = {}) {
		this.id = `event-accordion-${++EventAccordion.nextId}`;
		this.collapses = [];
		this.items = new Map();

		this.$element = $('<div>', { class: 'event-accordion' });
		this.isAdmin = false;
		this.setEvents (events);
	}

	createItem(event, index, expanded = index === 0) {
		const headerId = `${this.id}-header-${index}`;
		const panelId = `${this.id}-panel-${index}`;

		const $item = $('<section>', { class: 'event-accordion__item' }).css('--event-colour', event.colour ?? 'var(--ui-border)');
		const $header = this.createHeader({ event, headerId, panelId, expanded });
		const $panel = $('<div>', { id: panelId, class: 'collapse', role: 'region', 'aria-labelledby': headerId }).toggleClass('show', expanded);


		$item.append($header, $panel);
		this.$element.append($item);

		const collapse = new Collapse($panel[0], { toggle: false, parent: this.$element[0] });
		const $button = $header.find('button');

		$button.on('click', () => { this.$element.trigger('event:request-open', [{ eventId: event.id }]); });
		$panel[0].addEventListener('show.bs.collapse', () => { this.setHeaderExpanded($button, true); });
		$panel[0].addEventListener('hide.bs.collapse', () => { this.setHeaderExpanded($button, false); });

		this.collapses.push(collapse);
		this.items.set(String(event.id), { event, $item, $panel, $button, collapse, detailsLoaded: false });
	}

	createBody(event) {
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
				this.createDetailSection({
					title: 'Roles',
					kind: 'roles',
					icon: 'bi-people',
					rows: event.roles,
					labelKey: 'role',
					valueKey: 'person'
				})
			);
		}

		if (event.hymns?.length) {
			$body.append(
				this.createDetailSection({
					title: 'Hymns',
					kind: 'hymns',
					icon: 'bi-music-note-beamed',
					rows: event.hymns,
					labelKey: 'hymntype',
					valueKey: 'hymn'
				})
			);
		}

		const $combinedScores = this.createCombinedScores(event);
		if ($combinedScores) $body.append($combinedScores);

		return $body;
	}

	setEventDetails(event) {
		const key = String(event.id);
		const item = this.items.get(key);

		if (!item) return false;

		const detailedEvent = { ...item.event, ...event };

		// Build the replacement before removing the existing contents.
		const $body = this.createBody(detailedEvent);
		const $actions = this.createActions(detailedEvent);

		item.$panel.find('audio').each((index, audio) => { audio.pause(); });
		item.$panel.empty().append($body, $actions);

		item.event = detailedEvent;
		item.detailsLoaded = true;

		const index = this.events.findIndex(current => String(current.id) === key);
		if (index !== -1) this.events[index] = detailedEvent;

		return true;
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

		const recordings = Array.isArray(hymn.recordings)
			? hymn.recordings.filter((recording) => typeof recording?.url === 'string' && recording.url.trim() !== '')
			: [];

		const links = Array.isArray(hymn.links) ? hymn.links : [];
		const hymnName = String(hymn.hymn ?? '');

		const $playback = $('<div>', { class: 'event-accordion__playback' });

		if (recordings.length > 0) {
			const audioId = `${this.id}-audio-${++EventAccordion.nextAudioId}`;

			const $audio = $('<audio>', { id: audioId, class: 'event-accordion__audio', preload: 'none' })
				.prop('controls', true);

			const audio = $audio[0];
			const $partRow = $('<div>', { class: 'event-accordion__part-row' });
			const $buttons = $('<div>', { class: 'event-accordion__part-buttons', role: 'group',
				'aria-label': `Recordings for ${hymnName}`
			});

			const $selectedPart = $('<span>', { class: 'event-accordion__selected-part',
				'aria-live': 'polite', 'aria-atomic': 'true'
			});

			const labels = recordings.map((recording) => this.getRecordingLabels(recording));

			let selectedIndex = -1;

			const selectRecording = (index) => {
				// Clicking the selected button must not restart playback.
				if (index === selectedIndex) return;
				selectedIndex = index;

				const recording = recordings[index];
				const label = labels[index];
				audio.pause();

				$audio
					.attr('src', recording.url.trim())
					.attr('aria-label', `${hymnName} — ${label.long}`);

				audio.load();
				$selectedPart.text(label.long);

				$buttons.children('button').each((buttonIndex, element) => {
					$(element).attr('aria-pressed', String(buttonIndex === index));
				});
			};

			if (recordings.length > 1) {
				recordings.forEach((recording, index) => {
					const label = labels[index];

					const $button = $('<button>', {
						type: 'button', class: 'event-accordion__part-button ui-focus', text: label.short, title: label.long,
						'aria-label': `Select ${label.long}`, 'aria-controls': audioId, 'aria-pressed': 'false'
					});

					$button.on('click.eventAccordion', () => { selectRecording(index); });
					$buttons.append($button);
				});

				$partRow.append($buttons);
			}

			$partRow.append($selectedPart);
			$media.append($partRow);
			$playback.append($audio);

			selectRecording(0);
		}

		links.forEach((link, index) => {
			$playback.append(
				$('<a>', { class: 'event-accordion__external-link ui-focus', href: link, target: '_blank',
					rel: 'noopener noreferrer', title: `External link ${index + 1}: ${link}`,
					'aria-label': `External link ${index + 1} for ${hymnName} (opens in a new tab)`
				}).append(
					$('<i>', { class: 'bi bi-box-arrow-up-right', 'aria-hidden': 'true' })
				)
			);
		});

		if (recordings.length > 0 || links.length > 0) {
			$media.append($playback);
		} else {
			$media.append($('<span>', { class: 'event-accordion__media-empty', text: '—', 'aria-label': 'No media available' }));
		}

		return $media;
	}

	createCombinedScores(event) {
		const scores = event.combinedScores ?? {};

		const items = [
			{ label: 'Vocal scores', url: scores.vocals },
			{ label: 'Musician scores', url: scores.musicians }
		];

		const $links = $('<div>', {
			class: 'event-accordion__combined-scores', role: 'group',
			'aria-label': 'Combined scores'
		});

		items.forEach(({ label, url }) => {
			if (typeof url !== 'string' || !url.trim()) return;

			const $link = $('<a>', {
				class: 'btn ui-button ui-focus event-accordion__combined-score',
				href: url.trim(), target: '_blank', rel: 'noopener noreferrer',
				title: `Open ${label.toLowerCase()} PDF in a new tab`,
				'aria-label': `${label} (PDF, opens in a new tab)`
			}).append(
				$('<i>', { class: 'bi bi-file-earmark-pdf', 'aria-hidden': 'true' }),
				$('<span>', { text: label }),
				$('<i>', { class: 'bi bi-box-arrow-up-right', 'aria-hidden': 'true' })
			);

			$links.append($link);
		});

		return $links.children().length ? $links : null;
	}

	getEvent(eventId) {
		return this.items.get(String(eventId))?.event ?? null;
	}

	isExpanded(eventId) {
		const item = this.items.get(String(eventId));
		return item?.$panel.hasClass('show') ?? false;
	}

	waitForPanel(panel) {
		if (!panel.classList.contains('collapsing')) return Promise.resolve();

		return new Promise((resolve) => {
			const finished = (event) => {
				if (event.target !== panel) return;

				panel.removeEventListener('shown.bs.collapse', finished);
				panel.removeEventListener('hidden.bs.collapse', finished);

				resolve();
			};

			panel.addEventListener('shown.bs.collapse', finished);
			panel.addEventListener('hidden.bs.collapse', finished);
		});
	}

	async waitForTransitions() {
		await Promise.all([...this.items.values()].map(item => this.waitForPanel(item.$panel[0])));
	}

	async setExpanded(eventId, expanded, isCurrent = () => true) {
		const key = String(eventId);
		const item = this.items.get(key);

		if (!item) return false;

		await this.waitForTransitions();

		if (!isCurrent() || this.items.get(key) !== item) return false;
		if (expanded && !item.detailsLoaded) return false;

		if (expanded) item.collapse.show();
		else item.collapse.hide();

		await this.waitForTransitions();
		return (isCurrent() && this.items.get(key) === item && this.isExpanded(eventId) === expanded);
	}

	getNextEvent(eventId) {
		const index = this.events.findIndex((event) => String(event.id) === String(eventId));
		return index >= 0 ? this.events[index + 1] ?? null : null;
	}

	setEvents(events) {
		this.clearItems();
		this.events = [...events];
		this.events.forEach((event, index) => { this.createItem(event, index, false); });

		if (this.events.length === 0)
			this.$element.append($('<p>', { class: 'ui-copy', text: 'No events found for this date.' }));

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

	getRecordingLabels(recording) {
		const parts = Array.isArray(recording.parts)
			? recording.parts.map((part) => String(part).trim().toUpperCase()).filter(Boolean)
			: [];

		if (parts.length === 0) {
			return {
				short: 'General',
				long: 'General recording'
			};
		}

		const names = {
			D: 'Descant',
			S: 'Soprano',
			A: 'Alto',
			T: 'Tenor',
			B: 'Bass'
		};

		const descriptions = parts.map((part) =>
			part.replace(
				/^([DSATB])([12])?$/,
				(match, voice, division) => `${names[voice]}${division ? ` ${division}` : ''}`
			)
		);

		return {
			short: parts.join('+'),
			long: descriptions.join(' + ')
		};
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

	async disposeItem(item) {
		await this.waitForPanel(item.$panel[0]);
		item.collapse.dispose();
	}

	clearItems() {
		for (const item of this.items.values()) {
			item.$panel.find('audio').each((index, audio) => { audio.pause(); });

			void this.disposeItem(item);
		}

		this.items.clear();
		this.collapses = [];
		this.$element.empty();
	}

	mount(target) {
		$(target).append(this.$element);

		return this;
	}

	destroy() {
		this.clearItems();
		this.$element.remove();
	}
}
