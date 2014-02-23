var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

DataProvider = function(host, port) {
  this.db= new Db('teamup', new Server(host, port, {auto_reconnect: true}), {strict: true, journal: true});
  this.db.open(function(){});
};

DataProvider.prototype.getCollection= function(classroom_id, callback) {
    function exists(arr, collection) {
        for(var i=0, len=arr.length; i<len; ++i) {
            if(arr[i].name == "teamup." + collection) return true;
        }
        return false;
    }
    var that=this;
    this.db.collectionNames(function(err, names) {
        if(err)
        {
            console.log(err + ", is mongodb running?");
            return;
        }
        if(exists(names, classroom_id)) {
            that.db.collection(classroom_id, function(err, classroom) {
                if(err) throw err;
                callback(null, classroom);
                return;
            });
        }
        else callback("Classroom does not exist");
    });
};

DataProvider.prototype.createClassroom= function(data, callback) {
  console.log('Creating classroom '+data.class_key);
  this.db.createCollection(data.class_key, function(error, classroom) {
    if( error ) {
        console.log('Error creating collection');
        callback(error);
    }
    else {
        console.log('Classroom created');
        // setting classroom properties
        classroom.save({uid:'setup', class_key:data.class_key, email:data.email, locale:data.locale, teacher:data.userid, teacher_link:data.teacher_link, student_link:data.student_link, names:data.names, version:1}, function (err) {
            if (err) console.log("Error saving settings");
            else {
                console.log("Saved settings");
                callback(null);
            }
        });
    }
  });
};

DataProvider.prototype.filterOldObjects = function(objectarray, classroom, callback) {
    var result_array=[];
    var item;
    function filter(i) {
        if (i<objectarray.length) {
            item=objectarray[i];
            if (!item._id) {
                result_array.push(item);
                filter(i+1);
            } else {
                classroom.findOne({_id:item._id}, function (err, found) {
                if (err || !found || item.version>found.version) {
                    result_array.push(item);
                }
                filter(i+1);
                });
            }
        } else {
            console.log('found '+result_array.length+' new or newer objects');
            callback(null, result_array);
        }
    }
    filter(0);
}

DataProvider.prototype.giveFullClass = function(classroom_id, callback) {
    //var data={};
    console.log('dp dumping classroom');
    this.getCollection(classroom_id, function(error, classroom) {
        if (error) {
            console.log("Couldn't find classroom to dump");
            callback(error, '');
        } else {
            classroom.find().toArray(function(err, arr) {
                console.log("Returning as array, "+arr.length);
                callback(null,arr);
            });
        }
    });
}

DataProvider.prototype.save = function(objects, classroom, callback) {
    if(!classroom)
        console.log('missing classroom!');
    console.log('saved '+objects.length);
    var uobj;
    function saver(i) {
        if ( i<objects.length) {
            uobj=objects[i];
            if (!uobj._id) {
                console.log("no objid... ");
                uobj._id=new ObjectID();
                console.log("created _id:" +uobj._id);
            }
            console.log("adding record: "+uobj.uid);
            classroom.save(uobj, function (err, callback) {
                if (err) console.log("Error saving "+JSON.stringify(uobj))
                else {
                   saver(i+1)
                }
            });
        }
    }
    saver(0);
    console.log("Save in progress");
    callback(null, objects);
};

exports.DataProvider = DataProvider;
