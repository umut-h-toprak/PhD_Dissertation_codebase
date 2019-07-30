/*
 * MrefMatch.cpp
 *
 *  Created on: 13 Jan 2018
 *      Author: umuttoprak
 */

#include <MrefMatch.h>
#include <iostream>

namespace sophia {

MrefMatch::MrefMatch(short numHitsIn, short numConsevativeHitsIn, int offsetDistanceIn, const std::vector<SuppAlignmentAnno>& suppMatchesIn) :
				numHits { numHitsIn },
				numConsevativeHits { numConsevativeHitsIn },
				offsetDistance { offsetDistanceIn },
				suppMatches { suppMatchesIn } {
}

}
/* namespace sophia */
