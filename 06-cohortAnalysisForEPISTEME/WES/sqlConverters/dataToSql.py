from sys import argv, stderr
from sqlColumn import SqlColumnInteger,SqlColumnFloat,SqlColumnText,SqlColumnBool

dataFile = argv[1]
tableName = argv[2]
sqlColumnTemplate = argv[3]

columnEntries=[]
indexColumns=[]
uniqueIndexColumns=[]
with open(sqlColumnTemplate) as f:
    for line in f:
        lineChunks=line.rstrip().split('\t')
        while len(lineChunks)<3:
            lineChunks.append("")
        if lineChunks[1]=="text":
            columnEntries.append(SqlColumnText(lineChunks[0]))
        elif lineChunks[1]=="integer":
            columnEntries.append(SqlColumnInteger(lineChunks[0]))
        elif lineChunks[1]=="float":
            columnEntries.append(SqlColumnFloat(lineChunks[0]))
        elif lineChunks[1]=="boolean":
            columnEntries.append(SqlColumnBool(lineChunks[0]))
        if lineChunks[2]=="INDEX":
            indexColumns.append(lineChunks[0])
        elif lineChunks[2]=="UINDEX":
            uniqueIndexColumns.append(lineChunks[0])

with open(dataFile) as f:
    headerChunks=next(f).rstrip().split('\t')
    if len(headerChunks)>len(columnEntries):
        for i in range(len(columnEntries),len(headerChunks)):
            columnEntries.append(SqlColumnFloat(headerChunks[i]))
    for line in f:
        lineChunks = line.rstrip().split('\t')
        for i,chunk in enumerate(lineChunks):
            if lineChunks[i]!="":
                columnEntries[i].addDataPoint(lineChunks[i])

print("DROP TABLE IF EXISTS `" + tableName + "`;",sep="")
print("CREATE TABLE `" + tableName + "` (",sep="")
for i in range(len(columnEntries)-1):
    print(columnEntries[i].printColumnInTableDefinition()+",")
if len(columnEntries)<1000:
    print(columnEntries[len(columnEntries)-1].printColumnInTableDefinition()+");")
else:
    print(columnEntries[len(columnEntries)-1].printColumnInTableDefinition()+") ENGINE = ARIA;" )
currentIndex=0

for indexColumn in uniqueIndexColumns:
    if indexColumn.isdigit():
        indexColumn='`'+indexColumn+'`'
    indexName=str(currentIndex)+"_index"
    currentIndex+=1
    print("CREATE UNIQUE INDEX ", indexName, " ON ", tableName, "(",indexColumn,");",sep="")

for indexColumn in indexColumns:
    if indexColumn.isdigit():
        indexColumn='`'+indexColumn+'`'
    indexName=str(currentIndex)+"_index"
    currentIndex+=1
    print("CREATE INDEX ", indexName, " ON ", tableName, "(",indexColumn,");",sep="")

print("LOAD DATA INFILE '" + dataFile + "' INTO TABLE `", tableName,"` FIELDS TERMINATED BY '\\t' LINES TERMINATED BY '\\n' IGNORE 1 LINES;",sep="")
print("ANALYZE LOCAL TABLE `", tableName, "`;",sep="")
