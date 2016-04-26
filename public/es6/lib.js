'use strict';

var __DEV = true;
var __DOMAIN = 'kyros.pw';

class Lib {
    static validateEmail(email) {
        var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
        return re.test(email);
    }

    static validateUsername(username) {
        var re = /^[a-zA-Z0-9/-]+$/;
        return re.test(username);
    }

    static randString(len, upper, lower, num) {
        var text = "";
        var possible = "";

        if (upper) {
            possible += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        }
        if (lower) {
            possible += "abcdefghijklmnopqrstuvwxyz";
        }
        if (num) {
            possible += "0123456789";
        }
        if (possible == "") {
            return false;
        }

        for (var i = 0; i < len; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    static toggleArrayItem(array, item) {
        var index = array.indexOf(item);
        if (index > -1) {
            delete array[index];
        } else {
            array.push(item);
        }
        var newArray = [];
        array.forEach(function (value) {
            newArray.push(value);
        });
        return newArray;
    }

    static backdrop($jObj, clickback) {
        var $backdrop = $('<div></div>');
        $backdrop.addClass('backdrop');
        //$backdrop.addClass('hide');
        $backdrop.css({'z-index': parseInt($jObj.css('z-index')) - 1, 'display': 'none'});
        $backdrop.click(clickback);
        $('body').append($backdrop);
        $backdrop.open = function () {
            //$backdrop.removeClass('hide');
            $backdrop.fadeIn(100);
        };
        $backdrop.close = function () {
            //$backdrop.addClass('hide');
            $backdrop.fadeOut(100);
        };
        return $backdrop;
    };

    static getDropText(dropEvent) {
        // Identify the dropped information
        var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
        var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        var isIE = navigator.userAgent.toLowerCase().indexOf('msie') > -1;
        var temp_url = '';
        var temp_text = '';
        var html_text = '';

        var event = dropEvent;
        if (typeof event.originalEvent !== 'undefined')
            event = dropEvent.originalEvent;

        temp_text = event.dataTransfer.getData('Text');
        temp_url = event.dataTransfer.getData('Url');

        // split url into url and text
        if (isFirefox) {
            var temp = event.dataTransfer.getData('text/x-moz-url');
            temp = temp.match(/[^\r\n]+/g);
            if (temp !== null && typeof temp !== 'undefined' && typeof temp[0] !== 'undefined') {
                temp_url = temp[0];
            }
            if (temp !== null && typeof temp !== 'undefined' && typeof temp[1] !== 'undefined') {
                html_text = temp[1];
            }
        }

        // extract info from the html
        if (isChrome) {
            var temp = event.dataTransfer.getData('text/html');
            var temp_div = document.createElement('div');
            temp_div.innerHTML = temp;
            html_text = $(temp_div).text();
        }

        if (temp_url == null) {
            temp_url = '';
        }
        if (temp_text == null) {
            temp_text = '';
        }
        if (html_text == null) {
            html_text = '';
        }

        return {url: temp_url, text: temp_text, html: html_text};
    }

    static mergeObjects(arr) {
        var obj = {};
        for (var i = 0; i < arr.length; i++) {
            for (var attrname in arr[i]) {
                obj[attrname] = arr[i][attrname];
            }
        }
        return obj;
    }

    static getLinkMetadata(link, callback) {
        // If no url was passed, exit.
        if (link == '') {
            callback({link_title: '', link_image: '', link_description: '', yql: true});
            return false;
        }
        var extension = link.split('.').pop();

        if (extension == 'jpg' || extension == 'jpeg' || extension == 'png') {
            callback({link_title: '', link_description: '', link_image: link, yql: true});
            return false
        }

        // Take the provided url, and add it to a YQL query. Make sure you encode it!
        var yql = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="' + link + '" and xpath=\'' +
                '//meta[contains(@name,"image")]|' +
                '//meta[contains(@name,"title")]|' +
                '//meta[contains(@name,"description")]|' +

                '//meta[contains(@property,"image")]|' +
                '//meta[contains(@property,"title")]|' +
                '//meta[contains(@property,"description")]|' +
                '//title\'') + '&format=json&callback=';

        // Request that YSQL string, and run a callback function.
        // Pass a defined function to prevent cache-busting.
        $.getJSON(yql, function (data) {
            callback(Lib.mergeObjects([Lib.metadataObject(data), Lib.linkType(link)]));
            return true;
        }).fail(function () {
            callback({link_title: '', link_image: '', link_description: '', yql: true});
            return false;
        });
    }

    static metadataObject(data) {// yahoo query language data
        var return_object = {link_title: '', link_image: '', link_description: '', yql: true};
        var results = data.query.results;

        if (results == null) {
            return return_object;
        }

        if (typeof results.meta != 'undefined') {
            var meta = results.meta;

            if (!$.isArray(meta)) {//not array
                //meta is a single variable
                //wrap it in an array
                meta = [meta];
            }

            meta.forEach((value) => {
                var name = '';
                if (typeof value.name != 'undefined') {
                    name = value.name;
                } else if (typeof value.property != 'undefined') {
                    name = value.property;
                }
                if (typeof value.content != 'undefined') {
                    if (name == 'og:image' || name == 'twitter:image' || name == 'image') {
                        if (return_object.link_image == '' || this.extractExtension(return_object.link_image) == 'gif')
                            return_object.link_image = value.content;// only set the first image found unless its a gif
                    }
                    if (name == 'og:description' || name == 'twitter:description' || name == 'description') {
                        if (return_object.link_description == '')
                            return_object.link_description = value.content.substr(0, 200);// only set the first description found
                    }
                    if (name == 'og:title' || name == 'twitter:title' || name == 'title') {
                        if (return_object.link_title == '')
                            return_object.link_title = value.content.substr(0, 100);// only set the first title found
                    }
                }
            });

        }

        //attempt to set the title from the title tag if no meta title was available
        if (return_object.link_title == '' && typeof results.title != 'undefined') {
            if (typeof results.title == 'string')
                return_object.link_title = results.title;
        }

        return_object.link_description = $('<div>' + return_object.link_description + '</div>').html();
        return_object.link_title = $('<div>' + return_object.link_title + '</div>').html();

        return return_object;
    }

    static linkType(link) {// return what type of link. example: image/video/link/gifv
        if(link == '')
            return {type: 'text', content: ''};

        if (this.isImage(link))
            return {type: 'image', content: link};

        var youtube = this.extractYoutubeID(link);
        if(youtube != '')
            return {type: 'youtube', content: youtube};

        var gifv = this.imgurMP4(link);
        if(gifv != '')
            return {type: 'gifv', content: gifv};

        // Must be a plain link
        return {type: 'link', content: link};
    }

    static extractDomain(url) {
        if (url == '')
            return '';

        var domain = '';

        if (url.indexOf("://") > -1)//find & remove protocol (http, ftp, etc.) and get domain
            domain = url.split('/')[2];
        else
            domain = url.split('/')[0];

        domain = domain.split(':')[0];// remove port number

        return domain;
    }

    static extractExtension(url) {
        if (url == '')
            return '';

        if (url.indexOf('.') == -1)
            return '';// Not a proper link

        return url.split('.').pop().split('?')[0];
    }

    static extractYoutubeID(url) {
        var domain = this.extractDomain(url);
        if (domain != 'www.youtube.com' && domain != 'youtu.be' && domain != 'youtube.com')
            return '';// Not YouTube

        if (url.indexOf('v=') == -1)
            return '';// Not a video

        return url.split('v=')[1].split('&')[0];
    }

    static imgurMP4(url) {
        var domain = this.extractDomain(url);
        if (domain != 'www.imgur.com' && domain != 'imgur.com' && domain != 'i.imgur.com')
            return '';// Not Imgur

        if (Lib.extractExtension(url) != 'gifv')
            return '';// Not gifv

        var url_arr = url.split('.');
        url_arr.pop();
        url_arr.push('mp4');

        return url_arr.join('.');
    }

    static isImage(url){
        var x = this.extractExtension(url);

        // Returns true or false
        return x == 'jpg' || x == 'jpeg' || x == 'png' || x == 'gif';
    }

    static handlePostClick(element){// handle the content for a post. EX: youtube/GIF/image
        var $element = $(element);
        var $p = $element.parent();
        var content = $p.attr('content');
        var type = $p.attr('type');

        if(type == 'gifv'){
            var gifv = document.createElement('video');
            gifv.src = content;
            gifv.load();
            gifv.loop = true;
            gifv.muted = true;
            $(gifv).addClass('video-gifv');
            $(gifv).css({'width': $element.width(), 'height': $element.height()});
            $(gifv).click(function(){
                if(this.paused == false)
                    this.pause();
                else
                    this.play();
            });
            $p.prepend(gifv);
            $element.addClass('hide');
            gifv.play();
        }else if(type == 'youtube'){
            var $ytIframe = $('<iframe type="text/html" width="560" height="315" frameborder="0" allowfullscreen="allowfullscreen"/>');
            $ytIframe.attr('src', 'http://www.youtube.com/embed/' + content + '?autoplay=1');
            $ytIframe.addClass('ytIframe');
            $p.prepend($ytIframe);
            $element.addClass('hide');
        }else if(type == 'image'){
            var $viewImage = $('<div class="fullscreen-image"></div>');
            $viewImage.html('<img src="' + content + '"/>');
            $viewImage.click(function(){
                this.remove();
            });
            $('body').append($viewImage);
        }

        // pass false and kill the link unless it IS a link
        return type == 'link';
    }

    static screenArea(){
        return $(window).width() * $(window).height();
    }

}