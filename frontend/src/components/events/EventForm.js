import $ from 'jquery';
import { Modal } from 'bootstrap';
import Sortable from 'sortablejs';
import './EventForm.scss';
import FloatingField from '../ui/FloatingField';


export default class EventForm {
	static nextId = 0;

	constructor({ purpose = 'event' } = {}) {
		this.purpose = purpose;
		this.id = `event-form-${++EventForm.nextId}`;
		this.mode = 'add';
		this.event = null;
		this.date = '';

		this.$element = $(`
			<div
				class="modal fade event-form"
				tabindex="-1"
				aria-labelledby="${this.id}-title"
				aria-hidden="true"
			>
				<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
					<form class="modal-content event-form__content">
						<div class="modal-header event-form__header">
							<h2
								id="${this.id}-title"
								class="modal-title ui-title event-form__title"
							>
								Add event
							</h2>
						</div>

						<div class="modal-body event-form__body"></div>

						<div class="modal-footer event-form__footer">
							<button
								type="button"
								class="btn ui-button ui-focus event-form__cancel"
							>
								Cancel
							</button>

							<button
								type="submit"
								class="btn ui-button ui-focus event-form__submit"
							>
								Submit
							</button>
						</div>
					</form>
				</div>
			</div>
		`);

		this.$form = this.$element.find('form');
		this.$title = this.$element.find('.event-form__title');
		this.$body = this.$element.find('.event-form__body');
		this.$cancel = this.$element.find('.event-form__cancel');
		this.$submit = this.$element.find('.event-form__submit');
		this.isSaving = false;

		this.$feedback = $('<p>', { class: 'ui-feedback event-form__feedback', role: 'alert' });
		this.$element.find('.event-form__footer').prepend(this.$feedback);

		// Keep the modal outside the main screen's translucent frame.
		this.$element.appendTo(document.body);
		this.modal = new Modal(this.$element[0], { backdrop: 'static', keyboard: true });

		if (this.purpose === 'combine') {
			this.createCombineOptions();
		} else {
			this.createDetails();
			this.createRoles();
		}

		this.createHymns();
		this.bindEvents();
	}

	createDetails() {
		this.fields = {
			title: new FloatingField({ name: 'title', label: 'Title', icon: 'bi-calendar-event', required: true }),
			timestamp: new FloatingField({ name: 'timestamp', label: 'Date and time', type: 'datetime-local', icon: 'bi-clock', required: true }),
			note: new FloatingField({ name: 'note', label: 'Note', type: 'textarea', icon: 'bi-card-text' }),
			gcalid: new FloatingField({ name: 'gcalid', label: 'Google Calendar ID', icon: 'bi-lock' })
		};

		// Accept seconds when they are present in an existing timestamp.
		this.fields.timestamp.$input.attr('step', '1');
		this.fields.gcalid.$input.prop('readOnly', true);
		this.fields.gcalid.$element.prop('hidden', true);

		const headingId = `${this.id}-details-title`;
		const $section = $('<section>', { class: 'event-form__section', 'aria-labelledby': headingId });
		const $heading = $('<h3>', { id: headingId, class: 'event-form__section-title', text: 'Event details' });

		const $firstRow = $('<div>', { class: 'event-form__details-row' }).append(
			this.fields.title.$element, this.fields.timestamp.$element
		);

		const $fields = $('<div>', { class: 'event-form__details-fields' }).append(
			$firstRow, this.fields.note.$element, this.fields.gcalid.$element
		);

		this.$body.append($section.append($heading, $fields));
	}

	createRoles() {
		const headingId = `${this.id}-roles-title`;
		const helpId = `${this.id}-roles-help`;

		const $section = $('<section>', { class: 'event-form__section', 'aria-labelledby': headingId });
		const $heading = $('<h3>', { id: headingId, class: 'event-form__section-title', text: 'Roles' });
		this.$addRole = $('<button>', {
			type: 'button',
			class: 'btn ui-button ui-focus event-form__add-row',
			text: 'Add role'
		}).prepend(
			$('<i>', { class: 'bi bi-plus-lg', 'aria-hidden': 'true' })
		);

		const $header = $('<div>', { class: 'event-form__section-head' }).append($heading, this.$addRole);
		const $help = $('<p>', {
			id: helpId,
			class: 'ui-copy',
			text: 'Drag the grip to reorder, or focus it and use the up/down arrow keys.'
		});

		this.$roles = $('<div>', { class: 'event-form__role-list', role: 'list', 'aria-labelledby': headingId });
		this.$rolesEmpty = $('<p>', { class: 'ui-copy event-form__roles-empty', text: 'No roles added yet.' });
		this.$roleStatus = $('<div>', { class: 'visually-hidden', role: 'status',
			'aria-live': 'polite', 'aria-atomic': 'true'
		});

		$section.append($header, $help, this.$roles, this.$rolesEmpty, this.$roleStatus);
		this.$body.append($section);
		this.$addRole.on('click.eventForm', () => {
			this.addRole({}, { focus: true });
			this.modal.handleUpdate();
		});

		this.roleSortable = new Sortable(this.$roles[0], {
			draggable: '.event-form__role-row',
			handle: '.event-form__role-handle',
			direction: 'vertical',
			animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150,
			ghostClass: 'event-form__role-row--ghost',
			delay: 150,
			delayOnTouchOnly: true,
			touchStartThreshold: 4,

			onEnd: ({ item, oldIndex, newIndex }) => {
				this.updateRoleState();
				if (oldIndex !== newIndex) this.announceRolePosition($(item));
			}
		});
	}

	createHymns() {
		const headingId = `${this.id}-hymns-title`;
		const helpId = `${this.id}-hymns-help`;

		const $section = $('<section>', { class: 'event-form__section', 'aria-labelledby': headingId });
		const $heading = $('<h3>', { id: headingId, class: 'event-form__section-title', text: 'Hymns' });

		this.$addHymn = $('<button>', { type: 'button', class: 'btn ui-button ui-focus event-form__add-row', text: 'Add hymn' }).prepend(
			$('<i>', { class: 'bi bi-plus-lg', 'aria-hidden': 'true' })
		);

		const $header = $('<div>', { class: 'event-form__section-head' }).append($heading, this.$addHymn);
		const $help = $('<p>', {
			id: helpId,
			class: 'ui-copy',
			text: 'Choose a suggestion or type your own value. Drag the grip to reorder, or focus it and use the up/down arrow keys.'
		});

		this.$hymnOptionsStatus = $('<p>', { class: 'ui-copy event-form__suggestions-status', role: 'status', 'aria-live': 'polite' });
		this.$hymns = $('<div>', { class: 'event-form__hymn-list', role: 'list', 'aria-labelledby': headingId });
		this.$hymnsEmpty = $('<p>', { class: 'ui-copy event-form__hymns-empty', text: 'No hymns added yet.' });
		this.$hymnStatus = $('<div>', { class: 'visually-hidden', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });

		// One shared suggestion list per field type, for all hymn rows.
		this.$hymnTypeOptions = $('<datalist>', { id: `${this.id}-hymn-types` });
		this.$hymnOptions = $('<datalist>', { id: `${this.id}-hymn-options` });

		$section.append(
			$header,
			$help,
			this.$hymnOptionsStatus,
			this.$hymns,
			this.$hymnsEmpty,
			this.$hymnStatus,
			this.$hymnTypeOptions,
			this.$hymnOptions
		);

		this.$body.append($section);
		this.$addHymn.on('click.eventForm', () => {
			this.addHymn({}, { focus: true });
			this.modal.handleUpdate();
		});

		this.hymnSortable = new Sortable(this.$hymns[0], {
			draggable: '.event-form__hymn-row',
			handle: '.event-form__hymn-handle',
			direction: 'vertical',
			animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150,
			ghostClass: 'event-form__hymn-row--ghost',
			delay: 150,
			delayOnTouchOnly: true,
			touchStartThreshold: 4,

			onEnd: ({ item, oldIndex, newIndex }) => {
				this.updateHymnState();
				if (oldIndex !== newIndex) this.announceHymnPosition($(item));
			}
		});
	}

	createCombineOptions() {
		const $section = $('<fieldset>', { class: 'event-form__section event-form__combine-options' });
		const $legend = $('<legend>', { class: 'event-form__section-title', text: 'Score for' });
		const $choices = $('<div>', { class: 'event-form__combine-choices' });

		[{ value: 'V', label: 'Vocals' }, { value: 'M', label: 'Musician' }].forEach(({ value, label }) => {
			const $input = $('<input>', {
				type: 'radio',
				name: `${this.id}-vm`,
				value,
				class: 'ui-focus',
				required: true
			});

			$choices.append(
				$('<label>', { class: 'btn ui-button event-form__combine-choice' }).append($input, $('<span>', { text: label }))
			);
		});

		this.$vmInputs = $choices.find('input');
		this.$body.append($section.append($legend, $choices));
	}

	addRole(data = {}, { focus = false } = {}) {
		const role = new FloatingField({ name: 'role', label: 'Role', icon: 'bi-person-badge',
			value: data.role ?? '', required: true
		});
		const person = new FloatingField({ name: 'person', label: 'Person', icon: 'bi-person', value: data.person ?? '' });

		role.$element.addClass('event-form__role-name');
		person.$element.addClass('event-form__role-person');

		const $row = $('<div>', { class: 'event-form__role-row', role: 'listitem' }).data('fields', { role, person });
		const $handle = $('<button>', { type: 'button', class: 'event-form__row-icon event-form__role-handle ui-focus',
			'aria-label': 'Reorder role',
			'aria-describedby': `${this.id}-roles-help`,
			title: 'Drag to reorder, or use the up/down arrow keys'
		}).append(
			$('<i>', { class: 'bi bi-grip-vertical', 'aria-hidden': 'true' })
		);

		const $remove = $('<button>', { type: 'button', class: 'event-form__row-icon event-form__role-remove ui-focus',
			'aria-label': 'Remove role',
			title: 'Remove role'
		}).append(
			$('<i>', { class: 'bi bi-trash', 'aria-hidden': 'true' })
		);

		$handle.on('keydown.eventForm', (event) => {
			if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

			event.preventDefault();
			event.stopPropagation();
			const movingUp = event.key === 'ArrowUp';
			const $neighbour = movingUp ? $row.prev('.event-form__role-row') : $row.next('.event-form__role-row');
			if (!$neighbour.length) return;

			if (movingUp) $row.insertBefore($neighbour);
			else $row.insertAfter($neighbour);

			$handle[0].focus();
			this.updateRoleState();
			this.announceRolePosition($row);
		});

		$remove.on('click.eventForm', () => {
			const $next = $row.next('.event-form__role-row');
			const $previous = $row.prev('.event-form__role-row');
			const $focusRow = $next.length ? $next : $previous;

			$row.remove();

			this.updateRoleState();
			this.$roleStatus.text('Role removed.');
			this.modal.handleUpdate();

			if ($focusRow.length) $focusRow.find('.event-form__role-handle')[0].focus();
			else this.$addRole[0].focus();
		});

		$row.append($handle, role.$element, person.$element, $remove);
		this.$roles.append($row);
		this.updateRoleState();

		if (focus) role.focus();
	}

	addHymn(data = {}, { focus = false } = {}) {
		const hymntype = new FloatingField({
			name: 'hymntype', label: 'Hymn type', icon: 'bi-tag',
			value: data.hymntype ?? '', required: true
		});

		const hymn = new FloatingField({
			name: 'hymn', label: 'Hymn', icon: 'bi-music-note-beamed',
			value: data.hymn ?? '', required: true
		});

		hymntype.$element.addClass('event-form__hymn-type');
		hymn.$element.addClass('event-form__hymn-name');
		hymntype.$input.attr('list', this.$hymnTypeOptions.attr('id'));
		hymn.$input.attr('list', this.$hymnOptions.attr('id'));

		const $row = $('<div>', { class: 'event-form__hymn-row', role: 'listitem' }).data('fields', { hymntype, hymn });

		const $handle = $('<button>', {
			type: 'button', class: 'event-form__row-icon event-form__hymn-handle ui-focus',
			'aria-label': 'Reorder hymn', 'aria-describedby': `${this.id}-hymns-help`,
			title: 'Drag to reorder, or use the up/down arrow keys'
		}).append(
			$('<i>', { class: 'bi bi-grip-vertical', 'aria-hidden': 'true' })
		);

		const $remove = $('<button>', {
			type: 'button', class: 'event-form__row-icon event-form__hymn-remove ui-focus',
			'aria-label': 'Remove hymn',
			title: 'Remove hymn'
		}).append(
			$('<i>', { class: 'bi bi-trash', 'aria-hidden': 'true' })
		);

		$handle.on('keydown.eventForm', (event) => {
			if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

			event.preventDefault();
			event.stopPropagation();
			const movingUp = event.key === 'ArrowUp';
			const $neighbour = movingUp ? $row.prev('.event-form__hymn-row') : $row.next('.event-form__hymn-row');

			if (!$neighbour.length) return;

			if (movingUp) $row.insertBefore($neighbour);
			else $row.insertAfter($neighbour);

			$handle[0].focus();
			this.updateHymnState();
			this.announceHymnPosition($row);
		});

		$remove.on('click.eventForm', () => {
			const $next = $row.next('.event-form__hymn-row');
			const $previous = $row.prev('.event-form__hymn-row');
			const $focusRow = $next.length ? $next : $previous;

			$row.remove();

			this.updateHymnState();
			this.$hymnStatus.text('Hymn removed.');
			this.modal.handleUpdate();

			if ($focusRow.length) $focusRow.find('.event-form__hymn-handle')[0].focus();
			else this.$addHymn[0].focus();
		});

		$row.append($handle, hymntype.$element, hymn.$element, $remove);

		this.$hymns.append($row);
		this.updateHymnState();

		if (focus) hymntype.focus();
	}

	bindEvents() {
		this.$cancel.on('click.eventForm', () => { this.hide(); });

		this.$form.on('submit.eventForm', (event) => {
			event.preventDefault();

			if (this.isSaving) return;
			if (!this.$form[0].reportValidity()) return;

			this.clearError();

			if (this.purpose === 'combine') {
				const rows = this.getHymns();
				const vm = this.$vmInputs.filter(':checked').val();

				if (!rows.length) {
					this.showError('Add at least one hymn to combine.');
					this.$addHymn[0].focus();
					return;
				}

				if (rows.some(row => !row.hymntype || !row.hymn)) {
					this.showError('Enter a hymn type and hymn for every row.');
					return;
				}

				if (vm !== 'V' && vm !== 'M') {
					this.showError('Choose Vocals or Musician.');
					return;
				}

				this.$element.trigger('event-form:combine', [{ evtid: this.event.id, vm, hymns: rows.map(row => row.hymn) }]);

				return;
			}

			this.$element.trigger('event-form:submit', [{
				mode: this.mode,
				event: this.event,
				date: this.date,
				details: this.getDetails(),
				roles: this.getRoles(),
				hymns: this.getHymns()
			}]);
		});

		const element = this.$element[0];

		element.addEventListener('show.bs.modal', () => {
			const active = document.activeElement;

			this.returnFocus = (active instanceof HTMLElement && !element.contains(active)) ? active : null;
		});

		element.addEventListener('hide.bs.modal', (event) => {
			if (this.isSaving) {
				event.preventDefault();
				return;
			}

			if (event.defaultPrevented) return;

			const active = document.activeElement;

			if (active instanceof HTMLElement && element.contains(active)) { active.blur(); }
		});

		element.addEventListener('hidden.bs.modal', () => {
			const target = this.returnFocus;
			this.returnFocus = null;

			// Another modal may have opened after a session change.
			if (document.querySelector('.modal.show')) return;

			if (
				target?.isConnected &&
				$(target).is(':visible') &&
				!target.matches(':disabled, [aria-disabled="true"]') &&
				!target.closest('[inert], [aria-hidden="true"]')
			) {
				target.focus({ preventScroll: true });
			}
		});

		this.$element[0].addEventListener('shown.bs.modal', () => {
			if (this.purpose === 'combine') this.$vmInputs.filter(':checked')[0]?.focus();
		});
	}

	show({ event = null, date = '' } = {}) {
		if (this.isSaving) return this;

		if (this.purpose === 'combine' && event?.id == null) {
			throw new TypeError('Combining hymns requires an event ID.');
		}

		this.mode = this.purpose === 'combine' ? 'combine' : (event === null ? 'add' : 'edit');
		this.event = event === null ? null : structuredClone(event);
		this.date = date;

		this.clearError();

		if (this.mode === 'combine') {
			this.$title.text('Combine hymns');
			this.$vmInputs.prop('checked', false);
			this.$vmInputs.filter('[value="V"]').prop('checked', true);
		} else {
			this.$title.text(this.mode === 'add' ? 'Add event' : 'Edit event');
			this.populateDetails();
			this.populateRoles();
		}

		this.populateHymns();
		this.modal.show();

		return this;
	}

	getDetails() {
		return {
			title: this.fields.title.value.trim(),
			timestamp: this.fields.timestamp.value,
			note: this.fields.note.value,
			gcalid: this.event?.gcalid ?? ''
		};
	}

	populateDetails() {
		const event = this.event;

		this.fields.title.value = event?.title ?? '';
		this.fields.note.value = event?.note ?? '';
		this.fields.gcalid.value = event?.gcalid ?? '';

		const timestamp = this.mode === 'edit' ? event.timestamp : (this.date ? `${this.date}T00:00` : '');
		this.fields.timestamp.value = this.toDateTimeInput(timestamp);

		const hasCalendarId = String(this.fields.gcalid.value).trim() !== '';
		this.fields.gcalid.$element.prop('hidden', !hasCalendarId);
	}

	updateRoleState() {
		const $rows = this.$roles.children('.event-form__role-row');
		this.$rolesEmpty.prop('hidden', $rows.length > 0);

		$rows.each((index, element) => {
			const $row = $(element);
			const number = index + 1;

			$row.find('.event-form__role-handle').attr('aria-label', `Reorder role ${number}`);
			$row.find('.event-form__role-remove').attr('aria-label', `Remove role ${number}`);
		});
	}

	updateHymnState() {
		const $rows = this.$hymns.children('.event-form__hymn-row');
		this.$hymnsEmpty.prop('hidden', $rows.length > 0);

		$rows.each((index, element) => {
			const $row = $(element);
			const number = index + 1;

			$row.find('.event-form__hymn-handle').attr('aria-label', `Reorder hymn ${number}`);
			$row.find('.event-form__hymn-remove').attr('aria-label', `Remove hymn ${number}`);
		});
	}

	announceHymnPosition($row) {
		const $rows = this.$hymns.children('.event-form__hymn-row');
		const { hymn } = $row.data('fields');
		const name = hymn.value.trim() || 'Hymn';
		const position = $rows.index($row) + 1;

		this.$hymnStatus.text(`${name} moved to position ${position} of ${$rows.length}.`);
	}

	populateHymns() {
		this.$hymns.empty();
		this.$hymnStatus.text('');

		const hymns = this.event?.hymns ?? [];
		hymns.forEach((hymn) => { this.addHymn(hymn); });
		this.updateHymnState();
	}

	getHymns() {
		return this.$hymns
			.children('.event-form__hymn-row')
			.toArray()
			.map((element) => {
				const { hymntype, hymn } = $(element).data('fields');
				return { hymntype: hymntype.value.trim(), hymn: hymn.value.trim() };
			});
	}

	announceRolePosition($row) {
		const $rows = this.$roles.children('.event-form__role-row');
		const { role } = $row.data('fields');
		const name = role.value.trim() || 'Role';
		const position = $rows.index($row) + 1;

		this.$roleStatus.text(`${name} moved to position ${position} of ${$rows.length}.`);
	}

	populateRoles() {
		this.$roles.empty();
		this.$roleStatus.text('');

		const roles = this.event?.roles ?? [];
		roles.forEach((role) => { this.addRole(role); });
		this.updateRoleState();
	}

	getRoles() {
		return this.$roles
			.children('.event-form__role-row')
			.toArray()
			.map((element) => {
				const { role, person } = $(element).data('fields');
				return { role: role.value.trim(), person: person.value.trim() };
			});
	}

	toDateTimeInput(timestamp) {
		const value = String(timestamp ?? '').trim();

		if (!value) return '';

		// Accept local SQL or HTML datetime strings, with optional seconds.
		const match = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2}(?:\.\d{1,3})?)?$/);

		if (!match) {
			console.warn('[EventForm] Unsupported timestamp format:', value);
			return '';
		}

		return `${match[1]}T${match[2]}${match[3] ?? ''}`;
	}

	setHymnOptions(types, hymns) {
		const normalise = (values, label) => {
			if (!Array.isArray(values) || !values.every((value) => typeof value === 'string')) {
				throw new TypeError(`${label} must be an array of strings.`);
			}

			return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
		};

		// Validate both lists before changing either one.
		const typeValues = normalise(types, 'Hymn types');
		const hymnValues = normalise(hymns, 'Hymns');

		this.$hymnTypeOptions.empty().append(typeValues.map((value) => $('<option>', { value })[0]));
		this.$hymnOptions.empty().append(hymnValues.map((value) => $('<option>', { value })[0]));
	}

	setHymnOptionsStatus(message = '', isError = false) {
		this.$hymnOptionsStatus.text(message).toggleClass('event-form__suggestions-status--error', isError);
		this.modal.handleUpdate();
	}

	setSaving(busy) {
		this.isSaving = busy === true;

		this.$form.find('input, textarea, select, button').prop('disabled', this.isSaving);

		const busyText = this.purpose === 'combine' ? 'Combining…' : 'Saving…';

		this.$submit.text(this.isSaving ? busyText : 'Submit');

		this.roleSortable?.option('disabled', this.isSaving);
		this.hymnSortable?.option('disabled', this.isSaving);
	}

	clearError() {
		this.$feedback.text('');
	}

	showError(message) {
		this.$feedback.text(message);
		this.modal.handleUpdate();
	}

	hide() {
		this.modal.hide();

		return this;
	}
}
