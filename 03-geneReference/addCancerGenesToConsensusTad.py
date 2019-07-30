#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Jan  3 22:03:49 2018

@author: umuttoprak
"""


from sys import argv,stderr
knownCancerGenes=set()
with open(argv[2]) as f:
    for line in f:
        knownCancerGenes.add(line.rstrip().split('\t')[0])

transcriptIdToGeneNameConversion=dict()
with open("ensemblTranscriptsToGeneNames.tsv") as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        transcriptIdToGeneNameConversion[lineChunks[0]]=lineChunks[1]

transcriptIdToGeneIdConversion=dict()
with open("ensemblTranscriptsToGeneIds.tsv") as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        transcriptIdToGeneIdConversion[lineChunks[0]]=lineChunks[1]


with open(argv[1]) as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        if len(lineChunks)!=6:
            lineChunks.append(".")
        cancerGenes=[transcriptIdToGeneIdConversion[x.split(';')[0]]+";"+x.split(';')[1] for x in lineChunks[-1].split(',') if x.split(';')[0] in transcriptIdToGeneNameConversion and transcriptIdToGeneNameConversion[x.split(';')[0]] in knownCancerGenes]
        cancerGenesFinalPre=','.join(cancerGenes)
        cancerGenesFinal=cancerGenesFinalPre
        if cancerGenesFinalPre == "":
            cancerGenesFinal="."
        lineChunks.append(cancerGenesFinal)
        if lineChunks[5]!='.':
            lineChunks[5]=','.join([transcriptIdToGeneIdConversion[x.split(';')[0]]+";"+x.split(';')[1] for x in lineChunks[5].split(',') if x.split(';')[0] in transcriptIdToGeneIdConversion])
        print(*lineChunks,sep='\t')