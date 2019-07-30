from sys import argv
inputFile=argv[1]

lastGene=""
lastSources=set()
with open(inputFile) as f:
    for line in f:
        gene,source=line.rstrip().split('\t')
        if gene!=lastGene:
            if lastGene!="":
                print(lastGene,','.join(sorted(lastSources)),sep='\t')
                lastGene=gene
                lastSources={source}
            else:
                lastGene=gene
                lastSources={source}
        else:
            lastSources.add(source)
    print(lastGene,','.join(sorted(lastSources)),sep='\t')
