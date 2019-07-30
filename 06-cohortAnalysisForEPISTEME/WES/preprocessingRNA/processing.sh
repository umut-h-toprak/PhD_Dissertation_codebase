targetFile=$1
Rscript edgerAnalysis.R $targetFile
targetFileRaw=${targetFile/.htseq_counts.tsv.gz/}
sed -i '1 s/^/gene/' ${targetFileRaw}.CPM-TMM.tsv
gzip -f --best ${targetFileRaw}.CPM-TMM.tsv

