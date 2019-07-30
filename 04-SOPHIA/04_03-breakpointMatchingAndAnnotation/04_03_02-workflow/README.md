Umut Toprak, 30.07.2019
(04_03_02)
This part of the repository covers the LSF workflow used in running the SOPHIA breakpoint matching, filtering and annotation procedure, described in the Sections 2.2.5 of the dissertation. 

Prerequisites:
The SOPHIA breakpoint matching, filtering and annotation binary as compiled in (04_03_01)
SOPHIA breakpoint extraction reports for the case of interest (tumour and matched normal, if available) as obtained by the workflow in (04_01_02)
SOPHIA breakpoint database as obtained by the workflow in (04_02_02)

The sophiaAnnotateAbridgedPipeline.sh is the main LSF workflow script
 with the resource requirements and annotation resources listed in the file configCOMMON.sh
The cartesianMatcher.py script parses SOPHIA breakpoint outputs, searching for meaningful matches such as tumour-control but not control-tumour. 

Each LSF job calls the sophiaAnnotateAbridgedCaller.sh script and consequently the sophiaAnnotate binary, compiled in (04_03_01) 

The preliminary output is a list of filtered SVs, obtained by pairing and filtering individual breakpoints by the sophiaAnnotate binary
 using the decision tree in (04_03_01-codebase/SvEvent.cpp).
 
Then, the hs37d5 decoy supercontig chromosome is remapped, 
 where possible to the normal human chromosomes except chrY (decoyMapper.py, annotationMaterials/decoyRangeRefNew.bed) 
 
Chromosome truncations involving telomeric regions are remapped to estimated genomic coordinates on the same chromosome (teloMapper.py)
  
This preliminary input is annotated by gene, cancer gene, super-enhancer and TAD information (annotationMaterials folder)
 as well as candidate gene fusions and off-gene proximal rearrangements (fusionCandidates.py)

In some cases, RNA contaminates WGS data, making RNA decontamination necessary. This is accomplished
 by a series of scripts recognizing deletions spanning introns
 (delExtractorForRNAcontamination.py, counterForRNAcontamination.py, RNAdecontaminationStep1.py, RNAdecontaminationStep2.py)

The result is then de-duplicated by eliminating redundant SVs with both breakpoints close to each other and in same orientation (dedupResults.py)

Finally, the results are filtered by somatic and germline states if matched normals are available in paired analysis

The resulting file is a compressed tab-separated report of filtered and annotated SVs, which can be directly used by users
 or further processed in preparation for the EPISTEME workflow (06).
