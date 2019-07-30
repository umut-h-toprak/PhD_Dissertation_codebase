#~ projects="ACC BLCA BRCA CESC CHOL COAD DLBC ESCA GBM HNSC KICH KIRC KIRP LAML LGG LIHC LUAD LUSC MESO OV PAAD PCPG PRAD READ SARC SKCM STAD TGCT THCA THYM UCEC UCS UVM"
#~ projects="GBM MESO OV PRAD"
#~ for projectRaw in $projects
#~ do
    #~ project="${projectRaw}_WES-US"
    #~ echo $projectRaw
    #~ if [[ ${projectRaw} != "MESO" ]]
    #~ then
        #~ :
        #~ > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_smallVariants.tsv
        #~ find /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/gdac.broadinstitute.org_${projectRaw}.Mutation_Packager_Oncotated_Calls.Level_3.2016012800.0.0 | grep gz$ | while read line
        #~ do
            #~ zcat ${line} | grep -av $'^#' | tail -n +2 >> /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_smallVariants_tmp.tsv
        #~ done 
        #~ pigz -f --best  /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_smallVariants_tmp.tsv
        #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_smallVariants_tmp.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  15 0| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_smallVariants.tsv.gz
        #~ rm /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_smallVariants_tmp.tsv.gz
    #~ else
        #~ :
        #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/TCGA-MESO.mutect2_snv.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv 0 1| pigz --best >/home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_TCGA-MESO.mutect2_snv.tsv.gz
    #~ fi
    
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/SNP6_nocnv_genomicSegment_reordered.gz_tadLevel.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  3 0| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_SNP6_nocnv_genomicSegment_reordered.gz_tadLevel.tsv.gz
    
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/SNP6_nocnv_genomicSegment_reordered.gz_geneLevel.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  1 0| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_SNP6_nocnv_genomicSegment_reordered.gz_geneLevel.tsv.gz

    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${projectRaw}_clinicalMatrix.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv 0 1| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_clinicalMatrix.gz
    #~ if [[ ${projectRaw} != "LAML" ]]
    #~ then
        #~ echo "RPPA"
        #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/RPPA.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}.RPPA.gz
    #~ fi
    #~ echo "RNA"
    #~ paste  <(zcat /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/TCGA-${projectRaw}.CPM-TMM.tsv.gz | cut -f1 | cut -d"." -f1) <(zcat /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/TCGA-${projectRaw}.CPM-TMM.tsv.gz | cut -f2- ) | pigz --best >  /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/TCGA-${projectRaw}.CPM-TMM_tmp.tsv.gz 
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/TCGA-${projectRaw}.CPM-TMM_tmp.tsv.gz  /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}.CPM-TMM.tsv.gz 
    #~ rm /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/TCGA-${projectRaw}.CPM-TMM_tmp.tsv.gz 
    #~ echo "METH"
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/TCGA-${projectRaw}.methylation450.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/preprocessingMeth/filteredProbes.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}.methylation450_postfiltered.tsv.gz
#~ done

 #~ projects="HNSC_nonHPV_WES-US HNSC_HPV_WES-US"
#~ for project in $projects
#~ do
    #~ echo $project
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/HNSC_WES-US/HNSC_WES-US_smallVariants.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  15 0| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_smallVariants.tsv.gz
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/HNSC_WES-US/HNSC_WES-US_SNP6_nocnv_genomicSegment_reordered.gz_tadLevel.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  3 0| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_SNP6_nocnv_genomicSegment_reordered.gz_tadLevel.tsv.gz
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/HNSC_WES-US/HNSC_WES-US_SNP6_nocnv_genomicSegment_reordered.gz_geneLevel.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  1 0| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_SNP6_nocnv_genomicSegment_reordered.gz_geneLevel.tsv.gz
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/HNSC_WES-US/HNSC_clinicalMatrix.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv 0 1| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_clinicalMatrix.gz
    #~ echo "RPPA"
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/HNSC_WES-US/RPPA.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_RPPA.gz
    #~ echo "RNA"
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/HNSC_WES-US/HNSC_WES-US.CPM-TMM.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}.CPM-TMM.tsv.gz
    #~ echo "METH"
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/HNSC_WES-US/TCGA-HNSC.methylation450.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/preprocessingMeth/filteredProbes.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}.methylation450_postfiltered.tsv.gz
#~ done
#~ projects="BRCA_Basal_TrNeg_WES-US BRCA_Her2_WES-US BRCA_LumA_WES-US BRCA_LumB_WES-US BRCA_Luminal_WES-US BRCA_Normal_WES-US"
#~ for project in $projects
#~ do
    #~ echo $project
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/BRCA_WES-US/BRCA_WES-US_smallVariants.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  15 0| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_smallVariants.tsv.gz
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/BRCA_WES-US/BRCA_WES-US_SNP6_nocnv_genomicSegment_reordered.gz_tadLevel.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  3 0| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_SNP6_nocnv_genomicSegment_reordered.gz_tadLevel.tsv.gz
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/BRCA_WES-US/BRCA_WES-US_SNP6_nocnv_genomicSegment_reordered.gz_geneLevel.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  1 0| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_SNP6_nocnv_genomicSegment_reordered.gz_geneLevel.tsv.gz
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/BRCA_WES-US/BRCA_clinicalMatrix.gz  /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv 0 1 | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_clinicalMatrix.gz
    #~ echo "RNA"
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/BRCA_WES-US/TCGA-BRCA.CPM-TMM.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}.CPM-TMM.tsv.gz
    #~ echo "METH"
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/BRCA_WES-US/TCGA-BRCA.methylation450.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/preprocessingMeth/filteredProbes.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}.methylation450_postfiltered.tsv.gz
    #~ echo "RPPA"
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/BRCA_WES-US/RPPA.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_RPPA.gz
#~ done

#~ projects="COAD_MSI_H_WES-US COAD_MSI_L_WES-US COAD_MSS_WES-US"
#~ for project in $projects
#~ do
    #~ echo $project
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COAD_WES-US/COAD_WES-US_smallVariants.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  15 0| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_smallVariants.tsv.gz
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COAD_WES-US/COAD_WES-US_SNP6_nocnv_genomicSegment_reordered.gz_tadLevel.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  3 0| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_SNP6_nocnv_genomicSegment_reordered.gz_tadLevel.tsv.gz
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COAD_WES-US/COAD_WES-US_SNP6_nocnv_genomicSegment_reordered.gz_geneLevel.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  1 0| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_SNP6_nocnv_genomicSegment_reordered.gz_geneLevel.tsv.gz
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COAD_WES-US/COAD_clinicalMatrix.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv 0 1| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_clinicalMatrix.gz
    #~ echo "RNA"
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COAD_WES-US/TCGA-COAD.CPM-TMM.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}.CPM-TMM.tsv.gz
    #~ echo "METH"
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COAD_WES-US/TCGA-COAD.methylation450.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/preprocessingMeth/filteredProbes.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_methylation450_postfiltered.tsv.gz
    #~ echo "RPPA"
    #~ python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COAD_WES-US/RPPA.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_RPPA.gz
#~ done


#~ cat <(zcat /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COAD_WES-US/COAD_WES-US_SNP6_nocnv_genomicSegment_reordered.gz_tadLevel.tsv.gz) <(zcat  /home/umuttoprak/Projects/SOPHIA/TCGA_WES/READ_WES-US/READ_WES-US_SNP6_nocnv_genomicSegment_reordered.gz_tadLevel.tsv.gz) | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COADREAD_WES-US/COADREAD_WES-US_SNP6_nocnv_genomicSegment_reordered.gz_tadLevel.tsv.gz
#~ cat <(zcat /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COAD_WES-US/COAD_WES-US_SNP6_nocnv_genomicSegment_reordered.gz_geneLevel.tsv.gz) <(zcat  /home/umuttoprak/Projects/SOPHIA/TCGA_WES/READ_WES-US/READ_WES-US_SNP6_nocnv_genomicSegment_reordered.gz_geneLevel.tsv.gz) | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COADREAD_WES-US/COADREAD_WES-US_SNP6_nocnv_genomicSegment_reordered.gz_geneLevel.tsv.gz
cat <(zcat /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COAD_WES-US/COAD_WES-US_smallVariants.tsv.gz) <(zcat /home/umuttoprak/Projects/SOPHIA/TCGA_WES/READ_WES-US/READ_WES-US_smallVariants.tsv.gz) | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COADREAD_WES-US/COADREAD_WES-US_smallVariants.tsv.gz
#~ paste  <(zcat /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COAD_WES-US/TCGA-COAD.methylation450.tsv.gz) <(zcat /home/umuttoprak/Projects/SOPHIA/TCGA_WES/READ_WES-US/TCGA-READ.methylation450.tsv.gz | cut -f2- ) | pigz --best >  /home/umuttoprak/Projects/SOPHIA/TCGA_WES/COADREAD_WES-US/TCGA-COADREAD.methylation450.tsv.gz

projects="COADREAD bla"

for projectRaw in $projects
do
    project="${projectRaw}_WES-US"
    echo $projectRaw
    echo "SmallVar"
    python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_smallVariants.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  15 0| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_smallVariants.tsv.gz
    echo "Metadata"
    python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringFlatFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${projectRaw}_clinicalMatrix.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv 0 1| pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}_clinicalMatrix.gz    
    echo "RPPA"
    python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/RPPA.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}.RPPA.gz
    echo "RNA"
    paste  <(zcat /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/TCGA-${projectRaw}.CPM-TMM.tsv.gz | cut -f1 | cut -d"." -f1) <(zcat /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/TCGA-${projectRaw}.CPM-TMM.tsv.gz | cut -f2- ) | pigz --best >  /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/TCGA-${projectRaw}.CPM-TMM_tmp.tsv.gz 
    python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/TCGA-${projectRaw}.CPM-TMM_tmp.tsv.gz  /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}.CPM-TMM.tsv.gz 
    rm /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/TCGA-${projectRaw}.CPM-TMM_tmp.tsv.gz 
    echo "METH"
    python /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/validDonorFiltering/validDonorFilteringMatrixFiles.py /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/TCGA-${projectRaw}.methylation450.tsv.gz /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/validDonors_dedup.tsv  /home/umuttoprak/Projects/SOPHIA/TCGA_WES/.workflow/preprocessingMeth/filteredProbes.tsv | pigz --best > /home/umuttoprak/Projects/SOPHIA/TCGA_WES/${project}/${project}.methylation450_postfiltered.tsv.gz
    break
done
