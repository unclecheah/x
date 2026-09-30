import $ from 'jquery';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import '../../styles/theme.scss';
import '../../styles/shared-ui.scss';

import AuthModal from '../../components/auth/AuthModal.js';
import FloatingField from '../../components/ui/FloatingField.js';
import LoginView from '../../components/auth/LoginView.js';
import ForgotPasswordView from '../../components/auth/ForgotPasswordView.js';
import SignupView from '../../components/auth/SignupView.js';
import ChangePasswordView from '../../components/auth/ChangePasswordView.js';


$(async () => {
	const authModal = new AuthModal({ churchName: 'Church community' });

	const loginView = new LoginView({
		defaultUsername: '',
		showRememberMe: true,
		showForgotPassword: true,
		showSignup: true
	});

	const forgotPasswordView = new ForgotPasswordView();
	const signupView = new SignupView();
	const changePasswordView = new ChangePasswordView();

	// Login → recovery
	loginView.$element.on('auth:forgot-password', async () => {
		if (authModal.isSwitching) return;

		forgotPasswordView.clearFeedback();
		await authModal.showView(forgotPasswordView, { direction: 'forward' });
	});

	// Recovery → login
	forgotPasswordView.$element.on('auth:login', async () => {
		if (authModal.isSwitching) return;

		loginView.clearError();
		await authModal.showView(loginView, { direction: 'back' });
	});

	// Temporary login response
	loginView.$element.on('auth:submit', (event, values) => {
		loginView.showError('Test response: unable to sign in.');
	});

	// Temporary recovery response
	forgotPasswordView.$element.on('auth:recover', (event, values) => {
		forgotPasswordView.showSuccess('Demo: recovery request accepted. No email was sent.');
	});

	// Login → sign up
	loginView.$element.on('auth:sign-up', async () => {
		if (authModal.isSwitching) return;
		signupView.clearFeedback();

		await authModal.showView(signupView, { direction: 'forward' });
	});

	// Sign up → login
	signupView.$element.on('auth:login', async () => {
		if (authModal.isSwitching) return;
		loginView.clearError();

		await authModal.showView(loginView, { direction: 'back' });
	});

	// Temporary registration response
	signupView.$element.on('auth:register', (event, values) => {
		signupView.showSuccess('Demo: details accepted. No account was created.');
	});


	// Temporary password-change response.
	changePasswordView.$element.on('auth:change-password', (event, values) => {
		changePasswordView.showSuccess('Demo: details accepted. No password was changed.');
	});

	// For this test, Back returns to login.
	changePasswordView.$element.on('auth:back', async () => {
		if (authModal.isSwitching) return;
		loginView.clearError();

		const changed = await authModal.showView(loginView, { direction: 'back' });
		if (changed) changePasswordView.reset();
	});


	// Prepare the initial view before opening the modal.
	await authModal.showView(loginView, { animate: false });

	const $openButton = $('<button>', { type: 'button', class: 'ui-link m-3', text: 'Open account window' });
	$openButton.on('click', () => { authModal.show(); });
	$openButton.appendTo(document.body);
	$openButton.trigger('click');


	const $changePasswordButton = $('<button>', { type: 'button', class: 'ui-link m-3', text: 'Preview change password' });
	$changePasswordButton.on('click', async () => {
		if (authModal.isSwitching) return;
		changePasswordView.reset();

		await authModal.showView(changePasswordView, { animate: false });
		authModal.show();
	});

	$changePasswordButton.appendTo(document.body);
});
