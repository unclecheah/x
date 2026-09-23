<?php

include_once __DIR__ . "/../config/secret.php";


class Auth {
	private static $instance = null;
	private static $config = null;
	private static $pdo = null;

	function isEmpty ($inV) {
		if (strlen(trim($inV)) == 0) return true;
		else return false;
	}

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
	//		** verify email
	//		** change username
	//  **************************

	function chkUsername ($username) {
		$q = self::$pdo->prepare ("select count(*) from users where username = :username");
		$q->bindParam (":username", $username, PDO::PARAM_STR);
		$q->execute ();
		$count = $q->fetchColumn ();

		return $count;
	}

	function chkEmail ($email) {
		$q = self::$pdo->prepare ("select count(*) from users where email = :email");
		$q->bindParam (":email", $email, PDO::PARAM_STR);
		$q->execute ();
		$count = $q->fetchColumn ();

		return $count;
	}

	function verify ($data) {
		if ($this->chkUsername ($data['username']))			return "username exists";
		else if ($this->isEmpty ($data['display_name']))	return "display name cannot be empty";
		else if ($this->isEmpty ($data['email']))			return "email cannot be empty";
		else if ($this->chkEmail ($data['email']))			return "email exists";
		else if ($this->isEmpty ($data['password']))		return "password cannot be empty";

		return "";
	}

	function add ($data) {
		$msg = $this->verify ($data);
		if ($msg !== "") return $msg;			//	verification failed

		$q = self::$pdo->prepare ("insert into users (username, display_name, email, password_hash, status, role)" .
								  " values (:username, :display_name, :email, :password_hash, :status, :role)");
		$q->bindValue (":username",			$data["username"],									PDO::PARAM_STR);
		$q->bindValue (":display_name", 	$data["display_name"],								PDO::PARAM_STR);
		$q->bindValue (":email",			$data["email"],										PDO::PARAM_STR);
		$q->bindValue (":password_hash",	password_hash($data["password"], PASSWORD_BCRYPT),	PDO::PARAM_STR);
		$q->bindValue (":status",			"active",											PDO::PARAM_STR);
		$q->bindValue (":role",				"member",											PDO::PARAM_STR);
		$q->execute ();

		return "";
	}

	function delete ($username) {
		if (!$this->chkUsername($username)) return 0;

		$q = self::$pdo->prepare ("delete from users where username = :username");
		$q->bindParam (":username", $username, PDO::PARAM_STR);
		$q->execute ();

		return 1;
	}

	function changeStatus ($username, $status) {
		$q = self::$pdo->prepare ("update users set status = :status where username = :username");
		$q->bindValue (":status",	$status,	PDO::PARAM_STR);
		$q->bindValue (":username",	$username,	PDO::PARAM_STR);
		$q->execute ();
	}

	function changeRole ($username, $role) {
		$q = self::$pdo->prepare ("update users set role = :role where username = :username");
		$q->bindValue (":role",		$role,		PDO::PARAM_STR);
		$q->bindValue (":username",	$username,	PDO::PARAM_STR);
		$q->execute ();
	}

	function changeDispName ($username, $dispName) {
		$q = self::$pdo->prepare ("update users set display_name = :dispName where username = :username");
		$q->bindValue (":dispName",	$dispName,	PDO::PARAM_STR);
		$q->bindValue (":username",	$username,	PDO::PARAM_STR);
		$q->execute ();
	}

	function changePassword ($username, $password) {
		$q = self::$pdo->prepare ("update users set password_hash = :password_hash where username = :username");
		$q->bindValue (":password_hash",	password_hash($password, PASSWORD_BCRYPT),	PDO::PARAM_STR);
		$q->bindValue (":username",			$username,									PDO::PARAM_STR);
		$q->execute ();
	}

	function authenticate ($username, $password) {
		if (!$this->chkUsername($username)) return 0;			//	empty username

		$q = self::$pdo->prepare ("select password_hash from users where username = :username");
		$q->bindParam (":username", $username, PDO::PARAM_STR);
		$q->execute ();
		$phash = $q->fetchColumn ();

		if (password_verify ($password, $phash)) return 1;

		return 0;
	}

	function getStatus ($username) {
		if (!$this->chkUsername($username)) return "";

		$q = self::$pdo->prepare ("select status from users where username = :username");
		$q->bindParam (":username", $username, PDO::PARAM_STR);
		$q->execute ();
		return $q->fetchColumn ();
	}

	function getRole ($username) {
		if (!$this->chkUsername($username)) return "";

		$q = self::$pdo->prepare ("select role from users where username = :username");
		$q->bindParam (":username", $username, PDO::PARAM_STR);
		$q->execute ();
		return $q->fetchColumn ();
	}

	function getDispName ($username) {
		if (!$this->chkUsername($username)) return "";

		$q = self::$pdo->prepare ("select display_name from users where username = :username");
		$q->bindParam (":username", $username, PDO::PARAM_STR);
		$q->execute ();
		return $q->fetchColumn ();
	}
}

$gAuth = Auth::getInstance();
