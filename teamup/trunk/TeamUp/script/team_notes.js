// **********************************
// Team notes view

TEAM_NOTES.next= function() {
    var next_team;    
    var team=getData($('#team_title'));
    for (var i=0;i<TEAMS.length;i++) {
        if (team==TEAMS[i]) {
            if (i<TEAMS.length-1) {
                next_team=TEAMS[i+1];
            } else {
                next_team=TEAMS[0];
            }
        }
    }
    $('div.recordings').hide('slide', {direction:'left'}, 300);
    $('#available_recordings').hide('slide', {direction:'left'}, 300);
    TEAM_NOTES.create_team_notes(next_team);
    $('div.recordings').show('slide',{direction:'right'},300);
    $('#available_recordings').show('slide',{direction:'right'},300);
}   

TEAM_NOTES.prev= function() {
    TEAM_NOTES.view_mode();
    var prev_team;
    var team=getData($('#team_title'));
    for (var i=0;i<TEAMS.length;i++) {
        if (team==TEAMS[i]) {
            if (i>0) {
                prev_team=TEAMS[i-1];
            } else {
                prev_team=TEAMS[TEAMS.length-1];
            }
        }
    }
    $('div.recordings').hide('slide', {direction:'right'}, 300);
    $('#available_recordings').hide('slide', {direction:'right'}, 300);
    TEAM_NOTES.create_team_notes(prev_team);
    $('div.recordings').show('slide',{direction:'left'},300);
    $('#available_recordings').show('slide',{direction:'left'},300);
}   

TEAM_NOTES.hide = function(){
    $('div.recordings').hide();
    $('#available_recordings').hide();        
}

TEAM_NOTES.show = function() {
    var table=$('div.recordings table:first');
    $('div.recordings').css('height', WINDOW_HEIGHT-TOP_HEIGHT-BOTTOM_HEIGHT);
    enable_nav();
    enable_bottom();
    table.css('top',(WINDOW_HEIGHT-TOP_HEIGHT-BOTTOM_HEIGHT-480)/2+TOP_HEIGHT);
    $('div.recordings').show('slide', {direction:'down'},300);
    $('#available_recordings').show('slide',{direction:'down'},300);
    view=TEAM_NOTES;    
}


TEAM_NOTES.create_team_notes= function(team) {
    CAMERA.on=false;
    $('#note_viewer').show();
    $('#note_recorder').hide();
    $('#note_questions').show();
    $('#recorder_cam_panel').hide();
    $('#recorder_cam_options').hide();    
    //$('#recorder_save_help').hide();
    var ti;
    for (ti=0;ti<TEAMS.length;ti++) {
        if (TEAMS[ti].uid==team.uid) {
            break
        }
    }
    $('div.left_nav').attr('title',  (ti==0) ? TEAMS[TEAMS.length-1].name : TEAMS[ti-1].name);
    $('div.right_nav').attr('title', (ti==TEAMS.length-1) ? TEAMS[0].name : TEAMS[ti+1].name);

    var tt=$('#team_title');
    tt.text(team.name);
    $('#note_photo').css('background-color',team.color); 
    $('div.vumeter').hide();
    $('#rec_button').removeClass('activated');

    //debug('create_team_notes calling setData');
    setData(tt, team);
    var place=$('#team_member_faces');
    place.html('');
    var s, obj, member;   
    for (var i=0;i<team.members.length;i++) {
        member=CATALOG[team.members[i]];
        s='<div class="team_face" alt="'+member.name+'" title="'+member.name+'" style="border-color:'+team.color+'">';
        s+='<img src="'+member.img_src+'" width="40" height="40" />';
        if (member.img_src==DEFAULT_IMAGE || OPTIONS.always_show_names) {
            s+='<label>'+member.name+'</label>';
        }
        s+='</div>';
        place.append(s);
        obj=place.find('div.team_face').last();
        //debug('create_team_notes 2 calling setData');
        setData(obj, member);
        obj.click(LEARNER_VIEW.view_learner);
        
    }
    var notes=$('#available_recordings');
    notes.html('');
    var dt;
    notes.width(team.notes.length*142+142);

    var note, dt;
    for (var i=0;i<team.notes.length;i++) {
        note=CATALOG[team.notes[i]];
        s='<div class="note_thumbnail">';
        if (!note) {
            continue;
        }
        dt=new Date(note.timestamp);
        s+='<label>'+(dt.getDate())+'/'+(dt.getMonth()+1)+' '+dt.getHours()+':'+((dt.getMinutes()<10) ? '0':'')+dt.getMinutes()+'</label>';
        if (note.photos.length>0) {                        
            s+='<img src="'+note.photos[0]+'" width="128" height="96" />';
        }
        if (MODERATOR) {
            s+='<span class="remove_note">x</span>';
        }
        s+='</div>';
        notes.append(s);
        obj=notes.find('div.note_thumbnail').last();
        obj.click(TEAM_NOTES.load_this_note);        
        //debug('create_team_notes 3 calling setData');
        setData(obj, note);
        obj.find('span.remove_note').click(TEAM_NOTES.remove_note);
    }
    notes.append('<div id="record_note" class="button">+</div>');
    if (team.notes.length>0){
        note=CATALOG[team.notes[team.notes.length-1]];
        if (note && note.uid) {
            TEAM_NOTES.load_note(CATALOG[team.notes[team.notes.length-1]]);
        } else {
            // remove broken note
            team.notes.splice(team.notes.length-1, 1);
            CONTROLLER.addChange(team);
            CONTROLLER.sendChanges();
            TEAM_NOTES.empty_note();
        }
    } else {
        TEAM_NOTES.empty_note();        
    }
    $('#record_note').click(RECORDER.prepare_recorder);        

}
TEAM_NOTES.remove_note=function(event, confirmed) {
    var note;
    if (!confirmed) {
        note=getData($(this).parent('div.note_thumbnail'));
        if (!note) {
            debug("couldn't find the note");
        }
        debug('removing note...');
        setData($('#delete-note-confirm-panel'), note);
        $('#delete-note-confirm-panel').dialog('open');
        return;        
    }
    debug('confirmed!');
    note=getData($('#delete-note-confirm-panel'));
    debug('note:'+ note.uid);
    if (note.uid!='') {
        var team=getData($('#team_title'));
        var note_index=-1;
        for (var i=0;i<team.notes.length;i++) {
            if (team.notes[i]==note.uid) {
                note_index=i;
                break;
            }
        }
        if (MODERATOR && note_index>-1) {
            team.notes.splice(note_index,1);
            CONTROLLER.addChange(team);
            CONTROLLER.sendChanges();
            TEAM_NOTES.create_team_notes(team);
        }


    }
}

TEAM_NOTES.load_this_note= function(event) {
    TEAM_NOTES.load_note(getData($(this)));
    TEAM_NOTES.view_mode(event);
}  

TEAM_NOTES.empty_note= function() {
    //setData($('#note_viewer'), null);
    $('#note_photo label').html('');
    $('#note_photo_img').hide();
    $('#note_viewer_object').jPlayer("setMedia", {mp3:''});
    $('#note_questions p span').removeClass('highlight');
    $('#i18n-team-photo').addClass('highlight');
}


TEAM_NOTES.load_note= function(note) {
    //debug('load_note calling setData');
    setData($('#note_viewer'), note);
    var dt = new Date(note.timestamp);
    $('#note_photo label').html((dt.getDate())+'/'+(dt.getMonth()+1)+' '+dt.getHours()+':'+((dt.getMinutes()<10) ? '0':'')+dt.getMinutes());
    if (note.photos.length>0) {
        $('#note_photo_img').show();
        $('#note_photo_img').attr('src', note.photos[0]);
    } else {
        $('#note_photo').css('background-image','none');
        $('#note_photo_img').hide();
    }
    $('#note_viewer_object').jPlayer("setMedia", {mp3:note.audio_url});
}

TEAM_NOTES.view_mode= function(event) {
    if (!RECORDER.on) 
        {return;}
    $('#note_viewer').show();
    $('#note_recorder').hide();
    $('#note_questions').show();

    CAMERA.on=false;
}

//    <div id="note_recorder_help" style="display:none">
//        <p id="recording_help_1">Record a 60 second newsflash.</p>
//        <p id="recording_help_2">Click the record button.</p>
//        <p id="recording_help_3">After the countdown, your picture is taken,<br/> then the recording starts.</p>
//        <p id="recording_help_4">Answer the questions below the recorder.</p>
//    </div>


TEAM_NOTES.prepare_audio= function() {
    var note=getData($('#note_viewer'));
    var rec=''
    if (note!=null) {
        rec=note.audio_url;
    }
    $('#note_viewer_object').jPlayer("setMedia", {mp3:rec});
}

TEAM_NOTES.save_note= function() {
    var recorder = swfobject.getObjectById('TeamRecorder');
    var team=getData($('#team_title'));

    var note_id=new Date().getTime().toString().substring(5);
    var server_path=SERVER_URL;
    var class_uid= fs_friendly_string((PARAMS) ? PARAMS.class_key : 'demo');
    var note_uid= fs_friendly_string(team.uid)+'_note_'+note_id;

    if (recorder.save !== undefined) {
        debug('Found recorder');
        recorder.save(server_path, class_uid, note_uid);  // will result in 'savedPhoto' call
    }        
}
