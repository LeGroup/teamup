// **********************************
// Team recorder 

RECORDER={on:false, vumeter_values:[], vumeters: [$('#vumeter_0'), 
    $('#vumeter_1'),
    $('#vumeter_2'),
    $('#vumeter_3'),
    $('#vumeter_4'),
    $('#vumeter_5'),
    $('#vumeter_6'),
    $('#vumeter_7')]
}

RECORDER.prepare_recorder=function() {
    $('#recorder_toggle').hide();
    if (!RECORDER.getRecorder()) {
        swfobject.embedSWF('recorder/TeamRecorder4.swf', 'TeamRecorder', '240', '240', '10.3.0', 'expressInstall.swf', {},{},{});
    }
    debug('record mode on');
    $('#note_viewer').hide();
    $('#note_photo').hide();
    $('#note_recorder').show();
}


RECORDER.getRecorder=function() {
    var rec=swfobject.getObjectById('TeamRecorder');
    if (rec && rec.initCamera !== undefined) {
        debug('Found recorder');
        return rec;
    } else {
        debug('no recorder available');
        return null;
    }
}

RECORDER.initialized=function() {
    // recorder has loaded and its actionscript is reachable
    rec=RECORDER.getRecorder();
    if (rec) {
        debug('ping received from recorder');
        rec.initCamera();
        rec.initMic();
        $('#recorder_toggle').hide();
    }
}

RECORDER.cameraAccepted=function() {
        $('#recorder_toggle').show().css('border-color', '#33aa33').off('click').click(RECORDER.start_recording);
        $('div.vumeter').show();
        debug('camera accepted');
}
RECORDER.cameraDenied=function() {
    debug('camera denied');
}

RECORDER.start_recording = function() {
    var rec = RECORDER.getRecorder(); 
    if (rec) {
        rec.startRecording();
        $('#recorder_toggle').css('border-color', 'transparent').hide();
        $('#rec_indicator').removeClass('green').addClass('red');
        $('#stop_button').removeClass('green').addClass('red');
        $('#progress_line').show().width(0);
        $('#countdown').text("3").show();
        $('#stop_button').click(RECORDER.stop_recording);         
    }
}

RECORDER.recording_timer = function(t) {
    // every 10th second, max 600 
    $('#progress_line').width((t/600)*464);
    var seconds;
    var t=Math.floor(t/10);
    if (t<10) {
        seconds="0"+t.toString();
    } else {
        seconds=t.toString();
    }
    if (t==20) {
            $("#i18n-what-we-did").removeClass('highlight').next('span.check').fadeIn('slow');
            $("#i18n-what-we-will-do").addClass('highlight');
    } else if (t==40) {
            $("#i18n-what-we-will-do").removeClass('highlight').next('span.check').fadeIn('slow');
            $("#i18n-any-problems").addClass('highlight');
    } else if (t==59) {
            $("#i18n-any-problems").removeClass('highlight').next('span.check').fadeIn('slow');
    }

    $('#timer_text').text("0:"+seconds+" / 1:00");
    if (t>200) {

    } else if (t>400) {

    }
}

RECORDER.countdown = function(t) {
    if (t==0) {
        $('#countdown').hide();
        var team=getData($('#team_title'));
        $('#note_recorder').css('border-color',team.color);
    } else {       
        $('#countdown').text(t).show();
    }
}   

RECORDER.stop_recording = function() {
    var rec = RECORDER.getRecorder(); 
    if (rec) {
        rec.stopRecording();
    }
}


RECORDER.play = function() {
    var rec = RECORDER.getRecorder();
    if (rec) {
        rec.startPlaying();
        $('#rec_indicator').addClass('green');
        $('#stop_button').removeClass('green_play').addClass('green').off('click').click(RECORDER.stop_playing);
    }
}

RECORDER.stop_playing = function() {
    var rec = RECORDER.getRecorder();
    if (rec) {
        rec.stopPlaying();
    }
}

RECORDER.stopped_playing = function() {
    $('#rec_indicator').removeClass('green');
    $('#stop_button').removeClass('green').addClass('green_play').off('click').click(RECORDER.play);
}


RECORDER.recording_stopped = function() {
    debug('recorder stopped');
    $('#rec_indicator').removeClass('red').off('click');
    $('#stop_button').removeClass('red').off('click');
    $('span.check').show();
    $('div.vumeter').hide();
}

RECORDER.cancel_recording = function() {
    RECORDER.on=false;
    debug('canceling recording')
    $('#note_recorder').hide();
    $('#note_viewer').show();
    $('div.vumeter').hide();
    $('#rec_indicator').removeClass('red').removeClass('green');
    $('#stop_button').removeClass('red').removeClass('green');
}

RECORDER.encodingComplete= function() {
    $("#save_note").removeClass('disabled');
    $('#rec_indicator').addClass('red');
    $('#stop_button').removeClass('red').addClass('green_play').click(RECORDER.play);
}

RECORDER.audioLevel=function(level) {
    //RECORDER.vumeter.height(level*3);
    RECORDER.vumeter_values.push(3+level*3);
    if (RECORDER.vumeter_values.length>10) {
        RECORDER.vumeter_values.shift()
    }
    $('#vumeter').height(3+level*3);
    for (var i=0; i<RECORDER.vumeter_values.length; i++) {
        $('#vumeter_'+i).height(RECORDER.vumeter_values[i]);
        //RECORDER.vumeters[i].height(RECORDER.vumeter_values[i]);
    }

}

RECORDER.save_note= function() {
    var rec = RECORDER.getRecorder();
    var team=getData($('#team_title'));
    debug('save note clicked');
    var note_id=new Date().getTime().toString().substring(5);
    var server_path=SERVER_URL;
    var class_uid= fs_friendly_string((PARAMS) ? PARAMS.class_key : 'demo');
    var note_uid= fs_friendly_string(team.uid)+'_note_'+note_id;

    if (rec) {
        rec.saveRecording(server_path, class_uid, note_uid); 
    }        
}


RECORDER.finishedRecording= function(path) {
    $('#upload-panel').dialog('close');
    $('div.recorder_panel').hide();
    debug('Received a record:'+path);
    // Create an empty note but don't catalog it yet
    var note = new TeamNote(false);
    note.audio_url=SERVER_URL+path+'_rec.mp3';
    debug(note.audio_url);
    note.photos.push(SERVER_URL+path+'_pic.jpg');
    // Give it a proper uid before cataloging
    var team=getData($('#team_title'));
    note.uid= path;
    // Now catalog & finalize it
    CATALOG[note.uid]=note;
    CONTROLLER.addChange(note);
    team.notes.push(note.uid);
    CONTROLLER.addChange(team);
    CONTROLLER.sendChanges();
    TEAM_NOTES.create_team_notes(team);        
}

RECORDER.uploadingRecording= function() {
    debug('Uploading recording...');
    //$('#upload-panel').dialog('open');
    var notes=$('#available_recordings');
    $('#record_note img').show();
    $('#record_note span').hide();
}

// redirect Flash ExternalInterface calls: 
recorderInitialized=RECORDER.initialized;
recording_stopped=RECORDER.recording_stopped; 
uploadingRecording=RECORDER.uploadingRecording;
finishedRecording=RECORDER.finishedRecording;
encodingComplete=RECORDER.encodingComplete;
audioLevel=RECORDER.audioLevel;
recording_timer=RECORDER.recording_timer;
countdown=RECORDER.countdown;
cameraAccepted=RECORDER.cameraAccepted;
cameraDenied=RECORDER.cameraDenied;
stopped_playing=RECORDER.stopped_playing;