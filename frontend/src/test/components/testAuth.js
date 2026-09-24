import $ from 'jquery';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import '../../styles/theme.scss';
import '../../styles/shared-ui.scss';

import AuthModal from '../../components/auth/AuthModal.js';

$(() => {
	const authModal = new AuthModal({ churchName: 'Church community' });
	const $placeholder = $('<section>');

	$('<h1>', { class: 'ui-title', text: 'Welcome back' }).appendTo($placeholder);
	$('<p>', { class: 'ui-copy', text: 'Sign in to your church community.' }).appendTo($placeholder);

	authModal.setContent($placeholder);

	const $openButton = $('<button>', { type: 'button', class: 'ui-link m-3', text: 'Open account window' });

	$openButton.on('click', () => { authModal.show(); });
	$openButton.appendTo(document.body);
	$openButton.trigger('click');
});
