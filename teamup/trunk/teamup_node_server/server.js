var http = require("http");
var util = require("util");
var url = require("url");
var static = require('node-static');
var fs = require("fs");
var formidable=require("formidable");
var crypto = require("crypto");
var buffer = require("buffer");
var express = require("express");
var path = require("path");

var Db= require("./db").DataProvider;

var io;// = require('socket.io');
var app = express();
var server=http.createServer(app)
var file;

function mkdirp(str, callback)
{
	mkdir_p(str.split(path.sep), 0, callback);
}

function mkdir_p(parts, i, callback) {
    if (i >= parts.length) {
        if (callback) {
            return callback();
        } else {
            return true;
        }
    }
    var directory = parts.slice(0, i+1).join('/');
    fs.stat(directory, function(err) {
        if (err === null) {
            mkdir_p(parts, i+1, callback);
        } else {
            fs.mkdir(directory, 0777, function (err) {
                if (err) {
                    if (callback) {
                        return callback(err);
                    } else {
                        throw err;
                    }
                } else {
                    mkdir_p(parts, i+1, callback);
                }
            });
        }
    });
}

function getUpload(request, response)
{
	var filepath=path.join("uploads", request.params.clid, request.params.classroom, request.params.entity);
	fs.stat(filepath, function(err, stat)
	{
		if(err) throw err;
		var f=fs.readFileSync(filepath);
		response.contentType="image/jpeg";
		response.contentLength=stat.size;
		response.end(f, "binary");
	});
}

function start() {
    var handle = {};

	app.get("/check_classroom", checkClassroom);
    app.get("/create_classroom", createClassroom);
    app.get("/upload_photo", uploadPhoto);
    app.post("/photoloader.php", uploadPhoto);
    app.get("/isnode", isNode);
    app.get("/uploads/:clid/:classroom/:entity", getUpload);
	app.get("/*", function(request, response)
	{
		file.serve(request, response);
	})

    function isNode(request, response) {
        // Used to detect if a server is node.js server
        response.writeHead(200);
        response.end();
    }

    function checkClassroom(request, response) {
        console.log("Checking if exists");
		console.log(request.url);
        data=url.parse(request.url, true).query;
        if (data && data.c) {
            db.getCollection(data.c, function(error, classroom) {
                if (error) {
                    console.log("Not found / error");
                    response.write('not found');
                } else {
                    console.log("Found, returning url");
                    response.write('app/?c='+data.c);
                }
                response.end();
            });
        } else {
            console.log("Empty query");
            response.write('error');
            response.end();
        }
    }

    function createClassroom(request, response) {
        console.log("Creating classroom");
        data=url.parse(request.url, true).query;
        if (data && data.c) {
            db.getCollection(data.c, function(error, classroom) {
                if (error) {
                    console.log("class id available");
                    db.createClassroom(data, function(error) {
                        if (error) {
                            response.write('error');
                        } else {
                            // at this point email should be sent
                            response.write('app/?c='+data.c);
                        }
                        response.end();
                    });
                } else {
                    console.log("Classroom exists, cannot create");
                    response.write('already exists');
                    response.end();
                }
            });
        }
    }

    function uploadPhoto(request, response) {
        console.log("Receiving photo");
        var form = new formidable.IncomingForm();
        form.parse(request, function(error, fields, files) {
            if (error) {
                response.write('error');
            } else if (!files) {
                console.log('Files are missing');
            } else {
				var shasum = crypto.createHash('sha1');
				shasum.update(fields.class_id);
				var classidsha=shasum.digest('hex');
				var pre=classidsha.slice(0,3);
				var post=classidsha.slice(3);
				var imageName="P" + fields.record_id + "_photo.jpg";
				var uploadPath=path.join("uploads", pre, fields.class_id, imageName);
				mkdirp(path.dirname(uploadPath), function(error) {
                    if(error) throw error;

                    var buf=new Buffer(fields.picture, "base64");
                    fs.writeFile(uploadPath, buf, "binary", function(err)
                    {
                        if(err) throw(err);
                    });
                });
                response.write(uploadPath);
                response.end();
            }
        });
    }

    file = new(static.Server)('www');
    io= require('socket.io').listen(server, {'log level':2,'heartbeat':true});
    server.listen(8081);
    console.log("Server has started at :8081");
    var db = new DataProvider('localhost', 27017);

    io.sockets.on('connection', function (socket) {
        socket.on('join_classroom', function(classroom_id) {

        console.log("Joining classroom "+classroom_id);
        db.getCollection(classroom_id, function(error, classroom) {
            if (error) {
                console.log('Classroom '+classroom_id+' does not exist');
                socket.emit('message', 'Classroom '+classroom_id+' does not exist');
            } else {
                console.log('Setting socket to room '+classroom_id);
                socket.join(classroom_id);
                socket.set('classroom_id', classroom_id);
                socket.emit('message', 'Joined classroom '+classroom_id);
                socket.broadcast.emit('message', 'Joined classroom '+classroom_id);
                db.giveFullClass(classroom_id, function(err, data) {
                    if (err)
                        console.log('Failed dumping data');
                    else {
                        console.log('Sending full data to client:'+data.length);
                        socket.emit('full_update', data)
                    }
                });
            }
        });
        console.log('done.');
        });
        socket.on('delta', function (delta) {
        console.log('Incoming changes.');
        socket.get('classroom_id', function (err, classroom_id) {
            if (err) {
                console.log('No classroom_id stored for socket');
                socket.emit('message', 'No classroom_id stored for socket');
                return;
            }

            db.getCollection(classroom_id, function(err, classroom) {
                if (err) {
                    console.log('No classroom found, exiting');
                    return;
                }
                good_changes=[];
                delta=JSON.parse(delta);
                db.filterOldObjects(delta, classroom, function(err, good_changes) {
                    if (err) console.log('error checking object versions')
                    else if (good_changes.length>0) {
                        console.log('preparing to save objects to db');
                        db.save(good_changes, classroom, function (err, objects) {
                            if (err) socket.emit('message', 'Update rejected -- no newer objects');
                            else {
                                console.log('Broadcasting update to peers in '+classroom_id+' ('+objects.length+') objects');
                                socket.broadcast.to(classroom_id).emit('update', objects);
                                //socket.broadcast.emit('update', objects);
                                socket.emit('update', objects);
                                //socket.emit('message', 'server received delta');
                                }
                            } );
                    }
                });
            });
        });
        console.log('Changes handled.');
        });
    });
}

exports.start = start;
