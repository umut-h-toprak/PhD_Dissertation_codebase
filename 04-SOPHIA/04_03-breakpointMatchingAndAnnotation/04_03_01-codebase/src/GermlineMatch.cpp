/*
 * MrefMatch.cpp
 *
 *  Created on: 13 Jan 2018
 *      Author: umuttoprak
 */

#include <GermlineMatch.h>

namespace sophia {

GermlineMatch::GermlineMatch(double clonalityIn, double conservativeClonalityIn, const std::vector<std::pair<SuppAlignmentAnno, double>>& suppMatchesIn) :
				clonality { clonalityIn },
				conservativeClonality { conservativeClonalityIn },
				suppMatches { },
				clonalities { } {
	for (const auto &saPair : suppMatchesIn) {
		suppMatches.push_back(saPair.first);
		clonalities.push_back(saPair.second);
	}
}
}
/* namespace sophia */
