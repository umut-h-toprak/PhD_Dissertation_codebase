#!/bin/python
from sys import argv,stderr
from gzip import open as gzopen

cohortWideGeneLevelRecurrenceFile=argv[1]
refVariantTypes=argv[2]

variantTypes=[]
with open(refVariantTypes) as f:
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        variantTypes.append(lineChunks[1])

cnvLohVariantTypes={
    "LOH",
    "homoloss",
    "loss",
}
functionalSmallVariantTypes={
    "frameshift deletion",
    "frameshift insertion",
    "nonframeshift deletion",
    "nonframeshift insertion",
    "nonsynonymous SNV",
    "splicing SNV",
    "splicing deletion",
    "splicing insertion",
    "stopgain SNV",
    "stopgain deletion",
    "stopgain insertion",
    "stoploss SNV",
    "stoploss deletion",
    "stoploss insertion",
    "ncRNA_exonic SNV",
    "ncRNA_exonic deletion",
    "ncRNA_exonic insertion",
    "ncRNA_splicing SNV",
    "ncRNA_splicing deletion",
    "ncRNA_splicing insertion",
}

geneData=dict()
with gzopen(cohortWideGeneLevelRecurrenceFile,'rt') as f:
    for line in f:
        gene,donor,variantTypeCurrent=line.rstrip().split('\t')
        if gene not in geneData:
            geneData[gene]=dict()
            for variantType in variantTypes:
                geneData[gene][variantType]=set()
        geneData[gene][variantTypeCurrent].add(donor)
headerItems=["Gene"]+variantTypes
print(*headerItems,sep='\t')
for gene in geneData:
    outChunks=[gene]
    functionalSmallVariantDonors=set()
    cnvLohDonors=set()
    directSvDonors=set()
    cnvLohFunctionalSmallVariantDoubleHitDonors=set()
    cnvLohFunctionalSmallVariantDirectSvDoubleHitDonors=set()
    functionalSmallVariantDirectSvDoubleHitDonors=set()
    for i,variantType in enumerate(variantTypes):
        if i==57:
            cnvLohFunctionalSmallVariantDoubleHitDonors=functionalSmallVariantDonors.intersection(cnvLohDonors)
            outChunks.append(','.join(cnvLohFunctionalSmallVariantDoubleHitDonors))
        elif i == 58:
            cnvLohFunctionalSmallVariantDirectSvDoubleHitDonors=(functionalSmallVariantDonors.union(directSvDonors)).intersection(cnvLohDonors)
            outChunks.append(','.join(cnvLohFunctionalSmallVariantDirectSvDoubleHitDonors))
        elif i == 59:
            functionalSmallVariantDirectSvDoubleHitDonors=functionalSmallVariantDonors.intersection(directSvDonors)
            outChunks.append(','.join(functionalSmallVariantDirectSvDoubleHitDonors))
        else:
            donors=geneData[gene][variantType]
            if variantType in cnvLohVariantTypes:
                cnvLohDonors=cnvLohDonors.union(donors)
            if variantType in functionalSmallVariantTypes:
                functionalSmallVariantDonors=functionalSmallVariantDonors.union(donors)
            if variantType=="directSV":
                directSvDonors=directSvDonors.union(donors)
            outChunks.append(','.join(donors))
    print(*outChunks,sep='\t')