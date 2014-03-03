// **********************************
// People page 

LEARNER_VIEW.next= function() {
    if (SELECTED_PERSON<PUPILS.length-1) { SELECTED_PERSON++; } else { SELECTED_PERSON=0; };
    $('div.person').hide('slide', {direction:'left'}, 300);
    LEARNER_VIEW.create_person_page();
    $('div.person').show('slide',{direction:'right'},300);
}   

LEARNER_VIEW.prev= function() {
    if (SELECTED_PERSON>0) { SELECTED_PERSON--; } else { SELECTED_PERSON=PUPILS.length-1; };
    $('div.person').hide('slide', {direction:'right'}, 300);
    LEARNER_VIEW.create_person_page();
    $('div.person').show('slide',{direction:'left'},300);
}   

LEARNER_VIEW.hide= function() {
    CAMERA.finish_photoshoot();
    $('div.person').hide();
    $('div.people_properties').hide();    
}

LEARNER_VIEW.view_learner = function (event) {
    var person=getData($(this))
    view.hide();
    LEARNER_VIEW.select_person(person);
    LEARNER_VIEW.show();
} 

LEARNER_VIEW.adjust_heights = function() {
    var person_height = (MODERATOR) ? WINDOW_HEIGHT - TOP_HEIGHT - BOTTOM_HEIGHT : WINDOW_HEIGHT - TOP_HEIGHT;
    var table_height=$('div.person table').height();
    if (table_height<200) {
        table_height=279;
    }
    $('div.person').css('height', person_height);            
    $('div.person table').css('top', (person_height - table_height) / 2);
}

LEARNER_VIEW.show= function() {
    LEARNER_VIEW.adjust_heights()
    enable_nav();
    if (MODERATOR) {
        enable_bottom();
        $('div.people_properties').show('slide',{direction:'down'},300);        
        $('div.person div.nav_buttons').show();
    } else {
        disable_bottom();
        $('div.person div.nav_buttons').hide();
    }
    $('div.person').show('slide',{direction:'down'},300);
    view=LEARNER_VIEW;    
}

LEARNER_VIEW.add_new_person= function(event) {
    if (view!=LEARNER_VIEW) {
        view.hide();
        LEARNER_VIEW.adjust_heights()
        $('div.people_properties').show('slide',{direction:'down'},300);        
        enable_nav();
        view=LEARNER_VIEW;        
    } else {
        $('div.person').hide('slide', {direction:'left'}, 300);
    }
    LEARNER_VIEW.create_new_person();
    
    $('div.person').show('slide',{direction:'right'},300);
}    

LEARNER_VIEW.create_person_page= function() {
    CAMERA.finish_photoshoot();
    var pup=PUPILS[SELECTED_PERSON];
    $('#namebox').val(pup.name);
    $('img.large_portrait').attr('src', pup.img_src);
    $('img.large_portrait').show();
    LEARNER_VIEW.update_person_properties();
    $('div.left_nav').attr('title',  (SELECTED_PERSON==0) ? PUPILS[PUPILS.length-1].name : PUPILS[SELECTED_PERSON-1].name);
    $('div.right_nav').attr('title', (SELECTED_PERSON== PUPILS.length-1) ? PUPILS[0].name : PUPILS[SELECTED_PERSON+1].name);

    LEARNER_VIEW.adjust_heights();
}

LEARNER_VIEW.select_person= function(person){
    if (isType(person, 'Pupil')) {
        for (var i=0; i<PUPILS.length; i++) {
            if (PUPILS[i].uid==person.uid) {
                SELECTED_PERSON=i;
                break;
            }
        }
    } else {
        debug('broken person');
    }
    LEARNER_VIEW.create_person_page();
}


LEARNER_VIEW.create_persons= function(list_of_names){
    var pup, cr;
    debug('creating '+list_of_names.length+' new persons');
    for (var i=0; i<list_of_names.length; i++) {
        pup=new Pupil(list_of_names[i],'');
        PUPILS.push(pup);                
        cr=new Friend(pup); // safe
        ALL_FRIENDS.add(cr);
        cr=new Enemy(pup);
        ALL_ENEMIES.add(cr);
        CONTROLLER.addChange(pup)
    }
    SELECTED_PERSON=PUPILS.length-1;
    // All screens, views and lists that show learners have to be updated.        
    CLASSROOM.update_faces();
    CONTROLLER.addArray('PUPILS', PUPILS);
    CONTROLLER.sendChanges();
    LEARNER_VIEW.create_person_page();
}

LEARNER_VIEW.create_new_person= function(){
    var pup, cr;
    var name= i18n('New learner');
    pup=new Pupil(name,'');
    PUPILS.push(pup);
    cr=new Friend(pup); // safe
    ALL_FRIENDS.add(cr); 
    cr=new Enemy(pup);
    ALL_ENEMIES.add(cr);
    CONTROLLER.addChange(pup)
    SELECTED_PERSON=PUPILS.length-1;
    // All screens, views and lists that show learners have to be updated.        
    CLASSROOM.update_faces();
    CONTROLLER.addArray('PUPILS', PUPILS);
    CONTROLLER.sendChanges();
    debug(PUPILS[SELECTED_PERSON].uid);
    LEARNER_VIEW.create_person_page();
}

LEARNER_VIEW.rename_person= function(event) {
    var learner=PUPILS[SELECTED_PERSON];
    learner.name=$(this).val().replace('<','').replace('>','');
    var as_friend= ALL_FRIENDS.find_person(learner);
    as_friend.name=learner.name;
    var as_enemy= ALL_ENEMIES.find_person(learner);
    as_enemy.name=learner.name;

    CONTROLLER.addChange(learner);
    CONTROLLER.sendChanges();
    CLASSROOM.update_faces();
    $(this).blur();
}

LEARNER_VIEW.update_property_choices= function() {
    var props=ALL_GENDERS.criteria.concat(ALL_HOBBIES.criteria, ALL_LANGUAGES.criteria, ALL_FRIENDS.criteria); // ALL_LEVELS.criteria, <-- before hobbies
    $('div.people_properties').width(props.length*74);
    LEARNER_VIEW.populate_person_properties(props);
    LEARNER_VIEW.init_property_dragging();
}


LEARNER_VIEW.update_person_properties= function(new_prop) {
    var pup=PUPILS[SELECTED_PERSON];
    // data rows 
    // hobbies
    var prop, div, s;
    var initial_height= $('div.person table').height();
    var props=pup.hobbies.concat(pup.friends, pup.enemies, pup.languages);
    if (pup.gender) props.push(pup.gender);
    
    if (MODERATOR || CLASS_SETTINGS.show_icons) {
        div=$('.drag_area');
        div.html('');
        for (i=0; i<props.length; i++) {
            prop=CATALOG[props[i]];
            if (!prop) {
                prop=new Language(props[i].slice(9));
                CATALOG[props[i]]=prop;
                ALL_LANGUAGES.insert(prop);
            }

            titlestring='';
            if (ALL_LANGUAGES.contains(prop)) {
                s='<div class="property_item" id="'+prop.name+'" alt="'+prop.name+'" title="'+prop.name+'">';
                s+='<img src="'+ALL_LANGUAGES.img_src+'" width="60" height="60" />';
                s+='<label class="lang_label">'+prop.lang_code+'</label>';
                s+='<span>X</span>';
                
            } else if (ALL_ENEMIES.contains(prop)) {
                s='<div class="property_item" id="'+prop.name+'" alt="'+prop.name+'" title="'+prop.name+'">';
                s+='<img src="'+prop.img_src+'" width="60" height="60" />';
                s+='<img src="images/enemy.png" width="24" height="24" class="frenemy_icon" />';               
                s+='<span>X</span>';
                if (prop.img_src==DEFAULT_IMAGE || CLASS_SETTINGS.always_show_names) {
                    s+='<label class="name_label">'+prop.name+'</label>'
                }
            } else if (ALL_FRIENDS.contains(prop)) {
                s='<div class="property_item" id="'+prop.name+'" alt="'+prop.name+'" title="'+prop.name+'">';
                s+='<img src="'+prop.img_src+'" width="60" height="60" />';
                s+='<img src="images/friend.png" width="24" height="24" class="frenemy_icon" />';               
                if (prop.img_src==DEFAULT_IMAGE || CLASS_SETTINGS.always_show_names) {
                    s+='<label class="name_label">'+prop.name+'</label>'
                }
            } else {
                s='<div class="property_item" id="'+prop.name+'">';
                s+='<img src="'+prop.img_src+'" width="60" height="60" />';
                s+='<span>X</span>';
            }
            s+='</div>';
            div.append(s)            
            jqprop=$('#'+prop.name);
            setData(jqprop,prop);
            if (prop==new_prop) {
                jqprop.hide().fadeIn('fast');
            }

        }
        // make all of them touchable 
        if (MODERATOR) {  
            $('div.property_item').click(LEARNER_VIEW.remove_property_action).hover(
                function () {
                    $(this).addClass('remove_me_hint');
                    $(this).find('span').show();
                }, 
                function () {
                    $(this).removeClass('remove_me_hint')
                    $(this).find('span').hide();
                } 
                );
        }
        $('div.property_item').disableSelection();
        $('div.property_item img').disableSelection();
        if (props.length==0 && MODERATOR) {
            $('#drag_hint').show();
        } else {
            $('#drag_hint').hide();
        }
    } else {
        $('div.drag_area').hide();       
    }
    // update name and icon if necessary
    if ($('#namebox').val()!=pup.name) {     
        $('#namebox').val(pup.name);
    }
    if ($('img.large_portrait').attr('src')!=pup.img_src) {
        $('img.large_portrait').attr('src', pup.img_src);
    }
    $('img.large_portrait').show();
    
    if ($('div.person table').height()!=initial_height) {
        LEARNER_VIEW.adjust_heights();
    }

}


LEARNER_VIEW.get_all_props= function() {
    return ALL_GENDERS.criteria.concat(ALL_HOBBIES.criteria, ALL_LANGUAGES.criteria, ALL_FRIENDS.criteria, ALL_ENEMIES.criteria); // ALL_LEVELS.criteria
}


LEARNER_VIEW.jump_to_person= function(event) {
    event.stopImmediatePropagation();
    var prop=getData(this);
    if (isType(prop, 'Friend') || isType(prop, 'Enemy')) {
        var person_uid=prop.person;
        var SELECTED_PERSON;
        debug(person_uid);
        for (i=0; i<PUPILS.length; i++) {            
            if (person_uid==PUPILS[i].uid) {
                SELECTED_PERSON=i;
                break;
            }
        }            
        $('div.person').hide('slide', {direction:'left'}, 300);
        LEARNER_VIEW.create_person_page();
        $('div.person').show('slide',{direction:'right'},300);
    }        
}

LEARNER_VIEW.init_property_dragging= function() {
    $('div.property_picker_item').draggable({helper:function(event){return $(this).clone(false);}, revert: "invalid", cancel:'.disabled', scroll:false}); 
    $('div.property_picker_item').disableSelection();
    $('div.property_picker_item img').disableSelection();
    $('div.property_picker_item').click(function(event) {
        var prop=getData(this);
        var person=PUPILS[SELECTED_PERSON];
        if (isType(prop, 'Friend')) {
            if (prop.person==person.uid) {
                return;   
            }
            person.addFriend(prop);
            var my_friend=CATALOG[prop.person];
            my_friend.addFriend(person);
            CONTROLLER.addChange(person);
            CONTROLLER.addChange(my_friend);
            CONTROLLER.sendChanges();
        } else {
            person.addProperty(prop);
            CONTROLLER.addChange(person);
            CONTROLLER.sendChanges();
        }
        LEARNER_VIEW.update_person_properties(prop);
        });
    $('div.drag_area').droppable({greedy:true, activeClass:'markDroppable', tolerance:'pointer', drop: LEARNER_VIEW.add_property});
    $('div.add_language_button').click(LEARNER_VIEW.open_language_panel);
}

LEARNER_VIEW.open_language_panel= function(event) {
    var lp=$('#language-panel');
    var s='';
    var lang;
    for (var key in LANGUAGE_CODES) {
        lang=LANGUAGE_CODES[key];
        s+='<div class="language_item" alt="'+lang+'" title="'+lang+'" id="lang_'+key+'"><img src="'+ALL_LANGUAGES.img_src+'" width="60" height="60" /><label class="lang_label">'+key+'</label></div>';  //charAt(0).toUpperCase()+key.slice(1,3)
    }
    lp.html(s);
    $('div.language_item').click(LEARNER_VIEW.add_language_option);  
    lp.dialog('open');    
}

LEARNER_VIEW.add_language_option= function(event) {
    var lang_code=this.id.slice(5);
    debug('looking for:'+lang_code);
    for (var li=0;li<ALL_LANGUAGES.criteria.length;li++) {
        debug(ALL_LANGUAGES.criteria[li].lang_code)
        if (ALL_LANGUAGES.criteria[li].lang_code==lang_code) {
            $('#language-panel').dialog('close');
            return;
        }
    }
    var prop=new Language(lang_code);
    var person=PUPILS[SELECTED_PERSON];
    ALL_LANGUAGES.insert(prop);
    person.addProperty(prop)
    CONTROLLER.addChange(person);
    CONTROLLER.sendChanges();
    LEARNER_VIEW.update_person_properties();    
    LEARNER_VIEW.update_property_choices();
    $('#language-panel').dialog('close');
}

LEARNER_VIEW.add_property= function(event, ui) {
    // dragging an already existing property inside person's view
    if (ui.draggable.hasClass('property_item')) {
        drag_remove_me=false;
        return;
    }
    // dragging a new property to person
    var prop=getData(ui.draggable);
    var person=PUPILS[SELECTED_PERSON];
    if (isType(prop, 'Friend')) {
        if (prop.person==person.uid) {
            return;   
        }
        person.addFriend(prop);
        var my_friend=CATALOG[prop.person];
        my_friend.addFriend(person);
        CONTROLLER.addChange(person);
        CONTROLLER.addChange(my_friend);
        CONTROLLER.sendChanges();
    } else {
        person.addProperty(prop);
        CONTROLLER.addChange(person);
        CONTROLLER.sendChanges();
    }
    LEARNER_VIEW.update_person_properties();
}

LEARNER_VIEW.remove_property_action= function(event) {
    debug("removing person property")
    var prop=getData(this);
    var other_person;
    var person=PUPILS[SELECTED_PERSON];

    if (isType(prop, 'Friend')) {
        person.removeFriend(prop)
        other_person=CATALOG[prop.person];
        other_person.removeFriend(person)
        person.addEnemy(other_person)
        other_person.addEnemy(person)
        CONTROLLER.addChange(person);
        CONTROLLER.addChange(other_person);
        CONTROLLER.sendChanges();
        LEARNER_VIEW.update_person_properties();
    } else if (isType(prop, 'Enemy')) {
        person.removeEnemy(prop)
        other_person=CATALOG[prop.person];
        other_person.removeEnemy(person)
        CONTROLLER.addChange(person);
        CONTROLLER.addChange(other_person);
        CONTROLLER.sendChanges();
        LEARNER_VIEW.update_person_properties();
    } else {
        person.removeProperty(prop);
        CONTROLLER.addChange(person);
        CONTROLLER.sendChanges();
        $(this).fadeOut('fast');
    }
}


LEARNER_VIEW.remove_property = function(prop) {
    // Remove property from learner, and if it is bidirectional relation (friendship, enemy),
    // remove it from both partners.
	var person=PUPILS[SELECTED_PERSON];
	
    if (isType(prop, 'Friend')) {
        var my_friend=CATALOG[prop.person];
        person.removeFriend(my_friend);
        my_friend.removeFriend(person);
        CONTROLLER.addChange(person);
        CONTROLLER.addChange(my_friend);
        CONTROLLER.sendChanges();
    } else if (isType(prop, 'Enemy')) {
        var my_enemy=CATALOG[prop.person];
        person.removeEnemy(my_enemy);
        my_enemy.removeEnemy(person);
        CONTROLLER.addChange(person);
        CONTROLLER.addChange(my_enemy);
        CONTROLLER.sendChanges();
    } else {
        person.removeProperty(prop);
        CONTROLLER.addChange(person);
        CONTROLLER.sendChanges();
    }

    LEARNER_VIEW.update_person_properties();
}


LEARNER_VIEW.populate_person_properties= function(props) {
    var place=$('div.people_properties');
    place.html('');
    if (!MODERATOR) {
        return;
    }
    var class_name, s, prop, obj;
    for (var i=0; i<props.length; i++) {
        prop=props[i];
        if (isType(prop, 'AddLanguageButton')) {
            class_name='add_language_button';
        } else {
            class_name='property_picker_item';
        }
        s='<div class="'+class_name+'" id="prop'+i+'">';
        if (prop.img_src!=null) {
            s+='<img src="'+prop.img_src+'" width="60" height="60" />';
        } else {
            if (isType(prop, 'Language')) {
                s+='<img src="'+ALL_LANGUAGES.img_src+'" width="60" height="60" />';
                s+='<label class="lang_label">'+prop.lang_code+'</label>';
            } else {
                s+='<img src="icons/language.png" width="60" height="60" />'
                s+='<label class="lang_label">+</label>';
                s+='<div class="language_panel"></div>';
            }
        }
        if ((isType(prop, 'Friend') || isType(prop, 'Enemy')) && (CLASS_SETTINGS.always_show_names || prop.img_src==DEFAULT_IMAGE)) {
            s+='<label class="name_label">'+prop.name+'</label>';
        }

        s+='</div>';
        place.append(s);
        obj=place.find('div').last();
        setData(obj, prop);
    }

}

LEARNER_VIEW.delete_learner= function() {
    if (PUPILS.length<2) return;
    var learner=PUPILS[SELECTED_PERSON];
    var team;
    var found=false;
    for (var i=0;i<TEAMS.length;i++) {
        team=TEAMS[i];
        for (var j=0;j<team.members.length;j++) {
            if (team.members[j]==learner.uid) {
                found=true;
                break;
            }
        }
        if (found) {
            team.members.splice(j,1);
            CONTROLLER.addChange(team);
            break;
        }
    }
	
	//Remove friend/enemy relationships
	for(var i = 0; i < learner.friends.length; i++)	 {
        debug('removing friend '+learner.friends[i]+ ' typeOf '+ CATALOG[learner.friends[i]]);
		LEARNER_VIEW.remove_property(CATALOG[learner.friends[i]]);
	}
	for(var i = 0; i < learner.enemies.length; i++)	 {
        debug('removing enemy '+learner.enemies[i]+ ' typeOf '+ CATALOG[learner.enemies[i]]);
		LEARNER_VIEW.remove_property(CATALOG[learner.enemies[i]]);
	}
	

	//Remove deleted learner from property choices
	for(var i = 0; i < ALL_FRIENDS.criteria.length; i++)	{
		if(ALL_FRIENDS.criteria[i].uid == "Friend_" + learner.uid) {
			ALL_FRIENDS.criteria.splice(i, 1);
			break;
		}
	}

    // Remove votes from this learner
    var changed;
    for(var i = 0; i < TOPICS.length; i++) {
        changed = TOPICS[i].removeAllVotesFrom(learner);
        if (changed) {
            CONTROLLER.addChange(TOPICS[i]);            
        }
    }

	LEARNER_VIEW.update_property_choices();
	
	
    PUPILS.splice(SELECTED_PERSON, 1);
    CONTROLLER.addArray('PUPILS', PUPILS);
    CONTROLLER.sendChanges();
    CLASSROOM.update_faces();

    $('div.person').hide('slide', {direction:'down'}, 300);
    if (SELECTED_PERSON>=PUPILS.length) {
        SELECTED_PERSON=0
    }
    LEARNER_VIEW.create_person_page();
    $('div.person').show('slide',{direction:'right'},300);

}

