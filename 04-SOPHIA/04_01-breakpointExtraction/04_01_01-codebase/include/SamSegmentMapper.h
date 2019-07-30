/*
 * SamSegmentMapper.h
 *
 *  Created on: 16 Apr 2016
 *      Author: umuttoprak
 */

#ifndef SAMSEGMENTMAPPER_H_
#define SAMSEGMENTMAPPER_H_
#include <string>
#include <ctime>
#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include "Breakpoint.h"
#include "CoverageAtBase.h"
#include "MateInfo.h"

namespace sophia {
class SamSegmentMapper {
public:
	SamSegmentMapper(int defaultReadLengthIn);
	~SamSegmentMapper() = default;
	void parseSamStream();
private:
	void printBps(int alignmentStart);
	void switchChromosome(const Alignment& alignment);
	void incrementCoverages(const Alignment& alignment);
	void assignBps(std::shared_ptr<Alignment>& alignment);
	const time_t STARTTIME;
	const bool PROPERPARIRCOMPENSATIONMODE;
	const int DISCORDANTLEFTRANGE;
	const int DISCORDANTRIGHTRANGE;
	unsigned int printedBps;
	int chrIndexCurrent;
	int minPos, maxPos;
	std::map<int, Breakpoint> breakpointsCurrent;
	std::deque<CoverageAtBase> coverageProfiles;
	std::deque<MateInfo> discordantAlignmentsPool;
	std::deque<MateInfo> discordantAlignmentCandidatesPool;
	std::deque<MateInfo> discordantLowQualAlignmentsPool;
};

} /* namespace sophia */

#endif /* SAMSEGMENTMAPPER_H_ */
