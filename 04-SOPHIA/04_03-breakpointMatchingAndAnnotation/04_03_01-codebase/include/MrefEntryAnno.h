/*
 * MrefEntry.h
 *
 *  Created on: 27 Nov 2016
 *      Author: umuttoprak
 */

#ifndef MREFENTRYANNO_H_
#define MREFENTRYANNO_H_

#include <string>
#include <boost/format.hpp>
#include <BreakpointReduced.h>
#include "SuppAlignmentAnno.h"
namespace sophia {

class MrefEntryAnno {
public:
	static int PIDSINMREF;
	static int DEFAULTREADLENGTH;
	static boost::format doubleFormatter;
	MrefEntryAnno(const std::string &mrefEntryIn);
	template<typename T>
	bool operator<(const T& rhs) const {
		return pos < rhs.getPos();
	}
	template<typename T>
	int distanceTo(const T& rhs) const {
		return std::abs(pos - rhs.getPos());
	}
	template<typename T>
	int distanceToBp(const T &compIn) const {
		return std::abs(pos - compIn.getPos());
	}
	bool operator==(const MrefEntryAnno& rhs) const {
		return pos == rhs.getPos();
	}

	int getPos() const {
		return pos;
	}
	std::vector<SuppAlignmentAnno*> getSuppAlignmentsPtr() {
		std::vector<SuppAlignmentAnno*> res { };
		for (auto &sa : suppAlignments) {
			res.push_back(&sa);
		}
		return res;
	}

	void removeMarkedFuzzies() {
		while (!suppAlignments.empty() && suppAlignments.back().isToRemove()) {
			suppAlignments.pop_back();
		}
		for (auto saIt = suppAlignments.begin(); saIt != suppAlignments.end(); ++saIt) {
			if (saIt->isToRemove()) {
				std::swap(*saIt, suppAlignments.back());
			}
			while (!suppAlignments.empty() && suppAlignments.back().isToRemove()) {
				suppAlignments.pop_back();
			}
		}
	}
//	SuppAlignmentAnno* searchFuzzySa(const SuppAlignmentAnno& fuzzySa);

	const std::vector<SuppAlignmentAnno>& getSuppAlignments() const {
		return suppAlignments;
	}

	std::vector<SuppAlignmentAnno*> getSupplementsPtr() {
		std::vector<SuppAlignmentAnno*> res { };
		for (auto &sa : suppAlignments) {
			res.push_back(&sa);
		}
		return res;
	}
	bool closeToSupp(const SuppAlignmentAnno &compIn, int fuzziness) const {
		if (compIn.isFuzzy()) {
			fuzziness = 2.5 * DEFAULTREADLENGTH;
			return (pos - fuzziness) <= (compIn.getExtendedPos() + fuzziness) && (compIn.getPos() - fuzziness) <= (pos + fuzziness);
		} else {
			return std::abs(pos - compIn.getPos()) <= fuzziness;
		}
	}
	int distanceToSupp(const SuppAlignmentAnno &compIn) const {
		if (compIn.isFuzzy()) {
			if (compIn.getPos() <= pos && pos <= compIn.getExtendedPos()) {
				return 0;
			} else {
				if (pos < compIn.getPos()) {
					return compIn.getPos() - pos;
				} else {
					return pos - compIn.getExtendedPos();
				}
			}
		} else {
			return std::abs(pos - compIn.getPos());
		}
	}
	short getNumHits() const {
		return numHits;
	}

	void setNumHits(short numHits) {
		this->numHits = numHits;
	}
private:
	int pos;
	short numHits;
	std::vector<SuppAlignmentAnno> suppAlignments;
};

} /* namespace sophia */

#endif /* MREFENTRYANNO_H_ */
