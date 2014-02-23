var EMAIL = "teamup.taik@gmail.com";
var WOOKIE1 = "http://wookie.eun.org/wookie/";
var WOOKIE1_API_KEY = "TEST"; 
var WOOKIE2 = "http://itec-wookie.eun.org/wookie/";
var WOOKIE2_API_KEY = "4qvOFWsUITPrFcCUgvzJlHDxlWE.eq. ";
var TESTPOST = "http://requestb.in/14vbq5i1";

var http = require("http");
var util = require("util");
var url = require("url");
var static = require('node-static');
var fs = require("fs");
var formidable=require("formidable");
var crypto = require("crypto");
var buffer = require("buffer");
var express = require("express");
var nodemailer = require("nodemailer");
var path = require("path");
var log = require('npmlog');
//var srequest = require('request');


var Db= require("./db").DataProvider;

var io;// = require('socket.io');
var app = express();
var server=http.createServer(app);
var file;
var transport = nodemailer.createTransport();
var httpProxy = require('http-proxy');
var proxy = new httpProxy.createProxyServer({target:TESTPOST});

log.stream = fs.createWriteStream('teamup.log', {flags: 'a'});
log.info(new Date().toUTCString(), "Launching TeamUp node.js server.");

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
	var contentType;
	switch(path.extname(filepath))
	{
		case ".mp3": contentType="audio/mpeg"; break;
		case ".jpg": contentType="image/jpeg"; break;
		default: contentType="application/octet-stream"; break;
	}
	fs.stat(filepath, function(err, stat)
	{
		if(err) throw err;
		var f=fs.readFileSync(filepath);
		response.set({
			"Content-Type": contentType,
			"Content-Length": stat.size
		});
		response.end(f, "binary");
	});
}

function start() {
    var handle = {};
    app.use(express.bodyParser());
    app.post("/site/WOOKIE1/*", wookieProxy1);
    app.post("/site/WOOKIE2/*", wookieProxy2);
	app.get("/check_classroom", checkClassroom);
    app.get("/create_classroom", createClassroom);
    app.get("/upload_photo", uploadPhoto);
    app.post("/photoloader.php", uploadPhoto);
    app.get("/isnode", isNode);
    app.get("/uploads/:clid/:classroom/:entity", getUpload);
	app.post("/varloader.php", uploadRecording);
	app.get("/*", function(request, response) {
    		file.serve(request, response);
    	});

    function wookieProxy1(request, response) {
        console.log("wookieProxy1 called!");

        //console.log(WOOKIE2 + end_part);
        console.log(TESTPOST);
        console.log(proxy);
        //var end_part = request.url.substring(request.url.lastIndexOf('WOOKIE1')+8);
        //proxy.proxyRequest(request, response, {target:TESTPOST});
        proxy.web(request, response);

        console.log(request.body);
        console.log(request.query);
        //response.writeHead(200, {Location: WOOKIE1 + end_part});
        //response.location(WOOKIE1 + end_part);
        //response.end();
        // now the request should be forwarded to address WOOKIE1
        // and api_key in request should be replaced with WOOKIE1_API_KEY
        // response should be the one coming from WOOKIE1
/*        var remote = srequest(WOOKIE2 + end_part);
        console.log('created srequest as remote');
        request.pipe(remote);
        console.log('piped request to remote');
        remote.pipe(response);
        console.log('piped remote to response');
        remote.end();
        console.log('ended remote');
        response.end();
        console.log('ended response');
*//*
        var options = {
            host:   'wookie.eun.org',
            port:   80,
            path:   '/wookie/' + end_part,
            method: 'POST',
            headers: request.headers
        };

        var creq = http.request(options, function(cres) {
            cres.setEncoding('utf8');
            // wait for data
            cres.on('data', function(chunk){
              response.write(chunk);
            });

            cres.on('close', function(){
              // closed, let's end client request as well 
              response.writeHead(cres.statusCode);
              response.end();
            });

        }).on('error', function(e) {
            // we got an error, return 500 error to client and log error
            console.log(e.message);
            response.writeHead(500);
            response.end();
        });

        creq.end();

*/    }

    function wookieProxy2(request, response) {
        console.log("wookieProxy2 called!");        
        response.redirect(WOOKIE2);
    }

    function isNode(request, response) {
        // Used to detect if a server is node.js server
        response.writeHead(200);
        response.end();
    }

    function checkClassroom(request, response) {
        console.log("Checking if exists");
		console.log(request.url);
        var instance;
        data=url.parse(request.url, true).query;
        if (data && data.class_key) {
            db.getCollection(data.class_key, function(error, classroom) {
                if (error) {
                    console.log("Not found");
                    response.write('not found');
                } else {
                    console.log("Found, returning url");
                    response.write('app/?c='+data.class_key);
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
        if (data && data.class_key) {
            db.getCollection(data.class_key, function(error, classroom) {
                if (error) {
                    console.log("class id available");
                    db.createClassroom(data, function(error) {
                        if (error) {
                            response.write('error');
                        } else {
                            // at this point email should be sent
                            var mail = {
                                from: EMAIL,
                                to: data.email,
                                bcc: EMAIL, 
                                subject: data.msg_subject,
                                text: data.msg_body  
                            };
                            // from http://www.nodemailer.com/docs/direct
                            transport.sendMail(mail, function(error, response) {
                                if (error) {
                                    console.log(error);
                                    return;
                                }                                
                                // response.statusHandler only applies to 'direct' transport
                                response.statusHandler.once("failed", function(d){
                                    console.log(
                                      "Permanently failed delivering message to %s with the following response: %s",
                                      d.domain, d.response);
                                });

                                response.statusHandler.once("requeue", function(d){
                                    console.log("Temporarily failed delivering message to %s", d.domain);
                                });

                                response.statusHandler.once("sent", function(d){
                                    console.log("Message was accepted by %s", d.domain);
                                });
                            });
                            response.write('app/?c='+data.class_key);
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

    function getUploadPath(classid, recordid, suffix)
    {
        var shasum=crypto.createHash("sha1");
        shasum.update(classid);
        var classidsha=shasum.digest("hex");
        var pre=classidsha.slice(0,3);
        var post=classidsha.slice(3);
        var name=recordid + suffix;
        return path.join("uploads", pre, classid, name);
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
                var uploadPath=getUploadPath(fields.class_id, fields.record_id, "_photo.jpg");
                mkdirp(path.dirname(uploadPath), function(error) {
                    if(error) throw error;
					moveFile(files.picture.path, uploadPath);
                });
                response.write(uploadPath);
                response.end();
            }
        });
    }

    function moveFile(source, destination, callback)
    {
        var is=fs.createReadStream(source);
        var os=fs.createWriteStream(destination);
        is.pipe(os);
        is.on("end", function() {
            fs.unlinkSync(source);
            if(callback) callback();
        });
    }

    function uploadRecording(request, response)
    {
        function movesDone(response, uploadPath, recordid)
        {
            console.log("DONE. uploadPath: " + uploadPath);
            response.send(200, path.dirname(uploadPath) + path.sep + recordid);
        }
        var form=new formidable.IncomingForm();
        form.parse(request, function(error, fields, files) {
            if(error) {
                response.send("error");
            } else if(!files) {
                response.send("no files");
            } else {
                var uploadPath=getUploadPath(fields.class_id, fields.record_id, "_pic.jpg");
                mkdirp(path.dirname(uploadPath), function(error)
                {
                    moveFile(files.photo.path, uploadPath, function()
                    {
                        uploadPath=getUploadPath(fields.class_id, fields.record_id, "_rec.mp3");
                        moveFile(files.voice.path, uploadPath, function()
                        {
                            movesDone(response, uploadPath, fields.record_id);
                        });
                    });
                });
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
