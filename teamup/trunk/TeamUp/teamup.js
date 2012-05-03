/** TeamUp -- a teacher's tool for forming learner teams
    Copyright (C) 2011 Jukka Purma, Anna Keune, Teemu Leinonen, Tarmo Toikkanen 

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
**/


var DEMO=true;
var DEBUG_MODE=false;
var MODERATOR=true;
var SMART_ENABLED=false;

var SERVER_URL='http://teamup.aalto.fi/';
var LANGUAGES= {'fi-FI':'Suomi', 'en-EN':'English', 'de-AT':'Deutsch', 'es-ES':'Spanish', 'et-ET':'Estonian', 'fr-FR':'Francais', 'he-HE':'Hebrew', 'hu-HU':'Hungarian', 'it-IT':'Italian','lt-LT':'Lithuanian', 'nl-NL':'Dutch', 'no-NO':'Norwegian', 'pt-PT':'Portuguese','sk-SK':'Slovak', 'tr-TR':'Turkish'};

// Some defaults, more defaults at OPTIONS 
var VOTES_PER_PERSON = 3;
var DEFAULT_IMAGE = 'images/defaultUser.png';

var PARAMS = null; // class creation parameters send by server, shouldn't change once initialized
var PRIVATE_STATE = {}; // Moodle launch will set private state values, which should only be read once.
var TEAM_VIEW = false; // classroom is showing teams (round tables) or class (grid)
var THIS_PERSON = 0;
var drag_remove_me = true;
var UNIFYING_CRITERIA=[];
var selected_face=null;
var my_changes={}; // if changes pile up, do not overwrite last changes


var CLASS_KEY = '';

var CATALOG = {}; // references for all objects so that Objects can be safely flattened for JSON travel and restored to one place

var image = null;
var ctx = null;
var pos = 0;
var timer = null;
var camera_on = false;
var localizedStrings = null;
var demo_note = null;

// debug
var update_counter = 0;

var create_uid = function(){
    if (CONTROLLER.user.id) {
        return CONTROLLER.user.id+_create_uid();
    } else {
        return ''+_create_uid();
    }
}

// I don't understand how this works.
var _create_uid = ( function(){
    var id=0; 
    return function(){
      return id++ ;
    };
  } 
)();

function debug(my_obj) {
    if (DEBUG_MODE) {
        $('#debug').show();
        $('#debug').html($('#debug').html()+my_obj+'<br/>');
    }
}


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
    if (ALL_LEVELS.contains(prop)) {
        if (prop.uid==this.level) {
            return null;
        }
        this.level=prop.uid;
        return prop;
    }
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

function Team(no_catalog){
    this.type='Team';
    this.name='';
    this.topic=null;
    this.members=[];
    this.center_x=0;
    this.center_y=0;
    this.notes=[];
    do {
    this.uid='Team_'+create_uid();
    } while (CATALOG[this.uid]);
    if (!no_catalog) CATALOG[this.uid]=this;
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
}

    
// **********************************

var LANGUAGE_CODES={aa: 'Afar',ab: 'Abkhazian',af: 'Afrikaans',am: 'Amharic',ar: 'Arabic',as: 'Assamese',ay: 'Aymara',az: 'Azerbaijani',ba: 'Bashkir',be: 'Byelorussian (Belarussian)',bg: 'Bulgarian',bh: 'Bihari',bi: 'Bislama',bn: 'Bengali',bo: 'Tibetan',br: 'Breton',ca: 'Catalan',co: 'Corsican',cs: 'Czech',cy: 'Welsh',da: 'Danish',de: 'German',dz: 'Bhutani',el: 'Greek',en: 'English',eo: 'Esperanto',es: 'Spanish',et: 'Estonian',eu: 'Basque',fa: 'Persian',fi: 'Finnish',fj: 'Fiji',fo: 'Faroese',fr: 'French',fy: 'Frisian',ga: 'Irish (Irish Gaelic)',gd: 'Scots Gaelic (Scottish Gaelic)',gl: 'Galician',gn: 'Guarani',gu: 'Gujarati',gv: 'Manx Gaelic',ha: 'Hausa',he: 'Hebrew',hi: 'Hindi',hr: 'Croatian',hu: 'Hungarian',hy: 'Armenian',ia: 'Interlingua',id: 'Indonesian',ie: 'Interlingue',ik: 'Inupiak',is: 'Icelandic',it: 'Italian',iu: 'Inuktitut',ja: 'Japanese',jw: 'Javanese',ka: 'Georgian',kk: 'Kazakh',kl: 'Greenlandic',km: 'Cambodian',kn: 'Kannada',ko: 'Korean',ks: 'Kashmiri',ku: 'Kurdish',kw: 'Cornish',ky: 'Kirghiz',la: 'Latin',lb: 'Luxemburgish',ln: 'Lingala',lo: 'Laotian',lt: 'Lithuanian',lv: 'Latvian Lettish',mg: 'Malagasy',mi: 'Maori',mk: 'Macedonian',ml: 'Malayalam',mn: 'Mongolian',mo: 'Moldavian',mr: 'Marathi',ms: 'Malay',mt: 'Maltese',my: 'Burmese',na: 'Nauru',ne: 'Nepali',nl: 'Dutch',no: 'Norwegian',oc: 'Occitan',om: 'Oromo',or: 'Oriya',pa: 'Punjabi',pl: 'Polish',ps: 'Pashto',pt: 'Portuguese','pt-br': 'Brazilian Portuguese',qu: 'Quechua',rm: 'Rhaeto-Romance',rn: 'Kirundi',ro: 'Romanian',ru: 'Russian',rw: 'Kiyarwanda',sa: 'Sanskrit',sd: 'Sindhi',se: 'Northern Sami',sg: 'Sangho',sh: 'Serbo-Croatian',si: 'Singhalese',sk: 'Slovak',sl: 'Slovenian',sm: 'Samoan',sn: 'Shona',so: 'Somali',sq: 'Albanian',sr: 'Serbian',ss: 'Siswati',st: 'Sesotho',su: 'Sudanese',sv: 'Swedish',sw: 'Swahili',ta: 'Tamil',te: 'Telugu',tg: 'Tajik',th: 'Thai',ti: 'Tigrinya',tk: 'Turkmen',tl: 'Tagalog',tn: 'Setswana',to: 'Tonga',tr: 'Turkish',ts: 'Tsonga',tt: 'Tatar',tw: 'Twi',ug: 'Uigur',uk: 'Ukrainian',ur: 'Urdu',uz: 'Uzbek',vi: 'Vietnamese',vo: 'Volapuk',wo: 'Wolof',xh: 'Xhosa',yi: 'Yiddish',yo: 'Yorouba',za: 'Zhuang',zh: 'Chinese',zu: 'Zulu'};


var CLASSROOM=new View(0);
var INTERESTS=new View(1);
var CRITERIA=new View(2);
var LEARNER_VIEW=new View(3);
var OPTIONS=new View(4);
var TEAM_NOTES=new View(5);

var view = CLASSROOM
var PUPILS=[];
var TEAMS=[];
var TOPICS=[];

OPTIONS.language='';
OPTIONS.show_icons=true;
OPTIONS.always_show_names = false;
OPTIONS.team_size = 4;
OPTIONS.color=false;
OPTIONS.clicker='None';


// Creating criteria. These could also come from somewhere else.
ALL_HOBBIES=new CriterionGroup('Hobbies');
ALL_HOBBIES.img_src='icons/bee.png';
ALL_HOBBIES.set([new Criterion('Bee','icons/bee.png'), new Criterion('Book','icons/book.png'),new Criterion('Craft','icons/craft.png'), new Criterion('Digital','icons/digital.png'), new Criterion('Fire','icons/fire.png'),new Criterion('Sleepy','icons/sleepy.png'), new Criterion('Spice','icons/spice.png')]);

ALL_FRIENDS=new CriterionGroup('Friends');
ALL_FRIENDS.img_src='icons/friend.png';

ALL_ENEMIES=new CriterionGroup('Enemies');
ALL_ENEMIES.img_src='icons/enemy.png';

ALL_LEVELS=new CriterionGroup('Levels');
ALL_LEVELS.set([new Criterion('Sunny', 'icons/sun.png'), new Criterion('Half-cloudy', 'icons/halfcloud.png'), new Criterion('Cloudy', 'icons/cloud.png')]);
ALL_LEVELS.img_src='icons/sun.png'

ALL_LANGUAGES=new CriterionGroup('Languages');
ALL_LANGUAGES.set([new Language('en'), new AddLanguageButton()]);
ALL_LANGUAGES.img_src='icons/lang_empty.png';

ALL_GENDERS=new CriterionGroup('Gender');
ALL_GENDERS.img_src='icons/female.png';
ALL_GENDERS.set([new Criterion('Girl','icons/female.png'), new Criterion('Boy','icons/male.png'),new Criterion('No gender','icons/no_gender.png')]);
ALL_VOTES=new CriterionGroup('Votes');
ALL_VOTES.img_src='icons/vote.png';


// ********* FILLING WITH DEMO CONTENT ******
if (CONTROLLER.offline) {
    
    // fill Array pupils with Pupils. These pupils should be created from data from LMS or something. 
    names=['Jukka','Tarmo','Oscar','Teemu','Jyri','Wilhelm','Knuth','Ringo','Peter','Ted','Nico','Leyla','Sam','Anne','Diana','Tiina','Bianca','Zarrin','Diniella','Cindy','Sarah R','Jasmin','Sarah N','Maria', 'Jafar','Daniel','Simin','Anna'];
    genders=[1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0];
    
    for (var i=0; i<names.length; i++){
        if (DEMO) {
            np=new Pupil(names[i], 'demo/Learner'+(i+1)+'.png');
            //np=new Pupil(names[i],'');
            np.addProperty(ALL_GENDERS.criteria[genders[i]]);
        } else {
            photo=(photos[i]) ? 'newstudents/'+photos[i]+'.png' : '';
            np=new Pupil(names[i], photo);
        }
        //give random hobbies
        np.addProperty(ALL_HOBBIES.criteria[Math.floor(Math.random()*ALL_HOBBIES.criteria.length)]);
        np.addProperty(ALL_HOBBIES.criteria[Math.floor(Math.random()*ALL_HOBBIES.criteria.length)]);
        PUPILS.push(np);
        cr=new Friend(np);
        ALL_FRIENDS.add(cr);
        cr=new Enemy(np);
        ALL_ENEMIES.add(cr);
    
    }
    
    //PUPILS=[];
    
    demo_note = new TeamNote();
    demo_note.audio_url='';
    demo_note.photos=['myphoto_1.jpg'];

}

// ********* FILLING WITH DEMO CONTENT ENDS ******

// **** Widgetizing TeamUP -- user changes should send view changes and view changes should be reflected for users
// reacting to view changes for user is handled by CONTROLLER. 

// **********************************

// All event sources from index.html 
// Assign events to elements and connect events to functions
$(document).ready(function(){

    // hide panels        
    $('#language-panel').dialog({height:480, width:720, modal:true, autoOpen: false});
    $('#upload-panel').dialog({height:480, width:480, modal:true, autoOpen: false, closeOnEscape: false});

    $('#welcome-panel').dialog({ width:720, position:[80,10], modal:true, autoOpen: false, close:function(event,ui){
        if( PUPILS.length==0) LEARNER_VIEW.create_person(null);
        }});
    $('#teacher-panel').dialog({height:480, width:480, modal:true, autoOpen: false, closeOnEscape: true, buttons: { "OK": function() { $(this).dialog("close"); }}});
    $('#delete-confirm-panel').dialog({height:480, width:480, modal:true, autoOpen: false, closeOnEscape: true, buttons: { "Delete": function() {$(this).dialog("close");LEARNER_VIEW.delete_learner();}, "Cancel": function() {$(this).dialog("close");}}});
    $('#reset-confirm-panel').dialog({height:480, width:480, modal:true, autoOpen: false, closeOnEscape: true, buttons: { "Reset": function() {$(this).dialog("close");CLASSROOM.reset_teams(true);}, "Cancel": function() {$(this).dialog("close");}}});
    $('#delete-note-confirm-panel').dialog({height:480, width:480, modal:true, autoOpen: false, closeOnEscape: true, buttons: { "Delete": function() {$(this).dialog("close");TEAM_NOTES.remove_note(event, true);}, "Cancel": function() {$(this).dialog("close");}}});

    //$('#welcome-panel-inner').accordion({header:'h3', autoHeight:false});
    $('#debug').toggle(function () {$(this).css('height','20px')}, function () {$(this).css('height','400px')});
    $('div.main_area').css({height:$(window).height()-120});
    $('div.top').css({height:$(window).height()-120});
    $('body').css({height:$(window).height()});


    var params=getUrlVars();
    if (params.debug_mode) {
        DEBUG_MODE=true;
    }


    // General navigation
    $('#home_button').click(go_home).keyup(function(e){if(e.keyCode==13) $(this).click()});
    
    $('div.left_nav').click(go_left).keyup(function(e){if(e.keyCode==13) $(this).click()});
    $('div.left_nav').disableSelection();

    $('div.right_nav').click(go_right).keyup(function(e){if(e.keyCode==13) $(this).click()});
    $('div.right_nav').disableSelection();
    $('div.right_nav img').disableSelection();
    $('div.left_menu_nav').click(go_left_slider);
    $('div.right_menu_nav').click(go_right_slider);
    $('#leave_iframe').click(function () {window.open(self.location, 'TeamUp')});
    
    // Classroom functionalities
    
    $('#class_view').click(CLASSROOM.select_class_view).keyup(function(e){if(e.keyCode==13) $(this).click()});
    $('#team_view').click(CLASSROOM.select_team_view).keyup(function(e){if(e.keyCode==13) $(this).click()});    
    
    $('#names_submit').click(CLASSROOM.prepare_new_classroom);
    $('#join_submit').click(CLASSROOM.join_classroom);
    CONTROLLER.init();
    OPTIONS.language=guess_language();
    localize();
    if (top !== self) $('#leave_iframe').show();
    if (CONTROLLER.offline && getUrlVars().first) $('#teacher-panel').dialog('open');     
    if (CONTROLLER.offline) $('#debug').hide();
    // Start with an empty class
    if (CONTROLLER.offline && TOPICS.length==0) {
        debug('>>>> Creating initial topics'); 
        TOPICS=[new Topic(''), new Topic(''), new Topic('')];
        for (var i=0;i<TOPICS.length;i++) {
            CONTROLLER.addChange(TOPICS[i]); 
        }
        CONTROLLER.addArray('TOPICS',TOPICS); // this will not do anything when offline but just for completeness sake 
    }

    
    CLASSROOM.populate_class();
    CLASSROOM.build_class_view(false);    
    $(window).resize(function(event) {
        //CLASSROOM.resize_display();
        if (view==LEARNER_VIEW && !MODERATOR) {
            $('div.main_area').css({height:$(window).height()});
            $('div.top').css({height:$(window).height()});
        } else {
            $('div.main_area').css({height:$(window).height()-120});
            $('div.top').css({height:$(window).height()-120});
        } 
        if (view==CLASSROOM) { 
            if (TEAM_VIEW){
                CLASSROOM.build_team_view(false);
            } else {
                CLASSROOM.build_class_view(false);
            }
        }
    });


    // Team notes
    $('#record_note').click(TEAM_NOTES.record_mode);
    $('#note_viewer_object').jPlayer( { swfPath: "", ready:TEAM_NOTES.prepare_audio, supplied:"mp3", cssSelectorAncestor: "#player_interface", preload:'auto',
    timeupdate: function(event) { // Add a listener to report the progress
        $('#play_marker').css('left',19+(6.8333333*event.jPlayer.status.currentTime));
        $('#play_marker').text(Math.round(event.jPlayer.status.duration-event.jPlayer.status.currentTime));
    },
    play: function(event) { // Add a listener to report the time play began
        $('#play_marker').css('left',19+(6.8333333*event.jPlayer.status.currentTime));
        $('#play_marker').text(Math.round(event.jPlayer.status.duration-event.jPlayer.status.currentTime));
    },
    loadeddata: function(event) {
        $('#length_bar').css('width',6.8333333*event.jPlayer.status.duration);
        $('#outer_length_bar').css('width',6.8333333*event.jPlayer.status.duration+18);
    } 
    });

    $('#save_note').click(TEAM_NOTES.save_note);
    
    $('#player_button').click(function (){
        $('#note_viewer_object').jPlayer("play");
    });
    
    $('#play_marker').draggable({axis:'x', containment: '#outer_length_bar', drag: function(event, ui) {
        pct=(ui.position.left-19)/$('#length_bar').width();
        dur=$('#note_viewer_object').data("jPlayer").status.duration;
        $('#play_marker').text(Math.round(dur-(pct*dur)));
        $('#note_viewer_object').jPlayer('playHead',Math.round(pct*100));
    }});
    
    // Menu buttons    
    $('#start_teams').click(go_right).keyup(function(e){if(e.keyCode==13) $(this).click()});    
    $('#edit_learners').click(CLASSROOM.go_learner_view).keyup(function(e){if(e.keyCode==13) $(this).click()});
    $('#options').click(CLASSROOM.go_options).keyup(function(e){if(e.keyCode==13) $(this).click()});

    // Interests and voting functionalities
    // more themes get added dynamically, so this needs to be done repeatedly.
    INTERESTS.draw_topics(false);
    $('#reset_votes').click(INTERESTS.reset_votes);
    // Setting criteria and teaming up! 
    $("#team_up_button").click(CRITERIA.confirm_before_teaming).keyup(function(e){if(e.keyCode==13) $(this).click()});
    $(".criteria div.placeholder").droppable({greedy:true, activeClass:'markDroppable2', hoverClass:'drophover2', tolerance:'pointer', drop: CRITERIA.add_unifying_crit});
    $("td.criteria_background").droppable({accept:'div.criteria_item', drop:CRITERIA.remove_unifying_crit});
    // People functionalities
    
    $('#remove_person').click(function () {$('#delete-confirm-panel').find('b').text(PUPILS[THIS_PERSON].name);$('#delete-confirm-panel').dialog('open');$('div.ui-dialog-buttonpane').find('button:last').focus();}).keyup(function(e){if(e.keyCode==13) $(this).click()});
    $('#add_person').click(LEARNER_VIEW.create_new_person).keyup(function(e){if(e.keyCode==13) $(this).click()});
    $("#namebox").change(function(event) {
        PUPILS[THIS_PERSON].name=$(this).val().replace('<','').replace('>','');
        CONTROLLER.addChange(PUPILS[THIS_PERSON]);
        CONTROLLER.sendChanges();
        CLASSROOM.update_faces();
        $(this).blur();
    }),
    $("#camera_toggle").click(function(event) {
        if (camera_on) {
            if (!$(this).hasClass('disabled')) {
                take_photo();
            }
        } else {
            prepare_photoshoot();
        }                    
    });
    $("#keep_photo").click(keep_photo),
    $("#try_again_photo").click(redo_photoshoot),
    $("#cancel_photo").click(finish_photoshoot),
    // Options
    $('#team_size').val(OPTIONS.team_size);
    $('#team_size').change(function(event) {OPTIONS.team_size=$(this).val();});
    $('#show_icons').attr('checked', OPTIONS.show_icons);
    $('#show_icons').change(function(event) {
        OPTIONS.show_icons=this.checked;
        CONTROLLER.setOption('SHOW_ICONS', OPTIONS.show_icons);
        CONTROLLER.sendChanges();
        });
    $('#show_names').change(function(event) {
        OPTIONS.always_show_names=this.checked;
        CLASSROOM.update_faces();
        });
    $('#reset_teams').click(function(){CLASSROOM.reset_teams(false)});
    var s="";
    var check;
    for (key in LANGUAGES) {
        s+='<option value="'+key+'">'+LANGUAGES[key]+'</option>';
    }
    $('#language_select').html(s);
    $('#language_select').val(OPTIONS.language);
    $('#language_select').change(function(event) {
        OPTIONS.language=$(this).val();
        params=getUrlVars();
        params['locale']=OPTIONS.language;
        if (window.location.href.indexOf('?')==-1) {
            window.location=window.location.href+'?'+$.param(params);
        } else {            
            window.location=window.location.href.slice(0,window.location.href.indexOf('?')+1)+$.param(params);
        }
    });
    $('#teacher_url, #learner_url, #panel_teacher_url, #panel_learner_url').click(function () {$(this).focus().select()});
    $('#clicker_select').val(OPTIONS.clicker);
    $('#clicker_select').change(function(event) {
        OPTIONS.clicker=$(this).val();
        SMART_ENABLED= (OPTIONS.clicker=='SMART');
        if (SMART_ENABLED) {
            smart_clicker_enable()
        } else {
            $('#smart_receiver').hide();
        }
    });
    $('#clicker_select').change();

    LEARNER_VIEW.update_property_choices();
    // CLASSROOM has already been before we know if the user is moderator or not.
    if (CONTROLLER.offline && !MODERATOR) CLASSROOM.adjust_for_learners();

    if (SMART_ENABLED) {
        smart_clicker_enable()
    }

    CLASSROOM.show('up');
});

// ************************************
// Utility functions

function isType(obj, type_string) {
    if (!obj) {
        return false;
    }
    if (!obj.type) {
        return false;
    }
    return (obj.type==type_string)
}

// turn general Object into specific class instance (Team, Pupil or Topic)
function restore_json_object(json_obj) {
    var new_obj;
    var obj=$.parseJSON(json_obj);
    if (obj.type=='Team') {
        new_obj= new Team(true);
    } else if (obj.type=='Pupil') {
        new_obj= new Pupil('','',true);
    } else if (obj.type=='Topic') {
        new_obj= new Topic('',true);
    } else if (obj.type=='TeamNote') {
        new_obj= new TeamNote(true);
    } else {
        debug('parsing strange json_obj:'+json_obj);
        return json_obj;
    }
    
    for (var key in obj) {
        new_obj[key] = obj[key];
    }
    CATALOG[new_obj.uid]=new_obj;
    return new_obj
}

// Assign instances of data objects (Pupil, Criterion, Topic etc.)  to their ui objects (jQuery objects).
// Because of some strange behaviour, instead of objects these store catalog keys 
// so that the updated versions of objects are always fetched from CATALOG.   
function setData(ui_obj, data_obj) {
    if (ui_obj.length==0 || !ui_obj) {
        debug('**** SET DATA CALLED WITH EMPTY UI OBJECT: '+$(ui_obj));
    }

    if (typeof data_obj=='undefined') {
        debug('**** SET DATA CALLED WITH UNDEFINED OBJECT: .'+ui_obj[0].id);
    }

    $(ui_obj).data('teamup_data', data_obj.uid);
}

// get data object stored into ui object 
function getData(ui_obj) {
    if (!ui_obj || ui_obj.length==0) {
        debug('**** GET DATA CALLED WITH EMPTY UI OBJECT: '+$(ui_obj));
        return;
    }
    var key=$(ui_obj).data('teamup_data');
    if (!key) {
        debug('**** GET DATA FOUND NO KEY: #'+ui_obj[0].id);
    }
    var obj= CATALOG[key];
    if (obj==undefined) {
        debug('**** GET DATA FOUND NOTHING (==UNDEFINED): #'+ui_obj[0].id);
    }
    return obj
}


function random_pick(obj_array) {
    var index= Math.floor(Math.random()*obj_array.length)
    return obj_array.splice(index, 1)[0];
}

function pick_item(pick, obj_array) {
    for (var i=0;i<obj_array.length;i++) {
        if (pick==obj_array[i]) {
            return obj_array.splice(i,1)[0];
        }
    }
}

function pick_item_by_uid(item_uid, obj_array) {
    for (var i=0;i<obj_array.length;i++) {
        if (item_uid==obj_array[i].uid) {
            return obj_array.splice(i,1)[0];
        }
    }
}


function find_index_by_uid(item_uid, obj_array) {
    for (var i=0;i<obj_array.length;i++) {
        if (item_uid==obj_array[i].uid) {
            return i;
        }
    }
}


function i18n(str){
    if (localizedStrings == null) return str;
    var locstr = localizedStrings[str];
    if (locstr == null || locstr == "") locstr = str;
    return locstr;
}


function getUrlVars() {
    var vars = {};
    if (window.location.href.indexOf('?')==-1) return vars;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function fs_friendly_string(s) {
    s=s.replace(/\//g,'sl');
    s=s.replace(/\?/g,'q');
    s=s.replace(/\+/g,'plus');
    s=s.replace(/~/g,'tilde');
    s=s.replace(/\.\./g,'dots');
    s=s.replace(/\*/g,'star');
    s=s.replace(/\|/g,'pipe');
    s=s.replace(/:/g,'colon');
    s=s.replace(/</g,'lt');
    s=s.replace(/>/g,'gt');
    s=s.replace(/\s/g,'_');
    return s; //encodeURIComponent(s);   
}

function guess_language(){
    var params=getUrlVars();
    return params.locale || CONTROLLER.getLocale() || navigator.language || navigator.userLanguage;
}

function localize(){
    /* Ensure language code is in the format aa-AA. */
	var lang = OPTIONS.language.replace(/_/, '-').toLowerCase();
	if (lang.length > 3) {
		lang = lang.substring(0, 3) + lang.substring(3).toUpperCase();
	} else if (lang.length == 2) {
	    lang = lang+'-'+lang.toUpperCase();   
	}
	if (lang=='en-EN') return;
    jQuery.ajax("i18n/localized_"+lang+".js", {
        dataType: "json",
        isLocal: true,     
        error: function(jqXHR, textStatus, errorThrown){
            debug('i18n failed:jqXHR='+jqXHR+' textStatus:'+textStatus+' errorThrown:'+errorThrown);
            return jqXHR;
                
        },
        complete: function(data) {
            // Change all of the static strings in index.html
            debug('changing anyway');
            var place;
            var localizedStrings=$.parseJSON(data.responseText);
            var text_ids=['i18n_class','i18n_teams','keep_photo','try_again_photo','cancel_photo','label_team_size','label_show_names',
            'i18n_interests_heading','i18n_grouping_heading','team_up_button',
            'i18n-play','i18n-pause','i18n-stop','i18n-mute','i18n-unmute',
            'i18n-what-we-did','i18n-what-we-will-do','i18n-any-problems','record_note',
            'start_teams','edit_learners','options', 'i18n_options', 'label_reset_teams',
            'i18n-reset-confirmation', 'i18n-del-confirmation', 'i18n-download_confirm', 'i18n-download-no', 'i18n-download-complete','i18n-cancel','i18n-bad-photo', 'recording_help_1', 'recording_help_2','recording_help_3','recording_help_4','recording_help_5', 
            'label_language', 'label_teacher_url', 'label_learner_url', 'i18n-upload-message','i18n-del-note-confirmation'];
            for (var i=0;i<text_ids.length;i++) {
                place=$('#'+text_ids[i]);
                place.html(i18n(place.html()));
            }
            // Values
            //'topic_0','topic_1','topic_2','topic_3'
            
            // alt/title:  'add_person', 'home_button'
            $('#welcome-panel').attr('title',i18n($('#welcome-panel').attr('title')));
            $('#delete-confirm-panel').attr('title',i18n($('#delete-confirm-panel').attr('title')));
            $('#delete-note-confirm-panel').attr('title',i18n($('#delete-note-confirm-panel').attr('title')));
            $('#names_submit').val(i18n($('#names_submit').val()));
            $('#join_submit').val(i18n($('#join_submit').val()));
            $('#reset_teams').val(i18n($('#reset_teams').val()));
            $('#add_person').attr('alt',i18n($('#add_person').attr('alt')));
            $('#add_person').attr('title',i18n($('#add_person').attr('title')));
            $('#remove_person').attr('alt',i18n($('#remove_person').attr('alt')));
            $('#remove_person').attr('title',i18n($('#remove_person').attr('title')));
            $('#delete-confirm-panel').attr('title',i18n($('#delete-confirm-panel').attr('title')));
            $('#home_button').attr('alt',i18n($('#home_button').attr('alt')));
            $('#home_button').attr('title',i18n($('#home_button').attr('title')));
            $('#upload-panel').attr('title',i18n($('#upload-panel').attr('title')));
            $('div.left_nav').attr('title',i18n($('div.left_nav').attr('title')));
            $('div.right_nav').attr('title',i18n($('div.right_nav').attr('title')));
            $('#camera_toggle').attr('title',i18n($('#camera_toggle').attr('title')));
            
            
            $('input.topic').each(function () {
            if ($(this).val()=='[ enter topic ]') { 
                $(this).val(i18n('[ enter topic ]'));
            }
            });
            $('.property_picker_item').each(function() {
                $(this).attr('alt', i18n($(this).attr('alt')));
                $(this).attr('title', i18n($(this).attr('title')));
            })
            }
        }           
    );
    
}


// debug 
function str(myObj) {
    var s='';
    for (myKey in myObj){
        s+=myKey+':'+myObj[myKey]+', ';
    }
    return s;
}


// **********************************
// Camera utility methods


function savedPhoto(path) {
    debug('Received a photo');
    var pup=PUPILS[THIS_PERSON];
    var old_src=pup.img_src;
    pup.img_src=SERVER_URL+'uploads/'+path+'_photo.jpg?r='+Math.floor(Math.random()*10000);
    debug('new img_src:'+pup.img_src);
    $("img.large_portrait").attr('src', pup.img_src);   
    if (old_src!=DEFAULT_IMAGE) {     
        $('img').each(function (){
            if ($(this).attr('src')==old_src) {
                $(this).attr('src',pup.img_src)
            }
        });
    }
    ALL_FRIENDS.find_person(pup).img_src=pup.img_src;
    ALL_ENEMIES.find_person(pup).img_src=pup.img_src;
    CONTROLLER.addChange(pup);
    CONTROLLER.sendChanges();
    CLASSROOM.update_faces();
    finish_photoshoot();
}

function tookPhoto() {
    //$("div.portrait").show();
    debug('tookPhoto called');
    $('#camera_toggle').hide();
    $("#save_portrait").show();
}


function encodingComplete() {
    $('#note_recorder_help').hide();
    $('#recorder_save_help').show();
}



function finishedRecording(path) {
    $('#upload-panel').dialog('close');
    $('#recorder_save_help').hide();
    debug('Received a record');
    // Create an empty note but don't catalog it yet
    var note = new TeamNote(false);
    note.audio_url=SERVER_URL+'uploads/'+path+'_rec.mp3';
    note.photos.push(SERVER_URL+'uploads/'+path+'_pic.jpg');
    // Give it a proper uid before cataloging
    var team=getData($('#team_title'));
    note.uid= path;
    // Now catalog & finalize it
    CATALOG[note.uid]=note;
    CONTROLLER.addChange(note);
    team.notes.push(note.uid);
    CONTROLLER.addChange(team);
    CONTROLLER.sendChanges();
    TEAM_NOTES.create_team_notes(team);        
}

function uploadingRecording() {
    debug('Uploading recording...');
    $('#upload-panel').dialog('open');
    notes=$('#available_recordings');
    notes.width(notes.width()+142);
    notes.append('<div class="note_thumbnail">...</div>');
    var thumb=notes.find('div.note_thumbnail').last();
    thumb.hide("slow");
    thumb.show("slow");
    thumb.hide("slow");
    thumb.show("slow");
    thumb.hide("slow");    
}

// send flash the exact parameters of what to save and where.
function keep_photo() {
    debug('saving photo...');
    var pup=PUPILS[THIS_PERSON];
    var server_path=SERVER_URL;
    var class_name=fs_friendly_string((PARAMS) ? PARAMS.class_key : 'demo');
    var user_uid= fs_friendly_string(pup.uid);
    var cam = swfobject.getObjectById('PhotoBooth');
    if (cam.capture !== undefined) {
        debug('Found photobooth');
        cam.save(server_path, class_name, user_uid);  // will result in 'savedPhoto' call
    }    
}

function redo_photoshoot() {
    debug('releasing still photo');
    var cam = swfobject.getObjectById('PhotoBooth');
    if (cam.capture !== undefined) {
        debug('Found photobooth');
        cam.release();  // doesn't call back, just removes the still
    }    
    prepare_photoshoot();
}

function prepare_photoshoot() {
    $("div.portrait").hide();
    $("#save_portrait").hide();
    $("div.photoshoot").show();
    //$('#camera_toggle').addClass('disabled');
    $('#camera_toggle').show();
    camera_on=true;
}


function take_photo() {
    debug('taking photo...');    
    var cam = swfobject.getObjectById('PhotoBooth');
    if (cam.capture !== undefined) {
        debug('Found photobooth');
        cam.capture();  // will result in 'tookPhoto' call
    }
    camera_on=false;
}

function finish_photoshoot() {
    $('div.portrait').show();
    $('div.photoshoot').hide();
    $('#save_portrait').hide();
    $('#camera_toggle').show();
    camera_on=false;
}

function photo_error(error) {
    debug(error);
}

// **********************************
// Clicker support

function smart_clicker_enable() {
    flashvars= {}
    fparams={bgcolor:'#1D6D1C'}
    fattributes={'id':'SmartResponse', 'name':'SmartResponse'}
    swfobject.embedSWF('smart/ResponsePlusTeamUp.swf', 'smart_receiver_inner', '64', '64', '9.0', 'expressInstall.swf', flashvars, fparams, fattributes);
    $('#smart_receiver').show();
}

function voteClicker(clickerId,choice, givenName, familyName){
    // recognize the voter and add vote if possible  
    //
    debug('Received vote: '+clickerId+'; '+choice+'; '+givenName+'; '+familyName);
    var pupil=null; 
    // The easiest matches are those where we already have clicker_ids for each pupil. 
    for(var i = 0; i < PUPILS.length; i++){
        if (PUPILS[i].clicker_id==clickerId) {
            pupil=PUPILS[i];
            break;
        }
    }        
    if (!pupil) {
        // try matching student name with pupils. Try matching (first name+last name, first name + initial, first name)
        // if success, then set this id to be the clicker_id for this pupil for easier match in the future.  
        for (var i=0; i<PUPILS.length;i++){    
            if (PUPILS[i].name==givenName+' '+familyName && !PUPILS[i].clicker_id) {
                pupil=PUPILS[i];
                pupil.clicker_id=clickerId;
                CONTROLLER.addChange(pupil);
                break;
            }
        }
        if (!pupil) {
            var pattern=new RegExp(givenName+'[\s_]*'+familyName.substr(0,1)+'.*', 'i'); // matches JukkaP, Jukka_P, JukkaPuu, Jukka P...
            for (var i=0; i<PUPILS.length;i++){    
                if ((PUPILS[i].name.match(pattern) && !PUPILS[i].clicker_id)) {
                    pupil=PUPILS[i];
                    pupil.clicker_id=clickerId;
                    CONTROLLER.addChange(pupil);
                    break;
                }
            }
        }
        if (!pupil) {
            for (var i=0; i<PUPILS.length;i++){    
                if (PUPILS[i].name==givenName && !PUPILS[i].clicker_id) {
                    pupil=PUPILS[i];
                    pupil.clicker_id=clickerId;
                    CONTROLLER.addChange(pupil);
                    break;
                }
            }
        }
    }
    if (!pupil) {
        debug("Couldn't find matching student. No vote.");
        return;
    }
    choice=Number(choice);
    if (choice>0 && TOPICS.length>choice-1 && pupil.votes_available>0) {
        topic=TOPICS[choice-1];        
        debug("pupil "+pupil.name+" voted for topic "+(choice-1));
        topic.addVoter(pupil);
        pupil.votes_available--;
        CONTROLLER.addChange(topic);
        CONTROLLER.addChange(person);        
    }
    CONTROLLER.sendChanges();
    if (view==INTERESTS) {
        INTERESTS.draw_topics();
    }
}



// **********************************
// Shared navigation

function go_home(event) {
    $('div.person').hide();
    $('div.options').hide();
    $('div.interests').hide();
    $('div.criteria').hide();
    $('div.recordings').hide();
    $('div.people_properties').hide();
    $('div.people_picker').hide();
    $('div.criteria_picker').hide();
    $('#available_recordings').hide();
    $('div.bottom').show();
    $('div.classroom').show('slide',{direction:'up'},300);
    $('div.menu').show('slide',{direction:'up'},300);
    $('#home_button').fadeOut(300);
    if (MODERATOR) {
        $('#add_person').fadeOut(300);
        $('#remove_person').fadeOut(300);
    }        
    $('.view_button').show();
    $('.top div.nav').toggleClass('disabled', false);
    $('.bottom div.nav').toggleClass('disabled', true);
    view=CLASSROOM;
}

function disable_nav() {
    $('div.nav').toggleClass('disabled', true);
}
function enable_nav() {
    $('div.nav').toggleClass('disabled', false);
}
    

function go_left(event) {
    if (!$(this).hasClass('disabled')) view.prev();
}

function go_right(event) {
    if (!$(this).hasClass('disabled')) view.next();
}

function go_left_slider(event) {
    if (view==INTERESTS) {
        slide_left('div.people_picker_face');
    } else if (view==LEARNER_VIEW) {
        slide_left('div.property_picker_item');
    } 
}

function go_right_slider(event) {
    if (view==INTERESTS) {
        slide_right('div.people_picker_face');
    } else if (view==LEARNER_VIEW) {
        slide_right('div.property_picker_item');
    } 

}

function slide_left(icon_query_string){
        var slider=$('div.bottom_inner')
        var icon_width=$(slider).find(icon_query_string).first().width()+10;
        slider.animate({scrollLeft: '-='+icon_width*7},400, 'easeInQuad');
}
function slide_right(icon_query_string){
        var slider=$('div.bottom_inner')
        var icon_width=$(slider).find(icon_query_string).first().width()+10;
        slider.animate({scrollLeft: '+='+icon_width*7},400, 'easeInQuad');
}

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



TEAM_NOTES.view_learner = function (event) {
    var person=getData($(this))
    TEAM_NOTES.hide();
    if (!MODERATOR) $('div.bottom').hide();
    LEARNER_VIEW.create_person(person);
    $('div.person').show('slide',{direction:'down'},300);
    if (MODERATOR) $('div.people_properties').show('slide',{direction:'down'},300);
    $('#home_button').fadeIn(300);
    if (MODERATOR) {
        $('#add_person').fadeIn(300);
        $('#remove_person').fadeIn(300);
    }
    $('.view_button').hide();
    enable_nav();
    if (!MODERATOR) {
        $('.bottom div.nav').toggleClass('disabled', true);
    } 
    view=LEARNER_VIEW;    
} 


TEAM_NOTES.create_team_notes= function(team) {
    camera_on=false;
    $('#note_viewer').show();
    $('#note_recorder').hide();
    $('#note_viewer_help').show();
    $('#note_recorder_help').hide();
    $('#recorder_save_help').hide();
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
    //debug('create_team_notes calling setData');
    setData(tt, team);
    var place=$('#team_member_faces');
    place.html('');
    var s, obj, member;   
    for (var i=0;i<team.members.length;i++) {
        member=CATALOG[team.members[i]];
        s='<div class="team_face" alt="'+member.name+'" title="'+member.name+'">';
        s+='<img src="'+member.img_src+'" width="64" height="64" />';
        if (member.img_src==DEFAULT_IMAGE || OPTIONS.always_show_names) {
            s+='<label>'+member.name+'</label>';
        }
        s+='</div>';
        place.append(s);
        obj=place.find('div.team_face').last();
        //debug('create_team_notes 2 calling setData');
        setData(obj, member);
        obj.dblclick(TEAM_NOTES.view_learner);
        
    }
    var notes=$('#available_recordings');
    notes.html('');
    var dt;
    notes.width(team.notes.length*142);

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
    var half_size=($(window).height()<532);
    if (half_size) {
        $('#player').css('top',-50);
        $('div.note_questions').css('top',-74);
        $('div.note_questions span').css({'background-color':'#000'});
    } else {
        $('#player').css('top',0);
        $('div.note_questions').css('top',-24);;
        $('div.note_questions span').css({'background-color':'transparent'});
    }
    swfobject.embedSWF('recorder/TeamRecorder2.swf', 'TeamRecorder', '480', '410', '10.3.0', 'expressInstall.swf', {half_size:half_size},{},{});
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
    $('#note_photo_empty').show();
    $('#note_viewer_object').jPlayer("setMedia", {mp3:''});
}


TEAM_NOTES.load_note= function(note) {
    //debug('load_note calling setData');
    setData($('#note_viewer'), note);
    var dt = new Date(note.timestamp);
    $('#note_photo label').html((dt.getDate())+'/'+(dt.getMonth()+1)+' '+dt.getHours()+':'+((dt.getMinutes()<10) ? '0':'')+dt.getMinutes());
    if (note.photos.length>0) {
        $('#note_photo_img').show();
        $('#note_photo_img').attr('src', note.photos[0]);
        $('#note_photo_empty').hide();
    } else {
        $('#note_photo').css('background-image','none');
        $('#note_photo_img').hide();
        $('#note_photo_empty').show();
    }
    $('#note_viewer_object').jPlayer("setMedia", {mp3:note.audio_url});
}

TEAM_NOTES.view_mode= function(event) {
    if (!camera_on) 
        {return;}
    $('#note_viewer').show();
    $('#note_recorder').hide();
    $('#note_viewer_help').show();
    $('#note_recorder_help').hide();
    camera_on=false;
}

TEAM_NOTES.record_mode= function(event) {
    if (camera_on) 
        {return;}
    $('#note_viewer').hide();
    $('#note_recorder').show();
    $('#note_viewer_help').hide();
    $('#note_recorder_help').show();
    camera_on=true;
}

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

// **********************************
// Class view

CLASSROOM.select_class_view = function (event) {
    $('#class_view').addClass('selected');
    $('#team_view').removeClass('selected');
    CLASSROOM.build_class_view(true);
}


CLASSROOM.select_team_view = function(event) {
    $('#team_view').addClass('selected');
    $('#class_view').removeClass('selected');
    CLASSROOM.redraw_team_labels();
    CLASSROOM.build_team_view(true);
}

CLASSROOM.populate_class= function() {
    var place=$('div.class_area');
    place.html('');
    var pup,s,obj;
    for (var i=0; i<PUPILS.length; i++) {
        pup=PUPILS[i];
        s='<div class="face" id="pup'+pup.uid+'"><label>'+pup.name+'</label><img src="'+pup.img_src+'" width="100" height="100" /><span class="away ui-icon ui-icon-closethick">&nbsp;</span></div>';
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
    if (MODERATOR) $('div.face').draggable({zIndex:2700}).droppable({greedy:false, over:CLASSROOM.drag_over, out:CLASSROOM.drag_out, drop:CLASSROOM.drag_drop, tolerance:'pointer', scroll:false});

    $('div.face').dblclick(CLASSROOM.view_learner);
    $('span.away').click(function(event) {
        var face=$(this).closest("div");
        face.addClass('away');
        event.stopImmediatePropagation();
        face.click(function(event) {
            $(this).removeClass('away');
        });
    });
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
    // Menu buttons    
    $('#start_teams').text(i18n('Vote for topics'));    
    $('#edit_learners').text(i18n('Take your photo'));
    $('#reset_teams').closest('p').hide();
    $('#team_size').closest('p').hide();
    $('#teacher_url').closest('p').hide();
    $('#show_icons').closest('p').hide();
    $('#add_person').hide();
    $('#remove_person').hide();
    $('#reset_votes').hide();
    if (TEAMS.length==0) {
        $('#team_view').hide();    
    }
}


CLASSROOM.view_learner = function (event) {
    var person=getData($(this))
    CLASSROOM.hide();
    LEARNER_VIEW.create_person(person);
    if (!MODERATOR) $('div.bottom').hide();
    $('div.person').show('slide',{direction:'down'},300);
    if (MODERATOR) $('div.people_properties').show('slide',{direction:'down'},300);
    $('#home_button').fadeIn(300);
    if (MODERATOR) {
        $('#add_person').fadeIn(300);
        $('#remove_person').fadeIn(300);
    }
    $('.view_button').hide();
    enable_nav();
    if (!MODERATOR) {
        $('.bottom div.nav').toggleClass('disabled', true);
    } 
    view=LEARNER_VIEW;    
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
        $('#team_view').hide();    
    } else {
        $('#team_view').show();
    }            
    TEAM_VIEW=false;
    var box_width=$(window).width()-60;
    var box_height=$(window).height()-230;

    var icon_width=$('div.face').first().outerWidth();
    var box_ratio=box_width/box_height;
    var per_row=Math.floor(Math.sqrt(Math.ceil(PUPILS.length*box_ratio)));
    var new_size_x=(box_width/per_row);
    var new_size_y=box_height/Math.ceil(PUPILS.length/per_row);
    if (new_size_x<new_size_y) {
        new_size=new_size_x;
    } else {
        new_size=new_size_y;
    }
    if (new_size>255) new_size=255;
    var padding=new_size/20;
    new_size-=padding;
    //$('#team_view').html('h:'+box_height+' cols:'+per_row+' rows:'+Math.ceil(PUPILS.length/per_row));

    var x=60;
    var y=88;
    if (animate){
        $('div.face').animate({width:new_size, height:new_size});
        $('div.face img').animate({width:new_size, height:new_size});
        icon_width=new_size+padding;
    } else {
        $('div.face').css({width:new_size, height:new_size});
        $('div.face img').css({width:new_size, height:new_size});
        icon_width=new_size+padding;
    }        
    if (animate) {
        $('div.team_box').animate({opacity:0.0},1200);
        $('span.team_name').animate({opacity:0.0},1200);
    }
    $('div.face label').css({'font-size':new_size+'%', width:new_size});
    //$('div.face').droppable('enable');   
    var step=icon_width+5;
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
            x=60;
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
    var box_width=$(window).width()-60;
    var box_height=$(window).height()-230;

    // calculate optimal space for displaying teams:    
    var height_factor=Math.cos((Math.PI/180)*30)
    var left_margin=30;
    var top_margin=80;
    
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
    var table_size=0.75*r
    var table_border=0.25*r/2
    if (animate){
        $('div.face').animate({width:icon_size, height:icon_size});        
        $('div.face img').animate({width:icon_size, height:icon_size});
        $('div.team_box').animate({opacity:1.0},1200);
        $('span.team_name').animate({opacity:1.0},1200);
        $('div.team_box img.team_table').animate({width:table_size, height:table_size, top:table_border, left:table_border});
    } else {
        $('div.team_box img.team_table').css({width:table_size, height:table_size, top:table_border, left:table_border});
        $('div.team_box').css({opacity:1.0});
        $('span.team_name').css({opacity:1.0});
        $('div.recordings_button').css({width:icon_size*0.75, height:icon_size*0.75});
        $('div.recordings_button img').css({width:icon_size*0.75, height:icon_size*0.75});
        $('div.face').css({width:icon_size, height:icon_size});
        $('div.face img').css({width:icon_size, height:icon_size});
    }
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
        radstep2=(Math.PI*2)/(tteam.members.length+1);
        rad2=(Math.PI/6);
        new_x=Math.round((Math.sin(rad2)*(dist)))+center-icon_center;
        new_y=Math.round((Math.cos(rad2)*(dist)))+center-icon_center;
        team_box.find('div.recordings_button').css({left: center-(icon_center*0.75), top: center-(icon_center*0.75)});
        if (tteam.notes.length==0) {
            team_box.find('div.recordings_button span').hide();
        } else {
            team_box.find('div.recordings_button span').show();
            team_box.find('div.recordings_button span').text(tteam.notes.length)
        }
        team_box.find('input.team_name').css({left: new_x, top: new_y+icon_center-20}).val(tteam.name);
        team_box.find('span.team_name').css({left: new_x, top: new_y+icon_center-20}).text(tteam.name);
        rad2=rad2+radstep2;        
        for (j=0;j<tteam.members.length;j++) {
            member=CATALOG[tteam.members[j]];
            face=member.getFace('pup');
            new_x=Math.round((Math.sin(rad2)*(dist))+tteam.center_x-icon_center);
            new_y=Math.round((Math.cos(rad2)*(dist))+tteam.center_y-icon_center);
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
    var nt, member;
    while (free_pupils.length>0) {
        for (i=0;i<teams_count;i++) {
            if (free_pupils.length>0) {
                if (TEAMS.length<=i) {                    
                    nt=new Team();
                    nt.name=i18n('Team')+' '+(i+1);
                    TEAMS.push(nt);
                    member=random_pick(free_pupils)
                } else {
                    member=random_pick(free_pupils)
                }
                TEAMS[i].members.push(member.uid);
            }
        }    
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

CLASSROOM.reset_teams= function(confirmed) {
    if (!confirmed) {
        var team_names='';
        debug('Checking if teams have newsflashes...');
        for( var i=0;i<TEAMS.length;i++) {
            if (TEAMS[i].notes.length>0) {
                team_names+=TEAMS[i].name+'<br/>';
            }
        }
        if (team_names.length>0) {
            debug('Found items... alerting user.');
            $('#reset-confirm-panel').dialog("option", "buttons", { "Reset": function() {$(this).dialog("close");CLASSROOM.reset_teams(true); }, "Cancel": function() {$(this).dialog("close");} } );
            $('#reset-confirm-panel').find('b').html(team_names);
            $('#reset-confirm-panel').dialog('open');
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
    $('#class_view').addClass('selected');
    $('#team_view').removeClass('selected');
    CLASSROOM.build_class_view(true);
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
        place.append('<div class="team_box" id="team_box_'+i+'"><span class="team_name" tabindex="'+(i+10)+'">'+team_name+'</span><input type="text" class="team_name" value="" size="12" id="team_'+i+'"/ tabindex="'+(i+10)+'"><div class="recordings_button" title="'+i18n('Team notes')+'"><img src="icons/rec.png" width="48" height="48" alt="" /><span class="available_recordings">0</span></div><img class="team_table" src="images/circle2.png" alt="" width="164" height="152" /></div>');
        team_name_input=$('#team_'+i);
        team_name_input.val(team_name);
        team_name_input.attr('size',(team_name.length>10) ? team_name.length: 10);
        setData($('#team_box_'+i),TEAMS[i]);
    }
    $('div.team_box').droppable({greedy:true, hoverClass:'table_hover', tolerance:'pointer',
        drop: CLASSROOM.switch_team});
    $('.recordings_button').click(CLASSROOM.go_team_notes);    
    $('span.team_name').click(focus_to_team_input);
    $('span.team_name').focus(focus_to_team_input);
    $('input.team_name').blur(function () {
        $(this).prev('span.team_name').show();
        $(this).hide();
    });
    $("input.team_name").change(function(event) {
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
    });
}

CLASSROOM.update_faces= function() {
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
    var target=getData(event.target);
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

CLASSROOM.go_learner_view= function(event) {
    LEARNER_VIEW.create_person_page();
    CLASSROOM.hide();
    if (!MODERATOR) $('div.bottom').hide();
    $('div.person').show('slide',{direction:'down'},300);
    if (MODERATOR) $('div.people_properties').show('slide',{direction:'down'},300);
    $('#home_button').fadeIn(300);
    enable_nav();
    if (MODERATOR) {
        $('#add_person').fadeIn(300);
        $('#remove_person').fadeIn(300);
    }
    if (!MODERATOR) {
        $('.bottom div.nav').toggleClass('disabled', true);
    } 
    view=LEARNER_VIEW;    
}

CLASSROOM.go_team_notes= function(event) {
    var team=getData($(this).closest('.team_box'));
    TEAM_NOTES.create_team_notes(team);
    CLASSROOM.hide();
    $('div.recordings').show('slide', {direction:'down'},300);
    $('#available_recordings').show('slide',{direction:'down'},300);
    $('#home_button').fadeIn(300);
    enable_nav();
    view=TEAM_NOTES;    
}

CLASSROOM.go_options= function(event) {
    CLASSROOM.hide();
    $('div.options').show('slide',{direction:'down'},300);
    $('div.bottom').hide();
    $('#home_button').fadeIn(300);
    $('div.left_nav').attr('title', "");
    $('div.right_nav').attr('title', "");

    disable_nav();
    view=OPTIONS;
}

CLASSROOM.show = function(dir){
    $('#home_button').fadeOut(300);
    $('.view_button').show();
    $('div.classroom').show('slide',{direction:dir},300);
    $('div.menu').show('slide',{direction:'down'},300);
    enable_nav();
    $('.bottom div.nav').toggleClass('disabled', true);    
    view=CLASSROOM;
    if (MODERATOR) {
        $('div.left_nav').attr('title', 'Team UP!')
    } else {
        $('div.left_nav').attr('title', i18n('Vote for topics'))
    }
    $('div.right_nav').attr('title', i18n('Vote for topics'))
    
}

CLASSROOM.hide = function(){
    $('div.classroom').hide();
    $('div.menu').hide();        
    $('.view_button').hide();
}

CLASSROOM.next = function(){
    view.hide();
    view=INTERESTS;
    view.show('right');
}
CLASSROOM.prev = function(){
    view.hide();
    view= (MODERATOR) ? CRITERIA : INTERESTS;
    view.show('left');
}

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
    var place=$('ol#topics');
    place.html('');
    
    for (var i=0;i<TOPICS.length;i++) {
        topic=TOPICS[i];
        is_empty= (topic.name.length==0) ? ' empty' : '';
        val= (topic.name.length==0) ? i18n('[ enter topic ]') : topic.name;
        s='<li><input type="text" class="topic'+is_empty+'" id="'+topic.uid+'" tabindex="'+(i+10)+'" value="'+val+'" /><div style="height:32px;width:2px;float:left;"></div></li>';
        place.append(s);
        setData($('#'+topic.uid), topic);
        li=$('#'+topic.uid).parent();
        setData(li, topic);
        for (var j=0;j<topic.voters.length;j++) {
            pupil=CATALOG[topic.voters[j]];
            r='<div class="smallFace" alt="'+pupil.name+'" title="'+pupil.name+'" id="'+topic.uid+'_vote_'+j+'">';
            if (pupil.img_src!=DEFAULT_IMAGE) {
                r+='<img src="'+pupil.img_src+'" width="32" height="32" />';
            } else {
                r+='<label>'+pupil.name+'</label>'
            }
            r+='</div>';
            li.append(r);
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
    $('input.topic').click(function(event) {
        if (getData($(this)).name=='') {
            $(this).val('');
        }
    });
    $('input.topic').change(INTERESTS.store_topic);
    $('#topics li').droppable({greedy:true, hoverClass:'drophover', activeClass:'markDroppable', tolerance:'pointer', drop: INTERESTS.add_vote});
    $('div.smallFace').draggable({helper:'original', cursorAt:{left:21, top:21}, start:function(event, ui){drag_remove_me=true;}, stop:INTERESTS.remove_vote, scroll:false});
    $('div.smallFace').disableSelection();
    $('div.smallFace img').disableSelection();

}

INTERESTS.store_topic = function(event) {
    var name=$(this).val().replace('<','').replace('>','');
    var topic=getData($(this).parent('li'));
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
    } else {
        CONTROLLER.addChange(topic);
    }    
    CONTROLLER.sendChanges();
    INTERESTS.draw_topics(false);
    $('#'+topic.uid).parent('li').next().find('input').focus(); // focus to next field 
}


INTERESTS.show = function(dir){
    $('#home_button').fadeIn(300);
    $('div.interests').show('slide',{direction:dir},300);
    $('div.people_picker').width(PUPILS.length*114);
    $('div.left_nav').attr('title',(i18n('Class')+'/'+i18n('Teams')));
    if (MODERATOR) {
        $('div.right_nav').attr('title','Team UP!');
    } else {
        $('div.right_nav').attr('title', (i18n('Class')+'/'+i18n('Teams')));
    }        
    INTERESTS.populate_people_picker();
    $('div.people_picker').show('slide',{direction:'down'},300);
    INTERESTS.init_interest_dragging();
    enable_nav();
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
INTERESTS.prev = function(){
    view.hide();
    view= CLASSROOM
    view.show('left');
}


INTERESTS.init_interest_dragging = function() {
    //$('div.people_picker_face').bind('dragstart', function(event) { event.preventDefault() });
    var face=$('div.people_picker_face');
    face.draggable({helper:function(event) {return INTERESTS.create_small_face_from_draggable(this);}, revert: "invalid", cursorAt:{left:21, top:21}, scroll:false});
    face.disableSelection();
    $('div.people_picker_face img').disableSelection();
    face.click(function(event) {
        if (selected_face) {
            if (selected_face.hasClass('selected') || getData($(this)).votes_available<1) { 
                selected_face.removeClass('selected');
                $('#topics li').removeClass('markSelectable');
                $('#topics li').unbind('click');
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
            $('#topics li').addClass('markSelectable');
            $('#topics li').click(function (event) {
                debug('adding '+getData(selected_face).name+' to '+getData(this).text);
                var person=getData(selected_face);
                var topic=getData(this);
                topic.addVoter(person);
                person.votes_available--;
                selected_face.find('span.votes').html(person.votes_available);
                CONTROLLER.addChange(topic);
                CONTROLLER.addChange(person);
                CONTROLLER.sendChanges();        
                selected_face.removeClass('selected');
                $('#topics li').removeClass('markSelectable');
                $('#topics li').unbind('click');
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
    var topic=getData($(this).parent('li'));
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
        s+='<img src="'+PUPILS[i].img_src+'" width="100" height="100" />';
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

// **********************************
// People page 

LEARNER_VIEW.next= function() {
    if (THIS_PERSON<PUPILS.length-1) { THIS_PERSON++; } else { THIS_PERSON=0; };
    $('div.person').hide('slide', {direction:'left'}, 300);
    LEARNER_VIEW.create_person_page();
    $('div.person').show('slide',{direction:'right'},300);
}   

LEARNER_VIEW.prev= function() {
    if (THIS_PERSON>0) { THIS_PERSON--; } else { THIS_PERSON=PUPILS.length-1; };
    $('div.person').hide('slide', {direction:'right'}, 300);
    LEARNER_VIEW.create_person_page();
    $('div.person').show('slide',{direction:'left'},300);
}   

LEARNER_VIEW.create_new_person= function(event) {
    $('div.person').hide('slide', {direction:'left'}, 300);
    LEARNER_VIEW.create_person(null);
    $('div.person').show('slide',{direction:'right'},300);
}    

LEARNER_VIEW.create_person_page= function() {
    finish_photoshoot();
    var pup=PUPILS[THIS_PERSON];
    $('#namebox').val(pup.name);
    $('img.large_portrait').attr('src', pup.img_src);
    $('img.large_portrait').show();
    LEARNER_VIEW.update_person_properties();
    $('div.left_nav').attr('title',  (THIS_PERSON==0) ? PUPILS[PUPILS.length-1].name : PUPILS[THIS_PERSON-1].name);
    $('div.right_nav').attr('title', (THIS_PERSON== PUPILS.length-1) ? PUPILS[0].name : PUPILS[THIS_PERSON+1].name);
}

LEARNER_VIEW.create_person= function(person){
    var pup, cr;
    if (isType(person, 'Pupil')) {
        for (var i=0; i<PUPILS.length; i++) {
            if (PUPILS[i].uid==person.uid) {
                THIS_PERSON=i;
                break;
            }
        }
    } else {
        if (person == null) person=i18n('New learner');
        if ($.isArray(person)) {
            for (var i=0; i<person.length; i++) {
                pup=new Pupil(person[i],'');
                PUPILS.push(pup);                
                cr=new Friend(pup);
                ALL_FRIENDS.add(cr);
                cr=new Enemy(pup);
                ALL_ENEMIES.add(cr);
                CONTROLLER.addChange(pup)
            }
        } else {
            pup=new Pupil(person,'');
            PUPILS.push(pup);
            cr=new Friend(pup);
            ALL_FRIENDS.add(cr);
            cr=new Enemy(pup);
            ALL_ENEMIES.add(cr);
            CONTROLLER.addChange(pup)
        }
        THIS_PERSON=PUPILS.length-1;
        // All screens, views and lists that show learners have to be updated.        
        CLASSROOM.update_faces();
        CONTROLLER.addArray('PUPILS', PUPILS);
        CONTROLLER.sendChanges();
    }
    debug(PUPILS[THIS_PERSON].uid);
    LEARNER_VIEW.create_person_page();
}

LEARNER_VIEW.update_property_choices= function() {
    var props=ALL_GENDERS.criteria.concat(ALL_LEVELS.criteria, ALL_HOBBIES.criteria, ALL_LANGUAGES.criteria, ALL_FRIENDS.criteria);
    $('div.people_properties').width(props.length*74);
    LEARNER_VIEW.populate_person_properties(props);
    LEARNER_VIEW.init_property_dragging();
}

LEARNER_VIEW.update_person_properties= function(new_prop) {
    var pup=PUPILS[THIS_PERSON];
    // data rows 
    // hobbies
    var prop, div, s;
    if (MODERATOR || OPTIONS.show_icons) {
        div=$('div.hobbies');
        div.html('');
        for (i=0; i<pup.hobbies.length; i++) {
            prop=CATALOG[pup.hobbies[i]];
            s='<div class="property_item" alt="'+i18n(prop.name)+'" title="'+i18n(prop.name)+'" id="'+prop.name+'">';
            if (prop.img_src!=null) {
                s+='<img src="'+prop.img_src+'" width="64" height="64" />';
            } else {
                s+='<label>'+i18n(prop.name)+'</label>'
            }
            div.append(s);
            //debug('update_person_properties calling setData');
    
            setData($('#'+prop.name),prop);
            if (prop==new_prop) {
                $('#'+prop.name).hide().fadeIn('fast');
            }
        }
        // skill level / weather
        div=$('div.level');
        div.html('');
        prop=CATALOG[pup.level];
        if (prop!=null) {
            s='<div class="property_item" alt="'+i18n(prop.name)+'" title="'+i18n(prop.name)+'" id="'+prop.name+'">';
            if (prop.img_src!=null) {
                s+='<img src="'+prop.img_src+'" width="64" height="64" />';
            } else {
                s+='<label>'+i18n(prop.name)+'</label>'
            }
            div.append(s);
            setData($('#'+prop.name),prop); 
            if (prop==new_prop) {
                $('#'+prop.name).hide().fadeIn('fast');
            }

        }
        
        
        // friends & enemies
        div=$('div.friends');
        div.html('');
        for (i=0; i<pup.friends.length; i++) {
            prop=CATALOG[pup.friends[i]];
            s='<div class="property_item" alt="'+prop.name+'" title="'+prop.name+'" id="f_'+prop.uid+'">';
            if (prop.img_src!=null) {
                s+='<img src="'+prop.img_src+'" width="64" height="64" />';
            }
            if (prop.img_src==DEFAULT_IMAGE || OPTIONS.always_show_names) {
                s+='<label class="name_label">'+prop.name+'</label>'
            }
            s+='<img src="icons/friend.png" width="24" height="24" class="frenemy_icon" /></div>'
            div.append(s);
            setData($('#f_'+prop.uid),prop);
            if (prop==new_prop) {
                $('#'+prop.name).hide().fadeIn('fast');
            }

        }
        for (i=0; i<pup.enemies.length; i++) {
            prop=CATALOG[pup.enemies[i]];
            s='<div class="property_item" alt="'+prop.name+'" title="'+prop.name+'" id="e_'+prop.uid+'">';
            if (prop.img_src!=null) {
                s+='<img src="'+prop.img_src+'" width="64" height="64" />';
            }
            if (prop.img_src==DEFAULT_IMAGE || OPTIONS.always_show_names) {
                s+='<label class="name_label">'+prop.name+'</label>'
            }
            s+='<img src="icons/enemy.png" width="24" height="24" class="frenemy_icon" /></div>'
            div.append(s);
            setData($('#e_'+prop.uid),prop);
            if (prop==new_prop) {
                $('#'+prop.name).hide().fadeIn('fast');
            }

        }
    
        // languages
        div=$('div.languages');
        div.html('');
        for (i=0; i<pup.languages.length; i++) {
            prop=CATALOG[pup.languages[i]];
            if (!prop) {
                prop=new Language(pup.languages[i].slice(9));
                CATALOG[pup.languages[i]]=prop;
                ALL_LANGUAGES.insert(prop);
            }
            s='<div class="property_item" alt="'+prop.name+'" title="'+prop.name+'" id="'+prop.name+'">';
            s+='<img src="'+ALL_LANGUAGES.img_src+'" width="64" height="64" /><label class="lang_label">'+prop.lang_code+'</label>';
            div.append(s);
            setData($('#'+prop.name),prop);
            if (prop==new_prop) {
                $('#'+prop.name).hide().fadeIn('fast');
            }

        }
        // gender icon 
        div=$('div.gender');
        div.html('');
        prop=CATALOG[pup.gender];
        if (prop!=null) {
            s='<div class="property_item" alt="'+i18n(prop.name)+'" title="'+i18n(prop.name)+'" id="'+prop.name+'">';
            if (prop.img_src!=null) {
                s+='<img src="'+prop.img_src+'" width="64" height="64" />';
            } else {
                s+='<label>'+i18n(prop.name)+'</label>'
            }
            div.append(s);
            setData($('#'+prop.name),prop); 
            if (prop==new_prop) {
                $('#'+prop.name).hide().fadeIn('fast');
            }

        }
        // make all of them touchable 
        if (MODERATOR) {  
            $('div.property_item').draggable({helper:'original', revert: "valid", start:function(event, ui){drag_remove_me=true;}, stop:LEARNER_VIEW.remove_property, scroll:false}); 
            $('div.property_item').click(LEARNER_VIEW.click_icon);
        }
        $('div.property_item').disableSelection();
        $('div.property_item img').disableSelection();
    } else {
        $('div.hobbies, div.level, div.friends, div.languages, div.gender').html('');        
    }
    // update name and icon if necessary
    if ($('#namebox').val()!=pup.name) {     
        $('#namebox').val(pup.name);
    }
    if ($('img.large_portrait').attr('src')!=pup.img_src) {
        $('img.large_portrait').attr('src', pup.img_src);
    }
    $('img.large_portrait').show();

    // photo booth params
    var flashvars={};
    var fparams={};
    fparams.bgcolor="#000086";
    fparams.allowscriptaccess="sameDomain";
    var fattributes={};
    fattributes.id='PhotoBooth';
    fattributes.name='PhotoBooth';
    swfobject.embedSWF('recorder/PhotoBooth2.swf', 'PhotoBooth', '320', '320', '10.3.0', 'expressInstall.swf', flashvars,fparams,fattributes);

    
}

LEARNER_VIEW.click_icon= function(event) {
    var prop=getData(this);
    var person, other_person;
    if (isType(prop, 'Friend')) {
        person=PUPILS[THIS_PERSON];
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
        person=PUPILS[THIS_PERSON];
        person.removeEnemy(prop)
        other_person=CATALOG[prop.person];
        other_person.removeEnemy(person)
        person.addFriend(other_person)
        other_person.addFriend(person)
        CONTROLLER.addChange(person);
        CONTROLLER.addChange(other_person);
        CONTROLLER.sendChanges();
        LEARNER_VIEW.update_person_properties();
    } else {
        person=PUPILS[THIS_PERSON];
        person.removeProperty(prop);
        CONTROLLER.addChange(person);
        CONTROLLER.sendChanges();
        $(this).fadeOut('fast');
    }
}

LEARNER_VIEW.get_all_props= function() {
    return ALL_GENDERS.criteria.concat(ALL_HOBBIES.criteria, ALL_LANGUAGES.criteria, ALL_FRIENDS.criteria, ALL_ENEMIES.criteria, ALL_LEVELS.criteria);
}


LEARNER_VIEW.jump_to_person= function(event) {
    event.stopImmediatePropagation();
    var prop=getData(this);
    if (isType(prop, 'Friend') || isType(prop, 'Enemy')) {
        var person_uid=prop.person;
        var THIS_PERSON;
        debug(person_uid);
        for (i=0; i<PUPILS.length; i++) {            
            if (person_uid==PUPILS[i].uid) {
                THIS_PERSON=i;
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
        var person=PUPILS[THIS_PERSON];
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
    $('div.property_picker_item').dblclick(LEARNER_VIEW.jump_to_person);
    $('div.person').droppable({greedy:true, activeClass:'markDroppable', tolerance:'pointer', drop: LEARNER_VIEW.add_property});
    $('div.add_language_button').click(LEARNER_VIEW.open_language_panel);
}

LEARNER_VIEW.open_language_panel= function(event) {
    var lp=$('#language-panel');
    var s='';
    var lang;
    for (var key in LANGUAGE_CODES) {
        lang=LANGUAGE_CODES[key];
        s+='<div class="language_item" alt="'+lang+'" title="'+lang+'" id="lang_'+key+'"><img src="'+ALL_LANGUAGES.img_src+'" width="64" height="64" /><label class="lang_label">'+key+'</label></div>';  //charAt(0).toUpperCase()+key.slice(1,3)
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
    ALL_LANGUAGES.insert(new Language(lang_code));
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
    var person=PUPILS[THIS_PERSON];
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

LEARNER_VIEW.remove_property= function(event, ui) {
    if (!drag_remove_me) {
        debug("don't remove"); 
        return;
    }
    debug("removing person property")
    var prop=getData(ui.helper);
    var person=PUPILS[THIS_PERSON];
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
        s='<div class="'+class_name+'" alt="'+i18n(prop.name)+'" title="'+i18n(prop.name)+'" id="prop'+i+'">';
        if (prop.img_src!=null) {
            s+='<img src="'+prop.img_src+'" width="64" height="64" />';
        } else {
            if (isType(prop, 'Language')) {
                s+='<img src="'+ALL_LANGUAGES.img_src+'" width="64" height="64" />';
                s+='<label class="lang_label">'+prop.lang_code+'</label>';
            } else {
                s+='<img src="icons/lang_plus.png" width="64" height="64" />'
                s+='<div class="language_panel"></div>';
            }
        }
        if ((isType(prop, 'Friend') || isType(prop, 'Enemy')) && (OPTIONS.always_show_names || prop.img_src==DEFAULT_IMAGE)) {
            s+='<label class="name_label">'+prop.name+'</label>';
        }

        s+='</div>';
        place.append(s);
        obj=place.find('div').last();
        //debug('populate_person_properties calling setData');
        setData(obj, prop);
    }

}

LEARNER_VIEW.delete_learner= function() {
    if (PUPILS.length<2) return;
    var learner=PUPILS[THIS_PERSON];
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
    PUPILS.splice(THIS_PERSON, 1);
    CONTROLLER.addArray('PUPILS', PUPILS);
    CONTROLLER.sendChanges();
    CLASSROOM.update_faces();

    $('div.person').hide('slide', {direction:'down'}, 300);
    LEARNER_VIEW.create_person_page();
    $('div.person').show('slide',{direction:'right'},300);

}


// **********************************
// Criterion page

CRITERIA.show= function(dir){
    var crits=CRITERIA.available_criteria();
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
    $('div.left_nav').attr('title',i18n('Vote for topics'));
    $('div.right_nav').attr('title', (i18n('Class')+'/'+i18n('Teams')));

    $('#home_button').fadeIn(300);
    $('div.criteria').show('slide',{direction:dir},300);
    $('div.criteria_picker').show('slide',{direction:'down'},300);
    enable_nav();
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
    view.hide();
    view= CLASSROOM
    view.show('right');
}
CRITERIA.prev = function(){
    view.hide();
    view= INTERESTS
    view.show('left');
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
    CRITERIA.create_crit_icons()
}

CRITERIA.create_crit_icons = function() {
    var place, obj, jq_obj;
    for (var i=0;i<UNIFYING_CRITERIA.length;i++) {
        place=$('#crit_place_'+(i+1));
        obj=UNIFYING_CRITERIA[i];
        place.html(''+(i+1)+'<div class="criteria_item" alt="'+obj.name+'" title="'+obj.name+'" id="crit_group_'+obj.name+'"><img src="'+obj.img_src+'" width="64" height="64" /></div>');
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
    if (levels) crit_list.push(ALL_LEVELS);
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
            s+='<img src="'+critgroup.img_src+'" width="64" height="64" />';
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
        $('#reset-confirm-panel').dialog("option", "buttons", { "Reset": function() { $(this).dialog("close");team_up();}, "Cancel": function() {$(this).dialog("close");} } );
        $('#reset-confirm-panel').find('b').html(team_names);
        $('#reset-confirm-panel').dialog('open');
        $('div.ui-dialog-buttonpane').find('button:last').focus();
        return;
    } else {
        team_up()
    }
}

function team_up() {
    
    function person_voted_for_topic(person, topic) {
        var n=0;
        for (var f=0;f<topic.voters.length;f++) {
            if (person.uid==topic.voters[f]) n++;
        }
        return n;
    }


    //unifying_criteria=[ALL_GENDERS, ALL_HOBBIES]; // replace this with actual choices
    splitting_criteria=[ALL_GENDERS, ALL_HOBBIES, ALL_LANGUAGES, ALL_VOTES, ALL_FRIENDS, ALL_ENEMIES, ALL_LEVELS];
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
    TEAMS=best_teaming;
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
   
