//Libraries to easily use the REST Api of Tersusland.com
//Generally you want to include theese libraries in your
//javascript application to aviod the hassle of dealing
//with network manually.

function onLoad(){

}

//Get the appkey of the current application
//from the URL
function getAppKey(){

    chunks = window.location.pathname.split("/");
    return chunks[chunks.length - 1];
}

//Function that is called by default when a message
//is received. The default action is ignoring the
//message
function defaultCallback(msg){

}

//List of all callback functions
var REGISTERED_CALLBACKS = [];

//The function to be executed when a
//message dosen't match any callback
//function
var DEFAULT_CALLBACK = defaultCallback;

//Response obtained when a invalid app
//key is used to get messages
var INVALID_KEY = "EInvalidAppKey"

//URL of the messaging receiving service
var MSG_URL = "/service/message/receive"

//Appkey url parameter
var APPKEY_ARG = "appkey"

//Creates a url to request a message
function makeMsgUrl(){

    return MSG_URL + "?" + APPKEY_ARG + "=" + getAppKey();    
}

//Begin listening to messages, handle them as they arrive
function initMessaging(){

    msgRequest = new XMLHttpRequest();
    msgRequest.open("GET",makeMsgUrl());
    msgRequest.onreadystatechange = function(){messageHandler(msgRequest)};
    msgRequest.send(null);
}

//Handle messages, dispatch the message to the appropiate
//callback function.
function messageHandler(request){


    if(request.readyState == 4 && request.status == 200){
	messages = eval(eval(request.responseText));

	for(i=0;i<messages.length;i++){

	    if(REGISTERED_CALLBACKS[messages[i].userSender]){

		REGISTERED_CALLBACKS[messages[i].userSender](messages[i]);
	    }else
		DEFAULT_CALLBACK(messages[i]);
	}

	initMessaging();
    }
}

//Register callback functions by user
//Return true on successful callback registration
//and return false if the callback cannot be registered
function registerCallback(user,fun){

    if(fun instanceof Function){
	REGISTERED_CALLBACKS[user] = fun;
	return true;
    }
    
    return false;
}

function unregisterCallback(user){

    REGISTERED_CALLBACKS[user] = undefined;
}

function registerDefaultCallback(fun){

    if(fun instanceof Function){
	DEFAULT_CALLBACK = fun;
	return true;
    }

    return false;
}