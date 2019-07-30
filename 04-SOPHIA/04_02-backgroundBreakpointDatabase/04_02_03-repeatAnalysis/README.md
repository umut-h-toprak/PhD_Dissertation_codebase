Umut Toprak, 30.07.2019
(04_02_03)
This part of the repository covers the codebase for the analysis behind the figures 2.11, 2.12, 2.13 of the dissertation

Prerequisites:
A successfully generated population breakpoint background database for the hiseq (101bp) and X-Ten (151bp) sequencer datasets (04_02_02)

The analysis starts by a decomposition of the Repeatmasker repeat region database (obtained 13.06.2016) to individual repeat families found under the "./families" folder  
In the next step, the repeatAnalysisCaller.sh script is called, intersecting each  breakpoint in the population breakpoint background database by the repeat families
Finally, the postProc.sh script is called, yielding the figures 2.11-13
Both scripts are "parameterless", meaning the processed files are hard-coded

Umut Toprak, 30.07.2019
