/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */ 
 
//
// Wookie JavaScript Connector 
// @version 0.14
//
//
// Example usage:
//
// Wookie.configureConnection("http://myserver.com/wookie", "MyAPIKey", "MySharedDataKey");
// Wookie.setCurrentUser("bob","the bobster","http://bob.com/bob.png");
// var instance = Wookie.getOrCreateInstance(widgetURI);
//

// from https://raw.github.com/apache/wookie/trunk/wookie-connector/js/wookie-connector.js

var Wookie = {
    widgets: [],
    currentUser: null,
    instances: {},
    connection: null,
    
    //
    // Get available widgets, and send
    // to the callback function when retrieved
    //
    getWidgets: function(callback){
   
        //
        // Use default connection if not set
        //
        if (Wookie.connection === null){
            Wookie.configureConnection(null, null, null);
        }     
    
        $.ajax({
         url: Wookie.connection.url + "/widgets", 
         accept: "text/xml",
         success:function(xml){
            Wookie.widgets = [];
            $(xml).find("widget").each(function(){
                var widget = {};
                widget.id = $(this).attr("id");
                widget.name = $(this).find("name").text();
                
                if ($(this).find("icon").length > 0){
                    widget.icon = $(this).find("icon").attr("src");
                } else {
                    widget.icon = "../shared/images/defaultwidget.png";
                }
                Wookie.widgets.push(widget);
            });
            callback(Wookie.widgets);
         }, 
         error:function(err){
            alert("error retrieving widgets");
         }
        });
    
    },
    
    setPreference: function(id, key, value){
        //
        // Use default connection if not set
        //
        if (Wookie.connection === null){
            Wookie.configureConnection(null, null, null);
        }
        
        //
        // Use default user if not set
        //
        if (Wookie.currentUser === null){
            Wookie.setCurrentUser("guest","test user",null);
        }
        
        var postdata = "api_key=";
        postdata = postdata + encodeURI(Wookie.connection.apiKey);
        postdata = postdata + "&shareddatakey=";
        postdata = postdata + encodeURI(Wookie.connection.sharedDataKey);
        postdata = postdata + "&userid=";
        postdata = postdata + encodeURI(Wookie.currentUser.loginName);
        postdata = postdata + "&widgetid=";
        postdata = postdata + encodeURI(id);
        postdata = postdata + "&is_public=false";
        postdata = postdata + "&propertyname=";
        postdata = postdata + encodeURI(key);
        postdata = postdata + "&propertyvalue=";
        postdata = postdata + encodeURI(value);
        var url = Wookie.connection.url + "/properties";
        $.ajax({
            type: 'POST',
            url: url,
            data: postdata,
            async: false
        });
    },


    getProperty: function(id, propertyname, new_api) {
    
        //
        // Use default connection if not set
        //
        if (Wookie.connection === null){
            Wookie.configureConnection(null, null, null);
        }
        
        //
        // Use default user if not set
        //
        if (Wookie.currentUser === null){
            Wookie.setCurrentUser("guest","test user",null);
        }
        
        var value;
        
        var postdata = "api_key=";
        postdata = postdata + encodeURI(Wookie.connection.apiKey);
        if (!new_api) {
            postdata = postdata + "&shareddatakey=";
            postdata = postdata + encodeURI(Wookie.connection.sharedDataKey);
            postdata = postdata + "&userid=";
            postdata = postdata + encodeURI(Wookie.currentUser.loginName);
            postdata = postdata + "&widgetid=";
            postdata = postdata + encodeURI(id);
        } else {
            postdata = postdata + "&id_key=";
            postdata = postdata + encodeURI(id);            
        }
        postdata = postdata + "&propertyname=";
        postdata = postdata + encodeURI(propertyname);
        var url = Wookie.connection.url +  "/properties"; 
        console.log(url);
        $.ajax({
            type: 'GET',
            url: url,
            data: postdata,
            success: function(doc) {
                console.log('get property call success');
                console.log(doc);
                value = doc;
            },
            error: function(err) {
                console.log('ajax call for widget properties error: ' + err.status);
                console.log(err.statusText);
            },
            async: false
        });
        return value;
    },


    getInstance: function(id) {
    
        //
        // Use default connection if not set
        //
        if (Wookie.connection === null){
            Wookie.configureConnection(null, null, null);
        }
        
        //
        // Use default user if not set
        //
        if (Wookie.currentUser === null){
            Wookie.setCurrentUser("guest","test user",null);
        }
        
        var key = id + ":" + Wookie.currentUser.loginName;        
        var postdata = "api_key=";
        postdata = postdata + encodeURI(Wookie.connection.apiKey);
        postdata = postdata + "&shareddatakey=";
        postdata = postdata + encodeURI(Wookie.connection.sharedDataKey);
        postdata = postdata + "&userid=";
        postdata = postdata + encodeURI(Wookie.currentUser.loginName);
        postdata = postdata + "&widgetid=";
        postdata = postdata + encodeURI(id);
        var url = Wookie.connection.url +  "/widgetinstances"; 
        $.ajax({
            type: 'GET',
            url: url,
            data: postdata,
            success: function(doc) {
                console.log('get instance call success');
                url = $(doc).find("url").text();
                title = $(doc).find("title").text();
                height = $(doc).find("height").text();
                width = $(doc).find("width").text();
                id_part = url.substring(url.indexOf("idkey=")+6);
                id_key = id_part.substring(0, id_part.indexOf("&"));

                console.log(doc);

                var instance = {};
                instance.url = url;
                instance.id = id;
                instance.title = title;
                instance.height = height;
                instance.width = width;
                instance.id_key = id_key;
                Wookie.instances[key]=instance;
            },
            error: function(err) {
                console.log('ajax call for get widgetinstances error: ' + err.status);
                console.log(err.statusText);
            },
            async: false
        });
        return Wookie.instances[key];
    },


    getOrCreateInstance: function(id) {
    
        //
        // Use default connection if not set
        //
        if (Wookie.connection === null){
            Wookie.configureConnection(null, null, null);
        }
        
        //
        // Use default user if not set
        //
        if (Wookie.currentUser === null){
            Wookie.setCurrentUser("guest","test user",null);
        }
        
        var key = id + ":" + Wookie.currentUser.loginName;
        
        var postdata = "api_key=";
        postdata = postdata + encodeURI(Wookie.connection.apiKey);
        postdata = postdata + "&shareddatakey=";
        postdata = postdata + encodeURI(Wookie.connection.sharedDataKey);
        postdata = postdata + "&userid=";
        postdata = postdata + encodeURI(Wookie.currentUser.loginName);
        postdata = postdata + "&widgetid=";
        postdata = postdata + encodeURI(id);
        var url = Wookie.connection.url +  "/widgetinstances"; //"show_post"
        $.ajax({
            type: 'POST',
            url: url,
            data: postdata,
            success: function(doc) {
                console.log('post call success');
                url = $(doc).find("url").text();
                title = $(doc).find("title").text();
                height = $(doc).find("height").text();
                width = $(doc).find("width").text();

                console.log(doc);

                var instance = {};
                instance.url = url;
                instance.id = id;
                instance.title = title;
                instance.height = height;
                instance.width = width;
                Wookie.instances[key]=instance;
            },
            error: function(err) {
                console.log('ajax call for get or create widgetinstances error: ' + err.status);
                console.log(err.statusText);
            },
            async: false
        });
        
        var postdata = "api_key=";
        postdata = postdata + encodeURI(Wookie.connection.apiKey);
        postdata = postdata + "&shareddatakey=";
        postdata = postdata + encodeURI(Wookie.connection.sharedDataKey);
        postdata = postdata + "&userid=";
        postdata = postdata + encodeURI(Wookie.currentUser.loginName);
        postdata = postdata + "&widgetid=";
        postdata = postdata + encodeURI(id);
        postdata = postdata + "&participant_role=";
        postdata = postdata + encodeURI(Wookie.currentUser.role);
        postdata = postdata + "&participant_display_name=";
        postdata = postdata + encodeURI(Wookie.currentUser.screenName);
        postdata = postdata + "&participant_id=";
        postdata = postdata + encodeURI(Wookie.currentUser.loginName);
        postdata = postdata + "&participant_thumbnail_url=";
        postdata = postdata + encodeURI(Wookie.currentUser.thumbnailUrl);
        
        var url = Wookie.connection.url + "/participants";
        $.ajax({
            type: 'POST',
            url: url,
            data: postdata,
            success: function(data) {
            },
            async: false
        });
        return Wookie.instances[key];
    },
    
    setCurrentUser: function(loginName, screenName, thumbnailUrl, role){
        var user = {};
        user.loginName = loginName;
        user.screenName = screenName;
        user.role = role;
        if (!thumbnailUrl || typeof thumbnailUrl === "undefined") {
            user.thumbnailUrl = "";
        } else {
            user.thumbnailUrl = thumbnailUrl
        }        
        Wookie.currentUser = user;
    },
    
    configureConnection: function(url, apiKey, sharedDataKey){
        Wookie.connection = {};
        
        if (!url || typeof url === "undefined") {
            Wookie.connection.url = "/wookie";
        } else {
            Wookie.connection.url = url;
        }
        
        if (!apiKey || typeof apiKey === "undefined") {
            Wookie.connection.apiKey = "TEST";
        } else {
            Wookie.connection.apiKey = apiKey;
        }
        
        if (!sharedDataKey || typeof sharedDataKey === "undefined") {
            Wookie.connection.sharedDataKey = "mysharedkey";
        } else {
            Wookie.connection.sharedDataKey = sharedDataKey;
        }
    }
}
