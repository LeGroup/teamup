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
    if (localizedStrings == null) return str;
    var locstr = localizedStrings[str];
    if (locstr == null || locstr == "") locstr = str;
    return locstr;
}

function create_colors(n) {
    var step=1.0/n;
    var s=.67;
    var v=.79;
    var ar=[];
    var h=0;
    for (var i=0;i<n;i++) {
        h+=step;
        ar.push(hsvToRgb(h,s,v));
    }
    //for(var j, x, i = ar.length; i; j = parseInt(Math.random() * i), x = ar[--i], ar[i] = ar[j], ar[j] = x);
    var l=ar.length;
    var j;
    var rr=[];
    for (var a=0;a<l;a++) {
        debug(ar[a]);
    }

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
            'i18n_interests_heading','i18n_grouping_heading',
            'i18n-play','i18n-pause','i18n-stop','i18n-mute','i18n-unmute',
            'i18n-what-we-did','i18n-what-we-will-do','i18n-any-problems',
            'i18n_new_teams','options', 'i18n_options', 'label_reset_teams',
            'i18n-reset-confirmation', 'i18n-del-confirmation', 'i18n-download_confirm', 'i18n-download-no', 'i18n-download-complete','i18n-cancel','i18n-bad-photo', 'recording_help_1', 'recording_help_2','recording_help_3','recording_help_4','recording_help_5', 
            'label_language', 'label_teacher_url', 'label_learner_url', 'i18n-upload-message','i18n-del-note-confirmation'];
            for (var i=0;i<text_ids.length;i++) {
                place=$('#'+text_ids[i]);
                place.html(i18n(place.html()));
            }
            // Values
            //'topic_0','topic_1','topic_2','topic_3'
            
            // alt/title:  'add_person'
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
            $('#upload-panel').attr('title',i18n($('#upload-panel').attr('title')));
            $('div.left_nav').attr('title',i18n($('div.left_nav').attr('title')));
            $('div.right_nav').attr('title',i18n($('div.right_nav').attr('title')));
            $('#camera_button').attr('title',i18n($('#camera_button').attr('title')));
            $('input.topic').each(function () {
            if ($(this).val()=='Enter topic') { 
                $(this).val(i18n('Enter topic'));
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



navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.getUserMedia;

