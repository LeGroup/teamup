<?php
require_once("php/WookieConnectorService.php");
date_default_timezone_set('Europe/Helsinki');
$server='http://mlab310-197.uiah.fi:8080/wookie/';
$api_key='TEST';
$widgetid='http://wookie.apache.org/widgets/teamup';
$shareddatakey= ($_REQUEST['shareddatakey']) ? $_REQUEST['shareddatakey'] : 'testi123';
$userid= ($_REQUEST['userid']) ? $_REQUEST['userid'] : '123123123';
$task= ($_REQUEST['task']) ? $_REQUEST['task'] : 'get_instance';

$wookie = new WookieConnectorService($server, $api_key, $shareddatakey, $userid, $userid);
$log = fopen("log/teamup.log", 'a');
fwrite($log, date("r")." --- ");

if ($task=='create_instance') {
    fwrite($log, "Creating class ".$shareddatakey." with userid ".$userid."\n");
    $widget=$wookie->getOrCreateInstance($widgetid);
    $prop=new Property('PARAMS','',true); 
    $prop=$wookie->getProperty($widget,$prop);
    if ($prop) {
        fwrite($log, "Class already exists.\n");
        fclose($log);
        echo('reserved');
        return;
    } 
    fwrite($log, "Class instance created.\n");
    fclose($log);
    echo($widget->getURL());
    return;
} elseif ($task=='set_params') {
   fwrite($log, "Setting parameters to ".$shareddatakey." by userid ".$userid."\n");
   setcookie("userid", $userid, time()+60*60*24*30*3);
   $widget=$wookie->getOrCreateInstance($widgetid);
   $propertyvalue=stripslashes($_POST['propertyvalue']);
   if ($propertyvalue=='') {
       fwrite($log, 'Broken propertystring given. Something was not serialized correctly.');
       fclose($log);
       echo('fail');
       return;
   }
   $prop=new Property('PARAMS', $propertyvalue, true); 
   $wookie->setProperty($widget,$prop);
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
    $widget=$wookie->getOrCreateInstance($widgetid);
    $prop=new Property('PARAMS','',true); 
    $prop=$wookie->getProperty($widget,$prop);
    if ($prop) {
        fwrite($log, "Found class.\n");
        fclose($log);
        echo($widget->getURL());
        return;
    }
    fwrite($log, "Class not found.\n");
    fclose($log);
    echo('not found'); 
    return;
}


?>