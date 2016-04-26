'use strict';

var db = require('./mongo-util').getDb()
    ,Lib = require('./my-lib');

var Page = {};

Page.handle = function(ws, msg){
    if(typeof msg.z !== 'string')
        return false;

    if(msg.z == 'guest' || typeof ws.user.user_id == 'undefined')
        guest(ws, msg);
    else if(msg.z == 'home')
        home(ws, msg);
    else if(msg.z == 'messages')
        messages(ws, msg);
    else if(msg.z == 'settings')
        settings(ws, msg);
    else if(msg.z == 'post')
        post(ws, msg);
    else if(msg.z == 'people')
        people(ws, msg);
    else if(msg.z == 'about')
        about(ws, msg);

};

function guest(ws, msg){
    ws.sendObj({x: 'page', z: 'guest'});
}
function home(ws, msg){
    if(typeof ws.user.user_id === 'undefined')// prevent guest from accessing this page
        return false;

    // limit the number of results based on the screen size they had when they logged in.
    var limit = Math.floor((ws.screen * 1.5) / (560 * 560));
    if(limit < 5)
        limit = 5;
    if(limit > 25)
        limit = 25;

    var skip = parseInt(typeof msg.loaded === 'undefined' ? 0 : msg.loaded);
    if(skip == 0){// if first page
        ws.startPostLoad = Date.now();
    }else if(typeof ws.startPostLoad === 'undefined'){// if user trys to request second page before the first
        ws.startPostLoad = Date.now();
    }
    db.collection('post').find({$and: [{date: {$lt: ws.startPostLoad}}, {$or: [{share_with: ws.user.user_id}, {user_id: ws.user.user_id}]} ]},
        {_id: 0, user_id: 1, thought: 1, link: 1, link_title: 1, link_description: 1, link_image: 1, link_html: 1, share_with: 1, image: 1, image_height: 1, image_width: 1, date: 1})
        .skip(skip).limit(limit).sort({date: -1}).toArray(function(err, docs){

        // resolve the user ids into picture and name
        var people_ids = [];
        docs.forEach(function(value){
            people_ids = people_ids.concat(value.share_with);
            people_ids.push(value.user_id);
            value.image = Lib.linkS3(value.image);
        });
        people_ids = Lib.removeDuplicates(people_ids);
        db.collection('user').find({user_id: { $in: people_ids } }, {_id: 0, user_id: 1, name: 1, picture: 1}).toArray(function(err, user_docs){
            var people = {};
            user_docs.forEach(function(value){
                people[value.user_id] = {name: value.name, picture: Lib.linkS3(value.picture)};
            });

            var r = {x: 'page', z: 'home', people: people, data: docs};
            if(skip > 0)
                r.concatenate = true;

            ws.sendObj(r);
        });
    });
}
function messages(ws, msg){
    ws.sendObj({x: 'page', z: 'messages'});
}
function settings(ws, msg){
    ws.sendObj({x: 'page', z: 'settings'});
}
function post(ws, msg){
    ws.sendObj({x: 'page', z: 'post'});
}
function people(ws, msg){
    ws.sendObj({x: 'page', z: 'people'});
}
function about(ws, msg){
    ws.sendObj({x: 'page', z: 'about'});
}

module.exports = Page;