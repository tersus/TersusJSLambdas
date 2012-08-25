//Libraries to easily use the REST Api of Tersusland.com
//Generally you want to include theese libraries in your
//javascript application to aviod the hassle of dealing
//with network manually.

document.tersus = new Object();

function onLoad(){

}

//******************************
//Messaging
//******************************

//Function that is called by default when a message
//is received. The default action is ignoring the
//message
function defaultCallback(msg){

}

//List of all callback functions
document.tersus.REGISTERED_CALLBACKS = [];

//The function to be executed when a
//message dosen't match any callback
//function
document.tersus.DEFAULT_CALLBACK = defaultCallback;

//Response obtained when a invalid app
//key is used to get messages
document.tersus.INVALID_KEY = "EInvalidAppKey"

//URL of the messaging receiving service
document.tersus.MSG_URL = "/service/message/receive"

//Appkey url parameter
document.tersus.APPKEY_ARG = "appkey"

//Url to deliver messages
document.tersus.SEND_MSG_URL = "/service/message/send";

document.tersus.MSG_RESULT = {'Delivered':'Delivered', 'ENoAppInstance':'ENoAppInstance','EInvalidAppKey':'EInvalidAppKey','EBufferFull':'EBufferFull','EInvalidHashCode':'EInvalidHashCode','InvalidMsgFormat':'InvalidMsgFormat'};

//Creates a url to request a message
document.tersus.makeMsgUrl = function(){

    return document.tersus.MSG_URL + "?" + document.tersus.APPKEY_ARG + "=" + document.tersus.access_key;
}

document.tersus.sendMsgUrl = function(){

    return document.tersus.SEND_MSG_URL;
}

var REQUEST_METHODS = {'GET':'GET','POST':'POST'};

document.tersus.mkRequestWithCallback = function(url,method,callback,async){

    var msgRequest = new XMLHttpRequest();
    msgRequest.open(method,url);
    msgRequest.onreadystatechange = function(){callback(msgRequest)};
    return msgRequest;
}

//Begin listening to messages, handle them as they arrive
document.tersus.initMessaging = function(){

    fetchAccessKey();

    msgRequest = document.tersus.mkRequestWithCallback(document.tersus.makeMsgUrl(),REQUEST_METHODS.GET,document.tersus.messageHandler,true);
    msgRequest.send(null);
}

//Handle messages, dispatch the message to the appropiate
//callback function.
document.tersus.messageHandler = function(request){


    if(request.readyState == 4 && request.status == 200){
	messages = eval(eval(request.responseText));

	for(i=0;i<messages.length;i++){

	    if(document.tersus.REGISTERED_CALLBACKS[messages[i].userSender]){

		document.tersus.REGISTERED_CALLBACKS[messages[i].userSender](messages[i]);
	    }else
		document.tersus.DEFAULT_CALLBACK(messages[i]);
	}

	document.tersus.initMessaging();
    }
}

//Register callback functions by user
//Return true on successful callback registration
//and return false if the callback cannot be registered
document.tersus.registerCallback = function(user,fun){

    if(fun instanceof Function){
	document.tersus.REGISTERED_CALLBACKS[user] = fun;
	return true;
    }
    
    return false;
}

document.tersus.unregisterCallback = function(user){

    document.tersus.REGISTERED_CALLBACKS[user] = undefined;
}

document.tersus.registerDefaultCallback = function(fun){

    if(fun instanceof Function){
	document.tersus.DEFAULT_CALLBACK = fun;
	return true;
    }

    return false;
}

document.tersus.makeMessages = function(users,toApp,message){

    msgs = [];

    for(i=0;i<users.length;i++){

	msgs.push(document.tersus.makeMessage(users[i],toApp,message));
    }

    return msgs;

}

//Create a AuthMessaging for message delivery
document.tersus.makeMessage = function(user,toApp,message){
    
    msg = new Object();
    msg.senderAppKey = document.tersus.access_key;
    msg.userReceiver = user;
    msg.appReceiver = toApp;
    msg.content = message;
    return msg;
}

var MSGS_ARG = 'messages';

document.tersus.sendMessageAsync = function(users,toApp,message,callback){

    var msgRequest = document.tersus.mkRequestWithCallback(document.tersus.SEND_MSG_URL,REQUEST_METHODS.POST,document.tersus.sendCallbackWrapper(callback),true);

    msgs = document.tersus.makeMessages(users,toApp,message);

    msgRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    params = MSGS_ARG + '=' + JSON.stringify(msgs);
    //msgRequest.setRequestHeader("Content-length", params.length);
    msgRequest.send(params);

}

document.tersus.sendCallbackWrapper = function(callback){

    return function(request){

	if(request.readyState == 4 && request.status == 200){

	    result = eval(request.responseText);
	    callback(result);
	}
    };
}

document.tersus.sendMessage = function(users,toApp,message){

    
}

// ****************************************
//  FILES
// ****************************************

document.tersus.writeFile = function (path,text){
    if (typeof document.tersus.username === 'undefined')
        fetchUser();
    if (typeof document.tersus.access_key === 'undefined')
        fetchAccessKey();

    $.post('/file/write/'+tersus.user.username+'/'+document.tersus.access_key+""+path, {content: text}, function(data) {
        alert("File written with result...: "+data)
    });
}

var fetchUser = function(){
    getJSONSync('/api/user', function(user){
        document.tersus.user = user;
    });
}

 /* Fetchs the access key from the URL. If you want to get
  * an access key, make a request to /api/access_key/${your app key}
  * this is meant to be run in the browser served by a tersus instance.
  */ 
function fetchAccessKey(){
    var lastSlash = document.URL.lastIndexOf("/");
    document.tersus.access_key = document.URL.substr(lastSlash+1);
}

function getJSONSync(url_,success_){
    $.ajax({
        url: url_,
        dataType: 'json',
        async: false,
        success: success_
    });
}

tersus = document.tersus


