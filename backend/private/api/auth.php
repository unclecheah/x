<?php

include_once __DIR__ . "/../config/secret.php";

class Auth {
	private static $instance = null;
	private static $config = null;
	private static $pdo = null;


	private function __construct () {
		global $authDB;

		$this->dbConn ($authDB);
	}

	public static function getInstance () {
		if (self::$instance === null) self::$instance = new self ();
		return self::$instance;
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
	//	TODO:
	//		authenticate
	//		add
	//			** verify email
	//		change status - pending, active, disabled, suspended
	//		change role - member, admin
	//		change display name
	//		** change username
	//		change password
	//  **************************

	public function chkDupUsername ($username) {
		$q = self::$pdo->prepare ("select count(*) from users where username = :username");
		$q->bindParam (":username", $username, PDO::PARAM_STR);
		$q->execute ();
		$count = $q->fetchColumn ();

		return $count;
	}

	public function chkDupEmail ($email) {
		$q = self::$pdo->prepare ("select count(*) from users where email = :email");
		$q->bindParam (":email", $email, PDO::PARAM_STR);
		$q->execute ();
		$count = $q->fetchColumn ();

		return $count;
	}


	function add ($data) {

	}
}

$gAuth = Auth::getInstance();
