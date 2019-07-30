/*
 * FuzzyCompression.h
 *
 *  Created on: 24 Nov 2016
 *      Author: umuttoprak
 */

#ifndef DEFUZZIER_H_
#define DEFUZZIER_H_

#include <BreakpointReduced.h>
#include <MrefEntry.h>
#include "SuppAlignment.h"
#include "SuppAlignmentAnno.h"
#include "Breakpoint.h"
#include <vector>
#include <map>
#include <unordered_set>

namespace sophia {
class DeFuzzier {
public:
	DeFuzzier(int maxDistanceIn, bool mrefModeIn);
	void deFuzzyDb(std::vector<BreakpointReduced>& bps) const;
	void deFuzzyDb(std::vector<MrefEntry>& bps) const;
private:
	void processFuzzySa(std::vector<BreakpointReduced>& bps, std::vector<BreakpointReduced>::iterator startingIt, SuppAlignmentAnno* startingSa) const;
	void dbSweep(std::vector<BreakpointReduced>& bps, std::vector<BreakpointReduced>::iterator startingIt, int increment, SuppAlignmentAnno* consensusSa, std::vector<SuppAlignmentAnno*>& processedSas) const;
	void selectBestSa(std::vector<SuppAlignmentAnno*>& processedSas, SuppAlignmentAnno* consensusSa) const;

	void processFuzzySa(std::vector<MrefEntry>& bps, std::vector<MrefEntry>::iterator startingIt, SuppAlignmentAnno* startingSa) const;
	void dbSweep(std::vector<MrefEntry>& bps, std::vector<MrefEntry>::iterator startingIt, std::unordered_set<short>& fileIndices, int increment, SuppAlignmentAnno* consensusSa, std::vector<SuppAlignmentAnno*>& processedSas) const;
	void selectBestSa(std::vector<SuppAlignmentAnno*>& processedSas, SuppAlignmentAnno* consensusSa, const std::unordered_set<short>& fileIndices) const;


	const int MAXDISTANCE;
	const bool MREFMODE;
};

}

#endif /* DEFUZZIER_H_ */
