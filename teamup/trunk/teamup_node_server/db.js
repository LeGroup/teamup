var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

DataProvider = function(host, port) {
  this.db= new Db('teamup', new Server(host, port, {auto_reconnect: true}), {strict: true, journal: true});
  this.db.open(function(){});
};

DataProvider.prototype.getClassroom=function(classroom_id, callback) {
	this.db.collection("Classrooms", function(err, classrooms)
	{
		if(err) throw err;
		if(!classrooms) callback("Collection 'Classrooms' does not exist");
		classrooms.findOne({class_key: classroom_id}, function(err, classroom) {
			console.log(classroom);
			if(err) throw err;
			if(classroom) callback(null, classroom);
			else callback("Classroom does not exist");
		});
	});
};

DataProvider.prototype.createClassroom=function(data, callback)
{
	this.db.collection("Classrooms", function(err, classrooms)
	{
		if(err) throw err;
		var classname="Class " + data.class_key;
        // setting classroom properties
        classrooms.insert({_id: data.class_key, uid:'setup', class_key:data.class_key, class_name: classname, email:data.email, locale:data.locale, teacher:data.userid, teacher_link:data.teacher_link, student_link:data.student_link, names:data.names, version:1}, function (err, result)
		{
            if(err) console.log("Error saving settings");
            else
			{
                console.log("Saved settings");
                callback(result);
            }
        });
	});
};

DataProvider.prototype.getClassesForEmail=function(email, callback)
{
	this.db.collection("Classrooms", function(err, classrooms)
	{
		if(err) callback(err, null);
		else
		{
			classrooms.find({email: email}).toArray(function(err, results)
			{
				if(err) callback(err, null);
				else callback(null, results);
			});
		}
	});
};

/*
DataProvider.prototype.createClassroom= function(data, callback) {
  console.log('Creating classroom '+data.class_key);
  this.db.createCollection(data.class_key, function(error, classroom) {
    if( error ) {
        console.log('Error creating collection');
        callback(error);
    }
    else {
        console.log('Classroom created');
		var classname="Class " + data.class_key;
        // setting classroom properties
        classroom.save({uid:'setup', class_key:data.class_key, class_name: classname, email:data.email, locale:data.locale, teacher:data.userid, teacher_link:data.teacher_link, student_link:data.student_link, names:data.names, version:1}, function (err) {
            if (err) console.log("Error saving settings");
            else {
                console.log("Saved settings");
                callback(null);
            }
        });
    }
  });
};
*/

DataProvider.prototype.filterOldObjects = function(objectarray, classroom, callback) {
	function filter(changes, i)
	{
		if(i<objectarray.length)
		{
			item=objectarray[i];
			if(!item._id)
			{
				result_array.push(item);
				filter(classroom, ++i);
			}
			else
			{
				changes.findOne({_id:item._id}, function(err, found)
				{
					if(err || !found || item.version>found.version)
					{
						result_array.push(item);
					}
					filter(classroom, ++i);
				});
			}
		}
		else
		{
			console.log('found '+result_array.length+' new or newer objects');
			callback(null, result_array);
		}
	}
    var result_array=[];
    var item;
	this.db.collection("Changes", function(err, changes)
	{
		if(err) callback("Changes collection does not exist yet", null);
		else filter(changes, 0);
	});
};

DataProvider.prototype.getChanges=function(classroom_id, callback)
{
	this.db.collection("Changes", function(err, changes)
	{
		if(err) throw err;
		changes.find({classroom_id: classroom_id}).toArray(callback);
	});
};

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
};

DataProvider.prototype.save = function(objects, classroom, callback) {
    if(!classroom) console.log('missing classroom!');
	this.db.collection("Changes", function(err, changes)
	{
		if(err) throw err;
		function insertOrUpdate(i)
		{
			console.log("Insert/update #" + i);
			if(i>=objects.length)
			{
				console.log('saved '+i);
				callback(null, objects);
				return;
			}
			console.log(objects[i]);
			objects[i]._id=new ObjectID(objects[i]._id);
			objects[i].classroom_id=classroom._id;
			changes.update({classroom_id: classroom.class_key, uid: objects[i].uid}, objects[i], {upsert: true, w: 1}, function(err, result)
			{// Upsert will insert the document if it does not exist
				if(err) throw err;
				console.log(result);
				insertOrUpdate(++i);
			});
		}
		insertOrUpdate(0);
	});
	/*
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
	*/
};

exports.DataProvider = DataProvider;
