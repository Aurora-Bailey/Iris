'use strict';

var request = require('request')
    ,fs = require('fs')
    ,db = require('./mongo-util').getDb()
    ,AWS = require('aws-sdk')
    ,gm = require('gm')
    ,path = require('path')
    ,crypto = require('crypto');

AWS.config.region = 'us-east-1';
var aws_bucket = 'kyros.pw';
var domain_name = 'http://kyros.pw';

if(__DEV){
    aws_bucket = 'hels';
    domain_name = 'https://s3.amazonaws.com/' + aws_bucket;
}

var Lib = {};

Lib.randString = function(len, upper, lower, num){
    var text = "";
    var possible = "";

    if(upper){
        possible += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }
    if(lower){
        possible += "abcdefghijklmnopqrstuvwxyz";
    }
    if(num){
        possible += "0123456789";
    }
    if(possible == ""){
        return false;
    }

    for( var i=0; i < len; i++ ){
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
};

Lib.md5 = function(str){
    return crypto.createHash('md5').update(str).digest('hex');
};

// take an array of objects and out put an array from an item in each object
Lib.objArrBreakout = function(obj_arr, item_name){
    var r = [];

    if(typeof obj_arr[0] == 'undefined')
        return r;

    obj_arr.forEach(function(value){
        if(typeof value[item_name] != 'undefined')
            r.push(value[item_name]);
    });

    return r;
};

// return items that both arrays have in common
Lib.arrOverlapItems = function(arr1, arr2){
    var r = [];

    if(typeof arr1[0] == 'undefined' || typeof arr2[0] == 'undefined')
        return r;

    arr1.forEach(function(value){
        if(typeof value != 'string')
            return true;

        if(arr2.indexOf(value) != -1){
            r.push(value);
        }
    });

    return r;
};

Lib.removeDuplicates = function(arr){
    var temp = [];
    arr.forEach(function(value){
        if(temp.indexOf(value) === -1)
            temp.push(value);
    });
    return temp;
};


// wrap the file in a s3 link
Lib.linkS3 = function(filename){
    //return 'https://s3.amazonaws.com/' + aws_bucket + '/ws/' + filename;
    if(filename.length > 0){
        return domain_name + '/ws/' + filename;
    }else{
        return '';
    }
};

// store existing files into s3
Lib.saveS3 = function(temp_path, filenameS3, type, callback){
    var body = fs.createReadStream(path.join(__dirname, temp_path));
    var s3obj = new AWS.S3({params: {Bucket: aws_bucket, Key: 'ws/' + filenameS3, ContentType: type}});
    s3obj.upload({Body: body}, function (err, data) {
        if(!err){
            callback(filenameS3);
        }else{
            callback('');
        }

    });
};

// create a thumbnail from a link and store it in s3
Lib.thumbnailS3 = function(options, callback){//{*url, *width, *height, name} * = required callback(filename, {width, height})
    if(options.url == ''){
        callback('',{});
        return false;
    }
    var name = (typeof options.name == 'undefined' ? Lib.md5(options.url) : options.name )
        ,filename = name + '.jpg'
        ,temp_path = "../temp/";

    db.collection('image').find({name: name}, {_id: 0, width: 1, height: 1, filename: 1}).limit(1).toArray(function(err, docs){
        if(err){
            // error with the request
            // console.log(err);
        }else if(docs.length != 0){
            // found
            var d = docs[0];
            callback(d.filename, {width: d.width, height: d.height});
        }else{
            // unknown
            request.head(options.url, function(err, res, body) {
                if(err){
                    callback('',{});
                    return false;
                }
                var type = res.headers['content-type'],
                    size = res.headers['content-length'];
                if(type != 'image/jpg' && type != 'image/jpeg' && type != 'image/png' && type != 'image/gif'){
                    callback('',{});
                    return false;
                }
                if(size >= (10 * 1024 * 1024)){//Over 10MB
                    callback('',{});
                    return false;
                }

                // Request scale and save image
                gm(request(options.url))
                    .resize(options.width, options.height , '>')
                    .strip()
                    .write(path.join(__dirname, temp_path + filename) , function(err){
                        if(err){
                            console.log(err);
                            callback('',{});
                            fs.unlink(path.join(__dirname, temp_path + filename));
                            return false;
                        }

                        // send image to s3, then delete
                        Lib.saveS3(temp_path + filename, filename, 'image/jpeg', function(file_name){

                            // get the image size
                            gm(path.join(__dirname, temp_path + filename))
                                .size(function(err, size){

                                    // delete image regardless of error
                                    fs.unlink(path.join(__dirname, temp_path + filename));

                                    if(err || file_name == ''){
                                        callback('',{});
                                        return false;
                                    }

                                    var image_info = {width: size.width, height: size.height,
                                        name: name, filename: filename, url: options.url, date: Date.now()};

                                    callback(file_name, {width: image_info.width, height: image_info.height});

                                    db.collection('image').insertOne(image_info, function(err, result){});
                                });
                        });
                    });

            });
        }
    });

};


module.exports = Lib;