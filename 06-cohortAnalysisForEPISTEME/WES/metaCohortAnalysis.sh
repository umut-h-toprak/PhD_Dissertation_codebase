#!/bin/bash
#set -o verbose
#set -vx
set -e

source ./cohortAnalysisConfig.sh
inputFile=${1}

sed 1d ${inputFile} | while read line
do
	lineProc="`echo ${line} | sed 's/\t/ /g'`"
	tokens=( ${lineProc} )
	echo ${tokens[0]}
	analysisTypes="somatic merged germline"
    for analysisType in ${analysisTypes}
    do
        metaProjectFolder="/home/umuttoprak/Projects/SOPHIA/TCGA_WES/"
        configScript="/home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/cohortAnalysisConfig.sh"
        bash ${singleCohortAnalysis} ${analysisType} ${tokens[0]} ${tokens[1]} ${tokens[2]} ${tokens[3]} ${tokens[4]} ${tokens[5]} ${tokens[6]} ${tokens[7]} ${tokens[8]} ${tokens[9]} ${tokens[10]} ${tokens[11]} ${tokens[12]} ${tokens[13]} ${tokens[14]}
        break
    done
done
