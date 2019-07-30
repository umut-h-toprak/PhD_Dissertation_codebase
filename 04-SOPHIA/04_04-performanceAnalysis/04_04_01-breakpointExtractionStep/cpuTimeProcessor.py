from sys import argv

jobTimeMapper=dict()
with open(argv[1]) as f:
    next(f)
    for line in f:
        lineChunks=line.rstrip().split('\t')
        jobName=lineChunks[2]
        timeChunks=lineChunks[10].split(':')
        timeInSecs=60*60*int(timeChunks[0])+60*int(timeChunks[1])+int(timeChunks[2])
        # ~ Some results are from duplicate runs, in those cases take the worst-case result
        if jobName in jobTimeMapper:
            if timeInSecs>jobTimeMapper[jobName]:
                jobTimeMapper[jobName]=timeInSecs
        else:
            jobTimeMapper[jobName]=timeInSecs
    
for jobName in jobTimeMapper:
    print(jobName,jobTimeMapper[jobName]/60,sep='\t')
