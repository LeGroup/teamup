
var DEMO=true;
var DEBUG_MODE=false;
var MODERATOR=true;
var SMART_ENABLED=false;

//var SERVER_URL='http://teamup.aalto.fi/';
var SERVER_URL='http://teamup.aalto.fi/'; // localhost:8081 for node.js
//var SERVER_URL='http://127.0.0.1/servTeamup/'; 


var LANGUAGES= {'fi-FI':'Suomi', 'en-EN':'English', 'de-AT':'Deutsch', 'es-ES':'Spanish', 'et-ET':'Estonian', 'fr-FR':'Francais', 'he-HE':'Hebrew', 'hu-HU':'Hungarian', 'it-IT':'Italian','lt-LT':'Lithuanian', 'nl-NL':'Dutch', 'no-NO':'Norwegian', 'pt-PT':'Portuguese','sk-SK':'Slovak', 'tr-TR':'Turkish'};

// Some defaults, more defaults at OPTIONS 
var VOTES_PER_PERSON = 3;
var DEFAULT_IMAGE = 'images/defaultUser.png';

var PARAMS = null; // class creation parameters sent by server, shouldn't change once initialized
var URL_VARS= getUrlVars();
var PRIVATE_STATE = {}; // Moodle launch will set private state values, which should only be read once.
var TEAM_VIEW = false; // classroom is showing teams (round tables) or class (grid)
var THIS_PERSON = 0;
var drag_remove_me = true;
var UNIFYING_CRITERIA=[];
var selected_face=null;
var my_changes={}; // if changes pile up, do not overwrite last changes


TOP_HEIGHT=62;
BOTTOM_HEIGHT=0; // or 96
WINDOW_HEIGHT=$(window).height();


var CLASS_KEY = '';

var CATALOG = {}; // references for all objects so that Objects can be safely flattened for JSON travel and restored to one place

var image = null;
var ctx = null;
var pos = 0;
var timer = null;
var localizedStrings = null;
var demo_note = null;
TEAMS_PREVIEW=[];


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

