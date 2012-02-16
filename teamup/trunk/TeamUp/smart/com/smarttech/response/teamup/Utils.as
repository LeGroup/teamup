package com.smarttech.response.teamup {
	public class Utils {
		public static function isspace(n:int):Boolean {
			return ((n == 0x20 /* SPACE */) || (n == 0xA /* LINE FEED */) || (n == 8 /* TAB */) || (n == 0xD /* CARRIAGE RETURN */) || (n == 9 /* FORM FEED */) || (n == 0xA0 /* NON-BREAKING SPACE */));
		}
		public static function trim(s:String):String {
			if(s == null) {
				return "";
			}
			var q:String = "";
			var sn:int = s.length;
			var start:int = 0;
			var end:int = sn;
			for(; start < sn; ++start) {
				if(!isspace(s.charCodeAt(start))) {
					break;
				}
			}
			for(; end > start; --end) {
				if(!isspace(s.charCodeAt(end - 1))) {
					break;
				}
			}
			if(end <= start) {
				return "";
			} else if((start == 0) && (end == sn)) {
				return s;
			} else {
				return s.slice(start, end);
			}
		}
		public static function parseBool(s:String):Boolean {
			var q:String = trim(s).toLowerCase();
			return !((q == "") || (q == "0") || (q == "false") || (q == "no"));
		}
		
		private static var g_newid:String = null;
		private static var g_nextid:int = 0;
		private static function newid_readyStateChanged(req:XMLHttpRequest):void {
			if((req.readyState == XMLHttpRequest.DONE) && !req.errorFlag && (req.status >= 200) && (req.status < 300)) {
				g_newid = req.responseText;
				g_nextid = 0;
			}
		}
		public static function newid(prefix:String):String {
			if(g_newid == null) {
				var req:XMLHttpRequest = new XMLHttpRequest();
				req.open("GET", "http://localhost:23456/senteo/builtins/anyone/newid");
				req.onreadystatechange = newid_readyStateChanged;
				req.send();
				return null;
			} else {
				var i:int = ++g_nextid;
				return prefix + g_newid + "." + i;
			}
		}
	}
}