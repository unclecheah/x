import $ from 'jquery';

export default class AppController {
	constructor({ auth, mainScreen, eventAccordion, eventForm, footer, services, target = '#app' }) {
		this.auth = auth;
		this.mainScreen = mainScreen;
		this.eventAccordion = eventAccordion;
		this.eventForm = eventForm;
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
		this.eventAccordion.$element.on('event:combine-hymns event:delete', (event, { eventId }) => {
			console.log('[Event action]', event.type, eventId);
		});
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
			if (data.mode === 'add') {
				void this.insertEvent(data);
				return;
			}

			this.eventForm.showError('Saving changes to existing events is not connected yet.');
		});
	}

	async openEventForm(event = null) {
		if (this.isSavingEvent || !this.isAuthenticated || !this.eventAccordion.isAdmin) return;

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

	async handleSessionChanged(active) {
		const revision = ++this.sessionRevision;
		this.isAuthenticated = active === true;
		this.eventForm.setSaving (false);
		this.eventForm.hide ();

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

	async loadEvents() {
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
					const [colour, roles, hymns] = await Promise.all([
						this.services.db.getLitClr(event.title),
						this.services.db.getRoles(event.id),
						this.services.db.getHymns(event.id)
					]);

					if (!Array.isArray(roles) || !Array.isArray(hymns)) {
						throw new TypeError('getRoles() and getHymns() must return arrays.');
					}

					const hymnsWithMedia = await Promise.all(
						hymns.map(async (hymn) => {
							const [score, recording, link] = await Promise.all([
								this.services.files.scoreExist(hymn.hymn),
								this.services.files.recordingExist(hymn.hymn),
								this.services.files.linkExist(hymn.hymn)
							]);

							return { ...hymn, score, recording, link };
						})
					);

					return { ...event, colour, roles, hymns: hymnsWithMedia };
				})
			);

			// Ignore results if the selected date or session has changed.
			if (revision !== this.eventLoadRevision || !this.isAuthenticated) return;
			this.eventAccordion.setEvents(detailedEvents);

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
		if (this.isSavingEvent || !this.isAuthenticated || !this.eventAccordion.isAdmin) return;

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

	clearError() {
		this.$status.text('').prop('hidden', true);
	}

	showError(message, error) {
		console.error('[AppController]', message, error);

		this.$status.text(message).prop('hidden', false);
	}
}
