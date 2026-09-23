import $ from 'jquery';
import gAuth from '../../api/auth.js';


class TestAuth {
	#username = '';
	#dispName = '';
	#status = '';
	#role = '';
	#msg = '';

	upd = async () => {
		$("#username").html (`username: ${this.#username}`);
		$("#dispName").html (`dispName: ${this.#dispName}`);
		$("#status").html (`status: ${this.#status}`);
		$("#role").html (`role: ${this.#role}`);
		$("#msg").html (`msg: ${this.#msg}`);
	}

	add = async () => {
		var data = {};
		data['action'] = 'auth_add';
		data['username'] = 'carol';
		data['display_name'] = 'Carol';
		data['email'] = 'carol@carol.com';
		data['password'] = 'carol';
		data['status'] = 'pending';
		data['role'] = 'member';

		this.#msg = await gAuth.add (data);
		this.#username = data['username'];
		this.upd ();
	}

	delete = async () => {
		var data = {};
		data['action'] = 'auth_delete';
		data['username'] = 'carol';

		this.#msg = await gAuth.delete (data);
		this.#username = data['username'];
		this.upd ();
	}

	getStatus = async () => {
		this.#username = 'carol';
		this.#status = await gAuth.getStatus ('carol');
		this.upd ();
	}

	getRole = async () => {
		this.#username = 'carol';
		this.#role = await gAuth.getRole ('carol');
		this.upd ();
	}

	getDispName = async () => {
		this.#username = 'carol';
		this.#dispName = await gAuth.getDispName ('carol');
		this.upd ();
	}

	changeStatus = async () => {
		var data = {};
		data['action'] = 'auth_changeStatus';
		data['username'] = 'carol';
		data['status'] = 'pending';

		await gAuth.changeStatus (data);
		this.#username = data['username'];
		this.upd ();
	}

	changeRole = async () => {
		var data = {};
		data['action'] = 'auth_changeRole';
		data['username'] = 'carol';
		data['role'] = 'admin';

		await gAuth.changeRole (data);
		this.#username = data['username'];
		this.upd ();
	}

	changeDispName = async () => {
		var data = {};
		data['action'] = 'auth_changeDispName';
		data['username'] = 'carol';
		data['dispName'] = 'Carol Quek';

		await gAuth.changeDispName (data);
		this.#username = data['username'];
		this.upd ();
	}

	changePassword = async () => {
		var data = {};
		data['action'] = 'auth_changePassword';
		data['username'] = 'carol';
		data['password'] = 'quek';

		await gAuth.changePassword (data);
		this.#username = data['username'];
		this.upd ();
	}

	authenticate = async () => {
		var data = {};
		data['action'] = 'auth_authenticate';
		data['username'] = 'carol';
		data['password'] = 'carol';

		var result = await gAuth.authenticate (data);
		console.log (result);
		this.#username = data['username'];
		this.upd ();
	}



	run = async () => {
		$('main').append (`<p id="username">username: </p>`);
		$('main').append (`<p id="dispName">dispName: </p>`);
		$('main').append (`<p id="status">status: </p>`);
		$('main').append (`<p id="role">role: </p>`);
		$('main').append (`<p id="msg">msg: </p>`);
		$('main').append (`<button type="button" id="add" class="btn btn-primary">add</button>`);
		$('main').append (`<button type="button" id="delete" class="btn btn-primary">delete</button>`);
		$('main').append (`<button type="button" id="getStatus" class="btn btn-primary">getStatus</button>`);
		$('main').append (`<button type="button" id="chgStatus" class="btn btn-primary">chgStatus</button>`);
		$('main').append (`<button type="button" id="getRole" class="btn btn-primary">getRole</button>`);
		$('main').append (`<button type="button" id="chgRole" class="btn btn-primary">chgRole</button>`);
		$('main').append (`<button type="button" id="getDispName" class="btn btn-primary">getDispName</button>`);
		$('main').append (`<button type="button" id="chgDispName" class="btn btn-primary">chgDispName</button>`);
		$('main').append (`<button type="button" id="chgPassword" class="btn btn-primary">chgPassword</button>`);
		$('main').append (`<button type="button" id="authenticate" class="btn btn-primary">authenticate</button>`);

		$('#add').on ('click', () => this.add ());
		$('#delete').on ('click', () => this.delete ());
		$('#getStatus').on ('click', () => this.getStatus ());
		$('#chgStatus').on ('click', () => this.changeStatus ());
		$('#getRole').on ('click', () => this.getRole ());
		$('#chgRole').on ('click', () => this.changeRole ());
		$('#getDispName').on ('click', () => this.getDispName ());
		$('#chgDispName').on ('click', () => this.changeDispName ());
		$('#chgPassword').on ('click', () => this.changePassword ());
		$('#authenticate').on ('click', () => this.authenticate ());
	}
}

const gTestAuth = new TestAuth ();
export default gTestAuth;
