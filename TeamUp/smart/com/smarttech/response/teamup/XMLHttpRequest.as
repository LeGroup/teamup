
package com.smarttech.response.teamup {
	import com.adobe.serialization.json.JSON;
	import flash.utils.ByteArray;
	import flash.events.*;
	import flash.net.*;
	import flash.xml.*;
	
	public class XMLHttpRequest {
		public static const UNSENT:int = 0;
		public static const OPENED:int = 1;
		public static const HEADERS_RECEIVED:int = 2;
		public static const LOADING:int = 3;
		public static const DONE:int = 4;
		public static const INVALID_STATE_ERR:int = 11;
		public static const SECURITY_ERR:int = 18;
		public static const NETWORK_ERR:int = 19;
		public static const ABORT_ERR:int = 20;
		
		private var m_method:String;
		private var m_uri:String;
		private var m_async:Boolean;
		private var m_username:String;
		private var m_password:String;
		private var m_readyState:int;
		private var m_sendFlag:Boolean;
		private var m_errorFlag:Boolean;
		private var m_onreadystatechange:Function;
		private var m_tag:Object;
		private var m_request:URLRequest;
		private var m_loader:URLLoader;
		private var m_status:int;
		private var m_responseXML:XML;
		private var m_responseText:String;
		private var m_responseHeaders:Array;
		
		public function XMLHttpRequest() {
			m_readyState = UNSENT;
			m_async = false;
			m_sendFlag = false;
			m_errorFlag = false;
			m_tag = null;
			m_onreadystatechange = null;
			m_loader = null;
			m_request = null;
			m_status = 0;
			m_responseHeaders = null;
			m_responseText = null;
			m_responseXML = null;
		}
		
		public function get tag():Object {
			return m_tag;
		}
		
		public function set tag(o:Object):void {
			m_tag = o;
		}
		
		public function open(method:String, uri:String, async:Boolean = true, username:String = null, password:String = null):void {
			if(m_readyState != UNSENT) {
				abort();
			}
			m_method = method;
			m_uri = uri;
			m_async = async;
			m_username = username;
			m_password = password;
			m_loader = new URLLoader();
			m_loader.addEventListener(Event.COMPLETE, loader_completed);
			m_loader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, loader_securityError);
			m_loader.addEventListener(HTTPStatusEvent.HTTP_STATUS, loader_httpStatus);
			m_loader.addEventListener(IOErrorEvent.IO_ERROR, loader_ioError);
			m_request = new URLRequest(uri);
			m_request.method = m_method;
			m_readyState = OPENED;
			readyStateDidChange();
		}
		
		public function get requestMethod():String {
			if(m_readyState < OPENED) {
				return "";
			} else {
				return m_method;
			}
		}
		
		public function get requestURI():String {
			if(m_readyState < OPENED) {
				return "";
			} else {
				return m_uri;
			}
		}
		
		public function get readyState():int {
			return m_readyState;
		}
		
		public function get errorFlag():Boolean {
			return m_errorFlag;
		}
		
		public function get sendFlag():Boolean {
			return m_sendFlag;
		}
		
		public function setRequestHeader(h:String,v:String):void {
			if((m_readyState != OPENED) || m_sendFlag) {
				throw new Error("INVALID_STATE_ERR", INVALID_STATE_ERR);
			}
			if(h.toLowerCase() == "content-type") {
				m_request.contentType = v;
			} else {
				m_request.requestHeaders[h] = v;
			}
		}
		
		public function send(data:Object = null):void {
			if((m_readyState != OPENED) || m_sendFlag) {
				throw new Error("INVALID_STATE_ERR", INVALID_STATE_ERR);
			}
			m_sendFlag = true;
			m_loader.dataFormat = URLLoaderDataFormat.TEXT;
			if(data != null) {
				var text:String = null;
				if(data is String) {
					text = String(data);
				} else if(data is XML) {
					var x:XML = XML(data);
					text = x.toXMLString();
				} else if(data is URLVariables) {
					m_request.data = data;
				} else if(data is ByteArray) {
					m_request.data = data;
				} else {
					text = JSON.encode(data);
				}
				if(text != null){
					m_request.data = text;
				}
			}
			m_loader.load(m_request);
		}
		
		public function abort():void {
			m_errorFlag = true;
			if(m_loader != null) {
				try {
					m_loader.close();
				} catch(err:Error) {
				} finally {
					m_loader = null;
				}
			}
			if((m_readyState < DONE) && !m_sendFlag) {
				m_readyState = DONE;
				m_sendFlag = false;
				readyStateDidChange();
			}
			m_readyState = UNSENT;
		}
		
		public function get onreadystatechange():Function {
			return m_onreadystatechange;
		}

		public function set onreadystatechange(f:Function):void {
			m_onreadystatechange = f;
		}
		
		public function get status():int {
			if((m_readyState <= OPENED) || m_errorFlag) {
				return 0;
			} else if((m_readyState == DONE) && !m_errorFlag && (m_status == 0)) {
				return 200; // Flash is the stupidest thing I've ever seen: there is literally no way to get the status code
			} else {
				return m_status;
			}
		}
		
		public function get statusText():String {
			if((m_readyState <= OPENED) || m_errorFlag) {
				return "";
			} else {
				return ""; // there appears to be no way to get this
			}
		}

		public function getResponseHeader(h:String):String {
			if(m_responseHeaders != null) {
				var m:String = h.toLowerCase();
				var n:int = m_responseHeaders.length;
				for(var i:int = 0; i < n; ++i) {
					var rh:URLRequestHeader = m_responseHeaders[i];
					if(rh.name.toLowerCase() == m) {
						return rh.value;
					}
				}
			}
			return "";
		}

		public function get responseText():String {
			if(m_readyState < LOADING) {
				return "";
			} else {
				return String(m_loader.data);
			}
		}
		
		public function get responseXML():XML {
			if(m_readyState != DONE) {
				return null;
			} else if(m_responseXML == null) {
				m_responseXML = new XML(m_loader.data);
			}
			return m_responseXML;
		}
		
		private function readyStateDidChange():void {
			if(m_onreadystatechange != null) {
				m_onreadystatechange(this);
			}
		}
		
		private function loader_completed(ev:Event):void {
			m_readyState = DONE;
			readyStateDidChange();
		}
		
		private function loader_securityError(ev:SecurityErrorEvent):void {
			m_errorFlag = true;
			m_readyState = DONE;
			if(m_async) {
				readyStateDidChange();
			} else {
				throw new Error("SECURITY_ERR", SECURITY_ERR);
			}
		}
		
		private function loader_httpStatus(ev:HTTPStatusEvent):void {
			if(ev.status != 0) {
				m_status = ev.status;
			}
			m_responseHeaders = new Array(); // Dumb: there is no way to get the response headers
		}
		
		private function loader_ioError(ev:IOErrorEvent):void {
			m_errorFlag = true;
			m_readyState = DONE;
			if(m_status == 0) {
				switch(ev.errorID) {
					default:
						break;
					case 2032:
						m_status = 404; // best guess
						break;
				}
			}
			if(m_async) {
				readyStateDidChange();
			} else {
				throw new Error("NETWORK_ERR", NETWORK_ERR);
			}
		}
	}
}