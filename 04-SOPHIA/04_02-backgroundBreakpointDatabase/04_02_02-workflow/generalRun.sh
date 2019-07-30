#inputFile=$1
#mrefType=$2
#defaultReadLength=$3
wd=/icgc/dkfzlsdf/analysis/B080/SOPHIA/v35/controls/
numPids=$(cat ${wd}/${inputFile} | wc -l)
outputRoot=${mrefType}Mref_strictBreaks_v35
artifactOutput=${outputRoot}_${numPids}_mergedArtifactRatios.bed.gz
artifactProcessedOutput=${outputRoot}_${numPids}_mergedArtifactRatiosNoDecoy_Plus1.bed.gz
${wd}/sophiaMref --gzins ${wd}/$inputFile --defaultreadlength $defaultReadLength --version v35 --outputrootname ${wd}/${outputRoot} | gzip --best > ${wd}/${artifactOutput}
rm ${wd}/${outputRoot}_${numPids}_mergedBpCounts.bed.gz
gzip --best ${wd}/${outputRoot}_${numPids}_mergedBpCounts.bed
zcat ${wd}/${artifactOutput} | grep -v $'^NC' | grep -v $'^GL' | grep -v $'^hs37d5\t' | awk '{$2 = $2 + 1 ; $3 = $3 + 1; print}' | tr -s ' ' '\t' | gzip --best > ${artifactProcessedOutput}
