<?php
require_once("php/WookieConnectorService.php");
date_default_timezone_set('Europe/Helsinki');
$primary_server='http://localhost:8080/wookie/';  //'http://localhost:8080/wookie/'
$primary_api_key='JUKKA';
$secondary_server='http://localhost:8081/wookie/';
$secondary_api_key='TEST';
$widgetid='http://wookie.apache.org/widgets/teamup';
$shareddatakey= ($_REQUEST['shareddatakey']) ? $_REQUEST['shareddatakey'] : 'testi123';
$userid= ($_REQUEST['userid']) ? $_REQUEST['userid'] : '123123123';
$task= ($_REQUEST['task']) ? $_REQUEST['task'] : 'get_instance';


$primary_wookie = new WookieConnectorService($primary_server, $primary_api_key, $shareddatakey, $userid, $userid);
$secondary_wookie = new WookieConnectorService($secondary_server, $secondary_api_key, $shareddatakey, $userid, $userid);
$primary_wookie->setLogPath("log/");

$log = fopen("log/teamup.log", 'a');
fwrite($log, date("r")." --- ");

if ($task=='create_instance') {
    fwrite($log, "Creating class ".$shareddatakey." with userid ".$userid."\n");
    $widget=$primary_wookie->getInstance($widgetid);
    if ($widget) {
        fwrite($log, "Class already exists.\n");
        fclose($log);
        echo('reserved');
        return;
    } 
    $widget=$primary_wookie->getOrCreateInstance($widgetid);
    if ($widget) {
        fwrite($log, "Class instance created.\n");
    } else {
        fwrite($log, "Failed to create class instance.\n");
        echo('fail');
    }
    fclose($log);
    echo($widget->getURL());
    return;
} elseif ($task=='set_params') {
   fwrite($log, "Setting parameters to ".$shareddatakey." by userid ".$userid."\n");
   setcookie("userid", $userid, time()+60*60*24*30*3);
   $widget=$primary_wookie->getInstance($widgetid);
   if (!$widget) {
       fwrite($log, 'Failed to get widget instance.');
       fclose($log);
       echo('fail');
       return;
   }
   
   $propertyvalue=stripslashes($_POST['propertyvalue']);
   if ($propertyvalue=='') {
       fwrite($log, 'Broken propertystring given. Something was not serialized correctly.');
       fclose($log);
       echo('fail');
       return;
   }
   //$user=new User($userid, 'admin');
   //$primary_wookie->addParticipant($widget,$user);

   $prop=new Property('PARAMS', $propertyvalue, true); 
   //$prop=new Property('PARAMS', 'heijaa', true); 

   $primary_wookie->setProperty($widget,$prop);
   fwrite($log, "PARAMS set to ".$prop->getValue()."\n");
   $send_to=$_POST['moderator_email'];
   if ($send_to!='') {
       fwrite($log, 'Sending email to '.$send_to.' ...');
       $headers ='From: teamup.taik@gmail.com'."\r\n". 'Bcc: teamup.taik@gmail.com';
       if (mail($send_to, $_POST['msg_subject'], $_POST['msg_body'], $headers)) {
           fwrite($log, "Success\n");
       } else {
           fwrite($log, "Fail\n");
       }
   }
   fclose($log);
   echo('ok');
   return;
} elseif ($task=='get_instance') {
    fwrite($log, "Getting to class ".$shareddatakey." with userid ".$userid."\n");
    $widget=$primary_wookie->getInstance($widgetid);
    if ($widget) {
        fwrite($log, "<server1> Found class from new server.\n");
        fclose($log);
        echo($widget->getURL());
        return;
    } else {
        fwrite($log, "<server1> Didn't find class from new server.\n");
    } 
    $widget=$secondary_wookie->getOrCreateInstance($widgetid);
    if (!$widget) {
        fwrite($log, "<server2> couldn't reach old server.\n");
        fclose($log);
        echo('no server');
        return;
    }
    $prop=new Property('PARAMS','',true); 
    $prop=$secondary_wookie->getProperty($widget,$prop);
    if ($prop) {
        fwrite($log, "<server2> Found class from old server.\n");
        fclose($log);
        echo($widget->getURL());
        return;
    }
    fwrite($log, "Class not found in either server.\n");
    fclose($log);
    echo('not found'); 
    return;
}


?>
