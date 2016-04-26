'use strict';

global.__DEV = true;

var http = require('http')
    , https = require('https')
    , fs = require('fs')
    , url = require('url')
    , WebSocketServer = require('ws').Server
    , express = require('express')
    , aws = require('aws-sdk')
    , path = require('path')
    , mongoUtil = require('../my_modules/mongo-util');

var ssl = {
    active: false,
    keycert: {
        key: fs.readFileSync(path.join(__dirname, 'privatekey.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'certificate.pem'))
    }
};

// First connect to database
mongoUtil.connectToServer(function(err){
    if(err){
        // only start server if database connects.
        // console.log('MongoDB Error: ', err)
    }else{
        // database object
        //var db = mongoUtil.getDb();

        // start route after database has connected
        // because functions in routes use the database
        // in the header getDb() returns an undefined object
        var wsRoute = require('../my_modules/ws-route');

        // start server/websocket
        var server = ( ssl.active ) ? https.createServer(ssl.keycert) : http.createServer()
            , wss = new WebSocketServer({ server: server })
            , app = express()
            , port = 7777;

        app.use(function (req, res) {
            // This is sent when the WebSocket is requested as a webpage
            res.send({ msg: "hello" });
        });

        wss.on('connection', function connection(ws) {
            ws.sendObj = function(obj){
                ws.send(JSON.stringify(obj));

                if(__DEV)
                    console.log(Date.now() + '->out:', JSON.stringify(obj));
            };
            ws.on('message', function incoming(data){
                wsRoute.process(ws, JSON.parse(data));

                if(__DEV)
                    console.log(Date.now() + '->in:', data);
            });

            // Request login status from every new connection
            ws.sendObj({x: 'login', z: 'request'});
        });

        server.on('request', app);
        server.listen(port, function () { console.log('Listening on ' + server.address().port) });
    }
});





