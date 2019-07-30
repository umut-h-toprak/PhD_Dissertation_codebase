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
refEnsemblTranscriptToGene=${scriptRepository}/references/refEnsemblTranscriptToGene.tsv
refChrYBlacklist=${scriptRepository}/references/refChrYblacklistEnsembl.tsv
refConsensusTADs=${scriptRepository}/references/refTadsFull.tsv
refChromosomes=${scriptRepository}/references/refChromosomesFull.tsv
refCytobands=${scriptRepository}/references/refCytobands.tsv
refRppaAntibodies=${scriptRepository}/references/refRppaAntibodiesFull.tsv
refComparisonTypes=${scriptRepository}/references/refComparisonTypes.tsv

processSmallVars=${scriptRepository}/variantProcessors/processSmallVars.py
processGeneLevelCnvData=${scriptRepository}/variantProcessors/processGeneLevelCnvData.py

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
geneRecurrenceTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/geneRecurrenceTemplate.tsv
tadRecurrenceCnvTemplate=${scriptRepository}/sqlConverters/sqlHeaderTemplates/tadRecurrenceCnvTemplate.tsv
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
refGenesSqlHeaderServer=${refServerSqlHeaderLoc}/refGenesSqlHeader.tsv
refGeneTypesSqlHeaderServer=${refServerSqlHeaderLoc}/refGeneTypesSqlHeader.tsv
refRppaAntibodiesSqlHeaderServer=${refServerSqlHeaderLoc}/refRppaAntibodiesSqlHeader.tsv
refTadsSqlHeaderServer=${refServerSqlHeaderLoc}/refTadsSqlHeader.tsv
refVariantTypesSqlHeaderServer=${refServerSqlHeaderLoc}/refVariantTypesSqlHeader.tsv
refVariantVizTypesSqlHeaderServer=${refServerSqlHeaderLoc}/refVariantVizTypesSqlHeader.tsv
refFragileSitesSqlHeaderServer=${refServerSqlHeaderLoc}/refFragileSitesSqlHeader.tsv
refReactomePathwaysSqlHeaderServer=${refServerSqlHeaderLoc}/refReactomePathwaysSqlHeader.tsv
