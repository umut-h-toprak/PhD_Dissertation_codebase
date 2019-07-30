Umut Toprak, 30.07.2019
(07)
This part of the repository is the entire modular codebase of the EPISTEME platform presented in the Chapter 3 of the dissertation

Prerequisites:
All previous sub-repositories except for the following that are dedicated to the generation of particular plots in the dissertation, 
 (04_02_03), (04_04)
In particular, the cohortAnalysisForEPISTEME (06) repository constitutes the input data of EPISTEME by preparing SQL tables that EPISTEME uses to fetch its data.
The system must have an installation for Apache HTTP server and PHP.

The script run_build.sh builds the required npm packages and compiles EPISTEME into a bundled and minified js file.
A list of used npm packages is available in the file package.json
The "targetServerLocation" input argument of the build script must be a location where a server is hosted by a tool such as Apache HTTP server.
The php scripts used by EPISTEME for data fetching from the sql repositories (Figure 3.2) are directly copied without prior buildingsteps to the server location.
The structure of the EPISTEME codebase is modular (Figure 3.3). The following maps module file-/foldernames to dissertation sections:

a) Circos (Section 3.3.1):
Module folders wheel, variantRecurrenceEntries, variants
b) Single and Two phenotype analysis plots (Section 3.3.2)
Module folder singlePhenotypeExpression
c) Volcano and volcano-like plots (Sections 3.3.3, 3.3.9.2, 3.3.9.4, 3.3.10)
Module folder volcano
d) Display and management of cohort metadata variables (Section 3.3.4)
Module folder metadata
e) Flexible 2D plots including clustering analysis(Section 3.3.5)
Module folder flexiblePlots
f) tSNE  (Section 3.3.6.2) 
tsne.js under module folder flexiblePlots 
g) UMAP (Section 3.3.6.3)
Module folder umap
h) Subcohort selections (Section 3.3.8)
Module folder metadata and selectionManager.js
i) Survival analysis (Section 3.3.9.3)
Module folder survival
