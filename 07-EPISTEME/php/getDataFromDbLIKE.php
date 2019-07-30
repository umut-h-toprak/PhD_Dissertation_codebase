<?php
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
$columnsToSelect = $_GET['columnsToSelect'];
$keyColumn = $_GET['keyColumn'];
$keysToSearchRaw= $_GET['keysToSearchRaw'];
$keysToSearch=explode(',',$keysToSearchRaw);
$placeholder = substr(str_repeat('?,',count($keysToSearch)),0,-1);
for ($i = 0; $i < count($keysToSearch); $i++) {
    $keysToSearch[$i]="%".$keysToSearch[$i]."%";
}

$db = new PDO('mysql:host=localhost;dbname=episteme',
    'episteme','epidb@dm',
    array(PDO::ATTR_EMULATE_PREPARES => false, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
);
$sql = "SELECT $columnsToSelect FROM `".str_replace('-','$',$cohortName)."_"."$suffixName` WHERE `$keyColumn` LIKE $placeholder";
$statement=$db->prepare($sql);
$statement->execute($keysToSearch);

$result = $statement->fetchAll(PDO::FETCH_ASSOC);

$db = null;
echo json_encode($result);