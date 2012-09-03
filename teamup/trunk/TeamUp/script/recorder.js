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
    if (!RECORDER.getRecorder()) {
        swfobject.embedSWF('recorder/TeamRecorder4.swf', 'TeamRecorder', '240', '240', '10.3.0', 'expressInstall.swf', {},{},{});
    }
    debug('record mode on');
    $('#note_viewer').hide();
    $('#note_recorder').show();
    //$('#note_questions').hide('slide', {direction:'left'});
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
        $('#recorder_toggle').css('border-color', '#33aa33');
        $('#recorder_toggle').off('click').click(RECORDER.start_recording);
        $('div.vumeter').show();
    }
}

RECORDER.keep_photo = function() { 
    debug('keeping this photo...');
    
    $("#recorder_cam_options").hide('slide',{direction:'left'}, 
    function() { $("#note_questions").show('slide', {direction:'left'}, 
        function() { 
            $("#i18n-team-photo").removeClass('highlight').next('span.check').fadeIn('slow');
            $("#i18n-what-we-did").addClass('highlight');
            var rec = RECORDER.getRecorder(); 
            if (rec) {
                rec.initMic();  // doesn't call back, just removes the still
            }
            $('div.vumeter').show();
            $('#rec_button').addClass('activated').off();
            $('#rec_button.activated').click(RECORDER.start_recording);

        });
    });
}

RECORDER.start_recording = function() {
    var rec = RECORDER.getRecorder(); 
    if (rec) {
        rec.startRecording();
        $('#recorder_toggle').hide();
        $('#rec_button').removeClass('activated').addClass('recording').off();
        $('#progress_line').show().width(0);
        $('#countdown').text("3").show();

        $('#rec_button').click(RECORDER.stop_recording);         
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

RECORDER.recorder_stopped = function() {
    debug('recorder stopped');
    $('#rec_button').removeClass('recording').addClass('activated').off();
    $('#rec_button').click(RECORDER.start_recording);         
    $('span.check').show();
}

RECORDER.save = function() {
    
}

RECORDER.cancel_recording = function() {
    RECORDER.on=false;
    debug('canceling recording')
    $('#note_recorder').hide();
    $('#note_viewer').show();
    $('div.vumeter').hide();
    $('#rec_button').removeClass('activated');
}

RECORDER.encodingComplete= function() {
    $("#note_questions").hide('slide',{direction:'left'}, function() { 
        $("#recorder_audio_options").show('slide', {direction:'left'})
    });
    $('#rec_button').removeClass('recording').addClass('activated').off();
    $('#rec_button').click(RECORDER.start_recording);         

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

RECORDER.finishedRecording= function(path) {
    $('#upload-panel').dialog('close');
    $('div.recorder_panel').hide();
    debug('Received a record:'+path);
    // Create an empty note but don't catalog it yet
    var note = new TeamNote(false);
    note.audio_url=SERVER_URL+'uploads/'+path+'_rec.mp3';
    note.photos.push(SERVER_URL+'uploads/'+path+'_pic.jpg');
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
    $('#upload-panel').dialog('open');
    var notes=$('#available_recordings');
    notes.width(notes.width()+142);
    notes.append('<div class="note_thumbnail">...</div>');
    var thumb=notes.find('div.note_thumbnail').last();
    thumb.hide("slow");
    thumb.show("slow");
    thumb.hide("slow");
    thumb.show("slow");
    thumb.hide("slow");    
}

// redirect Flash ExternalInterface calls: 
recorderInitialized=RECORDER.initialized;
recorder_stopped=RECORDER.recorder_stopped; 
uploadingRecording=RECORDER.uploadingRecording;
finishedRecording=RECORDER.finishedRecording;
encodingComplete=RECORDER.encodingComplete;
audioLevel=RECORDER.audioLevel;
recording_timer=RECORDER.recording_timer;
countdown=RECORDER.countdown;