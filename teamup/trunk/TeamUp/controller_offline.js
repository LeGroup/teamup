

var CONTROLLER = {};
CONTROLLER.delta={};
CONTROLLER.offline=true;
CONTROLLER.init= function() {
}
CONTROLLER.user={};
CONTROLLER.updateUser=function(){
}

CONTROLLER.stateUpdated=function(){
}

CONTROLLER.fullUpdate=function(){
}

CONTROLLER.checkConsistency=function() {
}
CONTROLLER.getLocale=function() { return ''; }

CONTROLLER.setParams=function(param_json) {
    debug(param_json);
    PARAMS=$.parseJSON(param_json);
    debug('class_key:'+PARAMS.class_key);
    debug('moderator_id:'+PARAMS.moderator_id);		
    debug('names_list:'+PARAMS.names_list);		
    debug('teacher_url:'+PARAMS.teacher_url);		
    debug('learner_url:'+PARAMS.learner_url || PARAMS.student_url);		
    debug('moderator_email:'+PARAMS.moderator_email);
    MODERATOR=(PARAMS.moderator_id==CONTROLLER.user.id);
    if (MODERATOR) {
        debug('**** MODERATOR ****');
        $('#teacher_url').val(PARAMS.teacher_url);
    }
    $('#learner_url').val(PARAMS.learner_url || PARAMS.student_url);
    if (!MODERATOR) CLASSROOM.adjust_for_learners();
    //if (getUrlVars().first) $('#teacher-panel').dialog('open');     
}

CONTROLLER.addChange=function(changed_object) {
    if (!changed_object) {
        debug('**** ADD CHANGE CALLED WITH AN EMPTY OBJECT');
    }
    debug('Added change '+changed_object.uid);
    CATALOG[changed_object.uid]=changed_object;
    CONTROLLER.delta[changed_object.uid]=JSON.stringify(changed_object);
}

CONTROLLER.setOption=function(option_key, value) {
    debug('Changed option '+option_key+' to '+value);
    CONTROLLER.delta[option_key]=JSON.stringify(value);
}

// arrays are different to objects as they need a given key, they don't have an uid that can be used.
// they also contain whole objects, so they have to be flattened to uids before sending. 
CONTROLLER.addArray=function(array_key, changed_array) {
    debug('** adding '+array_key+' to state upload');
    var packed=[]; 
    for (var n=0;n<changed_array.length;n++) { 
        packed.push(changed_array[n].uid); 
    } 
    CONTROLLER.delta[array_key]=JSON.stringify(packed); 
}

    
CONTROLLER.sendChanges=function() {
    CONTROLLER.checkConsistency();
    debug('*** sending changes called (offline) ***');
    CONTROLLER.delta={};
    return;
}

