var http = require('http');
var fs = require('fs');

var routeRegex = new RegExp("/([0-9]+)(/.*)?$");

var waitingResponses = [];


function route(req, res){
    if(req.url === "/"){
        serveFile(res, "index.html");
    } else {
        handle(res, req);
    }
}

function handle(res, req){
    var decoded = decodeURI(req.url);
    var result = routeRegex.exec(decoded);
    if(result == null){
        res.statusCode = 400;
        serveFile(res, "bad_request.html");        
    } else {
        var atime = parseInt(result[1]),
            redirect = result[2],
            ctime = (new Date()).getTime();

        if(redirect){
            redirect = redirect.substring(1, redirect.length);
        }

        if(atime === null || atime < 0) {
            res.statusCode = 400;
            serveFile(res, "bad_request.html");
        } else {
            var rtime = ctime + atime;
    
            var entry = {
                "client": req.connection.remoteAddress,
                "res": res,
                "rtime": rtime,
                "ctime": ctime,
                "redirect": redirect,
                "active": true
            };
            
            req.on("close", function(){
                entry.active = false;
            });
            
            waitingResponses.push(entry);
        }
    }    
}

function serveFile(res, filename){
    var fileStream = fs.createReadStream(filename);
    fileStream.pipe(res);
}

var server = http.createServer(route);
var port = process.env.PORT || 8080; 
server.listen(port, function(){
    console.info("started!");
    findNextResponse();
});

function findNextResponse(){
    var ctime = (new Date()).getTime();
    
    var inactive = [];
    
    for(var i in waitingResponses){
        var current = waitingResponses[i];
        if(!current.active){
            inactive.push(i);
        }
        if(current.rtime < ctime){
            inactive.push(i)
            if(current.redirect){
                current.res.statusCode = "302"
                current.res.setHeader("Location", current.redirect);
                current.res.end();
            } else {
                current.res.setHeader('content-type', 'text/plain');
                current.res.end((ctime - current.ctime).toString());
            }
        }
    }
    
    for(var i in inactive){
        waitingResponses.splice(i, 1);
    }
    
    setTimeout(findNextResponse, 20);
}
