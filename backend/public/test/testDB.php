<?php
include_once "../../private/api/db.php";
include_once __DIR__ . "/../../private/config/secret.php";

function testDB () {
	global $gDB;

	// echo $gDB->getEvents ("2024-09-01");
	// echo $gDB->getEvent (351);
	// echo $gDB->getRoles (200);
	// echo $gDB->getHymns (200);
	// echo $gDB->getGCalEvtId (351);

	// $roles = [];
	// $roles[] = ['role' => 'cantor', 'person' => 'carol'];
	// $roles[] = ['role' => 'conductor', 'person' => 'jac'];
	// $gDB->insertRoles (998, $roles);

	// $hymns = [];
	// $hymns[] = ['hymntype' => 'Entrance', 'hymn' => 'hymn1'];
	// $hymns[] = ['hymntype' => 'POG', 'hymn' => 'hymn2'];
	// $gDB->insertHymns (998, $hymns);

	// $data = [];
	// $data['action'] = 'db_insert';
	// $data['title'] = 'Test Event';
	// $data['timestamp'] = '2026-09-01T09:15';
	// $data['note'] = "Wear red top...";
	// $data['roles'] = [];
	// $data['roles'][] = ['role' => 'cantor', 'person' => 'carol'];
	// $data['roles'][] = ['role' => 'conductor', 'person' => 'jac'];
	// $data['hymns'] = [];
	// $data['hymns'][] = ['hymntype' => 'Entrance', 'hymn' => 'Let Us Go To The Altar [BB315; bb306]'];
	// $data['hymns'][] = ['hymntype' => 'Psalm', 'hymn' => 'Psalm test'];
	// $data['updated'] = '2026-08-16T17:00';
	// $gDB->insert ($data);

	// $data = [];
	// $data['action'] = 'db_update';
	// $data['id'] = 356;
	// $data['title'] = 'Test Event';
	// $data['timestamp'] = '2026-09-01T10:30';
	// $data['note'] = "Wear red top...";
	// $data['roles'] = [];
	// $data['roles'][] = ['role' => 'cantor', 'person' => 'carol'];
	// $data['roles'][] = ['role' => 'conductor', 'person' => 'jac'];
	// $data['hymns'] = [];
	// $data['hymns'][] = ['hymntype' => 'Entrance', 'hymn' => 'Let Us Go To The Altar [BB315; bb306]'];
	// $data['hymns'][] = ['hymntype' => 'POG', 'hymn' => 'POG test'];
	// $data['updated'] = '2026-08-16T17:00';
	// $gDB->update ($data);

	$data = [];
	$data['action'] = 'db_delete';
	$data['id'] = 521;
	$gDB->delete ($data);
}

testDB ();
