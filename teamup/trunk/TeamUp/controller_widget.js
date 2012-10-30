
if (typeof wave!== 'undefined') {
    
    var CONTROLLER = {};
    CONTROLLER.delta={};
    CONTROLLER.offline=false;
    CONTROLLER.state_received=false;

    CONTROLLER.init= function() {
        CONTROLLER.updateUser();
        wave.setStateCallback(CONTROLLER.stateUpdated);
        wave.setParticipantCallback(CONTROLLER.availablePeopleChanged);
        OPTIONS.wait_for_update=true;
    }
    CONTROLLER.user={};
    CONTROLLER.availablePeopleChanged=function() {}
    CONTROLLER.getLocale=function() { return widget.locale; }
    CONTROLLER.updateUser=function(){
    	if (wave.getViewer() != null){
    		CONTROLLER.user.id = wave.getViewer().getId();
    		CONTROLLER.user.username = wave.getViewer().getDisplayName() || CONTROLLER.user.id;
    		CONTROLLER.user.thumbnail  = wave.getViewer().getThumbnailUrl();
    		debug('Viewer identifiend');
    	}
    	if (CONTROLLER.user.thumbnail == "" || CONTROLLER.user.thumbnail == null) CONTROLLER.user.thumbnail = "anon.png";
    	if (CONTROLLER.user.username == null || CONTROLLER.user.username == ""){
    		CONTROLLER.user.username = "anonymouse";        
    		CONTROLLER.user.id = "anonymous";
    		debug('No viewer object');
    	}
    	// Moodle plugin creates private properties:
    	//PRIVATE_STATE=wave.getPrivateState();
        debug('user.id:'+CONTROLLER.user.id);
        debug('user.username:'+CONTROLLER.user.username);
        //debug(Object.keys(Widget));
    }
    
    // stateUpdated has lots of work to do.
    // it gets the whole state each time and has to decide which objects in CATALOG need to be updated
    // those objects are updated or if missing, created and added to CATALOG.
    // then there are arrays of objects: PUPILS, TEAMS and TOPICS. In state these are arrays of keys, but when read and updated, they are
    // restored with aid of CATALOG to arrays of objects. 
    CONTROLLER.stateUpdated=function(){
        var changes=[];
        var state=wave.getState();
        if (!state) return;
        var keys=state.getKeys();
        var key, existing, update, change, obj;
        debug('received '+keys.length+' objects');
    
        // set params
        if (state.get('PARAMS')) {
            // PARAMS need to be set only once per instance.
            if (!PARAMS) {
                debug('*** Loading PARAMS ***')
                CONTROLLER.setParams(state.get('PARAMS'));
            }
        } else {
            // Class has no PARAMS set, so it is created directly through moodle's wookie-block or some other widget launcher.
            



        }

        if (state.get('OPTIONS')) {
            if (!OPTIONS.are_loaded) {
                debug('*** Setting options ***');
                CONTROLLER.setOptions(state.get('OPTIONS'));
                OPTIONS.are_loaded=true;
                OPTIONS.guess_language();
                localize();
                OPTIONS.init();
            }
        } else if (!OPTIONS.are_loadead) {
            debug('*** no options in state, initializing them ***')
            OPTIONS.are_loaded=true;
            OPTIONS.guess_language();
            localize();
            OPTIONS.init();
        }
        if (state.get('SHOW_ICONS')) {
            OPTIONS.show_icons=$.parseJSON(state.get('SHOW_ICONS'));            
        }


        for (var i=0;i<keys.length;i++) {
            key=keys[i];
            if (key=='deleted') {
                // this holds list of uids for objects that should be deleted
                continue;
            } else if (key=='TOPICS' || key=='TEAMS' || key=='PUPILS' || key=='PARAMS' || key=='OPTIONS' || key=='SHOW_ICONS') {
                // ignore these arrays. they will be checked and updated later when each new object has uid.
                continue;
            } else {
                if (CATALOG[key]) {
                    existing=$.extend(true, {}, CATALOG[key]);
                } else {
                    existing=null;
                }
                update=restore_json_object(state.get(key));
                if (!update) {
                    // somehow broken object. better skip it.
                    debug('skipping broken object '+key);
                    continue; 
                }
                if (existing) {
                    // old version exists and needs to be compared for changes. 
                    // ((could I just overwrite every object now?))
                    // no, we don't want to update everything in UI, we need to know how much to update.
                    change=false;
                    for (var pkey in existing) {
                        if (existing[pkey]!==update[pkey]) {
                            if ($.isArray(existing[pkey]) || $.isArray(update[pkey])) {
                                if (existing[pkey].length != update[pkey].length) {
                                    debug('length difference in '+pkey+': old:'+existing[pkey].length+' new:'+update[pkey].length);
                                    existing[pkey]=update[pkey];
                                    debug('replaced old '+pkey+':'+existing[pkey].length+' with new:'+update[pkey].length); 
                                    change=true;
                                } else {
                                    for (var k=0;k<existing[pkey].length;k++) {
                                        if (existing[pkey][k]!=update[pkey][k]) {
                                            debug('array content changed in '+pkey+': old ['+k+']:'+existing[pkey][k]+' new:'+update[pkey][k]);
                                            change=true;
                                            existing[pkey]=update[pkey];
                                            break;
                                        }
                                    }
                                }                                 
                            } else {
                                change=true;
                                existing[pkey]=update[pkey];
                                debug('general difference in '+pkey+': old:'+existing[pkey]+' new:'+update[pkey]);
                            }                        
                        } 
                    } 
                    if (change) {
                        debug('change in '+existing.uid);
                        changes.push(existing);
                    } 
                } else {
                    // create new object based on flat_new
                    // add it to relevant lists and catalogs
                    debug('downloading new '+update.uid);
                    if (isType(update, 'Pupil')) {
                        cr=new Friend(update);
                        ALL_FRIENDS.add(cr);
                        cr=new Enemy(update);
                        ALL_ENEMIES.add(cr);
                    }
                    changes.push(update);
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
            CATALOG[obj.uid]=obj;
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
        // update LISTS  -- look at the keys in flattened list and replace them with respective CATALOG objects.
        var new_pupils=state.get('PUPILS');
        if (new_pupils) {
            new_pupils=$.parseJSON(new_pupils);
            debug('PUPILS updated:'+new_pupils.length);
            for (var p=0;p<new_pupils.length;p++) {
                if (PUPILS[p] && new_pupils[p]!=PUPILS[p].uid) {order_changed=true;}
                new_pupils[p]=CATALOG[new_pupils[p]];
            }
            PUPILS=new_pupils;
        // If there are still no PUPILs even after the first update, then create them from parameters send by launcher
        } else if (PARAMS && PARAMS.names_list.length>0) {
            var names=PARAMS.names_list.split(',');
            var clean_names=[];
            for (var i=0;i<names.length;i++) {
                clean=$.trim(names[i]);
                if (clean.length>0) {
                    clean_names.push(clean);
                }
            }    
            LEARNER_VIEW.create_person(clean_names);
        } else {
            debug('no PUPILS in state nor names list, strange situation.');
            LEARNER_VIEW.create_person(['Learner1','Learner2']);                
        }
        var new_teams=state.get('TEAMS');
        if (new_teams) {
            new_teams=$.parseJSON(new_teams);
            var size_before_catalog_update = new_teams.length;
            debug('TEAMS updated:'+new_teams.length);
            for (var p=0;p<new_teams.length;p++) {
                new_teams[p]=CATALOG[new_teams[p]];
            }
            if (size_before_catalog_update==new_teams.length) {
                TEAMS=new_teams; 
            } else {
                debug("Couldn't find all teams in catalog. Didn't update teams.");
            }
            teams_changed=true;
        } else {
            debug('no TEAMS in state');
        }
        var new_topics=state.get('TOPICS');
        if (new_topics) {
            new_topics=$.parseJSON(new_topics);
            debug('TOPICS updated'+new_topics.length);
            for (var p=0;p<new_topics.length;p++) {
                new_topics[p]=CATALOG[new_topics[p]];
            }
            TOPICS=new_topics;
            topics_changed=true;
        } else if (TOPICS.length==0) {
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
            debug('people changed');
            CLASSROOM.update_faces();
            if (view==LEARNER_VIEW) {
                LEARNER_VIEW.update_person_properties()
            } 
        }
        if (order_changed) {
           debug('order changed');
           if (view==CLASSROOM && !TEAM_VIEW) {
                CLASSROOM.build_class_view(true);
            }
        }
        if (teams_changed) {
            debug('teams changed');
            if (view==CLASSROOM && TEAM_VIEW) {
                debug('* rebuilding team view *');
                CLASSROOM.build_team_view(true);
            }
            if (TEAMS.length>0) {
                $('#team_view').show();    
            }
        }
        if (topics_changed) {
            debug('topics changed');
            if (view==INTERESTS) {
                INTERESTS.draw_topics(true);
                INTERESTS.update_people_votes();           
            } else {
                INTERESTS.draw_topics(false);
            }
        }
        CONTROLLER.state_received=true;
    }

    CONTROLLER.fullUpdate= function() {
        CONTROLLER.stateUpdated()
    }
    
    CONTROLLER.checkConsistency=function() {
        // Additional cleaning and verification
        // Remove bad pupil instances
        debug('Checking consistency...');
        for (var i=0;i<PUPILS.length;i++) {
            if (PUPILS[i].type!='Pupil') {
                debug('Empty or malformed pupil. Fixed it.');
                PUPILS.splice(i,1);
                i--;
            }
        }
        // Remove duplicated team members
        var temp_d={};
        var team;
        for (var i=0;i<TEAMS.length;i++) {
            team=TEAMS[i];
            for (var j=0;j<team.members.length;j++) {
                if (temp_d[team.members[j]]) {
                    debug('Duplicate team member. Fixed it.');
                    team.members.splice(j,1);
                    j--;
                } else {
                    temp_d[team.members[j]]=team.members[j];
                }
            }
        }
        // Check that given votes and available votes match
        temp_d={};
        var vote_count;
        for (var i=0;i<TOPICS.length;i++) {
            topic=TOPICS[i];
            for (var j=0;j<topic.voters.length;j++) {
                vote_count=temp_d[topic.voters[j]];
                if (vote_count) {
                    vote_count++;
                    if (vote_count>VOTES_PER_PERSON) {
                        debug('too many votes given by '+topic.voters[j]+'. Fixed it.');
                        topic.voters.splice(j,1);
                        debug(topic.voters);
                    } else {
                        temp_d[topic.voters[j]]=vote_count;
                    }
                } else {
                    temp_d[topic.voters[j]]=1;
                }
            }
        }
        var pupil, votes_given;
        for (var i=0;i<PUPILS.length;i++) {
            pupil=PUPILS[i];
            votes_given= temp_d[pupil.uid] || 0;
            if (pupil.votes_available+votes_given!=VOTES_PER_PERSON) {
                pupil.votes_available=VOTES_PER_PERSON-votes_given;
                debug('Votes given and available do not match for '+pupil.uid+'. Fixed it.');
            }
        }
    }
    
    CONTROLLER.setOptions=function(option_json) {
        opts=$.parseJSON(option_json);
        for (var k in opts) {
            OPTIONS[k]=opts[k];
        } 
    }
    
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
            $('#admin_tag').show();
        } else {
            CLASSROOM.adjust_for_learners();
        }
        
        $('#learner_url').val(PARAMS.learner_url || PARAMS.student_url);
        //if (getUrlVars().first) $('#teacher-panel').dialog('open');     
        $('#i18n-offline').hide();
        $('#classname').text(PARAMS.class_key);
        $(document).attr('title', 'TeamUP - '+PARAMS.class_key);
    }
    
    CONTROLLER.addChange=function(changed_object) {
        if (!changed_object) {
            debug('**** ADD CHANGE CALLED WITH AN EMPTY OBJECT');
        }
        debug('Added change '+changed_object.uid);
        CATALOG[changed_object.uid]=changed_object;
        CONTROLLER.delta[changed_object.uid]=JSON.stringify(changed_object);
    }
    
    CONTROLLER.addOption=function(option_key, value) {
        debug('Changed option '+option_key+' to '+value);
        CONTROLLER.delta['OPTIONS']=JSON.stringify(OPTIONS.save_options());
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

        debug('*** sending changes ***');
        if (CONTROLLER.state_received) {
            wave.getState().submitDelta(CONTROLLER.delta);        
            CONTROLLER.delta={};
        }
    }

}
