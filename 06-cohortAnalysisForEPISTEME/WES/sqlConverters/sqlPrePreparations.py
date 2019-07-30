from gzip import open as gzopen
from sys import argv
metadataOutput=argv[1]
refVariantTypes=argv[2]
refComparisonTypes=argv[3]
tadRecurrenceCnv=argv[4]
geneRecurrence=argv[5]
cohortAllSnvs=argv[6]
cohortAllIndels=argv[7]
cohortWideGeneLevelVariants=argv[8]

donorToIndex=dict()
validDonors=set()
with open(metadataOutput) as f:
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        donorToIndex[lineChunks[0]]=int(lineChunks[1])
        validDonors.add(lineChunks[0])

variantTypeToIndex=dict()
with open(refVariantTypes) as f:
    next(f)
    for line in f:
        lineChunks = line.rstrip().split('\t')
        variantTypeToIndex[lineChunks[1]]=int(lineChunks[0])

refComparisonTypeToIndex=dict()
with open(refComparisonTypes) as f:
    next(f)
    for line in f:
        lineChunks = line.rstrip().split('\t')
        refComparisonTypeToIndex[lineChunks[1]] = int(lineChunks[0])

with open(tadRecurrenceCnv.replace(".tsv","_EPISTEME.tsv"),'w') as g:
    with open(tadRecurrenceCnv) as f:
        headerChunks = next(f).rstrip().split('\t')
        print(*headerChunks, sep='\t', file=g)
        for line in f:
            lineChunks = line.rstrip().split('\t')
            for i in range(1,len(lineChunks)):
                if lineChunks[i] == "NA":
                    lineChunks[i] = ""
                else:
                    lineChunks[i]=','.join([str(donorToIndex[x]) for x in lineChunks[i].split(',')])
            print(*lineChunks, sep='\t', file=g)
with open(geneRecurrence.replace(".tsv","_EPISTEME.tsv"),'w') as g:
    with open(geneRecurrence) as f:
        headerChunks = next(f).rstrip().split('\t')
        for i in range(1,len(headerChunks)):
            headerChunks[i]=variantTypeToIndex[headerChunks[i]]
        print(*headerChunks,sep='\t', file=g)
        for line in f:
            lineChunks = line.rstrip().split('\t')
            if not lineChunks[0].startswith("ENSG"):
                continue
            while len(lineChunks) < len(headerChunks):
                lineChunks.append("")
            lineChunks[0]=lineChunks[0].lstrip("ENSG0")
            for i in range(1, len(lineChunks)):
                if lineChunks[i] == "":
                    continue
                lineChunks[i] = ','.join([str(donorToIndex[x]) for x in lineChunks[i].split(',')])
            print(*lineChunks, sep='\t', file=g)

for target in [[cohortAllIndels,"indelIndex"], [cohortAllSnvs,"snvIndex"]]:
    with open(target[0].replace(".tsv","_EPISTEME.tsv"),'w') as g:
        with open(target[0]) as f:
            headerChunks = next(f).rstrip().split('\t')
            print(*([target[1]]+headerChunks), sep='\t', file=g)
            index = 0
            for line in f:
                lineChunks = line.rstrip().split('\t')
                lineChunks[-1]=str(donorToIndex[lineChunks[-1]])
                if lineChunks[4] == ".":
                    lineChunks[4] = "-1"
                else:
                    lineChunks[4]=','.join([x.lstrip("ENSG0") for x in lineChunks[4].split(',')])
                lineChunks[5] = str(variantTypeToIndex[lineChunks[5]])
                print(*([index] + lineChunks), sep='\t',file=g)
                index+=1

if cohortWideGeneLevelVariants!="NA":
    with open(cohortWideGeneLevelVariants.replace(".tsv.gz","_EPISTEME.tsv"),'w') as g:
        print("gene","donor","variantType", sep='\t',file=g)
        with gzopen(cohortWideGeneLevelVariants,'rt') as f:
            for line in f:
                if not line.startswith('ENSG0'):
                    continue
                lineChunks = line.rstrip().split('\t')
                lineChunks[0] = lineChunks[0].lstrip("ENSG0")
                lineChunks[1] = str(donorToIndex[lineChunks[1]])
                lineChunks[2] = str(variantTypeToIndex[lineChunks[2]])
                print(*lineChunks, sep='\t', file=g)
