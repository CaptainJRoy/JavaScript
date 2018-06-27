var sessCreat_json;
var sessCreat_ready = false;
var server_port = ":8081";

let session = {};
let elementGlobal;
var serverIP = "http://127.0.0.1:8081";
var d = window.location.href;
var crypt;


function initQRCode(element) {
  //1 - Inicializar variaveis
  elementGlobal = element;
  session = {};
  //http://asecuritysite.com/encryption/js05
  crypt = new JSEncrypt();

  crypt.setPrivateKey($('#privkey').val());
  var pubkey = $('#pubkey').val();
  if(!pubkey) $('#pubkey').val(crypt.getPublicKey());

  //2 - Gera parametro acordo chaves
  var params = { 'client_key':crypt.getPublicKey() }
  params = JSON.stringify(params);
  session['client_key'] = crypt.getPublicKey();
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

  //4 - Gera QR (utilizar chaves partilhadas e afins)
  var qrcode = new QRCode(document.getElementById(elementGlobal), {
    width : window.innerWidth/4,
    height : window.innerWidth/4
  });
  qrcode.makeCode(session['id'] + "");

  //5 - Verificar se credenciais já foram enviadas pela app
  verifyCredentials(credentialsCallback, serverIP + '/session/' + session["id"]);
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
  //1min para app ler QR
  setTimeout(() => {cont = false;}, 60000);
  if(cont) {
    credentials = JSON.parse(value);
    if(credentials["user"] && credentials["password"]) {
      //6 - recebe credenciais e valida (se incorretas, login falha)
      session["user"] = crypt.decrypt(credentials["user"]);
      session["password"] = crypt.decrypt(credentials["password"]);
      if(session['user'] == null || session['password'] == null) alert("Invalid credentials!");
      console.log('Received: ' + JSON.stringify(credentials));
      finalizeAndFill();
    }
    else {
      setTimeout(() => {
        verifyCredentials(credentialsCallback, serverIP + '/session/' + session["id"]);
        //verify each second
      }, 1000);
    }
  }
}


function finalizeAndFill() {
  document.getElementById("user").value = session["user"];
  document.getElementById("pass").value = session["password"];
  setTimeout(() => {document.getElementById("btn").click();}, 1500);
}
