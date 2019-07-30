scriptRepository="./"
refServerLoc="../references/"

pythonBinary="python"
rscriptBinary="Rscript"
bedtoolsBinary="bedtools"
datamashBinary="datamash"
singleCohortAnalysis=${scriptRepository}/singleCohortAnalysis.sh

refEnsemblIdToGeneSymbol=${scriptRepository}/references/refEnsemblGenesToGeneNames.tsv
refRefseqToEnsembl=${scriptRepository}/references/refRefseqToEnsembl.tsv
refNcbiSynonyms=${scriptRepository}/references/refNcbiSynonyms.tsv
refRoadmapEnhancers=${scriptRepository}/references/refRoadmapEnhancers.bed.gz
refChrYBlacklist=${scriptRepository}/references/refChrYblacklistEnsembl.tsv
refConsensusTADs=${scriptRepository}/references/refTadsFull.tsv
refChromosomes=${scriptRepository}/references/refChromosomesFull.tsv
refCytobands=${scriptRepository}/references/refCytobands.tsv
refChromosomeArms=${scriptRepository}/references/refChromosomeArms.tsv
refRppaAntibodies=${scriptRepository}/references/refRppaAntibodiesFull.tsv
refComparisonTypes=${scriptRepository}/references/refComparisonTypes.tsv

pickerSv=${scriptRepository}/variantPickers/pickerSv.py
pickerSmallVar=${scriptRepository}/variantPickers/pickerSmallVar.py
pickerCnv=${scriptRepository}/variantPickers/pickerCnv.py

processSvFiles=${scriptRepository}/variantProcessors/processSvFiles.py
processSnvFiles=${scriptRepository}/variantProcessors/processSnvFiles.py
processIndelFiles=${scriptRepository}/variantProcessors/processIndelFiles.py

multiInterTadBased=${scriptRepository}/recurrenceTools/multiInterTadBased.py
multiInterCnvs=${scriptRepository}/recurrenceTools/multiInterCnvs.py
multiInterGene=${scriptRepository}/recurrenceTools/multiInterGene.py
cohortWideGeneLevelVariantsSummarizer=${scriptRepository}/recurrenceTools/cohortWideGeneLevelVariantsSummarizer.py

signatureAnalysis=${scriptRepository}/metadataProcessing/signatureAnalysis.R
metadataGeneration=${scriptRepository}/metadataProcessing/metadataGeneration.py

rnaIntegration=${scriptRepository}/phenotypeIntegrators/rnaIntegration.py
rppaIntegration=${scriptRepository}/phenotypeIntegrators/rppaIntegration.py

refVariantTypes=${scriptRepository}/references/refVariantTypes.tsv
refComparisonTypes=${scriptRepository}/references/refComparisonTypes.tsv

sqlPrePreparations=${scriptRepository}/sqlConverters/sqlPrePreparations.py
sqlPrePreparationsExpression=${scriptRepository}/sqlConverters/sqlPrePreparationsExpression.py

dataToSql=${scriptRepository}/sqlConverters/dataToSql.py
cohortAllIndelsTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/cohortAllIndelsTemplate.tsv
cohortAllSnvsTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/cohortAllSnvsTemplate.tsv
cohortAllSvsTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/cohortAllSvsTemplate.tsv
cohortAllSvsMidSizeTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/cohortAllSvsMidSizeTemplate.tsv
cohortAllGeneFusionsTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/cohortAllGeneFusionsTemplate.tsv
geneRecurrenceTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/geneRecurrenceTemplate.tsv
tadRecurrenceCnvTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/tadRecurrenceCnvTemplate.tsv
tadRecurrenceIndelTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/tadRecurrenceIndelTemplate.tsv
tadRecurrenceSvTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/tadRecurrenceSvTemplate.tsv
cohortWideGeneLevelVariantsTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/cohortWideGeneLevelVariantsTemplate.tsv
geneExpressionSummaryTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/geneExpressionSummaryTemplate.tsv
geneExpressionsTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/geneExpressionsTemplate.tsv
methylomeBetasTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/methylomeBetasTemplate.tsv
geneExpressionCrossCorrelationsTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/geneExpressionCrossCorrelationsTemplate.tsv
rppaExpressionSummaryTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/rppaExpressionSummaryTemplate.tsv
rppaExpressionsTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/rppaExpressionsTemplate.tsv


refChromosomesServer=${refServerLoc}/refChromosomes.tsv
refColoursServer=${refServerLoc}/refColours.tsv
refComparisonTypesServer=${refServerLoc}/refComparisonTypes.tsv
refCytobandsServer=${refServerLoc}/refCytobands.tsv
refChromosomeArmsServer=${refServerLoc}/refChromosomeArms.tsv
refGenesServer=${refServerLoc}/refGenes.tsv
refGeneTypesServer=${refServerLoc}/refGeneTypes.tsv
refRppaAntibodiesServer=${refServerLoc}/refRppaAntibodies.tsv
refTadsServer=${refServerLoc}/refTads.tsv
refVariantTypesServer=${refServerLoc}/refVariantTypes.tsv
refVariantVizTypesServer=${refServerLoc}/refVariantVizTypes.tsv
refFragileSitesServer=${refServerLoc}/refFragileSites.tsv
refReactomePathwaysServer=${refServerLoc}/refReactomePathways.tsv

refServerSqlHeaderLoc=${scriptRepository}/references/server/sqlHeaderTemplates
refChromosomesSqlHeaderServer=${refServerSqlHeaderLoc}/refChromosomesSqlHeader.tsv
refColoursSqlHeaderServer=${refServerSqlHeaderLoc}/refColoursSqlHeader.tsv
refComparisonTypesSqlHeaderServer=${refServerSqlHeaderLoc}/refComparisonTypesSqlHeader.tsv
refCytobandsSqlHeaderServer=${refServerSqlHeaderLoc}/refCytobandsSqlHeader.tsv
refChromosomeArmsSqlHeaderServer=${refServerSqlHeaderLoc}/refChromosomeArmsSqlHeader.tsv
refGenesSqlHeaderServer=${refServerSqlHeaderLoc}/refGenesSqlHeader.tsv
refGeneTypesSqlHeaderServer=${refServerSqlHeaderLoc}/refGeneTypesSqlHeader.tsv
refRppaAntibodiesSqlHeaderServer=${refServerSqlHeaderLoc}/refRppaAntibodiesSqlHeader.tsv
refTadsSqlHeaderServer=${refServerSqlHeaderLoc}/refTadsSqlHeader.tsv
refVariantTypesSqlHeaderServer=${refServerSqlHeaderLoc}/refVariantTypesSqlHeader.tsv
refVariantVizTypesSqlHeaderServer=${refServerSqlHeaderLoc}/refVariantVizTypesSqlHeader.tsv
refFragileSitesSqlHeaderServer=${refServerSqlHeaderLoc}/refFragileSitesSqlHeader.tsv
refReactomePathwaysSqlHeaderServer=${refServerSqlHeaderLoc}/refReactomePathwaysSqlHeader.tsv
