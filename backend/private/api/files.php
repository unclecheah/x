<?php

const CONFIGFILE = __DIR__ . "/../config/config.json";
const DATAROOT = __DIR__ . "/../../../data";					//	<-- file path
const SCORESROOT = DATAROOT . "/scores";
const RECORDINGSROOT = DATAROOT . "/recordings";
const COMBINEDROOT = DATAROOT . "/combined";

const DOCROOT = "/data";									//	<-- wrt $DOCUMENT_ROOT


class Files {
	// private static $configfile = __DIR__ . "/../config/config.json";
	private static $instance = null;
	private static $config = null;

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

	public function loadConfig () {
		$json = file_get_contents (CONFIGFILE);
		if ($json === false) throw new RuntimeException ("Unable to read config");

		self::$config = json_decode ($json, true, 512, JSON_THROW_ON_ERROR);
	}

	public function hymn2bk ($hymn) {
		if (!self::$config) $this->loadConfig ();

		foreach (self::$config['hymnBk'] ?? [] as $rule) {
			$pattern = $rule['pattern'] ?? '';
			$result = $rule['result'] ?? null;
			$pattern = str_replace ('~', '\~', $pattern);
			$regex = '~' . $pattern . '~';

			$match = preg_match ($regex, $hymn);
			if ($match === 1) return $result;
		}

		// return "no match";
	}

	public function scoreExist ($hymn) {
		$bk = $this->hymn2bk ($hymn);

		// $relpath = "$scoresRoot/$book/$hymn.pdf";
		if (file_exists (DATAROOT . "/scores/$bk/$hymn.pdf")) return DOCROOT . "/scores/$bk/$hymn.pdf";
		else return "";
	}

}

$gFiles = Files::getInstance();
