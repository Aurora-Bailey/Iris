'use strict';

var request = require('request')
    ,db = require('./mongo-util').getDb()
    ,Lib = require('./my-lib');

var Login = {};

Login.handle = function(ws, msg){
    if(typeof msg.z !== 'string')
        return false;

    if(msg.z == 'token')
        token(ws, msg);
    else if(msg.z == 'update')
        updateME(ws, msg);
};

function updateME(ws, msg){

    //if user is not logged in
    if(typeof ws.user.user_id === 'undefined')
        return false;

    ws.user.settings.update = true;

    db.collection('user').updateOne({user_id: ws.user.user_id}, {$set: {settings: ws.user.settings}}, function(err, result){
        if(!err){
            //console.log('friends updated.');
            ws.sendObj({x: 'login', z: 'update', text: ' --Reload your browser for changes to take effect.'});
        }
    });
}

function token(ws, msg){

    if(typeof msg.token !== 'string')
        return false;
    if(typeof msg.screen !== 'number')
        msg.screen = 2000000;

    var getUserDataFB = function(url, callback){
        request({
            url: url,
            json: true
        }, function (error, response, jsonObj) {
            if (!error && response.statusCode === 200) {
                callback(jsonObj);
            }
        });
    };

    //GENERATE new user id
    var genUserId = function(callback){// get an unused id
        var try_id = Lib.randString(7, true, false, true);

        //console.log('try: ', try_id);

        db.collection('user').find({user_id: try_id}, {_id: 0, user_id: 1}).limit(1).toArray(function(err, docs){
            if(err){
                // error with the request
                // console.log(err);
            }else if(docs.length != 0){
                // console.log('user found');
                genUserId(callback);
            }else{
                //user not found
                callback(try_id);
            }
        });
    };

    ws.token = msg.token;
    ws.screen = msg.screen;

    if(ws.token == 'Disconnected'){
        ws.user = {name: 'Guest'};
        ws.sendObj({x: 'login', z: 'success', request: 'guest', user: ws.user});
        delete ws.accountCreated;
        return true;
    }

    var graph_link = "https://graph.facebook.com/v2.5/";
    var graph_token = "&access_token=" + ws.token;
    var graph_id = graph_link + "me?fields=id,friends" + graph_token;
    var graph_user = graph_link + "me?fields=id,name,email,locale,gender,friends" + graph_token;
    var graph_pic = graph_link + "me/picture?type=large" + graph_token;

    getUserDataFB(graph_id, function(res){// get just the id

        // id 'should' alwayse be returned.
        if(typeof res.id === 'undefined')
            return false;

        db.collection('user').find({fb_id: res.id}, {_id: 0, user_id: 1, fb_friends: 1, name: 1, picture: 1, settings: 1}).limit(1).toArray(function(err, docs){
            if(err){
                // error with the request
                //console.log(err);
            }else if(docs.length != 0){
                //console.log('user IS found');

                //UPDATE
                if(typeof docs[0].settings.update !== 'undefined' && docs[0].settings.update == true){
                    if(typeof docs[0].settings.lastupdate === 'undefined' || Date.now() - docs[0].settings.lastupdate > (1000 * 60 * 60 * 4)){ // 4 hour
                        var new_settings = docs[0].settings;
                        new_settings.update = false;
                        new_settings.lastupdate = Date.now();

                        getUserDataFB(graph_user, function(res){// if the id is not in our database then pull all the user data
                            if(typeof res === 'undefined' || typeof res.id === 'undefined')
                                return false;

                            var userObj = {
                                name: res.name,
                                email: (typeof res.email !== 'undefined' ? res.email : ''),
                                locale: res.locale,
                                gender: res.gender,
                                settings: new_settings
                            };

                            if(typeof res.friends !== 'undefined'){
                                userObj.fb_friends = [];
                                userObj.fb_num_friends = res.friends.summary.total_count;
                                res.friends.data.forEach(function(value){
                                    userObj.fb_friends.push(value.id);
                                });
                            }

                            userObj.picture = docs[0].user_id + Lib.randString(2, true, false, false);

                            Lib.thumbnailS3({url: graph_pic, name: userObj.picture, width: '200', height: '200'}, function(img_url, size){
                                userObj.picture = img_url;
                                db.collection('user').updateOne({user_id: docs[0].user_id}, {$set: userObj}, function(err, result){
                                    if(!err){
                                        token(ws, msg);// re-run the request
                                    }
                                });
                            });
                        });

                        return false;
                    }
                }

                //UPDATE FRIENDS LIST
                var userObj = {};
                if(typeof res.friends !== 'undefined'){
                    userObj.fb_friends = [];
                    userObj.fb_num_friends = res.friends.summary.total_count;
                    res.friends.data.forEach(function(value){
                        userObj.fb_friends.push(value.id);
                    });

                    // manually update the fb friends from the last call so the update can be called asynchronously
                    docs[0].fb_friends = userObj.fb_friends;

                    db.collection('user').updateOne({user_id: docs[0].user_id}, {$set: userObj}, function(err, result){
                        if(!err){
                            //console.log('friends updated.');
                        }
                    });
                }

                //replace fb_friends with user_id name picture
                var realFriends = [];
                db.collection('user').find({fb_id: { $in: docs[0].fb_friends }}, {_id: 0, user_id: 1, name: 1, picture: 1}).toArray(function(err, friend_docs){
                    friend_docs.forEach(function(value){
                        realFriends.push({name: value.name, user_id: value.user_id, picture: Lib.linkS3(value.picture)});
                    });

                    docs[0].friends = realFriends;
                    delete docs[0].fb_friends;

                    // make the picture a link before its sent
                    docs[0].picture = Lib.linkS3(docs[0].picture);

                    //final login step, set ws and send user data
                    ws.user = docs[0];
                    ws.sendObj({x: 'login', z: 'success', request: 'home', user: ws.user});
                });
            }else if(typeof ws.accountCreated === 'undefined'){
                //user not found
                //console.log('user not found');

                getUserDataFB(graph_user, function(res){// if the id is not in our database then pull all the user data
                    if(typeof res === 'undefined' || typeof  res.id === 'undefined')
                        return false;

                    var userObj = {
                        user_id: '',
                        fb_id: res.id,
                        fb_friends: [],
                        name: res.name,
                        email: (typeof res.email !== 'undefined' ? res.email : ''),
                        locale: res.locale,
                        gender: res.gender,
                        picture: '',
                        join_date: Date.now(),
                        settings: {}
                    };

                    if(typeof res.friends !== 'undefined'){
                        userObj.fb_num_friends = res.friends.summary.total_count;
                        res.friends.data.forEach(function(value){
                            userObj.fb_friends.push(value.id);
                        });
                    }

                    genUserId(function(user_id){
                        userObj.user_id = 'U' + user_id;
                        userObj.picture = userObj.user_id + Lib.randString(2, true, false, false);

                        Lib.thumbnailS3({url: graph_pic, name: userObj.picture, width: '200', height: '200'}, function(img_url, size){
                            userObj.picture = img_url;
                            db.collection('user').insertOne(userObj, function(err, result){
                                if(!err){
                                    ws.accountCreated = true;
                                    token(ws, msg);// re-run the request, this time the user should be defined
                                }
                            });
                        });
                    });
                });
            }
        });
    });
}

module.exports = Login;