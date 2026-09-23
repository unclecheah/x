import $ from 'jquery';
import './background.scss';

export default class Background {
	constructor({images = [], directory = `${import.meta.env.BASE_URL}images/background/`} = {}) {
		if (!images.length) throw new Error('Background requires at least one image.');

		this.images = [...images];
		this.directory = directory.endsWith('/') ? directory : `${directory}/`;

		this.$element = $('<div>', { class: 'random-background', 'aria-hidden': 'true' });

		$('body').addClass('has-random-background').prepend(this.$element);

		this.showRandom();
	}

	showRandom() {
		const index = Math.floor(Math.random() * this.images.length);
		const filename = this.images[index];
		const url = `${this.directory}${encodeURIComponent(filename)}`;

		this.$element.css('background-image', `url(${JSON.stringify(url)})`);

		return filename;
	}

	destroy() {
		this.$element.remove();

		if (!$('.random-background').length) {
			$('body').removeClass('has-random-background');
		}
	}
}
