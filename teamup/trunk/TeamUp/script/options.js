
// defaults: 
OPTIONS.language='';
OPTIONS.default_language='';
OPTIONS.show_icons=true;
OPTIONS.always_show_names = false;
OPTIONS.team_size = 4;
OPTIONS.color=false;
OPTIONS.clicker='None';
OPTIONS.are_loaded=false;
OPTIONS.wait_for_load=false;
OPTIONS.learners_edit_teams=false;

OPTIONS.init = function() {
    var s="";
    var check;
    debug('Initializing options sheet');

    $('#team_size').val(OPTIONS.team_size);
    $('#team_size').change(OPTIONS.set_team_size);
    $('#show_icons').attr('checked', OPTIONS.show_icons);
    $('#show_icons').change(OPTIONS.set_show_icons);
    $('#show_names').change(OPTIONS.set_show_names);
    $('#show_names').attr('checked', OPTIONS.always_show_names);

    for (key in LANGUAGES) {
        s+='<option value="'+key+'">'+LANGUAGES[key]+'</option>';
    }
    $('#language_select').html(s);
    $('#language_select').val(OPTIONS.language);
    $('#language_select').change(OPTIONS.set_language);
    $('#reset_teams').click(OPTIONS.reset_teams);

    $('#teacher_url, #learner_url, #panel_teacher_url, #panel_learner_url').click(function () {$(this).focus().select()});
    $('#clicker_select').val(OPTIONS.clicker);
    $('#clicker_select').change(OPTIONS.set_clicker);
    $('#clicker_select').change();

    $('#learners_edit_teams').attr('checked', OPTIONS.learners_edit_teams);
    $('#learners_edit_teams').change(OPTIONS.set_learners_edit_teams);
}
OPTIONS.save_options = function() {
    var d={};
    d.default_language= OPTIONS.default_language;
    d.show_icons= OPTIONS.show_icons;
    d.always_show_names= OPTIONS.always_show_names;
    d.team_size= OPTIONS.team_size;
    d.learners_edit_teams=OPTIONS.learners_edit_teams;
    return d;
}

OPTIONS.guess_language= function() {
	OPTIONS.language=guess_language();
    debug('Language: '+OPTIONS.language);

}

OPTIONS.toggle = function() {
    if (view==OPTIONS) {
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
    view=OPTIONS;
}

OPTIONS.reset_teams= function(event) {
	OPTIONS.confirmed_reset_teams(false);
}

OPTIONS.confirmed_reset_teams= function(confirmed) {
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
            $('#reset-confirm-panel').dialog("option", "buttons", { "Reset": function() {$(this).dialog("close");OPTIONS.confirmed_reset_teams(true); }, "Cancel": function() {$(this).dialog("close");} } );
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
    $('#grid_button').addClass('selected');
    $('#teams_button').removeClass('selected');
	CLASSROOM.select_class_view();
}

OPTIONS.set_team_size = function(event) {
	OPTIONS.team_size=$(this).val();
	if (MODERATOR) {
		CONTROLLER.addOption('team_size', OPTIONS.team_size);
		CONTROLLER.sendChanges();		
	}
	OPTIONS.are_loaded=true;

}

OPTIONS.set_show_icons = function(event) {
    OPTIONS.show_icons=this.checked;
    if (MODERATOR) {
		CONTROLLER.addOption('show_icons', OPTIONS.show_icons);
		CONTROLLER.sendChanges();
	}
	OPTIONS.are_loaded=true;
}

OPTIONS.set_show_names = function(event) {
    OPTIONS.always_show_names=this.checked;
    if (MODERATOR) {
	    CONTROLLER.addOption('always_show_names', OPTIONS.always_show_names);
    	CONTROLLER.sendChanges();
    }
	OPTIONS.are_loaded=true;
    CLASSROOM.update_faces();
}

OPTIONS.set_learners_edit_teams = function(event) {
    OPTIONS.learners_edit_teams=this.checked;
    if (MODERATOR) {
        CONTROLLER.addOption('learners_edit_teams', OPTIONS.learners_edit_teams);
        CONTROLLER.sendChanges();        
    }
}

OPTIONS.set_language = function(event) {
    OPTIONS.language=$(this).val();
    URL_VARS['locale']=OPTIONS.language;
    new_url='';
    if (window.location.href.indexOf('?')==-1) {
        new_url=window.location.href+'?'+$.param(URL_VARS);
    } else {            
        new_url=window.location.href.slice(0,window.location.href.indexOf('?')+1)+$.param(URL_VARS);
    }
    if (MODERATOR) {
        OPTIONS.default_language=OPTIONS.language;
	    CONTROLLER.addOption('default_language', OPTIONS.default_language);
    	CONTROLLER.sendChanges();
    }
	OPTIONS.are_loaded=true;

    if (MODERATOR) {
        $('#reload_link').attr('href', new_url).show();
    } else {
        window.location=new_url;
    }
}

OPTIONS.set_clicker = function(event) {
    OPTIONS.clicker=$(this).val();
    SMART_ENABLED= (OPTIONS.clicker=='SMART');
    if (SMART_ENABLED) {
        smart_clicker_enable()
    } else {
        $('#smart_receiver').hide();
    }
}
    
OPTIONS.hide = function() {
    $('div.options').hide();     
}

