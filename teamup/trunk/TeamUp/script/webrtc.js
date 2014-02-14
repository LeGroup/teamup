WEBRTC_REC={available:false, stream:null, recorder: null, context: null, position: 0}

WEBRTC_REC.gotStream = function(stream, isVideo) {
	console.log(arguments);
    window.URL = window.URL || window.webkitURL;
	if(isVideo)
	{
		var video=$('#rtc_monitor_note')[0];
		WEBRTC_REC.stream=stream;
		debug('got video stream')
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
		/*
		video.onloadedmetadata = function(e) {
			// adjust position here if necessary
		}*/
	}
	else
	{
		var src=WEBRTC_REC.context.createMediaStreamSource(stream);
		WEBRTC_REC.recorder=new Recorder(src);
		RECORDER.camera_accepted();
	}
};

WEBRTC_REC.startRecording=function()
{
	var cd=3;
	WEBRTC_REC.countdownId=setInterval(function()
	{
		RECORDER.countdown(--cd);
		if(cd === 0)
		{
			clearInterval(WEBRTC_REC.countdownId);
			WEBRTC_REC.capture();
			WEBRTC_REC.recorder.record();
			var prevlen=0;
			WEBRTC_REC.levelId=setInterval(function()
			{
				WEBRTC_REC.recorder.getMonoBuffer(function(buf)
				{
					var max=0;
					for(var i=prevlen; i<buf.length; ++i)
					{
						if(buf[i]>max) max=buf[i];
					}
					RECORDER.audio_level(max*100); // Max is 0-1, audio_level() expects 0-100
					prevlen=buf.length-1;
				});
			}, 100);
			var t=0;
			WEBRTC_REC.recId=setInterval(function()
			{
				RECORDER.recording_timer(t++);
			}, 100);
		}
	}, 1000);
};

WEBRTC_REC.stopRecording=function()
{
	WEBRTC_REC.recorder.stop();
	clearInterval(WEBRTC_REC.recId);
	clearInterval(WEBRTC_REC.levelId);
	RECORDER.recording_stopped();
	WEBRTC_REC.recorder.getMonoBuffer(function(buf) {
		WEBRTC_REC.Buffer=buf;
		WEBRTC_REC.recorder.exportmp3(function(blob) {
			WEBRTC_REC.blob=blob;
			RECORDER.encoding_complete();
		});
	});
};

WEBRTC_REC.startPlaying = function() {
	var abuf=WEBRTC_REC.context.createBuffer(1, WEBRTC_REC.Buffer.length, WEBRTC_REC.context.sampleRate);
	abuf.getChannelData(0).set(WEBRTC_REC.Buffer);
	var src=WEBRTC_REC.context.createBufferSource();
	src.buffer = abuf;
	src.connect(WEBRTC_REC.context.destination);
	src.onended=WEBRTC_REC.stopPlaying;
	src.start(0);
	WEBRTC_REC.BufferSource=src;
	var t=0;
	WEBRTC_REC.playbackId=setInterval(function()
	{
		RECORDER.playback_timer(t);
		t+=100;
	}, 100);
};

WEBRTC_REC.stopPlaying = function() {
	WEBRTC_REC.BufferSource.stop();
	RECORDER.stopped_playing();
	clearInterval(WEBRTC_REC.playbackId);
};

WEBRTC_REC.noStream = function(e) {
    debug('no stream')
};

WEBRTC_REC.capture = function() {
    var canvas=$('#rtc_canvas_note')[0];
    var ctx=canvas.getContext('2d');
    var video=$('#rtc_monitor_note')[0];
    canvas.width=220;
    canvas.height=220;
    ctx.drawImage(video,80,0,480,480,0,0,220,220)
    //ctx.drawImage(video,80,0,480,480,0,0,220,220);
    $('#WebRTC_monitor_area_note').hide();
    $('#WebRTC_canvas_area_note').show();
    CAMERA.tookPhoto();
}

WEBRTC_REC.saveRecording = function(server_path, class_name, user_uid) {
	RECORDER.uploading_recording();
	var reader=new FileReader();
    var canvas=$('#rtc_canvas_note')[0];
	canvas.toBlob(function(imgblob)
	{
		var fd=new FormData();
		fd.append("class_id", class_name);
		fd.append("record_id", user_uid);
		fd.append("Filename", "voice.mp3");
		fd.append("voice", WEBRTC_REC.blob, "voice.mp3");
		fd.append("Filename", "photo.jpg");
		fd.append("photo", imgblob, "photo.jpg");
		$.ajax({
			type: "POST",
			url: "/varloader.php",
			data: fd,
			processData: false,
			contentType: false,
			success: function(path){
				RECORDER.finished_recording(path);
				WEBRTC_REC.recorder.clear();
			}
		});
	});
}

WEBRTC_REC.cancel = function() {
    WEBRTC_REC.stream.stop();
    $('#WebRTC_monitor_area_note').hide();
    $('#WebRTC_canvas_area_note').hide();
}

WEBRTC_REC.release = function() {
    $('#WebRTC_monitor_area_note').show();
    $('#WebRTC_canvas_area_note').hide();
}

// Student photos

WEBRTC_CAM={available:false, stream:null};
WEBRTC_CAM.gotStream = function(stream) {
    window.URL = window.URL || window.webkitURL;
    var video=$('#rtc_monitor')[0];
    WEBRTC_CAM.stream=stream;
    debug('got stream');
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
	/*
    setTimeout(function() {
        // adjust position here if necessary
    }, 50)*/
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
	canvas.toBlob(function(imgblob)
	{
		var fd=new FormData();
		fd.append("class_id", class_name);
		fd.append("record_id", user_uid);
		fd.append("Filename", "photo.jpg");
		fd.append("picture", imgblob, "photo.jpg");

		$.ajax({
			type: "POST",
			url: loc,
			data: fd,
			processData: false,
			contentType: false,
			success: function(path){
				debug('*** php replied:'+path);
				CAMERA.savedPhoto(path);
			}
		});
	});
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
