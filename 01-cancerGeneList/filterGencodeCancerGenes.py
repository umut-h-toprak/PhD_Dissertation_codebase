from sys import argv
import gzip

cancerGeneFile=argv[1]
gencodeFile=argv[2]

cancerGenes=dict()
with open(cancerGeneFile) as f:
    for line in f:
        cancerGene,sources=line.rstrip().split('\t') 
        cancerGenes[cancerGene]=sources

with gzip.open(gencodeFile,'rt') as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        geneName=lineChunks[-1].split(';')[0]
        if geneName in cancerGenes:
            print(lineChunks[0],lineChunks[1],lineChunks[2],geneName,cancerGenes[geneName],sep='\t')
