import $ from 'jquery';
import { Modal } from 'bootstrap';

import './ConfirmDialog.scss';

export default class ConfirmDialog {
	static nextId = 0;

	constructor() {
		const id = `confirm-dialog-${++ConfirmDialog.nextId}`;

		this.busy = false;

		this.$element = $(`
			<div
				class="modal confirm-dialog"
				tabindex="-1"
				aria-labelledby="${id}-title"
				aria-describedby="${id}-message"
				aria-hidden="true"
			>
				<div class="modal-dialog modal-dialog-centered">
					<div class="modal-content">
						<div class="modal-header">
							<h2
								id="${id}-title"
								class="modal-title ui-title"
							></h2>
						</div>

						<div class="modal-body">
							<p
								id="${id}-message"
								class="confirm-dialog__message"
							></p>

							<p
								class="ui-feedback confirm-dialog__feedback"
								role="alert"
							></p>
						</div>

						<div class="modal-footer">
							<button
								type="button"
								class="btn ui-button ui-focus confirm-dialog__no"
							>
								No
							</button>

							<button
								type="button"
								class="btn ui-button ui-focus confirm-dialog__yes"
							>
								Yes, delete
							</button>
						</div>
					</div>
				</div>
			</div>
		`);

		this.$title = this.$element.find('.modal-title');
		this.$message = this.$element.find('.confirm-dialog__message');
		this.$feedback = this.$element.find('.confirm-dialog__feedback');
		this.$no = this.$element.find('.confirm-dialog__no');
		this.$yes = this.$element.find('.confirm-dialog__yes');
		this.$element.appendTo(document.body);

		this.modal = new Modal(this.$element[0], { backdrop: 'static', keyboard: true });

		this.$no.on('click.confirmDialog', () => { this.hide(); });
		this.$yes.on('click.confirmDialog', () => {
			if (this.busy) return;
			this.$element.trigger('confirm:yes');
		});

		this.$element[0].addEventListener('shown.bs.modal', () => { this.$no[0].focus(); });
		this.$element[0].addEventListener('hide.bs.modal', (event) => { if (this.busy) event.preventDefault(); });
		this.$element[0].addEventListener('hidden.bs.modal', () => {
			if (this.returnFocus?.isConnected) this.returnFocus.focus();
			this.$element.trigger('confirm:closed');
		});
	}

	show({ title, message }) {
		this.returnFocus = document.activeElement;

		this.setBusy(false);
		this.$title.text(title);
		this.$message.text(message);
		this.$feedback.text('');

		this.modal.show();
	}

	hide() {
		this.modal.hide();
	}

	setBusy(busy) {
		this.busy = busy === true;

		this.$no.prop('disabled', this.busy);
		this.$yes.prop('disabled', this.busy).text(this.busy ? 'Deleting…' : 'Yes, delete');
	}

	showError(message) {
		this.$feedback.text(message);
	}
}
