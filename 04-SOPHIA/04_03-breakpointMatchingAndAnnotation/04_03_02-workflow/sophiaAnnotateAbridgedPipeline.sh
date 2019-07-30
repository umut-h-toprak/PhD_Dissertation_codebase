#!/bin/bash
set -e
while getopts 'c:b:t:f:p:' OPTION
do
    case $OPTION in
    c) configFile="$OPTARG"
    ;;
    b) controlType="$OPTARG"
    ;;
    t) tumorType="$OPTARG"
    ;;
    f) resultsDir="$OPTARG"
    ;;
    p) project="$OPTARG"
    ;;
    \?)	printf "look in the script..." $(basename $0) >&2 exit 2
    ;;
    esac
done
shift $(($OPTIND - 1))
PIDS=$*
source ${configFile}
forceOverride=true
prefix="SOPHIA-"${version}

for pid in $PIDS
do
    outputDir=${resultsDir}/${pid}/SOPHIA
    if [[ "${tumorType}" == "NA" ]]
    then
		bloodFile = "`find ${outputDir} | grep /${controlType}_ | grep _bps.tsv.gz$`"
		if [[ "${bloodFile}" == "" ]]
		then
			continue
		fi
		analysisTag="${controlType}-only"
		analysisTag=${analysisTag/\./}
		outputDir=${outputDir}/${analysisTag}
		
		BEDPE_RESULT_FILE_sensitivefiltered=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered.bedpe
		BEDPE_RESULT_FILE_sensitivefiltered_SOMATIC=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_somatic.bedpe
		BEDPE_RESULT_FILE_sensitivefiltered_GERMLINE=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_germlineStrict.bedpe
		if [[ -e ${BEDPE_RESULT_FILE_sensitivefiltered} ]] && [[ ! ${forceOverride} == true ]]
		then 
			echo "skipping pid, results are already there"
			continue
		fi
		clusterEo=${outputDir}/cluster_eo/
		mkdir -p ${clusterEo}
		#~ clusterEoOpts="-o ${clusterEo} -j oe"
		clusterEoOpts=" -o ${clusterEo}/out.%J -e ${clusterEo}/err.%J "
		#~ job=`qsub $clusterEoOpts -N ${project}_${pid}_${analysisTag} -l ${annotationResources} -v tumorFile=${bloodFile},bloodFile="NA",analysisTag=${analysisTag},CONFIG_FILE=${configFile},project=${project},pid=${pid},outputDir=${outputDir} ${ANNOTATION_PIPELINE_BASE}/sophiaAnnotateAbridgedCaller.sh | cut -d "." -f 1`
		sleep 0.3s
    elif [[ "${controlType}" == "NA" ]]
    then
		tumorFile="`find ${outputDir} | grep /${tumorType}_ | grep _bps.tsv.gz$`"
		if [[ "${tumorFile}" == "" ]]
		then
			continue
		fi
		analysisTag="${tumorType}-only"
		analysisTag=${analysisTag/\./}
		outputDir=${outputDir}/${analysisTag}
		BEDPE_RESULT_FILE_sensitivefiltered=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered.bedpe
		BEDPE_RESULT_FILE_sensitivefiltered_SOMATIC=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_somatic.bedpe
		BEDPE_RESULT_FILE_sensitivefiltered_GERMLINE=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_germlineStrict.bedpe
		if [[ -e ${BEDPE_RESULT_FILE_sensitivefiltered} ]] && [[ ! ${forceOverride} == true ]]
		then
			echo "skipping pid, results are already there"
			continue
		fi
		clusterEo=${outputDir}/cluster_eo/
		mkdir -p ${clusterEo}
		#~ clusterEoOpts="-o ${clusterEo} -j oe"
		clusterEoOpts=" -o ${clusterEo}/out.%J -e ${clusterEo}/err.%J "
		#~ job=`qsub $clusterEoOpts -N ${project}_${pid}_${analysisTag} -l ${annotationResources} -v tumorFile=${tumorFile},bloodFile="NA",analysisTag=${analysisTag},CONFIG_FILE=${configFile},project=${project},pid=${pid},outputDir=${outputDir} ${ANNOTATION_PIPELINE_BASE}/sophiaAnnotateAbridgedCaller.sh | cut -d "." -f 1`
		echo "bsub -J ${project}_${pid}_${analysisTag} ${clusterEoOpts} ${annotationResources} ${ANNOTATION_PIPELINE_BASE}/sophiaAnnotateAbridgedCaller.sh ${tumorFile} NA ${analysisTag} ${configFile} ${project} ${pid} ${outputDir}"
		sleep 0.3s
    else
		tumorFile="`find ${outputDir} | grep /${tumorType}_ | grep _bps.tsv.gz$`"
		bloodFile="`find ${outputDir} | grep /${controlType}_ | grep _bps.tsv.gz$`"
		analysisTag="${tumorType}-${controlType}"
		analysisTag=${analysisTag/\./}
		if [[ "${tumorFile}" == "" ]]
		then
			continue
		fi
		if [[ "${bloodFile}" == "" ]]
		then
			analysisTag="${tumorType}-only"
			analysisTag=${analysisTag/\./}
			outputDir=${outputDir}/${analysisTag}
			BEDPE_RESULT_FILE_sensitivefiltered=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered.bedpe
			BEDPE_RESULT_FILE_sensitivefiltered_SOMATIC=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_somatic.bedpe
			BEDPE_RESULT_FILE_sensitivefiltered_GERMLINE=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_germlineStrict.bedpe
			if [[ -e ${BEDPE_RESULT_FILE_sensitivefiltered} ]] && [[ ! ${forceOverride} == true ]]
			then
				echo "skipping pid, results are already there"
				continue
			fi
			clusterEo=${outputDir}/cluster_eo/
			mkdir -p ${clusterEo}
			#~ clusterEoOpts="-o ${clusterEo} -j oe"
			clusterEoOpts=" -o ${clusterEo}/out.%J -e ${clusterEo}/err.%J "
			#~ job=`qsub $clusterEoOpts -N ${project}_${pid}_${analysisTag} -l ${annotationResources} -v tumorFile=${tumorFile},analysisTag=${analysisTag},bloodFile="NA",CONFIG_FILE=${configFile},project=${project},pid=${pid},outputDir=${outputDir} ${ANNOTATION_PIPELINE_BASE}/sophiaAnnotateAbridgedCaller.sh | cut -d "." -f 1`
			echo "bsub -J ${project}_${pid}_${analysisTag} ${clusterEoOpts} ${annotationResources} ${ANNOTATION_PIPELINE_BASE}/sophiaAnnotateAbridgedCaller.sh ${tumorFile} NA ${analysisTag} ${configFile} ${project} ${pid} ${outputDir}"
			sleep 1s
			continue
		fi
		outputDir=${outputDir}/${analysisTag}
		BEDPE_RESULT_FILE_sensitivefiltered=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered.bedpe
		BEDPE_RESULT_FILE_sensitivefiltered_SOMATIC=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_somatic.bedpe
		BEDPE_RESULT_FILE_sensitivefiltered_GERMLINE=${outputDir}/${prefix}_${project}_${pid}_${analysisTag}_sensitivefiltered_germlineStrict.bedpe
		if [[ -e ${BEDPE_RESULT_FILE_sensitivefiltered_SOMATIC} ]] && [[ ! ${forceOverride} == true ]]
		then
			echo "skipping pid, results are already there"
			continue
		fi
		clusterEo=${outputDir}/cluster_eo/
		mkdir -p ${clusterEo}
		#~ clusterEoOpts="-o ${clusterEo} -j oe"
		clusterEoOpts=" -o ${clusterEo}/out.%J -e ${clusterEo}/err.%J "
		#~ job=`qsub $clusterEoOpts -N ${project}_${pid}_${analysisTag} -l ${annotationResources} -v tumorFile=${tumorFile},analysisTag=${analysisTag},bloodFile=${bloodFile},CONFIG_FILE=${configFile},project=${project},pid=${pid},outputDir=${outputDir} ${ANNOTATION_PIPELINE_BASE}/sophiaAnnotateAbridgedCaller.sh | cut -d "." -f 1`
		echo "bsub -J ${project}_${pid}_${analysisTag} ${clusterEoOpts} ${annotationResources} ${ANNOTATION_PIPELINE_BASE}/sophiaAnnotateAbridgedCaller.sh ${tumorFile} ${bloodFile} ${analysisTag} ${configFile} ${project} ${pid} ${outputDir}"
		#~ echo "qsub $clusterEoOpts -N ${project}_${pid}_${analysisTag} -l ${annotationResources} -v tumorFile=${tumorFile},analysisTag=${analysisTag},bloodFile=${bloodFile},CONFIG_FILE=${configFile},project=${project},pid=${pid},outputDir=${outputDir} ${ANNOTATION_PIPELINE_BASE}/sophiaAnnotateAbridgedCaller.sh"
		#~ sleep 1s
    fi
done
