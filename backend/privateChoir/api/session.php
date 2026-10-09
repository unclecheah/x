<?php
	// ini_set ('display_errors', 0);
	// error_reporting (E_ALL);

	/*
		SessionManager

		Handles starting, resuming, and destroying PHP sessions
		in a clean, class-based structure.

		$session = SessionMgr.getInstance ();       <-- get singleton
		$session.start ();                          <-- start session

		$session->resume (id);                      <-- resume session with id, not needed
		$session->isActive ();                      <-- is session active
		$session->sessId ();                        <-- get session id
		$session->regenerate ();                    <-- regenerate session id
		$session->destroy ();                       <-- destroy session

		$session->set (var, val);                   <-- set session variable var with value val
		$session->get (var);                        <-- get session variable var
		$session->has (var);                        <-- does session variable var exists
		$session->remove (var);                     <-- remove session variable var
		$session->clear ();                         <-- remove all session variables
	 */
	class SessionMgr {
		private static ?SessionMgr $instance = null;

		// -------------------------------------------------------------------------
		// Singleton access
		// -------------------------------------------------------------------------

		public static function getInstance(): self {
			/**
			 * Returns the single instance of SessionManager.
			 */
			if (self::$instance === null) self::$instance = new self();
			return self::$instance;
		}

		// Prevent direct instantiation / cloning
		private function __construct() {}
		private function __clone() {}

		// -------------------------------------------------------------------------
		// Core session lifecycle
		// -------------------------------------------------------------------------

		public function start(string $username, array $options = []): string {
			/*
			 * Start a new session (or resume an existing one).
			 *
			 * @params  string $username - to set username session var
			 *          array $options - Optional session_start() options
			 *                           e.g. ['cookie_lifetime' => 3600]
			 * @return bool              True on success, false if already active
			 */

			$active = json_decode ($this->isActive());
			if ($active) return json_encode(false); // Session already running — nothing to do

			$defaults = [
				'cookie_httponly' => true,   // Protect cookie from JS access
				'cookie_secure'   => true,   // HTTPS only (set false in dev if needed)
				'cookie_samesite' => 'Lax',  // CSRF mitigation
				'use_strict_mode' => true,   // Reject unrecognised session IDs
			];

			$result = session_status() === PHP_SESSION_ACTIVE;

			if (!$result) {
				$result = session_start(array_merge($defaults, $options));
			}

			if ($result) $_SESSION['username'] = $username;      //  set username session var

			return json_encode($result);
		}

		public function resume(string $sessionId): bool {
			/*
			 * Resume an existing session by ID without starting a new one.
			 *
			 * @param  string $sessionId  The session ID to resume
			 * @return bool               True on success, false if session not found
			 */
			if ($this->isActive()) return false; // Already have an active session
			if (!$this->isValidSessionId($sessionId)) throw new InvalidArgumentException('Invalid session ID format.');

			session_id($sessionId);
			return $this->start();
		}

		public function destroy(): string {
			/*
			 * Destroy the current session and clear all session data.
			 *
			 * @return bool  True on success, false if no session was active
			 */

			session_start ();
			$_SESSION = [];                                 // 1. Clear the $_SESSION superglobal

			if (ini_get('session.use_cookies')) {           // 2. Delete the session cookie from the browser
				$params = session_get_cookie_params();
				setcookie (session_name(), '', [
					'expires'  => time() - 42000,
					'path'     => $params['path'],
					'domain'   => $params['domain'],
					'secure'   => $params['secure'],
					'httponly' => $params['httponly'],
					'samesite' => $params['samesite'] ?? 'Lax',
				]);
				$cookieName = session_name();
				unset ($_COOKIE[$cookieName]);
			}

			$result = session_destroy();                    // 3. Destroy the server-side session data
			session_id ('');

			return json_encode($result);
		}

		public function regenerate(bool $deleteOldSession = true): bool {
			/*
			 * Regenerate the session ID (prevents session fixation attacks).
			 *
			 * @param  bool $deleteOldSession  Whether to delete the old session file
			 * @return bool
			 */
			if (!$this->isActive()) throw new RuntimeException('No active session to regenerate.');
			return session_regenerate_id($deleteOldSession);
		}

		// -------------------------------------------------------------------------
		// Session variable helpers
		// -------------------------------------------------------------------------

		public function set(string $key, mixed $value): string {
			/**
			 * Set a session variable.
			 */
			$this->requireActiveSession();
			$_SESSION[$key] = $value;
			return $_SESSION[$key];
		}

		public function get(string $key, mixed $default = null): mixed {
			/**
			 * Get a session variable, with an optional default.
			 */
			$this->requireActiveSession();
			return json_encode($_SESSION[$key] ?? $default);
		}

		public function has(string $key): bool {
			/**
			 * Check whether a session variable exists.
			 */
			$this->requireActiveSession();
			return isset($_SESSION[$key]);
		}

		public function remove(string $key): void {
			/**
			 * Remove a specific session variable.
			 */
			$this->requireActiveSession();
			unset($_SESSION[$key]);
		}

		public function clear(): void {
			/**
			 * Clear all session variables without destroying the session itself.
			 */
			$this->requireActiveSession();
			$_SESSION = [];
		}

		// -------------------------------------------------------------------------
		// Status helpers
		// -------------------------------------------------------------------------

		public function sessId(): string {
			/**
			 * Return the current session ID.
			 */
			// session_start ();
			if ($this->isActive()) return json_encode(session_id());
			else return json_encode ("");
		}

		public function isActive(): string {
			// A session may already have been started during this request,
			// even though its new cookie is not yet present in $_COOKIE.
			if (session_status() === PHP_SESSION_ACTIVE) {
				return json_encode(!empty($_SESSION['username']));
			}

			// No active session and no incoming cookie: nothing to resume.
			if (!isset($_COOKIE[session_name()])) {
				return json_encode(false);
			}

			// Try to load the session associated with the incoming cookie.
			if (!session_start()) {
				return json_encode(false);
			}

			return json_encode(!empty($_SESSION['username']));
		}

		// -------------------------------------------------------------------------
		// Private helpers
		// -------------------------------------------------------------------------

		private function requireActiveSession(): void {
			if (!$this->isActive()) throw new RuntimeException('No active session. Call start() or resume() first.');
		}

		private function isValidSessionId(string $sessionId): bool {
			/**
			 * Validate that a session ID only contains safe characters.
			 * PHP session IDs are alphanumeric and may contain dashes.
			 */
			return preg_match('/^[a-zA-Z0-9\-]{22,128}$/', $sessionId) === 1;
		}
	}

	$gSession = SessionMgr::getInstance ();
