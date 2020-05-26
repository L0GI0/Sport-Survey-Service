<?php
class db {
  private $user = "7pabjan" ;
  private $pass = "pass7pabjan";
  private $host = "172.20.44.25";
  private $base = "7pabjan";
	private $dbCollectionId = "ankiety";
	private $usersCollectionId = "users";
	private $sessionCollectionId = "session";
	private $conn;
	private $dbase;
	private $sessionInfo;
	private $usersCollection;
	private $dbCollection;

	function __construct() {
      $this->conn = new MongoDB\Client("mongodb://{$this->user}:{$this->pass}@{$this->host}/{$this->base}");
			$this->sessionInfo = $this->conn->{$this->base}->{$this->sessionCollectionId};
			$this->usersCollection = $this->conn->{$this->base}->{$this->usersCollectionId};
			$this->dbCollection = $this->conn->{$this->base}->{$this->dbCollectionId};
	}

	function sessionToken($session) {
		$currentTime = time();

		$token =  $this->sessionInfo->findOne(array('sessionToken' => $session['sessionToken']));
		if($token == NULL){
			return false;
		} else {
			if(($currentTime - $token['begin']) > (480)) {
	      $this->sessionInfo->deleteMany(['sessionToken' => $session['sessionToken']]);
				return false;
			} else {
				return true;
			}
		}
	}

	function select() {
		$cursor = $this->dbCollection->find();
	  $table = iterator_to_array($cursor);
	  return $table;
	}

	function insert($data) {
		$ret = $this->dbCollection->insertOne($data);
		return $ret;
	}

	function selectQuest() {
		$result = $this->dbCollection->distinct('numer_ankiety');
		return $result;
	}

	public function logInUser($userData){
		$sTime = time();

		$cursor = $this->usersCollection->findOne(array('username'=> $userData['username'], 'password'=> $userData['password']));
		empty($userExists);
		$userExists = iterator_to_array($cursor);

		if(!empty($userExists)) {
			$sessionToken = uniqid($name, true);
			$ret = $this->sessionInfo->insertOne(array('sessionToken' => $sessionToken, 'begin' => $sTime));
		} else {
			$ret = false;
		}
		return $sessionToken;
	}

	public function logOutUser($session){
		$cursor = $this->sessionInfo->findOne(array('sessionToken' => $session['sessionToken']));
		empty($tokenExists);
		$tokenExists = iterator_to_array($cursor);
		if(!empty($tokenExists)) {
      $this->sessionInfo->deleteMany(['sessionToken' => $session['sessionToken']]);
			return true;
		} else {
			return false;
		}
	}

	public function registerUser($newUser) {
		$cursor = $this->usersCollection->find(array('username' => $newUser['username']));
		empty($userExists);
		$userExists = iterator_to_array($cursor);
		if(!empty($userExists)){
			return false;
		} else {
			$ret = $this->usersCollection->insertOne($newUser);
			return $ret;
		}
	}

	function delete() {
		$this->dbCollection->deleteMany(['numer_ankiety' => 1]);
		$this->dbCollection->deleteMany(['numer_ankiety' => 2]);
		$this->dbCollection->deleteMany(['numer_ankiety' => 3]);
		echo "deleted";
	}
}
