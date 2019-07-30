/*
 * MrefEntry.cpp
 *
 *  Created on: 27 Nov 2016
 *      Author: umuttoprak
 */

#include "Breakpoint.h"
#include "strtk.hpp"
#include <boost/algorithm/string/join.hpp>
#include <BreakpointReduced.h>
#include <unordered_set>
#include "ChrConverter.h"

namespace sophia {
boost::format BreakpointReduced::doubleFormatter { "%.3f" };
const std::string BreakpointReduced::TELOMERICPATTERN{"TTAGGG"};
const std::string BreakpointReduced::TELOMERICPATTERNINV{"CCCTAA"};
int BreakpointReduced::DEFAULTREADLENGTH { };
double BreakpointReduced::CLONALITYSTRICTLOWTHRESHOLD { };
double BreakpointReduced::ARTIFACTFREQHIGHTHRESHOLD { };
std::string BreakpointReduced::PIDSINMREFSTR { };

sophia::BreakpointReduced::BreakpointReduced(const Breakpoint& tmpBp, int lineIndexIn, bool hasOverhangIn) :
				hasOverhang { hasOverhangIn },
				toRemove { false },
				lineIndex { lineIndexIn },
				chrIndex { tmpBp.getChrIndex() },
				pos { tmpBp.getPos() },
				normalSpans { tmpBp.getNormalSpans() },
				lowQualSpansSoft { tmpBp.getLowQualBreaksSoft() },
				lowQualSpansHard { tmpBp.getLowQualSpansHard() },
				unpairedBreaksSoft { tmpBp.getUnpairedBreaksSoft() },
				unpairedBreaksHard { tmpBp.getUnpairedBreaksHard() },
				breaksShortIndel { tmpBp.getBreaksShortIndel() },
				lowQualBreaksSoft { tmpBp.getLowQualBreaksSoft() },
				lowQualBreaksHard { tmpBp.getLowQualBreaksHard() },
				repetitiveOverhangBreaks { tmpBp.getRepetitiveOverhangBreaks() },
				pairedBreaksSoft { tmpBp.getPairedBreaksSoft() },
				pairedBreaksHard { tmpBp.getPairedBreaksHard() },
				mateSupport { tmpBp.getMateSupport() },
				leftCoverage { tmpBp.getLeftCoverage() },
				rightCoverage { tmpBp.getRightCoverage() },
				mrefHits { MrefMatch { -1, -1, 10000, { }, } },
				germlineInfo { GermlineMatch { 0.0, 0.0, { }, } },
				suppAlignments { } {
	for (const auto& sa : tmpBp.getDoubleSidedMatches()) {
		if (sa.getChrIndex() < 1002) {
			suppAlignments.emplace_back(sa);
		}
	}
	for (const auto& sa : tmpBp.getSupplementsPrimary()) {
		if (sa.getChrIndex() < 1002) {
			suppAlignments.emplace_back(sa);
		}
	}
	consolidateTelomericSupplementaries(tmpBp.getConsensusOverhangs(),false,false);
	consolidateTelomericSupplementaries(tmpBp.getConsensusOverhangs(),false,true);
	consolidateTelomericSupplementaries(tmpBp.getConsensusOverhangs(),true,false);
	consolidateTelomericSupplementaries(tmpBp.getConsensusOverhangs(),true,true);
	cleanupNonTelomerics();
	complexRearrangementMateRatioRescue(true);
	complexRearrangementMateRatioRescue(false);
}
void BreakpointReduced::consolidateTelomericSupplementaries(const std::vector<std::string>& consensusOverhangs,bool invMode,bool encounteredMMode){
	auto bestSoftSupport=-1;
	for (const auto &overhang : consensusOverhangs) {
		auto teloScore=checkTelomericRepeatSequence(overhang,invMode,encounteredMMode);
		if(teloScore>0){
//			std::cerr<<overhang<<" "<<teloScore<<"\n";
			if(teloScore>bestSoftSupport){
				bestSoftSupport=teloScore;
			}
		}
	}
	if(bestSoftSupport>0){
		auto bestSoftSaSupport=0;
		auto bestHardSupport=0;
		auto bestMateSupport=0;
		for (const auto &sa: suppAlignments) {
			if(invMode==sa.isInverted() && encounteredMMode==sa.isEncounteredM()){
				auto softSupport=sa.getSupport();
				auto hardSupport=sa.getSecondarySupport();
				auto mateSupport=sa.getMateSupport();
				if(softSupport>bestSoftSaSupport){
					bestSoftSaSupport=softSupport;
				}
				if(hardSupport>bestHardSupport){
					bestHardSupport=hardSupport;
				}
				if(mateSupport>bestMateSupport){
					bestMateSupport=mateSupport;
				}
			}
		}
		if(bestSoftSaSupport>3*bestSoftSupport){
			return;
		}
		suppAlignments.emplace_back(
				36,
				1,
				1,
				std::max(bestSoftSupport,bestSoftSaSupport),
				bestHardSupport,
				bestMateSupport,
				bestMateSupport,
				encounteredMMode,
				invMode,
				false,
				false,
				false);
//		std::cerr<<suppAlignments.back().print()<<"\n";
	}
}
void BreakpointReduced::cleanupNonTelomerics(){
	auto anyTelo=false;
	for(const auto &sa: suppAlignments){
		if(sa.getChrIndex()==36){
			anyTelo=true;
			break;
		}
	}
	if(anyTelo){
		for(auto &sa: suppAlignments){
				if(sa.getChrIndex()!=36){
					sa.setToRemove(true);
				}
			}
	}
	removeMarkedFuzzies();
}
int BreakpointReduced::checkTelomericRepeatSequence(std::string const & overhang,bool invMode,bool encounteredMMode) const {
	auto overhangSupport=0;
	auto currentDigit=0;
	auto encounteredM=false;
	for (auto crit = std::next(overhang.crbegin()); crit != overhang.crend(); ++crit ) {
		if(*crit=='('){
			break;
		}
		overhangSupport+=std::pow(10,currentDigit)*(*crit-'0');
		++currentDigit;
	}
	if(overhangSupport<7){
		return -1;
	}
	auto overhangIt=overhang.cbegin();
	while(*overhangIt!=':'){
		++overhangIt;
	}
	++overhangIt;
	if(*overhangIt=='|'){
		++overhangIt;
		encounteredM=true;
	}
	if(encounteredM!=encounteredMMode){
		return -1;
	}
	auto overhangBeginIt=overhangIt;
	auto hits=0;
	auto overhangLength=0;
	auto citCheckDefault=invMode?TELOMERICPATTERNINV.cbegin():TELOMERICPATTERN.cbegin();
	auto citCheckEndDefault=invMode?TELOMERICPATTERNINV.cend():TELOMERICPATTERN.cend();
	auto citOnCheck=citCheckDefault;
	std::vector<int> endIndices{};
	while(overhangIt!=overhang.cend()) {
		auto currentNucleotide=*overhangIt;
		if(currentNucleotide=='|'){
			break;
		}
		if(currentNucleotide=='('){
			break;
		}
		if(currentNucleotide==*citOnCheck){
			++citOnCheck;
			if(citOnCheck==citCheckEndDefault){
				citOnCheck=citCheckDefault;
				++hits;
				endIndices.push_back(std::distance(overhangBeginIt, overhangIt));
			}
		}else{
			citOnCheck=citCheckDefault;
		}
		 ++overhangIt;
		 ++overhangLength;
	}
	if(hits>3){
//		std::cerr<<overhang<<" "<<overhangLength<<" "<<overhangSupport<<" "<<hits<<"\n";
//		for(auto x: endIndices){
//			std::cerr<<x<<" ";
//		}
//		std::cerr<<"\n";
		double ratioCheck{(0.0+hits)/overhangLength};
		if(ratioCheck>=0.06){
			for(auto cit=std::next(endIndices.cbegin());cit!=endIndices.cend();++cit){
				if(*cit-*std::prev(cit)==6){
					return overhangSupport;
				}
			}
		}
//		else{
//			std::cerr<<hits<<"/"<<overhangLength<<"="<<ratioCheck<<"<"<<0.06<<"\n";
//		}
	}
	return -1;
}

void BreakpointReduced::complexRearrangementMateRatioRescue(bool encounteredM) {
	auto candidateCount = 0;
	auto cumulativeMateSupport = 0.0;
	auto maxExpectedDiscordants = 0;
	for (const auto &sa : suppAlignments) {
		if (sa.isDistant() && sa.isEncounteredM() == encounteredM && !sa.isSuspicious() && sa.getMateSupport() > 4) {
			++candidateCount;
			if (candidateCount == 3) {
				return;
			}
			cumulativeMateSupport += sa.getMateSupport();
			maxExpectedDiscordants = std::max(maxExpectedDiscordants, sa.getExpectedDiscordants());
		}
	}
	if (candidateCount == 2 && cumulativeMateSupport / maxExpectedDiscordants > 0.7) {
		for (auto &sa : suppAlignments) {
			if (sa.isDistant() && sa.isEncounteredM() == encounteredM && !sa.isSuspicious() && sa.getMateSupport() > 4) {
				sa.setExpectedDiscordants(sa.getMateSupport());
			}
		}
	}

}
sophia::BreakpointReduced::BreakpointReduced(const SuppAlignmentAnno& sa, const BreakpointReduced& emittingBp, bool fuzzySecondary) :
				hasOverhang { false },
				toRemove { false },
				lineIndex { -1 },
				chrIndex { sa.getChrIndex() },
				pos { !fuzzySecondary ? sa.getPos() : sa.getExtendedPos() },
				normalSpans { },
				lowQualSpansSoft { },
				lowQualSpansHard { },
				unpairedBreaksSoft { },
				unpairedBreaksHard { },
				breaksShortIndel { },
				lowQualBreaksSoft { },
				lowQualBreaksHard { },
				repetitiveOverhangBreaks { },
				pairedBreaksSoft { },
				pairedBreaksHard { },
				mateSupport { },
				leftCoverage { },
				rightCoverage { },
				mrefHits { MrefMatch { -1, -1, 10000, { } } },
				germlineInfo { GermlineMatch { 0.0, 0.0, { } } },
				suppAlignments { } {
	addDummySa(sa, emittingBp);
}

void sophia::BreakpointReduced::addDummySa(const SuppAlignmentAnno& sa, const BreakpointReduced& emittingBp) {
	suppAlignments.emplace_back(emittingBp.getChrIndex(), emittingBp.getPos(), sa);
}
const SuppAlignmentAnno& sophia::BreakpointReduced::getDummySa() {
	return suppAlignments.back();
}

SuppAlignmentAnno* BreakpointReduced::searchFuzzySa(const SuppAlignmentAnno& fuzzySa) {
	SuppAlignmentAnno* match = nullptr;
	for (auto &sa : suppAlignments) {
		if (sa.saClosenessDirectional(fuzzySa, DEFAULTREADLENGTH * 0.2)) {
			match = &sa;
			return match;
		}
	}
	return nullptr;
}

bool BreakpointReduced::testOverhangBasedCandidacy() const {
	if (pairedBreaksSoft > 0) {
		return false;
	}
	if (breaksShortIndel > 0) {
		return false;
	}
	if (unpairedBreaksSoft < 5) {
		return false;
	}
	if (((0.0 + unpairedBreaksSoft) / normalSpans) < CLONALITYSTRICTLOWTHRESHOLD) {
		return false;
	}
	auto artifactTotal = 0.0 + lowQualSpansSoft + lowQualBreaksSoft + repetitiveOverhangBreaks;
	if ((artifactTotal / (unpairedBreaksSoft + artifactTotal)) > ARTIFACTFREQHIGHTHRESHOLD) {
		return false;
	}
	return true;
}
std::string BreakpointReduced::printOverhang(double germlineClonality, int numHits, const std::string& overhang) const {
	std::string res { "##" };
	res.append(ChrConverter::indexToChr[chrIndex]).append("\t");
	res.append(strtk::type_to_string<int>(pos - 1)).append("\t");
	res.append(strtk::type_to_string<int>(pos)).append("\t");
	if (germlineClonality > 0.1) {
		res.append("GERMLINE(");
	} else {
		res.append("SOMATIC(");
	}
	res.append(strtk::type_to_string<int>(numHits)).append("/").append(PIDSINMREFSTR).append("):");
	res.append(boost::str(doubleFormatter % germlineClonality)).append("\t");
	res.append(overhang).append("\n");
	return res;
}
void BreakpointReduced::removeMarkedFuzzies() {
	suppAlignments.erase(std::remove_if(suppAlignments.begin(), suppAlignments.end(), [](const SuppAlignmentAnno& sa) {return sa.isToRemove();}), suppAlignments.end());
}
} /* namespace sophia */

