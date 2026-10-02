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

		this.$status = $('<p>', { class: 'ui-feedback m-3', role: 'alert', hidden: true });
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
		this.mainScreen.on('main:add-event', () => { this.openEventForm(); });
		this.eventAccordion.$element.on('event:edit', (event, data) => { this.openEventForm(data.event); });
		this.eventAccordion.$element.on('event:combine-hymns event:delete', (event, { eventId }) => {
			console.log('[Event action]', event.type, eventId);
		});
		this.eventForm.$element.on('event-form:submit', (event, data) => {
			console.log('[Event form submit]', {
				mode: data.mode,
				eventId: data.event?.id ?? null,
				date: data.date,
				details: data.details,
				roles: data.roles
			});
		});
	}

	openEventForm(event = null) {
		if (!this.isAuthenticated || !this.eventAccordion.isAdmin) return;
		this.eventForm.show({ event, date: this.mainScreen.date });
	}

	async handleSessionChanged(active) {
		const revision = ++this.sessionRevision;
		this.isAuthenticated = active === true;
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

	clearError() {
		this.$status.text('').prop('hidden', true);
	}

	showError(message, error) {
		console.error('[AppController]', message, error);

		this.$status.text(message).prop('hidden', false);
	}
}
