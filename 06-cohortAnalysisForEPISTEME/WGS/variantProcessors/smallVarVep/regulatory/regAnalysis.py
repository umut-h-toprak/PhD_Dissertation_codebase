db=dict()
with open ("regulatoryDump.tsv") as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        if lineChunks[0] not in db:
            db[lineChunks[0]]=set()
        db[lineChunks[0]].add(lineChunks[1])

for element in db:
    if len(db[element])>1:
        print(element,len(db[element]),sep='\t')
