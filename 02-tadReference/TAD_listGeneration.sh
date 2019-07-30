cd ./YueLabDb/hg19.TADs_070118
find "$PWD" | grep "_TADs.txt.bed" | while read line
do
    python ../../tadToBoundary.py ${line}
done 
cat A549.bed AD.bed AO.bed BL.bed Caki2.bed CO.bed G401.bed GM12878.bed H1.bed HUVEC.bed HVEC.bed IMR90.bed K562.bed KBM7.bed LG.bed LI.bed LNCaP.bed LV.bed MES.bed MSC.bed Muscle.bed NCIH460.bed NHEK.bed NPC.bed PA.bed PANC1.bed RPMI7951.bed RV.bed SB.bed SJCRH30.bed SKMEL5.bed SKNDZ.bed SKNMC.bed SX.bed T470.bed Thymus.bed TRO.bed | sort -k 1,1V -k2,2V -k4,4V > ../../mergedTadBoundariesNorep.bed
cd ../../
python tadMerger.py mergedTadBoundariesNorep.bed 3 > mergedBoundaries_noRepConsensus_3.bed
python boundaryToTAD.py mergedBoundaries_noRepConsensus_3.bed > consensusTADs_3.bed

cat consensusTADs_3.bed chrYcytobandBasedEstimations.bed consensusTADs_decoys.bed > consensusTADs_3_allChromosomes.bed
