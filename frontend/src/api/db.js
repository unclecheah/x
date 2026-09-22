class Db {
	getEvents = async (date) => {
		/*
			d = 'yyyy-mm-dd hh:mm:ss'

			returns [{
				id:         356,
				gcalid:     "q1c...",
				title:      "Event 123",
				note:       "some note...",
				timestamp:  "2026-01-01 10:30:00",
				updated:    "2026-08-16:17:08:00"},
			}, ...]
		*/
		var url = `/api/unclecheah.php?db_events&date=${date}`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.json ();
		return data;
	}

	getEvent = async (eventid) => {
		/*
			eventid = 356

			returns [{
				id:         356,
				gcalid:     "q1c...",
				title:      "Event 123",
				note:       "some note...",
				timestamp:  "2026-01-01 10:30:00",
				updated:    "2026-08-16:17:08:00"},
			}, ...]
		*/
		var url = `/api/unclecheah.php?db_event&eventid=${eventid}`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.json ();
		return data;
	}

	getRoles = async (eventid) => {
		/*
			eventID = 345

			return [{
				eventid:	345,
				id:			1,
				role:		"Conductor",
				person:		"Jac"
			}, ...]
		*/
		var url = `/api/unclecheah.php?db_roles&eventid=${eventid}`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.json ();
		return data;
	}

	getHymns = async (eventid) => {
		/*
			eventID = 523

			returns [{
				eventid:	345,
				id:			1,
				hymntype:	"Entrance",
				book:		"Heart",
				hymn:		"Some Name [C21]"
			}, ...]
		*/
		var url = `/api/unclecheah.php?db_hymns&eventid=${eventid}`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.json ();
		return data;
	}

	getGCalEvtId = async (eventid) => {
		/*
			eventID = 523

			returns "q7..."
		*/
		var url = `/api/unclecheah.php?db_gcalid&eventid=${eventid}`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.text ();
		return data;
	}

	getLitClr = async (event) => {
		/*
			eventID = "3rd Sunday of Advent"

			returns "fuchsia"
		*/
		var url = `/api/unclecheah.php?db_litClr&event=${event}`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.text ();
		return data;
	}

	insert = async (data) => {
		/*
			input data = {
				action:		'db_insert',

				title:		'yr C 28th Sunday in...',
				timestamp:	'2025-10-12T10:00',
				note:		'Wear red top...',
				roles: [
					{role: 'Cantor', person: 'Carol'}
				],
				hymns: [
					{hymntype: 'Entrance', book: 'BB', hymn: 'Let Us Go To The Altar [BB315; bb306]'},
					{hymntype: 'Psalm', book: 'Psalms', hymn: 'Psalm Yr C ...'},
					...
				],
				updated:	'2025-10-12T10:00'
			}

			returns {
				id:			523,
				gcalevtid:	"q7..."
			}
		*/
		var url = '/api/unclecheah.php';
		var opt = {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch(url, opt);
		var output = await resp.json();
		return output;
	}

	update = async (data) => {
		/*
			input data = {
				action: 'db_update',

				id: 443,
				gcalid: 'n7...',
				title: 'yr C 28th Sunday in...',
				timestamp: '2025-10-12T10:00',
				note: 'Wear red top...',
				roles: [
					{role: 'Cantor', person: 'Carol'}
				],
				hymns: [
					{hymntype: 'Entrance', book: 'BB', hymn: 'Let Us Go To The Altar [BB315; bb306]'},
					{hymntype: 'Psalm', book: 'Psalms', hymn: 'Psalm Yr C ...'},
					...
				],
				updated: '2025-10-12T10:00'
			}

			returns {
				id:			523,
				gcalevtid:	"q7..."
			}
		*/
		var url = '/api/unclecheah.php';
		var opt = {
			method: 'PATCH',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch (url, opt);
		var output = await resp.text();
		return output;
	}

	delete = async (data) => {
		/*
			input data = {
				action: 'db_delete',
				id: 443,
			}

			returns {id: 443}
		*/
		var url = '/api/unclecheah.php';
		var opt = {
			method: 'DELETE',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch (url, opt);
		var output = await resp.text();
		return output;
	}
}

const gDb = new Db ();
export default gDb;
