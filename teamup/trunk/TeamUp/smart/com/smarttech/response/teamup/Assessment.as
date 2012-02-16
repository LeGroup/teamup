package com.smarttech.response.teamup {
	import flash.events.TimerEvent;
	import flash.utils.ByteArray;
	import flash.utils.Timer;

	public class Assessment {
		public static const STOPPED:int = 0;
		public static const STARTING:int = 1;
		public static const STARTED:int = 2;
		public static const STOPPING:int = 3;
		private var m_class:ActivatedClass;
		private var m_choices:int;
		private var m_assessmentId:String;
		private var m_questionId:String;
		private var m_status:int;
		private var m_onstatuschange:Function;
		private var m_onsubmit:Function;
		private var m_timer:Timer;
		private var m_polling:int = 0;
		private var m_pulled:Array;
		private var m_tag:Object;
		private static const TIMER_INTERVAL:Number = 1800;
		
		public function Assessment(ac:ActivatedClass,choices:int) {
			m_class = ac;
			m_choices = choices;
			m_assessmentId = Utils.newid("assessment.");
			m_questionId = Utils.newid("question.");
			m_status = STOPPED;
		}
		
		public function get tag():Object {
			return m_tag;
		}
		
		public function set tag(o:Object):void {
			m_tag = o;
		}
		
		public function get status():int {
			return m_status;
		}
		
		public function get onstatuschange():Function {
			return m_onstatuschange;
		}
		
		public function set onstatuschange(f:Function):void {
			m_onstatuschange = f;
		}

		public function get onsubmit():Function {
			return m_onsubmit;
		}
		
		public function set onsubmit(f:Function):void {
			m_onsubmit = f;
		}

		private function stopped():void {
			m_status = STOPPED;
			if(m_onstatuschange != null) {
				m_onstatuschange(this);
			}
		}

		private function timer_timer(ev:TimerEvent):void {
			++m_polling;
			if(m_polling == 1) {
				poll();
			}
		}
		
		private function activate_readyStateChanged(req:XMLHttpRequest):void {
			if(req.readyState != XMLHttpRequest.DONE) {
				return;
			} else if((req.status >= 200) && (req.status < 300) && !req.errorFlag) {
				m_status = STARTED;
				if(m_onstatuschange != null) {
					m_onstatuschange(this);
				}
				m_timer = new Timer(TIMER_INTERVAL);
				m_timer.addEventListener(TimerEvent.TIMER, timer_timer);
				m_timer.start();
			} else {
				stopped();
			}
		}
		
		private function activate():void {
			var req:XMLHttpRequest = new XMLHttpRequest();
			req.open("POST", "http://localhost:23456/senteo/builtins/teachers/activateassessment?id=" + m_assessmentId);
			req.onreadystatechange = activate_readyStateChanged;
			req.send();
		}

		private function add_readyStateChanged(req:XMLHttpRequest):void {
			if(req.readyState != XMLHttpRequest.DONE) {
				return;
			} else if((req.status >= 200) && (req.status < 300) && !req.errorFlag) {
				activate();
			} else {
				stopped();
			}
		}
		

		private function add():void {
			m_status = STARTING;
			if(m_onstatuschange != null) {
				m_onstatuschange(this);
			}
			var inputId:String = Utils.newid("input.");
			var questionUri:String = "urn:com.smarttech.response.teamup:" + m_questionId;
			var assessmentUri:String = "urn:com.smarttech.senteo:" + m_assessmentId;
			var inputUri:String = "urn:com.smarttech.response.teamup:" + inputId;
			var teamup:XML = <t:teamup senteo:classid={m_class.classId} senteo:assessmentid={m_assessmentId} xlink:href={m_class.href} xmlns:t="http://teamup.aalto.fi" xmlns:senteo="http://www.smarttech.com/2008/senteo/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xlink="http://www.w3.org/1999/xlink">
				<senteo:assessment  senteo:resourceid={questionUri} senteo:titlepage="true" xml:id={m_assessmentId}>
					<senteo:presentations senteo:mimetype="text/plain">
						<senteo:presentation senteo:resourceid={questionUri}>
							<senteo:content>Choose a TeamUp topic!</senteo:content>
							<senteo:presentation senteo:resourceid={inputUri}>
								<senteo:content>Students enter their choice here</senteo:content>
							</senteo:presentation>
						</senteo:presentation>
					</senteo:presentations>
					<senteo:questions>
						<senteo:question senteo:points="0" senteo:questionnumber="1" senteo:resourceid={questionUri} senteo:supported="" xml:id={m_questionId}>
							<senteo:input senteo:resourceid={inputUri} xml:id={inputId} />
						</senteo:question>
					</senteo:questions>
				</senteo:assessment>
				<rdf:RDF>
					<rdf:Description rdf:nodeID="answer">
						<senteo:maximumvalue />
						<senteo:minimumvalue />
						<senteo:points>0</senteo:points>
					</rdf:Description>
					<rdf:Description rdf:about={inputUri}>
						<rdf:type rdf:resource="http://www.smarttech.com/2008/notebook/Annotation" />
						<senteo:assessmentrole>http://www.smarttech.com/2008/senteo/assessmentrole#input</senteo:assessmentrole>
					</rdf:Description>
					<rdf:Description rdf:about={questionUri}>
						<rdf:type rdf:resource="http://www.smarttech.com/2008/notebook/Page" />
						<senteo:assessmentrole>http://www.smarttech.com/2008/senteo/assessmentrole#frontmatter</senteo:assessmentrole>
						<senteo:assessmentrole>http://www.smarttech.com/2008/senteo/assessmentrole#question</senteo:assessmentrole>
						<senteo:questionformat>http://www.smarttech.com/2008/senteo/questionformat#decimal</senteo:questionformat>
						<senteo:assessmenttypetitle>TeamUp Poll</senteo:assessmenttypetitle>
						<senteo:displayaverage>://www.smarttech.com/2008/senteo/classAverageFeedback#never</senteo:displayaverage>
						<senteo:feedback>http://www.smarttech.com/2008/senteo/feedback#show-after-assessment-deactivated</senteo:feedback>
						<senteo:remembernames>true</senteo:remembernames>
						<senteo:answer rdf:nodeID="answer" />
						<dc:title>TeamUp Vote</dc:title>
						<senteo:note />
						<senteo:topic />
						<dc:subject />
					</rdf:Description>
					<rdf:Description rdf:about={assessmentUri}>
						<rdf:type rdf:resource="http://www.smarttech.com/2008/senteo/Assessment" />
						<senteo:assessmentrole>http://www.smarttech.com/2008/senteo/assessmentrole#assessment</senteo:assessmentrole>
						<senteo:feedback>http://www.smarttech.com/2008/senteo/feedback#show-after-assessment-deactivated</senteo:feedback>
						<senteo:displaycorrect>http://www.smarttech.com/2008/senteo/correctAnswerFeedback#never</senteo:displaycorrect>
						<senteo:displayaverage>http://www.smarttech.com/2008/senteo/classAverageFeedback#never</senteo:displayaverage>
					</rdf:Description>
				</rdf:RDF>
			</t:teamup>;
			var req:XMLHttpRequest = new XMLHttpRequest();
			req.open("POST", "http://localhost:23456/senteo/plugins/teachers/TeamUp");
			req.onreadystatechange = add_readyStateChanged;
			req.send(teamup);
		}

		public function start():void {
			if(m_status != STOPPED) {
				throw new Error("INVALID_STATE_ERR", XMLHttpRequest.INVALID_STATE_ERR);
			}
			m_status = STARTING;
			add();
		}

		public function stop():void {
			if(m_status != STARTING) {
				throw new Error("INVALID_STATE_ERR", XMLHttpRequest.INVALID_STATE_ERR);
			}
			m_status = STOPPING;
			if(m_onstatuschange != null) {
				m_onstatuschange(this);
			}
			m_timer.stop();
			deactivate();
		}
		
		public function pull():Array {
			var a:Array = m_pulled;
			m_pulled = null;
			return a;
		}
		
		private function poll_readyStateChanged(req:XMLHttpRequest):void {
			if(req.readyState != XMLHttpRequest.DONE) {
				return;
			} else if(req.errorFlag || (req.status < 200) || (req.status >= 300)) {
				m_timer.stop();
				stopped();
			} else {
				var senteo:Namespace = NS.senteo;
				for each(var submission:XML in req.responseXML.senteo::submissions.senteo::submission) {
					for each(var response:XML in submission.senteo::response) {
						if(String(response.@senteo::questionid) == m_questionId) {
							var val:String = String(response);
							if(val != "") {
								var choice:Number = Number(val);
								if(choice != choice) {
									choice = 0;
								} else {
									choice = Math.round(choice);
								}
								if(choice < 0) {
									choice = 0;
								} else if(choice > m_choices) {
									choice = m_choices;
								}
								var student:Student = m_class.studentWithId(String(submission.@senteo::studentid));
								if(student != null) {
									continue;
								}
								if(choice != student.choice) {
									student.choice = choice;
									if(m_pulled == null) {
										m_pulled = new Array();
										m_pulled.push(student);
									} else if(m_pulled.indexOf(student) == -1) {
										m_pulled.push(student);
									}
								}
							}
						}
					}
				}
				if((m_pulled != null) && (m_onsubmit != null)) {
					m_onsubmit(this);
				}
				if(m_status != STOPPING) {
					--m_polling;
					if(m_polling > 0) {
						m_polling = 1;
						poll();
					}
				} else {
					stopped();
				}
			}
		}

		private function poll():void {
			var req:XMLHttpRequest = new XMLHttpRequest();
			req.open("GET", "http://localhost:23456/senteo/database/" + m_class.href + "/" + m_assessmentId);
			req.onreadystatechange = poll_readyStateChanged;
			req.send();			
		}
		
		private function deactivate_readyStateChanged(req:XMLHttpRequest):void {
			if(req.readyState != XMLHttpRequest.DONE) {
				return;
			} else {
				poll(); // one more time
			}
		}
		
		private function deactivate():void {
			var req:XMLHttpRequest = new XMLHttpRequest();
			req.open("POST", "http://localhost:23456/senteo/builtins/teachers/deactivateassessment&id=" + m_assessmentId + "&class=" + m_class.classId);
			req.onreadystatechange = deactivate_readyStateChanged;
			req.send();
		}
	}
}