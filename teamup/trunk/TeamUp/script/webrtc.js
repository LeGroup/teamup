WEBRTC_REC={available:false, stream:null}

WEBRTC_REC.gotStream = function(stream) {
    window.URL = window.URL || window.webkitURL;
    var video=$('#rtc_monitor')[0];
    WEBRTC_REC.stream=stream;
    debug('got stream')
    WEBRTC_REC.available=true;
    if (window.URL) {        
        video.src=window.URL.createObjectURL(stream);
    } else {
        video.src=stream;
    }
    video.onerror = function(e) {
        stream.stop();
    };
    stream.onended = WEBRTC_REC.noStream;
    video.onloadedmetadata = function(e) {
        // adjust position here if necessary
    }
    setTimeout(function() {
        // adjust position here if necessary
    }, 50)
    RECORDER.cameraReady() // 'ping'

}
WEBRTC_REC.noStream = function(e) {
    debug('no stream')
}

WEBRTC_REC.capture = function() {
    var canvas=$('#rtc_canvas')[0];
    var ctx=canvas.getContext('2d');
    var video=$('#rtc_monitor')[0];
    canvas.width=220;
    canvas.height=220;
    ctx.drawImage(video,80,0,480,480,0,0,220,220)
    //ctx.drawImage(video,80,0,480,480,0,0,220,220);
    $('#WebRTC_monitor_area').hide();
    $('#WebRTC_canvas_area').show();
    RECORDER.tookPhoto();
}

WEBRTC_REC.save = function(server_path, class_name, user_uid) {
    RECORDER.savedPhoto(server_path);
}

WEBRTC_REC.cancel = function() {
    WEBRTC_REC.stream.stop();
    $('#WebRTC_monitor_area').hide();
    $('#WebRTC_canvas_area').hide();    
}

WEBRTC_REC.release = function() {
    $('#WebRTC_monitor_area').show();
    $('#WebRTC_canvas_area').hide();    
}

// Student photos

WEBRTC_CAM={available:false, stream:null}
WEBRTC_CAM.gotStream = function(stream) {
    window.URL = window.URL || window.webkitURL;
    var video=$('#rtc_monitor')[0];
    WEBRTC_CAM.stream=stream;
    debug('got stream')
    WEBRTC_CAM.available=true;
    if (window.URL) {        
        video.src=window.URL.createObjectURL(stream);
    } else {
        video.src=stream;
    }
    video.onerror = function(e) {
        stream.stop();
    };
    stream.onended = WEBRTC_CAM.noStream;
    video.onloadedmetadata = function(e) {
        // adjust position here if necessary
    }
    setTimeout(function() {
        // adjust position here if necessary
    }, 50)
    CAMERA.cameraReady() // 'ping'

}
WEBRTC_CAM.noStream = function(e) {
    debug('no stream')
}

WEBRTC_CAM.capture = function() {
    var canvas=$('#rtc_canvas')[0];
    var ctx=canvas.getContext('2d');
    var video=$('#rtc_monitor')[0];
    canvas.width=220;
    canvas.height=220;
    ctx.drawImage(video,80,0,480,480,0,0,220,220)
    //ctx.drawImage(video,80,0,480,480,0,0,220,220);
    $('#WebRTC_monitor_area').hide();
    $('#WebRTC_canvas_area').show();
    CAMERA.tookPhoto();
}

WEBRTC_CAM.save = function(server_path, class_name, user_uid) {
    var loc=SERVER_URL+'photoloader.php';
    if (typeof Widget !== 'undefined') {
        loc=Widget.proxify(loc);
    }         
    var result_path='';
    var sdata={};
    var canvas=$('#rtc_canvas')[0];
    var dataURL=canvas.toDataURL('image/png');
    sdata.picture=dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
    sdata.class_id=class_name;
    sdata.record_id=user_uid;

    $.post(loc, sdata, function(path) {
        debug('*** php replied:'+path);
        CAMERA.savedPhoto(path);
        } );    
}

WEBRTC_CAM.cancel = function() {
    WEBRTC_CAM.stream.stop();
    $('#WebRTC_monitor_area').hide();
    $('#WebRTC_canvas_area').hide();    
}

WEBRTC_CAM.release = function() {
    $('#WebRTC_monitor_area').show();
    $('#WebRTC_canvas_area').hide();    
}
