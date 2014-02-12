// **********************************
// Team recorder


/**

Mic button:
lt_grey: active, click:start recording -> turn to red
lt_grey:hover : lighter mic button
red: recording, click:stop recording -> turn to dk_grey (encode mp3) -> turn to lt_grey
red:hover : red stop button
dk_grey: inactive

Play button:
lt_grey: active, click:start playing -> turn into pause button (hide play, show pause)
lt_grey:hover : lighter play button
dk_grey: inactive

Pause button:
lt_grey: active, click:pause playing -> turn into play button (hide pause, show play)
lt_grey:hover : lighter pause button

styles and skin files required:
-------Mic------
rec_indicator.active          mic_lt_grey1.png
rec_indicator.active:hover    mic_lt_grey2.png
rec_indicator                 mic_dk_grey.png
rec_indicator.recording       mic_red.png
rec_indicator.recording:hover stop_red.png
-------Play-----
recorder_play_button.active         play_lt_grey1.png
recorder_play_button.active:hover   play_lt_grey2.png
recorder_play_button                play_dk_grey.png
-------Pause----
recorder_pause_button               pause_lt_grey1.png
recorder_pause_button:hover         pause_lt_grey2.png

**/


RECORDER={on:false, duration:60, this_note_uid:'', vumeter_values:[], vumeters: [$('#vumeter_0'),
    $('#vumeter_1'),
    $('#vumeter_2'),
    $('#vumeter_3'),
    $('#vumeter_4'),
    $('#vumeter_5'),
    $('#vumeter_6'),
    $('#vumeter_7')]
}

RECORDER.AudioContext=null;

RECORDER.prepare_recorder=function() {

    // hide, disable or reset everything related to playback
    debug(': preparing recorder')
    $('#rec_indicator').removeClass('red').removeClass('green');
    $('#save_note').addClass('disabled');
    $('#full_line').css('width',464).off("click");
    $('#progress_line').css('width',0);
    $('#recorder_pause_button').hide();
    $('#recorder_buttons').show();
    $('#player_buttons').hide();
    $('#recorder_toggle').hide();
    $('#note_player').jPlayer("setMedia", {mp3:''});
    $('#timer_text span.now').text('0:00');
    $('#timer_text span.max_duration').text('0:00');

    if (!RECORDER.getRecorder()) {
        swfobject.embedSWF('recorder/TeamRecorder4.swf', 'TeamRecorder', '240', '240', '10.3.0', 'expressInstall.swf', {},{wmode:"opaque"},{});
    }
    $('#note_photo').hide();
    $('#note_recorder').css('border-color','transparent').show();
    RECORDER.on=true;
}

RECORDER.getRecorder=function() {
	if(WEBRTC_REC.available) return WEBRTC_REC;
	try {
		navigator.getUserMedia = navigator.getUserMedia ||
								 navigator.webkitGetUserMedia ||
								 navigator.mozGetUserMedia ||
								 navigator.msGetUserMedia;

		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		WEBRTC_REC.context=new AudioContext();

        $('#WebRTC_monitor_area_note').show();
		navigator.getUserMedia({video: true}, function(s){WEBRTC_REC.gotStream(s, true);}, WEBRTC_REC.noStream);
		navigator.getUserMedia({audio: true}, WEBRTC_REC.gotStream, WEBRTC_REC.noStream);
		$("#TeamRecorder").hide(); // Flash warning text
		return WEBRTC_REC;
	}
	catch(e)
	{// Fallback to flash
		debug("Flash");
		var rec=swfobject.getObjectById('TeamRecorder');
		if (rec && rec.initCamera !== undefined) {
			return rec;
		} else {
			debug('no recorder available');
			return null;
		}
	}
}

RECORDER.initialized=function() {
    // recorder has loaded and its actionscript is reachable
    debug('<-initialized');

    rec=RECORDER.getRecorder();
    if (rec) {
        debug('ping received from recorder');
        debug('-> initCamera');
        rec.initCamera();
        debug('-> initMic');
        rec.initMic();
        $('#recorder_toggle').hide();

    }
}

RECORDER.camera_accepted=function() {
        $('#recorder_toggle').show().off('click').click(RECORDER.start_recording); //.css('border-color', '#33aa33')
        $('div.vumeter').show();
        debug('<- camera accepted');
}
RECORDER.camera_denied=function() {
    debug('<- camera denied');
    alert('Cannot record without access to camera')
}

RECORDER.start_recording = function() {
    var rec = RECORDER.getRecorder();
    if (rec) {
        debug('-> startRecording')
        $('div.vumeter').show();

        rec.startRecording();
        $('#recorder_play_button').removeClass('active');
        $('#recorder_toggle').css('border-color', 'transparent').removeClass('active').hide();
        $('#rec_indicator').removeClass('active').addClass('recording').off('click').click(RECORDER.stop_recording);
        $('#full_line').css('width',464).off("click");
        $('#progress_line').show().width(0).css('background-color','#e00000');
        $('#countdown').text("3").show();
        $('#note_recorder').css('border-color','transparent');

    }
};

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
        TEAM_NOTES.highlight_question(1);
    }
};

RECORDER.playback_timer = function(t) {
    // incoming t is 1/1000:s of seconds
    t=t/100;
    $('#progress_line').width((t/600)*464);
    t=t/10;
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
        TEAM_NOTES.highlight_question(1);
    } else if (now_seconds==0) {
        TEAM_NOTES.highlight_question(0);
    }
};


RECORDER.countdown = function(t) {
    debug('<- countdown '+t);

    if (t==0) {
        $('#countdown').hide();
        var team=getData($('#team_title'));
        $('#note_recorder').css('border-color',team.color);
    } else {
        $('#countdown').text(t).show();
    }
}

function html5Play(buf) {
	var abuf=RECORDER.AudioContext.createBuffer(1, buf.length, RECORDER.AudioContext.sampleRate);
	abuf.getChannelData(0).set(buf);
	var src=RECORDER.AudioContext.createBufferSource();
	src.buffer = abuf;
	src.connect(RECORDER.AudioContext.destination);
	src.start(0);
}

RECORDER.stop_recording = function() {
    var rec = RECORDER.getRecorder();
    if(rec) {
        debug('-> stopRecording')
        rec.stopRecording();
    }
}

RECORDER.recording_stopped = function() {
    debug('<- recorder stopped');
    var team=getData($('#team_title'));
    $('#rec_indicator').removeClass('recording').off('click');
    $('div.vumeter').hide();
    $('#timer_text span.now').text('0:00');
    var full_minutes = Math.floor(RECORDER.duration/60);
    var full_seconds = Math.floor(RECORDER.duration%60);
    if (full_seconds>9) {
        $('#timer_text span.max_duration').text(''+full_minutes+':'+full_seconds);
    } else {
        $('#timer_text span.max_duration').text(''+full_minutes+':0'+full_seconds);
    }
    $('#full_line').off("click").click(RECORDER.jump_in_timeline).css('width',(RECORDER.duration/60)*464);
    $('#progress_line').css({width:0, 'background-color':team.color});

}

RECORDER.play = function() {
    var rec = RECORDER.getRecorder();
    if (rec) {
        debug('-> startPlaying');
        rec.startPlaying();
        $('#recorder_play_button').hide();
        $('#recorder_pause_button').show();
        $('#full_line').css('width',(RECORDER.duration/60)*464);
    }
}
RECORDER.pause = function() {
    var rec = RECORDER.getRecorder();
    if (rec) {
        debug('-> stopPlaying (pause)');
        rec.stopPlaying();
    }
}


RECORDER.jump_in_timeline = function(event) {
    var x= event.pageX-$(this).offset().left;
    var seconds=x/(464/60);
    $('#progress_line').css('width',x);
    var rec = RECORDER.getRecorder();
    if (rec) {
        debug('-> movePlaybackToPosition '+seconds*1000);
        rec.movePlaybackToPosition(seconds*1000);
    }
    var now_minutes = Math.floor(seconds/60);
    var now_seconds = Math.floor(seconds%60);
    if (now_seconds>9) {
        $('#timer_text span.now').text(''+now_minutes+':'+now_seconds);
    } else {
        $('#timer_text span.now').text(''+now_minutes+':0'+now_seconds);
    }


    if (seconds>39) {
        TEAM_NOTES.highlight_question(2);
    } else if (seconds>19) {
        TEAM_NOTES.highlight_question(1);
    } else {
        TEAM_NOTES.highlight_question(0);
    }
}


RECORDER.stopped_playing = function() {
    $('#recorder_play_button').show();
    $('#recorder_pause_button').hide();
    if ($('#full_line').css('width')-$('#progress_line').css('width')<3) {
        $('#progress_line').css('width', $('#full_line').css('width'));
    }
}

RECORDER.encoding_complete= function() {
    $("#save_note").removeClass('disabled').click(RECORDER.save_note);
    $('#rec_indicator').addClass('active').click(RECORDER.start_recording);
    $('#recorder_play_button').off('click').addClass('active').click(RECORDER.play);

}

RECORDER.audio_level=function(level) {
    RECORDER.vumeter_values.push(level*0.75);
    if (RECORDER.vumeter_values.length>10) {
        RECORDER.vumeter_values.shift()
    }
    for (var i=0; i<RECORDER.vumeter_values.length; i++) {
        $('#vumeter_'+i).height(RECORDER.vumeter_values[i]);
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
    RECORDER.this_note_uid=note_uid

    $('#save_note').off('click');
    $('#rec_indicator').off('click').removeClass('active');
    $('#recorder_play_button').off('click').removeClass('active');
}

RECORDER.finished_recording= function(path) {
    debug('Received a record:'+path);
    // Create an empty note but don't catalog it yet
    var note = new TeamNote(false);
    note.audio_url=SERVER_URL+path+'_rec.mp3';
    debug(note.audio_url);
    note.photos.push(SERVER_URL+path+'_pic.jpg');
    // Give it a proper uid before cataloging
    var team=getData($('#team_title'));
    note.uid=RECORDER.this_note_uid;
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
playback_timer=RECORDER.playback_timer;
