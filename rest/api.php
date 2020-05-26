<?php
require '../vendor/autoload.php';

require_once("rest.php");
require_once("mongo.php");

class API extends REST {

    public $data = "";

    public function __construct(){
        parent::__construct();
				$this->db = new db();
    }

    public function processApi(){
    	$func = "_".$this->_endpoint ;
        if((int)method_exists($this,$func) > 0) {
            $this->$func();
        }
        else {
			$this->response('Page not found',404);
		}
    }

    private function _saveData(){
        if($this->get_request_method() != "POST")
            $this->response('',406);

        if(!empty($this->_request) ){
            try {
                $json_array = json_decode($this->_request,true);

                foreach ($json_array as $key => $value) {
                    if ($value == ''){
                        $result = array('status'=>'failed', 'msg' => 'Missing data');
                        $this->response($this->json($result), 400);
                    }
                }

                if($json_array['odpowiedzi'] == ""){
                    $result = array('status'=>'failed', 'msg' => 'Invalid data');
                    $this->response($this->json($result), 400);
                }

                if(!is_numeric($json_array['numer_ankiety']) || $json_array['numer_ankiety'] < 0){
                    $result = array('status'=>'failed', 'msg' => 'Invalid data');
                    $this->response($this->json($result), 400);
                }

                $res = $this->db->insert($json_array);
                if ($res) {
                    $result = array('status' => 'OK');
                    $this->response($this->json($result), 200);
                }
                else {
                    $result = array('status' => 'Could not add record');
                    $this->response($this->json($result), 200);
                }
            }
            catch (Exception $e) {
                $error = array('status' => "failed", "msg" => "Exception thrown");
                $this->response('', 400);
            }
        }
        else {
            $error = array('status' => "failed", "msg" => "Invalid data");
            $this->response($this->json($error), 400);
        }
    }

    private function _list() {
        if($this->get_request_method() != "GET"){
            $this->response('',406);
        }
        try{
            $result = $this->db->select();
            $this->response($this->json($result), 200);
        }
        catch (Exception $e) {
            $this->response('Could not select data', 400);
        }
    }

    private function _listQuest(){
        if($this->get_request_method() != "GET"){
            $this->response('',406);
        }
        try{
            $result = $this->db->selectQuest();
            $this->response($this->json($result), 200);
        }
        catch (Exception $e) {
            $this->response('', 400);
        }
    }

    private function _sessionToken(){
        if($this->get_request_method() != "POST")
            $this->response('',406);

        if(!empty($this->_request) ){
            try {
                $json_array = json_decode($this->_request,true);
                foreach ($json_array as $key => $value) {
                    if ($value == ''){
                        $result = array('status'=>'failed', 'msg' => 'Missing data');
                        $this->response($this->json($result), 400);
                    }
                }
                $res = $this->db->sessionToken($json_array);
                if ( $res ) {
                    $result = array('status' => 'OK');
                    $this->response($this->json($result), 200);
                }
                else{
                    $result = array('status' => 'Not logged in');
                    $this->response($this->json($result), 200);
                }
            }
            catch (Exception $e){
                $error = array('status' => "failed", "msg" => "Exception thrown");
                $this->response('', 400);
            }
        }
        else {
            $error = array('status' => "Failed", "msg" => "Invalid data");
            $this->response($this->json($error), 400);
        }

    }

    private function _registerUser(){
        if($this->get_request_method() != "POST")
            $this->response('',406);
        if(!empty($this->_request) ){
            try {
                $json_array = json_decode($this->_request,true);

                foreach ($json_array as $key => $value) {
                    if ($value == ''){
                        $result = array('status' => 'failed', 'msg' => 'Missing data');
                        $this->response($this->json($result), 400);
                    }
                }
                $res = $this->db->registerUser($json_array);
                if ( $res ) {
                    $result = array('status' => 'OK');
                    $this->response($this->json($result), 200);
                }
                else {
                    $result = array('status' => 'Username already exists');
                    $this->response($this->json($result), 200);
                }
            }
            catch (Exception $e) {
                $error = array('status' => "failed", "msg" => "Exception thrown");
                $this->response('', 400);
            }
        }
        else {
            $error = array('status' => "failed", "msg" => "Invalid data");
            $this->response($this->json($error), 400);
        }
    }

    private function _logInUser(){
        if($this->get_request_method() != "POST")
            $this->response('',406);
        if(!empty($this->_request) ){
            try {
                $json_array = json_decode($this->_request,true);

                foreach ($json_array as $key => $value) {
                    if ($value == ''){
                        $result = array('status' => 'failed', 'msg' => 'Missing data');
                        $this->response($this->json($result), 400);
                    }
                }

                $res = $this->db->logInUser($json_array);
                if ( $res ) {
                    $result = array('status' => 'OK', 'sessionToken'=>$res);
                    $this->response($this->json($result), 200);
                }
                else {
                    $result = array('status'=>'Wrong creditentials');
                    $this->response($this->json($result), 200);
                }
            }
            catch (Exception $e) {
                $error = array('status' => "failed", "msg" => "Exception thrown");
                $this->response('', 400);
            }
        }
        else {
            $error = array('status' => "failed", "msg" => "Invalid data");
            $this->response($this->json($error), 400);
        }
    }

    private function _logOutUser(){
        if($this->get_request_method() != "POST")
            $this->response('',406);
        if(!empty($this->_request)){
            try{
                $json_array = json_decode($this->_request,true);
                $res = $this->db->logOutUser($json_array);
                if ( $res ){
                    $result = array('status'=>'OK');
                    $this->response($this->json($result), 200);
                }
                else {
                    $result = array('status'=>'Wrong sessionToken');
                    $this->response($this->json($result), 200);
                }
            }
            catch (Exception $e) {
                $this->response('', 400) ;
            }
        }
        else{
            $error = array('status' => "failed", "msg" => "Could not log out user");
            $this->response($this->json($error), 400);
        }
    }

		private function _delete() {
			$this->db->delete();
		}

    private function json($data){
        if(is_array($data))
            return json_encode($data);
    }
}

$api = new API();
$api->processApi();

?>
