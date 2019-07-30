Umut Toprak, 30.07.2019
(03)
This part of the repository covers the gene reference definition based on the extensive set of rules defined in Section 2.2.10.4

Prerequisites:
A list of "cancer-related genes" as defined in (1)
Consensus TAD definitions, not strictly a prerequisite, 
 but in this sub-repository TADs will be annotated by gene information (2)

There are two almost identical workflows available:
a) gencodeProcessing.sh , generates a gene reference with full gene identifiers starting with ENSG
 used in the SOPHIA annotations running in the OTP
b) gencodeProcessingStripped.sh , generates a gene reference with stripped gene identifiers  where the leading ENSG0*** is stripped
 used in EPISTEME where the stripped gene IDs are used as a memory efficient integer variables
