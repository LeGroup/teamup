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

var url='';
var params={};
var searching=false;
var localizedStrings;
var prev_width=0;

var LANGUAGES= {'de-AT':'deutsch','et-ET':'eesti','en-EN':'english', 'es-ES':'español', 'fr-FR':'français', 'he-HE':'עִבְרִית', 'hu-HU':'magyar', 'it-IT':'italiano','lt-LT':'lietuvių', 'nl-NL':'nederlands', 'no-NO':'norsk', 'pt-PT':'português','sk-SK':'slovenčina', 'fi-FI':'suomi','tr-TR':'türkçe'};


function setInstanceParams() {
    $('#progress').css('color','#af0').show(); 
    data=getData();
    var params={};
    params.class_key=data.shareddatakey;
    params.moderator_id=data.userid;
    params.names_list=validated_names_list() || 'Learner1, Learner2, Learner3';
    alert(params.names_list)
    $('#names_list').val(params.names_list);
    params.teacher_url=setUrlVars(data, true);
    params.learner_url=setUrlVars(data, false);
    params.moderator_email=$.trim($('#email').val().replace(/\s/g, ''));
    $('#email').val(params.moderator_email);
    params.moderator_email=(is_email(params.moderator_email)) ? params.moderator_email : '';
    data.moderator_email=params.moderator_email; 
    data.msg_subject=i18n('Your TeamUp classroom');
    data.msg_body=i18n('Welcome to TeamUp!')+'\n'+i18n('You can use the following address to return this classroom as a teacher:')+'\n'+params.teacher_url+' \n\n'+i18n('You can give this address as a link for learners to enter this classroom:')+'\n'+params.learner_url+'\n\n -- TeamUp service';
    data.propertyvalue=JSON.stringify(params);
    alert(data.propertyvalue)
    if (!data.propertyvalue || data.propertyvalue.length==0) {
        debug('problems sending parameters');
        return;
    }    
    data.task='set_params';
    $.post('new_bridge.php', data, function(success) {
        if (success=='ok') {
            $('#progress').css('color','#aa0').show();
            go_there();
        } else {
            $('#progress').hide();
            debug('Something strange happened when reading learner list or email.');
        }
    }, 'text');
}

function validate_class_name(name) {
    name=$.trim(name.replace(/[\\%\+*<>\n\t\r]/g, ''));
    return name
}

function validated_names_list() {
    nl=$.trim($('#names_list').val());
    nl=nl.replace(/[\+#\\%<>]/g, ''); // remove bad chars
    nl=nl.replace(/[,:;]\s+/g, ', ');  // linebreak/tab after separator is removed
    nl=nl.replace(/[;:\n\t\r]/g, ','); // if there are linebreaks/tabs left, they are separators
    nl=nl.replace(/\s/g, ' '); // all of the rest whitespaces are replaced with simple spaces
    nl = (nl.search(',')==-1) ? nl.replace(/\s/g, ', ') : nl;
    return nl
}

function go_there() {
    $('#progress').css('color','#aa0').show();
    if (data.locale.length<10) url+='&locale='+data.locale;
    window.location=url;
}

function already_there(data, textStatus, jqXHR) {
    $('#progress').css('color','#0a0').hide();
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
    $('#progress').hide(); 
    $('#classroom_not_available').parent('div.form-group').addClass('has-error');
    $('#classroom_not_available').show()
}

function getJoinData() {
    data= new Object();
    data.shareddatakey=validate_class_name($('#shareddatakey').val());
    $('#shareddatakey').val(data.shareddatakey);
    data.userid=$('#userid').val();
    data.locale=$('#locale').val();
    return data
}    

function getData() {
    data= new Object();
    data.shareddatakey=validate_class_name($('#new_classroom_key').val());
    $('#new_classroom_key').val(data.shareddatakey);
    data.userid=$('#userid').val();
    data.locale=$('#locale').val();
    return data
}    

function setUrlVars(data, teacher) {
    var base=window.location.href.slice(0,(window.location.href.lastIndexOf('/')+1));
    req_data={};
    if (data.shareddatakey) {
        base+='?class_key='+encodeURIComponent(data.shareddatakey);
    } else {
        return base;
    }
    if (!teacher) {
        return base;
    }
    
    if (data.userid) {
        base+='&teacher='+encodeURIComponent(data.userid); // hex_md5()
    }        
    if (data.locale!='en-EN') {
        base+='&lang='+encodeURIComponent(data.locale);
    }
    return base;
}

function getUrlVars() {
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

function i18n(str){
    if (localizedStrings == null) return str;
    var locstr = localizedStrings[str];
    if (locstr == null || locstr == "") locstr = str;
    return locstr;
}

function localize(){
    /* Ensure language code is in the format aa-AA. */
	if (!params.lang || params.lang=='en-EN') return;
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
        }           
    );
    
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

jQuery(document).ready(function() {

    $('#userid').val(getCookie("userid") || new Date().getTime());
    
    params=getUrlVars();
    s='';
    for (key in LANGUAGES) {
        if (params.lang==key || (key=='en-EN' && !params.lang)) {
            s+='<span class="selected" id="lang_'+key+'">'+LANGUAGES[key]+'</span> | ';
        } else {
            s+='<a href="?lang='+key+'" class="lang" id="lang_'+key+'">'+LANGUAGES[key]+'</a> | ';
        }
    }
    $('#language_column').html(s);
    localize();

    // if there are enough url parameters, we can try to jump directly to class. 
    //If it fails, treat this as like the form was filled wrong. 
    if (params.class_key) { 
        $('#shareddatakey').val(validate_class_name(decodeURIComponent(params.class_key)));
        $('#join_classroom').attr('disabled',($('#shareddatakey').val()=='')); 
        if (params.lang) {
            $('#locale').val(decodeURIComponent(params.lang));
        }
        if (params.teacher) {
            $('#userid').val(decodeURIComponent(params.teacher));
        } else {
            $('#userid').val(new Date().getTime());
        }
        data=getJoinData();
        data.task='get_instance';       
        $('#progress').css('color','#a0a').show();
        $.get('new_bridge.php', data, function(instance_url) {
            if (instance_url=='not found') {
                no_class();
            } else {
                url=instance_url;
                go_there();
            }
        }, 'text');              
    } else if (params.lang) {
        $('#locale').val(unescape(params.lang));
    }

    $('#shareddatakey').change(function () {
        $('#join_classroom').attr('disabled',($(this).val()==''));
        $(this).val(validate_class_name($(this).val())); 
    });
    $('#shareddatakey').keyup(function (e) {
        $('#join_classroom').attr('disabled',($(this).val()==''))
        if(e.keyCode==13){
            // Enter pressed
            $('#join_classroom').click()
        }
    });

    $('#new_classroom_key').change(function () {
        $(this).val(validate_class_name($(this).val())); 
    });

    $('#names_list').change(function () {
        $('#names_list').val(validated_names_list());
    });
        

    $('#join_classroom').click(function () {
        data=getJoinData();
        data.task='get_instance';       
        $('#progress').css('color','#a0a').show();
        $.get('new_bridge.php', data, function(instance_url) {
            if (instance_url=='not found') {
                no_class();
            } else if (instance_url=='no server') {
                debug('no server');
            } else {
                url=instance_url;
                go_there();
            }
        }, 'text');              
    });

    $('#create_classroom').click(function () {
        if (searching) return;
        fail = false;
        if (!is_email($('#email').val())) {
            $('#email_help').show();
            $('#email').parent('div.form-group').addClass('has-error');
            fail = true;
        } else {
            $('#email_help').hide();
            $('#email').parent('div.form-group').removeClass('has-error');

        }
        if ($('#new_classroom_key').val().length < 3 || $('#new_classroom_key').val().length > 50) {
            $('#bad_classroom_name').parent('div.form-group').addClass('has-error');
            $('#bad_classroom_name').show();
            fail = true;
        } else {            
            $('#bad_classroom_name').parent('div.form-group').removeClass('has-error');
            $('#bad_classroom_name').hide();
        }
        if (fail) return;

        $('#progress').css('color','#f00').show(); 
        searching=true;
        data=getData();
        data.task='create_instance';
        $.get('new_bridge.php', data, function(instance_url) {
            $('#progress').css('color','#fa0').show();
            if (instance_url=='reserved') {
                already_there();
            } else {
                url=instance_url;
                setInstanceParams();
            }
            }, 'text'); 
    });
    //check_flash_version();
});

