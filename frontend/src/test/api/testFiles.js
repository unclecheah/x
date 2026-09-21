import $ from 'jquery';
import gFiles from '../../api/files.js';


class TestFiles {
	#bk = '';
	#score = '';
	#recording = '';
	#link = '';
	#combined = '';

	upd = async () => {
		$("#bk").html (`bk: ${this.#bk}`);
		$("#score").html (`score: ${this.#score}`);
		$("#recording").html (`recording: ${this.#recording}`);
		$("#link").html (`link: ${this.#link}`);
		$("#combined").html (`combined: ${this.#combined}`);
	}

	hymn2bk = async () => {
		this.#bk = await gFiles.hymn2bk ("Abide With Me [BB649; bb634]");
		this.upd ();
	}

	scoreExist = async () => {
		this.#score = await gFiles.scoreExist ("Abide With Me [BB649; bb634]");
		console.log (this.#score);
		this.upd ();
	}

	recordingExist = async () => {
		this.#recording = await gFiles.recordingExist ("Everlasting Light [L7]");
		console.log (this.#recording);
		this.upd ();
	}

	linkExist = async () => {
		this.#link = await gFiles.linkExist ("To Rescue A Sinner Like Me");
		console.log (this.#link);
		this.upd ();
	}

	getDetails = async () => {
		var data = {};
		data['action'] = 'files_getDetails';         //  insert, update, delete
		data['hymns'] = ['To Rescue A Sinner Like Me', 'All The Ends Of The Earth [BB554; bb582]'];

		var output = await gFiles.getDetails (data);
		console.log (output);
	}

	getAllHymns = async () => {
		var data = {};
		data['action'] = 'files_getAllHymns';         //  insert, update, delete

		var output = await gFiles.getAllHymns (data);
		console.log (output);
	}

	combine = async () => {
		var data = {};
		data['action'] = 'files_combine';         //  insert, update, delete
		data['hymns'] = ['To Rescue A Sinner Like Me', 'All The Ends Of The Earth [BB554; bb582]'];
		data['evtid'] = '987';

		var output = await gFiles.combine (data);
		console.log (output);
	}

	getCombined = async () => {
		var data = {};
		data['action'] = 'files_getCombined';         //  insert, update, delete
		data['evtid'] = '987';

		this.#combined = await gFiles.getCombined (data);
		this.upd ();
	}

	// insert = async () => {
	// 	var data = {};
	// 	data['action'] = 'gcal_insert';         //  insert, update, delete
	// 	data['gcalevtid'] = '';
	// 	data['title'] = 'Test Event';
	// 	data['timestamp'] = '2026-09-01T09:15';
	// 	data['note'] = '';
	// 	data['roles'] = [];
	// 	data['roles'].push ({role: 'cantor', person: 'carol'});
	// 	data['roles'].push({ role: 'conductor', person: 'jac' });
	// 	data['hymns'] = [];
	// 	data['hymns'].push({hymntype: 'Entrance', book: 'BB', hymn: 'Let Us Go To The Altar [BB315; bb306]'});
	// 	data['hymns'].push({ hymntype: 'Psalm', book: 'Psalms', hymn: 'Psalm test' });
	// 	data['updated'] = '2026-08-16T17:00';

	// 	this.#gcalevtid = await gGCal.insert (data);
	// 	this.upd();
	// }





	run = async () => {
		$('main').append (`<p id="bk">bk: </p>`);
		$('main').append (`<p id="score">score: </p>`);
		$('main').append (`<p id="recording">recording: </p>`);
		$('main').append (`<p id="link">link: </p>`);
		$('main').append (`<p id="combined">combined: </p>`);
		$('main').append (`<button type="button" id="hymn2bk" class="btn btn-primary">hymn2bk</button>`);
		$('main').append (`<button type="button" id="scoreBtn" class="btn btn-primary">score?</button>`);
		$('main').append (`<button type="button" id="recordingBtn" class="btn btn-primary">recording?</button>`);
		$('main').append (`<button type="button" id="linkBtn" class="btn btn-primary">link?</button>`);
		$('main').append (`<button type="button" id="getDetails" class="btn btn-primary">details</button>`);
		$('main').append (`<button type="button" id="getAllHymns" class="btn btn-primary">All Hymns</button>`);
		$('main').append (`<button type="button" id="combine" class="btn btn-primary">combine</button>`);
		$('main').append (`<button type="button" id="getCombined" class="btn btn-primary">getCombined</button>`);

		$('#hymn2bk').on ('click', () => this.hymn2bk ());
		$('#scoreBtn').on ('click', () => this.scoreExist ());
		$('#recordingBtn').on ('click', () => this.recordingExist ());
		$('#linkBtn').on ('click', () => this.linkExist ());
		$('#getDetails').on ('click', () => this.getDetails ());
		$('#getAllHymns').on ('click', () => this.getAllHymns ());
		$('#getCombined').on ('click', () => this.getCombined ());
	}
}

const gTestFiles = new TestFiles ();
export default gTestFiles;
