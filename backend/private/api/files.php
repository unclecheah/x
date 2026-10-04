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

	public function getDefaultUser () {
		if (!self::$config) $this->loadConfig ();
		return self::$config['defaultUser'];
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

	public function getHymnTypes () {
		if (!self::$config) $this->loadConfig ();
		return json_encode(self::$config['hymnTypes']);
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

	// public function recordingExist ($hymn) {
	// 	//	TODO: to handle SATB
	// 	$bk = $this->hymn2bk ($hymn);

	// 	foreach (self::$config["audioExt"] as $ext) {
	// 		if (file_exists (MUSICROOT . "/recordings/$bk/$hymn.$ext")) return DOCROOT . "/recordings/$bk/$hymn.$ext";
	// 	}

	// 	return "";
	// }

	// public function getRecordingParts(string $filename) {
	// 	if (!self::$config) $this->loadConfig ();

	// 	$extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
	// 	if (!in_array($extension, self::$config['audioExt'], true)) return json_encode([]);

	// 	// Remove the extension, e.g. "Song1.S1A1.mp3" → "Song1.S1A1".
	// 	$name = pathinfo($filename, PATHINFO_FILENAME);

	// 	// Parts must appear after the final dot.
	// 	$dotPosition = strrpos($name, '.');
	// 	if ($dotPosition === false) return json_encode([]);

	// 	$parts = strtoupper(substr($name, $dotPosition + 1));

	// 	// Validate the entire suffix before extracting individual parts.
	// 	if (!preg_match('/\A(?:[DSATB][12]?)+\z/', $parts)) return json_encode([]);

	// 	preg_match_all('/[DSATB][12]?/', $parts, $matches);

	// 	return json_encode($matches[0]);
	// }

	public function recordingExist($hymn): string {
		$bk = $this->hymn2bk($hymn);
		$directory = MUSICROOT . "/recordings/$bk";
		$baseUrl = DOCROOT . "/recordings/$bk";

		$result = [
			'found' => false,
			'recordings' => []
		];

		// Build an extension pattern from your existing configuration.
		$extensions = array_map(function ($ext) {
			return preg_quote($ext, '~');
		}, self::$config['audioExt']);

		// Match the exact hymn name, optional voice parts, and extension.
		// Voice parts and extensions are case-insensitive.
		$pattern = '~\A'
			. preg_quote($hymn, '~')
			. '(?:\.((?i:[DSATB][12]?)+))?'
			. '\.(?i:' . implode('|', $extensions) . ')'
			. '\z~';

		if (is_dir($directory)) {
			$filenames = scandir($directory);

			if ($filenames === false) throw new \RuntimeException('Unable to read recordings directory.');

			foreach ($filenames as $filename) {
				if (!preg_match($pattern, $filename, $matches)) continue;
				if (!is_file($directory . '/' . $filename)) continue;

				$parts = [];

				if (!empty($matches[1])) {
					preg_match_all(
						'/[SATB][12]?/',
						strtoupper($matches[1]),
						$partMatches
					);

					$parts = $partMatches[0];
				}

				$result['recordings'][] = [
					'url' => $baseUrl . '/' . $filename,
					'parts' => $parts
				];
			}
		}

		$result['found'] = count($result['recordings']) > 0;

		return json_encode($result, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
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

	public function combine ($hymns, $evtid, $vm) {
		/*
			input:
				$hymns = ['hymn1', 'hymn2', ...]
				$evtid = 520
				$vm = 'V'

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

		$pdf->Output ('F', MUSICROOT . "/combined/$evtid.$vm.pdf");
		return json_encode (["status" => "success"]);
	}

	// public function getCombined ($evtid) {
	// 	$file = MUSICROOT . "/combined/$evtid.pdf";
	// 	if (file_exists ($file)) return $file;
	// 	else return "";
	// }
	public function getCombined ($evtid) {
		$found = [];
		$file = MUSICROOT . "/combined/$evtid.M.pdf";
		if (file_exists ($file)) $found[] = DOCROOT . "/combined/$evtid.M.pdf";
		$file = MUSICROOT . "/combined/$evtid.V.pdf";
		if (file_exists ($file)) $found[] = DOCROOT . "/combined/$evtid.V.pdf";

		return json_encode ($found);
	}
}

$gFiles = Files::getInstance();
