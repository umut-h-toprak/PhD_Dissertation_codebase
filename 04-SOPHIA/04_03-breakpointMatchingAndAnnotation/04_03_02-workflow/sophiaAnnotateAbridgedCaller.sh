#!/bin/bash
set -e

tumorFile=${1}
bloodFile=${2}
analysisTag=${3}
CONFIG_FILE=${4}
project=${5}
pid=${6}
outputDir=${7}

#~ module load SOPHIA/35.0
module load bedtools/2.24.0
module load python/3.6.0
module load R/3.4.2
source ${CONFIG_FILE}

prefix="SOPHIA-"${version}

tumorFileRaw=${tumorFile:0:${#tumorFile}-7}
tumorFileRaw=${outputDir}/${tumorFileRaw##*/}

#TEMPORARY FILES
ABRIDGED_ANNOTATION=${tumorFileRaw}_annotatedAbridged.bedpe
ABRIDGED_ANNOTATION_CONTEXT=${tumorFileRaw}_annotatedAbridgedContext.bedpe
FILE_DUM=${tumorFileRaw}_dum
#TEMPORARY FILES END

tumorDefaultReadLength=${defaultReadLength}
if [[ -e "${tumorFile}_101" ]]
then
	tumorDefaultReadLength="101"
elif [[ -e "${tumorFile}_151" ]]
then
	tumorDefaultReadLength="151"
fi
if [[ -e ${outputDir}/${project}_${pid}_WARNINGS ]]
then
	rm ${outputDir}/${project}_${pid}_WARNINGS
fi
if [[ ! -e "${bloodFile}" ]]
then
	echo "${SOPHIA_ANNOTATION_BINARY} --tumorresults ${tumorFile} --mref ${mRef} --pidsinmref ${pidsInMref} --bpfreq ${bpFreq} --artifactlofreq ${artifactLoFreq} --artifacthifreq ${artifactHiFreq} --clonalitystrictlofreq ${clonalityStrictLoFreq} --clonalitylofreq ${clonalityLoFreq} --clonalityhifreq ${clonalityHiFreq} --germlineoffset ${germlineFuzziness} --defaultreadlengthtumor ${tumorDefaultReadLength} --germlinedblimit ${germlineDbLimit}"
	${SOPHIA_ANNOTATION_BINARY} --tumorresults ${tumorFile} --mref ${mRef} --pidsinmref ${pidsInMref} --bpfreq ${bpFreq} --artifactlofreq ${artifactLoFreq} --artifacthifreq ${artifactHiFreq} --clonalitystrictlofreq ${clonalityStrictLoFreq} --clonalitylofreq ${clonalityLoFreq} --clonalityhifreq ${clonalityHiFreq} --germlineoffset ${germlineFuzziness} --defaultreadlengthtumor ${tumorDefaultReadLength} --germlinedblimit ${germlineDbLimit} > ${ABRIDGED_ANNOTATION}Pre 
else
	controlDefaultReadLength=${defaultReadLength}
	if [[ -e "${bloodFile}_101" ]]
	then
		controlDefaultReadLength="101"
	elif [[ -e "${bloodFile}_151" ]]
	then
		controlDefaultReadLength="151"
	fi
	echo "${SOPHIA_ANNOTATION_BINARY} --tumorresults ${tumorFile} --mref ${mRef} --controlresults ${bloodFile} --pidsinmref ${pidsInMref} --bpfreq ${bpFreq} --artifactlofreq ${artifactLoFreq} --artifacthifreq ${artifactHiFreq} --clonalitystrictlofreq ${clonalityStrictLoFreq} --clonalitylofreq ${clonalityLoFreq} --clonalityhifreq ${clonalityHiFreq} --germlineoffset ${germlineFuzziness} --defaultreadlengthtumor ${tumorDefaultReadLength} --defaultreadlengthcontrol ${controlDefaultReadLength} --germlinedblimit ${germlineDbLimit}"
	${SOPHIA_ANNOTATION_BINARY} --tumorresults ${tumorFile} --mref ${mRef} --controlresults ${bloodFile} --pidsinmref ${pidsInMref} --bpfreq ${bpFreq} --artifactlofreq ${artifactLoFreq} --artifacthifreq ${artifactHiFreq} --clonalitystrictlofreq ${clonalityStrictLoFreq} --clonalitylofreq ${clonalityLoFreq} --clonalityhifreq ${clonalityHiFreq} --germlineoffset ${germlineFuzziness} --defaultreadlengthtumor ${tumorDefaultReadLength} --defaultreadlengthcontrol ${controlDefaultReadLength} --germlinedblimit ${germlineDbLimit} > ${ABRIDGED_ANNOTATION}Pre
fi


set +e
grep $'^#' ${ABRIDGED_ANNOTATION}Pre | grep -v $'^##' > ${outputDir}/${project}_${pid}_WARNINGS
grep $'^##' ${ABRIDGED_ANNOTATION}Pre  | sed 's/^##//'> ${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_overhangCandidates.bed
set -e

if [[ "`cat ${outputDir}/${project}_${pid}_WARNINGS | wc -l`" == "0" ]]
then
	rm ${outputDir}/${project}_${pid}_WARNINGS
fi
if [[ "`cat ${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_overhangCandidates.bed | wc -l`" == "0" ]]
then
	rm ${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_overhangCandidates.bed
fi
grep -v $'^#' ${ABRIDGED_ANNOTATION}Pre | awk '($4 != "NA")' | awk '$10 > 0' | sort -V -k 1,1 -k2,2 -k4,4 -k5,5 > ${ABRIDGED_ANNOTATION}_preRemap


${PYTHON_BINARY} ${TOOL_TELO_MAPPER_SCRIPT} ${ABRIDGED_ANNOTATION}_preRemap ${refChromosomes} > ${ABRIDGED_ANNOTATION}_tmp
mv ${ABRIDGED_ANNOTATION}_tmp ${ABRIDGED_ANNOTATION}_preRemap
${PYTHON_BINARY} ${TOOL_DECOY_MAPPER_SCRIPT} ${decoyRangeRefBed} ${ABRIDGED_ANNOTATION}_preRemap | sort -V -k 1,1 -k2,2 -k4,4 -k5,5 > ${ABRIDGED_ANNOTATION}_tmp

rev ${ABRIDGED_ANNOTATION}_tmp | cut -f 1-6 | rev > ${ABRIDGED_ANNOTATION}_preRemapCoords
rev ${ABRIDGED_ANNOTATION}_tmp | cut -f 7- | rev > ${ABRIDGED_ANNOTATION}

rm ${ABRIDGED_ANNOTATION}Pre
rm ${ABRIDGED_ANNOTATION}_tmp
rm ${ABRIDGED_ANNOTATION}_preRemap


cut -f 1-3 ${ABRIDGED_ANNOTATION} | cat -n | sed 's/ //g' | awk -v OFS='\t'  '{print $2, $3, $4, $1}' > ${FILE_DUM}leftCoords
${BEDTOOLS_BINARY} intersect -a ${FILE_DUM}leftCoords -b ${intronExonRefBed} ${intronExonRefBedCancer} ${combinedSuperEnhancerRefBed} -loj  > ${FILE_DUM}directHits1Pre
${PYTHON_BINARY} ${TOOL_DIRECTHITCOLLAPSE_SCRIPT} ${FILE_DUM}directHits1Pre >${FILE_DUM}directHits1
${BEDTOOLS_BINARY} closest -a ${FILE_DUM}leftCoords -b ${geneRefBed} -g ${chromSizesRef} -io -D ref -id -t last -k 1 | cut -f 8,9 | sed 's/^\t/.\t/' > ${FILE_DUM}genesUpstream1
${BEDTOOLS_BINARY} closest -a ${FILE_DUM}leftCoords -b ${geneRefBedCancer} -g ${chromSizesRef} -io -D ref -id -t last -k 1 | cut -f 8,9 | sed 's/^\t/.\t/' > ${FILE_DUM}genesUpstreamCancer1
${BEDTOOLS_BINARY} closest -a ${FILE_DUM}leftCoords -b ${geneRefBed} -g ${chromSizesRef} -io -D ref -iu -t first -k 1 | cut -f 8,9 | sed 's/^\t/.\t/' > ${FILE_DUM}genesDownstream1
${BEDTOOLS_BINARY} closest -a ${FILE_DUM}leftCoords -b ${geneRefBedCancer} -g ${chromSizesRef} -io -D ref -iu -t first -k 1 | cut -f 8,9 | sed 's/^\t/.\t/' > ${FILE_DUM}genesDownstreamCancer1

cut -f 4-6 ${ABRIDGED_ANNOTATION} | cat -n | sed 's/ //g' | awk -v OFS='\t'  '{print $2, $3, $4, $1}' | sort -V -k1,1 -k2,2 -k3,3 -k4,4 > ${FILE_DUM}rightCoords
cut -f4 ${FILE_DUM}rightCoords > ${FILE_DUM}lineOrder
${BEDTOOLS_BINARY} intersect -a ${FILE_DUM}rightCoords -b ${intronExonRefBed} ${intronExonRefBedCancer} ${combinedSuperEnhancerRefBed} -loj > ${FILE_DUM}directHits2Pre
${PYTHON_BINARY} ${TOOL_DIRECTHITCOLLAPSE_SCRIPT} ${FILE_DUM}directHits2Pre >${FILE_DUM}directHits2
${BEDTOOLS_BINARY} closest -a ${FILE_DUM}rightCoords -b ${geneRefBed} -g ${chromSizesRef} -io -D ref -id -t last -k 1 | cut -f 8,9 | sed 's/^\t/.\t/' > ${FILE_DUM}genesUpstream2
${BEDTOOLS_BINARY} closest -a ${FILE_DUM}rightCoords -b ${geneRefBedCancer} -g ${chromSizesRef} -io -D ref -id -t last -k 1 | cut -f 8,9 | sed 's/^\t/.\t/' > ${FILE_DUM}genesUpstreamCancer2
${BEDTOOLS_BINARY} closest -a ${FILE_DUM}rightCoords -b ${geneRefBed} -g ${chromSizesRef} -io -D ref -iu -t first -k 1 | cut -f 8,9 | sed 's/^\t/.\t/' > ${FILE_DUM}genesDownstream2
${BEDTOOLS_BINARY} closest -a ${FILE_DUM}rightCoords -b ${geneRefBedCancer} -g ${chromSizesRef} -io -D ref -iu -t first -k 1 | cut -f 8,9 | sed 's/^\t/.\t/' > ${FILE_DUM}genesDownstreamCancer2

paste ${FILE_DUM}lineOrder <(cut -f1,2 ${FILE_DUM}directHits2) ${FILE_DUM}genesUpstream2 ${FILE_DUM}genesUpstreamCancer2 ${FILE_DUM}genesDownstream2 ${FILE_DUM}genesDownstreamCancer2 | sort -V -k1,1 | cut -f2- > ${FILE_DUM}right
cut -f3 ${FILE_DUM}directHits1 > ${FILE_DUM}leftSuperEnhancers
paste ${FILE_DUM}lineOrder <(cut -f3 ${FILE_DUM}directHits2) | sort -V -k1,1 | cut -f2- > ${FILE_DUM}rightSuperEnhancers
paste ${ABRIDGED_ANNOTATION} <(cut -f1,2 ${FILE_DUM}directHits1) ${FILE_DUM}genesUpstream1 ${FILE_DUM}genesUpstreamCancer1 ${FILE_DUM}genesDownstream1 ${FILE_DUM}genesDownstreamCancer1 ${FILE_DUM}right ${FILE_DUM}leftSuperEnhancers ${FILE_DUM}rightSuperEnhancers > ${FILE_DUM}tadPrep

${PYTHON_BINARY} ${TOOL_INTRACHROMOSOMALEVENTPICKER} ${FILE_DUM}tadPrep | ${BEDTOOLS_BINARY} intersect -a stdin -b ${roadmapEnhancerRefBed} -u | cut -f 4 > ${FILE_DUM}tadWhitelist
${PYTHON_BINARY} ${TOOL_TADANNOTATION_SCRIPT} ${FILE_DUM}tadPrep ${FILE_DUM}tadWhitelist ${consensusTadReferenceBed} ${smallEventThreshold} > ${FILE_DUM}tadAnnotations
paste ${FILE_DUM}tadPrep ${FILE_DUM}tadAnnotations ${ABRIDGED_ANNOTATION}_preRemapCoords > ${ABRIDGED_ANNOTATION_CONTEXT}
rm ${ABRIDGED_ANNOTATION}_preRemapCoords

#IMPORTANT FILES

BEDPE_RESULT_FILE_FILTERED=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered.bedpe
BEDPE_RESULT_FILE_FILTERED_SOMATIC=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_somatic.bedpe
BEDPE_RESULT_FILE_FILTERED_GERMLINE=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_germlineStrict.bedpe


BEDPE_RESULT_FILE_FILTERED_DEDUP=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_dedup.bedpe
BEDPE_RESULT_FILE_FILTERED_DEDUP_SOMATIC=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_dedup_somatic.bedpe
BEDPE_RESULT_FILE_FILTERED_DEDUP_GERMLINE=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_dedup_germlineStrict.bedpe

#~ FINAL_RESULT_FILE_FILTERED=${outputDir}/svs_${pid}_sensitivefiltered_minEventScore3.tsv
#~ FINAL_RESULT_FILE_FILTERED_SOMATIC=${outputDir}/svs_${pid}_sensitivefiltered_somatic_minEventScore3.tsv


#IMPORTANT FILES END

STANDARDHEADER="#chrom1\tstart1\tend1\tchrom2\tstart2\tend2\tsomaticity1\tsomaticity2\tsvtype\teventScore\teventSize\teventInversion\tevidence1\tclonalityRatio1\tevidence2\tclonalityRatio2\tsource1\tsource2\toverhang1\toverhang2\tgene1\tcancerGene1\tnearestCodingGeneUpstream1\tnearestCodingGeneUpstreamDistance1\tnearestCancerGeneUpstream1\tnearestCancerGeneUpstreamDistance1\tnearestCodingGeneDownstream1\tnearestCodingGeneDownstreamDistance1\tnearestCancerGeneDownstream1\tnearestCancerGeneDownstreamDistance1\tgene2\tcancerGene2\tnearestCodingGeneUpstream2\tnearestCodingGeneUpstreamDistance2\tnearestCancerGeneUpstream2\tnearestCancerGeneUpstreamDistance2\tnearestCodingGeneDownstream2\tnearestCodingGeneDownstreamDistance2\tnearestCancerGeneDownstream2\tnearestCancerGeneDownstreamDistance2\tdbSUPERenhancer1\tdbSUPERenhancer2\trescuedEnhancerHitCandidate\tTADindices\taffectedGenesTADestimate\taffectedCancerGenesTADestimate\tchrom1PreDecoyRemap\tstart1PreDecoyRemap\tend1PreDecoyRemap\tchrom2PreDecoyRemap\tstart2PreDecoyRemap\tend2PreDecoyRemap"
cat <(echo -e ${STANDARDHEADER})  <(cat ${ABRIDGED_ANNOTATION_CONTEXT}) | uniq | ${TOOL_FUSION_CANDIDATES_SCRIPT} > ${BEDPE_RESULT_FILE_FILTERED}

#DELETE TEMPORARY FILES
rm ${ABRIDGED_ANNOTATION}
rm ${ABRIDGED_ANNOTATION_CONTEXT}
rm ${FILE_DUM}*
#TEMPORARY FILES END

#TEMPORARY FILES QC
MERGED_DELEXTRACT=${BEDPE_RESULT_FILE_FILTERED}_delExtract
MERGED_DELEXTRACTINTERSECT=${BEDPE_RESULT_FILE_FILTERED}_delExtractIntersect
MERGED_RNACONTCANDIDATES_MORETHAN2INTRONS=${BEDPE_RESULT_FILE_FILTERED}_rnaContaminationCandidates
#TEMPORARY FILES QC END
${PYTHON_BINARY} ${TOOL_RNACONT_DEL_EXTRACTOR_SCRIPT} ${BEDPE_RESULT_FILE_FILTERED}  > ${MERGED_DELEXTRACT}
${BEDTOOLS_BINARY} intersect -a ${MERGED_DELEXTRACT} -b ${exonsOnlyPaddedRefBed} -wa -wb > ${MERGED_DELEXTRACTINTERSECT}
${PYTHON_BINARY} ${TOOL_RNACONT_DEL_COUNTER_SCRIPT} ${MERGED_DELEXTRACTINTERSECT} | grep -v $'\t1$' >  ${MERGED_RNACONTCANDIDATES_MORETHAN2INTRONS}
MERGED_RNA_CONTAMINATED_GENES="`grep -v locus ${MERGED_RNACONTCANDIDATES_MORETHAN2INTRONS} | wc -l`"
if [[ "${MERGED_RNA_CONTAMINATED_GENES}" -ge "11" ]]
then
	mv ${BEDPE_RESULT_FILE_FILTERED} ${BEDPE_RESULT_FILE_FILTERED}.preRnaRescue
	${PYTHON_BINARY} ${TOOL_RNADECONT_STEP1_SCRIPT} ${BEDPE_RESULT_FILE_FILTERED}.preRnaRescue | ${BEDTOOLS_BINARY} intersect -f 0.9 -r -a stdin -b ${spliceJunctionsRefBed} -wa | cut -f4 | uniq > ${BEDPE_RESULT_FILE_FILTERED}.contaminatedIndices
	${PYTHON_BINARY} ${TOOL_RNADECONT_STEP2_SCRIPT} ${BEDPE_RESULT_FILE_FILTERED}.preRnaRescue ${BEDPE_RESULT_FILE_FILTERED}.contaminatedIndices > ${BEDPE_RESULT_FILE_FILTERED}
	rm ${BEDPE_RESULT_FILE_FILTERED}.contaminatedIndices
	echo "#${MERGED_RNA_CONTAMINATED_GENES} are affected by RNA contamination, RNA decontamination applied, expect losses and false positives!" >> ${outputDir}/${project}_${pid}_WARNINGS
else
	rm ${MERGED_RNACONTCANDIDATES_MORETHAN2INTRONS}
fi
#DELETE TEMPORARY FILES QC
rm ${MERGED_DELEXTRACT}
rm ${MERGED_DELEXTRACTINTERSECT}
#TEMPORARY FILES QC END

${PYTHON_BINARY} ${TOOL_DEDUP_RESULTS_SCRIPT} ${BEDPE_RESULT_FILE_FILTERED} ${project} ${pid} ${tumorDefaultReadLength} ${refGenes} > ${BEDPE_RESULT_FILE_FILTERED_DEDUP}


#~ BEDPE_RESULT_FILE_FILTERED_DEDUP=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_dedup.bedpe
#~ BEDPE_RESULT_FILE_FILTERED_DEDUP_SOMATIC=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_dedup_somatic.bedpe
#~ BEDPE_RESULT_FILE_FILTERED_DEDUP_GERMLINE=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_dedup_germlineStrict.bedpe

if [[ -e "${bloodFile}" ]]
then
	cat <(head -n 1 ${BEDPE_RESULT_FILE_FILTERED})  <(grep GERMLINE ${BEDPE_RESULT_FILE_FILTERED}) | uniq > ${BEDPE_RESULT_FILE_FILTERED_GERMLINE}
	grep -v GERMLINE ${BEDPE_RESULT_FILE_FILTERED}  > ${BEDPE_RESULT_FILE_FILTERED_SOMATIC}
	cat <(head -n 1 ${BEDPE_RESULT_FILE_FILTERED_DEDUP})  <(grep GERMLINE ${BEDPE_RESULT_FILE_FILTERED_DEDUP}) | uniq > ${BEDPE_RESULT_FILE_FILTERED_DEDUP_GERMLINE}
	grep -v GERMLINE ${BEDPE_RESULT_FILE_FILTERED_DEDUP}  > ${BEDPE_RESULT_FILE_FILTERED_DEDUP_SOMATIC}
	#~ awk '$10>2' ${BEDPE_RESULT_FILE_FILTERED_SOMATIC} > ${FINAL_RESULT_FILE_FILTERED_SOMATIC}
	#~ set +e
	#~ ${RSCRIPT_BINARY} ${TOOL_CIRCLIZE_SCRIPT} ${BEDPE_RESULT_FILE_FILTERED_SOMATIC} "'${project}:${pid}(somatic)'" 3
	#~ ${RSCRIPT_BINARY} ${TOOL_CIRCLIZE_SCRIPT} ${BEDPE_RESULT_FILE_FILTERED_GERMLINE} "'${project}:${pid}(germline)'" 3
	#~ ${RSCRIPT_BINARY} ${TOOL_CIRCLIZE_SCRIPT} ${BEDPE_RESULT_FILE_FILTERED} "'${project}:${pid}(g&s)'" 3
else
	:
	#~ awk '$10>2' ${BEDPE_RESULT_FILE_FILTERED} > ${FINAL_RESULT_FILE_FILTERED}
	#~ set +e
	#~ ${RSCRIPT_BINARY} ${TOOL_CIRCLIZE_SCRIPT} ${BEDPE_RESULT_FILE_FILTERED} "'${project}:${pid}(g&s)'" 3
fi
