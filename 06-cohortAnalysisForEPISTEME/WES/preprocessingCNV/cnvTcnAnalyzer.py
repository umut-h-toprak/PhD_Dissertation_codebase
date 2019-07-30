from sys import argv,stderr

fileIn = argv[1]
with open(fileIn) as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        lohStatus= False
        cnvText="."
        tcnRatio=2**float(lineChunks[3])
        if tcnRatio < 0.66:
            if tcnRatio < 0.33:
                cnvText="homoloss"
            else:
                cnvText="loss"
        elif tcnRatio > 1.5:
            if tcnRatio > 3:
                cnvText="ampgain"
            else:
                cnvText="gain"
        else:
            continue
        segLen=int(lineChunks[2])-int(lineChunks[1])
        if cnvText=="homoloss" and segLen<1000:
            continue
        print(lineChunks[0],lineChunks[1],lineChunks[2],cnvText,".",lineChunks[4],sep='\t')            
