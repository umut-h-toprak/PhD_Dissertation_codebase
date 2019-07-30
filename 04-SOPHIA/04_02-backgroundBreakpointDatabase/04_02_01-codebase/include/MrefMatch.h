/*
 * MrefMatch.h
 *
 *  Created on: 13 Jan 2018
 *      Author: umuttoprak
 */

#ifndef MREFMATCH_H_
#define MREFMATCH_H_

#include "SuppAlignmentAnno.h"
#include <vector>

namespace sophia {

class MrefMatch {
public:
	MrefMatch(short numHitsIn, short numConsevativeHitsIn, int offsetDistanceIn, const std::vector<SuppAlignmentAnno>& suppMatchesIn);
	short getNumConsevativeHits() const {
		return numConsevativeHits;
	}
	short getNumHits() const {
		return numHits;
	}
	int getOffsetDistance() const {
		return offsetDistance;
	}
	const std::vector<SuppAlignmentAnno>& getSuppMatches() const {
		return suppMatches;
	}
private:
	short numHits;
	short numConsevativeHits;
	int offsetDistance;
	std::vector<SuppAlignmentAnno> suppMatches;
};

} /* namespace sophia */

#endif /* MREFMATCH_H_ */
