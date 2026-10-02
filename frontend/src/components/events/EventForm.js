import $ from 'jquery';
import { Modal } from 'bootstrap';
import Sortable from 'sortablejs';
import './EventForm.scss';
import FloatingField from '../ui/FloatingField';


export default class EventForm {
	static nextId = 0;

	constructor() {
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

		// Keep the modal outside the main screen's translucent frame.
		this.$element.appendTo(document.body);
		this.modal = new Modal(this.$element[0], { backdrop: 'static', keyboard: true });

		this.createDetails ();
		this.createRoles ();
		this.bindEvents();
	}

	createDetails() {
		this.fields = {
			title: new FloatingField({ name: 'title', label: 'Title', icon: 'bi-calendar-event', required: true }),
			timestamp: new FloatingField({ name: 'timestamp', label: 'Date and time', type: 'datetime-local', icon: 'bi-clock', required: true }),
			note: new FloatingField({ name: 'note', label: 'Note', type: 'textarea', icon: 'bi-card-text' }),
			gcalevtid: new FloatingField({ name: 'gcalevtid', label: 'Google Calendar ID', icon: 'bi-lock' })
		};

		// Accept seconds when they are present in an existing timestamp.
		this.fields.timestamp.$input.attr('step', '1');
		this.fields.gcalevtid.$input.prop('readOnly', true);
		this.fields.gcalevtid.$element.prop('hidden', true);

		const headingId = `${this.id}-details-title`;
		const $section = $('<section>', { class: 'event-form__section', 'aria-labelledby': headingId });
		const $heading = $('<h3>', { id: headingId, class: 'event-form__section-title', text: 'Event details' });

		const $firstRow = $('<div>', { class: 'event-form__details-row' }).append(
			this.fields.title.$element, this.fields.timestamp.$element
		);

		const $fields = $('<div>', { class: 'event-form__details-fields' }).append(
			$firstRow, this.fields.note.$element, this.fields.gcalevtid.$element
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

	bindEvents() {
		this.$cancel.on('click.eventForm', () => { this.hide(); });

		this.$form.on('submit.eventForm', (event) => {
			event.preventDefault();

			this.$element.trigger('event-form:submit', [{
				mode: this.mode,
				event: this.event,
				date: this.date,
				details: this.getDetails(),
				roles: this.getRoles()
			}]);
		});
	}

	show({ event = null, date = '' } = {}) {
		this.mode = event === null ? 'add' : 'edit';
		this.event = event === null ? null : structuredClone(event);
		this.date = date;

		this.$title.text(this.mode === 'add' ? 'Add event' : 'Edit event');
		this.populateDetails();
		this.populateRoles();
		this.modal.show();

		return this;
	}

	getDetails() {
		return {
			title: this.fields.title.value.trim(),
			timestamp: this.fields.timestamp.value,
			note: this.fields.note.value,
			gcalevtid: this.event?.gcalevtid ?? ''
		};
	}

	populateDetails() {
		const event = this.event;

		this.fields.title.value = event?.title ?? '';
		this.fields.note.value = event?.note ?? '';
		this.fields.gcalevtid.value = event?.gcalevtid ?? '';

		const timestamp = this.mode === 'edit' ? event.timestamp : (this.date ? `${this.date}T00:00` : '');
		this.fields.timestamp.value = this.toDateTimeInput(timestamp);

		const hasCalendarId = String(this.fields.gcalevtid.value).trim() !== '';
		this.fields.gcalevtid.$element.prop('hidden', !hasCalendarId);
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

	hide() {
		this.modal.hide();

		return this;
	}
}
