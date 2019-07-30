#!/ibios/tbi_cluster/13.1/x86_64/python/python-3.5.2/bin/python
import fileinput
from numpy import mean,median,fromstring
from sys import stderr

grandTotal=0
uniqueTotal=0
geneDict=dict()
for line in fileinput.input():    
    lineChunks=line.rstrip().split('\t')
    try:
        print(str(mean(fromstring(lineChunks[6],sep=';'))))
    except:
        pass
