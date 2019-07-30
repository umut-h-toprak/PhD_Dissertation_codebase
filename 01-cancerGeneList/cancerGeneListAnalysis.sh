#~ 1) get the latest COSMIC list, v80
    tail -n +2  "Census_allFri Jan  5 17_47_14 2018" | cut -f1 | sed 's/$/\tCOSMIC/g' > cosmicList
#~ 2) get the latest INTOGEN lists, filter using
    cd "intogen_driver_mutations_catalog-2016.5"
    find | grep tsv$ | while read line; do grep -v $"predicted passenger" ${line} | grep -v $'not protein-affecting' |cut -f 9; done | sort -u | sed 's/$/\tINTOGEN/'  > ../intogenList
    cd ..
#~ 3) get the latest list of Epigenetic modifiers from Naveed,  http://epifactors.autosome.ru/genes
wc -l "EpiGenes_20170328.tsv"
#~ 4) use the following KEGG categories:
    #~ hsa01521_EGFR_tyrosine_kinase_inhibitor_resistance
    #~ hsa01522_Endocrine_resistance
    #~ hsa01523_Antifolate_resistance
    #~ hsa01524_Platinum_drug_resistance
    #~ hsa03022_Basal_transcription_factors
    #~ hsa03030_DNA_replication
    #~ hsa03410_Base_excision_repair
    #~ hsa03430_Mismatch_repair
    #~ hsa03440_Homologous_recombination
    #~ hsa03450_Non-homologous_end-joining
    #~ hsa03460_Fanconi_anemia_pathway
    #~ hsa04010_MAPK_signaling_pathway
    #~ hsa04012_ErbB_signaling_pathway
    #~ hsa04014_Ras_signaling_pathway
    #~ hsa04015_Rap1_signaling_pathway
    #~ hsa04064_NF-kappa_B_signaling_pathway
    #~ hsa04068_FoxO_signaling_pathway
    #~ hsa04110_Cell_cycle
    #~ hsa04115_p53_signaling_pathway
    #~ hsa04140_Regulation_of_autophagy
    #~ hsa04150_mTOR_signaling_pathway
    #~ hsa04151_PI3K-Akt_signaling_pathway
    #~ hsa04210_Apoptosis
    #~ hsa04310_Wnt_signaling_pathway
    #~ hsa04330_Notch_signaling_pathway
    #~ hsa04340_Hedgehog_signaling_pathway
    #~ hsa04350_TGF-beta_signaling_pathway
    #~ hsa04370_VEGF_signaling_pathway
    #~ hsa04390_Hippo_signaling_pathway
    #~ hsa04550_Signaling_pathways_regulating_pluripotency_of_stem_cells
    #~ hsa04620_Toll-like_receptor_signaling_pathway
    #~ hsa04630_Jak-STAT_signaling_pathway
    #~ hsa04660_T_cell_receptor_signaling_pathway
    #~ hsa04662_B_cell_receptor_signaling_pathway
    #~ hsa04668_TNF_signaling_pathway
    #~ hsa04910_Insulin_signaling_pathway
    #~ hsa05200_Pathways_in_cancer
    #~ hsa05202_Transcriptional_misregulation_in_cancer
    #~ hsa05203_Viral_carcinogenesis
    #~ hsa05204_Chemical_carcinogenesis
    #~ hsa05205_Proteoglycans_in_cancer
    #~ hsa05206_MicroRNAs_in_cancer
    #~ hsa05210_Colorectal_cancer
    #~ hsa05211_Renal_cell_carcinoma
    #~ hsa05212_Pancreatic_cancer
    #~ hsa05213_Endometrial_cancer
    #~ hsa05214_Glioma
    #~ hsa05215_Prostate_cancer
    #~ hsa05216_Thyroid_cancer
    #~ hsa05217_Basal_cell_carcinoma
    #~ hsa05218_Melanoma
    #~ hsa05219_Bladder_cancer
    #~ hsa05220_Chronic_myeloid_leukemia
    #~ hsa05221_Acute_myeloid_leukemia
    #~ hsa05222_Small_cell_lung_cancer
    #~ hsa05223_Non-small_cell_lung_cancer
    #~ hsa05224_Breast_cancer
    #~ hsa05230_Central_carbon_metabolism_in_cancer
    #~ hsa05231_Choline_metabolism_in_cancer
    #~ hsa04360_Axon_guidance
    #~ hsa04915_Estrogen_signaling_pathway
    cd "KEGG"
    for list in *; do cat ${list};done | sort -u | sed 's/$/\tKEGG/g' > ../keggList
#~ 5) get the latest version of NCG http://ncg.kcl.ac.uk/,  eliminate false positive candidates http://ncg.kcl.ac.uk/
    tail -n +2 NCG-KCL.tsv | grep FALSE  | cut -f2 | sed 's/$/\tNCG-KCL/g' > ncgKclList
#~ 6) create the two recommended GO lists using the GO resources on the ODCF cluster
    #~ grep -i "double-strand break repair" /icgc/dkfzlsdf/analysis/B080/gene_lists/GO/goa_human.gene_GO-ID_GO-name.tsv | cut -f 2- | sort -u | cut -f 1  |  xargs -I {} grep -w {} /icgc/dkfzlsdf/analysis/B080/gene_lists/GO/goa_human.gene_GO-ID_GO-name.tsv | cut -f 1 | sort -u | sed 's/$/\tGO_DSB/g' > ~/scripts/sophia/sophiaCohortAnalysis/annotationMaterials/cancerGeneCandidates/customGOlistDSB
    #~ grep -i "mismatch repair" /icgc/dkfzlsdf/analysis/B080/gene_lists/GO/goa_human.gene_GO-ID_GO-name.tsv | cut -f 2- | sort -u | cut -f 1  |  xargs -I {} grep -w {} /icgc/dkfzlsdf/analysis/B080/gene_lists/GO/goa_human.gene_GO-ID_GO-name.tsv | cut -f 1 | sort -u | sed 's/$/\tGO_MMR/g' > ~/scripts/sophia/sophiaCohortAnalysis/annotationMaterials/cancerGeneCandidates/customGOlistMMR
wc -l customGOlistMMR
wc -l customGOlistDSB
#~ 7) merge the categories, HDGR2 is manually added to the EPIFACTORS list due to a formatting issue in the source file, the custom List includes specifically added genes
#~ FOXR1	CUSTOM
#~ ID1	CUSTOM
#~ ID2	CUSTOM
#~ ID3	CUSTOM
#~ ID4	CUSTOM
#~ TTC28	CUSTOM
#~ HDGR2	CUSTOM
#~ TRG.locus	CUSTOM
#~ TRV.locus	CUSTOM
#~ TRBV.locus	CUSTOM
#~ TR.locus	CUSTOM
    cat cosmicList epifactorsList intogenList keggList ncgKclList customGOlistDSB customGOlistMMR customList | grep -v readth | grep -v $'^gene\t' | grep -v $'^structure' | sort -V -k1,1 > mergedList
#~ 8) collapse the duplicates, the paranthesis gets rid of a mistake in the COSMIC annotations with CDKN2A
    python mergedListCollapse.py mergedList | grep -v $'(' > mergedListCollapsed
#~ 9) finally, filter the gencode file
    python filterGencodeCancerGenes.py mergedListCollapsed gencode.v19.annotation_plain.genes_collapsed_sorted_IGloci.bed.gz  | gzip --best > gencode.v19.annotation_plain.genes_collapsed_sorted_CANCER.bed.gz
