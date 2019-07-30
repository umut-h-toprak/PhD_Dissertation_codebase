from sys import argv

cohortWideIndelFile=argv[1]
cohortWideSnvFile=argv[2]
consensusTadsForGeneTadAssociations=argv[3]
cohortWidePanVariantGeneLevelVariantsOutput=argv[4]

cohortWidePanVariantGeneLevelVariantsHandle = open(cohortWidePanVariantGeneLevelVariantsOutput, 'w')

genesPerTad=[]
with open(consensusTadsForGeneTadAssociations) as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        tadGenes={x.split(';')[0] for x in lineChunks[5].split(',') if x!="."}
        genesPerTad.append(list(tadGenes))

with open(cohortWideIndelFile) as f:
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        genes=lineChunks[4].split(',')
        indelType=lineChunks[5]
        patient=lineChunks[6]
        for gene in genes:
            print(gene,patient,indelType,sep='\t',file=cohortWidePanVariantGeneLevelVariantsHandle)

with open(cohortWideSnvFile) as f:
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        genes=lineChunks[4].split(',')
        snvType=lineChunks[5]
        patient=lineChunks[6]
        for gene in genes:
            print(gene,patient,snvType,sep='\t',file=cohortWidePanVariantGeneLevelVariantsHandle)


cohortWidePanVariantGeneLevelVariantsHandle.close()
