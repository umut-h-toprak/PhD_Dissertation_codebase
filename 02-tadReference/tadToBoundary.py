#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Jan  7 16:37:57 2018

@author: umuttoprak
"""
tissueConverter={"A549":"A549",
"AdrenalGland":"AD",
"Aorta":"AO",
"Bladder":"BL",
"Bowel":"SB",
"Caki2":"Caki2",
"Cortex":"CO",
"G401":"G401",
"GM12878":"GM12878",
"H1-ESC":"H1",
"H1-MES":"MES",
"H1-MSC":"MSC",
"H1-NPC":"NPC",
"H1-TRO":"TRO",
"HMEC":"HVEC",
"HUVEC":"HUVEC",
"IMR90":"IMR90",
"K562":"K562",
"KBM7":"KBM7",
"Liver":"LI",
"LNCaP":"LNCaP",
"Lung":"LG",
"Muscle":"Muscle",
"NCIH460":"NCIH460",
"NHEK":"NHEK",
"PANC1":"PANC1",
"Pancreas":"PA",
"RPMI7951":"RPMI7951",
"SJCRH30":"SJCRH30",
"SKMEL5":"SKMEL5",
"SKNDZ":"SKNDZ",
"SKNMC":"SKNMC",
"Spleen":"SX",
"T470":"T470",
"Thymus":"Thymus",
"VentricleLeft":"LV",
"VentricleRight":"RV"}

from sys import argv
inputBed=argv[1]
tissue=tissueConverter[inputBed.split('/')[-1].split("_")[0]]
outBed=tissue+".bed"
binWidth=40000
with open(inputBed) as f:
    with open(outBed,'w') as g:
        for line in f:
            lineChunks=line.rstrip().split('\t')
            chromosome=lineChunks[0].lstrip("chr")
            startPos=int(lineChunks[1])
            endPos=int(lineChunks[2])
            for pos in (startPos,endPos):
                if pos-binWidth > 0:
                    print(chromosome,pos-binWidth,pos,tissue,sep='\t',file=g)
                if pos>0:
                    print(chromosome,pos,pos+binWidth,tissue,sep='\t',file=g)
