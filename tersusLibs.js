//Libraries to easily use the REST Api of Tersusland.com
//Generally you want to include theese libraries in your
//javascript application to aviod the hassle of dealing
//with network manually.

function onLoad(){

}

function getAppKey(){

    chunks = window.location.split("/");
    return chunks[chunks.length - 1];
}

function defaultCallback(msg){

}

var REGISTERED_CALLBACKS = [];
var DEFAULT_CALLBACK = defaultCallback;

function initMessaging(){

}