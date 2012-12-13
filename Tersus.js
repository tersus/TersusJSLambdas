//Libraries to easily use the REST Api of Tersusland.com
//Generally you want to include theese libraries in your
//javascript application to aviod the hassle of dealing
//with network manually.

document.tersus = new Object();

function onLoad(){

}

var APP_SEPARATOR = "/r/";

function fetchAppName(){

    var sepIndex = document.URL.lastIndexOf(APP_SEPARATOR);
    var choopedURL = document.URL.substr(sepIndex + APP_SEPARATOR.length);
    var nextSlash = choopedURL.indexOf("/");
    document.tersus.application = choopedURL.substr(0,nextSlash);
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
document.tersus.MSG_URL_EV = "/service/message/receiveEv"

//Appkey url parameter
document.tersus.APPKEY_ARG = "appkey"

//Url to deliver messages
document.tersus.SEND_MSG_URL = "/service/message/send";

document.tersus.MSG_RESULT = {'Delivered':'Delivered', 'ENoAppInstance':'ENoAppInstance','EInvalidAppKey':'EInvalidAppKey','EBufferFull':'EBufferFull','EInvalidHashCode':'EInvalidHashCode','InvalidMsgFormat':'InvalidMsgFormat','MsgTimeout':'MsgTimeout'};

//Creates a url to request a message
document.tersus.makeMsgUrl = function(){

    return document.tersus.MSG_URL + "?" + document.tersus.APPKEY_ARG + "=" + document.tersus.access_key;
}

//Creates a url to request a message using Comet
document.tersus.makeMsgUrlEv = function(){

    return document.tersus.MSG_URL_EV + "?" + document.tersus.APPKEY_ARG + "=" + document.tersus.access_key;
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
    fetchAppName();

    //Check if Event Sources are supported in the browser and use them if so
    if(window.EventSource){
	document.tersus.eventSource = new EventSource(document.tersus.makeMsgUrlEv());
	document.tersus.eventSource.addEventListener('message',document.tersus.eventSourceMessageHandler,false);
    }else{
	msgRequest = document.tersus.mkRequestWithCallback(document.tersus.makeMsgUrl(),REQUEST_METHODS.GET,document.tersus.messageHandler,true);
	msgRequest.send(null);
    }
}

document.tersus.timeoutFunction = function(request){

    request.abort();
    document.tersus.initMessaging();
}

document.tersus.eventSourceMessageHandler = function(event){

    document.tersus.dispatchMessages(event.data);
}

document.tersus.dispatchMessages = function(msgs){
    
    var messages = eval(unescape(msgs));

    for(var i=0;i<messages.length;i++){

	if(document.tersus.REGISTERED_CALLBACKS[messages[i].userSender]){

	    document.tersus.REGISTERED_CALLBACKS[messages[i].userSender](messages[i]);
	}else
	    document.tersus.DEFAULT_CALLBACK(messages[i]);
    }
}

//Handle messages, dispatch the message to the appropiate
//callback function.
document.tersus.messageHandler = function(request){


    if(request.readyState == 4 && request.status == 200){
	clearTimeout(request.timeout);

	result = eval(request.responseText);

	if(result == document.tersus.MSG_RESULT.MsgTimeout){
	    
	    document.tersus.initMessaging();
	    return;
	}

	if(result == document.tersus.MSG_RESULT.EInvalidAppKey){
	    
	    alert('The provided appkey is invalid.');
	}

	document.tersus.dispatchMessages(request.responseText);
	
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
    
    if(users.length < 1)
	return;
    
    var msgRequest = document.tersus.mkRequestWithCallback(document.tersus.SEND_MSG_URL,REQUEST_METHODS.POST,document.tersus.sendCallbackWrapper(callback),true);

    msgs = document.tersus.makeMessages(users,toApp,message);

    msgRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    params = MSGS_ARG + '=' + escape(JSON.stringify(msgs));
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

document.tersus.writeFile = function (path,text,callback){
    if (typeof document.tersus.username === 'undefined')
        fetchUser();
    if (typeof document.tersus.access_key === 'undefined')
        fetchAccessKey();

    $.ajax({
          url: '/file/'+tersus.user.username+'/'+path+"/?access_key="+document.tersus.access_key
        , type: 'PUT'
        , data: { 
            content: text 
        }
        , success: callback
    });
}

var FILE_ERRORS = {'NOT_FOUND' : 'NOT_FOUND'};

document.tersus.getFile = function(path,callback,optional){
    if (typeof document.tersus.username === 'undefined')
        fetchUser();
    if (typeof document.tersus.access_key === 'undefined')
        fetchAccessKey();

    var req = new Object();
    req.async = false;
    req.url = '/file/'+tersus.user.username+'/'+path+'?access_key='+document.tersus.access_key;
    req.type = 'GET';
    req.success = function(data,status,jqXHR){callback(data);};

    if(optional && optional.errorCallback)
	req.error = function(e){optional.errorCallback(FILE_ERRORS.NOT_FOUND);};

    $.ajax(req);
}

var fetchUser = function(){
    getJSONSync('/api/user', function(user){
        document.tersus.user = user;
    });
}

/*
 * Makes a PUT request to add a permission to a file
 *
 * `path` is a file path.
 * `username` is the username that gets the permission type over `path`
 * `permissionType` the type of permission, a member of tersus.permissions
 */
document.tersus.addPermission = function (path,username,permissionType,callback){
    if (typeof document.tersus.username === 'undefined')
        fetchUser();
    if (typeof document.tersus.access_key === 'undefined')
        fetchAccessKey();

    if (permissionType != "READ" && permissionType != "WRITE" && permissionType != "")
        
    $.ajax({
        url: '/permission/file/'+permissionType.uri+'/'+username+'/'+path+"/?access_key="+document.tersus.access_key
        , type: 'PUT'        
        , success: callback
    });
}

// ****************************************
//  SECTION: PERMISSIONS
// ****************************************

document.tersus.permissions = { 
    read: {uri: 'READ'}, 
    write: {uri: 'WRITE'}, 
    share: {uri: 'SHARE'}    
};

// ****************************************
//  SECTION: GLOBAL VARIABLES
// ****************************************

//The url argument to which the access key is referenced
document.tersus.accessKeyArg = "access_key";

//The url argument for the startup arguments
document.tersus.argvArg = "argv";

//Regular expression used to match the access key in the url
document.tersus.accessKeyRegexp = new RegExp(document.tersus.accessKeyArg+"=[^&/]+","i");

//Regular expression used to match the startup arguments in the url
document.tersus.argvRegexp = new RegExp(document.tersus.argvArg+"=[^&]+","i");

//Function used to retrieve the startup arguments sent to this application
document.tersus.getArgv = function(){

    var params = document.tersus.argvRegexp.exec(window.location.toString());
    if(params && params.length > 0){
	var argStr = params[0].replace(document.tersus.argvArg+"=","");
	return decodeURI(argStr).split(" ");
    }
    
    return [];
}

var getURLParameter = function(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}

//Load the access key from the url
function fetchAccessKey(){
    document.tersus.access_key = getURLParameter("access_key");
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

