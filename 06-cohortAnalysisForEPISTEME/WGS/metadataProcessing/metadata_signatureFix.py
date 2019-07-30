from sys import argv
from gzip import open as gzopen

existingMetadataFileIn = argv[1]
cohortSignatureOutput=argv[2]

if cohortSignatureOutput!="NA":
    signatureHeader = []
    signatureContributions = dict()
    with open(cohortSignatureOutput) as f:
            next(f)
            for line in f:
                lineChunks=line.rstrip().split('\t')
                donor=lineChunks[0]
                signatureContributions[donor]=dict()
                for i in range(1,31):
                    signatureContributions[donor][i]=float(lineChunks[i])
    for i in range(1,31):
            signatureHeader.append("COSMIC_sig."+str(i))
    with open(existingMetadataFileIn) as f:
        existingMetadataHeaderChunks=next(f).rstrip().split('\t')
        expectedChunks=len(existingMetadataHeaderChunks)
        newHeaderChunks=existingMetadataHeaderChunks + signatureHeader
        print(*newHeaderChunks,sep='\t')
        for line in f:
            lineChunks=line.rstrip().split('\t')
            while len(lineChunks)<expectedChunks:
                lineChunks.append("")
            donor=lineChunks[0]
            if cohortSignatureOutput != "NA":
                for i in range(1, 31):
                    lineChunks.append(signatureContributions[donor][
                        i] if donor in signatureContributions else "")
            print(*lineChunks,sep='\t')