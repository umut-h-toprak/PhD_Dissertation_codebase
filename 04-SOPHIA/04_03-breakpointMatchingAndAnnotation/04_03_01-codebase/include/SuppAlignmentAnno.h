/*
 * SuppAlignment.h
 *
 *  Created on: 16 Apr 2016
 *      Author: umuttoprak
 */

#ifndef SUPPALIGNMENTANNO_H_
#define SUPPALIGNMENTANNO_H_
#include <string>
#include <vector>
#include <array>
#include <unordered_set>
#include <algorithm>
#include "CigarChunk.h"
#include "SuppAlignment.h"

namespace sophia {
class SuppAlignmentAnno {
public:
	SuppAlignmentAnno(const std::string& saStrIn);
	SuppAlignmentAnno(
			int chrIndexIn,
			int posIn,
			int extendedPosIn,
			int supportIn,
			int secondarySupportIn,
			int mateSupportIn,
			int expectedDiscordantsIn,
			bool encounteredMIn,
			bool invertedIn,
			bool suspiciousIn,
			bool semiSuspiciousIn,
			bool properPairErrorProneIn);
	SuppAlignmentAnno(const SuppAlignment& saIn);
	SuppAlignmentAnno(const SuppAlignmentAnno& saAnnoIn);
	SuppAlignmentAnno(int emittingBpChrIndex, int emittingBpPos, const SuppAlignmentAnno& saAnnoIn);
	~SuppAlignmentAnno() = default;
	static double ISIZEMAX;
	static int DEFAULTREADLENGTH;
	std::string print() const;
	void extendSuppAlignment(int minPos, int maxPos) {
		pos = std::min(pos, minPos);
		extendedPos = std::max(extendedPos, maxPos);
	}
	bool saCloseness(const SuppAlignmentAnno& rhs, int fuzziness) const;
	bool saClosenessDirectional(const SuppAlignmentAnno& rhs, int fuzziness) const;
	void removeFuzziness(const SuppAlignmentAnno& sa) {
		pos = sa.getPos();
		extendedPos = pos;
		fuzzy = false;
		if (!distant && sa.isDistant()) {
			distant = true;
		}
	}
	int getChrIndex() const {
		return chrIndex;
	}
	bool isEncounteredM() const {
		return encounteredM;
	}
	bool isInverted() const {
		return inverted;
	}
	int getMateSupport() const {
		return mateSupport;
	}
	void incrementMateSupport() {
		++mateSupport;
	}
	void setMateSupport(int mateSupportIn) {
		mateSupport = mateSupportIn;
	}
	int getPos() const {
		return pos;
	}
	int getSupport() const {
		return support;
	}
	int getSecondarySupport() const {
		return secondarySupport;
	}
	bool isToRemove() const {
		return toRemove;
	}
	void setToRemove(bool toRemove) {
		this->toRemove = toRemove;
	}
	bool isSuspicious() const {
		return suspicious;
	}
	void setSuspicious(bool suspicious) {
		this->suspicious = suspicious;
	}
	bool isDistant() const {
		return distant;
	}
	void setExpectedDiscordants(int expectedDiscordants) {
		this->expectedDiscordants = expectedDiscordants;
	}
	int getExpectedDiscordants() const {
		return expectedDiscordants;
	}
	bool isFuzzy() const {
		return fuzzy;
	}
	bool isStrictFuzzy() const {
		return strictFuzzy;
	}
	int getExtendedPos() const {
		return extendedPos;
	}
	bool isSemiSuspicious() const {
		return semiSuspicious;
	}
	void setSemiSuspicious(bool semiSuspicious) {
		this->semiSuspicious = semiSuspicious;
	}
	void setFuzzy(bool fuzzy) {
		this->fuzzy = fuzzy;
	}

	bool isProperPairErrorProne() const {
		return properPairErrorProne;
	}


	bool isStrictFuzzyCandidate() const {
		return strictFuzzyCandidate;
	}
	void addSupportingIndices(const std::vector<int>& supportingIndicesIn) {
		supportingIndices.insert(supportingIndices.end(), supportingIndicesIn.cbegin(), supportingIndicesIn.cend());
	}
	const std::vector<int>& getSupportingIndices() const {
		return supportingIndices;
	}
	void mergeMrefSa(const SuppAlignmentAnno& mrefSa);
	void finalizeSupportingIndices();
	void mrefSaTransform(int fileIndex) {
		supportingIndices.clear();
		supportingIndices.push_back(fileIndex);
	}
	void mrefSaConsensus(const std::unordered_set<short>& fileIndices) {
		supportingIndices.clear();
		for (const auto &index : fileIndices) {
			supportingIndices.push_back(index);
		}
	}
	void addFileIndex(int fileIndex) {
		supportingIndices.push_back(fileIndex);
	}

	void setSecondarySupport(int secondarySupport) {
		this->secondarySupport = secondarySupport;
	}

	void setSupport(int support) {
		this->support = support;
	}

private:
	int chrIndex;
	int pos;
	int extendedPos;
	int support;
	int secondarySupport;
	int mateSupport;
	int expectedDiscordants;
	bool encounteredM;
	bool toRemove;
	bool inverted;
	bool fuzzy;
	bool strictFuzzy;
	bool strictFuzzyCandidate;
	bool distant;
	bool suspicious;
	bool semiSuspicious;
	bool properPairErrorProne;
	std::vector<int> supportingIndices;
};
} /* namespace sophia */

#endif /* SUPPALIGNMENTANNO_H_ */
