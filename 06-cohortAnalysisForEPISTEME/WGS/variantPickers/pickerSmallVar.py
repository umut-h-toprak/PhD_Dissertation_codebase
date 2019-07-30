#!/bin/python
from sys import argv,stderr, exit
from os import listdir
from os.path import exists

inputFolder=argv[1]
comparisonsInPrecedence=argv[2].split('.')
snvOrIndel=argv[3]

prefix="snvs_" if snvOrIndel=="SNV" else "indel_"
midfix="snvs" if snvOrIndel=="SNV" else "indels"

targetFiles="NA"
for comparison in comparisonsInPrecedence:
    comparisonPath=inputFolder+"/"+comparison
    if exists(comparisonPath):
        fileList=listdir(comparisonPath)
        if len(fileList)>0:
            for resultsFile in fileList:
                if resultsFile.endswith("_somatic_"+midfix+"_conf_8_to_10_blacklistRemoved_TiN_rescued_resorted.vcf.gz") and resultsFile.startswith(prefix):
                    targetFilePre=comparisonPath+"/"+resultsFile
                    #.replace('.vcf.gz','_vep.vcf.gz')
                    targetFiles='\t'.join([targetFilePre,
                                          targetFilePre.replace('.vcf.gz','.filtered.tsv.gz'),
                                          targetFilePre.replace('.vcf.gz','.filtered.rare.tsv.gz')])
                    print(targetFiles)
                    exit()
            for resultsFile in fileList:
                if resultsFile.endswith("_somatic_"+midfix+"_conf_8_to_10.vcf.gz") and resultsFile.startswith(prefix):
                    targetFilePre=comparisonPath+"/"+resultsFile
                    targetFiles='\t'.join([targetFilePre,
                                          targetFilePre.replace('.vcf.gz','.filtered.tsv.gz'),
                                          targetFilePre.replace('.vcf.gz','.filtered.rare.tsv.gz')])
                    print(targetFiles)
                    exit()
print("NA")