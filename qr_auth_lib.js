var server_json_response;
var ready_post = false;
var server_port = ":8081";

function initQRCode(element) {
  //1 - Inicializar variaveis
  var serverIP = "http://127.0.0.1";
  var qrcode = new QRCode(document.getElementById(element), {
    width : window.innerWidth/4,
    height : window.innerWidth/4
  });
  var d = window.location.href;


  //2 - Gera parametro acordo chaves
  //identificador de cliente temporário
  timestamp_milis = Date.now();
  rand_id = Math.floor(Math.random()*1000000);
  temp__id = "" + timestamp_milis + "&" + rand_id;
  httpPostAsync(serverIP, post_callback + '/sessionCreator/', d, temp__id);

  setTimeout(self_check_postReq, 100);
  //Problema?
  //while(!ready_post);
  server_json_response = '{"nonce":111111, "session_id":123, "handshake":1}';


  //3 - recebe: nonce, id, pAcordoChave
  var jquery_array = JSON.parse(server_json_response);
  var nonce = jquery_array['nonce'];
  var session_id = jquery_array['session_id'];
  var sharedKey = jquery_array['handshake'];


  //4 - Gera QR
  qrString = geraString(d, nonce, session_id, sharedKey);
  qrcode.makeCode(qrString);

  /*
    5 - ciclo de chamadas ao servidor API para verificar credenciais
        tempo de reprobe = 1s
        function httpGetAsync(url, callback) {
            var http = new XMLHttpRequest();
            http.onreadystatechange = function() {
                if (http.readyState == 4 && http.status == 200)
                    callback(http.responseText);
            }
            http.open("GET", theUrl, true); //true for asynchronous
            http.send(null);
        }
        //função de callback lida com resposta que pode ser um json
    6 - recebe credenciais e valida
        credenciais = retorno função callback
  */
}

function httpGetAsync(url, callback) {
    var http = new XMLHttpRequest({mozSystem: true});
    http.onreadystatechange = function() {
        if (http.readyState == 4 && http.status == 200)
            callback(http.responseText);
    }
    http.open("GET", theUrl + server_port, true); //true for asynchronous
    http.send(null);
}

function geraString(d, nonce, id, sK) {
  return d + "<|>" + nonce + "<|>" + id + "<|>" + sK;
}

function self_check_postReq() {
  if(server_json_response)
    setTimeout(self_check_postReq, 1000);
  else ready_post = true;
}

function post_callback(value) {
  console.log(value);
  server_json_response = value;
  ready_post = true;
}


function httpPostAsync(theUrl, callback, domain, client) {
    var http = new XMLHttpRequest({mozSystem: true});
    var params = server_port + "/domain=" + domain + "&client_key=" + client;

    http.onreadystatechange = function() {
        if (http.readyState == 4 && http.status == 201)
            callback(http.responseText);
        else {
          alert('Error occured');
          console.log('readyState == ' + http.readyState);
          console.log('Status == ' + http.status);
        }
    }
    http.open("POST", theUrl + params, true); //true for asynchronous
    //Send the proper header information along with the request
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.send(params);
}
