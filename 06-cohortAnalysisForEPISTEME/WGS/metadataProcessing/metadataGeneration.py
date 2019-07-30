from sys import argv
from gzip import open as gzopen

donorSvFilesIn = argv[1]
donorSnvFilesIn = argv[2]
donorCnvFilesIn = argv[3]
donorIndelFilesIn = argv[4]
cohortRnaMatrixIn = argv[5]
cohortRppaMatrixIn = argv[6]
cohortMethylationMatrixIn = argv[7]
existingMetadataFileIn = argv[8]
cohortWideSvs = argv[9]
cohortWideSvsMidSize = argv[10]
cohortWideSnvs = argv[11]
cohortWideIndels = argv[12]
cohortSignatureOutput=argv[13]

invalidElements={"","NA","N.A","n.a","N.A.","n.a."}
def processSv(donorVariantClassFiles):
    variantClassValidDonors = set()
    controlAvailablePids = set()
    with open(donorVariantClassFiles) as f:
        for line in f:
            lineChunks = line.rstrip().split('\t')
            variantClassValidDonors.add(lineChunks[-1])
            if "somatic" in lineChunks[0]:
                controlAvailablePids.add(lineChunks[-1])
    return variantClassValidDonors,controlAvailablePids
def processCnv(donorVariantClassFiles):
    variantClassValidDonors = set()
    chosenPloidies = dict()
    chosenPurities = dict()
    with open(donorVariantClassFiles) as f:
        for line in f:
            lineChunks = line.rstrip().split('\t')
            donor=lineChunks[-1]
            variantClassValidDonors.add(donor)
            #"CGP_donor_1397084_chosen_most_important_info1.69_0.86.txt.gz"
            ploidyPre,purityPre=lineChunks[0].split('/')[-1].split("info")[-1].split(".txt.gz")[0].split('_')
            chosenPloidies[donor]=float(ploidyPre)
            chosenPurities[donor]=float(purityPre)
    return variantClassValidDonors, chosenPloidies, chosenPurities

def processSnvIndel(donorVariantClassFiles):
    variantClassValidDonors = set()
    variantClassLoads=dict()
    with open(donorVariantClassFiles) as f:
        for line in f:
            lineChunks = line.rstrip().split('\t')
            variantClassValidDonors.add(lineChunks[-1])
            variantCount=0
            with gzopen(lineChunks[-2],'rt') as g:
                for _ in g:
                    variantCount+=1
            variantClassLoads[lineChunks[-1]]=variantCount
    return variantClassValidDonors, variantClassLoads

def processPhenotype(cohortMatrix):
    with gzopen(cohortMatrix,'rt') as f:
        header = next(f)
        headerChunks = header.rstrip().split('\t')
        headerChunks.pop(0)
        return set(headerChunks)

svLoads=dict()
delLoads=dict()
dupLoads=dict()
invLoads=dict()
traLoads=dict()
with open(cohortWideSvs) as f:
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        donor=lineChunks[-1]
        eventType=int(lineChunks[5])
        if donor not in svLoads:
            svLoads[donor]=0
        svLoads[donor]+=1
        if eventType==0:
            if donor not in invLoads:
                invLoads[donor] = 0
            invLoads[donor] += 1
        elif eventType==1:
            if donor not in traLoads:
                traLoads[donor] = 0
            traLoads[donor] += 1
        elif eventType==2:
            if donor not in delLoads:
                delLoads[donor] = 0
            delLoads[donor] += 1
        elif eventType==3:
            if donor not in dupLoads:
                dupLoads[donor] = 0
            dupLoads[donor] += 1
        elif eventType==6:
            if donor not in traLoads:
                traLoads[donor] = 0
            traLoads[donor] += 1
        elif eventType==7:
            if donor not in traLoads:
                traLoads[donor] = 0
            traLoads[donor] += 1
svLoadsMidsize=dict()
delLoadsMidsize=dict()
dupLoadsMidsize=dict()
invLoadsMidsize=dict()
traLoadsMidsize=dict()
with open(cohortWideSvsMidSize) as f:
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        donor=lineChunks[-1]
        eventType = int(lineChunks[5])
        if donor not in svLoadsMidsize:
            svLoadsMidsize[donor]=0
        svLoadsMidsize[donor] += 1
        if eventType==0:
            if donor not in invLoadsMidsize:
                invLoadsMidsize[donor] = 0
            invLoadsMidsize[donor] += 1
        elif eventType==1:
            if donor not in traLoadsMidsize:
                traLoadsMidsize[donor] = 0
            traLoadsMidsize[donor] += 1
        elif eventType==2:
            if donor not in delLoadsMidsize:
                delLoadsMidsize[donor] = 0
            delLoadsMidsize[donor] += 1
        elif eventType==3:
            if donor not in dupLoadsMidsize:
                dupLoadsMidsize[donor] = 0
            dupLoadsMidsize[donor] += 1
        elif eventType==6:
            if donor not in traLoadsMidsize:
                traLoadsMidsize[donor] = 0
            traLoadsMidsize[donor] += 1
        elif eventType==7:
            if donor not in traLoadsMidsize:
                traLoadsMidsize[donor] = 0
            traLoadsMidsize[donor] += 1

snvLoads=dict()
with open(cohortWideSnvs) as f:
    next(f)
    for line in f:
        lineChunks = line.rstrip().split('\t')
        donor = lineChunks[-1]
        if donor not in snvLoads:
            snvLoads[donor] = 0
        snvLoads[donor]+=1

indelLoads=dict()
smallInsLoads=dict()
smallDelLoads=dict()
with open(cohortWideIndels) as f:
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        donor=lineChunks[-1]
        ref=lineChunks[2]
        alt=lineChunks[3]
        if len(alt)>len(ref):
            if donor not in smallInsLoads:
                smallInsLoads[donor] = 0
            smallInsLoads[donor]+=1
        else:
            if donor not in smallDelLoads:
                smallDelLoads[donor] = 0
            smallDelLoads[donor]+=1
        if donor not in indelLoads:
            indelLoads[donor] = 0
        indelLoads[donor]+=1

signatureContributions=dict()
if cohortSignatureOutput!="NA":
    with open(cohortSignatureOutput) as f:
            next(f)
            for line in f:
                lineChunks=line.rstrip().split('\t')
                donor=lineChunks[0]
                signatureContributions[donor]=dict()
                for i in range(1,31):
                    signatureContributions[donor][i]=float(lineChunks[i])

svAvailableDonors, controlAvailableDonors = processSv(donorSvFilesIn)
snvAvailableDonors, _= processSnvIndel(donorSnvFilesIn)
cnvAvailableDonors, samplePloidies, samplePurities = processCnv(donorCnvFilesIn)
indelAvailableDonors, _  = processSnvIndel(donorIndelFilesIn)

rnaAvailableDonors = processPhenotype(cohortRnaMatrixIn) if cohortRnaMatrixIn != "NA" else set()
rppaAvailableDonors = processPhenotype(cohortRppaMatrixIn) if cohortRppaMatrixIn != "NA" else set()
methylationArrayAvailableDonors  = processPhenotype(cohortMethylationMatrixIn) if cohortMethylationMatrixIn != "NA" else set()
allDonors = set.union(svAvailableDonors,
                      snvAvailableDonors,
                      cnvAvailableDonors,
                      indelAvailableDonors,
                      rnaAvailableDonors,
                      rppaAvailableDonors,
                      methylationArrayAvailableDonors)
sortedDonors=sorted(list(allDonors))

standardHeaderStart=["donor",
                     "index",
                     "caseDescription",
                     "OS",
                     "censoredOS",
                     "samplePurity",
                     "samplePloidy",
                     "SV",
                     "SV_load",
                     "DEL_load",
                     "DUP_load",
                     "INV_load",
                     "TRA_load",
                     "SV_loadMidsize",
                     "DEL_loadMidsize",
                     "DUP_loadMidsize",
                     "INV_loadMidsize",
                     "TRA_loadMidsize",
                     "SNV",
                     "SNV_load",
                     "Indel",
                     "SmallInDel_load",
                     "SmallIns_load",
                     "SmallDel_load",
                     "CNV",
                     "RNA",
                     "Rppa",
                     "MethylationArray",
                     "AnyVariant",
                     "ControlAvailable",
                     "HealthySample"]
if cohortSignatureOutput!="NA":
    for i in range(1,31):
            standardHeaderStart.append("COSMIC_sig."+str(i))

finalMetadata=dict()

for index,donor in enumerate(sortedDonors):
    finalMetadata[donor]=dict()
    finalMetadata[donor]["donor"]=donor
    finalMetadata[donor]["index"]=index
    finalMetadata[donor]["caseDescription"]=""
    finalMetadata[donor]["OS"] = ""
    finalMetadata[donor]["censoredOS"] = ""
    anyVariant=False
    if donor in svAvailableDonors:
        anyVariant = True
        finalMetadata[donor]["SV"]="+"
        finalMetadata[donor]["SV_load"]=svLoads[donor] if donor in svLoads else 0
        finalMetadata[donor]["DEL_load"] = delLoads[donor] if donor in delLoads else 0
        finalMetadata[donor]["DUP_load"] = dupLoads[donor] if donor in dupLoads else 0
        finalMetadata[donor]["INV_load"] = invLoads[donor] if donor in invLoads else 0
        finalMetadata[donor]["TRA_load"] = traLoads[donor] if donor in traLoads else 0
        finalMetadata[donor]["SV_loadMidsize"]=svLoadsMidsize[donor] if donor in svLoadsMidsize else 0
        finalMetadata[donor]["DEL_loadMidsize"] = delLoadsMidsize[donor] if donor in delLoadsMidsize else 0
        finalMetadata[donor]["DUP_loadMidsize"] = dupLoadsMidsize[donor] if donor in dupLoadsMidsize else 0
        finalMetadata[donor]["INV_loadMidsize"] = invLoadsMidsize[donor] if donor in invLoadsMidsize else 0
        finalMetadata[donor]["TRA_loadMidsize"] = traLoadsMidsize[donor] if donor in traLoadsMidsize else 0
    else:
        finalMetadata[donor]["SV"]="-"
        finalMetadata[donor]["SV_load"]=""
        finalMetadata[donor]["SV_loadMidsize"] = ""
        finalMetadata[donor]["DEL_loadMidsize"] = ""
        finalMetadata[donor]["DUP_loadMidsize"] = ""
        finalMetadata[donor]["INV_loadMidsize"] = ""
        finalMetadata[donor]["TRA_loadMidsize"] = ""
        finalMetadata[donor]["DEL_load"] = ""
        finalMetadata[donor]["DUP_load"] = ""
        finalMetadata[donor]["INV_load"] = ""
        finalMetadata[donor]["TRA_load"] = ""
    if donor in snvAvailableDonors:
        anyVariant = True
        finalMetadata[donor]["SNV"] = "+"
        finalMetadata[donor]["SNV_load"] = snvLoads[donor] if donor in snvLoads else 0
    else:
        finalMetadata[donor]["SNV"] = "-"
        finalMetadata[donor]["SNV_load"] = ""

    if donor in cnvAvailableDonors:
        anyVariant = True
        finalMetadata[donor]["CNV"] = "+"
        finalMetadata[donor]["samplePurity"]=samplePurities[donor]
        finalMetadata[donor]["samplePloidy"]=samplePloidies[donor]
    else:
        finalMetadata[donor]["CNV"] = "-"
        finalMetadata[donor]["samplePurity"]=""
        finalMetadata[donor]["samplePloidy"]=""
    if donor in indelAvailableDonors:
        anyVariant = True
        finalMetadata[donor]["Indel"]="+"
        finalMetadata[donor]["SmallInDel_load"] = indelLoads[donor] if donor in indelLoads else 0
        finalMetadata[donor]["SmallDel_load"]=smallDelLoads[donor] if donor in smallDelLoads else 0
        finalMetadata[donor]["SmallIns_load"]=smallInsLoads[donor] if donor in smallInsLoads else 0
    else:
        finalMetadata[donor]["Indel"]="-"
        finalMetadata[donor]["SmallInDel_load"] = ""
        finalMetadata[donor]["SmallDel_load"]=""
        finalMetadata[donor]["SmallIns_load"]=""
    finalMetadata[donor]["AnyVariant"]="+" if anyVariant else "-"
    finalMetadata[donor]["RNA"]="+" if donor in rnaAvailableDonors else "-"
    finalMetadata[donor]["Rppa"]="+" if donor in rppaAvailableDonors else "-"
    finalMetadata[donor]["MethylationArray"]="+" if donor in methylationArrayAvailableDonors else "-"
    finalMetadata[donor]["ControlAvailable"]="+" if donor in controlAvailableDonors else "-"
    finalMetadata[donor]["HealthySample"]="+" if donor.startswith("TCGA") and int(donor.split('-')[-1])>10 else "-"
    if cohortSignatureOutput!="NA":
        for i in range(1, 31):
            finalMetadata[donor]["COSMIC_sig." + str(i)]=signatureContributions[donor][i] if donor in signatureContributions else ""

osColumn="donor_survival_time"
censoredOsColumn="OS.time"
donorColumn="submitted_donor_id"
alternativeDonorColumn="sampleID"
diseaseSubtypeColumns=["donor_diagnosis_icd10",
                       "neoplasm_histologic_grade",
                       "histological_type",
                       "diagnosis_subtype",
                       "disease_type",
                       "anatomic_neoplasm_subdivision"]

fullHeader=standardHeaderStart
if existingMetadataFileIn != "NA":
    existingMetadataHandle = gzopen(existingMetadataFileIn, 'rt') if existingMetadataFileIn.endswith(".gz") else open(existingMetadataFileIn)
    existingMetadataHeaderChunks = next(existingMetadataHandle).rstrip().split('\t')
    iHisto=0
    histoType=False
    maxLen=0
    while iHisto <len(existingMetadataHeaderChunks):
        if existingMetadataHeaderChunks[iHisto]=="histological_type":
            histoType=True
            break
        iHisto+=1
    if histoType:
        for line in existingMetadataHandle:
            lineChunks = line.rstrip().split('\t')
            histoTypeChunks=[x.lstrip().rstrip() for x in lineChunks[iHisto].split(';')]
            histoTypeChunkCount=len(histoTypeChunks)
            if histoTypeChunkCount>maxLen:
                maxLen=histoTypeChunkCount
    existingMetadataHandle.close()
    existingMetadataHandle = gzopen(existingMetadataFileIn,'rt') if existingMetadataFileIn.endswith(".gz") else open(existingMetadataFileIn)
    existingMetadataHeaderChunks=next(existingMetadataHandle).rstrip().split('\t')
    for i,chunk in enumerate(existingMetadataHeaderChunks):
        fullHeader.append(chunk)
        if histoType and maxLen > 1 and i==iHisto:
            for j in range(maxLen):
                existingMetadataHeaderChunks.append("histological_type_level_"+str(j+1))
    existingMetadataAvailableDonors=set()
    for line in existingMetadataHandle:
        lineChunks=line.rstrip().split('\t')
        while len(lineChunks)<len(existingMetadataHeaderChunks):
            lineChunks.append("")
        lineDict=dict()
        for headerChunk,lineChunk in zip(existingMetadataHeaderChunks,lineChunks):
            if lineChunk not in invalidElements:
                lineDict[headerChunk]=lineChunk
                if histoType and maxLen > 1 and lineChunk  == "histological_type":
                    histoTypeChunks = [x.lstrip().rstrip() for x in lineChunk.split(';')]
                    histoTypeChunkCount = len(histoTypeChunks)
                    for i in range(histoTypeChunkCount):
                        lineDict["histological_type_level_" + str(i + 1)]=histoTypeChunks[i]
                    if histoTypeChunkCount < maxLen:
                        for i in range(histoTypeChunkCount,maxLen):
                            lineDict["histological_type_level_" + str(i + 1)] = ""
        donor = "NA"
        if donorColumn in lineDict:
            donor=lineDict[donorColumn]
        elif alternativeDonorColumn in lineDict:
            donor=lineDict[alternativeDonorColumn]
        if donor not in finalMetadata:
            continue
        existingMetadataAvailableDonors.add(donor)
        caseDescription=""
        for elem in diseaseSubtypeColumns:
            if elem in lineDict:
                if elem!="":
                    caseDescription+=lineDict[elem]+" "
        finalMetadata[donor]["caseDescription"]=caseDescription.rstrip()
        if osColumn in lineDict:
            finalMetadata[donor]["OS"]=lineDict[osColumn]
        if censoredOsColumn in lineDict:
            finalMetadata[donor]["censoredOS"]=lineDict[censoredOsColumn]
        for column,info in lineDict.items():
            finalMetadata[donor][column]=info
    existingMetadataHandle.close()
    for donor in allDonors-existingMetadataAvailableDonors:
        for chunk in existingMetadataHeaderChunks:
            if chunk not in finalMetadata[donor]:
                finalMetadata[donor][chunk]=""

blacklistedColumns=set()
for column in fullHeader:
    anyNonEmpty=False
    for donor in sortedDonors:
        if column in finalMetadata[donor] and finalMetadata[donor][column] not in invalidElements:
            anyNonEmpty=True
            break
    if not anyNonEmpty:
        blacklistedColumns.add(column)

print(*[x for x in fullHeader if x not in blacklistedColumns], sep='\t')

for donor in sortedDonors:
    outputChunks = []
    for column in fullHeader:
        if column not in blacklistedColumns:
            if column in finalMetadata[donor]:
                outputChunks.append(finalMetadata[donor][column])
            else:
                outputChunks.append("")
    print(*outputChunks,sep='\t')
