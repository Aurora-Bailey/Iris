var login = require('./ws-login')
    ,page = require('./ws-page')
    ,post = require('./ws-post');

var Route = {};

Route.process = function(ws, msg){
    if(typeof msg.x !== 'string')
        return false;

    if(msg.x == 'login')
        login.handle(ws, msg);
    else if(msg.x == 'page')
        page.handle(ws, msg);
    else if(msg.x == 'post')
        post.handle(ws, msg);
    else if(msg.x == 'echo')
        ws.sendObj(msg);
};

module.exports = Route;