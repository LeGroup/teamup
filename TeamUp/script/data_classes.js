// **********************************
// These are the classes for data. They should not contain jQuery objects, but the simple data that can be stored into widget server. 
// (well, even those data objects are not that simple, they need to be flattened to not refer to other objects before storage.)

// ***** Pupils are the most complex of data objects: 
// they have several Criteria-objects with them. 

function Pupil(name, img, no_catalog){
    this.type='Pupil';
    this.name=name;
    this.clicker_id='';
    if (img!='') {
        this.img_src=img;
    } else {
        this.img_src=DEFAULT_IMAGE;
    }
    this.match_scores=[];
    this.hobbies=[]; // list of uids
    this.friends=[]; // list of uids
    this.enemies=[]; // list of uids
    this.languages=[]; // list of uids
    this.gender=null; // list of uids
    this.level=null; // list of uids
    this.votes_available=VOTES_PER_PERSON;
    this.version=0
    //this.color='#'+(Math.floor(Math.random()*100)+50).toString(16)+(Math.floor(Math.random()*100)+50).toString(16)+(Math.floor(Math.random()*100)+50).toString(16);
    lum=190;
    c1=Math.random()*lum;
    c2=Math.random()*(lum-c1);
    c3=lum-c1-c2;
    ord=Math.floor(Math.random()*3);
    if (ord==0) {
        r=c1;g=c2;b=c3;
    } else if (ord==1) {
        g=c1;b=c2;r=c3;
    } else if (ord==2) {
        b=c1;r=c2;g=c3;
    }
    r=Math.floor( r).toString(16);
    g=Math.floor( g).toString(16);
    b=Math.floor( b).toString(16);    
    r=(r.length==1) ? '0'+r : r;
    g=(g.length==1) ? '0'+g : g;
    b=(b.length==1) ? '0'+b : b;
    this.color='#'+r+g+b;
    
    do {
        this.uid='P'+create_uid();
    } while (CATALOG[this.uid]);
    if (!no_catalog)
        CATALOG[this.uid]=this;
}

Pupil.prototype.addProperty = function(prop) {
    if (!prop) {
        return null
    }
    // check what kind of property it is to put it to the right category
    if (ALL_HOBBIES.contains(prop))  {
        for (j=0;j<this.hobbies.length;j++) {
            if (prop.uid==this.hobbies[j]) {
                return null;
            }
        }
        this.hobbies.push(prop.uid);
        return prop;
    }
//    if (ALL_LEVELS.contains(prop)) {
//        if (prop.uid==this.level) {
//            return null;
//        }
//        this.level=prop.uid;
//        return prop;
//    }
    if (ALL_GENDERS.contains(prop)) {
        if (prop.uid==this.gender) {
            return null;
        }
        this.gender=prop.uid;
        return prop;
    }
    if (ALL_LANGUAGES.contains(prop)) {
        for (j=0;j<this.languages.length;j++) {
            if (prop.uid==this.languages[j]) {
                return null;
            }
        }
        this.languages.push(prop.uid);
        return prop;
    }
}

Pupil.prototype.removeProperty = function(prop) {
    if (!prop) {
        return null
    }
    
    if (prop.uid==this.gender) {
        this.gender=null;
        return prop;
    }
    if (prop.uid==this.level) {
        this.level=null;
        return prop;
    }
    for (i=0;i<this.hobbies.length;i++) {
        if (prop.uid==this.hobbies[i]) {
            this.hobbies.splice(i,1);
            return prop;
        }        
    }
    for (i=0;i<this.languages.length;i++) {
        if (prop.uid==this.languages[i]) {
            this.languages.splice(i,1);
            return prop;
        }        
    }
    return null
}

Pupil.prototype.addFriend = function(prop) {
    if (isType(prop, 'Pupil')) {
        prop=ALL_FRIENDS.find_person(prop)
    }
    for (j=0;j<this.friends.length;j++) {
        if (prop.uid==this.friends[j]) {
            return null;
        }
    }
    this.friends.push(prop.uid);
}
Pupil.prototype.addEnemy = function(prop) {
    if (isType(prop, 'Pupil')) {
        prop=ALL_ENEMIES.find_person(prop)
    }
    for (j=0;j<this.enemies.length;j++) {
        if (prop.uid==this.enemies[j]) {
            return null;
        }
    }
    this.enemies.push(prop.uid);
}
Pupil.prototype.removeFriend = function(prop) {
    if (isType(prop, 'Pupil')) {
        prop=ALL_FRIENDS.find_person(prop)
    }
    for (i=0;i<this.friends.length;i++) {
        if (prop.uid==this.friends[i]) {
            this.friends.splice(i,1);
            return prop;
        }        
    }
    return null
}
Pupil.prototype.removeEnemy = function(prop) {
    if (isType(prop, 'Pupil')) {
        prop=ALL_ENEMIES.find_person(prop)
    }
    for (i=0;i<this.enemies.length;i++) {
        if (prop.uid==this.enemies[i]) {
            this.enemies.splice(i,1);
            return prop;
        }        
    }
    return null
}

Pupil.prototype.getFace = function(prefix) {
    return $('#'+prefix+this.uid);
} 


// **** Several kinds of Criteria are created with each TeamUp instance
// and they are identical between each instance, and not shared between users.

function Criterion(name, img){
    this.name=name;
    this.type='Criterion';
    this.img_src=img;
    this.gen_img=null;
    this.person=null;
    this.uid='Crit_'+name;
    CATALOG[this.uid]=this;
}

function Friend(person){
    this.name=person.name;
    this.type='Friend';
    this.img_src=person.img_src;
    this.gen_img=null;
    this.person=person.uid;
    this.uid='Friend_'+person.uid;
    CATALOG[this.uid]=this;
};
function Enemy(person){
    this.name=person.name;
    this.type='Enemy';
    this.img_src=person.img_src;
    this.gen_img=null;
    this.person=person.uid;
    this.uid='Enemy_'+person.uid;
    CATALOG[this.uid]=this;
};

function Language(lang_code){
    this.name=LANGUAGE_CODES[lang_code];
    this.type='Language';
    this.img_src=null;
    this.gen_img=null;
    this.person=null;
    this.lang_code=lang_code; //lang_code.charAt(0).toUpperCase() + lang_code.slice(1);
    this.uid='Language_'+lang_code;
    CATALOG[this.uid]=this;  
}

function AddLanguageButton(){
    this.name='Add language';
    this.type='AddLanguageButton';
    this.img_src=null;
    this.gen_img=null;
    this.person=null;
    this.lang_code='+';

}

Language.prototype=new Criterion;
AddLanguageButton.prototype=new Criterion;
Friend.prototype=new Criterion;
Enemy.prototype=new Criterion;

function CriterionGroup(name){
    this.name=name;
    this.type='CriterionGroup';
    this.img_src='';
    this.weight=-100;
    this.criteria=[];
    this.uid='CritGroup_'+name;
    CATALOG[this.uid]=this;
}

CriterionGroup.prototype.add = function(crit){
    this.criteria.push(crit);
    return null;
}
CriterionGroup.prototype.insert = function(crit){
    this.criteria=[crit].concat(this.criteria);
    return null;
}

CriterionGroup.prototype.set = function(crit_list){
    this.criteria=crit_list;
    return null;
}
CriterionGroup.prototype.contains = function(crit){
    for (var c=0;c<this.criteria.length;c++) {
        if (crit.uid==this.criteria[c].uid) {
            return true;
        }
    };
    return false;
}

CriterionGroup.prototype.find_person = function(person){
    for (i=0;i<this.criteria.length;i++) {
        if (this.criteria[i].person==person.uid) {
            return this.criteria[i];
        }
    }
    return null
}    


// *** Topics can be voted. Votes are references to member objects. (should it be simplified to use member uids here?)

function Topic(name,no_catalog){
    this.type='Topic';
    this.name=name;
    this.voters=[];
    do {
        this.uid='Topic_'+create_uid();
    } while (CATALOG[this.uid]);
    if (!no_catalog) CATALOG[this.uid]=this;
    this.version=0

}
Topic.prototype.addVoter = function(person) {
    this.voters.push(person.uid);
    return person;
}

Topic.prototype.removeVoter = function(person) {
    for (i=0;i<this.voters.length;i++) {
        if (person.uid==this.voters[i]) {
            this.voters.splice(i,1);
            return person;
        }        
    }
    return null
}
Topic.prototype.removeAllVotesFrom = function(person) {
    // returns true if changes were made
    var filtered_voters=[];
    var voter;
    var len_before=this.voters.length;
    for (i=0;i<this.voters.length;i++) {
        voter=this.voters[i];
        if (person.uid!=voter) {
            filtered_voters.push(voter);
        }
    }
    this.voters=filtered_voters;
    if (this.voters.length < len_before) {
        return true;
    } else {
        return false;
    }
}

function Team(no_catalog){
    this.type='Team';
    this.name='';
    this.topic=null;
    this.members=[];
    this.center_x=0;
    this.center_y=0;
    this.notes=[];
    this.color='';
    do {
    this.uid='Team_'+create_uid();
    } while (CATALOG[this.uid]);
    if (!no_catalog) CATALOG[this.uid]=this;
    this.version=0
}


function View(id){
    this.id=id;
    this.type='View';
}

function TeamNote(no_catalog){
    this.type='TeamNote';
    this.audio_url='';
    this.photos=[];
    this.timestamp= new Date().getTime();
    do {
    this.uid='Note_'+create_uid();
    } while (CATALOG[this.uid]);
    if (!no_catalog) CATALOG[this.uid]=this;
    this.version=0
}

function ClassSettings()
{
	this.type                = "ClassSettings";
	this.language            = "";
	this.default_language    = "";
	this.show_icons          = true;
	this.always_show_names   = false;
	this.team_size           = 4;
	this.color               = false;
	this.clicker             = "None";
	this.are_loaded          = false;
	this.wait_for_load       = false;
	this.learners_edit_teams = false;
	this.uid                 = "CLASS_SETTINGS";
	this.version             = 0;

    CATALOG[this.uid]=this;
}
ClassSettings.prototype.constructor=ClassSettings;

ClassSettings.prototype.init=function()
{
    var s="";
    var check;
    debug('Initializing options sheet');

	// jQuery objects that are used multiple times
	// should be stored into variables to prevent
	// fetching them from the DOM multiple times
	var $team_size=$("#team_size");
	var $show_icons=$("#show_icons");
	var $show_names=$("#show_names");
	var $language_select=$("#language_select");
	var $clicker_select=$("#clicker_select");
	var $learners_edit_teams=$("#learners_edit_teams");

    $team_size.val(this.team_size);
    $team_size.on("change", null, this, this.set_team_size);
    $show_icons.attr('checked', this.show_icons);
    $show_icons.on("change", null, this, this.set_show_icons);
    $show_names.on("change", null, this, this.set_show_names);
    $show_names.attr('checked', this.always_show_names);

    for(var key in LANGUAGES) {
        s+='<option value="'+key+'">'+LANGUAGES[key]+'</option>';
    }
    $language_select.html(s);
    $language_select.val(this.language);
    $language_select.on("change", null, this, this.set_language);
    $('#reset_teams').on("click", null, this, this.reset_teams);

    $('#teacher_url, #learner_url, #panel_teacher_url, #panel_learner_url').click(function()
	{
		$(this).focus().select();
	});

    $clicker_select.val(this.clicker);
    $clicker_select.on("change", null, this, this.set_clicker);

	var that=this;
    $learners_edit_teams.attr('checked', this.learners_edit_teams);
    $learners_edit_teams.on("change", null, this, this.set_learners_edit_teams);
};

ClassSettings.prototype.save=function()
{
    var d={};
    d.default_language    = this.default_language;
    d.show_icons          = this.show_icons;
    d.always_show_names   = this.always_show_names;
    d.team_size           = this.team_size;
    d.learners_edit_teams = this.learners_edit_teams;
    return d;
};

ClassSettings.prototype.guess_language=function()
{
	this.language=guess_language();
	debug("Language: " + this.language);
};

ClassSettings.prototype.toggle=function()
{
    if(view==CLASS_SETTINGS) {
        if (TEAM_VIEW) {
            CLASSROOM.select_team_view();
        } else {
            CLASSROOM.select_class_view();
        }
        return;
    }
    view.hide();
    disable_bottom();
    disable_nav();
    $('div.options').show('slide',{direction:'down'},300);
    view=CLASS_SETTINGS;
};

ClassSettings.prototype.reset_teams=function(event)
{
	var that=event.data;
	that.confirmed_reset_teams(false);
};

ClassSettings.prototype.confirmed_reset_teams=function(confirmed)
{
    if(!confirmed)
	{
        var team_names="";
        debug('Checking if teams have newsflashes...');
        for( var i=0;i<TEAMS.length;i++) {
            if (TEAMS[i].notes.length>0) {
                team_names+=TEAMS[i].name+'<br/>';
            }
        }
        if (team_names.length>0) {
			var $rcp=$('#reset-confirm-panel');
            debug('Found items... alerting user.');
            $rcp.dialog("option", "buttons", { "Reset": function() {$(this).dialog("close");OPTIONS.confirmed_reset_teams(true); }, "Cancel": function() {$(this).dialog("close");} } );
            $rcp.find('b').html(team_names);
            $rcp.dialog('open');
            $('div.ui-dialog-buttonpane').find('button:last').focus();
            return;
        }
        debug("Didn't find news, continuing reset");
    }
    debug("Reset confirmed");
    TEAMS=[];
    if (MODERATOR) {
        CONTROLLER.addArray('TEAMS', TEAMS);
        CONTROLLER.sendChanges();
    }
    $('#grid_button').addClass('selected');
    $('#teams_button').removeClass('selected');
	CLASSROOM.select_class_view();
};

ClassSettings.prototype.set_team_size=function(event)
{
	var that=event.data;
	that.team_size=$(event.target).val();
	if (MODERATOR) {
		CONTROLLER.addChange(CLASS_SETTINGS);
		CONTROLLER.sendChanges();
	}
	that.are_loaded=true;
};

ClassSettings.prototype.set_show_icons=function(event)
{
	var that=event.data;
    that.show_icons=event.target.checked;
    if (MODERATOR) {
		CONTROLLER.addChange(CLASS_SETTINGS);
		CONTROLLER.sendChanges();
	}
	that.are_loaded=true;
};

ClassSettings.prototype.set_show_names=function(event)
{
	var that=event.data;
	that.always_show_names=event.target.checked;
    if (MODERATOR) {
		CONTROLLER.addChange(CLASS_SETTINGS);
		CONTROLLER.sendChanges();
    }
	that.are_loaded=true;
    CLASSROOM.update_faces();
};

ClassSettings.prototype.set_learners_edit_teams=function(event)
{
	var that=event.data;
    that.learners_edit_teams=event.target.checked;
    if(MODERATOR) {
        CONTROLLER.addChange(that);
        CONTROLLER.sendChanges();
    }
};

ClassSettings.prototype.set_language=function(event)
{
	var that=event.data;
    that.language=$(event.target).val();
    URL_VARS.locale=that.language;
    new_url='';
    if (window.location.href.indexOf('?')==-1) {
        new_url=window.location.href+'?'+$.param(URL_VARS);
    } else {
        new_url=window.location.href.slice(0,window.location.href.indexOf('?')+1)+$.param(URL_VARS);
    }
    if(MODERATOR) {
        that.default_language=that.language;
		CONTROLLER.addChange(CLASS_SETTINGS);
		CONTROLLER.sendChanges();
    }
	that.are_loaded=true;

    if(MODERATOR){
        $('#reload_link').attr('href', new_url).show();
    } else {
        window.location=new_url;
    }
};

ClassSettings.prototype.set_clicker=function(event)
{
	var that=event.data;
    that.clicker=$(event.target).val();
    SMART_ENABLED=(that.clicker=='SMART');
    if (SMART_ENABLED) {
        smart_clicker_enable();
    } else {
        $('#smart_receiver').hide();
    }
};

ClassSettings.prototype.hide=function()
{
    $('div.options').hide();
};
