class Session {
	start = async (data) => {
		//  returns 1 if success, 0 if fail

		var url = '/api/unclecheah.php';
		var opt = {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch (url, opt);
		var output = await resp.json ();
		return output;
	}

	destroy = async () => {
		const response = await fetch('/api/unclecheah.php', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			cache: 'no-store',
			body: JSON.stringify({ action: 'session_destroy' })
		});

		if (!response.ok) throw new Error(`Sign-out request failed (HTTP ${response.status}).`);

		const result = await response.json();
		if (result !== true) throw new Error('The server did not confirm sign-out.');

		return true;
	}

	isactive = async () => {
		//  returns whether a session is active

		var url = `/api/unclecheah.php?session_isactive`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.json ();
		return data;
	}

	sessid = async () => {
		//  returns session id

		var url = `/api/unclecheah.php?session_sessid`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.json ();
		return data;
	}

	setvar = async (data) => {
		//  returns 1 if success, 0 if fail

		var url = '/api/unclecheah.php';
		var opt = {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch (url, opt);
		var output = await resp.text ();
		console.log (output);
		return output;
	}

	getvar = async (key) => {
		var url = `/api/unclecheah.php?session_getvar&key=${key}`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.json ();
		console.log (data);
		return data;
	}
}


const gSession = new Session ();
export default gSession;
