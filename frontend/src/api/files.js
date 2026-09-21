class Files {
	hymn2bk = async (data) => {
		var url = `/api/unclecheah.php?files_hymn2bk&data=${data}`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.text ();
		return data;
	}

	scoreExist = async (data) => {
		var url = `/api/unclecheah.php?files_scoreExist&data=${data}`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.text ();
		return data;
	}

	recordingExist = async (data) => {
		var url = `/api/unclecheah.php?files_recordingExist&data=${data}`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.text ();
		return data;
	}

	linkExist = async (data) => {
		var url = `/api/unclecheah.php?files_linkExist&data=${data}`;

		const resp = await fetch (url, {credentials: 'include'});
		var data = await resp.text ();
		return data;
	}

	getDetails = async (data) => {
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

	getAllHymns = async (data) => {
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

	combine = async (data) => {
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

	getCombined = async (data) => {
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

const gFiles = new Files ();
export default gFiles;
