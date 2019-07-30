python gencodeParser2.py gencode.v27lift37.basic.annotation.gff3.gz cancerGenesEnsemblStripped | sort -V -k1,1 -k2,2 | sed 's/ENSG0*//g' | sed 's/^M/MT/' > gencode.v27.merged.bed
awk '$7 == "gene"' gencode.v27.merged.bed | cut -f1-4,6,8 | gzip --best > gencode.v27.basic.Genes.stripped.bed.gz
zcat gencode.v27.basic.Genes.stripped.bed.gz | awk '$6 == "cancer"'  | gzip --best > gencode.v27.basic.Genes.stripped.cancer.bed.gz

awk '$7 == "geneCoding"' gencode.v27.merged.bed | cut -f1-4,6,8 | gzip --best > gencode.v27.basic.GenesCoding.stripped.bed.gz
zcat gencode.v27.basic.GenesCoding.stripped.bed.gz | awk '$6 == "cancer"'  | gzip --best > gencode.v27.basic.GenesCoding.stripped.cancer.bed.gz

awk '$7 != "gene"' gencode.v27.merged.bed | awk '$7 != "geneCoding"' | awk '$7 != "pad3"' | gzip --best  > gencode.v27.basic.IntronsExons.bed.gz
zcat gencode.v27.basic.IntronsExons.bed.gz | awk '$8 == "cancer"' | gzip --best > gencode.v27.basic.IntronsExons.cancer.bed.gz
awk '$7 == "pad3"' gencode.v27.merged.bed  | cut -f1-3 | gzip --best > gencode.v27.basic.ExonsPad3.stripped.bed.gz


toModify="gencode.v27.basic.Genes.stripped.bed.gz gencode.v27.basic.Genes.cancer.stripped.bed.gz"
for target in ${toModify}
do
	cp $target ${target}.tmp
	zcat ${target}.tmp | cut -f1-3,4 | tr -s ";" "\t" | gzip --best > $target
	rm ${target}.tmp
done

toModify="gencode.v27.basic.GenesCoding.bed.gz gencode.v27.basic.GenesCoding.cancer.bed.gz"
for target in ${toModify}
do
	cp $target ${target}.tmp
	zcat ${target}.tmp | cut -f1-3,4 | tr -s ";" "\t" | gzip --best > $target
	rm ${target}.tmp
done

toModify="gencode.v27.basic.IntronsExons.bed.gz gencode.v27.basic.IntronsExons.cancer.bed.gz"
for target in ${toModify}
do
	cp $target ${target}.tmp
	zcat ${target}.tmp | cut -f1-3,5 | gzip --best > $target
	rm ${target}.tmp
done

bedtools intersect -a consensusTADs_3 _allChromosomes_cytobands_merged.bed -b gencode.v27.basic.Genes.stripped.bed.gz -loj | cut -f 1-5,9 > consensusTadGenePrep.stripped.bed
python tadAnnoMergerStripped.py consensusTadGenePrep.stripped.bed > consensusTADs_3 _allChromosomes_cytobands_gencodeV27genes.stripped.bed
python addCancerGenesToConsensusTad.py consensusTADs_3 _allChromosomes_cytobands_gencodeV27genes.stripped.bed mergedListCollapsedNameCorrected > consensusTADs_3 _allChromosomes_cytobands_gencodeV27genesAll.stripped.bed
python ensemblToNamesReverseConversion.py gencode.v27.basic.IntronsExons.stripped.bed.gz 1 | gzip --best > gencode.v27.basic.IntronsExons.names.stripped.bed.gz
python ensemblToNamesReverseConversion.py gencode.v27.basic.IntronsExons.cancer.stripped.bed.gz 1 | gzip --best > gencode.v27.basic.IntronsExons.cancer.names.stripped.bed.gz 
python ensemblToNamesReverseConversion.py gencode.v27.basic.Genes.stripped.bed.gz 1 | gzip --best > gencode.v27.basic.Genes.names.stripped.bed.gz
python ensemblToNamesReverseConversion.py gencode.v27.basic.Genes.cancer.stripped.bed.gz 1 | gzip --best > gencode.v27.basic.Genes.cancer.names.stripped.bed.gz
python ensemblToNamesReverseConversion.py consensusTADs_3 _allChromosomes_cytobands_gencodeV27genes.stripped.bed 2  > consensusTADs_3 _allChromosomes_cytobands_gencodeV27genes.names.stripped.bed
