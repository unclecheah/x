import $ from 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './main.scss';
import gFooter from './components/footer/footer.js';
import Background from './components/background/background.js'

var images = await gFiles.getBgImages ();
new Background ({images, directory: '/data/images/background/'});

// import ColourTheme from './ui/ColourTheme.js';
// ColourTheme.restore ();
// ColourTheme.set ('blue', { remember: true });


import './styles/theme.scss';
import './styles/shared-ui.scss';
import gCubeOverlay from './components/cubeOverlay/cubeOverlay.js';
import gAuth from './api/auth.js';
import gSession from './api/session.js';
import gDb from './api/db.js';
import gFiles from './api/files.js';
import AuthComponent from './components/auth';
import MainScreen from './components/main/MainScreen';
import AppController from './app/AppController';
import EventAccordion from './components/events/EventAccordion';
import EventForm from './components/events/EventForm';
import ConfirmDialog from './components/confirmDialog/ConfirmDialog.js';

// import gTestFiles from './test/api/testFiles.js';
// gTestFiles.run ();


$(async () => {
	const auth = new AuthComponent({
		churchName: 'Christus Dominus',

		defaultUsername: '',
		showRememberMe: false,
		showForgotPassword: false,
		showSignup: false
	});

	const mainScreen = new MainScreen();


	const authModalElement = document.querySelector('.auth-modal');
	authModalElement.addEventListener('hide.bs.modal', (event) => {
		if (event.defaultPrevented) return;
		const focusedElement = document.activeElement;
		if (focusedElement instanceof HTMLElement && authModalElement.contains(focusedElement)) focusedElement.blur();
	});

	authModalElement.addEventListener('hidden.bs.modal', () => {
		const dateInput = mainScreen.$date[0];

		// Focus the main page only if it is mounted and visible.
		if (dateInput?.isConnected && !dateInput.disabled && dateInput.getClientRects().length > 0)
			dateInput.focus({ preventScroll: true });
	});

	const eventAccordion = new EventAccordion();
	eventAccordion.mount(mainScreen.$events);
	const eventForm = new EventForm();
	const combineForm = new EventForm({ purpose: 'combine' });
	const confirmDialog = new ConfirmDialog ();

	const app = new AppController({
		auth,
		mainScreen,
		eventAccordion,
		eventForm,
		combineForm,
		confirmDialog,
		footer: gFooter,

		services: {
			auth: gAuth,
			session: gSession,
			db: gDb,
			files: gFiles,
			overlay: gCubeOverlay
		},

		target: '#app'
	});

	await app.start();
});

