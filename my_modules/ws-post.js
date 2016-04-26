'use strict';

var Lib = require('./my-lib')
    ,db = require('./mongo-util').getDb();

var Post = {};

Post.handle = function(ws, msg){
    if(typeof msg.z !== 'string')
        return false;

    if(msg.z == 'set')
        setPost(ws, msg);
};

function setPost(ws, msg){
    if(typeof ws.user.user_id === 'undefined' || typeof msg === 'undefined')
        return false;

    if(typeof msg.thought !== 'string')
        msg.thought = '';
    if(typeof msg.link !== 'string')
        msg.link = '';
    if(typeof msg.link_title !== 'string')
        msg.link_title = '';
    if(typeof msg.link_description !== 'string')
        msg.link_description = '';
    if(typeof msg.link_html !== 'string')
        msg.link_html = '';
    if(typeof msg.link_image !== 'string')
        msg.link_image = '';

    var post = {
        user_id: ws.user.user_id,
        thought: msg.thought.substring(0, 5000),
        link: msg.link.substring(0, 2083),// max length of a url
        link_title: msg.link_title.substring(0, 100),//
        link_description: msg.link_description.substring(0, 200),//
        link_html: msg.link_html.substring(0, 200),//
        link_image: msg.link_image.substring(0, 2083),// url max length
        share_with: Lib.arrOverlapItems(msg.friends, Lib.objArrBreakout(ws.user.friends, 'user_id')),// cut out people you share with that are not on your friends list
        date: Date.now()
    };

    Lib.thumbnailS3({url: post.link_image, width: '560', height: '996'}, function(img_name, size){// 9:16 aspect ratio
        post.image = img_name;
        if(typeof size.width !== 'undefined' && typeof size.height !== 'undefined'){
            post.image_width = size.width;
            post.image_height = size.height;
        }else{
            post.image_width = 0;
            post.image_height = 0;
        }
        db.collection('post').insertOne(post, function(err, result){
            if(!err){
                ws.sendObj({x: 'post', z: 'received', request: 'home'});
            }
        });
    });
}


//in:
// {"x":"post"
// ,"z":"set"
// ,"friends":[1458609729762,1458609726302,"UI2DA5RM"]
// ,"link":"http://waitbutwhy.com/2015/01/artificial-intelligence-revolution-1.html"
// ,"thought":"Thoughts"
//// ,"date":1458609916415
//// ,"next":true
// ,"link_title":"The Artificial Intelligence Revolution: Part 1 - Wait But Why"
// ,"link_image":"http://waitbutwhy.com/wp-content/uploads/2015/01/G1.jpg"
// ,"link_description":"Part 1 of 2: \"The Road to Superintelligence\". Artificial Intelligence — the topic everyone in the world should be talking about."
//// ,"yql":true
//// ,"preview":true}


module.exports = Post;