/*
 * MateInfo.h
 *
 *  Created on: 21 Apr 2016
 *      Author: umuttoprak
 */

#ifndef MATEINFO_H_
#define MATEINFO_H_
#include "SuppAlignment.h"
#include <cmath>

namespace sophia {
struct MateInfo {
	int readStartPos;
	int readEndPos;
	int mateChrIndex;
	int mateStartPos;
	int mateEndPos;
	bool inverted;
	int source;
	int evidenceLevel;
	int matePower;
	int inversionSupport;
	int straightSupport;
	std::vector<int> bpLocs;
	bool saSupporter;
	bool toRemove;
	bool operator<(const MateInfo& rhs) const {
		if (mateChrIndex < rhs.mateChrIndex) return true;
		if (mateChrIndex > rhs.mateChrIndex) return false;
		if (mateStartPos < rhs.mateStartPos) return true;
		return false;
	}
	bool suppAlignmentFuzzyMatch(const SuppAlignment& sa) const {
		if (mateChrIndex != sa.getChrIndex()) {
			return false;
		} else {
			if (!sa.isFuzzy()) {
				return sa.getPos() >= (mateStartPos - sa.getMatchFuzziness()) && sa.getPos() <= (mateEndPos + sa.getMatchFuzziness());
			} else {
				return (mateStartPos - sa.getMatchFuzziness()) <= sa.getExtendedPos() && sa.getPos() <= (mateEndPos + sa.getMatchFuzziness());
			}
		}
	}
	MateInfo(int readStartPosIn, int readEndPosIn, int mateChrIndexIn, int mateStartPosIn, int sourceType, bool invertedIn) :
						readStartPos { readStartPosIn },
						readEndPos { readEndPosIn },
						mateChrIndex { mateChrIndexIn },
						mateStartPos { mateStartPosIn },
						mateEndPos { mateStartPosIn },
						inverted { invertedIn },
						source {sourceType},
						evidenceLevel { sourceType == 2 ? 3 : 1 },
						matePower { 1 },
						inversionSupport { invertedIn },
						straightSupport { !invertedIn },
						bpLocs{},
						saSupporter { false },
						toRemove { false } {
		}
	MateInfo(int readStartPosIn, int readEndPosIn, int mateChrIndexIn, int mateStartPosIn, int sourceType, bool invertedIn, const std::vector<int> &bpLocsIn) :
					readStartPos { readStartPosIn },
					readEndPos { readEndPosIn },
					mateChrIndex { mateChrIndexIn },
					mateStartPos { mateStartPosIn },
					mateEndPos { mateStartPosIn },
					inverted { invertedIn },
					source {sourceType},
					evidenceLevel { sourceType == 2 ? 3 : 1 },
					matePower { 1 },
					inversionSupport { invertedIn },
					straightSupport { !invertedIn },
					bpLocs{bpLocsIn},
					saSupporter { false },
					toRemove { false } {
	}

	bool isToRemove() const {
		return toRemove;
	}
};
}
#endif /* MATEINFO_H_ */
