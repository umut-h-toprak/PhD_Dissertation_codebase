#!/bin/python
from sys import argv,stderr
from os import listdir
from os.path import exists

inputFolder=argv[1]
comparisonsInPrecedence=argv[2].split('.')

cnvFile="NA"

for comparison in comparisonsInPrecedence:
    comparisonPath=inputFolder+"/"+comparison
    if exists(comparisonPath):
        fileList=listdir(comparisonPath)
        if len(fileList)>0:
            for x in fileList:
                if "chosen_most_important_info" in x and x.endswith(".txt.gz"):
                    rootFile = comparisonPath + "/" +x
                    cnvFile='\t'.join([rootFile,rootFile+"_geneLevel.tsv.gz",rootFile+"_tadLevel.tsv.gz"])
                    break
print(cnvFile)
