version="v35"

ANNOTATION_PIPELINE_BASE="./"
GZIP_BINARY="gzip"

annotationResources="-W 08:00 -n 1 -R \"span[ptile=1]\" -M 30720 -R \"rusage[mem=8192]\""

BEDTOOLS_BINARY="bedtools"
SOPHIA_ANNOTATION_BINARY=${ANNOTATION_PIPELINE_BASE}/sophiaAnnotate

PYTHON_BINARY="python"
TOOL_CARTESIAN_MATCHER_SCRIPT=${ANNOTATION_PIPELINE_BASE}/cartesianMatcher.py
TOOL_TELO_MAPPER_SCRIPT=${ANNOTATION_PIPELINE_BASE}/teloMapper.py
TOOL_DECOY_MAPPER_SCRIPT=${ANNOTATION_PIPELINE_BASE}/decoyMapper.py
TOOL_FUSION_CANDIDATES_SCRIPT=${ANNOTATION_PIPELINE_BASE}/fusionCandidates.py
TOOL_COORDINATE_CORRECTION_SCRIPT=${ANNOTATION_PIPELINE_BASE}/sophiaAnnotateCoordinateCorrection.py
TOOL_RNACONT_DEL_EXTRACTOR_SCRIPT=${ANNOTATION_PIPELINE_BASE}/delExtractorForRNAcontamination.py
TOOL_RNACONT_DEL_COUNTER_SCRIPT=${ANNOTATION_PIPELINE_BASE}/counterForRNAcontamination.py
TOOL_RNADECONT_STEP1_SCRIPT=${ANNOTATION_PIPELINE_BASE}/RNAdecontaminationStep1.py
TOOL_RNADECONT_STEP2_SCRIPT=${ANNOTATION_PIPELINE_BASE}/RNAdecontaminationStep2.py
TOOL_DIRECTHITCOLLAPSE_SCRIPT=${ANNOTATION_PIPELINE_BASE}/intersectionCollapsing.py
TOOL_INTRACHROMOSOMALEVENTPICKER=${ANNOTATION_PIPELINE_BASE}/getIntrachromosomalRanges.py
TOOL_TADANNOTATION_SCRIPT=${ANNOTATION_PIPELINE_BASE}/tadIntersections.py
TOOL_DEDUP_RESULTS_SCRIPT=${ANNOTATION_PIPELINE_BASE}/dedupResults.py
RSCRIPT_BINARY="Rscript"
TOOL_CIRCLIZE_SCRIPT=${ANNOTATION_PIPELINE_BASE}/circlizeEvents.R

REFERENCES_BASE=${PIPELINE_BASE}/annotationMaterials/
decoyRangeRefBed=${REFERENCES_BASE}/decoyRangeRefNew.bed

consensusTadReferenceBed=${REFERENCES_BASE}/consensusTADs_3_new_allChromosomes_cytobands_gencodeV27genes.names.bed
refGenes=${REFERENCES_BASE}/refGenes.tsv
refChromosomes=${REFERENCES_BASE}/refChromosomes.tsv
geneRefBed=${REFERENCES_BASE}/gencode.v27.basic.Genes.names.bed.gz
geneRefBedCancer=${REFERENCES_BASE}/gencode.v27.basic.Genes.cancer.names.bed.gz
intronExonRefBed=${REFERENCES_BASE}/gencode.v27.basic.IntronsExons.names.bed.gz
intronExonRefBedCancer=${REFERENCES_BASE}/gencode.v27.basic.IntronsExons.cancer.names.bed.gz
exonsOnlyPaddedRefBed=${REFERENCES_BASE}/gencode.v27.basic.ExonsPad3.bed.gz

spliceJunctionsRefBed=${REFERENCES_BASE}/mergedIntrons.bed.gz
combinedSuperEnhancerRefBed=${REFERENCES_BASE}/dbSUPERenhancers_hg19_060417.bed.gz
roadmapEnhancerRefBed=${REFERENCES_BASE}/ROADMAP_EnhA_EnhBiv_EnhG.min5_Sorted.bed.gz

chromSizesRef=${REFERENCES_BASE}/hg19_chromSizes_withContigsDecoys.genome

pidsInMref=3417
mRef=${REFERENCES_BASE}/mergedMref_strictBreaks_${version}_${pidsInMref}_mergedBpCounts_min3.bed.gz

artifactLoFreq=33
artifactHiFreq=66
clonalityLoFreq=5
clonalityStrictLoFreq=20
clonalityHiFreq=85
bpFreq=3
germlineFuzziness=3
germlineDbLimit=10

smallEventThreshold=5000
