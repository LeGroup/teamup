// **********************************
// Class view

CLASSROOM.select_class_view = function (event) {
    if (view!=CLASSROOM) {
        view.hide();
        CLASSROOM.show('up');
    }
    $('#grid_button').addClass('selected');
    $('#teams_button').removeClass('selected');
    CLASSROOM.build_class_view(true);
}


CLASSROOM.select_team_view = function(event) {
    if (view!=CLASSROOM) {
        view.hide();
        CLASSROOM.show('up');
    }
    $('#grid_button').addClass('selected');
    $('#teams_button').removeClass('selected');
    CLASSROOM.redraw_team_labels();
    CLASSROOM.build_team_view(true);
}

CLASSROOM.populate_class= function() {
    var place=$('div.class_area');
    place.html('');
    var pup,s,obj, update;
    for (var i=0; i<PUPILS.length; i++) {
        pup=PUPILS[i];
        s='<div class="face" id="pup'+pup.uid+'"><label>'+pup.name+'</label><img src="'+pup.img_src+'" width="100" height="100" /></div>';
        // <span class="away ui-icon ui-icon-closethick">&nbsp;</span>
        place.append(s);
        obj=place.find('#pup'+pup.uid);
        if (OPTIONS.color) {
            obj.css({'background-color':pup.color, 'border-color':pup.color});
        }
        //debug('populate_class calling setData');
        setData(obj, PUPILS[i]);
        if (OPTIONS.always_show_names || pup.img_src==DEFAULT_IMAGE) {
            obj.find('label').show();
        } else {
            //obj.find('label').hide();
        }

    }
    for (var i=0; i<TEAMS.length; i++) {
        team=TEAMS[i];
        if (!team.color) {
            var colors=create_colors(TEAMS.length);
            for (var k=0; k<TEAMS.length; k++) {
                TEAMS[k].color=colors[k];
                team.color=colors[k];
                CONTROLLER.addChange(TEAMS[k]);
                update=true;
            }
        }
        for (var j=0; j<team.members.length; j++) {
            pup=team.members[j];
            obj=place.find('#pup'+pup.uid);            
            obj.css('border-color',team.color);            
        }
    }
    
    if (MODERATOR) {
        $('div.face').draggable({zIndex:2700}).droppable({greedy:false, over:CLASSROOM.drag_over, out:CLASSROOM.drag_out, drop:CLASSROOM.drag_drop, tolerance:'pointer', scroll:false});
        $('#new_person').show();        
    } else {
        $('#new_person').hide();
    }


    $('div.face').click(LEARNER_VIEW.view_learner);
//    $('span.away').click(function(event) {
//        var face=$(this).closest("div");
//        face.addClass('away');
//        event.stopImmediatePropagation();
//        face.click(function(event) {
//            $(this).removeClass('away');
//        });
//    });
    if (update) {
        CONTROLLER.sendChanges();
    }
}

CLASSROOM.drag_drop = function (event, ui) {
    debug('dropped');
    if (TEAM_VIEW) return CLASSROOM.switch_team(event, ui);
    var source=getData(ui.helper);
    var target=getData($(this));
    debug(source.uid);
    debug(target.uid);
    if (source.uid!=target.uid) {
        for (var i=0; i<PUPILS.length; i++) {
            if (source.uid==PUPILS[i].uid) {
                PUPILS.splice(i,1);
                break;            
            }
        }
        for (var i=0; i<PUPILS.length; i++) {
            if (target.uid==PUPILS[i].uid) {
                PUPILS.splice(i,0,source);
                break;
            }
        }
        debug('reorganizing');

        CONTROLLER.addArray('PUPILS',PUPILS);
        CONTROLLER.sendChanges();
    }
    CLASSROOM.build_class_view(true);
}

CLASSROOM.drag_over = function (event, ui) {
    if (TEAM_VIEW) return;
    var w=$(this).width()/4;
    $(this).animate({left:'+='+w})
}
CLASSROOM.drag_out = function (event, ui) {
    if (TEAM_VIEW) return;
    var w=$(this).width()/4;
    $(this).animate({left:'-='+w})

}

CLASSROOM.adjust_for_learners= function (event) {
    $('#admin_tag').hide();
    $('#reset_teams').closest('p').hide();
    $('#team_size').closest('p').hide();
    $('#teacher_url').closest('p').hide();
    $('#show_icons').closest('p').hide();
    $('#new_teams').html(i18n('vote'));
    $('#interests_next').hide();
    if (TEAMS.length==0) {
        $('#team_view').hide();    
    }

}


CLASSROOM.join_classroom = function (event) {
    CLASS_KEY=$.trim($('#class_key').val());
    CONTROLLER.fullUpdate();
    $('#welcome-panel').dialog('close');
}

CLASSROOM.prepare_new_classroom = function (event) {
    var names_string=$('#names_field').val();
    CLASS_KEY=$.trim($('#new_class_key').val());
    var names=names_string.split(',');
    var clean_names=[];
    for (var i=0;i<names.length;i++) {
        clean=$.trim(names[i]);
        if (clean.length>0) {
            clean_names.push(clean);
        }
    }    

    LEARNER_VIEW.create_person(clean_names);
    $('#welcome-panel').dialog('close');
}


CLASSROOM.build_class_view = function (animate) {
    if (TEAMS.length==0 && !MODERATOR) {
        $('#teams_button').hide();    
    } else {
        $('#teams_button').show();
    }            
    TEAM_VIEW=false;
    var box_width=$('div.main_area').width() - 100;
    var box_height=$('div.main_area').height()-120; // 72 px bottom margin, 12 px top margin
    
    var box_ratio=box_height/box_width;
    var per_row=Math.floor(Math.sqrt(PUPILS.length/box_ratio));
    var size=box_height/Math.ceil(PUPILS.length/per_row);
    if (size>255) size=255;
    var padding=(size-5)/20;
    left_margin= ((box_width-(size*per_row))/2) + 50
    var inner_size=size-padding-7;

    var x=left_margin;
    var y=42;
	
	
	//Build team note icons
	if(TEAMS.length > 0)
	{
		if (animate) { $('div.team_notes').stop().animate({opacity:1.0},1200); }
		
		$('.team_notes').empty().css({ left: x - 50, top: y });
		$('.team_notes').append('<img src="icons/rec.png" width="35" height="35" alt="Notes" />');
		
		var tteam, team_note_obj;
		
		for (i = 0; i < TEAMS.length; i++) {        
			tteam=TEAMS[i];
			team_note_obj = $('<div style="background-color: '+tteam.color+'" data-teamId="'+i+'" title="'+tteam.name+'">'+tteam.notes.length+'</div>');
			team_note_obj.click(CLASSROOM.go_team_notes_by_number);
			$('.team_notes').append(team_note_obj);
		}
	} else {
        $('div.face').css('border-color','transparent');
    }
    if (animate){
        $('div.face').animate({width:inner_size, height:inner_size});
        $('div.face img').animate({width:inner_size, height:inner_size});
    } else {
        $('div.face').css({width:inner_size, height:inner_size});
        $('div.face img').css({width:inner_size, height:inner_size});
    }        
    if (animate) {
        $('div.team_box').animate({opacity:0.0},1200);
        $('span.team_name').animate({opacity:0.0},1200);
    }
    $('div.face label').css({'font-size':inner_size+'%', width:inner_size});
    //$('div.face').droppable('enable');   
    var step=size;
    var col=0;
    var face;
    for (i=0;i<PUPILS.length;i++) {
        col++;
        face=PUPILS[i].getFace('pup');
        if (animate) {
            face.animate({left:x, top:y})
        } else {
            face.css({left:x, top:y})
        }
        x+=step;
        if (col==per_row){
            x=left_margin;
            y+=step;
            col=0;
        }
    }            
    $('div.team_box').hide();
    $('span.team_name').hide();
}         

CLASSROOM.build_team_view = function(animate) {
    TEAM_VIEW=true;
    if (TEAMS.length==0) {
        if (MODERATOR) {
            CLASSROOM.create_random_teams();
        } else {
            return;
        }
    } 
	     
    if (animate) {
        $('div.team_notes').stop().animate({opacity:0.0},1200);
    }
	
    var box_width=$('div.main_area').width()-60;
    var box_height=$('div.main_area').height()-110; // 72 px bottom margin, 12 px top margin

    // calculate optimal space for displaying teams:    
    var height_factor=Math.cos((Math.PI/180)*30)
    var left_margin=30;
    var top_margin=12;
    
    var cols=0;
    var rows=0;
    var r=0;
    var r_t=0;
    var fitted=true;
    var row_t, extra_nodes, wmax, hmax;    
    for (col_t=1;col_t<8;col_t++) {
        row_t=Math.ceil(TEAMS.length/col_t);
        // there is a possibility of more rows appearing
        extra_nodes=Math.floor(row_t/2);
        row_t=Math.ceil((TEAMS.length+extra_nodes)/col_t);
        wmax=box_width/col_t;
        hmax=box_height/height_factor/row_t;
        if (hmax>wmax) {
            r_t=wmax;
        } else {
            r_t=hmax;
        }
        if (r_t>r) {
            r=r_t;
            cols=col_t;
            rows=row_t;
            fitted=true;
        }
    }
    for (col_t=1;col_t<8;col_t++) {
        row_t=Math.ceil(TEAMS.length/col_t);
        wmax=box_width/col_t;
        hmax=box_height/row_t;
        if (hmax>wmax) {
            r_t=wmax;
        } else {
            r_t=hmax;
        }
        if (r_t>r) {
            r=r_t;
            cols=col_t;
            rows=row_t;
            fitted=false;
        }
    }
    //alert('width:'+box_width+' height:'+box_height+' rows:'+rows+' cols:'+cols+' r:'+r+' fitted:'+fitted);      
    
    $('div.team_box').show();
    $('span.team_name').show();
    var x=left_margin;
    var y=top_margin;
    var center=r/2;
    var dist=r/3;
    var icon_size=r/4;
    var font_size=''+(Math.ceil(r/4)+10)+'%';
    var icon_center=icon_size/2;
    var table_size=0.6*r;
    var table_border=(r-table_size)/2;
    if (animate){
        $('div.face').animate({width:icon_size, height:icon_size});        
        $('div.face img').animate({width:icon_size, height:icon_size});
        $('div.team_box').animate({opacity:1.0},1200);
        //$('div.team_box').css('background-color', '#550000');
        $('.team_name').css({left:table_border/2, top:table_border/1.5});
        $('span.team_name').animate({opacity:1.0},1200);
        $('div.team_box img.team_table').css({width:table_size, height:table_size, top:table_border, left:table_border});
        $('div.team_box img.team_table').css({width:table_size, height:table_size, top:table_border, left:table_border});
    } else {
        $('div.team_box img.team_table').css({width:table_size, height:table_size, top:table_border, left:table_border});
        $('div.team_box img.team_table').css({width:table_size, height:table_size, top:table_border, left:table_border});
        $('div.team_box').css({opacity:1.0 });
        $('span.team_name').css('opacity',1.0);
        $('.team_name').css({left:table_border/2, top:table_border/1.5});
        $('div.face').css({width:icon_size, height:icon_size});
        $('div.face img').css({width:icon_size, height:icon_size});
    }
    $('span.available_recordings').css({left:center+7, top:center-30});
    $('div.face label').css({'font-size':font_size, width:icon_size});    
    //$('div.face').droppable('disable');   
    
    var even=true;
    var tteam, team_box, radstep2, rad2, new_x, new_y, member, face;
    for (i=0;i<TEAMS.length;i++) {        
        tteam=TEAMS[i];
        tteam.center_x=x+center;
        tteam.center_y=y+center;
        team_box=$('#team_box_'+i);
        //team_box.css({left: x-45, top: y-39})
        team_box.css({left: x, top: y, width: r, height:r}) // , background:'#442222'
        radstep2=(Math.PI*1.7)/tteam.members.length;
        rad2=-0.6*Math.PI;
        new_x=Math.round((Math.sin(rad2)*(dist)))+center-icon_center;
        new_y=Math.round((Math.cos(rad2)*(dist)))+center-icon_center;
        if (tteam.notes.length==0) {
            team_box.find('span.available_recordings').hide();
        } else {
            team_box.find('span.available_recordings').show().text(tteam.notes.length);
        }
        //team_box.find('input.team_name').css({left: new_x, top: 0new_y+icon_center-20}).val(tteam.name);
        //team_box.find('span.team_name').css({left: new_x, top: new_y+icon_center-20}).text(tteam.name);
        //rad2=rad2+radstep2;        
        for (j=0;j<tteam.members.length;j++) {
            member=CATALOG[tteam.members[j]];
            face=member.getFace('pup');
            new_x=Math.round((Math.sin(rad2)*(dist))+tteam.center_x-icon_center);
            new_y=Math.round((Math.cos(rad2)*(dist))+tteam.center_y-icon_center);
            face.css('border-color',tteam.color);
            if (animate) {
                face.animate({left:new_x, top:new_y});
            } else {
                face.css({left:new_x, top:new_y});
            }
            
            rad2=rad2+radstep2;
        };
        
        // calculate location for the next team. Either next column in the same row
        // or begin a new row  
        x+=r;
        if (x+r>box_width+left_margin) {
            if (fitted) {
                if (even) {
                    x=left_margin+r/2;
                    even=false;
                } else {
                    x=left_margin;
                    even=true;
                }
                y=y+(r*height_factor);
            } else {                
                x=left_margin;
                y=y+r;
            }
        }
    }    
}

// moderator only
CLASSROOM.create_random_teams= function() {
    debug('Creating random teams');
    var free_pupils=PUPILS.slice(0);
    var teams_count=PUPILS.length/OPTIONS.team_size;
    var colors=create_colors(teams_count);
    var nt, member;
    while (free_pupils.length>0) {
        for (var i=0;i<teams_count;i++) {
            if (free_pupils.length>0) {
                if (TEAMS.length<=i) {                    
                    nt=new Team();
                    nt.name=i18n('Team')+' '+(i+1);
                    nt.color=colors[i];
					TEAMS.push(nt);
                    member=random_pick(free_pupils)
                } else {
                    member=random_pick(free_pupils)
                }
                TEAMS[i].members.push(member.uid);
            }
        }    
    }
    if (CONTROLLER.offline) {
        TEAMS[0].notes.push(demo_note.uid);
        CATALOG[demo_note.uid]=demo_note;
    }

    if (MODERATOR && TEAMS.length>0) {
        for (var i=0;i<TEAMS.length;i++) {
            CONTROLLER.addChange(TEAMS[i]);
        }
        CONTROLLER.addArray('TEAMS', TEAMS);
        CONTROLLER.sendChanges();
    }
    CLASSROOM.redraw_team_labels();   
}


CLASSROOM.redraw_team_labels= function() {
    function focus_to_team_input() {
        $(this).hide();
        $(this).next('input.team_name').show().focus();
    }
    $('div.team_box').remove();
    var place=$('div.class_area');
    var team_name, team_name_input;
    for (i=0;i<TEAMS.length;i++){
        team_name=TEAMS[i].name;
        place.append('<div class="team_box" id="team_box_'+i+'"><span class="team_name" tabindex="'+(i+10)+'">'+i18n('Team')+': '+team_name+'</span><input type="text" class="team_name" value="" size="12" id="team_'+i+'"/ tabindex="'+(i+10)+'"><span class="available_recordings">0</span><img class="team_table" src="images/teams-stencil-1.png" alt="" width="164" height="152" /></div>');
        team_name_input=$('#team_'+i);
        team_name_input.val(team_name);
        team_name_input.attr('size',(team_name.length>10) ? team_name.length: 10);
        var tb=$('#team_box_'+i);
		
		
        tb.find('.team_table').css('background-color', String(TEAMS[i].color));
        setData(tb,TEAMS[i]);
    }
    $('div.team_box').droppable({greedy:true, hoverClass:'table_hover', tolerance:'pointer',
        drop: CLASSROOM.switch_team});
    $('.team_box').click(CLASSROOM.go_team_notes).hover(function(){$(this).find('img.team_table').attr('src', 'images/teams-stencil-2.png')}, function(){$(this).find('img.team_table').attr('src', 'images/teams-stencil-1.png')}); 
       
    $('span.team_name').click(focus_to_team_input);
    $('span.team_name').focus(focus_to_team_input);
    $('input.team_name').blur(function () {
        $(this).prev('span.team_name').show();
        $(this).hide();
    });
    $("input.team_name").change(CLASSROOM.rename_team);
}


CLASSROOM.rename_team = function(event) {
    debug('team name changed');
    var team=getData($(this).closest(".team_box"));
    var new_name=$(this).val().replace('>','').replace('<','');
    team.name=new_name;
    $(this).val(new_name)
    debug('team name:'+new_name); 
    CONTROLLER.addChange(team);
    CONTROLLER.sendChanges();
    $(this).prev('span.team_name').text(new_name);
    $(this).blur();
}


CLASSROOM.update_faces = function() {
        CLASSROOM.populate_class();
        if (TEAM_VIEW) {
            CLASSROOM.build_class_view(false);
            CLASSROOM.redraw_team_labels();    
            CLASSROOM.build_team_view(false);
        } else {
            CLASSROOM.build_class_view(false);
            CLASSROOM.redraw_team_labels();    
        }            
        LEARNER_VIEW.update_property_choices();
}

// moderator only?
CLASSROOM.switch_team=function (event, ui) {
    var person=getData(ui.helper);
    var found=false;
    var target=getData($(this));
	
	if(typeof target == 'undefined') {
		return;
	}
	
    if (target.type=='Pupil') {
        for (var i=0;i<TEAMS.length;i++){
            team=TEAMS[i];
            for (var j=0;j<team.members.length;j++){
                if (team.members[j]==target.uid) {
                    target=team;
                    debug('target team in switch: '+team.uid);
                    break;
                }
            }
        }
    } else {
        debug('target team in switch: '+target.uid);
    }
    var team;
    for (var i=0;i<TEAMS.length;i++){
        team=TEAMS[i];
        for (var j=0;j<team.members.length;j++){
            if (team.members[j]==person.uid) {
                found=true;
                debug('source team in switch: '+team.uid);
                break;
            }
        }
        if (found) {
            if (target.uid!=team.uid) {
                team.members.splice(j,1);
                break;
            } else {
                CLASSROOM.build_team_view(true);
                return
            }
        }
    }
    target.members.push(person.uid);
    debug('switch teams affects '+team.uid+' and '+target.uid); 
    CONTROLLER.addChange(team);
    CONTROLLER.addChange(target);
    CONTROLLER.sendChanges();

    CLASSROOM.build_team_view(true);
}

CLASSROOM.go_team_notes= function(event) {
    var team=getData($(this).closest('.team_box'));
    TEAM_NOTES.create_team_notes(team);
    CLASSROOM.hide();
    TEAM_NOTES.show();
}

CLASSROOM.go_team_notes_by_number = function(event) {
    var team = getData($('#team_box_'+$(this).attr('data-teamId')));
    TEAM_NOTES.create_team_notes(team);
    CLASSROOM.hide();
    TEAM_NOTES.show();
}

CLASSROOM.show = function(dir){
    $('div.classroom').show('slide',{direction:dir},300);
    disable_bottom();
    disable_nav();
    view=CLASSROOM;    
}

CLASSROOM.hide = function(){
    $('div.classroom').hide();
}

CLASSROOM.go_vote = function(){
    view.hide();
    view=INTERESTS;
    view.show('right');
}
CLASSROOM.prev = function(){
    view.hide();
    view= (MODERATOR) ? CRITERIA : INTERESTS;
    view.show('left');
}
