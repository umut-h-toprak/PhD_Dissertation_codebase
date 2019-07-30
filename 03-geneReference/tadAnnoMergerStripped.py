from sys import argv
inputFile=argv[1]

with open(inputFile) as f:
    genes=set()
    firstLine=next(f)
    lineChunks=firstLine.rstrip().split('\t')
    prevID='!'.join(lineChunks[:5])
    if lineChunks[-1]!=".":
        genes.add(lineChunks[-1])
    for line in f:
        lineChunks=line.rstrip().split('\t')
        lineID='!'.join(lineChunks[:5])
        if lineID!=prevID:
            print(*(prevID.split('!')+[','.join(list(genes))]),sep='\t')
            genes=set()
            prevID=lineID
        if lineChunks[-1]!=".":
            genes.add(lineChunks[-1])
    print(*(prevID.split('!')+[','.join(list(genes))]),sep='\t')