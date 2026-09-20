<?php
include_once "../../private/api/gcal.php";

function insert () {
	global $gGCal;

	$data = [];
	$data['action'] = 'gcal_insert';    // insert, update, delete
	$data['gcalevtid'] = '';
	$data['title'] = 'Test Event';
	$data['timestamp'] = '2026-09-01T09:15';
	$data['note'] = '';

	$data['roles'] = [];
	$data['roles'][] = [
		'role' => 'cantor',
		'person' => 'carol',
	];
	$data['roles'][] = [
		'role' => 'conductor',
		'person' => 'jac',
	];

	$data['hymns'] = [];
	$data['hymns'][] = [
		'hymntype' => 'Entrance',
		'book' => 'BB',
		'hymn' => 'Let Us Go To The Altar [BB315; bb306]',
	];
	$data['hymns'][] = [
		'hymntype' => 'Psalm',
		'book' => 'Psalms',
		'hymn' => 'Psalm test',
	];

	$data['updated'] = '2026-08-16T17:00';

	$result = $gGCal->insert ($data);
	$json = json_decode($result);
	echo $json->id;
}

function update ($gcalevtid) {
	global $gGCal;

	$data = [];
	$data['action'] = 'gcal_update';    // insert, update, delete
	$data['gcalevtid'] = $gcalevtid;
	$data['title'] = 'Test Event';
	$data['timestamp'] = '2026-09-01T10:30';
	$data['note'] = '';

	$data['roles'] = [];
	$data['roles'][] = [
		'role' => 'cantor',
		'person' => 'carol',
	];
	$data['roles'][] = [
		'role' => 'conductor',
		'person' => 'jac',
	];

	$data['hymns'] = [];
	$data['hymns'][] = [
		'hymntype' => 'Entrance',
		'book' => 'BB',
		'hymn' => 'Let Us Go To The Altar [BB315; bb306]',
	];
	$data['hymns'][] = [
		'hymntype' => 'Psalm',
		'book' => 'Psalms',
		'hymn' => 'Psalm test',
	];

	$data['updated'] = '2026-08-16T17:00';

	$result = $gGCal->update ($data);
	$json = json_decode($result);
	echo $json->id;
}

function delete ($id) {
	global $gGCal;

	$data = [];
	$data['action'] = 'gcal_delete';    // insert, update, delete
	$data['gcalevtid'] = $id;

	$result = $gGCal->delete ($data);
	$json = json_decode($result);
	echo $json->id;
}

function testGCal ($mode, $id) {
	if ($mode == "insert") insert ();
	else if ($mode == "update") update ($id);
	else if ($mode == "delete") delete ($id);
}

if ($argc < 2) {
	echo "Need parameters\n";
	return;
} else if ($argc == 2) {
	testGCal ($argv[1], "");
} else {
	testGCal ($argv[1], $argv[2]);
}
