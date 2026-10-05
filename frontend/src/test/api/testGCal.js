import $ from 'jquery';
import gGCal from '../../api/gcal.js';


class TestGCal {
	#gcalid = "";

	upd = async () => {
		$("#gcalid").html (`GCal Event ID: ${this.#gcalid}`);
	}


	insert = async () => {
		var data = {};
		data['action'] = 'gcal_insert';         //  insert, update, delete
		data['gcalid'] = '';
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

		this.#gcalid = await gGCal.insert (data);
		this.upd();
	}


	update = async () => {
		var data = {};
		data['action'] = 'gcal_update';         //  insert, update, delete
		data['gcalid'] = this.#gcalid;
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

		this.#gcalid = await gGCal.update (data);
		this.upd ();
	}


	delete = async () => {
		var data = {};
		data['action'] = 'gcal_delete';         //  insert, update, delete
		data['gcalid'] = this.#gcalid;

		var resp = await gGCal.delete (data);
		console.log (resp);
	}


	run = async () => {
		$('main').append (`<p id="gcalid">GCal Event ID: </p>`);
		$('main').append (`<button type="button" id="insert" class="btn btn-primary">insert</button>`);
		$('main').append (`<button type="button" id="update" class="btn btn-primary">update</button>`);
		$('main').append (`<button type="button" id="delete" class="btn btn-primary">delete</button>`);

		$('#insert').on ('click', () => this.insert ());
		$('#update').on ('click', () => this.update ());
		$('#delete').on ('click', () => this.delete ());
	}
}

const gTestGCal = new TestGCal ();
export default gTestGCal;
