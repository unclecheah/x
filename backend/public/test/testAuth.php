<?php
include_once "../../private/api/auth.php";

function testAuth () {
	global $gAuth;

	// echo $gAuth->chkDupUsername ('andrew');
	// echo $gAuth->chkDupEmail ('cheah@ieee.org');

	// $data = [
	// 	'username' => 'carol',
	// 	'display_name' => 'Carol',
	// 	'email' => 'carol@carol.com',
	// 	'password' => 'carol',
	// 	'status' => 'active',
	// 	'role' => 'member'
	// ];
	// echo $gAuth->add ($data);

	// $gAuth->changeStatus ("carol", "pending");
	// $gAuth->changeRole ("carol", "admin");
	// $gAuth->changeDispName ("carol", "Carol Quek");
	// $gAuth->changePassword ("carol", "quek");
	// echo $gAuth->authenticate ("carol", "quek");
	// echo $gAuth->getStatus ("carol");
	// echo $gAuth->getRole ("carol");
	echo $gAuth->getDispName ("carol");
	// echo $gAuth->delete ("carol");
}

testAuth ();
