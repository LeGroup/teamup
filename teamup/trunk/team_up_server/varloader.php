<?php
date_default_timezone_set('Europe/Helsinki');
$log = fopen("log/teamup.log", 'a');
fwrite($log, date("r")." --- Incoming newsflash:\n");
if (isset($_FILES['photo'])) {
    fwrite($log, $_FILES['photo']['size']." bytes.\n");
} else {
    fwrite($log, 'No photo with recording');
}
fwrite($log, $_FILES['voice']['size']." bytes.\n");
fwrite($log, "Error code:".$_FILES['photo']['error']."\n");

$base='uploads';
$audio = $_FILES['voice']['tmp_name'];
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
if (isset($_FILES['photo'])) {
    $picture = $_FILES['photo']['tmp_name'];
    $pic_name=$base.'/'.$dir1.'/'.$class_id.'/'.$record_id.'_pic.jpg';
    move_uploaded_file($picture, $pic_name);
    fwrite($log, "Wrote file ".$pic_name."\n");
}
$aud_name=$base.'/'.$dir1.'/'.$class_id.'/'.$record_id.'_rec.mp3';
move_uploaded_file($audio, $aud_name);
fwrite($log, "Wrote file ".$aud_name."\n");
fclose($log);
echo $base.'/'.$dir1.'/'.$class_id.'/'.$record_id;
?>
