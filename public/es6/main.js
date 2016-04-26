var postColumns = {
    active: false,
    inMemory: [],
    toggle: function(){
        if(this.active)
            this.off();
        else
            this.on();
    },
    on: function(){
        this.active = true;
        $('#page-home .narrow-wrapper').removeClass('narrow-wrapper').addClass('post-container');
        this.update();
        this.render();
    },
    off: function(){
        $('#page-home .post-container').addClass('narrow-wrapper').removeClass('post-container');

        this.inMemory.forEach(function($value){
            $value.removeClass("processed");
            $('#page-home .narrow-wrapper').append($value);
        });
        $('#page-home .post-column').remove();

        this.reset();
        this.active = false;
    },
    update: function(){
        if(!this.active)
            return false;

        // load the new angular items into memory
        this.inMemory.push( $("#page-home .post:not(.processed)").addClass("processed") );
        this.render();
    },
    reset: function(){
        if(!this.active)
            return false;

        this.inMemory = [];
    },
    resize: function(){
        if(!this.active)
            return false;

        // render if the number of colums we should have has changed
        var col_num = Math.floor($('#page-home .post-container').width() / 590);
        if(col_num == 0)
            col_num = 1;

        var real_num = $('#page-home .post-column').length;

        if(col_num != real_num){
            this.render();
        }
    },
    render: function(){
        if(!this.active)
            return false;

        // remove the posts from the columns
        var $temp = $('<div></div>').prependTo('#page-home .post-container');
        this.inMemory.forEach(function($value){
            $temp.append($value);

            // set a fixed height for the image so it will render the proper height for the post
            $value.each(function(index, value){
                var $pic = $(value).find('.auto-link-picture');
                var height = $pic.attr('data-height');
                $pic.css({'height': height + 'px'});
            });
        });

        // rebuild the columns
        var col_num = Math.floor($('#page-home .post-container').width() / 590);
        if(col_num == 0)
            col_num = 1;

        var real_num = $('#page-home .post-column').length;

        if(col_num != real_num){
            $('#page-home .post-column').remove();
            for(let i=0; i<col_num; i++){
                $('#page-home .post-container').prepend($('<div class="post-column"></div>'));
            }
        }

        // insert the post back into the columns
        this.inMemory.forEach(function($value){
            $value.each(function(index, value){

                var $smallest = false;
                $("#page-home .post-column").each(function(index, value){
                    if($smallest === false){
                        $smallest = $(value);
                    }else{
                        if($(value).height() < $smallest.height())
                            $smallest = $(value);
                    }
                });
                $smallest.append($(value));

            });
        });

        // clean up
        $temp.remove();

        // remove the fixed height from the image so it will scale down properly for mobile.
        this.inMemory.forEach(function($value){
            $value.each(function(index, value){
                var $pic = $(value).find('.auto-link-picture');
                $pic.css({'height': 'auto'});
            });
        });
    }
};