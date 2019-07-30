/*
 * MrefMatch.h
 *
 *  Created on: 13 Jan 2018
 *      Author: umuttoprak
 */

#ifndef GERMLINE_H_
#define GERMLINE_H_

#include "SuppAlignmentAnno.h"

namespace sophia {

class GermlineMatch {
public:
	GermlineMatch(double clonalityIn, double conservativeClonalityIn, const std::vector<std::pair<SuppAlignmentAnno, double>>& suppMatchesIn);
	const std::vector<SuppAlignmentAnno>& getSuppMatches() const {
		return suppMatches;
	}

	const std::vector<double>& getClonalities() const {
		return clonalities;
	}

	double getClonality() const {
		return clonality;
	}

	double getConservativeClonality() const {
		return conservativeClonality;
	}

private:
	double clonality;
	double conservativeClonality;
	std::vector<SuppAlignmentAnno> suppMatches;
	std::vector<double> clonalities;
};

} /* namespace sophia */

#endif /* GERMLINEMATCH_H_ */
