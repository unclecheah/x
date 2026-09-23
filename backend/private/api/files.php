<?php

require_once __DIR__ . '/fpdf/fpdf.php';
require_once __DIR__ . '/fpdi/src/autoload.php';
use setasign\Fpdi\Fpdi;

const DATAROOT = __DIR__ . "/../../../data";
const MUSICROOT = DATAROOT . "/music";					//	<-- file path
const DOCROOT = "/data/music";									//	<-- wrt $DOCUMENT_ROOT


class Files {
	private static $CONFIGFILE = __DIR__ . "/../config/config.json";
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
		$json = file_get_contents (Files::$CONFIGFILE);
		if ($json === false) throw new RuntimeException ("Unable to read config");

		self::$config = json_decode ($json, true, 512, JSON_THROW_ON_ERROR);
	}

	public function getBgImages () {
		$files = new RecursiveIteratorIterator (
			new RecursiveDirectoryIterator (DATAROOT . "/images/background", FilesystemIterator::SKIP_DOTS)
		);

		$names = [];

		foreach ($files as $file) {
			if ($file->isFile()) $names[] = pathinfo($file->getFilename(), PATHINFO_BASENAME);
		}

		return json_encode ($names);
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

		if (file_exists (MUSICROOT . "/scores/$bk/$hymn.pdf")) return DOCROOT . "/scores/$bk/$hymn.pdf";
		else return "";
	}

	public function recordingExist ($hymn) {
		//	TODO: to handle SATB
		$bk = $this->hymn2bk ($hymn);

		foreach (self::$config["audioExt"] as $ext) {
			if (file_exists (MUSICROOT . "/recordings/$bk/$hymn.$ext")) return DOCROOT . "/recordings/$bk/$hymn.$ext";
		}

		return "";
	}

	public function linkExist ($hymn) {
		$bk = $this->hymn2bk ($hymn);
		$path = MUSICROOT . "/recordings/$bk/$hymn.link";

		if (file_exists ($path)) {
			$contents = @file_get_contents ($path);
			if ($contents === false) return "";

			// Remove a UTF-8 byte-order mark, if present.
			$url = trim (preg_replace ('/^\xEF\xBB\xBF/', '', $contents));
			if (filter_var ($url, FILTER_VALIDATE_URL) === false) return "";

			$scheme = strtolower (parse_url ($url, PHP_URL_SCHEME) ?? "");
			if (!in_array ($scheme, ["http", "https"], true)) return "";

			return $url;
		}

		return "";
	}

	public function getDetails ($hymns) {
		/*
			returns [{
				hymn:		"Hymn Name",
				score:		"/data/scores/...pdf",
				recording:	"/data/recordings/...mp3",
				link:		"https://youtube.com/..."
			}]
		*/
		$result = array ();

		for ($i = 0; $i < count ($hymns); ++$i) {
			$score = $this->scoreExist ($hymns[$i]);
			$recording = $this->recordingExist ($hymns[$i]);
			$link = $this->linkExist ($hymns[$i]);

			$result[] = array (
				"hymn"		=> $hymns[$i],
				"score"		=> $score,
				"recording"	=> $recording,
				"link"		=> $link
			);
		}

		return json_encode ($result);
	}

	public function getAllHymns (): string {
		/*
			returns ["hymn1", "hymn2", ...]
		*/
		$files = new RecursiveIteratorIterator (
			new RecursiveDirectoryIterator (MUSICROOT . "/scores", FilesystemIterator::SKIP_DOTS)
		);

		$names = [];

		foreach ($files as $file) {
			if ($file->isFile()) $names[] = pathinfo($file->getFilename(), PATHINFO_FILENAME);
		}

		return json_encode ($names);
	}

	public function combine ($hymns, $evtid) {
		/*
			input:
				$hymns = ['hymn1', 'hymn2', ...]
				$evtid = 520

			returns {status: "success"}
		*/

		$pdf = new Fpdi();

		foreach ($hymns as $hymn) {
			$bk = $this->hymn2bk ($hymn);
			$file = MUSICROOT . "/scores/$bk/$hymn.pdf";

			$pageCount = $pdf->setSourceFile ($file);
			for ($page = 1; $page <= $pageCount; $page++) {
				$tpl = $pdf->importPage($page);
				$size = $pdf->getTemplateSize ($tpl);
				$pdf->AddPage ($size['orientation'], [$size['width'], $size['height']]);
				$pdf->useTemplate ($tpl);
			}
		}

		$pdf->Output ('F', MUSICROOT . "/combined/$evtid.pdf");
		return json_encode (["status" => "success"]);
	}

	public function getCombined ($evtid) {
		$file = MUSICROOT . "/combined/$evtid.pdf";
		if (file_exists ($file)) return $file;
		else return "";
	}
}

$gFiles = Files::getInstance();
