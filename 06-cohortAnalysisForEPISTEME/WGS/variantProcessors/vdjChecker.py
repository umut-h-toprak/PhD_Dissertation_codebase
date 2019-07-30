class VdjChecker:
    def __init__(self):
        pass
    @staticmethod
    def igBlacklist(chromosome, pos):
        if chromosome == "2" and 87513633 < pos < 87616158:
            return -1
        if chromosome == "2" and 114113972 < pos < 114214486:
            return -1
        if chromosome == "15" and pos < 22529804:
            return -1
        if chromosome == "16" and 32027384 < pos < 33680129:
            return -1
        if chromosome == "21" and 10812620 < pos < 10913068:
            return -1
        return 0

    def igProximityIGK(self, chromosome, pos):
        if self.igBlacklist(chromosome, pos):
            return -1
        if chromosome == "2" and  89106672 < pos < 90324235:
            return 1
        return 0

    def igProximityIGH(self, chromosome, pos):
        if self.igBlacklist(chromosome, pos):
            return -1
        if chromosome == "14" and pos > 106003223:
            return 1
        return 0

    def igProximityIGL(self, chromosome, pos):
        if self.igBlacklist(chromosome, pos):
            return -1
        if chromosome == "22" and 22380473 < pos < 23365203:
            return 1
        if chromosome == "22" and 23751591 < pos < 23946845:
            return 1
        return 0

    def trgProximity(self, chromosome, pos):
        if self.igBlacklist(chromosome, pos):
            return -1
        if chromosome == "7" and 38179180 < pos < 38507770:
            return 1
        return 0

    def trvProximity(self, chromosome, pos):
        if self.igBlacklist(chromosome, pos):
            return -1
        if chromosome == "7" and 141900746 < pos < 142611084:
            return 1
        return 0

    def trbvProximity(self, chromosome, pos):
        if self.igBlacklist(chromosome, pos):
            return -1
        if chromosome == "9" and 33517759 < pos < 33738492:
            return 1
        return 0

    def traProximity(self, chromosome, pos):
        if self.igBlacklist(chromosome, pos):
            return -1
        if chromosome == "14" and 21989990 < pos < 23121097:
            return 1
        return 0

    def checkSvIgBlacklisting(self, lineChunks,bcellMode):
        chromosome1 = lineChunks[0]
        pos1 = int(lineChunks[1])
        chromosome2 = lineChunks[3]
        pos2 = int(lineChunks[4])
        igkProximity1 = self.igProximityIGK(chromosome1, pos1)
        ighProximity1 = self.igProximityIGH(chromosome1, pos1)
        iglProximity1 = self.igProximityIGL(chromosome1, pos1)
        igkProximity2 = self.igProximityIGK(chromosome2, pos2)
        ighProximity2 = self.igProximityIGH(chromosome2, pos2)
        iglProximity2 = self.igProximityIGL(chromosome2, pos2)
        igBlacklisted1 = self.igBlacklist(chromosome1, pos1)
        igBlacklisted2 = self.igBlacklist(chromosome2, pos2)
        trgProximity1 = self.trgProximity(chromosome1, pos1)
        trgProximity2 = self.trgProximity(chromosome2, pos2)
        trvProximity1 = self.trvProximity(chromosome1, pos1)
        trvProximity2 = self.trvProximity(chromosome2, pos2)
        trbvProximity1 = self.trbvProximity(chromosome1, pos1)
        trbvProximity2 = self.trbvProximity(chromosome2, pos2)
        traProximity1 = self.traProximity(chromosome1, pos1)
        traProximity2 = self.traProximity(chromosome2, pos2)
        if (0 not in {igkProximity1, igkProximity2}) or (0 not in {ighProximity1, ighProximity2}) or (
                0 not in {iglProximity1, iglProximity2}):
            return -1
        if (0 not in {trgProximity1, trgProximity2}) or (0 not in {trvProximity1, trvProximity2}) or (
                0 not in {trbvProximity1, trbvProximity2}) or (0 not in {traProximity1, traProximity2}):
            return -1
        if bcellMode:
            vdjEvent = False
            if -1 not in {igBlacklisted1, igBlacklisted2}:
                vdjEvent = (1 in {igkProximity1, igkProximity2} and 0 in {igkProximity1, igkProximity2}) or (
                            1 in {ighProximity1, ighProximity2} and 0 in {iglProximity1, ighProximity2}) or (
                                       1 in {iglProximity1, iglProximity2} and 0 in {iglProximity1, iglProximity2})
            if not vdjEvent:
                vdjEvent = (1 in {trgProximity1, trgProximity2} and 0 in {trgProximity1, trgProximity2}) or (
                            1 in {trvProximity1, trvProximity2} and 0 in {trvProximity1, trvProximity2}) or (
                                       1 in {trbvProximity1, trbvProximity2} and 0 in {trbvProximity1,
                                                                                       trbvProximity2}) or (
                                       1 in {traProximity1, traProximity2} and 0 in {traProximity1, traProximity2})
            if vdjEvent:
                if 1 in {igkProximity1, iglProximity1, ighProximity1, trgProximity1, trvProximity1, traProximity1, trbvProximity1}:
                    return 2
                else:
                    return 1
        return 0