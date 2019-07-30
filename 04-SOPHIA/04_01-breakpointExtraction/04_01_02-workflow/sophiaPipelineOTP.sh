#!/bin/bash
commonConfigFile=${1}
projectConfigFile=${2}
sample=${3}
realPid=${4}

source ${commonConfigFile}
source ${projectConfigFile}

outputDir=${resultsDir}/${realPid}/SOPHIA
clusterEo=${outputDir}/cluster_eo/
clusterEoOpts=" -o ${clusterEo}/out.%J -e ${clusterEo}/err.%J "
sampleInit=${sample}

if [[ ! -e ${projectDir}/${pid}/${sample} ]]
then
	sample=${sampleInit}
	>&2 echo "BAM file for ${realPid}_${sample} does not exist"
	exit
fi
bpOutput=${outputDir}/${sample}_${realPid}_${version}_bps.tsv.gz
if [[ -e ${bpOutput} ]]
then
	>&2 echo "Skipping ${realPid}_${sample}: output already exists"
	exit
fi

prebam=${projectDir}/${pid}/${sample}/paired/merged-alignment/${sample}_${pid}_merged.mdup.bam
if [[ ! -e ${prebam} ]]
then
	if [[ ! -d "${projectDir}/${pid}/${sample}/paired/merged-alignment/" ]]
	then
		>&2 echo "PID $realPid: merged alignment not ready, skipping"
		exit
	fi
	prebam="`find -L ${projectDir}/${pid}/${sample}/paired/merged-alignment/ | grep -v merging | grep -v old | grep  _merged.mdup.bam$`"
	>&2 echo "PID $realPid: Using the non-OTP alignment $prebam"
fi
if [[ -e ${prebam} ]]
then
	if [[ -f ${prebam} ]]
	then
		bam="`readlink -f ${prebam}`"
	else	
		bam=${prebam}
	fi
else
	>&2 echo "BAM file for ${pid}_${sample} does not exist"
	exit
fi
mergedisizesalt1="${projectDir}/${pid}/${sample}/paired/merged-alignment/qualitycontrol/merged/insertsize_distribution/${sample}_${pid}_insertsize_plot.png_qcValues.txt"
if [[ ! -e ${mergedisizesalt1} ]]
then
	mergedisizesalt1="`find -L ${projectDir}/${pid}/${sample}/paired/merged-alignment/ | grep -v merging | grep -v old | grep _insertsize_plot.png_qcValues.txt$`"
	>&2 echo "find ${projectDir}/${pid}/${sample}/paired/merged-alignment/ | grep -v merging | grep _insertsize_plot.png_qcValues.txt$"
	>&2 echo "`find ${projectDir}/${pid}/${sample}/paired/merged-alignment/ | grep -v merging | grep _insertsize_plot.png_qcValues.txt$`"
	>&2 echo "PID $pid: Using the non-OTP alignment insert sizes $mergedisizesalt1"
fi
if [[ -e ${mergedisizesalt1} ]]
then
	mergedIsizes=${mergedisizesalt1}
else
	>&2 echo "Skipping ${realPid}_${sample}: Insertsize distribution file does not exist"
	exit
fi

mkdir -p ${clusterEo}
chmod -R 770 ${outputDir}

mergedIsizesFolder=$(dirname "${mergedIsizes}")
mergedQcFile=$(find ${mergedIsizesFolder}/../ -maxdepth 1 | grep _commonBam_wroteQcSummary.txt$ | head -n1)
if [[ -e ${mergedQcFile} ]]
then
	stdIsizePercentage=$(cut -f 14 ${mergedQcFile} | tail -n1)
	medianIsize=$(cut -f 15 ${mergedQcFile} | tail -n1)
	properPairPercentage=$(cut -f 8 ${mergedQcFile} | tail -n1)
	echo "bsub -J ${sample:0:1}_${realPid} ${clusterEoOpts} ${resources} ${PIPELINE_BASE}/sophiaCaller.sh ${commonConfigFile} ${bam} ${medianIsize} ${stdIsizePercentage} ${properPairPercentage} ${bpOutput}"
else
	qualitycontrolJsonFile="$(find ${mergedIsizesFolder}/../ -maxdepth 1 | grep qualitycontrol.json$ | head -n1)"
	if [[ -e ${qualitycontrolJsonFile} ]]
	then
	exit
		stdIsizePercentage=$(cut -f 14 ${mergedQcFile} | tail -n1)
	        medianIsize=$(cut -f 15 ${mergedQcFile} | tail -n1)
	        properPairPercentage=$(cut -f 8 ${mergedQcFile} | tail -n1)
	        echo "bsub -J ${sample:0:1}_${realPid} ${clusterEoOpts} ${resources} ${PIPELINE_BASE}/sophiaCaller.sh ${commonConfigFile} ${bam} ${medianIsize} ${stdIsizePercentage} ${properPairPercentage} ${bpOutput}"
	else
		>&2 echo "Skipping ${realPid}_${sample}: QC file does not exist"
		exit
	fi
fi
