// **********************************
// Team notes view

TEAM_NOTES.highlighted_question=0;
TEAM_NOTES.player_ready=false;

TEAM_NOTES.next= function() {
    BOTTOM_HEIGHT=96;
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
    $('div.bottom').show()
    $('div.recordings').hide('slide', {direction:'left'}, 300);
    $('#available_recordings').hide('slide', {direction:'left'}, 300);
    TEAM_NOTES.create_team_notes(next_team);
    $('div.recordings').show('slide',{direction:'right'},300);
    $('#available_recordings').show('slide',{direction:'right'},300);
}   

TEAM_NOTES.prev= function() {
    BOTTOM_HEIGHT=96;
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
    $('div.bottom').show()
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


TEAM_NOTES.adjust_heights = function() {
    var inner_height=WINDOW_HEIGHT - TOP_HEIGHT - BOTTOM_HEIGHT;
    $('div.recordings').css('height', inner_height);
    var table=$('div.recordings table:first');
    var size_difference = inner_height-389;
    if (size_difference<0) {
        $('div.recordings table tr').first().hide();
        size_difference+=96;        
    } else {
        $('div.recordings table tr').first().show();        
    }
    table.css('top', size_difference/2);
}


TEAM_NOTES.show = function() {
    BOTTOM_HEIGHT=96;
    TEAM_NOTES.view_mode();
    TEAM_NOTES.adjust_heights();
    enable_nav();
    enable_bottom();
    $('div.recordings').show('slide', {direction:'down'},300);
    $('#available_recordings').show('slide',{direction:'down'},300);
    view=TEAM_NOTES;    
}


TEAM_NOTES.highlight_question= function(n) {
    if (TEAM_NOTES.highlighted_question==n) {
        return;
    }
    var q=$('#note_questions p');
    $(q[TEAM_NOTES.highlighted_question]).removeClass('highlight').fadeIn('slow');
    $(q[n]).addClass('highlight').fadeIn('slow');
    TEAM_NOTES.highlighted_question=n;
}

TEAM_NOTES.create_team_notes= function(team) {
    if (RECORDER.on) {
        
    }
    RECORDER.on=false;
    TEAM_NOTES.adjust_heights();
    TEAM_NOTES.highlight_question(0);
    $('#note_questions p').first().addClass('highlight');

    $('#note_recorder').hide();

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
    $('#note_photo').css('background-color',team.color).show(); 
    $('div.vumeter').hide();
    $('#save_note').off('click').addClass('disabled');
    $('#rec_indicator').off('click').removeClass('active').removeClass('recording');
    $('#recorder_play_button').off('click').removeClass('active');
    $('#full_line').css('width',464).off('click');
    $('#progress_line').css({'width':0,'background-color':team.color});
    $('#recorder_buttons').hide();
    $('#player_buttons').show();
    // jPlayer disables its buttons, we need to care only about looks  
    $('#play_button').removeClass('active');


    //debug('create_team_notes calling setData');
    setData(tt, team);
    var place=$('#team_member_faces');
    place.html('');
    var s, obj, member;   
    for (var i=0;i<team.members.length;i++) {
        member=CATALOG[team.members[i]];
        s='<div class="team_face" alt="'+member.name+'" title="'+member.name+'" style="border-color:'+team.color+'">';
        s+='<img src="'+member.img_src+'" width="40" height="40" />';
        if (member.img_src==DEFAULT_IMAGE || CLASS_SETTINGS.always_show_names) {
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
        debug('adding team note '+i)
        note=CATALOG[team.notes[i]];        
        s='<div class="note_thumbnail">';
        if (!note) {
            debug('note not found')
            continue;
        }
        dt=new Date(note.timestamp);
        s+='<label>'+(dt.getDate())+'/'+(dt.getMonth()+1)+' '+dt.getHours()+':'+((dt.getMinutes()<10) ? '0':'')+dt.getMinutes()+'</label>';
        if (note.photos.length>0) {                        
            s+='<img src="'+note.photos[0]+'" width="60" height="60" />';
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
    notes.append('<div id="record_note" class="button"><span>+</span><img src="images/upload.gif" width="32" height="32" style="display:none" /></div>');
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
        $('#recorder_toggle').css('border-color', team.color).show().off('click').click(RECORDER.prepare_recorder).addClass('active');
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
    // autoplay is now enabled-- TODO 1.10.     
    //$('#note_player').jPlayer("play", 0);
}  

TEAM_NOTES.empty_note= function() {
    //setData($('#note_viewer'), null);
    $('#note_photo label').html('');
    $('#note_photo_img').hide();
    $('#note_player').jPlayer("setMedia", {mp3:''});
    $('#timer_text span.now').text('0:00');
    $('#timer_text span.max_duration').text('0:00');
}


TEAM_NOTES.load_note= function(note) {
    //debug('load_note calling setData');

    setData($('#note_photo'), note);
    var dt = new Date(note.timestamp);
    $('#recorder_toggle').hide();

    $('#note_photo label').html((dt.getDate())+'/'+(dt.getMonth()+1)+' '+dt.getHours()+':'+((dt.getMinutes()<10) ? '0':'')+dt.getMinutes());
    if (note.photos.length>0) {
        $('#note_photo_img').show();
        $('#note_photo_img').attr('src', note.photos[0]);
    } else {
        $('#note_photo').css('background-image','none');
        $('#note_photo_img').hide();
    }

    if (TEAM_NOTES.player_ready) {
        $('#note_player').jPlayer("setMedia", {mp3:note.audio_url});
        debug('loading '+note.audio_url+' to jPlayer');
    } else {
        debug('loading note, but player is not ready.');
    }

}

TEAM_NOTES.view_mode= function(event) {
    if (!RECORDER.on) 
        {return;}
    $('#note_recorder').hide();
    $('#save_note').addClass('disabled');
    RECORDER.on=false;
}

//    <div id="note_recorder_help" style="display:none">
//        <p id="recording_help_1">Record a 60 second newsflash.</p>
//        <p id="recording_help_2">Click the record button.</p>
//        <p id="recording_help_3">After the countdown, your picture is taken,<br/> then the recording starts.</p>
//        <p id="recording_help_4">Answer the questions below the recorder.</p>
//    </div>

TEAM_NOTES.prepare_audio= function() {
    debug('player is now ready.')
    var note=getData($('#note_photo'));
    var rec=''
    TEAM_NOTES.player_ready=true;
    if (note!=null) {
        rec=note.audio_url;
    }
    if (rec) {
        $('#note_player').jPlayer("setMedia", {mp3:rec});        
    }
}

TEAM_NOTES.play = function(event) {
    $('#progress_line').css('width',event.jPlayer.status.currentTime*(464/60));
}

TEAM_NOTES.show_play_progress = function(event) {
    var ct= event.jPlayer.status.currentTime;
    $('#progress_line').css('width', ct*(464/60));
    var now_minutes = Math.floor(ct/60);
    var now_seconds = Math.floor(ct%60);
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

// Full line of progress bar is 464 pixels wide.
// 1 second = 464/60= 7.733333... pixels

TEAM_NOTES.set_up_timeline = function(event) {
    var ft= event.jPlayer.status.duration;
    $('#progress_line').css('width',0);
    $('#full_line').css('width',(464/60)*ft);
    var full_minutes = Math.floor(ft/60);
    var full_seconds = Math.floor(ft%60);
    if (full_seconds>9) {
        $('#timer_text span.max_duration').text(''+full_minutes+':'+full_seconds);
    } else {
        $('#timer_text span.max_duration').text(''+full_minutes+':0'+full_seconds);
    }
    $('#play_button').addClass('active');    
    $('#full_line').off("click").click(TEAM_NOTES.jump_in_timeline);

}

TEAM_NOTES.jump_in_timeline = function(event) {   
    var x= event.pageX-$(this).offset().left;
    var seconds=x/(464/60);
    $('#progress_line').css('width',x);
    dur=$('#note_player').data("jPlayer").status.duration;
    $('#note_player').jPlayer('playHead',Math.round((seconds/dur)*100));
    if (seconds>39) {
        TEAM_NOTES.highlight_question(2);            
    } else if (seconds>19) {
        TEAM_NOTES.highlight_question(1);            
    } else {
        TEAM_NOTES.highlight_question(0);            
    }
}

    


