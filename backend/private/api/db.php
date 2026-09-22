<?php

include_once __DIR__ . "/../config/secret.php";
include_once __DIR__ . "/gcal.php";


class DB {
	private static $CONFIGFILE = __DIR__ . "/../config/config.json";
	private static $instance = null;
	private static $config = null;
	private static $pdo = null;

	private function __construct () {
		/*
			to maintain as singleton, private constructor not to be called by public,
			use getInstance instead.
		*/
		global $choirDB;

		$this->loadConfig ();
		$this->dbConn ($choirDB);
	}

	public static function getInstance () {
		if (self::$instance === null) self::$instance = new self ();
		return self::$instance;
	}

	public function loadConfig () {
		$json = file_get_contents (DB::$CONFIGFILE);
		if ($json === false) throw new RuntimeException ("Unable to read config");

		self::$config = json_decode ($json, true, 512, JSON_THROW_ON_ERROR);
	}

	function dbConn ($db) {
		try {
			$sqlStr = "mysql:host=" . $db['host'] . ";dbname=" . $db['db'];
			self::$pdo = new PDO ($sqlStr, $db["user"], $db["pw"], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
		} catch (PDOException $e) {
			exit ("Error: " . $e->getMessage ());
		}
	}

	//  **************************
	//	read from db
	//  **************************
	public function getEvents ($d) {
		/*
			$d = 'yyyy-mm-dd hh:mm:ss'

			returns [{
				id:			356,
				gcalid:		"q1c...",
				title:		"Event 123",
				note:		"some note...",
				timestamp:	"2026-01-01 10:30:00",
				updated:	"2026-08-16:17:08:00"},
			}, ...]
		*/
		global $choirDB;

		$events = array ();

		try {
			$q = self::$pdo->prepare ("select * from events where timestamp >= :date order by timestamp, id limit :limit");
			$q->bindValue (':date', $d, PDO::PARAM_STR);
			$q->bindValue (':limit', (int) self::$config['maxEvents'], PDO::PARAM_INT);
			$q->execute ();
		} catch (PDOException $e) {
			echo $e->getMessage();
		}

		while (($row = $q->fetch (PDO::FETCH_ASSOC))) $events[] = $row;
		return json_encode ($events);
	}

	public function getEvent($eventID) {
		/*
			$eventid = 356

			returns [{
				id:			356,
				gcalid:		"q1c...",
				title:		"Event 123",
				note:		"some note...",
				timestamp:	"2026-01-01 10:30:00",
				updated:	"2026-08-16:17:08:00"},
			}, ...]
		*/
		global $choirDB;

		$q = self::$pdo->prepare("select * from events where id = :id limit 1");
		$q->bindValue(':id', (int) $eventID, PDO::PARAM_INT);
		$q->execute();

		$event = $q->fetch(PDO::FETCH_ASSOC);
		return json_encode($event === false ? null : $event);
	}

	public function getLitClr ($event) {
		$rules = self::$config['litClr'];

		foreach ($rules as $rule) {
			foreach ($rule['evt'] as $keyword) {
				if ($keyword === '' || stripos ($event, $keyword) !== false) return $rule['clr'];
			}
		}

		return null;
	}

	public function getRoles ($eventID) {
		/*
			eventID = 523

			return [{
				eventid:	345,
				id:			1,
				role:		"Conductor",
				person:		"Jac"
			}, ...]
		*/
		global $choirDB;

		$roles = array ();

		$q = self::$pdo->prepare ("select * from roles where eventid = :eventID order by id");
		$q->bindParam (":eventID", $eventID, PDO::PARAM_STR);
		$q->execute ();

		while ($row = $q->fetch (PDO::FETCH_ASSOC)) $roles[] = $row;
		return json_encode ($roles);
	}

	public function getHymns ($eventID) {
		/*
			eventID = 523

			returns [{
				eventid:	345,
				id:			1,
				hymntype:	"Entrance",
				book:		"Heart",
				hymn:		"Some Name [C21]"
			}, ...]
		*/
		global $choirDB;
		$hymns = array ();

		$q = self::$pdo->prepare ("select * from hymns where eventid = :eventID order by id");
		$q->bindParam ("eventID", $eventID, PDO::PARAM_STR);
		$q->execute ();
		while ($row = $q->fetch (PDO::FETCH_ASSOC)) $hymns[] = $row;

		return json_encode ($hymns);
	}

	public function getGCalEvtId ($eventID) {
		/*
			eventID = 523

			returns "q7..."
		*/
		global $choirDB;
		$gcalevtid = array ();

		$q = self::$pdo->prepare ("select gcalid from events where id = :eventID");
		$q->bindParam (":eventID", $eventID, PDO::PARAM_STR);
		$q->execute ();
		$gCalEvtId = $q->fetchColumn ();

		return $gCalEvtId;
	}


	//  **************************
	//	write to db
	//  **************************
	public function insertRoles ($eventid, $roles) {
		/*
			eventid:	523
			roles:	[
				{role: 'Cantor', person: 'Carol'},
				{role: 'Conductor', person: 'Jac'},
				...
			]
		*/

		$q = self::$pdo->prepare ("delete from roles where eventid=:eventid");
		$q->bindValue (":eventid", $eventid, PDO::PARAM_INT);
		$q->execute ();

		$q = self::$pdo->prepare ("insert into roles (id, eventid, role, person) values (:id, :eventid, :role, :person)");
		for ($i = 0; $i < count ($roles); ++$i) {
			$q->bindValue (":id",        $i + 1,               PDO::PARAM_INT);
			$q->bindValue (":eventid",   $eventid,             PDO::PARAM_INT);
			$q->bindValue (":role",      $roles[$i]["role"],   PDO::PARAM_STR);
			$q->bindValue (":person",    $roles[$i]["person"], PDO::PARAM_STR);
			$q->execute ();
		}
	}

	public function insertHymns ($eventid, $hymns) {
		/*
			eventid:	523
			hymns:	[
				{hymntype: 'Entrance', book: 'BB', hymn: 'Let Us Go To The Altar [BB315; bb306]'},
				{hymntype: 'Psalm', book: 'Psalms', hymn: 'Psalm Yr C ...'},
				...
			]
		*/

		$q = self::$pdo->prepare ("delete from hymns where eventid=:eventid");
		$q->bindValue (":eventid", $eventid, PDO::PARAM_INT);
		$q->execute ();

		$q = self::$pdo->prepare ("insert into hymns (id, eventid, hymntype, hymn) values (:id, :eventid, :hymntype, :hymn)");
		for ($i = 0; $i < count ($hymns); ++$i) {
			$q->bindValue (":id",        $i + 1,                   PDO::PARAM_INT);
			$q->bindValue (":eventid",   $eventid,                 PDO::PARAM_INT);
			$q->bindValue (":hymntype",  $hymns[$i]["hymntype"],   PDO::PARAM_STR);
			$q->bindValue (":hymn",      $hymns[$i]["hymn"],       PDO::PARAM_STR);
			$q->execute ();
		}
	}

	public function insert ($data) {
		/*  input data = {
				action:		'db_insert',

				title:		'yr C 28th Sunday in...',
				timestamp:	'2025-10-12T10:00',
				note:		'Wear red top...',
				roles: [
					{role: 'Cantor', person: 'Carol'}
				],
				hymns: [
					{hymntype: 'Entrance', book: 'BB', hymn: 'Let Us Go To The Altar [BB315; bb306]'},
					{hymntype: 'Psalm', book: 'Psalms', hymn: 'Psalm Yr C ...'},
					...
				],
				updated:	'2025-10-12T10:00'
			}

			returns {
				id:			523,
				gcalevtid:	"q7..."
			}
		*/

		global $gGCal;

		$q = self::$pdo->prepare ("select max(id) as max from events");          //  get max event id
		$q->execute ();
		$row = $q->fetch ();
		$id = $row['max'] + 1;

		$q = self::$pdo->prepare ("insert into events (id, title, timestamp, note, updated) values (:id, :title, :timestamp, :note, :updated)");
		$q->bindValue (":id",        $id,                PDO::PARAM_INT);
		$q->bindValue (":title",     $data["title"],     PDO::PARAM_STR);
		$q->bindValue (":timestamp", $data["timestamp"], PDO::PARAM_STR);
		$q->bindValue (":note",      $data["note"],      PDO::PARAM_STR);
		$q->bindValue (":updated",   $data["updated"],   PDO::PARAM_STR);
		$q->execute ();

		$this->insertRoles ($id, $data["roles"]);
		$this->insertHymns ($id, $data["hymns"]);

		$gCalEvtId = $gGCal->insert ($data);
		$gCalEvtId = json_decode ($gCalEvtId, true);
		$q = self::$pdo->prepare ("update events set gcalid = :gcalid where id = :id");
		$q->bindValue (":gcalid",   $gCalEvtId['id'],	PDO::PARAM_STR);
		$q->bindValue (":id",       $id,				PDO::PARAM_INT);
		$q->execute ();

		//	return values
		$retVal = [];
		$retVal['id'] = $id;
		$retVal['gcalevtid'] = $gCalEvtId;
		return json_encode($retVal);
	}

	public function update ($data) {
		/*  input data = {
				action: 'db_update',

				id: 443,
				gcalid: 'n7...',
				title: 'yr C 28th Sunday in...',
				timestamp: '2025-10-12T10:00',
				note: 'Wear red top...',
				roles: [
					{role: 'Cantor', person: 'Carol'}
				],
				hymns: [
					{hymntype: 'Entrance', book: 'BB', hymn: 'Let Us Go To The Altar [BB315; bb306]'},
					{hymntype: 'Psalm', book: 'Psalms', hymn: 'Psalm Yr C ...'},
					...
				],
				updated: '2025-10-12T10:00'
			}

			returns {
				id:			523,
				gcalevtid:	"q7..."
			}
		*/

		global $gGCal;
		$id = $data["id"];

		//  update sql
		$q = self::$pdo->prepare ("update events set title=:title, timestamp=:timestamp, note=:note, updated=:updated where id=:id");
		$q->bindParam (":id",        $id,                PDO::PARAM_INT);
		$q->bindParam (":title",     $data["title"],     PDO::PARAM_STR);
		$q->bindParam (":timestamp", $data["timestamp"], PDO::PARAM_STR);
		$q->bindParam (":note",      $data["note"],      PDO::PARAM_STR);
		$q->bindParam (":updated",   $data["updated"],   PDO::PARAM_STR);
		$q->execute ();

		$this->insertRoles ($id, $data["roles"]);
		$this->insertHymns ($id, $data["hymns"]);

		$data["gcalevtid"] = $this->getGCalEvtId ($id);        //  may not need
		$gGCal->update ($data);

		$retVal = [];
		$retVal['id'] = $id;
		$retVal['gcalevtid'] = $data["gcalevtid"];
		return json_encode($retVal);
	}

	public function delete ($data) {
		/*  input data = {
				action: 'db_delete',
				id: 443,
			}

			returns {id: 443}
		*/
		global $gGCal;

		$gCalData = ["gcalevtid" => $this->getGCalEvtId ($data["id"])];                   //  delete gcal
		$gGCal->delete ($gCalData);

		$q = self::$pdo->prepare ("delete from events where id = :id");              //  delete event
		$q->bindValue (":id", $data["id"], PDO::PARAM_INT);
		$q->execute ();

		$q = self::$pdo->prepare ("delete from roles where eventid = :id");          //  delete roles
		$q->bindValue (":id", $data["id"], PDO::PARAM_INT);
		$q->execute ();

		$q = self::$pdo->prepare ("delete from hymns where eventid = :id");          //  delete hymns
		$q->bindValue (":id", $data["id"], PDO::PARAM_INT);
		$q->execute ();

		return json_encode (["id" => $data["id"]]);
	}
}

$gDB = DB::getInstance();
