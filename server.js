"use strict";
var http = require('http');
var fs = require('fs');
var url = require('url');
var log = require('./stats.js');

var urlRegex = new RegExp("/([0-9]+)(/(.*))?");

function serveFile(res, filename){
    var fileStream = fs.createReadStream("./static/" + filename);
    fileStream.pipe(res); 
}

function badRequest(res){
    res.statusCode = 400;
    serveFile(res, "bad_request.html");    
}

function handle(req, res){
    log.logRequest(req);
    
    var result = urlRegex.exec(url.parse(req.url).pathname);
    if (!result || result == null) {
        return badRequest(res);
    }
    
    var atime = parseInt(result[1]),
        ctime = (new Date()).getTime(),
        redirect;
        
    if(atime === null || atime < 0){
        return badRequest(res);
    }
        
    if(result[3]){
        redirect = decodeURI(result[3]);
        try {
            var redirectUrl = url.parse(redirect);
            if(!redirectUrl.protocol) {
                redirect = "http://" + redirect;
            }
        } catch (e) {
            return badRequest(res);
        }
    }
       
    var resEvent = setTimeout(function(){
        if(redirect){
            res.statusCode = "302"
            res.setHeader("Location", redirect);
            res.end();
        } else {
            var rtime = (new Date()).getTime();
            var lag = rtime - ctime;
            res.setHeader('content-type', 'text/plain');
            res.end(lag.toString());
        }                
    }, atime);
    
    req.on("close", function(){
        clearTimeout(resEvent);
    });
}


var server = http.createServer(function(req,res){
    if(req.url === "/"){
        serveFile(res, "index.html");
    } else if(req.url === "/how") {
        serveFile(res, "how.html");
    } else if(req.url === "/why") {
        serveFile(res, "why.html");
    } else if(req.url === "/contact") {
        serveFile(res, "contact.html");
    } else if(req.url === "/style.css") {
        serveFile(res, "style.css");
    } else if(req.url === "/favicon.ico") {
        serveFile(res, "favicon.ico");
    } else {
        handle(req, res);
    }    
});

var port = process.env.PORT || 8080; 
server.listen(port, function(){
    console.info("started!");
});