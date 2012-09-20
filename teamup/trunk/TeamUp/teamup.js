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

// **********************************

var LANGUAGE_CODES={aa: 'Afar',ab: 'Abkhazian',af: 'Afrikaans',am: 'Amharic',ar: 'Arabic',as: 'Assamese',ay: 'Aymara',az: 'Azerbaijani',ba: 'Bashkir',be: 'Byelorussian (Belarussian)',bg: 'Bulgarian',bh: 'Bihari',bi: 'Bislama',bn: 'Bengali',bo: 'Tibetan',br: 'Breton',ca: 'Catalan',co: 'Corsican',cs: 'Czech',cy: 'Welsh',da: 'Danish',de: 'German',dz: 'Bhutani',el: 'Greek',en: 'English',eo: 'Esperanto',es: 'Spanish',et: 'Estonian',eu: 'Basque',fa: 'Persian',fi: 'Finnish',fj: 'Fiji',fo: 'Faroese',fr: 'French',fy: 'Frisian',ga: 'Irish (Irish Gaelic)',gd: 'Scots Gaelic (Scottish Gaelic)',gl: 'Galician',gn: 'Guarani',gu: 'Gujarati',gv: 'Manx Gaelic',ha: 'Hausa',he: 'Hebrew',hi: 'Hindi',hr: 'Croatian',hu: 'Hungarian',hy: 'Armenian',ia: 'Interlingua',id: 'Indonesian',ie: 'Interlingue',ik: 'Inupiak',is: 'Icelandic',it: 'Italian',iu: 'Inuktitut',ja: 'Japanese',jw: 'Javanese',ka: 'Georgian',kk: 'Kazakh',kl: 'Greenlandic',km: 'Cambodian',kn: 'Kannada',ko: 'Korean',ks: 'Kashmiri',ku: 'Kurdish',kw: 'Cornish',ky: 'Kirghiz',la: 'Latin',lb: 'Luxemburgish',ln: 'Lingala',lo: 'Laotian',lt: 'Lithuanian',lv: 'Latvian Lettish',mg: 'Malagasy',mi: 'Maori',mk: 'Macedonian',ml: 'Malayalam',mn: 'Mongolian',mo: 'Moldavian',mr: 'Marathi',ms: 'Malay',mt: 'Maltese',my: 'Burmese',na: 'Nauru',ne: 'Nepali',nl: 'Dutch',no: 'Norwegian',oc: 'Occitan',om: 'Oromo',or: 'Oriya',pa: 'Punjabi',pl: 'Polish',ps: 'Pashto',pt: 'Portuguese','pt-br': 'Brazilian Portuguese',qu: 'Quechua',rm: 'Rhaeto-Romance',rn: 'Kirundi',ro: 'Romanian',ru: 'Russian',rw: 'Kiyarwanda',sa: 'Sanskrit',sd: 'Sindhi',se: 'Northern Sami',sg: 'Sangho',sh: 'Serbo-Croatian',si: 'Singhalese',sk: 'Slovak',sl: 'Slovenian',sm: 'Samoan',sn: 'Shona',so: 'Somali',sq: 'Albanian',sr: 'Serbian',ss: 'Siswati',st: 'Sesotho',su: 'Sudanese',sv: 'Swedish',sw: 'Swahili',ta: 'Tamil',te: 'Telugu',tg: 'Tajik',th: 'Thai',ti: 'Tigrinya',tk: 'Turkmen',tl: 'Tagalog',tn: 'Setswana',to: 'Tonga',tr: 'Turkish',ts: 'Tsonga',tt: 'Tatar',tw: 'Twi',ug: 'Uigur',uk: 'Ukrainian',ur: 'Urdu',uz: 'Uzbek',vi: 'Vietnamese',vo: 'Volapuk',wo: 'Wolof',xh: 'Xhosa',yi: 'Yiddish',yo: 'Yorouba',za: 'Zhuang',zh: 'Chinese',zu: 'Zulu'};


var CLASSROOM=new View(0);
var INTERESTS=new View(1);
var CRITERIA=new View(2);
var LEARNER_VIEW=new View(3);
var OPTIONS=new View(4);
var TEAM_NOTES=new View(5);

var view = CLASSROOM;

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
ALL_HOBBIES.img_src='icons/together-skills.png';
ALL_HOBBIES.set([new Criterion('Bee','icons/bee.png'), new Criterion('Book','icons/book.png'),new Criterion('Craft','icons/paper.png'), new Criterion('Digital','icons/computer.png'), new Criterion('Fire','icons/fire.png'),new Criterion('Sleepy','icons/home.png'), new Criterion('Spice','icons/chilly.png'), new Criterion('Sport','icons/balls.png'), new Criterion('Hammer', 'icons/hammer.png'), new Criterion('Loud','icons/sound.png'), new Criterion('Silent','icons/sound-low.png'), new Criterion('Sun','icons/sun.png') ]);

ALL_FRIENDS=new CriterionGroup('Friends');
ALL_FRIENDS.img_src='icons/friend.png';

ALL_ENEMIES=new CriterionGroup('Enemies');
ALL_ENEMIES.img_src='icons/enemy.png';

//ALL_LEVELS=new CriterionGroup('Levels');
//ALL_LEVELS.set([new Criterion('Sunny', 'icons/sun.png'), new Criterion('Half-cloudy', 'icons/halfcloud.png'), new Criterion('Cloudy', 'icons/cloud.png')]);
//ALL_LEVELS.img_src='icons/sun.png'

ALL_LANGUAGES=new CriterionGroup('Languages');
ALL_LANGUAGES.set([new Language('en'), new AddLanguageButton()]);
ALL_LANGUAGES.img_src='icons/together-language.png';

ALL_GENDERS=new CriterionGroup('Gender');
ALL_GENDERS.img_src='icons/together-gender.png';
ALL_GENDERS.set([new Criterion('Girl','icons/female.png'), new Criterion('Boy','icons/male.png'),new Criterion('No gender','icons/neutral.png')]);
ALL_VOTES=new CriterionGroup('Votes');
ALL_VOTES.img_src='icons/together-vote.png';


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
    demo_note.audio_url='demo/demo_note.mp3';
    demo_note.photos=['demo/demo_note.jpg'];

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

    $('#welcome-panel').dialog({ width:720, position:[80,10], modal:true, autoOpen: false, close:function(event,ui){
        if( PUPILS.length==0) LEARNER_VIEW.create_person(null);
        }});
    $('#teacher-panel').dialog({height:480, width:480, modal:true, autoOpen: false, closeOnEscape: true, buttons: { "OK": function() { $(this).dialog("close"); }}});
    $('#delete-confirm-panel').dialog({height:480, width:480, modal:true, autoOpen: false, closeOnEscape: true, buttons: { "Delete": function() {$(this).dialog("close");LEARNER_VIEW.delete_learner();}, "Cancel": function() {$(this).dialog("close");}}});
    $('#reset-confirm-panel').dialog({height:480, width:480, modal:true, autoOpen: false, closeOnEscape: true, buttons: { "Reset": function() {$(this).dialog("close");CLASSROOM.reset_teams(true);}, "Cancel": function() {$(this).dialog("close");}}});
    $('#delete-note-confirm-panel').dialog({height:480, width:480, modal:true, autoOpen: false, closeOnEscape: true, buttons: { "Delete": function() {$(this).dialog("close");TEAM_NOTES.remove_note(event, true);}, "Cancel": function() {$(this).dialog("close");}}});

    //$('#welcome-panel-inner').accordion({header:'h3', autoHeight:false});
    $('#debug').toggle(function () {$(this).css('height','20px')}, function () {$(this).css('height','400px')});
    $('div.main_area').css({height:$(window).height()-62});
    $('body').css({height:$(window).height()});


    if (URL_VARS.debug_mode) {
        DEBUG_MODE=true;
    }


    // General navigation    
    $('div.left_nav').click(go_left).keyup(function(e){if(e.keyCode==13) $(this).click()});
    $('div.left_nav').disableSelection();

    $('div.right_nav').click(go_right).keyup(function(e){if(e.keyCode==13) $(this).click()});
    $('div.right_nav').disableSelection();
    $('div.right_nav img').disableSelection();
    $('div.left_menu_nav').click(go_left_slider);
    $('div.right_menu_nav').click(go_right_slider);
    $('#leave_iframe').click(function () {window.open(self.location, 'TeamUp')});
    $('#prefs_button').click(CLASSROOM.go_options).keyup(function(e){if(e.keyCode==13) $(this).click()});

    
    // Classroom functionalities
    
    $('#grid_button').click(CLASSROOM.select_class_view).keyup(function(e){if(e.keyCode==13) $(this).click()});
    $('#teams_button').click(CLASSROOM.select_team_view).keyup(function(e){if(e.keyCode==13) $(this).click()});    
    
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
    }

    
    CLASSROOM.populate_class();
    CLASSROOM.build_class_view(false);    
    $(window).resize(function(event) {
        //CLASSROOM.resize_display();
        WINDOW_HEIGHT=$(window).height();
        $('div.main_area').css('height', WINDOW_HEIGHT - TOP_HEIGHT);
        $('div.nav').css('top', WINDOW_HEIGHT/2-24)

        if (view==CLASSROOM) { 
            if (TEAM_VIEW){
                CLASSROOM.build_team_view(false);
            } else {
                CLASSROOM.build_class_view(false);
            }
        } else if (view==LEARNER_VIEW) {
            $('div.person table').css('top', (WINDOW_HEIGHT-TOP_HEIGHT-BOTTOM_HEIGHT-$('div.person table').height())/2);
        } 
    });


    // Team notes

    $('#note_player').jPlayer( { swfPath: "", supplied:"mp3", cssSelectorAncestor: "#player_interface", preload:'auto', 
        ready:TEAM_NOTES.prepare_audio,        
        timeupdate: TEAM_NOTES.show_play_progress,
        play: TEAM_NOTES.play,
        loadeddata: TEAM_NOTES.set_up_timeline 
    });

    $('#recorder_toggle').click(RECORDER.prepare_recorder);
    $('#recorder_cam_button').click(RECORDER.takePhoto);
    $('#recorder_pause_button').click(RECORDER.pause);

        
    $('#new_teams').click(CLASSROOM.go_vote).keyup(function(e){if(e.keyCode==13) $(this).click()});    

    // Interests and voting functionalities
    // more themes get added dynamically, so this needs to be done repeatedly.
    INTERESTS.draw_topics(false);
    $('#interests_next').click(INTERESTS.next).keyup(function(e){if(e.keyCode==13) $(this).click()});
    
    // Setting criteria and teaming up! 
    //$("#team_up_button").click(CRITERIA.confirm_before_teaming).keyup(function(e){if(e.keyCode==13) $(this).click()});
    $(".criteria div.placeholder").droppable({greedy:true, activeClass:'markDroppable2', hoverClass:'drophover2', tolerance:'pointer', drop: CRITERIA.add_unifying_crit});
    $("td.criteria_background").droppable({accept:'div.criteria_item', drop:CRITERIA.remove_unifying_crit});
    $('#criteria_next').click(CRITERIA.next).keyup(function(e){if(e.keyCode==13) $(this).click()});
    $('#refresh_preview').click(function() { CRITERIA.team_up();CRITERIA.update_preview() }).keyup(function(e){if(e.keyCode==13) $(this).click()});

    // People functionalities
    
    $('#remove_person').click(function () {$('#delete-confirm-panel').find('b').text(PUPILS[THIS_PERSON].name);$('#delete-confirm-panel').dialog('open');$('div.ui-dialog-buttonpane').find('button:last').focus();}).keyup(function(e){if(e.keyCode==13) $(this).click()});
    $('#add_person').click(LEARNER_VIEW.create_new_person).keyup(function(e){if(e.keyCode==13) $(this).click()});
    $('#new_person').click(LEARNER_VIEW.create_new_person).keyup(function(e){if(e.keyCode==13) $(this).click()});

    $("#namebox").change(function(event) {
        PUPILS[THIS_PERSON].name=$(this).val().replace('<','').replace('>','');
        CONTROLLER.addChange(PUPILS[THIS_PERSON]);
        CONTROLLER.sendChanges();
        CLASSROOM.update_faces();
        $(this).blur();
    }),
    $("#camera_button").click(function(event) {
        if (CAMERA.on) {
            debug('camera is on, take a photo');
            if (!$(this).hasClass('disabled')) {
                CAMERA.take_photo();
            }
        } else {
            debug('turn on camera');
            CAMERA.prepare_photoshoot();
        }                    
    });
    $("#keep_photo").click(CAMERA.keep_photo),
    $("#try_again_photo").click(CAMERA.redo_photoshoot),
    $("#cancel_photo").click(CAMERA.finish_photoshoot),
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
    var s="";
    var check;
    for (key in LANGUAGES) {
        s+='<option value="'+key+'">'+LANGUAGES[key]+'</option>';
    }
    $('#language_select').html(s);
    $('#language_select').val(OPTIONS.language);
    $('#language_select').change(function(event) {
        OPTIONS.language=$(this).val();
        URL_VARS['locale']=OPTIONS.language;
        if (window.location.href.indexOf('?')==-1) {
            window.location=window.location.href+'?'+$.param(URL_VARS);
        } else {            
            window.location=window.location.href.slice(0,window.location.href.indexOf('?')+1)+$.param(URL_VARS);
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


window.onbeforeunload = function(e){ return "Note: Please don't use refresh or previous page buttons to navigate in TeamUp"; };

// **********************************
// Options view

OPTIONS.hide = function() {
    $('div.options').hide();     
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


