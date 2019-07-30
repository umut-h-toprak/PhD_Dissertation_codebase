from sys import argv,stderr
from gzip import open as gzopen

cohortAllSnvsFile = argv[1]
cohortAllIndelsFile = argv[2]
cohortWideCnvsTadBased = argv[3]
cohortRnaMatrixIn = argv[4]
cohortRppaMatrixIn = argv[5]
cohortMethylationMatrixIn = argv[6]
existingMetadataFileIn = argv[7]
cohortSignatureOutput=argv[8]

def processCnv(cohortWideCnvsTadBased):
    cnvAvailableDonors = set()
    with gzopen(cohortWideCnvsTadBased,'rt') as f:
        for line in f:
            lineChunks=line.rstrip().split('\t')
            if not lineChunks[-1][-1].isdigit():
                lineChunks[-1] =lineChunks[-1][:-1]
            cnvAvailableDonors.add(lineChunks[-1])
    return cnvAvailableDonors
def processSmallVariants(smallVariantFile):
    variantClassValidDonors = set()
    variantClassLoads=dict()
    with open(smallVariantFile) as f:
        next(f)
        for line in f:
            lineChunks = line.rstrip().split('\t')
            donor = lineChunks[-1]
            if not donor[-1].isdigit():
                donor =donor[:-1]
            variantClassValidDonors.add(donor)
            if donor not in variantClassLoads:
                variantClassLoads[donor]=0
            variantClassLoads[donor]+=1
    return variantClassValidDonors, variantClassLoads
def processPhenotype(cohortMatrix):
    with gzopen(cohortMatrix,'rt') as f:
        header = next(f)
        headerChunks = header.rstrip().split('\t')
        headerChunks.pop(0)
        res=set()
        for donor in headerChunks:
            if not donor[-1].isdigit():
                donor =donor[:-1]
            res.add(donor)
        return res

if cohortSignatureOutput!="NA":
    signatureContributions=dict()
    with open(cohortSignatureOutput) as f:
            next(f)
            for line in f:
                lineChunks=line.rstrip().split('\t')
                donor=lineChunks[0]
                signatureContributions[donor]=dict()
                for i in range(1,31):
                    signatureContributions[donor][i]=float(lineChunks[i])


snvAvailableDonors, snvLoads= processSmallVariants(cohortAllSnvsFile)
indelAvailableDonors, indelLoads = processSmallVariants(cohortAllIndelsFile)
smallVarAvailableDonors=set.union(snvAvailableDonors,indelAvailableDonors)
cnvAvailableDonors = processCnv(cohortWideCnvsTadBased)
rnaAvailableDonors = processPhenotype(cohortRnaMatrixIn) if cohortRnaMatrixIn != "NA" else set()
rppaAvailableDonors = processPhenotype(cohortRppaMatrixIn) if cohortRppaMatrixIn != "NA" else set()
methylationArrayAvailableDonors  = processPhenotype(cohortMethylationMatrixIn) if cohortMethylationMatrixIn != "NA" else set()
allDonors = set.union(smallVarAvailableDonors,cnvAvailableDonors,rnaAvailableDonors,rppaAvailableDonors,methylationArrayAvailableDonors)

sortedDonors=sorted(list(allDonors))


standardHeaderStart=["donor",
                     "index",
                     "caseDescription",
                     "OS",
                     "censoredOS",
                     "SNV",
                     "SNV_load",
                     "Indel",
                     "Indel_load",
                     "CNV",
                     "RNA",
                     "Rppa",
                     "MethylationArray",
                     "AnyVariant",
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
    if donor in smallVarAvailableDonors:
        anyVariant=True
        finalMetadata[donor]["SNV"] = "+"
        finalMetadata[donor]["SNV_load"] = snvLoads[donor] if donor in snvLoads else 0
        finalMetadata[donor]["Indel"]="+"
        finalMetadata[donor]["Indel_load"]=indelLoads[donor] if donor in indelLoads else 0
    else:
        finalMetadata[donor]["SNV"] = "-"
        finalMetadata[donor]["SNV_load"] = ""
        finalMetadata[donor]["Indel"]="-"
        finalMetadata[donor]["Indel_load"]=""
    if donor in cnvAvailableDonors:
        anyVariant=True
        finalMetadata[donor]["CNV"] = "+"
    else:
        finalMetadata[donor]["CNV"] = "-"
    finalMetadata[donor]["RNA"]="+" if donor in rnaAvailableDonors else "-"
    finalMetadata[donor]["Rppa"]="+" if donor in rppaAvailableDonors else "-"
    finalMetadata[donor]["MethylationArray"]="+" if donor in methylationArrayAvailableDonors else "-"
    finalMetadata[donor]["AnyVariant"]="+" if anyVariant else "-"
    finalMetadata[donor]["HealthySample"]="+" if donor.startswith("TCGA") and int(donor.split('-')[-1])>10 else "-"
    if cohortSignatureOutput!="NA":
        for i in range(1, 31):
            finalMetadata[donor]["COSMIC_sig." + str(i)]=signatureContributions[donor][i] if donor in signatureContributions else ""
    
censoredOsColumn="OS.time"
donorColumn="sampleID"
diseaseSubtypeColumns=["donor_diagnosis_icd10","neoplasm_histologic_grade","histological_type","diagnosis_subtype","disease_type","anatomic_neoplasm_subdivision"]

fullHeader=standardHeaderStart
if existingMetadataFileIn != "NA":
    existingMetadataHandle = gzopen(existingMetadataFileIn,'rt') if existingMetadataFileIn.endswith(".gz") else open(existingMetadataFileIn)
    existingMetadataHeaderChunks=next(existingMetadataHandle).rstrip().split('\t')
    for i in range(len(existingMetadataHeaderChunks)):
        if existingMetadataHeaderChunks[i] == "OS":
            existingMetadataHeaderChunks[i]="_OS"
    fullHeader+=existingMetadataHeaderChunks
    existingMetadataAvailableDonors=set()
    for line in existingMetadataHandle:
        lineChunks=line.rstrip().split('\t')
        while len(lineChunks)<len(existingMetadataHeaderChunks):
            lineChunks.append("")
        lineDict=dict()
        for headerChunk,lineChunk in zip(existingMetadataHeaderChunks,lineChunks):
            lineDict[headerChunk]=lineChunk
        donor=lineDict[donorColumn]
        if donor not in finalMetadata:
            continue
        existingMetadataAvailableDonors.add(donor)
        caseDescription=""
        for elem in diseaseSubtypeColumns:
            if elem in lineDict:
                if elem!="":
                    caseDescription+=lineDict[elem]+" "
        finalMetadata[donor]["caseDescription"]=caseDescription.rstrip()
        if censoredOsColumn in lineDict:
            finalMetadata[donor]["censoredOS"]=lineDict[censoredOsColumn]
            if "_EVENT" in lineDict:
                if lineDict["_EVENT"]=="1":
                    finalMetadata[donor]["OS"]=lineDict[censoredOsColumn]
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
        if finalMetadata[donor][column] not in {"","NA","N.A","n.a","N.A.","n.a.","NaN","NAN"}:
            anyNonEmpty=True
            break
    if not anyNonEmpty:
        blacklistedColumns.add(column)

print(*[x for x in fullHeader if x not in blacklistedColumns], sep='\t')

for donor in sortedDonors:
    outputChunks = []
    for column in fullHeader:
        if column not in blacklistedColumns:
            outputChunks.append(finalMetadata[donor][column])
    print(*outputChunks,sep='\t')
