<?php
date_default_timezone_set('Europe/Helsinki');
$log = fopen("log/teamup.log", 'a');
if (getenv("HTTP_CLIENT_IP")) 
  $ip = getenv("HTTP_CLIENT_IP"); 
else if(getenv("HTTP_X_FORWARDED_FOR")) 
  $ip = getenv("HTTP_X_FORWARDED_FOR"); 
else if(getenv("REMOTE_ADDR")) 
  $ip = getenv("REMOTE_ADDR"); 
else 
  $ip = "UNKNOWN";
fwrite($log, date("r")." --- Incoming user photo: ".$ip."\n");
fwrite($log, strlen($_POST['picture'])." bytes.");

$base='uploads';
$picture = base64_decode($_POST['picture']);
$class_id = $_POST['class_id'];
$record_id = $_POST['record_id'];
$class_hash= md5($class_id);
$dir1=substr($class_hash, 0,2);

if (!file_exists($base.'/'.$dir1)) {
    mkdir($base.'/'.$dir1);
}
if (!file_exists($base.'/'.$dir1.'/'.$class_id)) {
    mkdir($base.'/'.$dir1.'/'.$class_id);
}
$pic_name=$base.'/'.$dir1.'/'.$class_id.'/'.$record_id.'_photo.jpg';
$fh=fopen($pic_name, 'w');
fwrite($fh, $picture);
fclose($fh); 

fwrite($log, "Wrote file ".$pic_name."\n");
fclose($log); 

echo $pic_name;
?>
