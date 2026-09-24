import $ from 'jquery';
import { Modal } from 'bootstrap';

import './AuthModal.scss';

export default class AuthModal {
	constructor({ churchName = 'Church community', tagline = 'GATHER · SERVE · BELONG' } = {}) {
		this.$element = this.createElement();
		this.$aside = this.createAside({ churchName, tagline });
		this.$main = this.createMain();

		this.$element.find('.modal-content').append(this.$aside, this.$main);

		this.$view = this.$main.find('.auth-modal__view');

		this.$element.appendTo(document.body);

		this.modal = new Modal(this.$element[0]);

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
		this.$element[0].addEventListener('hidden.bs.modal', () => {
			if (this.returnFocus?.isConnected) {
				this.returnFocus.focus();
			}
		});
	}

	setContent(content) {
		this.$view.empty().append(content);
		this.modal.handleUpdate();
	}

	show() {
		this.returnFocus = document.activeElement;
		this.modal.show();
	}

	hide() {
		this.modal.hide();
	}
}
