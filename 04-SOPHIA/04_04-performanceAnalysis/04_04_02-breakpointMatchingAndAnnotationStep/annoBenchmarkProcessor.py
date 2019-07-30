from sys import argv

class AnnotationResult:
    def __init__(self):
        self.jobName=""
        self.analysisMode=""
        self.elapsedTime=""
        self.maxMem=""
        self.avgMem=""
        self.technology=""
        self.group=""

with open(argv[1]) as f:
    lineIndex=0
    currentResult=AnnotationResult()
    print("jobName","analysisMode","elapsedTime","maxMem","avgMem","technology","group",sep='\t')
    for line in f:
        if lineIndex==4:
            lineIndex=0
            currentResult.group=currentResult.analysisMode+"_"+currentResult.technology
            print(currentResult.jobName,currentResult.analysisMode,currentResult.elapsedTime,currentResult.maxMem,currentResult.avgMem,currentResult.technology,currentResult.group,sep='\t')
            currentResult=AnnotationResult()
        if lineIndex==0:
            currentResult.jobName=line.split('<')[2].split('>')[0]
            if "-only" in currentResult.jobName:
                currentResult.analysisMode="nocontrol"
            else:
                currentResult.analysisMode="paired"
        elif lineIndex==1:
            currentResult.elapsedTime=float(line.rstrip().split("CPU time used is ")[1].split(" seconds")[0])/60
        elif lineIndex==2:
            lineChunks=line.rstrip().split(';')
            if "Gbytes" in lineChunks[0]:
                currentResult.maxMem=lineChunks[0].split(':')[1].split(" Gbytes")[0]
            else:
                currentResult.maxMem=float(lineChunks[0].split(':')[1].split(" Mbytes")[0])/1024
            if "Gbytes" in lineChunks[1]:
                currentResult.avgMem=lineChunks[1].split(':')[1].split(" Gbytes")[0]
            else:
                currentResult.avgMem=float(lineChunks[1].split(':')[1].split(" Mbytes")[0])/1024
        elif lineIndex==3:
            currentResult.technology="101bp" if "hiseq2000" in line else "151bp_X10"
        lineIndex+=1
