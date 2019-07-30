from sys import argv
from gzip import open as gzopen
colsToChange=int(argv[2])
conversion=dict()
with open("ensemblTranscriptsToTranscriptNames.tsv") as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        transcriptName=lineChunks[1]
        transcriptNameProcessed='-'.join(transcriptName.split('-')[:-1])+'|-'+transcriptName.split('-')[-1]
        conversion[lineChunks[0]]=transcriptNameProcessed
with open("ensemblGenesToGeneNames.tsv") as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        conversion[lineChunks[0]]=lineChunks[1]
f = None
fileIn=argv[1]
if fileIn.endswith("gz"):
    f = gzopen(fileIn,'rt')
else:
    f = open(fileIn)
for line in f:
    lineChunks=line.rstrip().split('\t')
    for i in range(1,colsToChange+1):
        revCol=-i
        try:
            if "ENST" in lineChunks[revCol]:
                lineChunks[revCol]=','.join([conversion[x.split(';')[0].split("_")[0]]+"_"+x.split(';')[0].split("_")[-1]+";"+x.split(';')[1] for x in lineChunks[revCol].split(',')])
            else:
                lineChunks[revCol]=','.join([conversion[x.split(';')[0]]+";"+x.split(';')[1] for x in lineChunks[revCol].split(',')])
        except:
            pass
    print(*lineChunks,sep='\t')
f.close()