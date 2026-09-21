<?php
	// $saFile = $_SERVER['DOCUMENT_ROOT'] . "/php/choir-gcal-write-4927fa2dad20.json";		//	called as web svc
	$saFile = __DIR__ . "/choir-gcal-write.json";								//	called by php
	$calId = "d2n5tjqsrs44ik218jvrd9g13k@group.calendar.google.com";
	$maxEvents = 10;

	$authDB = array (
		"host" => "localhost",
		"db" => "uncleche_auth",
		"user" => "uncleche_unclecheah",
		"pw" => "uncle8Pass"
	);

	$choirDB = array (
		"host" => "localhost",
		"db" => "uncleche_choir",
		"user" => "uncleche_unclecheah",
		"pw" => "uncle8Pass"
	);
