import $ from 'jquery';
import { Modal } from 'bootstrap';

import './AuthModal.scss';

export default class AuthModal {
	constructor({ churchName = 'Church community', tagline = 'GATHER · SERVE · BELONG' } = {}) {
		this.$element = this.createElement();
		this.$aside = this.createAside({ churchName, tagline });
		this.$main = this.createMain();

		this.$element.find('.modal-content').append(this.$aside, this.$main);
		this.$element.appendTo(document.body);
		this.$view = this.$main.find('.auth-modal__view');

		this.modal = new Modal(this.$element[0]);

		this.currentView = null;
		this.isOpen = false;
		this.isSwitching = false;
		this.viewAnimations = [];

		this.bindEvents();
	}

	createElement() {
		return $(`
			<div
				class="modal fade auth-modal" tabindex="-1" data-bs-theme="dark"
				aria-label="Account access" aria-hidden="true"
			>
				<div class="modal-dialog modal-dialog-centered">
					<div class="modal-content ui-surface"></div>
				</div>
			</div>
		`);
	}

	createAside({ churchName, tagline }) {
		const $aside = $(`
			<aside class="auth-modal__aside">
				<div class="auth-modal__brand">
					<span class="auth-modal__mark">
						<i class="bi bi-house-heart" aria-hidden="true"></i>
					</span>

					<div>
						<div class="auth-modal__name"></div>
						<div class="auth-modal__tagline"></div>
					</div>
				</div>

				<div class="auth-modal__intro">
					<p class="auth-modal__message">
						Together<br>
						in faith.<br>
						Connected<br>
						in service.
					</p>

					<div class="auth-modal__window" aria-hidden="true"></div>
				</div>

				<div class="auth-modal__caption">
					A PLACE TO BELONG
				</div>
			</aside>
		`);

		$aside.find('.auth-modal__name').text(churchName);
		$aside.find('.auth-modal__tagline').text(tagline);

		return $aside;
	}

	createMain() {
		return $(`
			<div class="auth-modal__main">
				<button
					type="button"
					class="btn-close ui-focus auth-modal__close"
					data-bs-dismiss="modal"
					aria-label="Close"
				></button>

				<div class="auth-modal__view"></div>
			</div>
		`);
	}

	bindEvents() {
		const element = this.$element[0];

		element.addEventListener('shown.bs.modal', () => {
			this.isOpen = true;
			if (!this.isSwitching) this.currentView?.focus();
		});

		element.addEventListener('hide.bs.modal', () => {
			this.isOpen = false;

			// Complete any view transition before the modal closes.
			for (const animation of this.viewAnimations) animation.finish();
		});

		element.addEventListener('hidden.bs.modal', () => {
			if (this.returnFocus?.isConnected) this.returnFocus.focus();
		});
	}

	setContent(content) {
		this.$view.empty().append(content);
		this.modal.handleUpdate();
	}

	mountView(view) {
		this.$view.children().detach();
		this.$view.append(view.$element);

		this.currentView = view;

		this.modal.handleUpdate();
	}

	getTransitionOptions() {
		const styles = getComputedStyle(this.$element[0]);
		const durationText = styles.getPropertyValue('--ui-duration').trim() || '380ms';
		const easing = styles.getPropertyValue('--ui-easing').trim() || 'ease';
		const durationValue = parseFloat(durationText);
		const duration = durationText.endsWith('ms') ? durationValue : durationValue * 1000;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		return { duration: reduceMotion ? 0 : duration, easing, fill: 'both' };
	}

	async showView(nextView, { direction = 'forward', animate = true } = {}) {
		if (this.isSwitching || nextView === this.currentView) return false;

		const options = this.getTransitionOptions();
		const shouldAnimate = animate && this.isOpen && this.currentView && options.duration > 0;

		if (!shouldAnimate) {
			this.mountView(nextView);
			if (this.isOpen) nextView.focus();

			return true;
		}

		this.isSwitching = true;

		const previousView = this.currentView;
		const host = this.$view[0];
		const outgoing = previousView.$element[0];
		const incoming = nextView.$element[0];
		const distance = direction === 'back' ? -22 : 22;

		try {
			const startHeight = host.getBoundingClientRect().height;

			// Hold the existing height while measuring the new form.
			host.style.height = `${startHeight}px`;

			// Move focus out before temporarily disabling both forms.
			if (outgoing.contains(document.activeElement)) this.$element[0].focus({ preventScroll: true });

			outgoing.inert = true;
			incoming.inert = true;

			this.$view.addClass('is-switching').attr('aria-busy', 'true').append(nextView.$element);

			const hostStyles = getComputedStyle(host);
			const verticalPadding = parseFloat(hostStyles.paddingTop) + parseFloat(hostStyles.paddingBottom);
			const endHeight = incoming.getBoundingClientRect().height + verticalPadding;

			this.viewAnimations = [
				outgoing.animate(
					[
						{ opacity: 1, transform: 'translateX(0)' },
						{ opacity: 0, transform: `translateX(${-distance}px)` }
					],
					options
				),

				incoming.animate(
					[
						{ opacity: 0, transform: `translateX(${distance}px)` },
						{ opacity: 1, transform: 'translateX(0)' }
					],
					options
				),

				host.animate(
					[
						{ height: `${startHeight}px` },
						{ height: `${endHeight}px` }
					],
					options
				)
			];

			await Promise.allSettled( this.viewAnimations.map(animation => animation.finished) );

		} finally {
			previousView.$element.detach();

			// Ensure the incoming view is mounted even if setup failed.
			this.$view.append(nextView.$element);
			outgoing.inert = false;
			incoming.inert = false;

			for (const animation of this.viewAnimations) animation.cancel();
			this.viewAnimations = [];

			// Return to natural sizing after the animation.
			host.style.height = '';

			this.$view.removeClass('is-switching').removeAttr('aria-busy');
			this.currentView = nextView;
			this.isSwitching = false;

			this.modal.handleUpdate();
			if (this.isOpen) nextView.focus();
		}

		return true;
	}

	show() {
		this.returnFocus = document.activeElement;
		this.modal.show();
	}

	hide() {
		this.modal.hide();
	}
}
