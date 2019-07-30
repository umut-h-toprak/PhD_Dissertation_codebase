Umut Toprak, 30.07.2019
(04_01_02)
This part of the repository covers the LSF workflow used in running the SOPHIA breakpoint extraction procedure, described in the Sections 2.2.2 and 2.2.3 of the dissertation. 

Prerequisites:
The SOPHIA breakpoint extraction binary as compiled in (04_01_01)

The sophiaPipelineOTP.sh script parses the folder structures used by the OTP to launch jobs 
 with the resource requirements listed in the file configCOMMON.sh
Each LSF job calls the sophiaCaller.sh script and consequently the sophia_v35 binary, compiled in (04_01_01) 
The input is the alignment bam file and the alignment QC parameters median insert size and standard deviation of insert sizes (for discordant mate distance range calculation) 
 and proper pair ratio for the procedure described in 2.2.8.1 (i)  
The output is a gzipped tab-separated report of extracted breakpoints.
