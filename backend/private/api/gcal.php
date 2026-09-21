<?php
	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	error_reporting(E_ALL);


	include_once __DIR__ . '/../config/secret.php';


	function isEmpty ($inV) {
		if (strlen(trim($inV)) == 0) return true;
		else return false;
	}

	function base64url ($s) { return rtrim (strtr (base64_encode ($s), '+/', '-_'), '='); }

	function add1Hr ($dateStr) {
		$dt = new DateTime ($dateStr);
		$dt->add (new DateInterval('PT1H'));

		return $dt->format('Y-m-d\TH:i:sP');
	}


	class GCal {
		private static $instance = null;
		private $calId = null;
		private $saFile = null;

		private function __construct ($inCalId, $inSaFile) {
			/*
				to maintain as singleton, private constructor not to be called by public,
				use getInstance instead.

				input:
					calendar id
					service account JSON file
			*/
			$this->calId = $inCalId;
			$this->saFile = $inSaFile;
		}

		public static function getInstance ($inCalId, $inSaFile) {
			/*
				input:
					calendar id
					service account JSON file
			*/
			if (self::$instance === null) self::$instance = new self ($inCalId, $inSaFile);
			return self::$instance;
		}


		//  util functions

		private function roles2Desc ($roles) {
			// convert roles data to text for google description
			$txt = "=====  Roles  =====\n";

			for ($i = 0; $i < count ($roles); ++ $i) {
				$role   = $roles[$i]["role"];
				$person = $roles[$i]["person"];

				if (isEmpty ($role) && isEmpty ($person)) continue;
				$txt .= "[$role] $person\n";
			}

			return $txt;
		}

		private function hymns2Desc ($hymns) {
			// convert hymns data to text for google description
			$currtype = "";
			$txt = "=====  Hymns  =====\n";

			for ($i = 0; $i < count ($hymns); ++ $i) {
				$hymntype = $hymns[$i]["hymntype"];
				$hymn     = $hymns[$i]["hymn"];

				if (isEmpty ($hymntype) && isEmpty ($hymn)) continue;
				if ($currtype != $hymntype) {
					$currtype = $hymntype;
					$txt .= "[$hymntype]\n";
				}

				$txt .= "  $hymn\n";
			}

			return $txt;
		}


		//  internal functions - to write to calendar

		private function sa_access_token ($scope) {
			/*
				to get access token to write to calendar
			*/
			$key = json_decode (file_get_contents ($this->saFile), true);
			if (!$key || empty ($key['client_email']) || empty ($key['private_key']))
				throw new Exception('Invalid or unreadable service-account.json');

			$now = time ();
			$hdr = base64url (json_encode (['alg'=>'RS256','typ'=>'JWT']));
			$clm = base64url (json_encode ([
				'iss'   => $key['client_email'],
				'scope' => $scope,
				'aud'   => 'https://oauth2.googleapis.com/token',
				'iat'   => $now,
				'exp'   => $now + 3600,
				// For personal calendars shared to the SA: DO NOT set "sub".
				// For Workspace domain-wide delegation: add 'sub' => 'user@domain.com'
			]));
			$input = "$hdr.$clm";
			if (!openssl_sign ($input, $sig, $key['private_key'], 'sha256')) throw new Exception('openssl_sign failed');

			$jwt = $input . '.' . base64url ($sig);
			$ch = curl_init ('https://oauth2.googleapis.com/token');
			curl_setopt_array ($ch, [
				CURLOPT_POST => true,
				CURLOPT_POSTFIELDS => http_build_query ([
					'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
					'assertion'  => $jwt,
				]),
				CURLOPT_RETURNTRANSFER => true,
				CURLOPT_TIMEOUT => 20,
			]);

			$resp = curl_exec ($ch);
			$http = curl_getinfo ($ch, CURLINFO_HTTP_CODE);
			// curl_close ($ch);

			if ($http !== 200) throw new Exception ("Token exchange failed ($http): $resp");

			$tok = json_decode ($resp, true);
			if (empty ($tok['access_token'])) throw new Exception ('No access_token in token response');

			return $tok['access_token'];
		}


		private function http_post_json ($url, $token, $body) {
			$ch = curl_init($url);
			curl_setopt_array($ch, [
				CURLOPT_HTTPHEADER => [
					"Authorization: Bearer $token",
					"Content-Type: application/json",
				],
				CURLOPT_POST => true,
				CURLOPT_POSTFIELDS => json_encode($body),
				CURLOPT_RETURNTRANSFER => true,
				CURLOPT_TIMEOUT => 30,
			]);
			$resp = curl_exec($ch);
			$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);

			return [$http, $resp];
		}

		private function http_patch_json ($url, $token, $body) {
			$ch = curl_init($url);
			curl_setopt_array($ch, [
				CURLOPT_CUSTOMREQUEST => 'PATCH',
				CURLOPT_HTTPHEADER => [
					"Authorization: Bearer $token",
					"Content-Type: application/json",
					// Optional optimistic concurrency:
					// "If-Match: *"
				],
				CURLOPT_POSTFIELDS => json_encode($body),
				CURLOPT_RETURNTRANSFER => true,
				CURLOPT_TIMEOUT => 30,
			]);
			$resp = curl_exec($ch);
			$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);

			return [$http, $resp];
		}

		private function http_delete ($url, $token) {
			$ch = curl_init($url);
			curl_setopt_array($ch, [
				CURLOPT_CUSTOMREQUEST => 'DELETE',
				CURLOPT_HTTPHEADER => ["Authorization: Bearer $token"],
				CURLOPT_RETURNTRANSFER => true,
				CURLOPT_TIMEOUT => 30,
			]);
			$resp = curl_exec($ch);
			$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);

			return [$http, $resp];
		}


		/*
			external functions - to be called by client

			input data
			{
				action: 'insert',          //   insert | update | delete

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
		*/

		public function insert ($data) {
			/*
				insert data into gcal

				returns {
					"id": "jshgmn..."
				}
			*/


			//	setup
			$calendarIdEnc = rawurlencode($this->calId);      //  calendar id
			$token = $this->sa_access_token('https://www.googleapis.com/auth/calendar.events');


			//	data
			$event = [];
			/*  convert field names
				title           -> summary
				timestamp       -> start
				timestamp + 1hr -> end
				note            -> description
				roles           -> description
				hymns           -> description
			*/
			if (!$data['title']) throw new Exception('summary is required for create');
			$event['summary']     = $data['title'];
			$event['start']       = ['dateTime' => $data['timestamp'] . ':00+08:00'];             //  sql needs "2025-10-12T10:00", gcal needs "2025-10-12T10:00:00+08:00"
			$event['end']         = ['dateTime' => add1Hr ($event['start']['dateTime'])];
			$event['description'] = '';

			if (isset($data['note']) && !isEmpty($data['note'])) $event['description'] .= "=====  Note  =====\n" . $data['note'] . "\n\n";
			if ($data['roles'])                                  $event['description'] .= $this->roles2Desc ($data['roles']) . "\n";
			if ($data['hymns'])                                  $event['description'] .= $this->hymns2Desc ($data['hymns']) . "\n";


			//	call
			$url = "https://www.googleapis.com/calendar/v3/calendars/$calendarIdEnc/events";
			list($http, $resp) = $this->http_post_json($url, $token, $event);
			if ($http >= 200 && $http < 300) {
				$data = json_decode ($resp, true);
				$rdata = ['id' => $data['id']];
				return json_encode ($rdata);			//	gcal event id
			} else {
				http_response_code($http ?: 500);
				echo json_encode(['error'=>"create failed ($http)", 'details'=>$resp], JSON_PRETTY_PRINT);
			}
		}


		public function update ($data) {
			/*
				update data into gcal

				returns {
					"id": "jshgmn..."
				}
			*/

			
			//	setup
			$calendarIdEnc = rawurlencode($this->calId);      //  calendar id
			$token = $this->sa_access_token('https://www.googleapis.com/auth/calendar.events');


			//	data
			$eventId = $data['gcalevtid'];
			$eventIdEnc = rawurlencode($eventId);       //  event id

			$event = [];
			/*  convert field names
				title           -> summary
				timestamp       -> start
				timestamp + 1hr -> end
				note            -> description
				roles           -> description
				hymns           -> description
			*/
			if (!$data['title']) throw new Exception('summary is required for create');
			$event['summary']     = $data['title'];
			$event['start']       = ['dateTime' => $data['timestamp'] . ':00+08:00'];             //  sql needs "2025-10-12T10:00", gcal needs "2025-10-12T10:00:00+08:00"
			$event['end']         = ['dateTime' => add1Hr ($event['start']['dateTime'])];
			$event['description'] = '';

			if (isset($data['note']) && !isEmpty($data['note'])) $event['description'] .= "=====  Note  =====\n" . $data['note'] . "\n\n";
			if ($data['roles'])                                  $event['description'] .= $this->roles2Desc ($data['roles']) . "\n";
			if ($data['hymns'])                                  $event['description'] .= $this->hymns2Desc ($data['hymns']) . "\n";


			//	call
			$url = "https://www.googleapis.com/calendar/v3/calendars/$calendarIdEnc/events/$eventIdEnc";
			list($http, $resp) = $this->http_patch_json($url, $token, $event);
			if ($http >= 200 && $http < 300) {
				return json_encode (array ("id" => $eventId));							//	gcal event id
			} else {
				http_response_code($http ?: 500);
				echo json_encode(['error'=>"update failed ($http)", 'details'=>$resp], JSON_PRETTY_PRINT);
			}
		}


		public function delete ($data) {
			/*
				delete gcal event

				returns {
					"id": "jshgmn..."
				}
			*/


			//	setup
			$calendarIdEnc = rawurlencode($this->calId);      //  calendar id
			$token = $this->sa_access_token('https://www.googleapis.com/auth/calendar.events');


			//	data
			$eventId = $data['gcalevtid'];
			$eventIdEnc = rawurlencode($eventId);            //  event id


			//	call
			$url = "https://www.googleapis.com/calendar/v3/calendars/$calendarIdEnc/events/$eventIdEnc";
			list($http, $resp) = $this->http_delete ($url, $token);
			if ($http !== 204) {
				http_response_code($http ?: 500);
				echo json_encode(['error'=>"delete failed ($http)", 'details'=>$resp], JSON_PRETTY_PRINT);

			} else return json_encode (array ("id" => $eventId));
		}
	}

	$gGCal = GCal::getInstance($calId, $saFile);
