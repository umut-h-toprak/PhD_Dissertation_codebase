annotationRepository="/home/umuttoprak/Projects/SOPHIA/annotationMaterials"
geneRef=${annotationRepository}/ensemblBased/gencode.v27.basic.Genes.bed.gz
consensusTADs=${annotationRepository}/ensemblBased/consensusTADs_3_new_allChromosomes_cytobands_gencodeV27genes.bed
cnvTcnAnalyzer=cnvTcnAnalyzer.py
consecutiveRowMerger=consecutiveRowMerger.py
cnvArtifactDb=cnvArtifacts.bed
bedtoolsBinary="bedtools"
pythonBinary="python"

cnvFilePrePre=${1}
cnvFilePre=${cnvFilePrePre/.gz/_reordered.gz}

paste <(zcat ${cnvFilePrePre} | cut -f 2-) <(zcat ${cnvFilePrePre} | cut -f 1) | sed '1 s/^chr/rhc/' | sed 's/^chr//' | sed '1 s/^rhc/chr/g' | pigz --best > ${cnvFilePre}

zcat  ${cnvFilePre} | tail -n +2  > ${cnvFilePre}_sorted
${bedtoolsBinary} intersect -v -f 0.7 -a ${cnvFilePre}_sorted -b ${cnvArtifactDb} > ${cnvFilePre}_processed_step0
${pythonBinary} ${cnvTcnAnalyzer} ${cnvFilePre}_processed_step0 > ${cnvFilePre}_processed_step1
${bedtoolsBinary} intersect -a ${geneRef} -b ${cnvFilePre}_processed_step1 -wa -wb | cut -f 4,9,10,11 | sort -V  -k4,4 -k1,1 | uniq > ${cnvFilePre}_processed_geneLevelPre
cat <(cut -f 1,3,4 ${cnvFilePre}_processed_geneLevelPre) <(cut -f 1,2,4 ${cnvFilePre}_processed_geneLevelPre) | grep -v $'\.\t'| sort -V -k1,1 | uniq > ${cnvFilePre}_processed_geneLevelToReorder
paste <(cut -f 1 ${cnvFilePre}_processed_geneLevelToReorder) <(cut -f 3 ${cnvFilePre}_processed_geneLevelToReorder) <(cut -f 2 ${cnvFilePre}_processed_geneLevelToReorder)| gzip --best > ${cnvFilePre}_geneLevel.tsv.gz
${bedtoolsBinary} intersect -a ${consensusTADs} -b ${cnvFilePre}_processed_step1 -wa -wb | cut -f 4,11,12,13 | sort -V -k4,4 -k1,1  > ${cnvFilePre}_processed_step2
${pythonBinary} ${consecutiveRowMerger} ${cnvFilePre}_processed_step2 | sort -V -k1,1 | gzip --best > ${cnvFilePre}_tadLevel.tsv.gz 
rm ${cnvFilePre}_sorted ${cnvFilePre}_processed*
