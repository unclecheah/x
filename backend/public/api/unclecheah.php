<?php
// include_once "../php/auth.php";
include_once "../../private/api/session.php";
include_once "../../private/api/gcal.php";
include_once "../../private/api/files.php";
include_once "../../private/api/db.php";

class Unclecheah {
	private static $instance = null;

	private function __construct () {
		/*
			to maintain as singleton, private constructor not to be called by public,
			use getInstance instead.
		*/
	}

	public static function getInstance () {
		if (self::$instance === null) self::$instance = new self ();
		return self::$instance;
	}

	public function run () {
		global $gSession, $gGCal, $gFiles, $gDB;

		if (in_array ($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {           //  POST, PUT, PATCH
			$json = file_get_contents ('php://input');
			$data = json_decode ($json, true);                                  //  $data is now json, $data['action'] = 'upd'

			// if 		($data['action'] == 'auth_authenticate')	echo $gAuth->authenticate ($data['username'], $data['password']);
			// else if ($data['action'] == 'auth_add')				echo $gAuth->add ($data['username'], $data['password'], $data['admin'], $data['changepw']);
			// else if ($data['action'] == 'auth_changepw')		echo $gAuth->changepw ($data['username'], $data['password']);

			if ($data['action'] == 'session_start')		echo $gSession->start ($data['username']);
			else if ($data['action'] == 'session_destroy')		echo $gSession->destroy ();
			else if ($data['action'] == 'session_setvar')		echo $gSession->set ($data['key'], $data['value']);

			else if ($data['action'] == 'db_insert')	echo $gDB->insert ($data);
			else if ($data['action'] == 'db_update')	echo $gDB->update ($data);
			else if ($data['action'] == 'db_delete')	echo $gDB->delete ($data);

			else if ($data['action'] == 'gcal_insert')	echo $gGCal->insert ($data);
			else if ($data['action'] == 'gcal_update')	echo $gGCal->update ($data);
			else if ($data['action'] == 'gcal_delete')	echo $gGCal->delete ($data);

			else if ($data['action'] == 'files_getDetails')		echo $gFiles->getDetails ($data['hymns']);
			else if ($data['action'] == 'files_getAllHymns')	echo $gFiles->getAllHymns ();
			else if ($data['action'] == 'files_combine')		echo $gFiles->combine ($data['hymns'], $data['evtid']);
			else if ($data['action'] == 'files_getCombined')	echo $gFiles->getCombined ($data['evtid'] ?? null);

		} else {
			if      (isset ($_GET['session_destroy']))	echo $gSession->destroy ();
			else if (isset ($_GET['session_isactive']))	echo $gSession->isActive ();
			else if (isset ($_GET['session_sessid']))	echo $gSession->sessId ();
			else if (isset ($_GET['session_getvar']))	echo $gSession->get ($_GET['key']);

			else if (isset ($_GET['files_hymn2bk']))		echo $gFiles->hymn2bk ($_GET['data']);
			else if (isset ($_GET['files_scoreExist']))		echo $gFiles->scoreExist ($_GET['data']);
			else if (isset ($_GET['files_recordingExist']))	echo $gFiles->recordingExist ($_GET['data']);
			else if (isset ($_GET['files_linkExist']))		echo $gFiles->linkExist ($_GET['data']);
			
			else if (isset ($_GET['db_events']))		echo $gDB->getEvents	($_GET['date']);
			else if (isset ($_GET['db_event']))			echo $gDB->getEvent		($_GET['eventid']);
			else if (isset ($_GET['db_roles']))			echo $gDB->getRoles		($_GET['eventid']);
			else if (isset ($_GET['db_hymns']))			echo $gDB->getHymns		($_GET['eventid']);
			else if (isset ($_GET['db_gcalid']))		echo $gDB->getGCalEvtId	($_GET['eventid']);
		}
	}
}

$gUC = Unclecheah::getInstance();
$gUC->run ();
