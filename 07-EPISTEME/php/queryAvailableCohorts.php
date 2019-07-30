<?php
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);

if (array_key_exists('REMOTE_USER', $_SERVER)) {
    $user = $_SERVER["REMOTE_USER"];
}else{
    $user = "superuser";
}
$credentialsFile = new SplFileObject("../../episteme-resources/credentials","r");
$validCohorts=[];
while (!$credentialsFile->eof()) {
    $lineChunks=explode("\t",rtrim($credentialsFile->fgets()));
    foreach($lineChunks as $usr ) {
        if($usr==$user){
            $validCohorts[]=$lineChunks[0];
            break;
        }
    }
}
echo(json_encode($validCohorts));
$credentialsFile = null;