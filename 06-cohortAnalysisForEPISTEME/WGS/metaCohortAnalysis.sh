#!/bin/bash
#set -o verbose
#set -vx
set -e

analysisParametersFile=${1}
sqlDbName=${2}
sqlDbUsername=${3}
sqlDbUserPw=${4}

source ./cohortAnalysisConfig.sh

${pythonBinary} ${dataToSql} ${refChromosomesServer} "references_refChromosomes" ${refChromosomesSqlHeaderServer} > ${refChromosomesServer}.sql
${pythonBinary} ${dataToSql} ${refColoursServer} "references_refColours" ${refColoursSqlHeaderServer} > ${refColoursServer}.sql
${pythonBinary} ${dataToSql} ${refComparisonTypesServer} "references_refComparisonTypes" ${refComparisonTypesSqlHeaderServer} > ${refComparisonTypesServer}.sql
${pythonBinary} ${dataToSql} ${refCytobandsServer} "references_refCytobands" ${refCytobandsSqlHeaderServer} > ${refCytobandsServer}.sql
${pythonBinary} ${dataToSql} ${refChromosomeArmsServer} "references_refChromosomeArms" ${refChromosomeArmsSqlHeaderServer} > ${refChromosomeArmsServer}.sql
${pythonBinary} ${dataToSql} ${refGenesServer} "references_refGenes" ${refGenesSqlHeaderServer} > ${refGenesServer}.sql
${pythonBinary} ${dataToSql} ${refGeneTypesServer} "references_refGeneTypes" ${refGeneTypesSqlHeaderServer} > ${refGeneTypesServer}.sql
${pythonBinary} ${dataToSql} ${refRppaAntibodiesServer} "references_refRppaAntibodies" ${refRppaAntibodiesSqlHeaderServer} > ${refRppaAntibodiesServer}.sql
${pythonBinary} ${dataToSql} ${refTadsServer} "references_refTads" ${refTadsSqlHeaderServer} > ${refTadsServer}.sql
${pythonBinary} ${dataToSql} ${refVariantTypesServer} "references_refVariantTypes" ${refVariantTypesSqlHeaderServer} > ${refVariantTypesServer}.sql
${pythonBinary} ${dataToSql} ${refVariantVizTypesServer} "references_refVariantVizTypes" ${refVariantVizTypesSqlHeaderServer} > ${refVariantVizTypesServer}.sql
${pythonBinary} ${dataToSql} ${refFragileSitesServer} "references_refFragileSites" ${refFragileSitesSqlHeaderServer} > ${refFragileSitesServer}.sql
${pythonBinary} ${dataToSql} ${refReactomePathwaysServer} "references_refReactomePathways" ${refReactomePathwaysSqlHeaderServer} > ${refReactomePathwaysServer}.sql

mysql -u ${sqlDbUsername} -p ${sqlDbUserPw} ${sqlDbName} < ${refChromosomesServer}.sql
mysql -u ${sqlDbUsername} -p ${sqlDbUserPw} ${sqlDbName} < ${refColoursServer}.sql
mysql -u ${sqlDbUsername} -p ${sqlDbUserPw} ${sqlDbName} < ${refComparisonTypesServer}.sql
mysql -u ${sqlDbUsername} -p ${sqlDbUserPw} ${sqlDbName} < ${refCytobandsServer}.sql
mysql -u ${sqlDbUsername} -p ${sqlDbUserPw} ${sqlDbName} < ${refChromosomeArmsServer}.sql
mysql -u ${sqlDbUsername} -p ${sqlDbUserPw} ${sqlDbName} < ${refGenesServer}.sql
mysql -u ${sqlDbUsername} -p ${sqlDbUserPw} ${sqlDbName} < ${refGeneTypesServer}.sql
mysql -u ${sqlDbUsername} -p ${sqlDbUserPw} ${sqlDbName} < ${refRppaAntibodiesServer}.sql
mysql -u ${sqlDbUsername} -p ${sqlDbUserPw} ${sqlDbName} < ${refTadsServer}.sql
mysql -u ${sqlDbUsername} -p ${sqlDbUserPw} ${sqlDbName} < ${refVariantTypesServer}.sql
mysql -u ${sqlDbUsername} -p ${sqlDbUserPw} ${sqlDbName} < ${refVariantVizTypesServer}.sql
mysql -u ${sqlDbUsername} -p ${sqlDbUserPw} ${sqlDbName} < ${refFragileSitesServer}.sql
mysql -u ${sqlDbUsername} -p ${sqlDbUserPw} ${sqlDbName} < ${refReactomePathwaysServer}.sql

sed 1d ${analysisParametersFile} | while read line
do
	lineProc="`echo ${line} | sed 's/\t/ /g'`"
	tokens=( ${lineProc} )
	echo ${tokens[0]}
	metaProjectFolder="/home/umuttoprak/Projects/SOPHIA/v35/cohortAnalysis/"
    configScript="/home/umuttoprak/Projects/codingWorkspaces/Pycharm/EPISTEME_cohortAnalysis/cohortAnalysisConfig.sh"
    bash ${singleCohortAnalysis} "somatic" ${tokens[0]} ${tokens[1]} ${tokens[2]} "${tokens[3]}" ${tokens[4]} ${tokens[5]} ${tokens[6]} ${tokens[7]} ${tokens[8]} ${tokens[9]} ${tokens[10]} ${tokens[11]} ${tokens[12]} ${tokens[13]} ${tokens[14]}
done
