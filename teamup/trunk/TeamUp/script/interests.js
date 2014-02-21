// **********************************

// Interests-page

INTERESTS.old_voters={};

INTERESTS.draw_topics = function(animate) {
    debug('redrawing topics');
    var s='';
    var r='';
    var topic, is_empty, val, li, pupil, obj, mini_face, x_delta;
    if (animate) {
        var old_votes={};
        $('div.smallFace').each(function() { old_votes[this.id]=true; }); 
    }
    var place=$('table#topics');
    place.html('');
    var reset_button, drop_area_content;
    for (var i=0;i<TOPICS.length;i++) {
        topic=TOPICS[i];
        is_empty= (topic.name.length==0) ? ' empty' : '';
        val= (topic.name.length==0) ? i18n('Enter topic') : topic.name;
        reset_button= (MODERATOR && i==0) ? '<div id="reset_votes" class="button" label="'+i18n('Reset votes')+'"></div>' : '';
        drop_area_content = (topic.voters.length) ? '' : ' <span class="i18n">'+i18n('Drag pictures here')+'</span>';
        s='<tr><td style="width:32px">'+(i+1)+'.</td><td><input type="text" class="topic'+is_empty+'" id="'+topic.uid+'" tabindex="'+(i+10)+'" value="'+val+'" /></td><td><div class="interest_drop_area">'+drop_area_content+'</div>'+reset_button+'</td></tr>';
        place.append(s);
        setData($('#'+topic.uid), topic);
        drop_area=$('#'+topic.uid).closest('td').next().find('.interest_drop_area');
        setData(drop_area, topic);
        for (var j=0;j<topic.voters.length;j++) {            
            pupil=CATALOG[topic.voters[j]];
            r='<div class="smallFace" alt="'+pupil.name+'" title="'+pupil.name+'" id="'+topic.uid+'_vote_'+j+'">';
            if (pupil.img_src!=DEFAULT_IMAGE) {
                r+='<img src="'+pupil.img_src+'" width="32" height="32" />';
            } else {
                r+='<label>'+pupil.name+'</label>'
            }
            r+='</div>';
            drop_area.append(r);
            obj=$('#'+topic.uid+'_vote_'+j);
            setData(obj, pupil);
            mini_face=obj;
            // do a little animation for new votes added remotely 
            if (animate) {
                x_delta=0;
                if (selected_face) {
                    if (pupil==getData(selected_face)) {
                        x_delta=selected_face.offset().left-mini_face.offset().left;
                    }
                }
                if (!old_votes[topic.uid+'_vote_'+j]) {
                    mini_face.css({opacity:0.2, top:300,left:x_delta}).animate({opacity: 1, top:0, left:0}, 200);
                }
            }
        }
       }
    $('#reset_votes').click(INTERESTS.reset_votes);     
    $('input.topic').click(function(event) {
        if (getData($(this)).name=='') {
            $(this).val('');
        }
    });
    $('input.topic').change(INTERESTS.store_topic);
    $('div.interest_drop_area').droppable({greedy:true, hoverClass:'drophover', activeClass:'markDroppable', tolerance:'pointer', drop: INTERESTS.add_vote});
    $('div.smallFace').draggable({helper:'original', cursorAt:{left:21, top:21}, start:function(event, ui){drag_remove_me=true;}, stop:INTERESTS.remove_vote, scroll:false});
    $('div.smallFace').disableSelection();
    $('div.smallFace img').disableSelection();

}

INTERESTS.store_topic = function(event) {
    var name=$(this).val().replace('<','').replace('>','');
    var topic=getData($(this));
    topic.name=name;
    debug('Renaming topic '+topic.uid+' to '+topic.name);
    if (name.length>0) {
        $(this).removeClass('empty');
        if (TOPICS[TOPICS.length-1].uid==topic.uid && name!='') {
            debug('Adding a new empty topic');
            var new_topic=new Topic('');
            TOPICS.push(new_topic);
            CONTROLLER.addChange(new_topic);
            CONTROLLER.addArray('TOPICS', TOPICS);
        }
    }  
    CONTROLLER.addChange(topic);
    CONTROLLER.sendChanges();
    INTERESTS.draw_topics(false);
    $('#'+topic.uid).closest('tr').next().find('input').focus(); // focus to next field 
}

INTERESTS.adjust_heights= function(){
    var inner_height = WINDOW_HEIGHT - TOP_HEIGHT - BOTTOM_HEIGHT;
    $('div.interests').css('height', inner_height);            
}

INTERESTS.show = function(dir){
    INTERESTS.adjust_heights();
    enable_bottom();
    disable_nav();
    $('div.interests').show('slide',{direction:dir},300);
    $('div.people_picker').width(PUPILS.length*114);
    $('div.left_nav').attr('title',(i18n('Class')+'/'+i18n('Teams')));
    INTERESTS.populate_people_picker();
    $('div.people_picker').show('slide',{direction:'down'},300);
    INTERESTS.init_interest_dragging();
    view=INTERESTS;
}
    
INTERESTS.hide= function(dir){
    $('div.interests').hide();
    $('div.people_picker').hide();        
}    

INTERESTS.next = function(){
    view.hide();
    view = (MODERATOR) ? CRITERIA : CLASSROOM;
    view.show('right');
}


INTERESTS.init_interest_dragging = function() {
    //$('div.people_picker_face').bind('dragstart', function(event) { event.preventDefault() });
    var face=$('div.people_picker_face');
    face.draggable({helper:function(event) {return INTERESTS.create_small_face_from_draggable(this);}, revert: "invalid", cursorAt:{left:21, top:21}, scroll:false});
    face.disableSelection();
    $('div.people_picker_face img').disableSelection();
    face.click(function(event) {
        var rows=$('#topics').find('tr');
        if (selected_face) {
            if (selected_face.hasClass('selected') || getData($(this)).votes_available<1) { 
                selected_face.removeClass('selected');
                rows.removeClass('markSelectable');
                rows.unbind('click');
                selected_face=null;
            } else {           
                selected_face.removeClass('selected');
                selected_face=$(this);
            }
        } else if (getData($(this)).votes_available>0) {
            selected_face=$(this);
        }
        if (selected_face) {
            selected_face.addClass('selected');
            rows.addClass('markSelectable');
            rows.click(function (event) {
                debug('adding '+getData(selected_face).name+' to '+getData($(this).find('input')).text);
                var person=getData(selected_face);
                var topic=getData($(this).find('input'));
                topic.addVoter(person);
                person.votes_available--;
                selected_face.find('span.votes').html(person.votes_available);
                CONTROLLER.addChange(topic);
                CONTROLLER.addChange(person);
                CONTROLLER.sendChanges();        
                selected_face.removeClass('selected');
                rows.removeClass('markSelectable');
                rows.unbind('click');
                INTERESTS.draw_topics(true);
                selected_face=null;
            });
        }
        
        });
}

INTERESTS.create_small_face_from_draggable = function(face) {
    var small_face=$(face).clone(false);
    var img=$(small_face).find('img');
    small_face.removeClass('people_picker_face');
    small_face.addClass('smallFace');
    img.attr({height:32, width:32});
    return small_face    
}    

INTERESTS.remove_vote = function (event, ui) {
    if (!drag_remove_me) {
        return;
    }
    debug('removing a vote');    
    var person=getData(ui.helper);
    person.votes_available++;
    var topic=getData($(this).parent('div.interest_drop_area'));
    topic.removeVoter(person);
    ui.helper.remove();
    $('#picker_'+person.uid).find('span.votes').html(person.votes_available);
    CONTROLLER.addChange(topic);
    CONTROLLER.addChange(person);
    CONTROLLER.sendChanges();    
}

INTERESTS.add_vote = function(event, ui) {
    var person=getData(ui.draggable);
    var topic, source, source_li;

    if ($(ui.draggable).hasClass('people_picker_face')) {
        if (person.votes_available==0) {
            return;
        }
        // adding vote
        debug('adding a vote');
        topic=getData(this);
        topic.addVoter(person);
        person.votes_available--;
        $(ui.draggable).find('span.votes').html(person.votes_available);
        CONTROLLER.addChange(topic);
        CONTROLLER.addChange(person);        
    } else {
        // moving a vote
        debug('moving a vote');
        source_li=$(ui.draggable).parent();
        source=getData(source_li)
        source.removeVoter(person);
        topic=getData(this);
        topic.addVoter(person);
        CONTROLLER.addChange(source);
        CONTROLLER.addChange(topic);
    }
    CONTROLLER.sendChanges();
    INTERESTS.draw_topics();
    
}

INTERESTS.reset_votes=function() {
    if (!MODERATOR) {
        return;
    }
    for (var i=0; i<TOPICS.length; i++) {
        TOPICS[i].voters=[];
        CONTROLLER.addChange(TOPICS[i]);        
    }
    for (var i=0; i<PUPILS.length; i++) {
        PUPILS[i].votes_available= VOTES_PER_PERSON;
        CONTROLLER.addChange(PUPILS[i]);        
    }
    CONTROLLER.sendChanges();
    INTERESTS.draw_topics(true);
    INTERESTS.update_people_votes();
}

INTERESTS.update_people_votes = function() {
    for (var i=0; i<PUPILS.length; i++) {
        $('#picker_'+PUPILS[i].uid).find('span.votes').html(PUPILS[i].votes_available);
    }
}

INTERESTS.populate_people_picker = function() {
    var place=$('div.people_picker');
    place.html('');
    var s, obj;
    for (var i=0; i<PUPILS.length; i++) {
        s='<div class="people_picker_face" alt="'+PUPILS[i].name+'" title="'+PUPILS[i].name+'" id="picker_'+PUPILS[i].uid+'">';
        s+='<img src="'+PUPILS[i].img_src+'" width="60" height="60" />';
        if (PUPILS[i].img_src==DEFAULT_IMAGE || OPTIONS.always_show_names) {
           s+='<label>'+PUPILS[i].name+'</label>'
        }
        s+='<span class="votes">'+PUPILS[i].votes_available+'</span>';
        s+='</div>';
        place.append(s);
        obj=place.find('div.people_picker_face').last();
        //debug('populate_people_picker calling setData');
        setData(obj, PUPILS[i]);
        
    }

}
