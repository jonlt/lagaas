var fs = require('fs');
var DocumentDBClient = require('documentdb').DocumentClient;

var dbClient = null,
    logDbCollection = null;

var db_keys = {
    "db_uri": process.env.db_uri,
    "db_primary_key": process.env.db_primary_key
}

fs.exists("./db_keys.json", function(exists){
    if(exists){
        db_keys = require('./db_keys.json');
        dbClient = new DocumentDBClient(db_keys.db_uri, {masterKey: db_keys.db_primary_key});
        loadDb();
    } else {
        loadDb();
    }
})

function loadDb(){
    getDb(dbClient, function(err, db){
        getCollection(dbClient, db._self, function(err, collection){
            logDbCollection = collection; 
        });  
    });    
}

function convertToLogEntry(req){
    return {
        timestamp: (new Date()).getTime(),
        url: req.url,
        ip: req.client.remoteAddress
    };
}

exports.logRequest = function(req){
    if(logDbCollection == null){
        return;
    } else {
        var item = convertToLogEntry(req);
        dbClient.createDocument(logDbCollection._self, req, function(err, doc){
            if(err){
                console.log(err);
            }
        });
    }
}


// this is how the "docs" tells me to get a database collection:

function getDb(client, cb){
    var querySpec = {
        query: 'SELECT * FROM root r WHERE r.id=@id',
        parameters: [{
            name: '@id',
            value: "log"
        }]
    };
    
    client.queryDatabases(querySpec).toArray(function (err, results) {
        if (err) {
            console.log(err);
            cb(err);
        } else {
            cb(null, results[0]);
        }
    });
}

function getCollection(client, dblink, cb){
    var querySpec = {
        query: 'SELECT * FROM root r WHERE r.id=@id',
        parameters: [{
            name: '@id',
            value: "requests"
        }]
    };
    
    client.queryCollections(dblink, querySpec).toArray(function (err, results) {
        if (err) {
            console.log(err);            
            cb(err);
        } else {
            cb(null, results[0]);
        }
    });
}
