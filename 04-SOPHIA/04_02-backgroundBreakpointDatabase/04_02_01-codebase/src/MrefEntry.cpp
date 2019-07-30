/*
 * MrefEntry.cpp
 *
 *  Created on: 27 Nov 2016
 *      Author: umuttoprak
 */

#include "Breakpoint.h"
#include "strtk.hpp"
#include <boost/algorithm/string/join.hpp>
#include <MrefEntry.h>
#include <unordered_set>
#include "ChrConverter.h"
#include "BreakpointReduced.h"

namespace sophia {
boost::format MrefEntry::doubleFormatter { "%.5f" };
int MrefEntry::NUMPIDS { };
int MrefEntry::DEFAULTREADLENGTH { };

MrefEntry::MrefEntry() :
				validity { -1 },
				pos { -1 },
				fileIndices { },
				fileIndicesWithArtifactRatios { },
				artifactRatios { },
				suppAlignments { } {

}
void MrefEntry::addEntry(BreakpointReduced& tmpBreakpoint, int fileIndex) {
	pos = tmpBreakpoint.getPos();
	auto artifactBreakTotal = tmpBreakpoint.getLowQualBreaksSoft() + tmpBreakpoint.getLowQualBreaksHard() + tmpBreakpoint.getRepetitiveOverhangBreaks();
	auto eventTotal = tmpBreakpoint.getPairedBreaksSoft() + tmpBreakpoint.getPairedBreaksHard() + tmpBreakpoint.getUnpairedBreaksSoft() + tmpBreakpoint.getUnpairedBreaksHard() + tmpBreakpoint.getBreaksShortIndel();
	auto breakTotal = eventTotal + artifactBreakTotal;
	if (breakTotal < 200) {
		for (auto saPtr : tmpBreakpoint.getSupplementsPtr()) {
			if (saPtr->isSuspicious() || saPtr->isToRemove() || (saPtr->getChrIndex() != 1001 && ChrConverter::indexConverter[saPtr->getChrIndex()] < 0)) {
				continue;
			}
			auto qualCheck = false;
			auto splitTotal = saPtr->getSupport() + saPtr->getSecondarySupport();
			if (saPtr->isDistant()) {
				auto clonalityCondition = (((0.0 + saPtr->getMateSupport()) / saPtr->getExpectedDiscordants()) >= 0.5);
				if (!clonalityCondition) {
					continue;
				}
				qualCheck = (splitTotal > 4 && saPtr->getMateSupport() > 2);
				if (!qualCheck) {
					qualCheck = (saPtr->getMateSupport() > 4);
				}
			} else {
				qualCheck = (splitTotal > 4) || (splitTotal > 2 && saPtr->getSupport() > 0 && saPtr->getSecondarySupport() > 0);
			}
			if (qualCheck) {
				if (!saMatcher(saPtr)) {
					auto saTmp = *saPtr;
					saTmp.mrefSaTransform(fileIndex);
					suppAlignments.push_back(saTmp);
				}
			}
		}
	}
	auto covValidity = (tmpBreakpoint.getBreaksShortIndel() > 2 || breakTotal > 9);
	if (!covValidity) {
		if (breakTotal > 4) {
			auto clonality = ((breakTotal + 0.0) / (tmpBreakpoint.getNormalSpans() + breakTotal));
			if (clonality > 0.3) {
				covValidity = true;
			} else if (clonality > 0.1) {
				if (tmpBreakpoint.hasOverhang) {
					covValidity = true;
				}
			}
		}
	}
	if (eventTotal + artifactBreakTotal > 0) {
		if (covValidity) {
			auto eventTotalStrict = tmpBreakpoint.getPairedBreaksSoft() + tmpBreakpoint.getUnpairedBreaksSoft() + tmpBreakpoint.getPairedBreaksHard();
			auto artifactTotalRelaxed = tmpBreakpoint.getLowQualBreaksSoft() + tmpBreakpoint.getLowQualSpansSoft() + tmpBreakpoint.getRepetitiveOverhangBreaks();
			if ((eventTotalStrict + artifactTotalRelaxed) > 0) {
				artifactRatios.push_back((0.0 + artifactTotalRelaxed) / (eventTotalStrict + artifactTotalRelaxed));
				fileIndicesWithArtifactRatios.push_back(fileIndex);
			}
		}
	}
	if (covValidity) {
		fileIndices.push_back(fileIndex);
		validity = 1;
	} else if (!suppAlignments.empty()) {
		fileIndices.push_back(fileIndex);
		validity = 0;
	}
}

void MrefEntry::mergeMrefEntries(MrefEntry& entry2) {
	pos = entry2.getPos();
	for (auto artifactRatio : entry2.getArtifactRatios()) {
		artifactRatios.push_back(artifactRatio);
	}
	for (auto fileIndex : entry2.getFileIndicesWithArtifactRatios()) {
		fileIndicesWithArtifactRatios.push_back(fileIndex);
	}
	for (auto fileIndex : entry2.getFileIndices()) {
		fileIndices.push_back(fileIndex);
	}
	for (auto saPtr : entry2.getSupplementsPtr()) {
		if (!saMatcher(saPtr)) {
			suppAlignments.push_back(*saPtr);
		}
	}
	validity = std::max(validity, entry2.getValidityScore());
}

std::string MrefEntry::printBpInfo(const std::string& chromosome) {
	finalizeFileIndices();
	std::vector<std::string> outputFields { };
	outputFields.emplace_back(chromosome);
	outputFields.emplace_back(strtk::type_to_string<int>(pos));
	outputFields.emplace_back(strtk::type_to_string<int>(pos + 1));
	outputFields.emplace_back(strtk::type_to_string<int>(fileIndices.size()));
	outputFields.emplace_back(strtk::type_to_string<int>(fileIndicesWithArtifactRatios.size()));
	outputFields.emplace_back(boost::str(doubleFormatter % ((fileIndices.size() + 0.0) / NUMPIDS)));
	outputFields.emplace_back(boost::str(doubleFormatter % ((fileIndicesWithArtifactRatios.size() + 0.0) / NUMPIDS)));
	if (!artifactRatios.empty()) {
		outputFields.emplace_back(boost::str(doubleFormatter % (std::accumulate(artifactRatios.cbegin(), artifactRatios.cend(), 0.0) / artifactRatios.size())));
	} else {
		outputFields.emplace_back("NA");
	}
	if (suppAlignments.empty()) {
		outputFields.emplace_back(".");
	} else {
		std::vector<std::string> saFields { };
		saFields.reserve(suppAlignments.size());
		for (auto &sa : suppAlignments) {
			sa.finalizeSupportingIndices();
			if (suppAlignments.size() < 11 || sa.getSupport() >= 0.2 * fileIndices.size()) {
				saFields.emplace_back(sa.print());
			}
		}
		if (saFields.empty()) {
			outputFields.emplace_back(".");
		} else {
			outputFields.emplace_back(boost::join(saFields, ";"));
		}
	}
	std::vector<std::string> fileIndicesStr { };
	std::transform(fileIndices.begin(), fileIndices.end(), std::back_inserter(fileIndicesStr), [](int fileIndex) {return strtk::type_to_string<int>(fileIndex);});
	outputFields.emplace_back(boost::join(fileIndicesStr, ","));
	return boost::join(outputFields, "\t").append("\n");
}

std::string MrefEntry::printArtifactRatios(const std::string& chromosome) {
	std::vector<std::string> outputFields { };
	outputFields.reserve(NUMPIDS + 3);
	outputFields.emplace_back(chromosome);
	outputFields.emplace_back(strtk::type_to_string<int>(pos));
	outputFields.emplace_back(strtk::type_to_string<int>(pos + 1));
	std::vector<std::string> artifactRatiosOutput(NUMPIDS, ".");
	for (auto i = 0; i < static_cast<int>(fileIndicesWithArtifactRatios.size()); ++i) {
		artifactRatiosOutput[fileIndicesWithArtifactRatios[i]] = boost::str(doubleFormatter % artifactRatios[i]);
	}
	for (const auto &artifactRatio : artifactRatiosOutput) {
		outputFields.push_back(artifactRatio);
	}
	return boost::join(outputFields, "\t").append("\n");
}

SuppAlignmentAnno* MrefEntry::searchFuzzySa(const SuppAlignmentAnno& fuzzySa) {
	SuppAlignmentAnno* match = nullptr;
	for (auto &sa : suppAlignments) {
		if (sa.isToRemove()) {
			continue;
		}
		if (sa.saClosenessDirectional(fuzzySa, 1)) {
			match = &sa;
			return match;
		}
	}
	return nullptr;
}
bool MrefEntry::saMatcher(SuppAlignmentAnno* saPtr) {
	if (saPtr->isToRemove() || saPtr->isSuspicious() || (saPtr->getExpectedDiscordants() > 0 && !(saPtr->getMateSupport() / (saPtr->getExpectedDiscordants() + 0.0) > 0.1))) {
		return true;
	}
	for (auto &sa : suppAlignments) {
		if (sa.saCloseness(*saPtr, 100)) {
			if (sa.isFuzzy()) {
				if (saPtr->isFuzzy()) {
					sa.extendSuppAlignment(saPtr->getPos(), saPtr->getExtendedPos());
				} else {
					sa.removeFuzziness(*saPtr);
				}
			}
			sa.addSupportingIndices(saPtr->getSupportingIndices());
			sa.mergeMrefSa(*saPtr);
			saPtr->setToRemove(true);
			return true;
		}
	}
	return false;
}

void MrefEntry::finalizeFileIndices() {
	for (const auto &sa : suppAlignments) {
		auto tmpIndices = sa.getSupportingIndices();
		std::copy(tmpIndices.begin(), tmpIndices.end(), std::inserter(fileIndices, fileIndices.end()));
	}
	std::sort(fileIndices.begin(), fileIndices.end());
	auto last = std::unique(fileIndices.begin(), fileIndices.end());
	fileIndices.erase(last, fileIndices.end());
}

} /* namespace sophia */

