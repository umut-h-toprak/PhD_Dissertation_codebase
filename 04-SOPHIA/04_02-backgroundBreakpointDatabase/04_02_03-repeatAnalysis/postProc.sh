cd ./families/.hiseq
for fam in *.gz;do echo -n $fam;zcat $fam | ../../bpCounter.py; done | sed 's/\.gz/\t/g' | cut -d"_" -f2- | sed 's/\.bed//g' | sed 's/$/\t101bp(2694)/g' > hiseqBpCounts
for fam in *.gz;do zcat $fam | ../../bpArtifactRatioExtractor.py | sed "s/^/$fam\t/g";done | cut -d"_" -f2- | sed 's/\.bed.gz//g' | sed 's/$/\t101bp(2694)/g' | gzip --best > hiseqBpArtifactRatios.gz


cd ./families/.x10
for fam in *.gz;do echo -n $fam;zcat $fam | ../../bpCounter.py;done | sed 's/\.gz/\t/g' | cut -d"_" -f2- | sed 's/\.bed//g' | sed 's/$/\t151bp(x10)(723)/g' > x10BpCounts
for fam in *.gz;do zcat $fam | ../../bpArtifactRatioExtractor.py | sed "s/^/$fam\t/g";done | cut -d"_" -f2- | sed 's/\.bed.gz//g' | sed 's/$/\t151bp(x10)(723)/g' | gzip --best > x10BpArtifactRatios.gz

cd ../../
cat x10BpCounts hiseqBpCounts > bpCountsCombined
zcat x10BpArtifactRatios.gz hiseqBpArtifactRatios.gz > mergedBpArtifactRatios

Rscript repeatArtifactBehaviourPlotter.R
Rscript repeatCompositionPlotter.R

