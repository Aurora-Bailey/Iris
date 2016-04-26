
class Facebook {
    static init(){
        this.connected = false;

        // This is called when the sdk is fully loaded
        window.fbAsyncInit = () => {
            FB.init({
                appId      : (__DEV ? '243257116022228' : '241489772865629'), // 2414 is production
                cookie     : true,  // enable cookies to allow the server to access the session
                xfbml      : true,  // parse social plugins on this page
                version    : 'v2.5' // use graph api version 2.5
            });
            this.connected = true;

            // Listen for log in/out button clicks
            $('.fb-login').click(() => {
                FB.login((response) => {
                    this.statusChange(response);
                }, {scope: 'public_profile,email,user_friends'});//
            });
            $('.fb-logout').click(() => {
                FB.logout((response) => {
                    this.statusChange(response);
                });
            });
        };

        // Load the SDK asynchronously
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    }

    //called on websocket login request or on demand
    static requestTokenStatus(){
        FB.getLoginStatus((response) => {
            this.statusChange(response);
        });
    }

    //log in
    //log out
    //requestTokenStatus()
    static statusChange(response) {
        if (response.status === 'connected') {
            WS.sendObj({x: 'login', z: 'token', screen: Lib.screenArea(), token: response.authResponse.accessToken});
        }else{
            WS.sendObj({x: 'login', z: 'token', screen: Lib.screenArea(), token: 'Disconnected'});
        }
    }
}
Facebook.init();