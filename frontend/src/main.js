import $ from 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './main.scss';
import gFiles from './api/files.js';

// import gTestSession from './test/api/testSession.js';
// gTestSession.run ();

// import gTestGCal from './test/api/testGCal.js';
// gTestGCal.run ();

// import gTestFiles from './test/api/testFiles.js';
// gTestFiles.run ();

// import gTestDB from './test/api/testDB.js';
// gTestDB.run ();

// import gTestAuth from './test/api/testAuth.js';
// gTestAuth.run ();



import gFooter from './components/footer/footer.js';
// gFooter.mount ();

// import gCubeOverlay from './components/cubeOverlay/cubeOverlay.js'
// gCubeOverlay.start ();
// gCubeOverlay.stop ();



import Background from './components/background/background.js'
var images = await gFiles.getBgImages ();
new Background ({images, directory: 'http://localhost:8081/images/background/'});


// import "./test/components/testAuth.js";
// $('html').attr ('data-colour', 'plum');


// import ColourTheme from './ui/ColourTheme.js';
// ColourTheme.restore ();
// ColourTheme.set ('blue', { remember: true });


import './styles/theme.scss';
import './styles/shared-ui.scss';
import gCubeOverlay from './components/cubeOverlay/cubeOverlay.js';
import gAuth from './api/auth.js';
import gSession from './api/session.js';
import AuthComponent from './components/auth';
import MainScreen from './components/main/MainScreen';
import AppController from './app/AppController';
import EventAccordion from './components/events/EventAccordion';

// const mainScreen = new MainScreen({
// 	username: 'Andrew',
// 	date: '2026-09-01'
// });

// mainScreen.on('main:date-change', (event, { date }) => {
// 	console.log('[Main] Selected date:', date);
// });

// mainScreen.on('main:logout', () => {
// 	console.log('[Main] Logout requested');
// });

// mainScreen.mount('#app');
// gFooter.mount (mainScreen.$footer);


$(async () => {
	const auth = new AuthComponent({
		churchName: 'Church community',

		defaultUsername: '',
		showRememberMe: true,
		showForgotPassword: true,
		showSignup: true
	});

	const mainScreen = new MainScreen();

	mainScreen.on('main:date-change', (event, { date }) => { console.log('[Main] Selected date:', date); });

	//*******  temp
	const eventAccordion = new EventAccordion({
		events: [
			{
				title: 'Sunday Mass',
				timestamp: '06 Sep 2026 · 10:00 AM',
				colour: '#4ca76b'
			},
			{
				title: 'Choir Practice',
				timestamp: '10 Sep 2026 · 8:00 PM',
				colour: '#4ca76b'
			},
			{
				title: 'Sunday Mass',
				timestamp: '13 Sep 2026 · 10:00 AM',
				colour: '#4ca76b'
			}
		]
	});

	eventAccordion.mount(mainScreen.$events);
	//***********

	const app = new AppController({
		auth,
		mainScreen,
		footer: gFooter,

		services: {
			auth: gAuth,
			session: gSession,
			overlay: gCubeOverlay
		},

		target: '#app'
	});

	await app.start();
});
