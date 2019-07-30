library(deconstructSigs)

args = commandArgs(trailingOnly=TRUE)
cohortWideSnvsIn=args[1]
normalizationMode=args[2]
outputTarget=args[3]

snvDf=read.delim(cohortWideSnvsIn,row.names = "index")
snvDf$chrIndex[snvDf$chrIndex==23]="X"
snvDf$chrIndex[snvDf$chrIndex==24]="Y"
snvDf$chrIndex=paste0("chr",snvDf$chrIndex)
sigs.input <- mut.to.sigs.input(mut.ref = snvDf, 
                                sample.id = "donor", 
                                chr = "chrIndex", 
                                pos = "pos", 
                                ref = "ref", 
                                alt = "alt")

tmpRes = NULL
resDf=data.frame()
for(donor in  rownames(sigs.input)){
  tmpRes = whichSignatures(tumor.ref =sigs.input, 
                           signatures.ref = signatures.cosmic, 
                           sample.id = donor,
                           contexts.needed = TRUE,
                           tri.counts.method = normalizationMode)$weight
  resDf=rbind(resDf,tmpRes)
}
write.table(resDf,file = outputTarget,quote = FALSE,sep = '\t')
