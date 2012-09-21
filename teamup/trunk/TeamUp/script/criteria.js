// **********************************
// Criterion page

CRITERIA.show= function(dir){
    var crits=CRITERIA.available_criteria();
    disable_nav();
    enable_bottom();    
    $('div.criteria').css('height',WINDOW_HEIGHT - TOP_HEIGHT);
    $('div.criteria_picker').width(crits.length*74);
    CRITERIA.populate_criteria_picker(crits);
    CRITERIA.init_dragging();
    if (UNIFYING_CRITERIA.length==0) {
        for (var i=0; i<crits.length; i++) {
            if (crits[i].name=='Votes') {
                UNIFYING_CRITERIA.push(crits[i]);
                CRITERIA.create_crit_icons();
                break; 
            }
        }
    }
    for (var i=0; i<UNIFYING_CRITERIA.length; i++) {
        $('#cp_'+UNIFYING_CRITERIA[i].name).hide();
    }
    if (!TEAMS_PREVIEW.length) CRITERIA.team_up();
    CRITERIA.update_preview();
        
    $('div.criteria').show('slide',{direction:dir},300);
    $('div.criteria_picker').show('slide',{direction:'down'},300);
    view=CRITERIA;
}

CRITERIA.hide= function(){
    $('div.criteria').hide();
    $('div.criteria_picker').hide();        
}    

CRITERIA.init_dragging = function(){
    $('div.criteria_picker_item').draggable({helper:function() {return $(this).clone(false)},  revert: "invalid", scroll:false}); // cursorAt:{left:21, top:21}
    $('div.criteria_picker_item').disableSelection();
    $('div.criteria_picker_item img').disableSelection();
    $('div.criteria_picker_item').click(function(event) {$(this).effect('bounce', {}, 200, null)});
}

CRITERIA.next = function(){
    CRITERIA.confirm_before_teaming();
    view.hide();
    view= CLASSROOM
    CLASSROOM.redraw_team_labels();
    view.show('right');
    CLASSROOM.select_team_view(null);
}
CRITERIA.prev = function(){
    view.hide();
    view= INTERESTS
    view.show('left');
}

CRITERIA.update_preview = function() {
    s='';
    var team, person;
    for (var i=0;i<TEAMS_PREVIEW.length;i++) {
        team=TEAMS_PREVIEW[i];
        s+='<p style="color:'+team.color+'"><b>'+team.name+': ';
        for (var j=0;j<team.members.length;j++) {
            person=CATALOG[team.members[j]];
            s+=person.name;
            if (j<team.members.length-1) {
                s+=', ';
            }
        }
        s+='</b></p>';        
    }
    $('#preview_inner').html(s);
}

CRITERIA.add_unifying_crit = function(event, ui){
    var index;
    if (this.id=='crit_place_1') {
        index=0;
    } else if (this.id=='crit_place_2') {
        index=1;
    } else if (this.id=='crit_place_3') {
        index=2;
    }
    var crit=getData(ui.draggable);
    if (ui.draggable.hasClass('criteria_picker_item')) {
        ui.draggable.hide();
    }
    for (var i=0;i<UNIFYING_CRITERIA.length;i++) {
        if (UNIFYING_CRITERIA[i].uid==crit.uid) {
            UNIFYING_CRITERIA.splice(i,1);
        }
    }
    if (index>UNIFYING_CRITERIA.length) {
        UNIFYING_CRITERIA.push(crit);
    } else {
        UNIFYING_CRITERIA.splice(index,0,crit);
    }
    // Criteria list can contain only 3 items, rest are put back to criteria picker. 
    var obj;
    if (UNIFYING_CRITERIA.length>3) {
        for (var i=3;i<UNIFYING_CRITERIA.length;i++) {
            obj=UNIFYING_CRITERIA[i];
            $('#cp_'+obj.name).show();
        }
        UNIFYING_CRITERIA=UNIFYING_CRITERIA.slice(0,3);
    }
    CRITERIA.create_crit_icons();
    CRITERIA.team_up();
    CRITERIA.update_preview();
}

CRITERIA.create_crit_icons = function() {
    var place, obj, jq_obj;
    for (var i=0;i<UNIFYING_CRITERIA.length;i++) {
        place=$('#crit_place_'+(i+1));
        obj=UNIFYING_CRITERIA[i];
        place.html(''+(i+1)+'<div class="criteria_item" alt="'+obj.name+'" title="'+obj.name+'" id="crit_group_'+obj.name+'"><img src="'+obj.img_src+'" width="60" height="60" /></div>');
        jq_obj=$('#crit_group_'+obj.name);
        setData(jq_obj, obj);        
    }
    for (var i=UNIFYING_CRITERIA.length;i<3;i++) {
        place=$('#crit_place_'+(i+1));
        place.html(''+(i+1));        
    }
    $('div.criteria_item').draggable({ revert: "valid", start:function(event, ui){drag_remove_me=true;}, stop:CRITERIA.remove_unifying_crit, scroll:false}); // cursorAt:{left:21, top:21}
}

CRITERIA.remove_unifying_crit = function(event, ui){
    var crit=getData(ui.helper);
    debug(crit.name);
    debug(crit.uid);
    $('#cp_'+crit.name).show();
    for (var i=0;i<UNIFYING_CRITERIA.length;i++) {
        if (UNIFYING_CRITERIA[i].uid==crit.uid) {
            UNIFYING_CRITERIA.splice(i,1);
        }
    }        
    CRITERIA.create_crit_icons()
    CRITERIA.team_up();
    CRITERIA.update_preview();

}    
            

CRITERIA.available_criteria = function() {
    var crit_list=[]
    var friends=false;
    var hobbies=false;
    var levels=false;
    var languages=false;
    var gender=false;
    var votes=false;
    var pup;
    for (i=0; i<PUPILS.length; i++) {
        pup=PUPILS[i];
        if (pup.friends.length>0) friends=true;
        if (pup.hobbies.length>0) hobbies=true;
        if (pup.languages.length>0) languages=true;
        if (pup.level!=null) levels=true;
        if (pup.gender!=null) gender=true;
        if (pup.votes_available<VOTES_PER_PERSON) votes=true;
    }
    if (friends) crit_list.push(ALL_FRIENDS);
    if (hobbies) crit_list.push(ALL_HOBBIES);
    //if (levels) crit_list.push(ALL_LEVELS);
    if (languages) crit_list.push(ALL_LANGUAGES);
    if (gender) crit_list.push(ALL_GENDERS);
    if (votes) crit_list.push(ALL_VOTES);
    return crit_list;
}


CRITERIA.populate_criteria_picker = function(crits) {
    var place=$('div.criteria_picker');
    place.html('');
    var s, critgroup, crit_item;
    debug('populating criteria picker');
    for (var i=0; i<crits.length; i++) {
        critgroup=crits[i];
        s='<div class="criteria_picker_item" alt="'+i18n(critgroup.name)+'" title="'+i18n(critgroup.name)+'" id="cp_'+critgroup.name+'">';
        if (critgroup.img_src!=null) {
            s+='<img src="'+critgroup.img_src+'" width="60" height="60" />';
        } else {
            s+='<label>'+i18n(critgroup.name)+'</label>'
        }
        s+='</div>';
        place.append(s);
        crit_item=$('#cp_'+critgroup.name);
        setData(crit_item, critgroup);
    }
}

CRITERIA.confirm_before_teaming = function(event) {
    var team_names='';
    debug('Checking if teams have newsflashes...');
    for( var i=0;i<TEAMS.length;i++) {
        if (TEAMS[i].notes.length>0) {
            team_names+=TEAMS[i].name+'<br/>';
        }
    }
    if (team_names.length>0) {
        debug('Found items... alerting user.');
        $('#reset-confirm-panel').dialog("option", "buttons", { "Reset": function() { $(this).dialog("close");CRITERIA.save_teams();}, "Cancel": function() {$(this).dialog("close");} } );
        $('#reset-confirm-panel').find('b').html(team_names);
        $('#reset-confirm-panel').dialog('open');
        $('div.ui-dialog-buttonpane').find('button:last').focus();
    } else {
        CRITERIA.save_teams();
    }
}

CRITERIA.team_up = function () {
    
    function person_voted_for_topic(person, topic) {
        var n=0;
        for (var f=0;f<topic.voters.length;f++) {
            if (person.uid==topic.voters[f]) n++;
        }
        return n;
    }


    //unifying_criteria=[ALL_GENDERS, ALL_HOBBIES]; // replace this with actual choices
    splitting_criteria=[ALL_GENDERS, ALL_HOBBIES, ALL_LANGUAGES, ALL_VOTES, ALL_FRIENDS, ALL_ENEMIES]; //  ALL_LEVELS
    var weights=[1000, 100, 10];
    var neg_weight=-100;
    var scores=[];
    var best_team_quality=-50000;
    var runs=500;
    
    // deciding weight for each criteria
    
    for (var i=0;i<UNIFYING_CRITERIA.length;i++) {
        for (var j=0;j<splitting_criteria.length;j++) {
            if(UNIFYING_CRITERIA[i]==splitting_criteria[j]) {
                splitting_criteria.splice(j,1);
            }
        };
        UNIFYING_CRITERIA[i].weight=weights[i];
    }
    for (var j=0;j<splitting_criteria.length;j++) {
        splitting_criteria[j].weight=neg_weight;
    };
    var vote_weight=ALL_VOTES.weight/VOTES_PER_PERSON;
    debug('Vote weight:'+vote_weight)

    // Next sort the TOPICS by their votes.
    var popular_topics=TOPICS.slice(0);
    popular_topics.sort(function (a,b) {
        if (a.voters.length<b.voters.length) {
            return 1;
        } else if (a.voters.length>b.voters.length) {
            return -1;
        } else return 0;
    });
    var temp=[];
    for (var h=0;h<popular_topics.length;h++) {
        if (popular_topics[h].name!='') temp.push(popular_topics[h]);
    }
    popular_topics=temp;
    
    var teams_total=Math.ceil(PUPILS.length/OPTIONS.team_size)

    var colors=create_colors(teams_total);

    
    // calculating distances between each learner
    for (var i=0;i<PUPILS.length;i++) {
        var pup=PUPILS[i];
        pup.match_scores=[];
        for (var j=0;j<PUPILS.length;j++) {
            if (i==j) {
                pup.match_scores.push(-50000);
                continue;
            }
            var pup2=PUPILS[j];
            var score=0;
            for (var k=0;k<pup.hobbies.length;k++) {
                for (var l=0;l<pup2.hobbies.length;l++) {
                    if (pup.hobbies[k]==pup2.hobbies[l]) {
                        score+=ALL_HOBBIES.weight;
                    }
                }
            }
            for (var k=0;k<pup.languages.length;k++) {
                for (var l=0;l<pup2.languages.length;l++) {
                    if (pup.languages[k]==pup2.languages[l]) {
                        score+=ALL_LANGUAGES.weight;
                    }
                }
            }
            if (pup.gender==pup2.gender) {
                score+=ALL_GENDERS.weight;                
            }
            for (var k=0;k<pup.friends.length;k++) {
                if (pup.friends[k].person==pup2) {
                    score+=ALL_FRIENDS.weight;
                }
            }
            for (var k=0;k<pup.enemies.length;k++) {
                if (pup.enemies[k].person==pup2) {
                    score-=5000;
                }
            }
            pup.match_scores.push(score);
        }
     }
    // Now every person has a list of their most suitable team-partners.
    
    
    // calculate how many teams are required and create empty teams (w. TOPICS).
    // then add random 'seed member' to each team.
    var best_teaming=[];

    for (var l=0;l<runs;l++) {    
        var team_quality=0;
        var new_teaming=[];
        var topic_i=0;
        var topic_round=1;
        var this_topic;
        var people=PUPILS.slice(0);
        var picked_people_indexes=[]; // 'pupils' is one static array that is used as a reference point for match_scores.
        var bad_voter_uids=[];

        // picked_people_indexes keeps note on which people have already been picked so their scores can be ignored.


        for (var h=0;h<teams_total;h++) {
            var nteam=new Team();
            var seed_member_uid;
            this_topic=(popular_topics.length>0) ? popular_topics[topic_i] : null;
            nteam.topic=this_topic;
            nteam.color=colors[h];
            if (this_topic && this_topic.name!='') { 
                nteam.name=this_topic.name+' '+topic_round;
            } else {
                nteam.name=i18n('Team')+' '+(h+1);
            }

            if (this_topic && this_topic.voters.length>0) {
                var voters_uids=[];
                var eligible_voter='';
                for (var q=0;q<this_topic.voters.length;q++) {
                    var person_uid=this_topic.voters[q];
                    var eligible=true;
                    for (var m=0;m<bad_voter_uids.length;m++) {
                        if (bad_voter_uids[m]==person_uid) {
                            eligible=false;
                            break;
                        }                        
                    }
                    if (eligible) voters_uids.push(person_uid);
                }
                if (voters_uids.length>0) {
                    seed_member_uid=random_pick(voters_uids);
                    pick_item_by_uid(seed_member_uid, people);
                } else {
                    seed_member_uid=random_pick(people).uid;
                }
                //debug('picked seed member from topics:'+seed_member_uid)               
            } else {
                seed_member_uid=random_pick(people).uid;
                //debug('picked random seed member:'+seed_member_uid)               
            }
            picked_people_indexes.push(find_index_by_uid(seed_member_uid, PUPILS))
            bad_voter_uids.push(seed_member_uid);
            //debug(picked_people_indexes);
            //debug('Added '+CATALOG[seed_member_uid].name+' to team '+nteam.name); 
            nteam.members.push(seed_member_uid);
            new_teaming.push(nteam);
            // there may be fewer TOPICS than teams, so these have separate rotating index;
            topic_i++;
            if (topic_i>=popular_topics.length) {
                topic_i=0;
                topic_round++;            
                };        
        }
        var h=0;
                
        
        while (people.length>0) {
            var sum_of_scores=[];
            var tteam=new_teaming[h];
            // find people that are best match for existing team members by combining the match scores
            // these are stored temporarily as sum_of_scores
            for (var j=0;j<PUPILS.length;j++) {
                var combined_score=0;
                //debug('here');
                for (var k=0;k<tteam.members.length;k++) {
                    //debug('looking for '+tteam.members[k]);                    
                    combined_score+=CATALOG[tteam.members[k]].match_scores[j];
                };
                // modify score by checking how many times this person has voted this topic
                if (tteam.topic) {
                    combined_score+=person_voted_for_topic(PUPILS[j], tteam.topic)*tteam.members.length*vote_weight;
                }
                sum_of_scores.push(combined_score);
            }
            //debug(sum_of_scores);
            // find largest unused sum_of_score (this is the best match)
            var max_score_index=-1;
            var max_score=-100000;
            for (var j=0;j<sum_of_scores.length;j++) {
                var unused=true;
                for (var n=0;n<picked_people_indexes.length;n++) {
                    if (picked_people_indexes[n]==j) {
                        unused=false;
                        break
                    }
                }
                if (unused && sum_of_scores[j]>max_score) {
                    max_score=sum_of_scores[j];
                    max_score_index=j;
                }
            }
            team_quality+=max_score;
            var chosen=PUPILS[max_score_index];
            picked_people_indexes.push(max_score_index);
            pick_item(chosen, people); // people-array is reduced now
            tteam.members.push(chosen.uid);
            h++;
            if (h>=new_teaming.length) h=0;
        }
        // Done!
        if (team_quality>best_team_quality) {
            best_teaming=new_teaming.slice(0);
            best_team_quality=team_quality;  
            //debug('new high at '+l+', '+best_team_quality);         
        }
        scores.push(team_quality);
    }
    TEAMS_PREVIEW=best_teaming;
    
} 


CRITERIA.save_teams = function(event) {

    TEAMS=TEAMS_PREVIEW.slice(0); // copy of preview
    
    if (MODERATOR & TEAMS.length>0) {
        CONTROLLER.addArray('TEAMS', TEAMS);
        var total_fit=0;
        for (var h=0;h<TEAMS.length;h++) {
            var team=TEAMS[h];
            CONTROLLER.addChange(team);
            team.fit=0;
            for (var t=0;t<team.members.length;t++) {
                tmember=CATALOG[team.members[t]];
                for (var s=0;s<team.members.length;s++) {
                    if (s!=t){
                        //smember=CATALOG[team.members[s]];
                        member_index=find_index_by_uid(team.members[s], PUPILS);
                        team.fit+=tmember.match_scores[member_index];
                    }
                }
            }
            total_fit+=team.fit;
        }
        CONTROLLER.sendChanges();
    }
    view.hide();
    view= CLASSROOM
    CLASSROOM.redraw_team_labels();
    view.show('right');
    CLASSROOM.select_team_view(null);
}
   

