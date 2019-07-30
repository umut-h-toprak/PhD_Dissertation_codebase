Umut Toprak, 30.07.2019
(05_02)
This part of the repository covers the codebase for import of ACE-Seq output CNV data into EPISTEME as discussed in Section 3.2.2 of the dissertation.

Prerequisites:
(02) Gene reference
(03) TAD reference

The script cnvAnalysis.sh takes a single input where one or multiple files of the format ${donorIdentifier}_most_important_info${ploidyEstimate}_${purityEstimate}.txt.gz applying the following steps:
1) selects the optimal ploidy estimate based on least number of copy number variant segments, along with its corresponding purity
2) lists which genes are affected by CNV or LOH events
3) lists which TADs are affected by CNV or LOH events
