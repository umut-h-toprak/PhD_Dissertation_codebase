from sys import argv,stderr
from gzip import open as gzopen

flatFileIn=argv[1]
validSpecimensIn=argv[2]
columnToCheck=int(argv[3])
keepHeader=int(argv[4])==1

validSpecimens=set()
validDonors=set()
with open(validSpecimensIn) as f:
    for line in f:
        validSpecimens.add(line.rstrip())
        validDonors.add('-'.join(line.rstrip().split('-')[:-1]))

with gzopen(flatFileIn,'rt', errors='replace') as f:
    if keepHeader:
        print(next(f).rstrip())
    for line in f:
        lineChunks=line.rstrip().split('\t')
        currentSpecimen  = '-'.join(lineChunks[columnToCheck].split('-')[:4])
        if not currentSpecimen[-1].isdigit():
            currentSpecimen=currentSpecimen[:-1]
        specimenChunks=currentSpecimen.split('-')
        healthySpecimen=int(specimenChunks[-1])>10
        currentDonor='-'.join(specimenChunks[:-1])
        if currentSpecimen in validSpecimens or (healthySpecimen and currentDonor in validDonors):
            print(*lineChunks,sep='\t')
