var sessCreat_json;
var sessCreat_ready = false;
var server_port = ":8081";

let session = {};
let elementGlobal;
var serverIP = "http://127.0.0.1:8081";
var d = window.location.href;


function initQRCode(element) {
  //1 - Inicializar variaveis
  elementGlobal = element;
  session = {};

  //2 - Gera parametro acordo chaves???
  var params = {'domain':d,'client_key':'test_key'}
  params = JSON.stringify(params);
  httpSessCreat(sessCreatCallback, serverIP + '/sessionCreator', params);
  setTimeout(() => {
    if(sessCreat_ready == false) alert("Unable to connect to API-Server!");
    sessCreat_ready = false;
  }, 10000);
}


function httpSessCreat(callback, url, params) {
  var http = new XMLHttpRequest();

  console.log("URL sent: " + url);
  console.log("Params sent: " + params);
  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) callback(http.response);
  }
  http.open('POST', url, true);
  http.setRequestHeader("Content-type", "application/json");
  http.send(params);
}


function sessCreatCallback(value) {
  //3 - recebe: nonce, id, pAcordoChave
  sessCreat_json = JSON.parse(value);
  sessCreat_ready = true;
  session["id"] = sessCreat_json['session'];
  console.log("Session: " + session);

  //4 - Gera QR (utilizar chaves partilhadas e afins)
  var qrcode = new QRCode(document.getElementById(elementGlobal), {
    width : window.innerWidth/4,
    height : window.innerWidth/4
  });
  qrString = JSON.stringify(geraString(session["id"]));
  qrcode.makeCode(qrString);

  //5 - Verificar se credenciais já foram enviadas pela app
  verifyCredentials(credentialsCallback, serverIP + '/session/' + session["id"]);

  /*
    6 - recebe credenciais e valida
        credenciais = retorno função callback
  */
}


function geraString(id) {
  let s = {
            'domain': d,
            'id':     id
          };
  return s;
}


function verifyCredentials(callback, url) {
  var http = new XMLHttpRequest();
  http.onreadystatechange = function() {
      if (http.readyState == 4 && http.status == 200)
          callback(http.responseText);
  }
  http.open("GET", url, true); //true for asynchronous
  http.setRequestHeader("Content-type", "application/json");
  http.send(null);
}


var cont = true;
function credentialsCallback(value) {
  //5.1 - ciclo de chamadas ao servidor API para verificar credenciais
  setTimeout(() => {cont = false;}, 5000);
  if(cont) {
    credentials = JSON.parse(value);
    if(credentials["user"] && credentials["password"]) {
      console.log(credentials);
      session["user"] = credentials["user"];
      session["password"] = credentials["password"];
      finalizeAndFill();
    }
    else {
      setTimeout(() => {
        verifyCredentials(credentialsCallback, serverIP + '/session/' + session["id"]);
      }, 1000);
    }
  }
}


function finalizeAndFill() {
  document.getElementById("user").value = session["user"];
  document.getElementById("pass").value = session["password"];
  setTimeout(() => {document.getElementById("btn").click();}, 1000);
}
