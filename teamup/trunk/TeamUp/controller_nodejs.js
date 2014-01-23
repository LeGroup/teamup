/*
Controller to be used with Nodejs-powered backend for TeamUp

*/

ARRAY_VESSELS= {
 'TOPICS': {'uid':'TOPICS', 'array':[], 'version':0}, 
 'PUPILS': {'uid':'PUPILS','array':[], 'version':0}, 
 'TEAMS': {'uid':'TEAMS','array':[], 'version':0}
}

var CONTROLLER = {};
CONTROLLER.delta={};
CONTROLLER.socket = null; 
CONTROLLER.offline=false;
CONTROLLER.init= function() {
    var class_key=(URL_VARS) ? URL_VARS.c : 'demo';
    CONTROLLER.socket = io.connect('http://localhost:8081');
    CONTROLLER.socket.on('update', CONTROLLER.stateUpdated);
    CONTROLLER.socket.on('full_update', CONTROLLER.fullUpdate);
    CONTROLLER.socket.on('message', CONTROLLER.message);
    CONTROLLER.socket.emit('join_classroom', class_key);
    

}
CONTROLLER.user={};
CONTROLLER.updateUser=function(){
}

CONTROLLER.stateUpdated=function(data){
    debug('**State update**');
    var changes=[];
    var key, existing, update, change, obj, item;
    debug('received '+data.length+' objects');
    
    
    for (var i=0; i<data.length; i++) {
        item=data[i];
        key=item.uid;
        if (key=='TOPICS' || key=='TEAMS' || key=='PUPILS') {
            // ignore these arrays. they will be checked and updated later when each new object has uid.
            continue;
        } else if (key=='setup') {
            // PARAMS need to be loaded only once per instance.
            if (!PARAMS) {
                debug('*** Loading PARAMS ***')
                CONTROLLER.setParams(item);
                if (MODERATOR) {
                    debug('**** MODERATOR ****');
                    $('#teacher_url').val(PARAMS.teacher_url);
                    $('#admin_tag').show();
                } else {
                    CLASSROOM.adjust_for_learners();
                }
                $('#class_name_hint').text(PARAMS.class_key);
            }
        } else if (key=='SHOW_ICONS') {
            OPTIONS.show_icons=item;
        } else {
            existing=CATALOG[key];
            if (!item) 
                // somehow broken object. better skip it.
                continue; 
            if (existing) {
                // old version exists and needs to be compared for changes. 
                // ((could I just overwrite every object now?))
                // no, we don't want to update everything in UI, we need to know how much to update.
                change=false;
                if (!existing.version) {
                    change=true
                } else if ((!existing._id) && item._id) {
                    //debug('update object '+item.uid+' with a version that has _id');
                    change=true
                } else if (existing.version<item.version) {
                    change=true
                } else if (existing.version==item.version){
                    //debug('keep version '+item.version+' for '+item.uid);
                }
                if (change) {
                    //debug('change in '+existing.uid);
                    changes.push(item);
                }
            } else {
                // create new object based on flat_new
                // add it to relevant lists and catalogs
                //debug('downloading new '+item.uid);
                changes.push(item);
            }
        }
    }
    var teams_changed=false;
    var people_changed=false;
    var order_changed=false;
    var topics_changed=false;
    debug(''+changes.length+' changed objects found.');
    // check the totality of changes AND make sure that CATALOG points to the new version from now on.
    for (var i=0;i<changes.length;i++) {
        obj=changes[i];
        obj=restore_packed_object(obj);
        if (obj.type=='Pupil') {
            people_changed=true;
            }
        if (obj.type=='Topic') {
            topics_changed=true;
            }
        if (obj.type=='Team') {
            teams_changed=true;
        }
    }
    for (var i=0; i<data.length; i++) {
        item=data[i];
        key=item.uid;
        if (key=='PUPILS') {
            if (item.version>ARRAY_VESSELS.PUPILS.version || !ARRAY_VESSELS.PUPILS._id) {
                //debug('updating PUPILS to v.'+item.version);
                for (var p=0;p<item.array.length;p++) {
                    if (PUPILS[p] && item.array[p]!=PUPILS[p].uid) {order_changed=true;}
                    item.array[p]=CATALOG[item.array[p]];
                }
                PUPILS=item.array;
                ARRAY_VESSELS.PUPILS=item;
            }
        } else if (key=='TEAMS') {
            if (item.version>ARRAY_VESSELS.TEAMS.version || !ARRAY_VESSELS.TEAMS._id) {
                //debug('updating TEAMS to v.'+item.version);
                for (var p=0;p<item.array.length;p++) {
                    item.array[p]=CATALOG[item.array[p]];
                }
                TEAMS=item.array;
                ARRAY_VESSELS.TEAMS=item; 
            }
        } else if (key=='TOPICS') {
            if (item.version>ARRAY_VESSELS.TOPICS.version || !ARRAY_VESSELS.TOPICS._id) {
                //debug('updating TOPICS to v.'+item.version);
                for (var p=0;p<item.array.length;p++) {
                    item.array[p]=CATALOG[item.array[p]];
                }
                TOPICS=item.array;
                ARRAY_VESSELS['TOPICS']=item;
            }
        } 


    }

    // If there are still no PUPILs even after the first update, then create them from parameters send by launcher
    if (!PUPILS.length && PARAMS && PARAMS.names_list.length>0) {
        var names=PARAMS.names_list.split(',');
        var clean_names=[];
        for (var i=0;i<names.length;i++) {
            clean=$.trim(names[i]);
            if (clean.length>0) {
                clean_names.push(clean);
            }
        }    
        LEARNER_VIEW.create_person(clean_names);
    } else if (!PUPILS.length) {
        debug('no PUPILS in state nor names list, strange situation.');
        LEARNER_VIEW.create_person(['Learner1','Learner2']);                
    }
    if (TOPICS.length==0) {
        debug('>>>> Creating initial topics'); 
        TOPICS=[new Topic(''), new Topic(''), new Topic('')];
        for (var i=0;i<TOPICS.length;i++) {
            CONTROLLER.addChange(TOPICS[i]);
        }
        CONTROLLER.addArray('TOPICS',TOPICS);
        topics_changed=true;
    }
    CONTROLLER.checkConsistency();

    if (people_changed) {
        CLASSROOM.update_faces();
        if (view==LEARNER_VIEW) {
            LEARNER_VIEW.update_person_properties()
        } 
    }
    if (order_changed) {
        if (view==CLASSROOM && !TEAM_VIEW) {
            CLASSROOM.build_class_view(true);
        }
    }
    if (teams_changed) {
        if (view==CLASSROOM && TEAM_VIEW) {
            debug('* rebuilding team view *');
            CLASSROOM.build_team_view(true);
        }
        if (TEAMS.length>0) {
            $('#team_view').show();    
        }
    }
    if (topics_changed) {
        if (view==INTERESTS) {
            INTERESTS.draw_topics(true);
            INTERESTS.update_people_votes();           
        } else {
            INTERESTS.draw_topics(false);
        }
    }

    debug('** finished state update **');
}

CONTROLLER.fullUpdate=function(data){
    debug('**Full update**');
    CONTROLLER.stateUpdated(data);
    debug('**finished full update**');
    //debug('TEAMS: '+TEAMS.length);
    //debug('PUPILS: '+PUPILS.length);
    //debug('TOPICS: '+TOPICS.length);

}

CONTROLLER.message=function(data){
    debug('**Incoming message:');
    debug(data);
}


CONTROLLER.checkConsistency=function() {
}
CONTROLLER.getLocale=function() { return ''; }

CONTROLLER.setParams=function(data) {
    PARAMS={class_key:data.class_key,
        locale:data.locale,
        moderator_email:data.email,
        moderator_id:data.teacher,
        names_list:data.names,
        teacher_url:data.teacher_link,
        learner_url:data.student_link,
        version:data.version,
    };
    //debug('class_key:'+PARAMS.class_key);
    //debug('moderator_id:'+PARAMS.moderator_id);		
    //debug('names_list:'+PARAMS.names_list);		
    //debug('teacher_url:'+PARAMS.teacher_url);		
    //debug('learner_url:'+PARAMS.learner_url || PARAMS.student_url);		
    //debug('moderator_email:'+PARAMS.moderator_email);
    MODERATOR=true//(PARAMS.moderator_id==CONTROLLER.user.id);
    if (MODERATOR) {
        //debug('**** MODERATOR ****');
        $('#teacher_url').val(PARAMS.teacher_url);
    }
    $('#learner_url').val(PARAMS.learner_url || PARAMS.student_url);
    //if (!MODERATOR) CLASSROOM.adjust_for_learners();
    //if (getUrlVars().first) $('#teacher-panel').dialog('open');     
}

CONTROLLER.addChange=function(changed_object) {
    if (!changed_object) {
        debug('**** ADD CHANGE CALLED WITH AN EMPTY OBJECT');
    }
    debug('Added change '+changed_object.uid);
    CATALOG[changed_object.uid]=changed_object;
    if (!CONTROLLER.delta[changed_object]) {
        changed_object.version++;
    }
    CONTROLLER.delta[changed_object.uid]= changed_object; //JSON.stringify(changed_object);
}

CONTROLLER.addOption=function(option_key, value) {
    debug('Changed option '+option_key+' to '+value);
    CONTROLLER.delta[option_key]= value; //JSON.stringify(value);
}

// arrays are different to objects as they need a given key, they don't have an uid that can be used.
// they also contain whole objects, so they have to be flattened to uids before sending. 
CONTROLLER.addArray=function(array_key, changed_array) {
    debug('** adding '+array_key+' to state upload');
    var packed=[]; 
    for (var n=0;n<changed_array.length;n++) { 
        packed.push(changed_array[n].uid); 
    }
    // add a version number to arrays
    var vessel=ARRAY_VESSELS[array_key]
    vessel.array=packed;
    if (!CONTROLLER.delta[array_key]) {
        vessel.version++;
    }
    CONTROLLER.delta[array_key]= vessel//JSON.stringify(vessel); 
}

    
CONTROLLER.sendChanges=function() {
    CONTROLLER.checkConsistency();
    var d_array=[];
    for (key in CONTROLLER.delta) {
        d_array.push(CONTROLLER.delta[key]);
    }
    debug('*** sending changes to Nodejs ***: '+d_array.length);
    //debug(JSON.stringify(d_array));
    CONTROLLER.socket.emit('delta', JSON.stringify(d_array));
    CONTROLLER.delta={};
    return;
}

