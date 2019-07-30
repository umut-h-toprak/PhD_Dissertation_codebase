/*
 * ChosenBp.h
 *
 *  Created on: 18 Apr 2016
 *      Author: umuttoprak
 */

#ifndef CHOSENBP_H_
#define CHOSENBP_H_
#include <vector>
#include <string>
#include "SuppAlignment.h"
namespace sophia {
class ChosenBp {
	friend class Alignment;
public:
	ChosenBp(char bpTypeIn, int bpSizeIn, bool bpEncounteredMIn, int overhangStartIndexIn, int overhangLengthIn, int selfNodeIndexIn) :
					bpType { bpTypeIn },
					bpSize { bpSizeIn },
					bpEncounteredM { bpEncounteredMIn },
					overhangStartIndex { overhangStartIndexIn },
					overhangLength { overhangLengthIn },
					supplementaryAlignments { },
					childrenNodes { { selfNodeIndexIn } },
					selfNodeIndex { selfNodeIndexIn } {
	}
	~ChosenBp() = default;
	static int BPSUPPORTTHRESHOLD;
private:
	char bpType;
	int bpSize;
	bool bpEncounteredM;
	int overhangStartIndex, overhangLength;
	std::vector<SuppAlignment> supplementaryAlignments;
	std::vector<int> childrenNodes;
	int selfNodeIndex;
	void addChildNode(int indexIn);
	void addSupplementaryAlignments(const std::vector<SuppAlignment>& suppAlignments);
};
}

#endif /* CHOSENBP_H_ */
