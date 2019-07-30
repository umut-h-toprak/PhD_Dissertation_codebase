Umut Toprak, 30.07.2019
(04_04_01)
This section of the repository covers the data and code behind the Figure 2.34 of the dissertation

jobs_v35_merged.tsv is a PBS cluster monitor output records of SOPHIA breakpoint extraction runs.

breakpointExtractionRuntimeBenchmark_step1.sh converts this report to a simplified format
 with time differentials converted to minutes units and duplicate entries filtered to show worst-case runtimes
 
This is followed by a step where the runs are separated to the four strate 
 based on control vs tumour(-like, such as cell lines and PDX) and hiseq vs X-Ten status and reunited under grandResults.tsv
 
breakpointExtractionRuntimeBenchmark_step2.sh  processes grandResults.tsv to produce the Figure 2.34 of the dissertation
