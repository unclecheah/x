import $ from 'jquery';
import gDB from '../../api/db.js';


class TestDB {
	#eventid = '';

	upd = async () => {
		$("#eventid").html (`eventid: ${this.#eventid}`);
	}

	getEvents = async () => {
		const events = await gDB.getEvents ('2026-01-01');
		console.log (events);
	}

	getEvent = async () => {
		const event = await gDB.getEvent (520);
		console.log (event);
	}

	getRoles = async () => {
		const roles = await gDB.getRoles (520);
		console.log (roles);
	}

	getHymns = async () => {
		const hymns = await gDB.getHymns (520);
		console.log (hymns);
	}

	getGCalId = async () => {
		const gcalid = await gDB.getGCalEvtId (520);
		console.log (gcalid);
	}

	insert = async () => {
		var data = {};
		data['action'] = 'db_insert';         //  insert, update, delete
		data['gcalevtid'] = '';
		data['title'] = 'Test Event';
		data['timestamp'] = '2026-09-01T09:15';
		data['note'] = '';
		data['roles'] = [];
		data['roles'].push ({role: 'cantor', person: 'carol'});
		data['roles'].push({ role: 'conductor', person: 'jac' });
		data['hymns'] = [];
		data['hymns'].push({hymntype: 'Entrance', book: 'BB', hymn: 'Let Us Go To The Altar [BB315; bb306]'});
		data['hymns'].push({ hymntype: 'Psalm', book: 'Psalms', hymn: 'Psalm test' });
		data['updated'] = '2026-08-16T17:00';

		var res = await gDB.insert (data);
		this.#eventid = res.id;
		this.upd ();
	}

	update = async () => {
		var data = {};
		data['action'] = 'db_update';         //  insert, update, delete
		data['id'] = $("#eventid").text().replace('eventid: ', '');
		data['title'] = 'Test Event';
		data['timestamp'] = '2026-09-01T10:30';
		data['note'] = '';
		data['roles'] = [];
		data['roles'].push ({role: 'cantor', person: 'carol'});
		data['roles'].push({ role: 'conductor', person: 'jac' });
		data['hymns'] = [];
		data['hymns'].push({hymntype: 'Entrance', book: 'BB', hymn: 'Let Us Go To The Altar [BB315; bb306]'});
		data['hymns'].push({ hymntype: 'Psalm', book: 'Psalms', hymn: 'Psalm test' });
		data['updated'] = '2026-08-16T17:00';

		var res = await gDB.update (data);
	}

	delete = async () => {
		var data = {};
		data['action'] = 'db_delete';         //  insert, update, delete
		data['id'] = $("#eventid").text().replace('eventid: ', '');

		var res = await gDB.delete (data);
		console.log (res);
	}


	run = async () => {
		$('main').append (`<p id="eventid">eventid: </p>`);
		$('main').append (`<button type="button" id="getEvents" class="btn btn-primary">getEvents</button>`);
		$('main').append (`<button type="button" id="getEvent" class="btn btn-primary">getEvent</button>`);
		$('main').append (`<button type="button" id="getRoles" class="btn btn-primary">getRoles</button>`);
		$('main').append (`<button type="button" id="getHymns" class="btn btn-primary">getHymns</button>`);
		$('main').append (`<button type="button" id="getGCalId" class="btn btn-primary">getGCalId</button>`);
		$('main').append (`<button type="button" id="insert" class="btn btn-primary">insert</button>`);
		$('main').append (`<button type="button" id="update" class="btn btn-primary">update</button>`);
		$('main').append (`<button type="button" id="delete" class="btn btn-primary">delete</button>`);

		$('#getEvents').on ('click', () => this.getEvents ());
		$('#getEvent').on ('click', () => this.getEvent ());
		$('#getRoles').on ('click', () => this.getRoles ());
		$('#getHymns').on ('click', () => this.getHymns ());
		$('#getGCalId').on ('click', () => this.getGCalId ());
		$('#insert').on ('click', () => this.insert ());
		$('#update').on ('click', () => this.update ());
		$('#delete').on ('click', () => this.delete ());
	}
}

const gTestDB = new TestDB ();
export default gTestDB;
