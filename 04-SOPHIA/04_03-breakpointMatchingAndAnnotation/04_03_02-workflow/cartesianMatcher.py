from sys import argv
from itertools import product
from os import listdir

pidPath=argv[1]
pid=argv[2]
candidateSuffixes=[x.split("_"+pid)[0] for x in listdir(pidPath) if x.endswith("tsv.gz")]


controlPrefixes=["blood","control","buffy_coat","buffy-coat","normal","germline","external_control"]
tumorPrefixes=["tumor","metastasis","line","relapse","cell","culture","xenograft","organoid"]

pidControls=[x for x in candidateSuffixes if any([y in x.lower() for y in controlPrefixes])]
pidTumors=[x for x in candidateSuffixes if any([y in x.lower() for y in tumorPrefixes])]

if len(pidControls)==0:
    for tumorType in pidTumors:
        print(tumorType,"NA")
else:
    if len(pidTumors)>0:
        for pair in product(pidTumors,pidControls):
            print(pair[0],pair[1])
    else:
        for controlType in pidControls:
            print(controlType,"NA")    
