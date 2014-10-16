CAMERA={on:false}

CAMERA.prepare_photoshoot = function() {
    debug('preparing photoshoot...');    
    if (isVisible($('div.photoshoot'))) {
        debug('photoshoot already active');
        var cam = CAMERA.getCamera();
        return;
    }
    if (MODERATOR) {
        $('div.bottom').hide('slide',{direction:'down'},300);
    }
    $("div.portrait").hide();
    $('div.photoshoot').css('border-color','transparent');
    $("div.photoshoot").show();
    $('#camera_button').css('border-color','#a0a000').show();

    // check if chrome camera is available
    
    if (navigator.getUserMedia) {
        debug('initializing webrtc-camera');
        $('#PhotoBooth').hide();
        $('#WebRTC_monitor_area').show();
        navigator.getUserMedia({video:true}, WEBRTC_CAM.gotStream, WEBRTC_CAM.noStream);
    } else {
        // photo booth params
        var flashvars={};
        var fparams={};
        fparams.bgcolor="#000086";
        fparams.allowscriptaccess="sameDomain";
        var fattributes={};
        fattributes.id='PhotoBooth';
        fattributes.name='PhotoBooth';
        swfobject.embedSWF('recorder/PhotoBooth3.swf', 'PhotoBooth', '220', '220', '10.3.0', 'expressInstall.swf', flashvars,fparams,fattributes);
    }
}

CAMERA.getCamera = function() {
    if (WEBRTC_CAM.available) {        
        return WEBRTC_CAM;
    } else {
        var cam = swfobject.getObjectById('PhotoBooth');
        if (cam.capture !== undefined) {
            debug('Found photobooth');
            return cam;
        } else {
            debug('no capture available');
            return null;
        }
    }
}

CAMERA.cameraReady = function () {
    debug('received ping from flash');    
    $('#camera_button').css('border-color','#00a000').show();
    CAMERA.on=true;
}

CAMERA.tookPhoto = function () {
    //$("div.portrait").show();
    debug('tookPhoto called');
    $('#camera_button').fadeOut();
    $('div.photoshoot').css('border-color','#aaaaaa');
    $("#save_portrait").show('slide',{direction:'left'});
}

CAMERA.savedPhoto = function (path) {
    debug('Received a photo');
    var pup=PUPILS[SELECTED_PERSON];
    var old_src=pup.img_src;
    // random argument is added so that the photo is updated properly = it's not coming from the same url as previous
    pup.img_src=SERVER_URL+path+'?r='+Math.floor(Math.random()*10000);
    debug('new img: '+pup.img_src);
    $("img.large_portrait").attr('src', pup.img_src);   
    if (old_src!=DEFAULT_IMAGE) {     
        $('img').each(function (){
            if ($(this).attr('src')==old_src) {
                $(this).attr('src',pup.img_src)
            }
        });
    }
    ALL_FRIENDS.find_person(pup).img_src=pup.img_src;
    ALL_ENEMIES.find_person(pup).img_src=pup.img_src;
    CONTROLLER.addChange(pup);
    CONTROLLER.sendChanges();
    CLASSROOM.update_faces();
    CAMERA.finish_photoshoot();
}

CAMERA.keep_photo = function() { 
    debug('saving photo...');
    var pup=PUPILS[SELECTED_PERSON];
    var server_path=SERVER_URL;
    var class_name=fs_friendly_string((PARAMS) ? PARAMS.class_key : 'demo');
    var user_uid= (pup._id) ? fs_friendly_string(pup._id) : fs_friendly_string(pup.uid);
    var cam = CAMERA.getCamera();
    if (cam) {
        cam.save(server_path, class_name, user_uid);  // will result in 'savedPhoto' call
    }    
}

CAMERA.redo_photoshoot = function() {
    debug('releasing still photo');
    var cam = CAMERA.getCamera(); 
    if (cam) {
        cam.release();  // doesn't call back, just removes the still
        $('#camera_button').fadeIn();
    }    
    $('div.photoshoot').css('border-color','transparent');
    $("#save_portrait").hide('slide',{direction:'left'});
    CAMERA.on=true;
}

CAMERA.take_photo = function() {
    debug('taking photo...');    
    var cam = CAMERA.getCamera(); 
    if (cam) {
        debug('Found photobooth');
        cam.capture();  // will result in 'tookPhoto' call
    }
    $('#camera_button').fadeOut();
    CAMERA.on=false;
}

CAMERA.finish_photoshoot=function() {
    // flash cam shuts down when its hidden, WEBRTC_CAM needs to shut down manually
    if (WEBRTC_CAM.available) {
        WEBRTC_CAM.cancel()
    }
    if (MODERATOR) {
        $('div.bottom').show('slide',{direction:'down'},300);
    }

    $('div.portrait').show();
    $('div.photoshoot').hide();
    $('#save_portrait').hide('slide',{direction:'left'});
    $('#camera_button').show();
    $('div.photoshoot').css('border-color','transparent');
    $('#camera_button').css('border-color','transparent').show();
    CAMERA.on=false;
}

CAMERA.photo_error=function(error) {
    debug('photo error:'+error);
}

// Make some methods available for flash ExternalInterface calls:
cameraReady=CAMERA.cameraReady
tookPhoto=CAMERA.tookPhoto
savedPhoto=CAMERA.savedPhoto