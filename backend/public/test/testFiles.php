<?php
include_once "../../private/api/files.php";

function testFiles () {
	global $gFiles;

	$gFiles->loadConfig ();
	echo $gFiles->getBgImages ();
	// echo $gFiles->hymn2Bk("Psalm [SPG123]");
	// echo $gFiles->scoreExist ("A Call To Blessing [BB599]");
	// echo $gFiles->recordingExist ("Psalm 040 - Here I Am");
	// echo $gFiles->linkExist ("To Rescue A Sinner Like Me");
	// echo $gFiles->getDetails (["To Rescue A Sinner Like Me", "Bless Our Singapore"]);
	// echo $gFiles->getAllHymns ();

	// $hymns = ['In God Alone [BB624]', "Psalm - Anne's Wedding"];
	// echo $gFiles->combine ($hymns, 998);
	// echo $gFiles->getCombined (998);
}

testFiles ();
