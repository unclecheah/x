class Auth {
	getStatus = async (username) => {
		var url = `/api/unclecheah.php?auth_getStatus&username=${username}`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.text ();
		return data;
	}

	getRole = async (username) => {
		var url = `/api/unclecheah.php?auth_getRole&username=${username}`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.text ();
		return data;
	}

	getDispName = async (username) => {
		var url = `/api/unclecheah.php?auth_getDispName&username=${username}`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.text ();
		return data;
	}

	changeStatus = async (data) => {
		var url = '/api/unclecheah.php';
		var opt = {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch (url, opt);
		await resp.text ();
	}

	changeRole = async (data) => {
		var url = '/api/unclecheah.php';
		var opt = {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch (url, opt);
		await resp.text ();
	}

	changeDispName = async (data) => {
		var url = '/api/unclecheah.php';
		var opt = {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch (url, opt);
		await resp.text ();
	}

	changePassword = async (data) => {
		var url = '/api/unclecheah.php';
		var opt = {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch (url, opt);
		await resp.text ();
	}

	authenticate = async (data) => {
		var url = '/api/unclecheah.php';
		var opt = {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch (url, opt);
		var output = await resp.text ();
		return output;
	}

	add = async (data) => {
		var url = '/api/unclecheah.php';
		var opt = {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch (url, opt);
		var output = await resp.text ();
		return output;
	}

	delete = async (data) => {
		var url = '/api/unclecheah.php';
		var opt = {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch (url, opt);
		var output = await resp.text ();
		return output;
	}
}

const gAuth = new Auth ();
export default gAuth;
