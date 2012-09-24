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

function restore_json_object(json_obj) {
    return restore_packed_object($.parseJSON(json_obj))
}
// turn general Object into specific class instance (Team, Pupil or Topic)
function restore_packed_object(obj) {
    var new_obj;
    var old_obj=CATALOG[obj.uid];
    if (old_obj) {
        for (var key in obj) {
            old_obj[key] = obj[key];
        }                
        CATALOG[old_obj.uid]=old_obj;
        return old_obj;
    } else {    
        if (obj.type=='Team') {
            new_obj= new Team(true);
        } else if (obj.type=='Pupil') {
            new_obj= new Pupil('','',true);
            cr=new Friend(new_obj);
            ALL_FRIENDS.add(cr);
            cr=new Enemy(new_obj);
            ALL_ENEMIES.add(cr);
        } else if (obj.type=='Topic') {
            new_obj= new Topic('',true);
        } else if (obj.type=='TeamNote') {
            new_obj= new TeamNote(true);
        } else {
            debug('parsing strange obj:'+obj);
            return obj;
        }
    
        for (var key in obj) {
            new_obj[key] = obj[key];
        }
        CATALOG[new_obj.uid]=new_obj;
        return new_obj;
    }
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
    if (ui_obj.length>1) {
        debug('**** getData called with multiple ui objects:'+$(ui_obj));
    }
    var key=$(ui_obj).data('teamup_data');
    if (!key) {
        debug('**** GET DATA FOUND NO KEY: #'+ui_obj.id);
    }
    var obj= CATALOG[key];
    if (obj==undefined) {
        debug('**** GET DATA FOUND NOTHING (==UNDEFINED): #'+ui_obj.id);
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

function isVisible(jqobj) {
    if (jqobj.css('display')!='none') return true;
    return false;
}


function i18n(str){
    if (!localizedStrings || !str) return str;
    var locstr = localizedStrings[str];
    if (locstr == null || locstr == "") {
        debug('missing: '+str);
        locstr = str;
    }
    return locstr;
}

function create_colors(n) {
    // using hsv-colors to have a visually pleasing and balanced set of colors
    var step=1.0/n;
    var s=.67;
    var v=.79;
    var ar=[];
    var h=0;
    for (var i=0;i<n;i++) {
        h+=step;
        ar.push(hsvToRgb(h,s,v));
    }
    var l=ar.length;
    var j;
    var rr=[];
    for (var a=0;a<l;a++) {
        j=parseInt(Math.random()*ar.length);
        rr.push(ar.splice(j,1));
    }
    return rr;    
}


function hsvToRgb(h, s, v){
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return "#" + ((1 << 24) + (Math.ceil(r*255) << 16) + (Math.ceil(g*255) << 8) + Math.ceil(b*255)).toString(16).slice(1);
}


function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    //return [r * 255, g * 255, b * 255];
    return "#" + ((1 << 24) + (Math.ceil(r*255) << 16) + (Math.ceil(g*255) << 8) + Math.ceil(b*255)).toString(16).slice(1);
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
    return URL_VARS.locale || CONTROLLER.getLocale() || navigator.language || navigator.userLanguage;
}

function localize(){
    // The idea is that some html-entities are marked for translation (class 'i18n'). The content text of these html-entities (= english text) is used as a key in translation dict (localizedStrings) and it is checked for possible translation available and replaced if available. 
    // This is enough for us, but would not scale for larger program. (Homonyms in english would translate identically for differing purposes.)

    // Ensure language code is in the format aa-AA:
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
            var place;
            localizedStrings=$.parseJSON(data.responseText);
            debug(''+Object.keys(localizedStrings).length+' translation keys available');
            $('.i18n').each(function (i) {
                $(this).html(i18n($(this).html()));
            })

            $('.i18n_title').each(function (i) {
                $(this).attr('title', i18n($(this).attr('title')));
            })
            $('input.topic').each(function () {
            if ($(this).val()=='Enter topic') { 
                $(this).val(i18n('Enter topic'));
            }
            });
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



navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.getUserMedia;


