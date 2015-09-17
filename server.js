var http = require('http');
var AVLTree = require('binary-search-tree').AVLTree;

var waitingResponses = new AVLTree();


var server = http.createServer(function(req, res){
    
    if(req.method === "OPTIONS"){
        res.statusCode = 200;
        res.end("lagaas.com/:lag_in_ms");
        return;
    }
    
    if(req.url === "/"){
        return renderLanding(res); 
    }
    
    var atime, // add time
        ctime, // current time
        rtime; // respond at time
    
    ctime = (new Date()).getTime();
    atime = parseInt(req.url.substr(1, req.url.length - 1)) || -1;

    if(atime < 0) {
        res.statusCode = 400;
        res.end("nan")
    } else {
        rtime = ctime + atime;

        var entry = {
            "client": req.connection.remoteAddress,
            "res": res,
            "rtime": rtime,
            "ctime": ctime
        };
        
        waitingResponses.insert(rtime, entry);
    }    
});

var port = process.env.PORT;

server.listen(port, function(){
    console.info("started!");
    setInterval(handleNextReq, 20);
});

function handleNextReq(){
    var ctime = (new Date()).getTime();
    var resToHandle = waitingResponses.betweenBounds({ $lt: ctime });
    if(resToHandle && resToHandle.length > 0){
        for(var ires in resToHandle){
            var entry = resToHandle[ires];
            
            entry.res.setHeader('content-type', 'text/plain');
            entry.res.end((ctime - entry.ctime).toString());
        }         
    }
}

function renderLanding(res){
    var html = "<!DOCTYPE html>\
<html><body><h1>Lag as a Service</h1>\
<p>use it like this: <code>lagaas.com/{lag_time_in_ms}</code> to get your organic, gluten-free lag straight from the server farm.</p>\
<p>EX: <code>lagaas.com/1000</code> for a <em>whole</em> second of free fresh lag.</p>\
</body></html>\
";
    res.setHeader('content-type', 'text/html');
    res.statusCode = 200;
    res.end(html);
}