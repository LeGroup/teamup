<?php
$log = fopen("log/teamup.log", 'a');
fwrite($log, date("r")." --- Testing connection:\n");
fwrite($log, $_GET['message'].'\n');
fclose($log); 

//...
$returnVars = array();
$returnVars['success'] = 'pong';
$returnString = http_build_query($returnVars);
echo $returnString;
?>
