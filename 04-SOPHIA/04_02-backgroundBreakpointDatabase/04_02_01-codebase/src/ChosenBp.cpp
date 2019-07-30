/*
 * ChosenBp.cpp
 *
 *  Created on: 7 May 2016
 *      Author: umuttoprak
 */

#include "ChosenBp.h"
#include <algorithm>

namespace sophia {
int ChosenBp::BPSUPPORTTHRESHOLD { };
void ChosenBp::addChildNode(int indexIn) {
	childrenNodes.push_back(indexIn);
}

void ChosenBp::addSupplementaryAlignments(const std::vector<SuppAlignment>& suppAlignments) {
	for (const auto &sa : suppAlignments) {
		auto it = std::find_if(supplementaryAlignments.begin(), supplementaryAlignments.end(), [&] (const SuppAlignment& suppAlignment) {return suppAlignment.saCloseness(sa,5);});
		if (it == supplementaryAlignments.end()) {
			supplementaryAlignments.push_back(sa);
		} else {
			if (it->isFuzzy() && !sa.isFuzzy()) {
				it->removeFuzziness(sa);
			} else if (it->isFuzzy() && sa.isFuzzy()) {
				it->extendSuppAlignment(sa.getPos(), sa.getExtendedPos());
			}
			//it->addSupportingIndices(sa.getSupportingIndices());
			if (sa.getMapq() > it->getMapq()) {
				it->setMapq(sa.getMapq());
			}
			it->incrementDistinctReads();
		}
	}
}
}

