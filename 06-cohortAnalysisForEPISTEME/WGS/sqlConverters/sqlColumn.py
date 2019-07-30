class SqlColumnTemplate:
    def __init__(self,columnName):
        self.columnName=columnName
        self.maxVal=0
    def addDataPoint(self,newVal):
        if newVal>self.maxVal:
            self.maxVal=newVal

class SqlColumnText(SqlColumnTemplate):
    def __init__(self,columnName):
        super().__init__(columnName)
    def addDataPoint(self,dataPoint):
        newVal=len(dataPoint)
        super().addDataPoint(newVal)
    def printColumnInTableDefinition(self):
        return "`"+ self.columnName+"` VARCHAR(" + str(self.maxVal + 1) + ") CHARACTER SET utf8"

class SqlColumnInteger(SqlColumnTemplate):
    def __init__(self,columnName):
        super().__init__(columnName)
        self.maxNegVal=0
        self.numericType=""
    def addDataPoint(self,dataPoint):
        newVal = int(dataPoint)
        if newVal>=0:
            super().addDataPoint(newVal)
        else:
            if abs(newVal) > abs(self.maxNegVal):
                self.maxNegVal = newVal
    def determineNumericType(self):
        unsignedMode=self.maxNegVal==0
        if unsignedMode:
            if self.maxVal<=255:
                self.numericType="TINYINT UNSIGNED"
            elif self.maxVal<=65535:
                self.numericType = "SMALLINT UNSIGNED"
            elif self.maxVal<=16777215:
                self.numericType = "MEDIUMINT UNSIGNED"
            elif self.maxVal<=4294967295:
                self.numericType = "INT UNSIGNED"
            elif self.maxVal<=2**64-1:
                self.numericType = "BIGINT UNSIGNED"
            else:
                raise TypeError
        else:
            if self.maxVal<=127:
                if self.maxNegVal>-128:
                    self.numericType="TINYINT"
                elif self.maxNegVal>-32768:
                    self.numericType="SMALLINT"
                elif self.maxNegVal>-8388608:
                    self.numericType="MEDIUMINT"
                elif self.maxNegVal>-2147483648:
                    self.numericType="INT"
                elif self.maxNegVal>-(2**63):
                    self.numericType="BIGINT"
                else:
                    raise TypeError
            elif self.maxVal<=32767:
                if self.maxNegVal>-32768:
                    self.numericType="SMALLINT"
                elif self.maxNegVal>-8388608:
                    self.numericType="MEDIUMINT"
                elif self.maxNegVal>-2147483648:
                    self.numericType="INT"
                elif self.maxNegVal>-(2**63):
                    self.numericType="BIGINT"
                else:
                    raise TypeError
            elif self.maxVal<=8388607:
                if self.maxNegVal>-8388608:
                    self.numericType="MEDIUMINT"
                elif self.maxNegVal>-2147483648:
                    self.numericType="INT"
                elif self.maxNegVal>-(2**63):
                    self.numericType="BIGINT"
                else:
                    raise TypeError
            elif self.maxVal<=2147483647:
                if self.maxNegVal>-2147483648:
                    self.numericType="INT"
                elif self.maxNegVal>-(2**63):
                    self.numericType="BIGINT"
                else:
                    raise TypeError
            elif self.maxVal<=2**63-1:
                if self.maxNegVal>-(2**63):
                    self.numericType="BIGINT"
                else:
                    raise TypeError
            else:
                raise TypeError
    def printColumnInTableDefinition(self):
        self.determineNumericType()
        return "`" + self.columnName + "` "+ self.numericType

class SqlColumnFloat(SqlColumnTemplate):
    def __init__(self,columnName):
        super().__init__(columnName)
        self.numericType =""
    def addDataPoint(self,dataPoint):
        newVal = abs(float(dataPoint))
        super().addDataPoint(newVal)
    def determineNumericType(self):
        realDigits=len(str(self.maxVal).split('.')[0])
        self.numericType="NUMERIC("+str(realDigits+4)+", 4)"
    def printColumnInTableDefinition(self):
        self.determineNumericType()
        return "`" + self.columnName + "` " + self.numericType

class SqlColumnBool(SqlColumnTemplate):
    def __init__(self,columnName):
        super().__init__(columnName)
    def addDataPoint(self, dataPoint):
        pass
    def printColumnInTableDefinition(self):
        return "`" + self.columnName + "` BOOLEAN"