from sys import argv

inputFile=argv[1]
geneTranslationFile=argv[2]
cancerGenesFile=argv[3]

geneTranslation=dict()
with open(geneTranslationFile) as f:
    for line in f:
        lineChunks = line.rstrip().split('\t')
        geneTranslation[lineChunks[0]]=lineChunks[1]
cancerGenes=set()
with open(cancerGenesFile) as f:
    for line in f:
        gene = line.rstrip()
        cancerGenes.add(gene)

with open(inputFile) as f:
    tmpDb=dict()
    headerChunks=next(f).rstrip().split('\t')
    headerChunks.append("geneName")
    headerChunks.append("cancerGene")
    print(*headerChunks,sep='\t')
    for line in f:
        lineChunks = line.rstrip().split('\t')
        geneId=lineChunks[4]
        lineChunks.append(geneTranslation[geneId])
        lineChunks.append(geneId in cancerGenes)
        print(*lineChunks,sep='\t')        