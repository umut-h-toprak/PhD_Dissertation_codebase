from sys import argv,stderr


fileIn = argv[1]
cnvChunks=fileIn.split(".txt")[0].split("_most_important_info")[1].split('_')
ploidy=round(float(cnvChunks[0]))
isMale=False
with open(fileIn) as f:
    for line in f:
        if line[0] == '#' or line[0]=='c':
            if "assumed sex" in line:
                if not line.rstrip().endswith("female"):
                    isMale = True
            continue
        lineChunks=line.rstrip().split('\t')
        chrX=False
        if lineChunks[0]=="23":
            chrX=True
            lineChunks[0]="X"
        elif lineChunks[0]=="24":
            continue
        segmentLength=int(lineChunks[3])
        if segmentLength<1000 and lineChunks[12]=="homozygousDel":
            continue
        tcn=float(lineChunks[5])
        lohStatus= "LOH" in lineChunks[12]
        roundedTcn=round(tcn)
        cnvText="."
        if not chrX:
            if roundedTcn < ploidy:
                if roundedTcn==0:
                    cnvText="homoloss"
                else:
                    cnvText="loss"
            elif roundedTcn > ploidy:
                    if roundedTcn > ploidy*3:
                        cnvText="ampgain"
                    else:
                        cnvText="gain"
            else:
                if not lohStatus:
                    continue
        else:
            lohStatus = False
            if isMale:
                if roundedTcn + 1 < ploidy:
                    if roundedTcn==0:
                        cnvText="homoloss"
                    else:
                        cnvText="loss"
                elif roundedTcn + 1 > ploidy :
                    if roundedTcn +1 > ploidy*3:
                        cnvText="ampgain"
                    else:
                        cnvText="gain"
                else:
                    continue
            else:
                if roundedTcn < ploidy:
                    if roundedTcn==0:
                        cnvText="homoloss"
                    else:
                        cnvText="loss"
                elif roundedTcn > ploidy :
                    if roundedTcn > ploidy*3:
                        cnvText="ampgain"
                    else:
                        cnvText="gain"
                else:
                    continue
        if lohStatus:
            print(*lineChunks[:3],cnvText,"LOH",sep='\t')
        else:
            print(*lineChunks[:3],cnvText,".",sep='\t')