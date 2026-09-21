<?php
include_once "../../private/api/session.php";

function testSession () {
	global $gSession;

	$messages = [];

	$messages[] = "=== start ===";
	$result = $gSession->isActive();
	$messages[] = "isactive: " . var_export($result, true);

	$messages[] = "=== start session ===";
	$result = $gSession->start("unclecheah");
	$messages[] = "start: " . var_export($result, true);

	$result = $gSession->isActive();
	$messages[] = "isactive: " . var_export($result, true);

	$id = $gSession->sessId();
	$messages[] = "sessId: $id";
	$username = $gSession->get("username");
	$messages[] = "username: " . var_export($username, true);

	$messages[] = "=== set/get session var ===";
	$gSession->set("key1", "value123");
	$key1 = $gSession->get("key1");
	$messages[] = "key1: " . var_export($key1, true);

	$messages[] = "=== destroy session ===";
	$result = $gSession->destroy();
	$messages[] = "destroy: " . var_export($result, true);

	$key1 = $gSession->get("key1");
	$messages[] = "key1: " . var_export($key1, true);

	$id = $gSession->sessId();
	$messages[] = "sessId: $id";

	$result = $gSession->isActive();
	$messages[] = "isactive: " . var_export($result, true);

	echo implode("\n", $messages) . "\n";
}

testSession ();
