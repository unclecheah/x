import $ from 'jquery';

export default class AppController {
	constructor({ auth, mainScreen, eventAccordion, eventForm, combineForm, confirmDialog, footer, services, target = '#app' }) {
		this.auth = auth;
		this.mainScreen = mainScreen;
		this.eventAccordion = eventAccordion;
		this.eventForm = eventForm;
		this.combineForm = combineForm;
		this.combineFormRevision = 0;
		this.isCombining = false;
		this.footer = footer;
		this.services = services;
		this.$target = $(target);

		if (this.$target.length !== 1) throw new Error('AppController requires one mounting container.');

		this.started = false;
		this.isLoggingOut = false;
		this.sessionRevision = 0;
		this.isAuthenticated = false;
		this.eventLoadRevision = 0;
		this.pendingEventLoads = 0;
		this.eventFormRevision = 0;
		this.isSavingEvent = false;
		this.confirmDialog = confirmDialog;
		this.pendingDelete = null;
		this.isDeletingEvent = false;

		this.$status = $('<p>', { class: 'ui-feedback m-3', role: 'alert', hidden: true });
	}

	static localTimestamp() {
		const now = new Date();
		const pad = (value) => String(value).padStart(2, '0');

		const date = [
			now.getFullYear(),
			pad(now.getMonth() + 1),
			pad(now.getDate())
		].join('-');

		const time = [
			pad(now.getHours()),
			pad(now.getMinutes())
		].join(':');

		return `${date}T${time}`;
	}

	async start() {
		if (this.started) return;

		this.started = true;

		this.mainScreen.unmount();
		this.$target.prepend(this.$status);
		this.footer.mount(this.mainScreen.$footer);

		this.bindEvents();

		try {
			await this.auth.initialise(this.services);
		} catch (error) {
			this.showError('Unable to initialise authentication. Please reload to try again.', error);
		}
	}

	bindEvents() {
		this.auth.on('auth:session-changed', (event, active) => { void this.handleSessionChanged(active); });
		this.mainScreen.on('main:logout', () => { void this.logout(); });
		this.mainScreen.on('main:date-change', () => { void this.loadEvents(); });
		this.mainScreen.on('main:add-event', () => { void this.openEventForm(); });
		this.eventAccordion.$element.on('event:edit', (event, data) => { void this.openEventForm(data.event); });
		this.eventAccordion.$element.on('event:delete', (event, data) => { this.requestDeleteEvent(data.event); });
		this.confirmDialog.$element.on('confirm:yes', () => { void this.deleteEvent(); });
		this.confirmDialog.$element.on('confirm:closed', () => { this.pendingDelete = null; });
		this.eventAccordion.$element.on('event:combine-hymns', (event, { event: selectedEvent }) => {
			void this.openCombineForm(selectedEvent);
		});
		this.combineForm.$element.on('event-form:combine', (event, data) => {
			void this.combineHymns(data);
		});
		this.combineForm.$element[0].addEventListener('hidden.bs.modal', () => { this.combineFormRevision++; });

		// this.eventAccordion.$element.on('event:combine-hymns', (event, { eventId }) => {
		// 	console.log('[Event action]', event.type, eventId);
		// });
		// this.eventForm.$element.on('event-form:submit', (event, data) => {
		// 	console.log('[Event form submit]', {
		// 		mode: data.mode,
		// 		eventId: data.event?.id ?? null,
		// 		date: data.date,
		// 		details: data.details,
		// 		roles: data.roles,
		// 		hymns: data.hymns
		// 	});
		// });
		this.eventForm.$element.on('event-form:submit', (event, data) => {
			if (data.mode === 'add') void this.insertEvent(data);
			else if (data.mode === 'edit') void this.updateEvent(data);
		});
	}

	async openEventForm(event = null) {
		if (this.isSavingEvent || !this.isAuthenticated || !this.eventAccordion.isAdmin || this.isDeletingEvent) return;

		const revision = ++this.eventFormRevision;
		const sessionRevision = this.sessionRevision;

		const isCurrent = () =>
			revision === this.eventFormRevision &&
			sessionRevision === this.sessionRevision &&
			this.isAuthenticated;

		try {
			this.eventForm.show({ event, date: this.mainScreen.date });
			this.eventForm.setHymnOptions([], []);
			this.eventForm.setHymnOptionsStatus('Loading hymn suggestions…');

			const [types, hymns] = await Promise.all([this.services.files.getHymnTypes(), this.services.files.getAllHymns()]);

			if (!isCurrent()) return;
			this.eventForm.setHymnOptions(types, hymns);
			this.eventForm.setHymnOptionsStatus('');

		} catch (error) {
			if (!isCurrent()) return;
			console.error('[Event form] Unable to load hymn suggestions.', error);

			this.eventForm.setHymnOptionsStatus('Unable to load suggestions. You can still type your own values.', true);
		}
	}

	async openCombineForm(event) {
		if (
			!this.isAuthenticated ||
			!this.eventAccordion.isAdmin ||
			this.isCombining ||
			this.isSavingEvent ||
			this.isDeletingEvent
		) {
			return;
		}

		const revision = ++this.combineFormRevision;
		const sessionRevision = this.sessionRevision;

		const isCurrent = () => (
			revision === this.combineFormRevision &&
			sessionRevision === this.sessionRevision &&
			this.isAuthenticated
		);

		try {
			this.combineForm.show({ event });
			this.combineForm.setHymnOptions([], []);
			this.combineForm.setHymnOptionsStatus('Loading suggestions…');

			const [types, hymns] = await Promise.all([
				this.services.files.getHymnTypes(),
				this.services.files.getAllHymns()
			]);

			if (!isCurrent()) return;

			this.combineForm.setHymnOptions(types, hymns);
			this.combineForm.setHymnOptionsStatus();
		} catch (error) {
			if (!isCurrent()) return;

			console.error('[AppController] Combine form:', error);

			this.combineForm.setHymnOptionsStatus(
				'Unable to load suggestions. You can still type entries manually.',
				true
			);
		}
	}

	async handleSessionChanged(active) {
		const revision = ++this.sessionRevision;
		this.isAuthenticated = active === true;
		this.combineFormRevision++;
		this.isCombining = false;
		this.combineForm.setSaving(false);
		this.combineForm.hide();
		this.eventForm.setSaving (false);
		this.eventForm.hide ();
		this.pendingDelete = null;
		this.confirmDialog.setBusy(false);
		this.confirmDialog.hide();

		// Invalidate requests belonging to the previous session state.
		this.eventLoadRevision++;

		this.clearError();
		this.mainScreen.setUsername('');
		this.mainScreen.setAdmin(false);
		this.eventAccordion.setAdmin(false);
		this.eventAccordion.setEvents([]);

		if (!this.isAuthenticated) {
			this.mainScreen.unmount();
			return;
		}

		this.mainScreen.mount(this.$target);
		void this.loadEvents();

		try {
			const username = await this.services.session.getvar('username');
			if (revision !== this.sessionRevision) return;
			this.mainScreen.setUsername(username ?? '');
			if (!username) return;

			const role = await this.services.auth.getRole(username);
			if (revision !== this.sessionRevision) return;
			const isAdmin = role === 'admin';
			this.mainScreen.setAdmin(isAdmin);
			this.eventAccordion.setAdmin(isAdmin);

		} catch (error) {
			if (revision !== this.sessionRevision) return;

			this.showError('Unable to load your account details. Please reload to try again.', error);
		}
	}

	async loadEvents({ expandedEventId = null } = {}) {
		if (!this.isAuthenticated) return;
		const date = this.mainScreen.date;
		if (!date) return;
		const revision = ++this.eventLoadRevision;

		this.clearError();
		this.pendingEventLoads++;

		try {
			if (this.pendingEventLoads === 1) this.services.overlay.start();

			const events = await this.services.db.getEvents(date);
			if (revision !== this.eventLoadRevision || !this.isAuthenticated) return;
			if (!Array.isArray(events)) throw new TypeError('getEvents() must return an array.');

			// const colouredEvents = await Promise.all(
			// 	events.map(async (event) => ({ ...event, colour: await this.services.db.getLitClr(event.title) }))
			// );
			const detailedEvents = await Promise.all(
				events.map(async (event) => {
					const [colour, roles, hymns, combinedResult] = await Promise.all([
						this.services.db.getLitClr(event.title),
						this.services.db.getRoles(event.id),
						this.services.db.getHymns(event.id),
						this.services.files.getCombined({ evtid: event.id })
					]);

					const combinedUrls = typeof combinedResult === 'string' ? JSON.parse(combinedResult) : combinedResult;

					if (!Array.isArray(combinedUrls) || !combinedUrls.every(url => typeof url === 'string')) {
						throw new TypeError('getCombined() must return an array of URLs.');
					}

					const combinedScores = {
						vocals: combinedUrls.find(url => /\.V\.pdf$/i.test(url)) ?? '',
						musicians: combinedUrls.find(url => /\.M\.pdf$/i.test(url)) ?? ''
					};

					if (!Array.isArray(roles) || !Array.isArray(hymns)) {
						throw new TypeError('getRoles() and getHymns() must return arrays.');
					}

					const hymnsWithMedia = await Promise.all(
						hymns.map(async (hymn) => {
							const [score, recordingResponse, link] = await Promise.all([
								this.services.files.scoreExist(hymn.hymn),
								this.services.files.recordingExist(hymn.hymn),
								this.services.files.linkExist(hymn.hymn)
							]);

							const recordingResult = typeof recordingResponse === 'string'
								? JSON.parse(recordingResponse)
								: recordingResponse;

							const recordings =
								recordingResult?.found === true && Array.isArray(recordingResult.recordings)
								? recordingResult.recordings
								: [];

							return { ...hymn, score, recordings, link };
						})
					);

					return { ...event, colour, roles, hymns: hymnsWithMedia, combinedScores };
				})
			);

			// Ignore results if the selected date or session has changed.
			if (revision !== this.eventLoadRevision || !this.isAuthenticated) return;
			this.eventAccordion.setEvents(detailedEvents, { expandedEventId });

		} catch (error) {
			if (revision !== this.eventLoadRevision || !this.isAuthenticated) return;
			this.eventAccordion.setEvents([]);
			this.showError('Unable to load events. Please select the date again to retry.', error);

		} finally {
			this.pendingEventLoads--;
			if (this.pendingEventLoads === 0) this.services.overlay.stop();
		}
	}

	async logout() {
		if (this.isLoggingOut) return;

		this.isLoggingOut = true;
		this.mainScreen.setLoggingOut(true);
		this.clearError();

		try {
			await this.auth.logout();
		} catch (error) {
			this.showError('Unable to complete logout. Please try again.', error);
		} finally {
			this.isLoggingOut = false;
			this.mainScreen.setLoggingOut(false);
		}
	}

	async insertEvent({ details, roles, hymns }) {
		if (this.isSavingEvent || !this.isAuthenticated || !this.eventAccordion.isAdmin || this.isDeletingEvent) return;

		this.eventForm.clearError();

		if (!details.title || !details.timestamp) {
			this.eventForm.showError('Please enter the event title and date/time.');
			return;
		}

		const sessionRevision = this.sessionRevision;

		const isCurrentSession = () =>
			sessionRevision === this.sessionRevision &&
			this.isAuthenticated;

		const data = {
			gcalevtid: '',
			title: details.title,
			timestamp: details.timestamp,
			note: details.note,
			roles,
			hymns,
			updated: AppController.localTimestamp()
		};

		this.isSavingEvent = true;
		this.eventForm.setSaving(true);

		try {
			const result = await this.services.db.insert(data);

			if (result === false) throw new Error('The insert operation returned false.');
			if (!isCurrentSession()) return;

			this.eventForm.setSaving(false);
			this.eventForm.hide();

			// Show the date on which the new event was created.
			this.mainScreen.setDate(data.timestamp.slice(0, 10));

			// Reload through the existing event/media enrichment pipeline.
			await this.loadEvents();

		} catch (error) {
			console.error('[AppController] Unable to insert event.', error);

			if (isCurrentSession()) this.eventForm.showError('Unable to save the event. Please check the error and try again.');
		} finally {
			this.isSavingEvent = false;
			if (isCurrentSession()) this.eventForm.setSaving(false);
		}
	}

	async updateEvent({ event: originalEvent, details, roles, hymns }) {
		if (this.isSavingEvent || !this.isAuthenticated || !this.eventAccordion.isAdmin || this.isDeletingEvent) return;
		this.eventForm.clearError();

		if (originalEvent?.id == null || originalEvent.id === '') {
			this.eventForm.showError('Unable to update this event because its ID is missing.');
			return;
		}

		if (!details.title || !details.timestamp) {
			this.eventForm.showError('Please enter the event title and date/time.');
			return;
		}

		const sessionRevision = this.sessionRevision;
		const isCurrentSession = () => sessionRevision === this.sessionRevision && this.isAuthenticated;

		const data = {
			id: originalEvent.id,
			title: details.title,
			timestamp: details.timestamp,
			note: details.note,
			roles,
			hymns,
			updated: AppController.localTimestamp()
		};

		this.isSavingEvent = true;
		this.eventForm.setSaving(true);

		try {
			const result = await this.services.db.update(data);

			if (result === false) throw new Error('The update operation returned false.');
			if (!isCurrentSession()) return;
			this.eventForm.setSaving(false);
			this.eventForm.hide();

			// Follow the event if its date has changed.
			this.mainScreen.setDate(data.timestamp.slice(0, 10));

			// Reload event details, roles, hymns, and media.
			await this.loadEvents();

		} catch (error) {
			console.error('[AppController] Unable to update event.', error);
			if (isCurrentSession()) this.eventForm.showError('Unable to update the event. Please check the error and try again.');

		} finally {
			this.isSavingEvent = false;
			if (isCurrentSession()) this.eventForm.setSaving(false);
		}
	}

	async combineHymns(data) {
		if (
			!this.isAuthenticated ||
			!this.eventAccordion.isAdmin ||
			this.isCombining ||
			this.isSavingEvent ||
			this.isDeletingEvent
		) {
			return;
		}

		const sessionRevision = this.sessionRevision;

		this.isCombining = true;
		this.combineForm.clearError();
		this.combineForm.setSaving(true);

		try {
			const result = await this.services.files.combine({ evtid: data.evtid, vm: data.vm, hymns: [...data.hymns]});

			if (result === false) throw new Error('The file service could not combine the hymns.');

			if (sessionRevision !== this.sessionRevision || !this.isAuthenticated) return;

			this.combineForm.setSaving(false);
			this.combineForm.hide();

			await this.loadEvents({ expandedEventId: data.evtid});

		} catch (error) {
			if (sessionRevision !== this.sessionRevision || !this.isAuthenticated) return;

			console.error('[AppController] Combine hymns:', error);
			this.combineForm.showError('Unable to combine the hymns. Please try again.');

		} finally {
			if (sessionRevision === this.sessionRevision) {
				this.isCombining = false;
				this.combineForm.setSaving(false);
			}
		}
	}

	requestDeleteEvent(event) {
		if (this.isSavingEvent || this.isDeletingEvent || !this.isAuthenticated || !this.eventAccordion.isAdmin) return;

		if (event?.id == null || event.id === '') {
			this.showError('Unable to delete this event because its ID is missing.', new Error('Missing event ID.'));
			return;
		}

		const nextEvent = this.eventAccordion.getNextEvent(event.id);

		this.pendingDelete = {
			id: event.id,
			nextEvent: nextEvent ? { id: nextEvent.id, timestamp: nextEvent.timestamp } : null,
			sessionRevision: this.sessionRevision
		};

		this.confirmDialog.show({
			title: 'Delete event?',
			message: `Delete “${event.title ?? 'Untitled event'}”?\nEvent ID: ${event.id}`
		});
	}

	async deleteEvent() {
		const pending = this.pendingDelete;

		if (!pending || this.isDeletingEvent || this.isSavingEvent || !this.isAuthenticated || !this.eventAccordion.isAdmin || pending.sessionRevision !== this.sessionRevision) return;

		const isCurrentSession = () => pending.sessionRevision === this.sessionRevision && this.isAuthenticated;

		this.isDeletingEvent = true;
		this.confirmDialog.setBusy(true);

		try {
			const result = await this.services.db.delete({ id: pending.id });
			if (result === false) throw new Error('The delete operation returned false.');

		} catch (error) {
			console.error('[AppController] Unable to delete event.', error);
			if (isCurrentSession()) this.confirmDialog.showError('Unable to delete the event. Please check the error and try again.');

			return;

		} finally {
			this.isDeletingEvent = false;
			if (isCurrentSession()) this.confirmDialog.setBusy(false);
		}

		if (!isCurrentSession()) return;
		this.confirmDialog.hide();
		const nextEvent = pending.nextEvent;
		const date = nextEvent ? String(nextEvent.timestamp).slice(0, 10) : AppController.localTimestamp().slice(0, 10);

		this.mainScreen.setDate(date);
		await this.loadEvents({ expandedEventId: nextEvent?.id ?? null });
	}

	clearError() {
		this.$status.text('').prop('hidden', true);
	}

	showError(message, error) {
		console.error('[AppController]', message, error);
		this.$status.text(message).prop('hidden', false);
	}
}
