#!/bin/python
from sys import argv,stderr
from os import listdir
from os.path import exists

inputFolder=argv[1]
comparisonsInPrecedence=argv[2].split('.')
mergedFile="NA"
for comparison in comparisonsInPrecedence:
    comparisonPath=inputFolder+"/"+comparison
    if exists(comparisonPath):
        fileList=listdir(comparisonPath)
        if len(fileList)>0:
            for resultsFile in fileList:
                # if resultsFile.endswith("sensitivefiltered_dedup.bedpe.gz"):
                if resultsFile.endswith("sensitivefiltered_dedup.bedpe.gz"):
                    mergedFile=comparisonPath+"/"+resultsFile
            break
print(mergedFile)
