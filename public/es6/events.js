// jQuery events
$('.ws-echo').click(() => {
    WS.sendObj({x: 'echo', text: 'This is a message sent by the echo button.'});
});

//navigation
var nav_backdrop = Lib.backdrop($('#sidenav'), function(){
    nav_backdrop.close();
    $('#sidenav').removeClass('open');
});
$('#sidenav .item:not(.nav-bars)').click(() => {
    nav_backdrop.click();
});
$('.nav-bars').click(() => {
    if($('#sidenav').hasClass('open')){
        nav_backdrop.click();
    }else{
        $('#sidenav').addClass('open');
        nav_backdrop.open();
    }
});
$('.nav-home').click(() => {
    WS.sendObj({x: 'page', z: 'home'});
});
$('#page-home .load-more').click(() => {
    WS.sendObj({x: 'page', z: 'home', loaded: angularScope.posts.length});
});
$('.nav-comments').click(() => {
    WS.sendObj({x: 'page', z: 'messages'});
});
$('.nav-gear').click(() => {
    WS.sendObj({x: 'page', z: 'settings'});
});
$('.nav-plus').click(() => {
    WS.sendObj({x: 'page', z: 'post'});
});
$('.nav-people').click(() => {
    WS.sendObj({x: 'page', z: 'people'});
});
$('.nav-about').click(() => {
    WS.sendObj({x: 'page', z: 'about'});
});
$('.nav-update').click(() => {
    WS.sendObj({x: 'login', z: 'update'});
});

// Drop events
$(window).on('dragover', function(e){
    e.preventDefault();
    e.stopPropagation();
    //console.log('dragover');
});
$(window).on('dragenter', function(e){
    e.preventDefault();
    e.stopPropagation();
    //console.log('enterDrag');
    $('#drop-overlay').removeClass('hide');
});
$('#drop-overlay').on('dragleave', function(e){
    e.preventDefault();
    e.stopPropagation();
    //console.log('leaveDrag');
    $('#drop-overlay').addClass('hide');
});
$(window).on('drop', function(e){
    e.preventDefault();
    e.stopPropagation();
    //console.log('drop');
    $('#drop-overlay').addClass('hide');
    var data = Lib.getDropText(e);

    // reset the post object
    angularScope.make_post = angularScope.AF.makePostDefault();

    // insert the data
    if(data.url != ''){
        angularScope.make_post.link = data.url;
    }else if(data.text != ''){
        angularScope.make_post.thought = data.text;
    }
    angularScope.make_post.link_html = (data.url == data.html ? '' : data.html.substr(0, 200)) ;

    // apply
    angularScope.$apply();

    // switch page
    WS.sendObj({x: 'page', z: 'post'});
});
$(window).on('resize', function(){
    postColumns.resize();
});