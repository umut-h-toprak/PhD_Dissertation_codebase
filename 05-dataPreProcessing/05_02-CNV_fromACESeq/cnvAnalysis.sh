geneRef="gencode.v27.basic.Genes.bed.gz"
consensusTADs="consensusTADs_3_new_allChromosomes_cytobands_gencodeV27genes.bed"
cnvTcnAnalyzer=cnvTcnAnalyzer.py
consecutiveRowMerger=consecutiveRowMerger.py
cnvArtifactDb=cnvArtifacts.bed
bedtoolsBinary="bedtools"
pythonBinary="python"

locationWithMultiplePossibleCnvSolutions=${1}
pid=${2}

find ${locationWithMultiplePossibleCnvSolutions} | grep "_most_important_info" |grep  $'.gz$' | while read cnvFilePre
do
    zgrep -v $'^chromosome' ${cnvFilePre} | sort -V -k1,1 -k2,2 -k3,3  > ${cnvFilePre}_sorted
    zgrep $'^#' ${cnvFilePre} > ${cnvFilePre}_processed_step0
    ${bedtoolsBinary} intersect -v -f 0.7 -a ${cnvFilePre}_sorted -b ${cnvArtifactDb} >> ${cnvFilePre}_processed_step0
    ${pythonBinary} ${cnvTcnAnalyzer} ${cnvFilePre}_processed_step0 > ${cnvFilePre}_processed_step1
    ${bedtoolsBinary} intersect -a ${geneRef} -b ${cnvFilePre}_processed_step1 -wa -wb | cut -f 4,9,10 | sort -V -k1,1 | uniq > ${cnvFilePre}_processed_geneLevelPre
    cat <(cut -f 1,3 ${cnvFilePre}_processed_geneLevelPre) <(cut -f 1,2 ${cnvFilePre}_processed_geneLevelPre) | grep -v $'\.$'| sort -V -k1,1 | uniq | sed "s/\t/\t${pid}\t/" | gzip --best > ${cnvFilePre}_geneLevel.tsv.gz
    ${bedtoolsBinary} intersect -a ${consensusTADs} -b ${cnvFilePre}_processed_step1 -wa -wb | cut -f 4,11,12 > ${cnvFilePre}_processed_step2
    ${pythonBinary} ${consecutiveRowMerger} ${cnvFilePre}_processed_step2 | sort -V -k1,1 | gzip --best > ${cnvFilePre}_tadLevel.tsv.gz 
    rm ${cnvFilePre}_sorted ${cnvFilePre}_processed*
done

find ${locationWithMultiplePossibleCnvSolutions} | grep tadLevel | while read line ; do pid=$(echo $line | cut -d"/" -f9,11 | sed 's,/,_,g');  echo $pid $line $(zcat $line | cut -f1-2 | grep -v $'\.$' | wc -l); done | sed 's/ /\t/g' | sort -k1,1V -k3,3n > ${locationWithMultiplePossibleCnvSolutions}/cnvSizeReportTmp
sort -u ${locationWithMultiplePossibleCnvSolutions}/cnvSizeReportTmp -k1,1V > ${locationWithMultiplePossibleCnvSolutions}/cnvSizeReportTmpBest
cut -f2 ${locationWithMultiplePossibleCnvSolutions}/cnvSizeReportTmpBest | while read line
do
    ln -s $line ${line/_most/_chosen_most}
    lineRaw=$(echo ${line} | sed 's/_tadLevel.tsv.gz//')
    ln -s $lineRaw ${lineRaw/_most/_chosen_most}
    lineGene=$(echo ${line} | sed 's/_tadLevel/_geneLevel/')
    ln -s $lineGene ${lineGene/_most/_chosen_most}
done

rm ${locationWithMultiplePossibleCnvSolutions}/cnvSizeReportTmp
rm ${locationWithMultiplePossibleCnvSolutions}/cnvSizeReportTmpBest
