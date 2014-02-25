/** 
    TeamUp -- a teacher's tool for forming learner teams
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

var LOOKING = '#ff8';
var SETTING_PARAMS = '#af0';
var GOING_TO_CLASSROOM = '#77f';
var TRY_ANOTHER = '#f90';
var RESERVED = '#f00';
var WIDGET_ID = "http://wookie.apache.org/widgets/teamup"; 

var params = {};
var searching=false;
var localizedStrings;
var prev_width=0;

var LANGUAGES = {'de-AT':'deutsch','et-ET':'eesti','en-EN':'english', 'es-ES':'español', 'fr-FR':'français', 'he-HE':'עִבְרִית', 'hu-HU':'magyar', 'it-IT':'italiano','lt-LT':'lietuvių', 'nl-NL':'nederlands', 'no-NO':'norsk', 'pt-PT':'português','sk-SK':'slovenčina', 'fi-FI':'suomi','tr-TR':'türkçe'};


function set_join_progress(color) {
    $('#join_progress').css('color', color).show(); 
}

function set_creation_progress(color) {
    $('#create_progress').css('color', color).show(); 
}

function hide_progress() {
    $('#join_progress').hide();
    $('#create_progress').hide();
}

function validate_class_name(name) {
    name = $.trim(name.replace(/[\\%\+*<>\n\t\r]/g, ''));
    return name;
}

function get_validated_names_list() {
    nl = $.trim($('#names_list').val());
    nl = nl.replace(/[\+#\\%<>]/g, ''); // remove bad chars
    nl = nl.replace(/[,:;]\s+/g, ', ');  // linebreak/tab after separator is removed
    nl = nl.replace(/[;:\n\t\r]/g, ','); // if there are linebreaks/tabs left, they are separators
    nl = nl.replace(/\s/g, ' '); // all of the rest whitespaces are replaced with simple spaces
    nl = (nl.search(',') == -1) ? nl.replace(/\s/g, ', ') : nl;
    return nl;
}

function go_to_instance(url) {
    if (data.locale.length<10) url+='&locale='+data.locale;
    window.location = url;
}

function room_name_reserved(data, textStatus, jqXHR) {
    hide_progress();
    $('#classroom_already_exists').parent('div.form-group').addClass('has-error');
    $('#classroom_already_exists').show();
    searching=false;
}

function is_email(email) {
  var regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return regex.test(email);
}

function debug(text) {
    $('#debugger').html($('#debugger').html()+text+'<br/>');
}

function no_class(data, textStatus, jqXHR) {
    hide_progress();
    $('#classroom_not_available').parent('div.form-group').addClass('has-error');
    $('#classroom_not_available').show()
}

function build_learner_url(data) {
    var base = window.location.href.slice(0, (window.location.href.lastIndexOf('/') + 1));
    if (data.class_key) {
        base += '?class_key=' + encodeURIComponent(data.class_key);
    } else {
        return base;
    }
    if (data.locale != 'en-EN') {
        base += '&lang=' + encodeURIComponent(data.locale);
    }
    return base;
}

function build_teacher_url(data) {
    base = build_learner_url(data);
    return base + '&teacher=' + encodeURIComponent(data.userid);
}

function get_url_parameters() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

// not used anymore, as we try to be able to work without flash
/*
function check_flash_version(){
    var playerVersion = swfobject.getFlashPlayerVersion();
    if ((playerVersion.major>=10 && playerVersion.minor>=3) || (playerVersion.major>10)) {
    } else {
        var output = "You need to update your Flash player to record newsflashes in TeamUp."+"<br/>"+        
        "Required Flash player 10.3 or more, you have: " +
        playerVersion.major + "." + playerVersion.minor + "." +
        playerVersion.release;
        $('#flash_version').html(output);
    }
}
*/
function i18n(str){
    if (localizedStrings == null) return str;
    var locstr = localizedStrings[str];
    if (locstr == null || locstr == "") locstr = str;
    return locstr;
}

function localize(){
    /* Ensure language code is in the format aa-AA. */
    if (!params.lang || params.lang=='en-EN') return;

    $('#locale').val(decodeURIComponent(params.lang));

    jQuery.ajax("i18n/localized_"+params.lang+".js", {
        dataType: "json",
        isLocal: true,     
        error: function(jqXHR, textStatus, errorThrown){
            debug('i18n failed:jqXHR='+jqXHR+' textStatus:'+textStatus+' errorThrown:'+errorThrown);
            return jqXHR;

        },
        complete: function(data) {
            // Change all of the static strings in index.html
            localizedStrings=$.parseJSON(data.responseText);
            $('.i18n').each( function () {
                item=$(this);
                //debug('fixing '+item.text())
                if (!localizedStrings[item.text()]) {
                    //debug('missing text: "'+item.html()+'"');
                } else {
                //    debug('found: '+item.text());
            }
            $(this).text(i18n($(this).text()));
        });

            $('.i18n-value').each( function () {
                item=$(this);
                //debug('fixing value:' + item.val());
                if (!localizedStrings[item.val()]) {
                    //debug('missing value: "'+item.val()+'"');
                } else {
                //    debug('found: '+item.val());
            }
            $(this).val(i18n($(this).val()));
        });

            $('.i18nplaceholder').each ( function () {
                item=$(this);
                placeholder = item.attr('placeholder');
                //debug('fixing placeholder:' + placeholder);
                if (!localizedStrings[placeholder]) {
                    //debug('missing placeholder: "'+placeholder+'"');
                } else {
                //    debug('found: '+item.val());
            }
            $(this).attr('placeholder', i18n(placeholder));
        });
        }
    });    
}

function getCookie(c_name) {
    var i,x,y,ARRcookies=document.cookie.split(";");
    for (i=0;i<ARRcookies.length;i++) {
      x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
      y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
      x=x.replace(/^\s+|\s+$/g,"");
      if (x==c_name) {
        return unescape(y);
    }
}
}

function set_language_column(params) {
    s='';
    for (key in LANGUAGES) {
        if (params.lang==key || (key=='en-EN' && !params.lang)) {
            s+='<span class="selected" id="lang_'+key+'">'+LANGUAGES[key]+'</span> | ';
        } else {
            s+='<a href="?lang='+key+'" class="lang" id="lang_'+key+'">'+LANGUAGES[key]+'</a> | ';
        }
    }
    $('#language_column').html(s);
}

function try_to_jump_to_class(params) {
    // fill join_form with given url parameters:
    $('#class_key').val(validate_class_name(decodeURIComponent(params.class_key)));
    $('#join_classroom').attr('disabled', ($('#class_key').val() == '')); 
    if (params.teacher) {
        $('#userid').val(decodeURIComponent(params.teacher));
    } else {
        $('#userid').val(new Date().getTime());
    }
    join_classroom()
}

function join_classroom() {
    data=build_data_object('#class_key');
    data.task='get_instance';
    set_join_progress(LOOKING); 

    // first try node server's 'join_classroom' 
    $.get('../check_classroom', data, function(classroom_url) {
        if (classroom_url=='not found') {
            // then try wookie servers
            found = false;
            Wookie.configureConnection("http://localhost:8082/wookie", "TEST", data.class_key.toLowerCase());
            instance = Wookie.getInstance(WIDGET_ID);
            console.log(instance);
            if (!$.isEmptyObject(instance)) {
                property = Wookie.getProperty(instance.id_key, "PARAMS", true);
                if (!$.isEmptyObject(property)) {
                    found = true;
                }
            }
            if (found) {
                fixed_url = instance.url.replace('localhost:80', 'wookie.eun.org');
                //go_to_instance(fixed_url);
            } else {
                Wookie.configureConnection("WOOKIE_OLD", "4qvOFWsUITPrFcCUgvzJlHDxlWE.eq. ", data.class_key);
                property = Wookie.getProperty(WIDGET_ID, "PARAMS");
                if (!$.isEmptyObject(property)) {
                    instance = Wookie.getOrCreateInstance(WIDGET_ID);
                    console.log("Found: " + instance.url);
                    //go_to_instance(instance.url);
                } else {
                    no_class();
                }
            }
        } else {
            go_to_instance(classroom_url);
        }
    }, 'text'); 
}

function validate_create_form() {
    var ok = true;
    if (!is_email($('#email').val())) {
        $('#email_help').show();
        $('#email').parent('div.form-group').addClass('has-error');
        ok = false;
    } else {
        $('#email_help').hide();
        $('#email').parent('div.form-group').removeClass('has-error');
    }
    if ($('#new_classroom_key').val().length < 3 || $('#new_classroom_key').val().length > 50) {
        $('#bad_classroom_name').parent('div.form-group').addClass('has-error');
        $('#bad_classroom_name').show();
        ok = false;
    } else {            
        $('#bad_classroom_name').parent('div.form-group').removeClass('has-error');
        $('#bad_classroom_name').hide();
    }
    return ok;
}

function create_classroom() {
    if (searching) return;
    if (!validate_create_form()) return;

    // first check if this class exists in any of the servers 
    set_creation_progress(LOOKING);
    searching = true;
    data = build_data_object('#new_classroom_key');
	console.log(data);
    $.get('../check_classroom', data, function(classroom_url) {
        if (classroom_url=='not found') {
            // then check if wookie servers have such class
			/*
            $.get('new_bridge.php', data, function(instance_url) {
			if (instance_url == 'reserved') {
				room_name_reserved();
                } else {
			*/
                    // ok, then we can create this class to node server:
                    set_creation_progress(SETTING_PARAMS);
                    data.msg_subject = i18n('Your TeamUp classroom');
                    data.teacher_link = build_teacher_url(data);
                    data.student_link = build_learner_url(data);
                    data.email = $.trim($('#email').val().replace(/\s/g, ''));
                    data.names = get_validated_names_list();
                    data.msg_body=i18n('Welcome to TeamUp!')+'\n'+i18n('You can use the following address to return this classroom as a teacher:')+'\n'+data.teacher_link+' \n\n'+i18n('You can give this address as a link for learners to enter this classroom:')+'\n'+data.student_link+'\n\n -- TeamUp service';        
                    $.get('../create_classroom', data, function(room_url) {
                        if (room_url == 'already exists') {
                            room_name_reserved();
                        } else if (room_url == 'error') {
                            debug('error');
                        } else {
                            go_to_instance(room_url);
                        }
                    }, 'text');                     
				//}, 'text');             
			}
        /*}*/ else {
            room_name_reserved();
        }
    });
	return false;
}


function build_data_object(key) {
    data = {};
    data.class_key = validate_class_name($(key).val());
    $(key).val(data.class_key);
    data.userid=$('#userid').val();
    data.locale=$('#locale').val();    
    return data
}    


/*
    $('#create_classroom').click(function () {
        if (!is_email($('#email').val())) {
            $('#email').css('background-color','#ffaaaa');
            return;
        } 
        $('#new_class_key').val(validate_class_name($('#new_class_key').val()));

        if ($('#new_class_key').val().length < 3 || $('#new_class_key').val().length > 50) {
            $('#bad_classroom_name').show();
            return;
        } else {            
            $('#bad_classroom_name').hide();
        }

        $('#progress').css('background','#f00').show(); 
        $('#names_list').val(validated_names_list());
        $('#email').val($.trim($('#email').val().replace(/\s/g, '')));
        data=getData('#new_class_key');
        
        $.get('create_classroom', data, function(classroom_url) {
            $('#progress').css('background','#fa0').show();
            if (classroom_url=='already exists') {
                room_name_reserved();
            } else if (classroom_url=='error') {
                debug('error');
            } else {
                go_there(classroom_url);
            }
            }, 'text'); 
    });
*/


jQuery(document).ready(function() {

    $('#userid').val(getCookie("userid") || new Date().getTime());
    
    params = get_url_parameters();

    set_language_column(params);
    localize();

    // if there are enough url parameters, we can try to jump directly to class.
    //If it fails, treat this as like the form was filled wrong. 
    if (params.class_key) try_to_jump_to_class(params);

    $('join_form').submit(join_classroom);
    $('#create_form').submit(create_classroom); 

    $('#class_key').change(function () {
        $('#join_classroom').attr('disabled',($(this).val()==''));
        $(this).val(validate_class_name($(this).val())); 
    });

    $('#new_classroom_key').change(function () {
        $(this).val(validate_class_name($(this).val())); 
    });

    $('#names_list').change(function () {
        $('#names_list').val(get_validated_names_list());
    });

    //check_flash_version();
});

