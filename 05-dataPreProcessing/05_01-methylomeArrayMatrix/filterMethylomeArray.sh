inputMatrixFile=${1}

bash filterMethylomeArray.sh ${inputMatrixFile} filteredProbes.tsv | gzip --best > ${inputMatrixFile}.filtered.tsv.gz
