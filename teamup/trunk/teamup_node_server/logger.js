var fs = require("fs");
var npmlog = require('npmlog');
var logStream = fs.createWriteStream("teamup.log", {flags: "a", encoding: "utf-8", mode: 0666});

function logMsg(msg) { logStream.write(msg.level + " | " + msg.prefix + " | " + msg.message + "\n"); }

var log={};

log.debug = function(msg) { npmlog.debug(new Date().toUTCString(), msg); };
log.info = function(msg) { npmlog.info(new Date().toUTCString(), msg); };
log.error = function(msg) { npmlog.error(new Date().toUTCString(), msg); };
log.warn = function(msg) { npmlog.warn(new Date().toUTCString(), msg); };

npmlog.level="debug";
npmlog.addLevel("debug", 0);
npmlog.on("log.info", logMsg);
npmlog.on("log.warn", logMsg);
npmlog.on("log.error", logMsg);

exports.log = log;
