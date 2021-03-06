// **********************************
// Shared navigation

function disable_nav() {
    $('div.nav').fadeOut(); //toggleClass('disabled', true);
}

function disable_bottom() {
    if (isVisible($('div.bottom'))) {
        $('div.bottom').hide();
        //$('div.nav_buttons').css('bottom',39);
    }
}

function enable_nav() {
    $('div.nav').css('top', WINDOW_HEIGHT/2-24)
    $('div.nav').fadeIn();
    $('div.nav').toggleClass('disabled', false);
}

function enable_bottom() {
    if (!isVisible($('div.bottom'))) {
        $('div.bottom').show();
        //$('div.nav_buttons').css('bottom',39+BOTTOM_HEIGHT);
    }
}    

function go_left(event) {
    view.prev();
}    

function go_right(event) {
    view.next();
}    


function go_left_slider(event) {
    if (view==INTERESTS) {
        slide_left('div.people_picker_face');
    } else if (view==LEARNER_VIEW) {
        slide_left('div.property_picker_item');
    } 
}

function go_right_slider(event) {
    if (view==INTERESTS) {
        slide_right('div.people_picker_face');
    } else if (view==LEARNER_VIEW) {
        slide_right('div.property_picker_item');
    } 

}

function loading_alert_on() {
    $('div.bottom_inner').css('opacity',0.2);
    $('div#bottom_disabled').show();
}

function loading_alert_off() {
    $('div.bottom_inner').css('opacity',1);
    $('div#bottom_disabled').hide();
}

function slide_left(icon_query_string){
        var slider=$('div.bottom_inner')
        var icon_width=$(slider).find(icon_query_string).first().width()+10;
        slider.animate({scrollLeft: '-='+icon_width*7},400, 'easeInQuad');
}
function slide_right(icon_query_string){
        var slider=$('div.bottom_inner')
        var icon_width=$(slider).find(icon_query_string).first().width()+10;
        slider.animate({scrollLeft: '+='+icon_width*7},400, 'easeInQuad');
}


