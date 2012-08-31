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

    
