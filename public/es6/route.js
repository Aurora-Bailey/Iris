class Route {
    static handle(msg){
        // make sure everything is connected
        // websocket will be connected because this is called by websocket
        if(typeof angularScope === 'undefined' || angularScope.connected !== true){
            setTimeout(()=>this.handle(msg), 200);
            return false;
        }
        if(typeof Facebook === 'undefined' || Facebook.connected !== true){
            setTimeout(()=>this.handle(msg), 200);
            return false;
        }

        // this allows any request to change the page
        if(typeof msg.request !== 'undefined'){
            WS.sendObj({x: 'page', z: msg.request});

            // add push and pop history states
        }

        // Routing system.
        if(msg.x == 'login')
            this.login(msg);
        else if(msg.x == 'echo')
            this.echo(msg);
        else if(msg.x == 'post')
            this.post(msg);
        else if(msg.x == 'page')
            this.page(msg);

        // apply all changes
        angularScope.$apply();
    }



    // The routing functions
    static login(msg){
        if(msg.z == 'success'){
            angularScope.user = msg.user;
        }else if(msg.z == 'request'){
            Facebook.requestTokenStatus();
        }else if(msg.z == 'update'){
            angularScope.userUpdateMsg = msg.text;// this text will be showed next to the update button
        }
    }

    static echo(msg){
        angularScope.echo = msg.text;
    }

    static post(msg){
        if(msg.z == 'received'){
            // post was uploaded successfully
        }
    }

    static page(msg){
        angularScope.page = msg.z;

        if(msg.z == 'home'){
            for(let i=0; i<msg.data.length; i++){
                msg.data[i] = Lib.mergeObjects([msg.data[i], Lib.linkType(msg.data[i].link)]);
            }
            if(typeof msg.concatenate !== 'undefined' && msg.concatenate === true){// paging
                // people is an object
                // posts is an array
                angularScope.people = Lib.mergeObjects([angularScope.people, msg.people]);
                angularScope.posts = angularScope.posts.concat(msg.data);

                if(msg.data.length == 0)
                    $('#page-home .load-more').html('EMPTY PAGE').removeClass('empty').addClass('empty');

            }else{// homepage
                angularScope.people = msg.people;
                angularScope.posts = msg.data;
                postColumns.reset();

                $('#page-home .load-more').html('LOAD MORE').removeClass('empty');
            }

            angularScope.$apply();
            postColumns.update();
        }else if(msg.z == 'guest'){
            angularScope.user = {name: 'Guest'};
            angularScope.people = {};
            angularScope.posts = {};
        }
    }
}