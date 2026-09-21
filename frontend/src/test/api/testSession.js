import $ from 'jquery';
import gSession from '../../api/session.js';

class TestSession {
	#sessActive = false;
	#sessID = '';
	#username = '';
	#keyvalue = '';

	upd = async () => {
		$("#sessActive").html (`active: ${this.#sessActive}`);
		$("#sessID").html (`id: ${this.#sessID}`);
		$("#username").html (`username: ${this.#username}`);
		$("#keyvalue").html (`keyvalue: ${this.#keyvalue}`);
	}

	isActive = async () => {
		this.#sessActive = await gSession.isactive ();
		this.upd ();
	}

	sessStart = async () => {
		var data = {};
		data['action'] = 'session_start';         //  insert, update, delete
		data['username'] = 'unclecheah';

		var output = await gSession.start (data);
		console.log (output);
	}

	sessDestroy = async () => {
		var success = await gSession.destroy ();
		this.upd ();
		console.log (success);
	}

	sessID = async () => {
		this.#sessID = await gSession.sessid ();
		this.#username = await gSession.getvar ('username');
		this.upd ();
		console.log (this.#sessID);
	}

	setVar = async () => {
		var data = {};
		data['action'] = 'session_setvar';
		data['key'] = 'key1';
		data['value'] = 'value123';

		await gSession.setvar (data);
	}

	getVar = async () => {
		this.#keyvalue = await gSession.getvar ('key1');
		this.upd ();
		console.log (this.#sessID);
	}

	run = async () => {
		$('main').append (`<p id="sessActive">active: ${this.#sessActive}</p>`);
		$('main').append (`<p id="sessID">id: ${this.#sessID}</p>`);
		$('main').append (`<p id="username">username: ${this.#username}</p>`);
		$('main').append (`<p id="keyvalue">keyvalue: ${this.#keyvalue}</p>`);
		// $('#sessID').html ('id: blah');
		$('main').append (`<button type="button" id="active" class="btn btn-primary">active?</button>`);
		$('main').append (`<button type="button" id="start" class="btn btn-primary">start</button>`);
		$('main').append (`<button type="button" id="destroy" class="btn btn-primary">destroy</button>`);
		$('main').append (`<button type="button" id="sessid" class="btn btn-primary">sessid</button>`);
		$('main').append (`<button type="button" id="setvar" class="btn btn-primary">setvar</button>`);
		$('main').append (`<button type="button" id="getvar" class="btn btn-primary">getvar</button>`);

		$('#active').on ('click', () => this.isActive ());
		$('#start').on ('click', () => this.sessStart ());
		$('#destroy').on ('click', () => this.sessDestroy ());
		$('#sessid').on ('click', () => this.sessID ());
		$('#setvar').on ('click', () => this.setVar ());
		$('#getvar').on ('click', () => this.getVar ());
	}
}

const gTestSession = new TestSession ();
export default gTestSession;
