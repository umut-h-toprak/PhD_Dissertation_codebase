if (!require("dplyr")) install.packages("dplyr")
if (!require("edgeR")) { 
    if (!requireNamespace("BiocManager", quietly = TRUE)){
            install.packages("BiocManager")
        }
        BiocManager::install("edgeR")
}

library(dplyr)
library(edgeR)
options(echo=TRUE)
args <- commandArgs(trailingOnly = TRUE)
print(args)

inputCountDataGzFile <- args[1]
outputFile <- gsub(".counts.tsv.gz",".CPM-TMM.tsv",args[1])
countData <- read.delim(gzfile(inputCountDataGzFile), header=T)
countDataDum <- read.delim(gzfile(inputCountDataGzFile), header=T,check.names = FALSE)
header=colnames(countData)
header[1]="gene"
colnames(countData)=header
countData=distinct(countData, gene, .keep_all = TRUE)
rownames(countData)=countData[,1]
countData[,1]=NULL
countDataDum[,1]=NULL
edgerData <- DGEList(counts=countData, genes=rownames(countData))
countsPerMillion <- cpm(edgerData)
countCheck <- countsPerMillion > 1
keep <- which(rowSums(countCheck) > 0)
edgerData <- edgerData[keep,]
edgerData <- calcNormFactors(edgerData, method="TMM")
countsPerMillionFinal <- log2(cpm(edgerData)+1)
colnames(countsPerMillionFinal)=colnames(countDataDum)
write.table(countsPerMillionFinal,file = outputFile,quote = FALSE,sep = "\t", col.names=NA)
