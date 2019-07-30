#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Jan  3 22:03:49 2018

@author: umuttoprak
"""

allTypes={"3prime_overlapping_ncRNA",
"antisense_RNA",
"bidirectional_promoter_lncRNA",
"IG_C_gene",
"IG_C_pseudogene",
"IG_D_gene",
"IG_J_gene",
"IG_J_pseudogene",
"IG_pseudogene",
"IG_V_gene",
"IG_V_pseudogene",
"lincRNA",
"macro_lncRNA",
"miRNA",
"misc_RNA",
"Mt_rRNA",
"Mt_tRNA",
"non_coding",
"retained_intron",
"polymorphic_pseudogene",
"processed_pseudogene",
"processed_transcript",
"protein_coding",
"pseudogene",
"rRNA",
"scRNA",
"sense_intronic",
"sense_overlapping",
"snoRNA",
"snRNA",
"TEC",
"transcribed_processed_pseudogene",
"transcribed_unitary_pseudogene",
"transcribed_unprocessed_pseudogene",
"translated_processed_pseudogene",
"TR_C_gene",
"TR_D_gene",
"TR_J_gene",
"TR_J_pseudogene",
"TR_V_gene",
"TR_V_pseudogene",
"unitary_pseudogene",
"unprocessed_pseudogene",
"vaultRNA"}


validTypes={
"IG_C_gene",
"IG_C_pseudogene",
"IG_D_gene",
"IG_J_gene",
"IG_J_pseudogene",
"IG_pseudogene",
"IG_V_gene",
"IG_V_pseudogene",
"lincRNA",
"macro_lncRNA",
"miRNA",
"polymorphic_pseudogene",
"processed_pseudogene",
"unprocessed_pseudogene",
"protein_coding",
"transcribed_processed_pseudogene",
"transcribed_unitary_pseudogene",
"transcribed_unprocessed_pseudogene",
"translated_processed_pseudogene",
"TR_C_gene",
"TR_D_gene",
"TR_J_gene",
"TR_J_pseudogene",
"TR_V_gene",
"TR_V_pseudogene"}

invalidTypes=allTypes-validTypes

proteinCodingTypes={
"IG_C_gene",
"IG_C_pseudogene",
"IG_D_gene",
"IG_J_gene",
"IG_J_pseudogene",
"IG_pseudogene",
"IG_V_gene",
"IG_V_pseudogene",
"protein_coding",
"TR_C_gene",
"TR_D_gene",
"TR_J_gene",
"TR_J_pseudogene",
"TR_V_gene",
"TR_V_pseudogene"}

geneTypesConversion=dict()
with open("vocabGeneTypes.tsv") as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        geneTypesConversion[lineChunks[0]]=lineChunks[1]
        geneTypesConversion[lineChunks[0]]=lineChunks[0]

from sys import argv,stderr
knownCancerGenes=set()
with open(argv[2]) as f:
    for line in f:
        strippedId=line.rstrip().split('\t')[0][::-1]
        while len(strippedId)<11:
            strippedId+="0"
        fullId="ENSG"+strippedId[::-1]
        print(fullId,file=stderr)
        knownCancerGenes.add(fullId)

apprisScores={
        "appris_principal":0,
        "appris_principal_1":1,
        "appris_principal_2":2,
        "appris_principal_3":3,
        "appris_principal_4":4,
        "appris_principal_5":5,
        "appris_candidate_longest":6,
        "appris_candidate":7,
        "appris_alternative_1":8,
        "appris_alternative_2":9,
        "":10,
        }

class Transcript:
    def __init__(self,geneName,geneId,geneType,transcriptName,transcriptId,transcriptType,strand,apprisTag,transcriptSupportLevel,alternativeTranscript,level):
        self.exons=list()
        self.introns=list()
        self.geneId=geneId
        self.transcriptId=transcriptId
        self.transcriptName=geneName+"|"+transcriptName.split(geneName)[1]
        self.transcriptType=transcriptType
        self.geneName=geneName
        self.strand=strand
        self.apprisScore=apprisScores[apprisTag]
        self.transcriptSupportLevel=10 if transcriptSupportLevel=="NA" else int(transcriptSupportLevel)
        self.alternativeTranscript=alternativeTranscript
        self.level=level
        self.cancerStatus="cancer" if self.geneId in knownCancerGenes else "."
    def addExon(self,startPos,endPos,exonNumber):
        self.exons.append([startPos,endPos,exonNumber])
        if exonNumber==1:
            self.addPromoterDummyExon(startPos,endPos)
    def addPromoterDummyExon(self,startPos,endPos):
        dummyStart=-1
        dummyEnd=-1
        if self.strand=="-":
            dummyStart=endPos+1
            dummyEnd=dummyStart+5000
        else:
            dummyEnd=startPos-1
            dummyStart=max(1,dummyEnd-5000)
        self.addExon(dummyStart,dummyEnd,0)
    def _createIntrons(self):
        if len(self.exons)<3:
            return
        self.exons.sort(key=lambda x: x[2])
        for i in range(1,len(self.exons)-1):
            intronStart=-1
            intronEnd=-1
            if self.strand=="+":
                intronStart=self.exons[i][1]
                intronEnd=self.exons[i+1][0]
            else:
                intronStart=self.exons[i+1][1]
                intronEnd=self.exons[i][0]
            if intronEnd-intronStart>1:
                self.introns.append([intronStart+1,intronEnd-1,i])
    def printTranscript(self):
        self._createIntrons()
        for exon in self.exons:
            exonName=self.transcriptId+"_exon"+str(exon[2]) if exon[2]!=0 else self.transcriptId+"_5kbPromoter"
            print(self.chromosome,exon[0],exon[1],self.geneId+";"+geneTypesConversion[self.transcriptType],exonName+";"+geneTypesConversion[self.transcriptType],self.transcriptType,".",self.cancerStatus,sep='\t')
            if exon[2]!=0:
                print(self.chromosome,max(1,exon[0]-3),exon[1]+3,self.geneId+";"+geneTypesConversion[self.transcriptType],exonName+";"+geneTypesConversion[self.transcriptType],self.transcriptType,"pad3",self.cancerStatus,sep='\t')
        for intron in self.introns:
            intronName=self.transcriptId+"_intron"+str(intron[2])
            print(self.chromosome,intron[0],intron[1],self.geneId+";"+geneTypesConversion[self.transcriptType],intronName+";"+geneTypesConversion[self.transcriptType],self.transcriptType,".",self.cancerStatus,sep='\t')

from gzip import open as gzopen

geneDb=dict()

transcriptIdToTranscriptNameConversion=dict()
geneIdToGeneNameConversion=dict()
transcriptIdToGeneNameConversion=dict()
transcriptIdToGeneIdConversion=dict()
with gzopen(argv[1],'rt') as f:
    print(2,89156672,90274235,"ENSG99999999998;"+geneTypesConversion["IG_locus"]+",ENSG99999999998;"+geneTypesConversion["IG_locus"]+",IG_locus","gene","cancer",sep='\t')
    print(14,106053224,107288019,"ENSG99999999999;"+geneTypesConversion["IG_locus"]+",ENSG99999999999;"+geneTypesConversion["IG_locus"]+",IG_locus","gene","cancer",sep='\t')
    print(22,22380474,23265203,"ENSG99999999997;"+geneTypesConversion["IG_locus"]+",ENSG99999999997;"+geneTypesConversion["IG_locus"]+",IG_locus","gene","cancer",sep='\t')
    print(7,38279180,38407770,"ENSG99999999994;"+geneTypesConversion["TR_locus"]+",ENSG99999999994;"+geneTypesConversion["TR_locus"]+",TR_locus","gene","cancer",sep='\t')    
    print(7,142000746,142511084,"ENSG99999999993;"+geneTypesConversion["TR_locus"]+",ENSG99999999993;"+geneTypesConversion["TR_locus"]+",TR_locus","gene","cancer",sep='\t')    
    print(9,33617759,33638492,"ENSG99999999995;"+geneTypesConversion["TR_locus"]+",ENSG99999999995;"+geneTypesConversion["TR_locus"]+",TR_locus","gene","cancer",sep='\t')    
    print(14,22089990,23021097,"ENSG99999999996;"+geneTypesConversion["TR_locus"]+",ENSG99999999996;"+geneTypesConversion["TR_locus"]+",TR_locus","gene","cancer",sep='\t')
    
    print(2,89156672,90274235,"ENSG99999999998;"+geneTypesConversion["IG_locus"]+",ENSG99999999998;"+geneTypesConversion["IG_locus"]+",IG_locus","geneCoding","cancer",sep='\t')
    print(14,106053224,107288019,"ENSG99999999999;"+geneTypesConversion["IG_locus"]+",ENSG99999999999;"+geneTypesConversion["IG_locus"]+",IG_locus","geneCoding","cancer",sep='\t')
    print(22,22380474,23265203,"ENSG99999999997;"+geneTypesConversion["IG_locus"]+",ENSG99999999997;"+geneTypesConversion["IG_locus"]+",IG_locus","geneCoding","cancer",sep='\t')
    print(7,38279180,38407770,"ENSG99999999994;"+geneTypesConversion["TR_locus"]+",ENSG99999999994;"+geneTypesConversion["TR_locus"]+",TR_locus","geneCoding","cancer",sep='\t')    
    print(7,142000746,142511084,"ENSG99999999993;"+geneTypesConversion["TR_locus"]+",ENSG99999999993;"+geneTypesConversion["TR_locus"]+",TR_locus","geneCoding","cancer",sep='\t')    
    print(9,33617759,33638492,"ENSG99999999995;"+geneTypesConversion["TR_locus"]+",ENSG99999999995;"+geneTypesConversion["TR_locus"]+",TR_locus","geneCoding","cancer",sep='\t')    
    print(14,22089990,23021097,"ENSG99999999996;"+geneTypesConversion["TR_locus"]+",ENSG99999999996;"+geneTypesConversion["TR_locus"]+",TR_locus","geneCoding","cancer",sep='\t')
    
    print(2,89156672,90274235,"ENSG99999999998;"+geneTypesConversion["IG_locus"]+",ENSG99999999998;"+geneTypesConversion["IG_locus"]+",IG_locus",".","cancer",sep='\t')
    print(14,106053224,107288019,"ENSG99999999999;"+geneTypesConversion["IG_locus"]+",ENSG99999999999;"+geneTypesConversion["IG_locus"]+",IG_locus",".","cancer",sep='\t')
    print(22,22380474,23265203,"ENSG99999999997;"+geneTypesConversion["IG_locus"]+",ENSG99999999997;"+geneTypesConversion["IG_locus"]+",IG_locus",".","cancer",sep='\t')
    print(7,38279180,38407770,"ENSG99999999994;"+geneTypesConversion["TR_locus"]+",ENSG99999999994;"+geneTypesConversion["TR_locus"]+",TR_locus",".","cancer",sep='\t')    
    print(7,142000746,142511084,"ENSG99999999993;"+geneTypesConversion["TR_locus"]+",ENSG99999999993;"+geneTypesConversion["TR_locus"]+",TR_locus",".","cancer",sep='\t')    
    print(9,33617759,33638492,"ENSG99999999995;"+geneTypesConversion["TR_locus"]+",ENSG99999999995;"+geneTypesConversion["TR_locus"]+",TR_locus",".","cancer",sep='\t')    
    print(14,22089990,23021097,"ENSG99999999996;"+geneTypesConversion["TR_locus"]+",ENSG99999999996;"+geneTypesConversion["TR_locus"]+",TR_locus",".","cancer",sep='\t')
    
    for line in f:
        if line[0]=="#":
            continue
        lineChunks=line.rstrip().split('\t')
        entryType=lineChunks[2]
        if entryType not in {"exon","gene","transcript"}:
            continue
        infoChunks=lineChunks[8].split(';')
        invalidLine = False
        chromosome=lineChunks[0].lstrip("chr")
        startPos=int(lineChunks[3])
        endPos=int(lineChunks[4])
        strand=lineChunks[6]
        
        geneId=""
        geneName=""
        transcriptName=""
        transcriptId=""
        transcriptType=""
        apprisTag=""
        transcriptSupportLevel="NA"
        alternativeTranscript=False
        exonNumber=-1
        level=10
        for x in infoChunks:
            field, value = x.split("=")
            if field  == "transcript_type":
                if value in invalidTypes:
                    invalidLine=True
                transcriptType=value
            elif field == "gene_type":
                if value in invalidTypes:
                    invalidLine=True
                geneType=value
            elif field=="gene_id":
                geneId=value.split(".")[0]
            elif field == "gene_name":
                geneName=value
            elif field =="transcript_id":
                transcriptId=value.split(".")[0]
            elif field =="transcript_name":
                transcriptName=value
            elif field =="exon_number":
                exonNumber=int(value)
            elif field=="level":
                level=int(value)
            elif field == "tag":
                tags=value.split(',')
                for tag in tags:
                    if tag.startswith("appris_"):
                        apprisTag=tag
                    elif tag.startswith("alternative_"):
                        alternativeTranscript=True
            elif field=="transcript_support_level":
                transcriptSupportLevel=value
        if invalidLine and geneId not in knownCancerGenes:
            continue
        
        if entryType=="gene":
            geneIdToGeneNameConversion[geneId]=geneName
            if geneType in validTypes or geneId in knownCancerGenes:
                print(chromosome,startPos,endPos,geneId+";"+geneTypesConversion[geneType],geneId+";"+geneTypesConversion[geneType],geneType,"gene","cancer" if geneId in knownCancerGenes else ".",sep='\t')
            if geneType in proteinCodingTypes or geneId in knownCancerGenes:
                print(chromosome,startPos,endPos,geneId+";"+geneTypesConversion[geneType],geneId+";"+geneTypesConversion[geneType],geneType,"geneCoding","cancer" if geneId in knownCancerGenes else ".",sep='\t')
            continue
        transcriptIdToTranscriptNameConversion[transcriptId]=transcriptName
        transcriptIdToGeneNameConversion[transcriptId]=geneName
        transcriptIdToGeneIdConversion[transcriptId]=geneId
        if geneName=="":
            if transcriptName!="":
                geneName=transcriptName
            else:
                continue
        if transcriptName=="":
            if geneName!="":
                transcriptName=geneName
            else:
                continue
        if geneId not in geneDb:
            geneDb[geneId]=dict()
        if transcriptId not in geneDb[geneId]:
            geneDb[geneId][transcriptId]=Transcript(geneName,geneId,geneType,transcriptName,transcriptId,transcriptType,strand,apprisTag,transcriptSupportLevel,alternativeTranscript,level)
        if entryType=="exon":
            geneDb[geneId][transcriptId].addExon(startPos,endPos,exonNumber)
        elif entryType=="transcript":
            geneDb[geneId][transcriptId].chromosome=chromosome
            geneDb[geneId][transcriptId].startPos=startPos
            geneDb[geneId][transcriptId].endPos=endPos
        
unresolvables=dict()
for geneId,gene in geneDb.items():
    if len(gene)>1:
        apprisScores=[transcript.apprisScore for transcript in gene.values()]
        minScore=min(apprisScores)
        gene={transcriptId:transcript for transcriptId,transcript in gene.items() if transcript.apprisScore==minScore}
        if len(gene)>1:
            transcriptSupportLevelScores=[transcript.transcriptSupportLevel for transcript in gene.values()]
            mintranscriptSupportLevelScore=min(transcriptSupportLevelScores)
            gene={transcriptId:transcript for transcriptId,transcript in gene.items() if transcript.transcriptSupportLevel==mintranscriptSupportLevelScore}
            if len(gene)>1:
                levelScores=[transcript.level for transcript in gene.values()]
                minLevelScore=min(levelScores)
                gene={transcriptId:transcript for transcriptId,transcript in gene.items() if transcript.level==minLevelScore}
                if len(gene)>1:
                    geneNew={transcriptId:transcript for transcriptId,transcript in gene.items() if not transcript.alternativeTranscript}
                    if len(geneNew)!=0:
                        gene=geneNew
                    if len(gene)>1:
                        exonCountScores=[len(transcript.exons) for transcript in gene.values()]
                        maxExonCountScore=max(exonCountScores)
                        gene={transcriptId:transcript for transcriptId,transcript in gene.items() if len(transcript.exons)==maxExonCountScore}
    if len(gene)>1:
        unresolvables[geneId]=len(gene)
    for transcriptId,transcript in gene.items():
        transcript.printTranscript()
for key,value in unresolvables.items():
    print(key,value,file=stderr)
print(len(unresolvables),file=stderr)

with open("ensemblTranscriptsToTranscriptNames.tsv",'w') as f:
    for key,value in transcriptIdToTranscriptNameConversion.items():
        print(key,value,sep='\t',file=f)        
with open("ensemblTranscriptsToGeneNames.tsv",'w') as f:
    for key,value in transcriptIdToGeneNameConversion.items():
        print(key,value,sep='\t',file=f)
        
with open("ensemblTranscriptsToGeneIds.tsv",'w') as f:
    for key,value in transcriptIdToGeneIdConversion.items():
        print(key,value,sep='\t',file=f)
with open("ensemblGenesToGeneNames.tsv",'w') as f:
    for key,value in geneIdToGeneNameConversion.items():
        print(key,value,sep='\t',file=f)
