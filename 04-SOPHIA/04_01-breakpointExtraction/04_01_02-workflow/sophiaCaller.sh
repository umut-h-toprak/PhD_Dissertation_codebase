#!/bin/bash
set -e

CONFIG_FILE=${1}
BAMFILE=${2}
medianIsize=${3}
stdIsizePercentage=${4}
properPairPercentage=${5}
BPS_OUT=${6}

source ${CONFIG_FILE}
touch ${BPS_OUT}_${defaultReadLength}

if [[ -e ${mergedIsizes} ]]
then
    echo "${SAMTOOLS_BINARY} view -F 0x600 -f 0x001 ${BAMFILE} | ${MBUFFER_BINARY} -q -m 2G -l /dev/null | ${SOPHIA_BINARY} --mergedisizes ${mergedIsizes} --properpairpercentage ${properPairPercentage} --clipsize ${clipThreshold} --basequality ${qualThreshold} --basequalitylow ${qualThresholdLow} --lowqualclipsize ${lowQualOverhangThreshold} --isizesigma ${isizeSigmaThreshold} --bpsupport ${bpSupportThreshold} --defaultreadlength ${defaultReadLength} | ${GZIP_BINARY} --best > ${BPS_OUT}"
    ${SAMTOOLS_BINARY} view -F 0x600 -f 0x001 ${BAMFILE} | ${MBUFFER_BINARY} -q -m 2G -l /dev/null | ${SOPHIA_BINARY} --mergedisizes ${mergedIsizes} --properpairpercentage ${properPairPercentage} --clipsize ${clipThreshold} --basequality ${qualThreshold} --basequalitylow ${qualThresholdLow} --lowqualclipsize ${lowQualOverhangThreshold} --isizesigma ${isizeSigmaThreshold} --bpsupport ${bpSupportThreshold} --defaultreadlength ${defaultReadLength} | ${GZIP_BINARY} --best > ${BPS_OUT}
else 
    echo "${SAMTOOLS_BINARY} view -F 0x600 -f 0x001 ${BAMFILE} | ${MBUFFER_BINARY} -q -m 2G -l /dev/null | ${SOPHIA_BINARY} --medianisize ${medianIsize} --stdisizepercentage ${stdIsizePercentage} --properpairpercentage ${properPairPercentage} --clipsize ${clipThreshold} --basequality ${qualThreshold} --basequalitylow ${qualThresholdLow} --lowqualclipsize ${lowQualOverhangThreshold} --isizesigma ${isizeSigmaThreshold} --bpsupport ${bpSupportThreshold} --defaultreadlength ${defaultReadLength} | ${GZIP_BINARY} --best > ${BPS_OUT}"
    ${SAMTOOLS_BINARY} view -F 0x600 -f 0x001 ${BAMFILE} | ${MBUFFER_BINARY} -q -m 2G -l /dev/null | ${SOPHIA_BINARY} --medianisize ${medianIsize} --stdisizepercentage ${stdIsizePercentage} --properpairpercentage ${properPairPercentage} --clipsize ${clipThreshold} --basequality ${qualThreshold} --basequalitylow ${qualThresholdLow} --lowqualclipsize ${lowQualOverhangThreshold} --isizesigma ${isizeSigmaThreshold} --bpsupport ${bpSupportThreshold} --defaultreadlength ${defaultReadLength} | ${GZIP_BINARY} --best > ${BPS_OUT}
fi
