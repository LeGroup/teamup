var http = require("http");
var util = require("util");
var url = require("url");
var static = require('node-static');
var fs = require("fs");
var formidable=require("formidable")
var crypto = require("crypto");

var Db= require("./db").DataProvider;


var io;// = require('socket.io');
var app;
var file;

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
            })
        }
    })
}

function start() {
    var handle = {}
    handle["/check_classroom"] = checkClassroom; 
    handle["/create_classroom"] = createClassroom;
    handle["/upload_photo"] = uploadPhoto; 
    handle["/photoloader.php"] = uploadPhoto; 
    
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        //console.log("Request for " + pathname + " received.");
        if (pathname=='/app/') {
            file.serve(request, response);
        } else if (typeof handle[pathname] === 'function') {
            console.log("Request for "+pathname+" catched by requestHandler."); 
            handle[pathname](response, request)
        } else {
            file.serve(request, response);
        }
    }
    
    function checkClassroom(response, request) {
        console.log("Checking if exists");
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

    function createClassroom(response, request) {
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

    function uploadPhoto(response, request) {
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
                var class_id=shasum.digest('hex');
                var pre=class_id.slice(0,3);
                var post=class_id.slice(3);
                console.log(files.upload);
                console.log(util.inspect(files));
                console.log(files.upload.path);
                
                
                mkdir_p(['uploads',pre,post],0, function(error) {
                    if (error) {
                        fs.rename(files.upload.path, 'uploads/'+pre+'/'+post+'/'+fields.record_id+'.jpg', function(err) {
                          if (err) {
                              console.log("error moving photo to place")
                          }
                        });
                    }
                });

                console.log(pre);
                console.log(post);
                response.write('success=1');
                response.end();
            }
        })
    }

    file = new(static.Server)('www');
    app=http.createServer(onRequest)
    io= require('socket.io').listen(app, {'log level':2,'heartbeat':true});
    app.listen(8081);
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
