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



// import gFooter from './components/footer/footer.js';
// gFooter.mount ();

// import gCubeOverlay from './components/cubeOverlay/cubeOverlay.js'
// gCubeOverlay.start ();
// gCubeOverlay.stop ();



import Background from './components/background/background.js'
var images = await gFiles.getBgImages ();
new Background ({images, directory: 'http://localhost:8081/images/background/'});


import "./test/components/testAuth.js";
// $('html').attr ('data-colour', 'plum');


// import ColourTheme from './ui/ColourTheme.js';
// ColourTheme.restore ();
// ColourTheme.set ('blue', { remember: true });
