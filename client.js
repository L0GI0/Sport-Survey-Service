var indexedDb = window.indexedDB||window.webkitIndexedDB||window.mozIndexedDB||window.msIndexedDB;
var idDbRequest = indexedDb.open("ankietyDataBase", 3);

idDbRequest.onupgradeneeded = function (event) {
 	db = event.target.result;
 	var store = db.createObjectStore("ankiety", { keyPath: "id", autoIncrement: true });
 	store.createIndex("numer_ankiety", "numer_ankiety");
 	store.createIndex("odpowiedzi", "odpowiedzi", { unique: false });
};

idDbRequest.onsuccess = function(event) {
   db = event.target.result;
};

function insertDataOffline() {
  var data = {};
	data.numer_ankiety = 2;
  data.odpowiedzi = answers.join([separator = ',']);

  var dbTransaction = db.transaction(["ankiety"], "readwrite");
  var objStore = dbTransaction.objectStore("ankiety");
	var objStoreRequest = objStore.add(data);

	console.log("objStore:", objStore)
	objStoreRequest.onsuccess = function(event) {
		answers = [];
    alert("Dodano dane do bazy przeglądarki");
  };
}

function readDataOffline(number) {
	var fResult = [];

	var dbTransaction = db.transaction("ankiety", "readwrite");
	var objStore = dbTransaction.objectStore("ankiety");

	objStore.openCursor().onsuccess = function (event) {
		var result = event.target.result;
		if (result) {
			if (parseInt(result.value.numer_ankiety) == number) {
				fResult[fResult.length] = result.value.odpowiedzi.split(",");
			}
			result.continue();
		} else {
			showData(fResult);
		}
	};
}


var basePath = "http://pascal.fis.agh.edu.pl/~7pabjan";

function getRequestObject() {
  if (window.ActiveXObject) {
    return (new ActiveXObject("Microsoft.XMLHTTP"));
  } else if (window.XMLHttpRequest) {
    return (new XMLHttpRequest());
  } else {
    return (null);
  }
}

function setCookies(value) {
  document.cookie = "sessionToken=" + value + "; path=/";
}

function getSessionCookie() {
	var toLoad;
	var cookies;

	cookies = document.cookie.split(';');
	for (var i = 0; i < cookies.length; i++) {
		toLoad = cookies[i];
		while (toLoad.charAt(0) == ' ') {
			toLoad = toLoad.substring(1, toLoad.length);
		}
		if (toLoad.indexOf("sessionToken=") == 0) {
			return toLoad.substring("sessionToken=".length, toLoad.length);
		}
	}
	return "";
}

function insertDataOnline() {
  var data = {};
  data.numer_ankiety = questionnaireNumber;
  data.odpowiedzi = answers.join([separator = ',']);

  toSend = JSON.stringify(data);

  var dbTransaction = db.transaction("ankiety", "readwrite");
  var objStore = dbTransaction.objectStore("ankiety");
  var objStoreRequest = objStore.add(data);

  var key = 0;
  objStoreRequest.onsuccess = function(event) {
		key = event.target.result;
  };

  request = getRequestObject();
  request.onreadystatechange = function() {
    if (request.readyState == 4 && request.status == 200) {
      objJSON = JSON.parse(request.response);
      if (objJSON['status'] == 'OK') {
        alert("Pomyślnie przesłano odpowiedzi na ankietę.");
        dbTransaction = db.transaction("ankiety", "readwrite");
        objStore = dbTransaction.objectStore("ankiety");
        objStore.delete(key);
				answers = [];
      } else {
        alert("Wystąpił błąd podczas dodawania danych!");
      }
    } else if (request.readyState == 4 && request.status == 400) {
      alert("Wprowadzone niepoprawne dane!");
    } else if (request.readyState == 4 && request.status == 500) {
      alert("Dane dodano wyłącznie lokalnie, ponieważ wystąpił błąd połączenia z siecią.");
    }
  }
  request.open("POST", basePath + "/projekt2/rest/saveData", true);
  request.send(toSend);
}

function readDataOnline() {
	var fResult = [];

	req = getRequestObject();
	req.onreadystatechange = function () {
		if (req.readyState == 4 && req.status == 200) {
			objJSON = JSON.parse(req.response);
			for (var id in objJSON) {
				if (objJSON[id]["numer_ankiety"] == questionnaireNumber) {
					fResult[fResult.length] = objJSON[id]["odpowiedzi"].split(",");
				}
			}
			showData(fResult);
		}

	}
	req.open("GET", basePath + "/projekt2/rest/list", true);
	req.send(null);
}

function synchronizeData() {
  var dbTransaction = db.transaction("ankiety", "readwrite");
  var objStore = dbTransaction.objectStore("ankiety");

  objStore.openCursor().onsuccess = function(event) {
    var result = event.target.result;
    if (result) {
      var data = {};
      data.numer_ankiety = result.value.numer_ankiety;
      data.odpowiedzi = result.value.odpowiedzi;

      toSend = JSON.stringify(data);
      request = getRequestObject();
      request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
          objJSON = JSON.parse(request.response);
          if (objJSON['status'] == 'OK') {
            alert("Pomyślnie zsynchronizowano dane.");
          } else {
	          alert("Wystąpił błąd podczas synchronizacji danych!");
	        }
        }
      }

      request.open("POST", basePath + "/projekt2/rest/saveData", true);
      request.send(toSend);
      result.delete();
      result.continue();
    }
  };
}

function logInIfSessionSaved() {
  var data = {};
  var sessionToken = getSessionCookie();
	if (sessionToken != "") {
	  data.sessionToken = sessionToken;
	  toSend = JSON.stringify(data);

	  request = getRequestObject();
	  request.onreadystatechange = function() {
	    if (request.readyState == 4 && (request.status == 400 || request.status == 200)) {
	      objJSON = JSON.parse(request.response);
	      if (objJSON['status'] == 'OK') {
	        setUserLoggedIn();
	      } else {
	        setUserLoggedOut();
	      }
	    }
	  }
	  request.open("POST",  basePath + "/projekt2/rest/sessionToken", true);
	  request.send(toSend);
	} else {
			setUserLoggedOut();
	}
}

function logInOrRegister(element) {
  var data = {};
  data.username = document.getElementById('iUsername').value;
  data.password = document.getElementById('iPassword').value;

  if (data.username == "" || data.password == "") {
    alert("Uzupełnij nazwę użytkownika i hasło.");
    return;
  }

  toSend = JSON.stringify(data);
  request = getRequestObject();

  request.onreadystatechange = function() {
    if (request.readyState == 4 && request.status == 200) {
      objJSON = JSON.parse(request.response);
      if (objJSON['status'] == 'OK') {
        if (element.innerHTML == "Zaloguj się") {
          setCookies(objJSON['sessionToken']);
          synchronizeData();
					setUserLoggedIn();
        } else {
          alert("Pomyślnie zarejestrowano użytkownika.");
        }
      } else {
        if (element.innerHTML == "Zaloguj się") {
          alert("Nazwa użytkownika lub hasło są niepoprawne.");
        } else {
          alert("Nazwa użytkownika jest już używana.");
        }
      }
    }
  }

  if (element.innerHTML == "Zaloguj się") {
    request.open("POST", basePath + "/projekt2/rest/logInUser", true);
  } else {
    request.open("POST", basePath + "/projekt2/rest/registerUser", true);
  }
  request.send(toSend);
}

function logOut() {
  var sessionToken = getSessionCookie();
  var data = {};
  data.sessionToken = sessionToken;

  toSend = JSON.stringify(data);
  request = getRequestObject();

  request.onreadystatechange = function() {
    if (request.readyState == 4 && request.status == 200) {
      objJSON = JSON.parse(request.response);
      if (objJSON['status'] == 'OK') {
        setUserLoggedOut();
      }
    }
  }
  request.open("POST", basePath + "/projekt2/rest/logOutUser", true);
  request.send(toSend);
}


/*var idDbRequest;
var db;*/

var answers = [];
var questionnaireNumber = 0;

var userLoggedIn = false;

function init() {
  var navTypes = document.getElementsByClassName("nav-element");
  for (var i = 0; i < navTypes.length; i++) {
    navTypes[i].addEventListener("click", function() {
      onNavElementClick(this);
    });
  }
	document.getElementById('lLogInOrSignIn').style.display = "none";
	logInIfSessionSaved();
}

function zamknijLogowanie(){

  document.getElementById('sportQuestContainer').style.display = "none";
  document.getElementById('sportDataContainer').style.display = "none";
  document.getElementById('mainDiv').style.display = "block";
  document.getElementById('logInOrSignInContainer').style.display = "none";
  document.getElementById('logInOrSignInContainer').style.display = "none";

}

function zamknijAnkiete(){
  document.getElementById('sportQuestContainer').style.display = "none";
  document.getElementById('sportDataContainer').style.display = "none";
  document.getElementById('mainDiv').style.display = "block";
  document.getElementById('logInOrSignInContainer').style.display = "none";

}

function showStatistics(){
    console.log("show_stats");
    questionnaireNumber = 2;
    readData();
    console.log("setting block display");
    document.getElementById('sportDataContainer').style.display = "block";
    document.getElementById('mainDiv').style.display = "none";
    document.getElementById('sportQuestContainer').style.display = "none";
    document.getElementById('logInOrSignInContainer').style.display = "none";

}

function closeStatistics(){

    document.getElementById('sportDataContainer').style.display = "none";
    document.getElementById('mainDiv').style.display = "block";
    document.getElementById('sportQuestContainer').style.display = "none";
    document.getElementById('logInOrSignInContainer').style.display = "none";

}

function zamknijAnkiete(){

  document.getElementById('sportQuestContainer').style.display = "none";
  document.getElementById('sportDataContainer').style.display = "none";
  document.getElementById('mainDiv').style.display = "block";
  document.getElementById('logInOrSignInContainer').style.display = "none";

}

function logowanie(){

  document.getElementById('mainDiv').style.display = "none";
  document.getElementById('logInOrSignInContainer').style.display = "block";
  document.getElementById('sportQuestContainer').style.display = "none";

}

function pokazAnkiete(){

  document.getElementById('sportQuestContainer').style.display = "block";
  document.getElementById('sportDataContainer').style.display = "none";
  document.getElementById('mainDiv').style.display = "none";
  document.getElementById('logInOrSignInContainer').style.display = "none";

}

function checkIfLogged(){
  logInIfSessionSaved();
  console.log(userLoggedIn);
  if(userLoggedIn){
    document.getElementById('mainDiv').innerHTML = '<a onclick="showStatistics()" class="mainbutton mainbutton-4 mainbutton-sep icon-options">Statystyki</a><br>';
    document.getElementById('mainDiv').innerHTML += '<a onclick="pokazAnkiete()" class="mainbutton mainbutton-4 mainbutton-sep icon-info">Dodaj ankiete</a><br>';
    document.getElementById('mainDiv').innerHTML += '<a  class="mainbutton mainbutton-2 mainbutton-sep icon-add" onclick="logOut()"> Wyloguj sie</a><br></nav>';
  }else{
    document.getElementById('mainDiv').innerHTML = '<a onclick="logowanie(); changetypeToLogin()" class="mainbutton mainbutton-2 mainbutton-sep icon-add" id="logInButton">Zaloguj sie</a><br>';
    document.getElementById('mainDiv').innerHTML += '<a onclick="showStatistics()" class="mainbutton mainbutton-4 mainbutton-sep icon-options">Statystyki</a><br>';
    document.getElementById('mainDiv').innerHTML += '<a onclick="pokazAnkiete()" class="mainbutton mainbutton-4 mainbutton-sep icon-info">Dodaj ankiete</a><br>';

  }
}



function onNavElementClick(element) {
  clearContainers();

  switch (element.id) {
    case "lLogInOrSignIn":
      document.getElementById('logInOrSignInContainer').style.display = "block";
      document.getElementById('signUpLink').style.display = "block";
      document.getElementById('signUpOrLogInTitle').innerHTML = "Zaloguj się";
      document.getElementById('btnSignUpOrLogIn').innerHTML = "Zaloguj się";
      break;
		case "lLogOut":
			logOut();
	    break;
    case "lReadingQuest":
      document.getElementById('readingQuestContainer').style.display = "block";
      questionnaireNumber = 1;
      break;
    case "lSportQuest":
      document.getElementById('sportQuestContainer').style.display = "block";
      questionnaireNumber = 2;
      break;
    case "lEatingQuest":
      document.getElementById('eatingQuestContainer').style.display = "block";
      questionnaireNumber = 3;
      break;
    case "lReadingData":
      document.getElementById('readingDataContainer').style.display = "block";
      questionnaireNumber = 1;
      readData(element);
      break;
    case "lSportData":
      document.getElementById('sportDataContainer').style.display = "block";
      questionnaireNumber = 2;
      readData(element);
      break;
    case "lEatingData":
      document.getElementById('eatingDataContainer').style.display = "block";
      questionnaireNumber = 3;
      readData(element);
      break;
    default:
      document.getElementById('homePage').style.display = "block";
      break;
  }
}

// function clearContainers() {
//   var containers = document.getElementsByClassName("page-content");
//   for (var i = 0; i < containers.length; i++) {
//     containers[i].style.display = "none";
//   }
// }

function changetypeToRegister(element) {
  document.getElementById('signUpLink').style.display = "none";
  document.getElementById('signUpOrLogInTitle').innerHTML = "Zarejestruj się";
  document.getElementById('btnSignUpOrLogIn').innerHTML = "Zarejestruj się";
}

function changetypeToLogin(){
  document.getElementById('signUpOrLogInTitle').innerHTML = "Zaloguj się";
  document.getElementById('btnSignUpOrLogIn').innerHTML = "Zaloguj się";
}


function validateData(element) {
  console.log(element);
  var elements;
  var toCheck;
  var checked = [0, 0, 0, 0, 0];

  switch (element.id) {
    case "btnReadingQuest":
      elements = document.querySelectorAll('input[name$="-answer-reading"]');
      toCheck = 5;
      break;
    case "btnSportQuest":
      elements = document.querySelectorAll('input[name$="-answer-sport"]');
      toCheck = 5;
      break;
    case "btnEatingQuest":
      elements = document.querySelectorAll('input[name$="-answer-eating"]');
      toCheck = 4;
      break;
  }

  for (var i = 0; i < elements.length; i++) {
    if (elements[i].checked) {
      answers[answers.length] = elements[i].value;
      checked[parseInt(elements[i].name.substring(0, 1)) - 1] = 1;
    }
  }

  checked = checked.reduce(function(previousValue, currentValue, index, array) {
    return previousValue + currentValue;
  });

  if (checked != toCheck) {
    return false;
  }
  return true;
}

function insertData(element) {
  if (validateData(element)) {
    if (userLoggedIn) {
      insertDataOnline();
    } else {
      insertDataOffline();
    }
  } else {
    alert("Wszystkie odpowiedzi muszą być wypełnione!");
  }
}

function readData() {
  answersToShow = [];

  if (userLoggedIn) {
    readDataOnline();
  } else {
    console.log("readingOffline")
    answersToShow = readDataOffline(questionnaireNumber);
  }
}


var colorWhite = "#FFFFFF";
var colorLightGreen = "#ecf0f1";
var colorMiddleGreen = "#b3b6b7";
var colorGreen = "#7b7d7d";

var percentWidth = 60;

function showData(savedAnswers) {
  var elements;
  var summedAnswers = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];

  switch (questionnaireNumber) {
    case 1:
      elements = document.querySelectorAll('canvas[id$="-reading-canvas"]');
      break;
    case 2:
      elements = document.querySelectorAll('canvas[id$="-sport-canvas"]');
      break;
    case 3:
      elements = document.querySelectorAll('canvas[id$="-eating-canvas"]');
      break;
  }

  for (var i = 0; i < savedAnswers.length; i++) {
    for (var j = 0; j < savedAnswers[i].length; j++) {
      summedAnswers[parseInt(savedAnswers[i][j].substring(0, 1)) - 1][parseInt(savedAnswers[i][j].substring(2, 3)) - 1]++;
    }
  }

  for (var i = 0; i < elements.length; i++) {
		ctx = elements[i].getContext('2d');
		var width = parseInt(window.getComputedStyle(elements[i].parentElement, null).width) - 220;
		var colHeight = parseInt(window.getComputedStyle(elements[i], null).height) / 4;

		ctx.canvas.width = width;

		for (var j = 0; j < summedAnswers[i].length; j++) {
			var max = Math.max(
				summedAnswers[i][0],
				summedAnswers[i][1],
				summedAnswers[i][2],
				summedAnswers[i][3]
			);

			var colWidth = (width - percentWidth) / max * summedAnswers[i][j];

			ctx.fillStyle = createGradient(ctx, 10, j * colHeight + 2, width, colHeight);
			ctx.beginPath();
			ctx.rect(10, j * colHeight + 4, colWidth, colHeight - 4);
		  ctx.fill();

		  ctx.font = "normal 18px Helvetica";
		  ctx.fillStyle = "#FFFFFF";
		  ctx.fillText(summedAnswers[i][j], colWidth + 20, j * colHeight + colHeight/2 + 6);
    }
  }
}

function createGradient(ctx, x, y, width, height) {
  gd = ctx.createLinearGradient(x - 10, y - 20, width, height);

  gd.addColorStop(0, colorGreen);
  gd.addColorStop(0.5, colorMiddleGreen);
  gd.addColorStop(1, colorLightGreen);

  return gd;
}

function setUserLoggedIn() {    
	userLoggedIn = 1;
  document.getElementById('mainDiv').innerHTML = '<a onclick="showStatistics()" class="mainbutton mainbutton-4 mainbutton-sep icon-options">Statystyki</a><br>';
  document.getElementById('mainDiv').innerHTML += '<a onclick="pokazAnkiete()" class="mainbutton mainbutton-4 mainbutton-sep icon-info">Dodaj ankiete</a><br>';
  document.getElementById('mainDiv').innerHTML += '<a  class="mainbutton mainbutton-2 mainbutton-sep icon-add" onclick="logOut()"> Wyloguj sie</a><br></nav>';
  zamknijLogowanie();
}

function setUserLoggedOut() {
	setCookies('');

  console.log("setting user log out");
	userLoggedIn = 0;
  document.getElementById('mainDiv').innerHTML = '<a onclick="logowanie(); changetypeToLogin()" class="mainbutton mainbutton-2 mainbutton-sep icon-add" id="logInButton">Zaloguj sie</a><br>';
  document.getElementById('mainDiv').innerHTML += '<a onclick="showStatistics()" class="mainbutton mainbutton-4 mainbutton-sep icon-options">Statystyki</a><br>';
  document.getElementById('mainDiv').innerHTML += '<a onclick="pokazAnkiete()" class="mainbutton mainbutton-4 mainbutton-sep icon-info">Dodaj ankiete</a><br>';
}
