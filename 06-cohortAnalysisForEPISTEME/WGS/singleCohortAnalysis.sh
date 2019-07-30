#!/usr/bin/env bash
#set -o verbose
#set -vx
set -e

analysisType=${1}
project=${2}
projectFolder=${3}
outputFolder=${4}
comparisonTypes=${5}
bcellMode=${6}
rppaExpressionTable=${7}
rppaExpressionQuantity=${8}
geneExpressionTable=${9}
geneExpressionQuantity=${10}
methylomeBetasTable=${11}
diseaseNameAlternatives=${12}
existingMetadataFile=${13}
skipCohort=${14}
skipRnaAnalysis=${15}
justPostProcess=${16}
sqlDbName=${17}
sqlDbUsername=${18}
sqlDbUserPw=${19}


if [[ ${skipCohort} == "SKIP" ]]
then
    exit
fi

if [[ ! -d "$projectFolder" ]]
then
	exit
fi

source ./cohortAnalysisConfig.sh
echo ${analysisType}

EPISTEMEOutputFolder=${outputFolder}/.analysis/${analysisType}
mkdir -p ${EPISTEMEOutputFolder}

donorSvFiles=${EPISTEMEOutputFolder}/${project}_donorSvFiles.tsv
donorIndelFiles=${EPISTEMEOutputFolder}/${project}_donorIndelFiles.tsv
donorSnvFiles=${EPISTEMEOutputFolder}/${project}_donorSnvFiles.tsv
donorCnvFiles=${EPISTEMEOutputFolder}/${project}_donorCnvFiles.tsv


cohortAllSvs=${EPISTEMEOutputFolder}/${project}_cohortAllSvs.tsv
cohortAllSvsMidSize=${EPISTEMEOutputFolder}/${project}_cohortAllSvsMidSize.tsv
cohortAllGeneFusions=${EPISTEMEOutputFolder}/${project}_cohortAllGeneFusions.tsv
cohortAllSnvs=${EPISTEMEOutputFolder}/${project}_cohortAllSnvs.tsv
cohortSignatureOutput=${EPISTEMEOutputFolder}/${project}_cohortSignatureOutput.tsv
cohortAllIndels=${EPISTEMEOutputFolder}/${project}_cohortAllIndels.tsv

metadataOutput=${EPISTEMEOutputFolder}/${project}_metadata.tsv
cohortInformation=${EPISTEMEOutputFolder}/${project}_cohortInformation.tsv

cohortWideGeneLevelVariants=${EPISTEMEOutputFolder}/${project}_cohortWideGeneLevelVariants.tsv.gz

tadRecurrenceSv=${EPISTEMEOutputFolder}/${project}_tadRecurrenceSv.tsv
tadRecurrenceCnv=${EPISTEMEOutputFolder}/${project}_tadRecurrenceCnv.tsv
tadRecurrenceIndel=${EPISTEMEOutputFolder}/${project}_tadRecurrenceIndel.tsv
geneRecurrence=${EPISTEMEOutputFolder}/${project}_geneRecurrence.tsv

localGeneExpressionTable=${EPISTEMEOutputFolder}/${project}_geneExpressions.tsv.gz
localMethylomeBetasTable=${EPISTEMEOutputFolder}/${project}_methylomeBetas.tsv.gz
geneExpressionSummaryKw=${EPISTEMEOutputFolder}/${project}_geneExpressionSummaryKw.tsv.gz
geneExpressionSummaryJf=${EPISTEMEOutputFolder}/${project}_geneExpressionSummaryJf.tsv.gz
geneExpressionSummaryT=${EPISTEMEOutputFolder}/${project}_geneExpressionSummaryT.tsv.gz
geneExpressionSummaryKs=${EPISTEMEOutputFolder}/${project}_geneExpressionSummaryKs.tsv.gz
localRppaExpressionTable=${EPISTEMEOutputFolder}/${project}_rppaExpressions.tsv.gz
rppaExpressionSummaryKw=${EPISTEMEOutputFolder}/${project}_rppaExpressionSummaryKw.tsv.gz
rppaExpressionSummaryJf=${EPISTEMEOutputFolder}/${project}_rppaExpressionSummaryJf.tsv.gz
rppaExpressionSummaryT=${EPISTEMEOutputFolder}/${project}_rppaExpressionSummaryT.tsv.gz
rppaExpressionSummaryKs=${EPISTEMEOutputFolder}/${project}_rppaExpressionSummaryKs.tsv.gz

if [[ -e ${EPISTEMEOutputFolder}/${project}_expressionSummaryKw.tsv.gz ]]
then
    mv ${EPISTEMEOutputFolder}/${project}_expressionSummaryKw.tsv.gz ${geneExpressionSummaryKw}
fi
if [[ -e ${EPISTEMEOutputFolder}/${project}_expressionSummaryJf.tsv.gz ]]
then
    mv ${EPISTEMEOutputFolder}/${project}_expressionSummaryJf.tsv.gz ${geneExpressionSummaryJf}
fi
if [[ -e ${EPISTEMEOutputFolder}/${project}_expressionSummaryT.tsv.gz ]]
then
    mv ${EPISTEMEOutputFolder}/${project}_expressionSummaryT.tsv.gz ${geneExpressionSummaryT}
fi
if [[ -e ${EPISTEMEOutputFolder}/${project}_expressionSummaryKs.tsv.gz ]]
then
    mv ${EPISTEMEOutputFolder}/${project}_expressionSummaryKs.tsv.gz ${geneExpressionSummaryKs}
fi

EPISTEMEFinalOutputFolder=${outputFolder}/.analysis/${analysisType}/EPISTEME
mkdir -p ${EPISTEMEFinalOutputFolder}
set +e
rm ${EPISTEMEFinalOutputFolder}/*
set -e


finalEPISTEMEcohortMetadata=${EPISTEMEFinalOutputFolder}/${project}_cohortMetadata_EPISTEME.tsv
finalEPISTEMEcohortInformation=${EPISTEMEFinalOutputFolder}/${project}_cohortInformation_EPISTEME.tsv
finalEPISTEMEcohortWideGeneLevelVariants=${EPISTEMEFinalOutputFolder}/${project}_cohortWideGeneLevelVariants_EPISTEME.tsv
finalEPISTEMEcohortAllIndels=${EPISTEMEFinalOutputFolder}/${project}_cohortAllIndels_EPISTEME.tsv
finalEPISTEMEcohortAllSnvs=${EPISTEMEFinalOutputFolder}/${project}_cohortAllSnvs_EPISTEME.tsv
finalEPISTEMEcohortAllSvs=${EPISTEMEFinalOutputFolder}/${project}_cohortAllSvs_EPISTEME.tsv
finalEPISTEMEcohortAllSvsMidSize=${EPISTEMEFinalOutputFolder}/${project}_cohortAllSvsMidSize_EPISTEME.tsv
finalEPISTEMEcohortAllGeneFusions=${EPISTEMEFinalOutputFolder}/${project}_cohortAllGeneFusions_EPISTEME.tsv
finalEPISTEMEgeneRecurrence=${EPISTEMEFinalOutputFolder}/${project}_geneRecurrence_EPISTEME.tsv
finalEPISTEMEtadRecurrenceCnv=${EPISTEMEFinalOutputFolder}/${project}_tadRecurrenceCnv_EPISTEME.tsv
finalEPISTEMEtadRecurrenceIndel=${EPISTEMEFinalOutputFolder}/${project}_tadRecurrenceIndel_EPISTEME.tsv
finalEPISTEMEtadRecurrenceSv=${EPISTEMEFinalOutputFolder}/${project}_tadRecurrenceSv_EPISTEME.tsv
finalEPISTEMEgeneExpressionSummaryKw=${EPISTEMEFinalOutputFolder}/${project}_geneExpressionSummaryKw_EPISTEME.tsv
finalEPISTEMEgeneExpressionSummaryJf=${EPISTEMEFinalOutputFolder}/${project}_geneExpressionSummaryJf_EPISTEME.tsv
finalEPISTEMEgeneExpressionSummaryT=${EPISTEMEFinalOutputFolder}/${project}_geneExpressionSummaryT_EPISTEME.tsv
finalEPISTEMEgeneExpressionSummaryKs=${EPISTEMEFinalOutputFolder}/${project}_geneExpressionSummaryKs_EPISTEME.tsv
finalEPISTEMEgeneExpressions=${EPISTEMEFinalOutputFolder}/${project}_geneExpressions_EPISTEME.tsv
finalEPISTEMEmethylomeBetas=${EPISTEMEFinalOutputFolder}/${project}_methylomeBetas_EPISTEME.tsv
finalEPISTEMErppaExpressionSummaryKw=${EPISTEMEFinalOutputFolder}/${project}_rppaExpressionSummaryKw_EPISTEME.tsv
finalEPISTEMErppaExpressionSummaryJf=${EPISTEMEFinalOutputFolder}/${project}_rppaExpressionSummaryJf_EPISTEME.tsv
finalEPISTEMErppaExpressionSummaryT=${EPISTEMEFinalOutputFolder}/${project}_rppaExpressionSummaryT_EPISTEME.tsv
finalEPISTEMErppaExpressionSummaryKs=${EPISTEMEFinalOutputFolder}/${project}_rppaExpressionSummaryKs_EPISTEME.tsv
finalEPISTEMErppaExpressions=${EPISTEMEFinalOutputFolder}/${project}_rppaExpressions_EPISTEME.tsv


localTargetLocation="/var/www/episteme-resources/cohorts/${project}"
localTargetLocationVarDbs="/var/www/episteme-resources/cohorts/VARDBS"

if [[ ! -e ${localTargetLocation} ]]
then
	mkdir ${localTargetLocation}
fi

if [[ ! -e ${localTargetLocationVarDbs} ]]
then
	mkdir ${localTargetLocationVarDbs}
fi

cohortAllIndelsTableName="${project/-/$}_cohortAllIndels"
cohortAllSnvsTableName="${project/-/$}_cohortAllSnvs"
cohortAllSvsTableName="${project/-/$}_cohortAllSvs"
cohortAllSvsMidSizeTableName="${project/-/$}_cohortAllSvsMidSize"
cohortAllGeneFusionsTableName="${project/-/$}_cohortAllGeneFusions"
geneRecurrenceTableName="${project/-/$}_geneRecurrence"
tadRecurrenceCnvTableName="${project/-/$}_tadRecurrenceCnv"
tadRecurrenceSvTableName="${project/-/$}_tadRecurrenceSv"
tadRecurrenceIndelTableName="${project/-/$}_tadRecurrenceIndel"
geneExpressionTableName="${project/-/$}_geneExpressions"
geneExpressionSummaryKwTableName="${project/-/$}_geneExpressionSummaryKw"
geneExpressionSummaryJfTableName="${project/-/$}_geneExpressionSummaryJf"
geneExpressionSummaryTTableName="${project/-/$}_geneExpressionSummaryT"
geneExpressionSummaryKsTableName="${project/-/$}_geneExpressionSummaryKs"
rppaExpressionTableName="${project/-/$}_rppaExpressions"
rppaExpressionSummaryKwTableName="${project/-/$}_rppaExpressionSummaryKw"
rppaExpressionSummaryJfTableName="${project/-/$}_rppaExpressionSummaryJf"
rppaExpressionSummaryTTableName="${project/-/$}_rppaExpressionSummaryT"
rppaExpressionSummaryKsTableName="${project/-/$}_rppaExpressionSummaryKs"
methylomeBetasTableName="${project/-/$}_methylomeBetas"

finalEPISTEMEcohortMetadataLocal=${localTargetLocation}/${project}_cohortMetadata_EPISTEME.tsv
finalEPISTEMEcohortInformationLocal=${localTargetLocation}/${project}_cohortInformation_EPISTEME.tsv
finalEPISTEMEcohortWideGeneLevelVariantsLocal=${localTargetLocationVarDbs}/${project}_cohortWideGeneLevelVariants_EPISTEME.tsv
finalEPISTEMEcohortAllIndelsLocal=${localTargetLocationVarDbs}/${project}_cohortAllIndels_EPISTEME.tsv
finalEPISTEMEcohortAllSnvsLocal=${localTargetLocationVarDbs}/${project}_cohortAllSnvs_EPISTEME.tsv
finalEPISTEMEcohortAllSvsLocal=${localTargetLocationVarDbs}/${project}_cohortAllSvs_EPISTEME.tsv
finalEPISTEMEcohortAllSvsMidSizeLocal=${localTargetLocationVarDbs}/${project}_cohortAllSvsMidSize_EPISTEME.tsv
finalEPISTEMEcohortAllGeneFusionsLocal=${localTargetLocationVarDbs}/${project}_cohortAllGeneFusions_EPISTEME.tsv
finalEPISTEMEgeneRecurrenceLocal=${localTargetLocationVarDbs}/${project}_geneRecurrence_EPISTEME.tsv
finalEPISTEMEtadRecurrenceCnvLocal=${localTargetLocationVarDbs}/${project}_tadRecurrenceCnv_EPISTEME.tsv
finalEPISTEMEtadRecurrenceIndelLocal=${localTargetLocationVarDbs}/${project}_tadRecurrenceIndel_EPISTEME.tsv
finalEPISTEMEtadRecurrenceSvLocal=${localTargetLocationVarDbs}/${project}_tadRecurrenceSv_EPISTEME.tsv
finalEPISTEMEgeneExpressionSummaryKwLocal=${localTargetLocationVarDbs}/${project}_geneExpressionSummaryKw_EPISTEME.tsv
finalEPISTEMEgeneExpressionSummaryJfLocal=${localTargetLocationVarDbs}/${project}_geneExpressionSummaryJf_EPISTEME.tsv
finalEPISTEMEgeneExpressionSummaryTLocal=${localTargetLocationVarDbs}/${project}_geneExpressionSummaryT_EPISTEME.tsv
finalEPISTEMEgeneExpressionSummaryKsLocal=${localTargetLocationVarDbs}/${project}_geneExpressionSummaryKs_EPISTEME.tsv
finalEPISTEMEgeneExpressionsLocal=${localTargetLocationVarDbs}/${project}_geneExpressions_EPISTEME.tsv
finalEPISTEMErppaExpressionSummaryKwLocal=${localTargetLocationVarDbs}/${project}_rppaExpressionSummaryKw_EPISTEME.tsv
finalEPISTEMErppaExpressionSummaryJfLocal=${localTargetLocationVarDbs}/${project}_rppaExpressionSummaryJf_EPISTEME.tsv
finalEPISTEMErppaExpressionSummaryTLocal=${localTargetLocationVarDbs}/${project}_rppaExpressionSummaryT_EPISTEME.tsv
finalEPISTEMErppaExpressionSummaryKsLocal=${localTargetLocationVarDbs}/${project}_rppaExpressionSummaryKs_EPISTEME.tsv
finalEPISTEMErppaExpressionsLocal=${localTargetLocationVarDbs}/${project}_rppaExpressions_EPISTEME.tsv
finalEPISTEMEmethylomeBetasLocal=${localTargetLocationVarDbs}/${project}_methylomeBetas_EPISTEME.tsv

if [[ "${geneExpressionTable}" != "NA" ]]
then
    cp ${geneExpressionTable}  ${localGeneExpressionTable}
fi
if [[ "${rppaExpressionTable}" != "NA" ]]
then
    cp ${rppaExpressionTable} ${localRppaExpressionTable}
fi
if [[ "${methylomeBetasTable}" != "NA" ]]
then
    cp ${methylomeBetasTable} ${localMethylomeBetasTable}
fi

if [[ "${justPostProcess}" != "SKIP" ]]
then
    numDonors=0
    >${donorSvFiles}
    >${donorIndelFiles}
    >${donorSnvFiles}
    >${donorCnvFiles}

    for donorFolder in ${projectFolder}/*
    do
        if [[ ! -d "$donorFolder" ]]
        then
            continue
        fi
        donor="${donorFolder##*/}"
        donorOutputFolder=${outputFolder}/${donor}/
        svFile=$(${pythonBinary} ${pickerSv} ${donorFolder}/SOPHIA/ ${comparisonTypes})
#        svFileSomatic=$(echo ${svFiles} | cut -d" " -f1)
#        svFile=${svFileSomatic}
#        svFileGermline=$(echo ${svFiles} | cut -d" " -f2)
#        svFileMerged=$(echo ${svFiles} | cut -d" " -f3)
#        if [[ "${svFileSomatic}" == "NA" ]] && [[ "${svFileGermline}" == "NA" ]] && [[ "${svFileMerged}" != "NA" ]]
#        then
#            echo "tumor-only mode"
#            svFile=${svFileMerged}
#        fi
#        if [[ ${analysisType} == "somatic" ]]
#        then
##            svFile=${svFileMerged}
#            :
#        elif [[ ${analysisType} == "germline" ]]
#        then
#            svFile=${svFileGermline}
#        elif [[ ${analysisType} == "merged" ]]
#        then
#            svFile=${svFileMerged}
#        else
#            exit
#        fi
        if [[ ! -e "${svFile}" ]]
        then
            echo "skipping donor "${donor}
            continue
        fi
        echo "$(dirname ${svFile})"
        svFileBase=${svFile##*/}
        echo -e "${svFile}\t${donor}" >> ${donorSvFiles}
        numDonors=$((numDonors+1))
        snvFiles=$(${pythonBinary} ${pickerSmallVar} ${donorFolder}/SOPHIA/ ${comparisonTypes} SNV)
        if [[ ${snvFiles} != "NA" ]]
        then
            echo -e "${snvFiles}\t${donor}" >> ${donorSnvFiles}
        fi
        indelFiles=$(${pythonBinary} ${pickerSmallVar} ${donorFolder}/SOPHIA/ ${comparisonTypes} indel)
        if [[ ${indelFiles} != "NA" ]]
        then
            echo -e "${indelFiles}\t${donor}" >> ${donorIndelFiles}
        fi
        cnvFiles=$(${pythonBinary} ${pickerCnv} ${donorFolder}/SOPHIA/ ${comparisonTypes})
        if [[ ${cnvFiles} != "NA" ]]
        then
            echo -e "${cnvFiles}\t${donor}" >> ${donorCnvFiles}
        fi
    done
    if (( $numDonors < 2 ))
    then
        if [[ -e ${metadataOutput} ]]; then rm ${metadataOutput}; fi
        if [[ -e ${donorSvFiles} ]]; then rm ${donorSvFiles}; fi
        if [[ -e ${donorIndelFiles} ]]; then rm ${donorIndelFiles}; fi
        if [[ -e ${donorSnvFiles} ]]; then rm ${donorSnvFiles}; fi
        if [[ -e ${donorCnvFiles} ]]; then rm ${donorCnvFiles}; fi
        if [[ -e ${cohortWideGeneLevelVariants} ]]; then rm ${cohortWideGeneLevelVariants}; fi
        exit
    fi
    echo "Snv"
    echo "${pythonBinary} ${processSnvFiles} ${donorSnvFiles} ${refChromosomes} ${refConsensusTADs} ${refRoadmapEnhancers} ${refEnsemblIdToGeneSymbol} ${refRefseqToEnsembl} ${refNcbiSynonyms} ${cohortAllSnvs} ${refGenesServer}"
    ${pythonBinary} ${processSnvFiles} ${donorSnvFiles} ${refChromosomes} ${refConsensusTADs} ${refRoadmapEnhancers} ${refEnsemblIdToGeneSymbol} ${refRefseqToEnsembl} ${refNcbiSynonyms} ${cohortAllSnvs} ${refGenesServer}

    dumLc=$(cat ${cohortAllSnvs}|wc -l)
    echo ${dumLc}
    if [[ "$dumLc" != "0" ]]
    then
        echo "SignatureAnalysis"
        > ${cohortSignatureOutput}
        echo "${rscriptBinary} ${signatureAnalysis} ${cohortAllSnvs} genome ${cohortSignatureOutput}"
        ${rscriptBinary} ${signatureAnalysis} ${cohortAllSnvs} "genome" ${cohortSignatureOutput}
        sed -i '1 s/^/donor\t/' ${cohortSignatureOutput}
    else
        cohortSignatureOutput="NA"
    fi
    echo "Indel"
    echo "${pythonBinary} ${processIndelFiles} ${donorIndelFiles} ${refChromosomes} ${refConsensusTADs} ${refRoadmapEnhancers} ${refEnsemblIdToGeneSymbol} ${refRefseqToEnsembl} ${refNcbiSynonyms} ${cohortAllIndels} ${refGenesServer}"
    ${pythonBinary} ${processIndelFiles} ${donorIndelFiles} ${refChromosomes} ${refConsensusTADs} ${refRoadmapEnhancers} ${refEnsemblIdToGeneSymbol} ${refRefseqToEnsembl} ${refNcbiSynonyms} ${cohortAllIndels} ${refGenesServer}


    echo "Sv"
    ${pythonBinary} ${processSvFiles} ${donorSvFiles} ${refChromosomes} ${refCytobands} ${refConsensusTADs} ${bcellMode} ${refRoadmapEnhancers} ${refEnsemblIdToGeneSymbol} ${refRefseqToEnsembl} ${refNcbiSynonyms} ${cohortAllSvs} ${cohortAllSvsMidSize} ${refFragileSitesServer} ${cohortAllGeneFusions} ${refGenesServer} ${project}

    >${metadataOutput}
    echo "MetadataProcessing"
    echo "${pythonBinary} ${metadataGeneration} ${donorSvFiles} ${donorSnvFiles} ${donorCnvFiles} ${donorIndelFiles} ${geneExpressionTable} ${rppaExpressionTable} ${methylomeBetasTable} ${existingMetadataFile} ${cohortAllSvs} ${cohortAllSvsMidSize} ${cohortAllSnvs} ${cohortAllIndels} ${cohortSignatureOutput}"
    ${pythonBinary} ${metadataGeneration} ${donorSvFiles} ${donorSnvFiles} ${donorCnvFiles} ${donorIndelFiles} ${geneExpressionTable} ${rppaExpressionTable} ${methylomeBetasTable} ${existingMetadataFile} ${cohortAllSvs} ${cohortAllSvsMidSize} ${cohortAllSnvs} ${cohortAllIndels} ${cohortSignatureOutput} > ${metadataOutput}

    cp ${cohortAllSnvs} ${cohortAllSnvs}Tmp
    cp ${cohortAllIndels} ${cohortAllIndels}Tmp

    grep -v SKIP ${cohortAllSnvs}Tmp | cut -f1-6,9 > ${cohortAllSnvs}
    grep -v SKIP ${cohortAllIndels}Tmp | cut -f1-10,12 > ${cohortAllIndels}

    rm ${cohortAllSnvs}Tmp ${cohortAllIndels}Tmp

    echo "SvRecurrence"
    ${pythonBinary} ${multiInterTadBased} ${refConsensusTADs} ${cohortAllSvs} > ${tadRecurrenceSv}
    echo "OffIndelRecurrence"
    ${pythonBinary} ${multiInterTadBased} ${refConsensusTADs} ${cohortAllIndels} ${cohortAllSvsMidSize} > ${tadRecurrenceIndel}
    echo "CnvRecurrence"
    ${pythonBinary} ${multiInterCnvs} ${refConsensusTADs} ${donorCnvFiles} > ${tadRecurrenceCnv}

    >${cohortWideGeneLevelVariants}
    echo "CohortWideGeneLevelVariants"
    ${pythonBinary} ${cohortWideGeneLevelVariantsSummarizer} ${cohortAllSvs} ${cohortAllSvsMidSize} ${cohortAllGeneFusions} ${cohortAllIndels} ${cohortAllSnvs} ${refConsensusTADs} ${cohortWideGeneLevelVariants}_NoCnvPre
    sort -k1,1V -k2,2V -k3,3V ${cohortWideGeneLevelVariants}_NoCnvPre | uniq > ${cohortWideGeneLevelVariants}_NoCnv
    cut -f2,4 ${donorCnvFiles} | while read line
    do
        pid=$(echo ${line} | cut -d" " -f2)
        cnvGeneLevel=$(echo ${line} | cut -d" " -f1)
        paste <(pigz -dc ${cnvGeneLevel} | cut -f1 | sed "s/$/\t${pid}/") <(pigz -dc ${cnvGeneLevel} | cut -f3) >> ${cohortWideGeneLevelVariants}_NoCnv
    done
    sort -k1,1V -k2,2V -k3,3V ${cohortWideGeneLevelVariants}_NoCnv | pigz --best > ${cohortWideGeneLevelVariants}
    rm ${cohortWideGeneLevelVariants}_NoCnv

    echo "GeneRecurrence"
    ${pythonBinary} ${multiInterGene} ${cohortWideGeneLevelVariants} ${refVariantTypes} > ${geneRecurrence}

    if [[ "${geneExpressionTable}" != "NA" ]]
    then
        if [[ ${skipRnaAnalysis} != "SKIP" ]]
        then
            echo "GeneExpression"
            numExpectedGenes="$(pigz -dc ${localGeneExpressionTable}|wc -l)"
            ${pythonBinary} ${rnaIntegration} "jf" ${cohortWideGeneLevelVariants} ${geneExpressionTable} ${metadataOutput} ${refChrYBlacklist} ${numExpectedGenes} ${refComparisonTypes} | pigz --best > ${geneExpressionSummaryJf}
            ${pythonBinary} ${rnaIntegration} "ks" ${cohortWideGeneLevelVariants} ${geneExpressionTable} ${metadataOutput} ${refChrYBlacklist} ${numExpectedGenes} ${refComparisonTypes} | pigz --best > ${geneExpressionSummaryKs}
            ${pythonBinary} ${rnaIntegration} "kw" ${cohortWideGeneLevelVariants} ${geneExpressionTable} ${metadataOutput} ${refChrYBlacklist} ${numExpectedGenes} ${refComparisonTypes} | pigz --best > ${geneExpressionSummaryKw}
            ${pythonBinary} ${rnaIntegration} "ttest" ${cohortWideGeneLevelVariants} ${geneExpressionTable} ${metadataOutput} ${refChrYBlacklist} ${numExpectedGenes} ${refComparisonTypes} | pigz --best > ${geneExpressionSummaryT}
        fi
    else
        set +e
        rm ${EPISTEMEOutputFolder}/${project}_geneExpressionSummary*
        set +e
    fi

    if [[ "${rppaExpressionTable}" != "NA" ]]
    then
        echo "RppaExpression"
        numExpectedGenes="$(pigz -dc ${localRppaExpressionTable}|wc -l)"
        ${pythonBinary} ${rppaIntegration} "kw" ${cohortWideGeneLevelVariants} ${rppaExpressionTable} ${refRppaAntibodies} ${metadataOutput} ${refChrYBlacklist} ${numExpectedGenes} ${refComparisonTypes} | pigz --best > ${rppaExpressionSummaryKw}
        ${pythonBinary} ${rppaIntegration} "jf" ${cohortWideGeneLevelVariants} ${rppaExpressionTable} ${refRppaAntibodies} ${metadataOutput} ${refChrYBlacklist} ${numExpectedGenes} ${refComparisonTypes} | pigz --best > ${rppaExpressionSummaryJf}
        ${pythonBinary} ${rppaIntegration} "ttest" ${cohortWideGeneLevelVariants} ${rppaExpressionTable} ${refRppaAntibodies} ${metadataOutput} ${refChrYBlacklist} ${numExpectedGenes} ${refComparisonTypes} | pigz --best > ${rppaExpressionSummaryT}
        ${pythonBinary} ${rppaIntegration} "ks" ${cohortWideGeneLevelVariants} ${rppaExpressionTable} ${refRppaAntibodies} ${metadataOutput} ${refChrYBlacklist} ${numExpectedGenes} ${refComparisonTypes} | pigz --best > ${rppaExpressionSummaryKs}
    else
        set +e
        rm ${EPISTEMEOutputFolder}/${project}_rppaExpressionSummary*
        set +e
    fi
else
    numDonors=0
    >${donorSvFiles}
    >${donorIndelFiles}
    >${donorSnvFiles}
    >${donorCnvFiles}
    >${metadataOutput}
    >${cohortWideGeneLevelVariants}

    for donorFolder in ${projectFolder}/*
    do
        if [[ ! -d "$donorFolder" ]]
        then
            continue
        fi

        donor="${donorFolder##*/}"
        donorOutputFolder=${outputFolder}/${donor}/
        svFile=$(${pythonBinary} ${pickerSv} ${donorFolder}/SOPHIA/ ${comparisonTypes})
        if [[ ! -e "${svFile}" ]]
        then
            echo "skipping donor "${donor}
            continue
        fi
        echo "$(dirname ${svFile})"
        svFileBase=${svFile##*/}
        echo -e "${svFile}\t${donor}" >> ${donorSvFiles}
        numDonors=$((numDonors+1))
        snvFiles=$(${pythonBinary} ${pickerSmallVar} ${donorFolder}/SOPHIA/ ${comparisonTypes} SNV)
        if [[ ${snvFiles} != "NA" ]]
        then
            echo -e "${snvFiles}\t${donor}" >> ${donorSnvFiles}
        fi
        indelFiles=$(${pythonBinary} ${pickerSmallVar} ${donorFolder}/SOPHIA/ ${comparisonTypes} indel)
        if [[ ${indelFiles} != "NA" ]]
        then
            echo -e "${indelFiles}\t${donor}" >> ${donorIndelFiles}
        fi
        cnvFiles=$(${pythonBinary} ${pickerCnv} ${donorFolder}/SOPHIA/ ${comparisonTypes})
        if [[ ${cnvFiles} != "NA" ]]
        then
            echo -e "${cnvFiles}\t${donor}" >> ${donorCnvFiles}
        fi
    done
    if (( $numDonors < 2 ))
    then
        if [[ -e ${metadataOutput} ]]; then rm ${metadataOutput}; fi
        if [[ -e ${donorSvFiles} ]]; then rm ${donorSvFiles}; fi
        if [[ -e ${donorIndelFiles} ]]; then rm ${donorIndelFiles}; fi
        if [[ -e ${donorSnvFiles} ]]; then rm ${donorSnvFiles}; fi
        if [[ -e ${donorCnvFiles} ]]; then rm ${donorCnvFiles}; fi
        if [[ -e ${cohortWideGeneLevelVariants} ]]; then rm ${cohortWideGeneLevelVariants}; fi
        exit
    fi
    echo "SignatureAnalysis"
    > ${cohortSignatureOutput}
    ${rscriptBinary} ${signatureAnalysis} ${cohortAllSnvs} "genome" ${cohortSignatureOutput}
    sed -i '1 s/^/donor\t/' ${cohortSignatureOutput}
    ${pythonBinary} ${metadataGeneration} ${donorSvFiles} ${donorSnvFiles} ${donorCnvFiles} ${donorIndelFiles} ${geneExpressionTable} ${rppaExpressionTable} ${methylomeBetasTable} ${existingMetadataFile} ${cohortAllSvs} ${cohortAllSvsMidSize} ${cohortAllSnvs} ${cohortAllIndels} ${cohortSignatureOutput} > ${metadataOutput}
    cp ${cohortAllSnvs} ${cohortAllSnvs}Tmp
    cp ${cohortAllIndels} ${cohortAllIndels}Tmp

    grep -v SKIP ${cohortAllSnvs}Tmp | cut -f1-6,9 > ${cohortAllSnvs}
    grep -v SKIP ${cohortAllIndels}Tmp | cut -f1-10,12 > ${cohortAllIndels}
#    set +e
#    rm ${donorSvFiles} ${donorIndelFiles} ${donorSnvFiles} ${donorCnvFiles}
#    set -e
fi

if [[ "${geneExpressionTable}" == "NA" ]]
then
    if [[ "${rppaExpressionTable}" == "NA" ]]
    then
        set +e
        rm ${cohortWideGeneLevelVariants}
        set -e
        cohortWideGeneLevelVariants="NA"
    fi
fi
set -vx
> ${cohortInformation}
echo -e "diseaseNameAlternatives\t${diseaseNameAlternatives}"  >> ${cohortInformation}


${pythonBinary} ${sqlPrePreparations} ${metadataOutput} ${refVariantTypes} ${refComparisonTypes} ${tadRecurrenceSv} ${tadRecurrenceCnv} ${tadRecurrenceIndel} ${geneRecurrence} ${cohortAllSvs} ${cohortAllSvsMidSize} ${cohortAllSnvs} ${cohortAllIndels} ${cohortWideGeneLevelVariants} ${cohortAllGeneFusions}

if [[ "${geneExpressionTable}" != "NA" ]]
then
    ${pythonBinary} ${sqlPrePreparationsExpression} ${metadataOutput} ${localGeneExpressionTable} ${refRppaAntibodies} ${refComparisonTypes} ${refGenesServer} ${refChrYBlacklist} ${geneExpressionSummaryKw} ${geneExpressionSummaryT} ${geneExpressionSummaryKs} ${geneExpressionSummaryJf}
    echo -e "geneExpressionQuantity\t${geneExpressionQuantity}" | sed 's/_/ /' >> ${cohortInformation}
fi
if [[ "${methylomeBetasTable}" != "NA" ]]
then
    ${pythonBinary} ${sqlPrePreparationsExpression} ${metadataOutput} ${localMethylomeBetasTable} ${refRppaAntibodies} ${refComparisonTypes} ${refGenesServer} ${refChrYBlacklist} "NA" "NA" "NA" "NA"
fi

if [[ "${rppaExpressionTable}" != "NA" ]]
then
    ${pythonBinary} ${sqlPrePreparationsExpression} ${metadataOutput} ${localRppaExpressionTable} ${refRppaAntibodies} ${refComparisonTypes} ${refGenesServer} ${refChrYBlacklist} ${rppaExpressionSummaryKw} ${rppaExpressionSummaryT} ${rppaExpressionSummaryKs} ${rppaExpressionSummaryJf}
    if [[ "$(head -n1 ${localRppaExpressionTable/".tsv.gz"/"_EPISTEME.tsv"} | wc -w)" != "1" ]]
    then
        echo -e "rppaExpressionQuantity\t${rppaExpressionQuantity}" | sed 's/_/ /' >> ${cohortInformation}
    else
        rppaExpressionTable="NA"
    fi
fi

cp ${cohortInformation} ${cohortInformation}.tmp
cat ${cohortInformation}.tmp | ${datamashBinary} transpose > ${cohortInformation}
rm ${cohortInformation}.tmp

find ${EPISTEMEOutputFolder} | grep _EPISTEME | grep -v $'/EPISTEME' | while read line
do
    mv ${line} ${EPISTEMEFinalOutputFolder}
done

mv ${metadataOutput} ${finalEPISTEMEcohortMetadata}
mv ${cohortInformation} ${finalEPISTEMEcohortInformation}

mv ${finalEPISTEMEcohortMetadata} ${finalEPISTEMEcohortMetadataLocal}
mv ${finalEPISTEMEcohortInformation} ${finalEPISTEMEcohortInformationLocal}

mv ${finalEPISTEMEcohortAllIndels} ${finalEPISTEMEcohortAllIndelsLocal}
mv ${finalEPISTEMEcohortAllSnvs} ${finalEPISTEMEcohortAllSnvsLocal}
mv ${finalEPISTEMEcohortAllSvs} ${finalEPISTEMEcohortAllSvsLocal}
mv ${finalEPISTEMEcohortAllSvsMidSize} ${finalEPISTEMEcohortAllSvsMidSizeLocal}
mv ${finalEPISTEMEcohortAllGeneFusions} ${finalEPISTEMEcohortAllGeneFusionsLocal}
mv ${finalEPISTEMEgeneRecurrence} ${finalEPISTEMEgeneRecurrenceLocal}
mv ${finalEPISTEMEtadRecurrenceCnv} ${finalEPISTEMEtadRecurrenceCnvLocal}
mv ${finalEPISTEMEtadRecurrenceIndel} ${finalEPISTEMEtadRecurrenceIndelLocal}
mv ${finalEPISTEMEtadRecurrenceSv} ${finalEPISTEMEtadRecurrenceSvLocal}

${pythonBinary} ${dataToSql} ${finalEPISTEMEcohortAllIndelsLocal} ${cohortAllIndelsTableName} ${cohortAllIndelsTemplate} > ${finalEPISTEMEcohortAllIndelsLocal}.sql
${pythonBinary} ${dataToSql} ${finalEPISTEMEcohortAllSnvsLocal} ${cohortAllSnvsTableName} ${cohortAllSnvsTemplate} > ${finalEPISTEMEcohortAllSnvsLocal}.sql
${pythonBinary} ${dataToSql} ${finalEPISTEMEcohortAllSvsLocal} ${cohortAllSvsTableName} ${cohortAllSvsTemplate} > ${finalEPISTEMEcohortAllSvsLocal}.sql
${pythonBinary} ${dataToSql} ${finalEPISTEMEcohortAllSvsMidSizeLocal} ${cohortAllSvsMidSizeTableName} ${cohortAllSvsMidSizeTemplate} > ${finalEPISTEMEcohortAllSvsMidSizeLocal}.sql
${pythonBinary} ${dataToSql} ${finalEPISTEMEcohortAllGeneFusionsLocal} ${cohortAllGeneFusionsTableName} ${cohortAllGeneFusionsTemplate} > ${finalEPISTEMEcohortAllGeneFusionsLocal}.sql
${pythonBinary} ${dataToSql} ${finalEPISTEMEgeneRecurrenceLocal} ${geneRecurrenceTableName} ${geneRecurrenceTemplate} > ${finalEPISTEMEgeneRecurrenceLocal}.sql
${pythonBinary} ${dataToSql} ${finalEPISTEMEtadRecurrenceCnvLocal} ${tadRecurrenceCnvTableName} ${tadRecurrenceCnvTemplate} > ${finalEPISTEMEtadRecurrenceCnvLocal}.sql
${pythonBinary} ${dataToSql} ${finalEPISTEMEtadRecurrenceIndelLocal} ${tadRecurrenceIndelTableName} ${tadRecurrenceIndelTemplate} > ${finalEPISTEMEtadRecurrenceIndelLocal}.sql
${pythonBinary} ${dataToSql} ${finalEPISTEMEtadRecurrenceSvLocal} ${tadRecurrenceSvTableName} ${tadRecurrenceSvTemplate} > ${finalEPISTEMEtadRecurrenceSvLocal}.sql

mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEcohortAllIndelsLocal}.sql && pigz -f --best ${finalEPISTEMEcohortAllIndelsLocal}
mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEcohortAllSnvsLocal}.sql && pigz -f --best ${finalEPISTEMEcohortAllSnvsLocal}
mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEcohortAllSvsLocal}.sql && pigz -f --best ${finalEPISTEMEcohortAllSvsLocal}
mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEcohortAllSvsMidSizeLocal}.sql && pigz -f --best ${finalEPISTEMEcohortAllSvsMidSizeLocal}
mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEcohortAllGeneFusionsLocal}.sql && pigz -f --best ${finalEPISTEMEcohortAllGeneFusionsLocal}
mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEgeneRecurrenceLocal}.sql && pigz -f --best ${finalEPISTEMEgeneRecurrenceLocal}
mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEtadRecurrenceCnvLocal}.sql && pigz -f --best ${finalEPISTEMEtadRecurrenceCnvLocal}
mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEtadRecurrenceIndelLocal}.sql && pigz -f --best ${finalEPISTEMEtadRecurrenceIndelLocal}
mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEtadRecurrenceSvLocal}.sql && pigz -f --best ${finalEPISTEMEtadRecurrenceSvLocal}

if [[ "${geneExpressionTable}" != "NA" ]]
then
    mv ${finalEPISTEMEgeneExpressionSummaryKw} ${finalEPISTEMEgeneExpressionSummaryKwLocal}
    mv ${finalEPISTEMEgeneExpressionSummaryJf} ${finalEPISTEMEgeneExpressionSummaryJfLocal}
    mv ${finalEPISTEMEgeneExpressionSummaryT} ${finalEPISTEMEgeneExpressionSummaryTLocal}
    mv ${finalEPISTEMEgeneExpressionSummaryKs} ${finalEPISTEMEgeneExpressionSummaryKsLocal}
    mv ${finalEPISTEMEgeneExpressions} ${finalEPISTEMEgeneExpressionsLocal}
    ${pythonBinary} ${dataToSql} ${finalEPISTEMEgeneExpressionSummaryKwLocal} ${geneExpressionSummaryKwTableName} ${geneExpressionSummaryTemplate} > ${finalEPISTEMEgeneExpressionSummaryKwLocal}.sql
    ${pythonBinary} ${dataToSql} ${finalEPISTEMEgeneExpressionSummaryJfLocal} ${geneExpressionSummaryJfTableName} ${geneExpressionSummaryTemplate} > ${finalEPISTEMEgeneExpressionSummaryJfLocal}.sql
    ${pythonBinary} ${dataToSql} ${finalEPISTEMEgeneExpressionSummaryTLocal} ${geneExpressionSummaryTTableName} ${geneExpressionSummaryTemplate} > ${finalEPISTEMEgeneExpressionSummaryTLocal}.sql
    ${pythonBinary} ${dataToSql} ${finalEPISTEMEgeneExpressionSummaryKsLocal} ${geneExpressionSummaryKsTableName} ${geneExpressionSummaryTemplate} > ${finalEPISTEMEgeneExpressionSummaryKsLocal}.sql
    ${pythonBinary} ${dataToSql} ${finalEPISTEMEgeneExpressionsLocal} ${geneExpressionTableName} ${geneExpressionsTemplate} > ${finalEPISTEMEgeneExpressionsLocal}.sql
    mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEgeneExpressionSummaryKwLocal}.sql && pigz -f --best ${finalEPISTEMEgeneExpressionSummaryKwLocal}
    mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEgeneExpressionSummaryJfLocal}.sql && pigz -f --best ${finalEPISTEMEgeneExpressionSummaryJfLocal}
    mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEgeneExpressionSummaryTLocal}.sql && pigz -f --best ${finalEPISTEMEgeneExpressionSummaryTLocal}
    mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEgeneExpressionSummaryKsLocal}.sql && pigz -f --best ${finalEPISTEMEgeneExpressionSummaryKsLocal}
    mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEgeneExpressionsLocal}.sql && pigz -f --best ${finalEPISTEMEgeneExpressionsLocal}
fi

if [[ "${methylomeBetasTable}" != "NA" ]]
then
    mv ${finalEPISTEMEmethylomeBetas} ${finalEPISTEMEmethylomeBetasLocal}
    ${pythonBinary} ${dataToSql} ${finalEPISTEMEmethylomeBetasLocal} ${methylomeBetasTableName} ${methylomeBetasTemplate} > ${finalEPISTEMEmethylomeBetasLocal}.sql
    mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMEmethylomeBetasLocal}.sql && pigz -f --best ${finalEPISTEMEmethylomeBetasLocal}
fi

if [[ "${rppaExpressionTable}" != "NA" ]]
then
    mv ${finalEPISTEMErppaExpressionSummaryKw} ${finalEPISTEMErppaExpressionSummaryKwLocal}
    mv ${finalEPISTEMErppaExpressionSummaryJf} ${finalEPISTEMErppaExpressionSummaryJfLocal}
    mv ${finalEPISTEMErppaExpressionSummaryT} ${finalEPISTEMErppaExpressionSummaryTLocal}
    mv ${finalEPISTEMErppaExpressionSummaryKs} ${finalEPISTEMErppaExpressionSummaryKsLocal}
    mv ${finalEPISTEMErppaExpressions} ${finalEPISTEMErppaExpressionsLocal}
    ${pythonBinary} ${dataToSql} ${finalEPISTEMErppaExpressionSummaryKwLocal} ${rppaExpressionSummaryKwTableName} ${rppaExpressionSummaryTemplate} > ${finalEPISTEMErppaExpressionSummaryKwLocal}.sql
    ${pythonBinary} ${dataToSql} ${finalEPISTEMErppaExpressionSummaryJfLocal} ${rppaExpressionSummaryJfTableName} ${rppaExpressionSummaryTemplate} > ${finalEPISTEMErppaExpressionSummaryJfLocal}.sql
    ${pythonBinary} ${dataToSql} ${finalEPISTEMErppaExpressionSummaryTLocal} ${rppaExpressionSummaryTTableName} ${rppaExpressionSummaryTemplate} > ${finalEPISTEMErppaExpressionSummaryTLocal}.sql
    ${pythonBinary} ${dataToSql} ${finalEPISTEMErppaExpressionSummaryKsLocal} ${rppaExpressionSummaryKsTableName} ${rppaExpressionSummaryTemplate} > ${finalEPISTEMErppaExpressionSummaryKsLocal}.sql
    ${pythonBinary} ${dataToSql} ${finalEPISTEMErppaExpressionsLocal} ${rppaExpressionTableName} ${rppaExpressionsTemplate} > ${finalEPISTEMErppaExpressionsLocal}.sql
    mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMErppaExpressionSummaryKwLocal}.sql && pigz -f --best ${finalEPISTEMErppaExpressionSummaryKwLocal}
    mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMErppaExpressionSummaryJfLocal}.sql && pigz -f --best ${finalEPISTEMErppaExpressionSummaryJfLocal}
    mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMErppaExpressionSummaryTLocal}.sql && pigz -f --best ${finalEPISTEMErppaExpressionSummaryTLocal}
    mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMErppaExpressionSummaryKsLocal}.sql && pigz -f --best ${finalEPISTEMErppaExpressionSummaryKsLocal}
    mysql -u episteme -pepidb@dm episteme < ${finalEPISTEMErppaExpressionsLocal}.sql && pigz -f --best ${finalEPISTEMErppaExpressionsLocal}
fi
