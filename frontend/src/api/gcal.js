class GCal {
	insert = async (data) => {
		//  returns new gcal id (text)
		var url = '/api/unclecheah.php';
		var opt = {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch (url, opt);
		var output = await resp.json ();
		return output['id'];
	}


	update = async (data) => {
		//  returns updated gcal id (text)
		var url = '/api/unclecheah.php';
		var opt = {
			method: 'PATCH',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch (url, opt);
		var output = await resp.json();
		return output['id'];
	}


	delete = async (data) => {
		//  returns deleted gcal id (text)
		var url = '/api/unclecheah.php';
		var opt = {
			method: 'PATCH',
			headers: {'Content-Type': 'application/json'},
			credentials: 'include',
			body: JSON.stringify (data)
		};

		var resp = await fetch (url, opt);
		var output = await resp.json();
		return output['id'];
	}
}


const gGCal = new GCal ();
export default gGCal;
