package com.smarttech.response.teamup {
	public class Student {
		private var m_familyName:String;
		private var m_givenName:String;
		private var m_studentId:String;
		private var m_clickerNumber:int;
		private var m_studentNumber:String;
		private var m_choice:int;
		private static var g_clickerNumber:int = 0;
		
		private function getStudentInfo_readyStateChanged(req:XMLHttpRequest):void {
			if(req.readyState != XMLHttpRequest.DONE) {
				return;
			} else if(req.errorFlag || (req.status < 200 || req.status > 299)) {
				return;
			} else {
				var rdf:Namespace = NS.rdf;
				var senteo:Namespace = NS.senteo;
				var RDF:XML = req.responseXML;
				for each(var n:XML in RDF.rdf::Description.senteo::number) {
					m_studentNumber = String(n);
					break;
				}
			}
		}
		
		private function getStudentNumber():void {
			var req:XMLHttpRequest = new XMLHttpRequest();
			req.open("GET", "http://localhost:23456/senteo/builtins/teachers/GetStudentInfo?student=urn:com.smarttech.senteo:" + m_studentId);
			req.onreadystatechange = getStudentInfo_readyStateChanged;
			req.send();
		}
		public function Student(student:XML = null) {
			if(student != null) {
				m_familyName = String(student.@family);
				m_givenName = String(student.@given);
				m_studentId = String(student.@studentid);
				m_clickerNumber = ++g_clickerNumber;
				getStudentNumber();
			}
		}
		
		public function get familyName():String {
			return m_familyName;
		}
		
		public function set familyName(s:String):void {
			m_familyName = s;
		}
		
		public function get givenName():String {
			return m_givenName;
		}
		
		public function set givenName(s:String):void {
			m_givenName = s;
		}
		
		public function get studentId():String {
			return m_studentId;
		}
		
		public function set studentId(s:String):void {
			m_studentId = s;
		}
		
		public function get clickerNumber():int {
			return m_clickerNumber;
		}
		
		public function set clickerNumber(i:int):void {
			m_clickerNumber = i;
		}
		
		public function get choice():int {
			return m_choice;
		}
		
		public function set choice(i:int):void {
			m_choice = i;
		}
		
		public function get studentNumber():String {
			return m_studentNumber;
		}
		
		public function set studentNumber(s:String):void {
			m_studentNumber = s;
		}
		
		public function get monogram():String {
			if((m_studentNumber != null) && (m_studentNumber != "")) {
				return m_studentNumber;
			} else if((m_givenName != null) && (m_givenName != "")) {
				return m_givenName;
			} else {
				return String(m_clickerNumber);
			}
		}
	}
}