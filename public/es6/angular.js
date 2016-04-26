//Angular.js
var angularScope = {connected: false};
var app = angular.module('angularapp', []);
app.controller('AngularController', function($scope){

    //angular functions
    $scope.AF = {
        toggleArrayItem: function(array, item){
            return Lib.toggleArrayItem(array, item);
        },
        makePostDefault: function(){
            return {x: 'post', z: 'set', friends: [], link: '', thought: '', type: 'text', date: Date.now()}
        }
    };

    // default values
    $scope.people = {};// objects index is user id, contains name and picture
    $scope.posts = {};// holds the posts for the homepage
    $scope.user = {};// logged in user data
    $scope.page = 'loading';
    $scope.make_post = $scope.AF.makePostDefault();

    // template
    $scope.comments = [];
    $scope.messages = [];
    $scope.capture_comment = {};

    // link the websocket to angular
    angularScope = $scope;
    $scope.connected = true; // websocket has connected with angularScope
    $('body').removeClass('hide');
});