#!/bin/bash
set -e
intersectBin="bpRegionIntersect"
familyRoot="./families"

mRef="hiseq2000Mref_strictBreaks_v35_2694_mergedArtifactRatios.bed.gz"
for family in ${familyRoot}/*
do
    family=${family%*/}
	family=${family##*/}
    zcat ${mRef} | ${intersectBin} ${familyRoot}/${family} 2 | gzip --best > ${familyRoot}/.${sequencer}/${sequencer}_${family}
done

mRef="x10Mref_strictBreaks_v35_723_mergedArtifactRatios.bed.gz"
for family in ${familyRoot}/*
do
    family=${family%*/}
	family=${family##*/}
    zcat ${mRef} | ${intersectBin} ${familyRoot}/${family} 2 | gzip --best > ${familyRoot}/.${sequencer}/${sequencer}_${family}
done
