<?php
include_once "../../private/api/auth.php";

function testAuth () {
	global $gAuth;

	// echo $gAuth->chkDupUsername ('andrew');
	echo $gAuth->chkDupEmail ('cheah@ieee.org');
}

testAuth ();
