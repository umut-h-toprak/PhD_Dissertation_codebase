import fileinput
grandTotal=0
uniqueTotal=0
geneDict=dict()
for line in fileinput.input():    
    lineChunks=line.split('\t')
    if lineChunks[6] == "":
        continue
    grandTotal+=(lineChunks[6].count(';')+1)
    uniqueTotal+=1
print(str(grandTotal)+"\t"+str(uniqueTotal))
