from gzip import open as gzopen
from sys import argv
metadataOutput=argv[1]
refVariantTypes=argv[2]
refComparisonTypes=argv[3]
tadRecurrenceSv=argv[4]
tadRecurrenceCnv=argv[5]
tadRecurrenceIndel=argv[6]
geneRecurrence=argv[7]
cohortAllSvs=argv[8]
cohortAllSvsMidSize=argv[9]
cohortAllSnvs=argv[10]
cohortAllIndels=argv[11]
cohortWideGeneLevelVariants=argv[12]
cohortAllGeneFusions=argv[13]

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

for target in [tadRecurrenceSv, tadRecurrenceIndel]:
    with open(target.replace(".tsv","_EPISTEME.tsv"),'w') as g:
        with open(target) as f:
            headerChunks = next(f).rstrip().split('\t')
            print(*headerChunks, sep='\t', file=g)
            for line in f:
                lineChunks = line.rstrip().split('\t')
                while len(lineChunks)<5:
                    lineChunks.append("")
                for i in range(1,len(lineChunks)):
                    if lineChunks[i]=="":
                        continue
                    lineChunks[i]=','.join([str(donorToIndex[x]) for x in lineChunks[i].split(',')])
                print(*lineChunks,sep='\t',file=g)

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

with open(cohortAllGeneFusions.replace(".tsv","_EPISTEME.tsv"),'w') as g:
    with open(cohortAllGeneFusions) as f:
        headerChunks = next(f).rstrip().split('\t')
        print(*(["geneFusionIndex"]+headerChunks),sep='\t', file=g)
        fusionIndex = 0
        for line in f:
            lineChunks = line.rstrip().split('\t')
            if not lineChunks[0].startswith("ENSG"):
                continue
            if not lineChunks[1].startswith("ENSG"):
                continue
            lineChunks[0]=lineChunks[0].lstrip("ENSG0")
            lineChunks[1]=lineChunks[1].lstrip("ENSG0")
            lineChunks[3] =str(donorToIndex[lineChunks[3]])
            print(*([fusionIndex] + lineChunks), sep='\t',file=g)
            fusionIndex += 1


for target in [[cohortAllSvs,"svIndex"], [cohortAllSvsMidSize,"midSvIndex"]]:
    with open(target[0].replace(".tsv","_EPISTEME.tsv"),'w') as g:
        with open(target[0]) as f:
            headerChunks = next(f).rstrip().split('\t')
            colsToIgnore={"cancerGene1","cancerGene2"}
            colsToEnsgStrip={"gene1","gene2",
                             "nearestGeneUpstream1","nearestGeneUpstream2",
                             "nearestGeneDownstream1","nearestGeneDownstream2",
                             "nearestCancerGeneUpstream1","nearestCancerGeneUpstream2",
                             "nearestCancerGeneDownstream1","nearestCancerGeneDownstream2","directHits"}
            colsToSeStrip={"dbSuperEntries1","dbSuperEntries2"}
            colsToMinusOnePad={"preRemapStartChrIndex",
                               "preRemapEndChrIndex",
                               "preRemapStartPos",
                               "preRemapEndPos",
                               "nearestGeneUpstream1","nearestGeneUpstream2",
                               "nearestGeneUpstreamDistance1","nearestGeneUpstreamDistance2",
                               "nearestGeneDownstream1","nearestGeneDownstream2",
                               "nearestGeneDownstreamDistance1","nearestGeneDownstreamDistance2",
                               "nearestCancerGeneUpstream1","nearestCancerGeneUpstream2",
                               "nearestCancerGeneUpstreamDistance1","nearestCancerGeneUpstreamDistance2",
                               "nearestCancerGeneDownstream1","nearestCancerGeneDownstream2",
                               "nearestCancerGeneDownstreamDistance1","nearestCancerGeneDownstreamDistance2"}
            colIndicesToIgnore=set()
            colIndicesToEnsgStrip=set()
            colIndicesToSeStrip=set()
            colIndicesToMinusOnePad=set()
            for i,chunk in enumerate(headerChunks):
                if chunk in colsToIgnore:
                    colIndicesToIgnore.add(i)
                elif chunk in colsToEnsgStrip:
                    colIndicesToEnsgStrip.add(i)
                elif chunk in colsToSeStrip:
                    colIndicesToSeStrip.add(i)
                if chunk in colsToMinusOnePad:
                    colIndicesToMinusOnePad.add(i)
            print(*([target[1]]+[x for i,x in enumerate(headerChunks) if i not in colIndicesToIgnore]), sep='\t', file=g)
            svIndex = 0
            for line in f:
                lineChunks = line.rstrip().split('\t')
                lineChunks[-1]=str(donorToIndex[lineChunks[-1]])
                for i in colIndicesToEnsgStrip:
                    lineChunks[i]=','.join([x.lstrip("ENSG0") for x in lineChunks[i].split(',')])
                for i in colIndicesToSeStrip:
                    lineChunks[i]=','.join([x.lstrip("SE_0") for x in lineChunks[i].split(',')])
                for i in colIndicesToMinusOnePad:
                    if lineChunks[i]==".":
                        lineChunks[i]="-1"
                    else:
                        lineChunks[i]=','.join([str(abs(int(x))) for x in lineChunks[i].split(',')])
                print(*([svIndex] + [x for i, x in enumerate(lineChunks) if i not in colIndicesToIgnore]), sep='\t',file=g)
                svIndex+=1

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