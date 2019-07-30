<?php
header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('memory_limit', '-1');

function endsWith($masterString, $subString)
{
    return substr($masterString, -strlen($subString))===$subString;
}

if (array_key_exists('REMOTE_USER', $_SERVER)) {
    $user = $_SERVER["REMOTE_USER"];
}else{
    $user = "superuser";
}


$cohortName = $_GET['cohort'];
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
$credentialsFile = null;
$fileName = "../../episteme-resources/cohorts/".$cohortName."/".$cohortName."_".$suffixName."_EPISTEME.tsv";

if (!file_exists($fileName)) {
	die("MISSING FILE");
}


$file = new SplFileObject($fileName);

$dump = [];
$lineIndex = 0;
$header = [];

if($suffixName=="cohortInformation"){
    if (array_key_exists('REMOTE_USER', $_SERVER)) {
        $ipAndTime = $_SERVER["REMOTE_USER"]."\t". date('m/d/Y h:i:s a', time()) ."\t". $_SERVER['REMOTE_ADDR'] ."\t".$cohortName;
        file_put_contents("../../episteme-resources/access-log.txt", $ipAndTime . "\n", FILE_APPEND);
    }
}
while (!$file->eof()) {
	$line=rtrim($file->fgets());
	if(strlen($line)==0){
		break;
	}
    $lineChunks=explode("\t",$line);
    if($lineIndex==0){
        $header = $lineChunks;
    }else{
        $tmpObj = [];
        while( sizeof($lineChunks)<sizeof($header)) {
            #$lineChunks[sizeof($lineChunks)-1]="";
            $lineChunks[]="";
        }
        for( $i = 0; $i<sizeof($header); $i++ ) {
            $tmpObj[$header[$i]]=$lineChunks[$i];
        }
        $dump[] = $tmpObj;
    }
    ++$lineIndex;
}

echo(json_encode($dump));
$file = null;
