Umut Toprak, 30.07.2019
(6)
This part of the repository is the bridge between multi-omics data including SOPHIA output and EPISTEME. 
It pre-processes, reformats, simplifies and stores the omics data in SQL and clinical metadata in spreadsheets.

Prerequisites:
All previous sub-repositories except for the following that are dedicated to the generation of particular plots in the dissertation, 
 (04_02_03), (04_04)
The user's system must have an installation for MySQL or MariaDB.

This code-base is divided into two largely similar sub-repositories WES and WGS. 

The WES repository is for data downloaded from the TCGA's GDC  system where WES-based functional mutational calls, 
 copy number information and other omics data such as gene expressions and methylome betas are shared. 
 SVs, non-coding mutations, and LOH information are not available. Mutational signatures are analysed by DeconstructSigs' "exome2genome" parameter.
The WGS repository is based on the DKFZ's WGS data analysis workflows, namely mpileup, platypus, ACESeq, SOPHIA for genomic variants and
 STAR for RNA-Seq data. SVs, non-coding mutations, and LOH information are available. 
 Mutational signatures are analysed by DeconstructSigs' "genome" parameter.

The folder structure in an EPISTEME cohort analysis is as follows:

DiseaseCohort(such as BRCA-US)
____DonorId1
________SOPHIA
____________tumor-control
____________tumor2-control
____DonorId2
________SOPHIA
____________tumor-control
____________tumor2-control
____Cell_lineId1
________SOPHIA
____________cell_line-only

Based on user-selected parameters, appropriate paired or no-control datasets can be accepted or rejected in the cohort-wide analysis
Dedicated parsers search for processed SNV, small indel, CNV and SV data in each scanned folder. (variantPickers folder)
Each variant type is then processed and reformatted according to the standardized variant type definitions under (references), (variantProcessors folder)
Notable steps include TAD effect assignments of SVs described in Section 2.2.10.3 of the dissertation (variantProcessors/processSvFiles in WGS analysis).
Cohort-wide genomic variants are then assembled as an input to EPISTEME (recurrenceTools folder)
This codebase also precomputes the "Variant-Integrated Phenotype Dysregulation Analysis" in EPISTEME (phenotypeIntegrators Folder)
The processed datasets are uploaded to an SQL database where the executing user has write access (sqlConverters folder). 
 The SQL-compatible formatting is applied by the templates under the (sqlConverters/sqlHeaderTemplates folder).

Because there is no standard SQL schema that fits all cohorts, Cohort metadata is assembled as a spreadsheet 
 both using user-provided prior input (such as clinical metadata) and 
 pipeline-generated information such as filtered variant counts and selected purities (metadataProcessing folder)

In all steps of analysis, extensive use of data minimization allows fast and memory-efficient operation of the SQL backend. 
This is achieved by storing integers instead of strings by using variable stripping or mapping tables wherever possible (references folder) examples:
* gene names are processed as integers obtained by stripping leading ENSG0*** from ENSEMBL identifiers
* variant types are mapped to integers e.g. nonsynonymous SNV -> 34
