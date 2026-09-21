<?php
include_once "../../private/api/files.php";

function testFiles () {
	global $gFiles;

	$gFiles->loadConfig ();
	// echo $gFiles->hymn2Bk("Psalm [SPG123]");
	echo $gFiles->scoreExist ("A Call To Blessing [BB599]");
}

testFiles ();
