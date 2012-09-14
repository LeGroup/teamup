// **********************************
// Team recorder 

RECORDER={on:false, duration:60, vumeter_values:[], vumeters: [$('#vumeter_0'), 
    $('#vumeter_1'),
    $('#vumeter_2'),
    $('#vumeter_3'),
    $('#vumeter_4'),
    $('#vumeter_5'),
    $('#vumeter_6'),
    $('#vumeter_7')]
}

RECORDER.prepare_recorder=function() {

    // hide, disable or reset everything related to playback
    debug('preparing recorder')
    $('#rec_indicator').removeClass('red').removeClass('green');
    $('#save_note').addClass('disabled');
    $('#full_line').css('width',464);
    $('#progress_line').css('width',0);
    $('#recorder_pause_button').hide();
    $('#recorder_buttons').show();
    $('#player_buttons').hide();
    $('#stop_button').removeClass('green').removeClass('red');
    $('#recorder_toggle').hide();
    $('#note_player').jPlayer("setMedia", {mp3:''});
    $('#timer_text span.now').text('0:00');
    $('#timer_text span.max_duration').text('0:00');

    if (!RECORDER.getRecorder()) {
        swfobject.embedSWF('recorder/TeamRecorder4.swf', 'TeamRecorder', '240', '240', '10.3.0', 'expressInstall.swf', {},{},{});
    }
    debug('record mode on');
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

RECORDER.camera_accepted=function() {
        $('#recorder_toggle').show().off('click').click(RECORDER.start_recording); //.css('border-color', '#33aa33')
        $('div.vumeter').show(); 
        debug('camera accepted');
}
RECORDER.camera_denied=function() {
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
    t=t/10;
    RECORDER.duration=t;
    var now_minutes = Math.floor(t/60);
    var now_seconds = Math.floor(t%60);
    if (now_seconds>9) {
        $('#timer_text span.now').text(''+now_minutes+':'+now_seconds);
    } else {
        $('#timer_text span.now').text(''+now_minutes+':0'+now_seconds);
    }
    if (now_seconds==40) {
        TEAM_NOTES.highlight_question(2);            
    } else if (now_seconds==20) {
        TEAM_NOTES.highlight_question(1)
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

RECORDER.recording_stopped = function() {
    debug('recorder stopped');
    $('#rec_indicator').removeClass('red').off('click');
    $('#stop_button').removeClass('red').off('click');
    $('span.check').show();
    $('div.vumeter').hide();
    $('#timer_text span.now').text('0:00');
    var full_minutes = Math.floor(RECORDER.duration/60);
    var full_seconds = Math.floor(RECORDER.duration%60);
    if (full_seconds>9) {
        $('#timer_text span.max_duration').text(''+full_minutes+':'+full_seconds);
    } else {
        $('#timer_text span.max_duration').text(''+full_minutes+':0'+full_seconds);
    }
    $('#play_button').addClass('active');


}

RECORDER.play = function() {
    var rec = RECORDER.getRecorder();
    if (rec) {
        rec.startPlaying();
        $('#rec_indicator').addClass('green');
        $('#stop_button').addClass('green').click(RECORDER.stop_playing);
        $('#recorder_play_button').hide();
        $('#recorder_pause_button').show();
    }
}
RECORDER.pause = function() {
    var rec = RECORDER.getRecorder();
    if (rec) {
        rec.pausePlaying();
        $('#recorder_play_button').show();
        $('#recorder_pause_button').hide();
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
    $('#stop_button').removeClass('green').off('click');
    $('#recorder_play_button').off('click').addClass('green').click(RECORDER.play);
}

RECORDER.encoding_complete= function() {
    $("#save_note").removeClass('disabled').click(RECORDER.save_note);
    $('#rec_indicator').addClass('red');
    $('#recorder_play_button').off('click').addClass('active').click(RECORDER.play);

}

RECORDER.audio_level=function(level) {
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
    $('#save_note').off('click');
}

RECORDER.finished_recording= function(path) {
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

RECORDER.uploading_recording= function() {
    debug('Uploading recording...');
    //$('#upload-panel').dialog('open');
    var notes=$('#available_recordings');
    $('#record_note img').show();
    $('#record_note span').hide();
    $("#save_note").addClass('disabled');
}

// redirect Flash ExternalInterface calls: 
recorder_initialized=RECORDER.initialized;
recording_stopped=RECORDER.recording_stopped; 
uploading_recording=RECORDER.uploading_recording;
finished_recording=RECORDER.finished_recording;
encoding_complete=RECORDER.encoding_complete;
audio_level=RECORDER.audio_level;
recording_timer=RECORDER.recording_timer;
countdown=RECORDER.countdown;
camera_accepted=RECORDER.camera_accepted;
camera_denied=RECORDER.camera_denied;
stopped_playing=RECORDER.stopped_playing;