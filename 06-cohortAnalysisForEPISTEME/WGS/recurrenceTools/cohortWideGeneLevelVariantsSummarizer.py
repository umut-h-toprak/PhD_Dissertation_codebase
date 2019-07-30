from sys import argv

cohortWideSvFile=argv[1]
cohortWideMidSizedSvFile=argv[2]
cohortWideGeneFusionFile=argv[3]
cohortWideIndelFile=argv[4]
cohortWideSnvFile=argv[5]
consensusTadsForGeneTadAssociations=argv[6]
cohortWidePanVariantGeneLevelVariantsOutput=argv[7]

cohortWidePanVariantGeneLevelVariantsHandle = open(cohortWidePanVariantGeneLevelVariantsOutput, 'w')

genesPerTad=[]
with open(consensusTadsForGeneTadAssociations) as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        tadGenes={x.split(';')[0] for x in lineChunks[5].split(',') if x!="."}
        genesPerTad.append(list(tadGenes))

with open(cohortWideSvFile) as f:
    patientGeneSvTadOffsetMapper = dict()
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        patient=lineChunks[-1]
        if patient not in patientGeneSvTadOffsetMapper:
            patientGeneSvTadOffsetMapper[patient]=dict()
        tadIndicesOffset3=[int(x) for x in lineChunks[-2].split(';') if x!="."]
        tadIndicesOffset2=[int(x) for x in lineChunks[-3].split(';') if x!="."]
        tadIndicesOffset1=[int(x) for x in lineChunks[-4].split(';') if x!="."]
        tadIndicesOffset0=[int(x) for x in lineChunks[-5].split(';') if x!="."]
        for tadIndex in tadIndicesOffset3:
            geneCandidates=genesPerTad[tadIndex-1]
            for gene in geneCandidates:
                if gene not in patientGeneSvTadOffsetMapper[patient]:
                    patientGeneSvTadOffsetMapper[patient][gene]=3
                else:
                    patientGeneSvTadOffsetMapper[patient][gene]=min(3,patientGeneSvTadOffsetMapper[patient][gene])
        for tadIndex in tadIndicesOffset2:
            geneCandidates=genesPerTad[tadIndex-1]
            for gene in geneCandidates:
                if gene not in patientGeneSvTadOffsetMapper[patient]:
                    patientGeneSvTadOffsetMapper[patient][gene]=2
                else:
                    patientGeneSvTadOffsetMapper[patient][gene]=min(2,patientGeneSvTadOffsetMapper[patient][gene])
        for tadIndex in tadIndicesOffset1:
            geneCandidates=genesPerTad[tadIndex-1]
            for gene in geneCandidates:
                if gene not in patientGeneSvTadOffsetMapper[patient]:
                    patientGeneSvTadOffsetMapper[patient][gene]=1
                else:
                    patientGeneSvTadOffsetMapper[patient][gene]=min(1,patientGeneSvTadOffsetMapper[patient][gene])
        for tadIndex in tadIndicesOffset0:
            geneCandidates=genesPerTad[tadIndex-1]
            for gene in geneCandidates:
                patientGeneSvTadOffsetMapper[patient][gene]=0
        directHits=lineChunks[-6].split(',')
        for gene in directHits:
            if gene!=".":
                print(gene, patient, "directSV",sep='\t', file=cohortWidePanVariantGeneLevelVariantsHandle)
    for patient in patientGeneSvTadOffsetMapper:
        for gene in patientGeneSvTadOffsetMapper[patient]:
            print(gene, patient, "svTadOffset"+str(patientGeneSvTadOffsetMapper[patient][gene]),sep='\t', file=cohortWidePanVariantGeneLevelVariantsHandle)

orientationNaming={True:"gene fusion correct orientation",False:"gene fusion incorrect orientation"}

with open(cohortWideGeneFusionFile) as f:
    previousFusions=set()
    next(f)
    for line in f:
        lineChunks = line.rstrip().split('\t')
        gene1 = lineChunks[0]
        gene2 = lineChunks[1]
        gene1Id = int(gene1.lstrip("ENSG0"))
        gene2Id = int(gene2.lstrip("ENSG0"))
        matchedOrientation = bool(int(lineChunks[2]))
        patient = lineChunks[3]
        if (gene1Id,matchedOrientation,patient) not in previousFusions:
            previousFusions.add((gene1Id,matchedOrientation,patient))
            print(gene1,patient,orientationNaming[matchedOrientation],sep='\t',file=cohortWidePanVariantGeneLevelVariantsHandle)
        if (gene2Id,matchedOrientation,patient) not in previousFusions:
            previousFusions.add((gene2Id,matchedOrientation,patient))
            print(gene2,patient,orientationNaming[matchedOrientation],sep='\t',file=cohortWidePanVariantGeneLevelVariantsHandle)

with open(cohortWideIndelFile) as f:
    patientGeneIndelTadOffsetMapper = dict()
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        patient = lineChunks[-1]
        if patient not in patientGeneIndelTadOffsetMapper:
            patientGeneIndelTadOffsetMapper[patient] = dict()
        tadIndicesOffset3 = [int(x) for x in lineChunks[-2].split(';') if x!="."]
        tadIndicesOffset2 = [int(x) for x in lineChunks[-3].split(';') if x!="."]
        tadIndicesOffset1 = [int(x) for x in lineChunks[-4].split(';') if x!="."]
        tadIndicesOffset0 = [int(x) for x in lineChunks[-5].split(';') if x!="."]
        for tadIndex in tadIndicesOffset3:
            geneCandidates = genesPerTad[tadIndex - 1]
            for gene in geneCandidates:
                if gene not in patientGeneIndelTadOffsetMapper[patient]:
                    patientGeneIndelTadOffsetMapper[patient][gene] = 3
                else:
                    patientGeneIndelTadOffsetMapper[patient][gene] = min(3, patientGeneIndelTadOffsetMapper[patient][gene])
        for tadIndex in tadIndicesOffset2:
            geneCandidates = genesPerTad[tadIndex - 1]
            for gene in geneCandidates:
                if gene not in patientGeneIndelTadOffsetMapper[patient]:
                    patientGeneIndelTadOffsetMapper[patient][gene] = 2
                else:
                    patientGeneIndelTadOffsetMapper[patient][gene] = min(2, patientGeneIndelTadOffsetMapper[patient][gene])
        for tadIndex in tadIndicesOffset1:
            geneCandidates = genesPerTad[tadIndex - 1]
            for gene in geneCandidates:
                if gene not in patientGeneIndelTadOffsetMapper[patient]:
                    patientGeneIndelTadOffsetMapper[patient][gene] = 1
                else:
                    patientGeneIndelTadOffsetMapper[patient][gene] = min(1, patientGeneIndelTadOffsetMapper[patient][gene])
        for tadIndex in tadIndicesOffset0:
            geneCandidates = genesPerTad[tadIndex - 1]
            for gene in geneCandidates:
                patientGeneIndelTadOffsetMapper[patient][gene] = 0
        directHits = lineChunks[4].split(',')
        if len(directHits)>0:
            indelType = lineChunks[5]
            for gene in directHits:
                if gene!=".":
                    print(gene, patient, indelType,sep='\t', file=cohortWidePanVariantGeneLevelVariantsHandle)
    with open(cohortWideMidSizedSvFile) as f:
        next(f)
        for line in f:
            lineChunks = line.rstrip().split('\t')
            patient = lineChunks[-1]
            if patient not in patientGeneIndelTadOffsetMapper:
                patientGeneIndelTadOffsetMapper[patient] = dict()
            tadIndicesOffset3 = [int(x) for x in lineChunks[-2].split(';') if x!="."]
            tadIndicesOffset2 = [int(x) for x in lineChunks[-3].split(';') if x!="."]
            tadIndicesOffset1 = [int(x) for x in lineChunks[-4].split(';') if x!="."]
            tadIndicesOffset0 = [int(x) for x in lineChunks[-5].split(';') if x!="."]
            for tadIndex in tadIndicesOffset3:
                geneCandidates = genesPerTad[tadIndex - 1]
                for gene in geneCandidates:
                    if gene not in patientGeneIndelTadOffsetMapper[patient]:
                        patientGeneIndelTadOffsetMapper[patient][gene] = 3
                    else:
                        patientGeneIndelTadOffsetMapper[patient][gene] = min(3, patientGeneIndelTadOffsetMapper[patient][gene])
            for tadIndex in tadIndicesOffset2:
                geneCandidates = genesPerTad[tadIndex - 1]
                for gene in geneCandidates:
                    if gene not in patientGeneIndelTadOffsetMapper[patient]:
                        patientGeneIndelTadOffsetMapper[patient][gene] = 2
                    else:
                        patientGeneIndelTadOffsetMapper[patient][gene] = min(2, patientGeneIndelTadOffsetMapper[patient][gene])
            for tadIndex in tadIndicesOffset1:
                geneCandidates = genesPerTad[tadIndex - 1]
                for gene in geneCandidates:
                    if gene not in patientGeneIndelTadOffsetMapper[patient]:
                        patientGeneIndelTadOffsetMapper[patient][gene] = 1
                    else:
                        patientGeneIndelTadOffsetMapper[patient][gene] = min(1, patientGeneIndelTadOffsetMapper[patient][gene])
            for tadIndex in tadIndicesOffset0:
                geneCandidates = genesPerTad[tadIndex - 1]
                for gene in geneCandidates:
                    patientGeneIndelTadOffsetMapper[patient][gene] = 0
            directHits = lineChunks[-6].split(',')
            for gene in directHits:
                if gene != ".":
                    print(gene, patient, "directSV", sep='\t', file=cohortWidePanVariantGeneLevelVariantsHandle)
    for patient in patientGeneIndelTadOffsetMapper:
        for gene in patientGeneIndelTadOffsetMapper[patient]:
            print(gene, patient, "indelTadOffset"+str(patientGeneIndelTadOffsetMapper[patient][gene]),sep='\t', file=cohortWidePanVariantGeneLevelVariantsHandle)
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