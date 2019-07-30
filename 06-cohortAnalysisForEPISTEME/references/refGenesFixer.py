geneToAb=dict()
with open('refRppaAntibodies.tsv') as ra:
    next(ra)
    for line in ra:
        lineChunks=line.rstrip().split('\t')
        abIndex=lineChunks[0]
        genes=lineChunks[-1].split(',')
        for gene in genes:
            gene=int(gene)
            if gene not in geneToAb:
                geneToAb[gene]=[]
            geneToAb[gene].append(abIndex)

with open('refGenes.tsv') as rg:
    print(next(rg).rstrip)
    for line in rg:
        lineChunks=line.rstrip().split('\t')
        geneIndex=int(lineChunks[0])
        if geneIndex in geneToAb:
            lineChunks[9]=';'.join(geneToAb[geneIndex])
        lineChunks[-1]=lineChunks[-1].replace(',',';')
        print(*lineChunks,sep='\t')
        
