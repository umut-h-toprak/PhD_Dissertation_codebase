<?php
set_time_limit(0);
ini_set('memory_limit', '4G');
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('memory_limit', '-1');
ob_start('ob_gzhandler');

$cohortName = $_GET['cohort'];
if (array_key_exists('REMOTE_USER', $_SERVER)) {
    $user = $_SERVER["REMOTE_USER"];
}else{
    $user = "superuser";
}
$suffixName = $_GET['suffix'];

$credentialsFile = new SplFileObject("../../episteme-resources/credentials","r");

$approvalStatus = false;
while (!$credentialsFile->eof()) {
    $lineChunks=explode("\t",rtrim($credentialsFile->fgets()));
    if($lineChunks[0]=="$cohortName"){
        foreach( $lineChunks as $usr ) {
            if($usr==$user){
                $approvalStatus=true;
                break;
            }
        }
        if($approvalStatus){
            break;
        }else{
            echo("ACCESS DENIED");
            die("ACCESS DENIED");
        }
    }
}
if(!$approvalStatus){
    echo("ACCESS DENIED");
    die("ACCESS DENIED");
}

//$tableToSearch= $_GET['tableToSearch'];
$blacklistedClassesRaw= $_GET['blacklistedClasses'];
$blacklistedClasses=[];
if($blacklistedClassesRaw!==""){
    $blacklistedClasses=explode(',',$blacklistedClassesRaw);
}
$mandatoryClassesRaw= $_GET['mandatoryClasses'];
$mandatoryClasses=[];
if($mandatoryClassesRaw!==""){
    $mandatoryClasses=explode(',',$mandatoryClassesRaw);
}


$db = new PDO('mysql:host=localhost;dbname=episteme',
    'episteme','epidb@dm',
    array(PDO::ATTR_EMULATE_PREPARES => false, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
);

$mandatoryStr="";
$blacklistedStr="";
if(!empty($blacklistedClasses)){
    if(!empty($mandatoryClasses)){
        $blacklistedStr="WHERE (";
    }else{
        $blacklistedStr="WHERE ";
    }
    for ($i = 0; $i < count($blacklistedClasses)-1; $i++) {
        $blacklistedStr = $blacklistedStr . $blacklistedClasses[$i] . " != 1 AND ";
    }
    $blacklistedStr = $blacklistedStr . $blacklistedClasses[count($blacklistedClasses)-1] . " != 1";
    if(!empty($mandatoryClasses)){
        $mandatoryStr=") AND (";
    }
}else{
    if(!empty($mandatoryClasses)){
        $mandatoryStr="WHERE (";
    }
}
if(!empty($mandatoryClasses)){
    for ($i = 0; $i < count($mandatoryClasses)-1; $i++) {
        $mandatoryStr = $mandatoryStr . $mandatoryClasses[$i] . " = 1 OR ";
    }
    $mandatoryStr = $mandatoryStr . $mandatoryClasses[count($mandatoryClasses)-1] . " = 1)";
}

$sql = "SELECT * FROM ".str_replace('-','$',$cohortName)."_"."$suffixName $blacklistedStr $mandatoryStr";

$statement=$db->prepare($sql);
$statement->execute();

$result = $statement->fetchAll(PDO::FETCH_ASSOC);

$db = null;
echo json_encode($result);