/*
 * AnnotationProcessor.h
 *
 *  Created on: 28 Apr 2016
 *      Author: umuttoprak
 */

#ifndef ANNOTATIONPROCESSOR_H_
#define ANNOTATIONPROCESSOR_H_
#include <BreakpointReduced.h>
#include <MrefEntryAnno.h>
#include <SvEvent.h>
#include <string>
#include <vector>
#include <deque>
#include <utility>
#include <unordered_set>
#include "SuppAlignmentAnno.h"
#include "ChrConverter.h"
#include "MrefMatch.h"
#include "GermlineMatch.h"
#include <memory>
//
//struct VectorHash {
//	size_t operator()(const std::vector<int>& v) const {
//		std::hash<int> hasher;
//		size_t seed = 0;
//		for (int i : v) {
//			seed ^= hasher(i) + 0x9e3779b9 + (seed << 6) + (seed >> 2);
//		}
//		return seed;
//	}
//};

namespace sophia {
class AnnotationProcessor {
public:
	static bool ABRIDGEDOUTPUT;
	AnnotationProcessor(const std::string &tumorResultsIn, std::vector<std::vector<MrefEntryAnno>> &mref, int defaultReadLengthTumorIn, bool controlCheckModeIn, int germlineDbLimit);
	AnnotationProcessor(const std::string &tumorResultsIn, std::vector<std::vector<MrefEntryAnno>> &mref, const std::string &controlResultsIn, int defaultReadLengthTumorIn, int defaultReadLengthControlIn, int germlineDbLimit, int lowQualControlIn, bool pathogenInControlIn);
	void printFilteredResults(bool contaminationInControl, int controlPrefilteringLevel) const;
	int getMassiveInvFilteringLevel() const {
		return massiveInvFilteringLevel;
	}

	bool isContaminationObserved() const {
		return contaminationObserved;
	}

private:
	void searchMatches(std::vector<std::vector<MrefEntryAnno>>& mref);
	std::pair<int,bool> createDoubleMatchSv(BreakpointReduced& sourceBp, BreakpointReduced& targetBp, const SuppAlignmentAnno& sa, const SuppAlignmentAnno& saMatch, bool checkOrder, std::vector<std::vector<MrefEntryAnno>>& mref, bool preProtectedSa);
	bool createDoubleMatchSvPreCheck(const SuppAlignmentAnno& saMatch);
	int createUnmatchedSaSv(BreakpointReduced& sourceBp, BreakpointReduced& targetBp, const SuppAlignmentAnno& sa, std::vector<std::vector<MrefEntryAnno>>& mref, bool preProtectedSa);
	int createUnknownMatchSv(BreakpointReduced& sourceBp, const SuppAlignmentAnno& sa, std::vector<std::vector<MrefEntryAnno>>& mref, bool preProtectedSa);
	bool createUnknownMatchSvPreCheck(const SuppAlignmentAnno& sa, bool doubleSupportSa);
	int checkSvQuality(bool preProtectedSa);
	void addProtectedCase(const  SuppAlignmentAnno& sa,std::vector<std::vector<MrefEntryAnno>>& mref, const BreakpointReduced& bp, SvEvent* svPtr,bool switched);
	MrefMatch searchMrefHitsNew(const BreakpointReduced& bpIn, int distanceThreshold, int conservativeDistanceThreshold, std::vector<std::vector<MrefEntryAnno>> &mref);
	GermlineMatch searchGermlineHitsNew(const BreakpointReduced& bpIn, int distanceThreshold, int conservativeDistanceThreshold);

	void searchSa(int chrIndex, int dbIndex, const SuppAlignmentAnno& sa, bool doubleSupportSa, std::vector<std::vector<MrefEntryAnno>> &mref);
	bool applyMassiveInversionFiltering(bool stricterMode, bool controlCheckMode);
	bool applyPathogenContaminationFiltering();
	void printUnresolvedRareOverhangs(std::vector<std::vector<MrefEntryAnno>> &mref);
	const bool NOCONTROLMODE;
	const int GERMLINEDBLIMIT;
	bool contaminationObserved;
	int massiveInvFilteringLevel;
//	std::unordered_set<std::vector<int>, VectorHash> filteredResultKeys;
	std::unordered_set<std::string> filteredResultKeys;
	std::vector<SvEvent> filteredResults;
	std::vector<std::vector<BreakpointReduced>> tumorResults;
	std::vector<std::vector<BreakpointReduced>> controlResults;
	std::vector<std::pair<int, std::string>> overhangs;
	std::vector<int> visitedLineIndices;
};
} /* namespace sophia */

#endif /* ANNOTATIONPROCESSOR_H_ */
