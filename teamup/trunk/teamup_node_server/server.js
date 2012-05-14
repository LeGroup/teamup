var http = require("http");
var url = require("url");
var static = require('node-static');
var Db= require("./db").DataProvider;

var io;// = require('socket.io');
var app;

function start(route, handle) {
  function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    console.log("Request for " + pathname + " received.");
    route(handle, pathname, response, request);
  }

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
                })
            }
        });             
      console.log('done.');      
      });
      socket.on('create_classroom', function(data) {
         console.log('Creating classroom');
         data=JSON.parse(data);
         if (!db.classroomExists(classroom_id)) {
            db.createClassroom(data);
            socket.set('classroom_id', classroom_id);
         }
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
                                //socket.broadcast.to(classroom_id).emit('update', objects);
                                socket.broadcast.emit('update', objects);
                                socket.emit('update', objects); 
                                socket.emit('message', 'server received delta');                    
                                }
                            } );
                    }
                }); 
            });       
        });
       console.log('Changes handled.');
      });
  });

  //
  // Create a node-static server instance to serve the './public' folder
  //
  var file = new(static.Server)('../TeamUp');

  require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response);
    });
  }).listen(8080);
  console.log("Static server has started at :8080.");


}


exports.start = start;