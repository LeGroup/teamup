package com.smarttech.response.teamup {
	public class ActivatedClass {
		public static const DISCONNECTED:int = 0;
		public static const CONNECTING:int = 1;
		public static const CONNECTED:int = 2;
		private var m_status:int = 0;
		private var m_classId:String;
		private var m_students:Array;
		private var m_href:String;
		private var m_onstatuschange:Function;
		private var m_tag:Object;
		
		private function gradebooks_readyStateChanged(req:XMLHttpRequest):void {
			if(req.readyState != XMLHttpRequest.DONE) {
				return;
			} else if((req.status < 200) || (req.status >= 300) || req.errorFlag) {
				disconnected();
				return;
			} else {
				var senteo:Namespace = NS.senteo;
				var xlink:Namespace = NS.xlink;
				for each(var gradebook:XML in req.responseXML.senteo::gradebook) {
					if(String(gradebook.senteo::classref.@senteo::classid) == m_classId) {
						m_href = String(gradebook.xlink::href);
						break;
					}
				}
				if(m_href == null) {
					disconnected();
					return;
				} else {
					m_status = CONNECTED;
					if(m_onstatuschange != null) {
						m_onstatuschange(this);
					}
				}
			}
		}
		
		public function ActivatedClass() {
			m_students = new Array();
		}
		
		public function get onstatuschange():Function {
			return m_onstatuschange;
		}
		
		public function set onstatuschange(f:Function):void {
			m_onstatuschange = f;
		}
		
		private function disconnected():void {
			m_status = DISCONNECTED;
			if(m_onstatuschange != null) {
				m_onstatuschange(this);
			}
		}
		
		public function get tag():Object {
			return m_tag;
		}
		
		public function set tag(o:Object):void {
			m_tag = o;
		}
		
		public function connect():void {
			m_status = CONNECTING;
			if(m_onstatuschange != null) {
				m_onstatuschange(this);
			}
			var req:XMLHttpRequest = new XMLHttpRequest();
			req.open("GET", "http://localhost:23456/senteo/scripts/teachers/getActivatedClassInfo.js");
			req.onreadystatechange = getAllClassesDetails_readyStateChanged;
			req.send();
		}
		
		private function getAllClassesDetails_readyStateChanged(req:XMLHttpRequest):void {
			if(req.readyState != XMLHttpRequest.DONE) {
				return;
			} else if(req.errorFlag || (req.status < 200 || req.status > 299)) {
				disconnected();
				return;
			}
			var activatedclass:XML = req.responseXML;
			var activated:Boolean = Utils.parseBool(String(activatedclass.@activated));
			if(!activated) {
				disconnected();
				return;
			}
			m_classId = String(activatedclass.@classid);
			for each(var student:XML in activatedclass.students.student) {
				m_students.push(new Student(student));
			}
			var req:XMLHttpRequest = new XMLHttpRequest();
			req.open("GET", "http://localhost:23456/senteo/database/index.xml/gradebooks");
			req.onreadystatechange = gradebooks_readyStateChanged;
			req.send();
		}
		
		public function get status():int {
			return m_status;
		}
		
		public function disconnect():void {
			// intentionally a no-op
			disconnected();
		}
		
		public function get classId():String {
			return m_classId;
		}
		
		public function get students():Array {
			return m_students;
		}
		
		public function studentWithId(studentId:String):Student {
			for each(var student:Student in m_students) {
				if(student.studentId == studentId) {
					return student;
				}
			}
			return null;
		}
		
		public function get href():String {
			return m_href;
		}
	}
}