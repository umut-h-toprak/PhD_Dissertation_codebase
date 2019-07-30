countMatrix=${1}
Rscript edgerAnalysis.R $countMatrix
countMatrixRaw=${countMatrix/.counts.tsv.gz/}
sed -i '1 s/^/gene/' ${countMatrixRaw}.CPM-TMM.tsv
paste <(cut -f 1 ${countMatrixRaw}.CPM-TMM.tsv | cut -d"." -f1)  <(cut -f 2- ${countMatrixRaw}.CPM-TMM.tsv) | gzip --best > ${countMatrixRaw}.CPM-TMM.tsv.gz
