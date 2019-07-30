/*
 * MasterRefProcessor.h
 *
 *  Created on: 27 Apr 2016
 *      Author: umuttoprak
 */

#ifndef MASTERREFPROCESSOR_H_
#define MASTERREFPROCESSOR_H_

#include <vector>
#include <vector>
#include <string>
#include <map>
#include <utility>
#include <memory>
#include <fstream>
#include <array>
#include <boost/iostreams/filtering_stream.hpp>
#include <boost/iostreams/filter/gzip.hpp>
#include <MrefEntry.h>
#include "SuppAlignment.h"
#include <BreakpointReduced.h>

namespace sophia {
class MasterRefProcessor {
public:
	MasterRefProcessor(const std::vector<std::string> &filesIn, const std::string &outputRootName, const std::string &version, const int defaultReadLengthIn);
	~MasterRefProcessor() = default;
private:

	unsigned long long processFile(const std::string &gzPath, short fileIndex);
	bool processBp(BreakpointReduced &bp, int chrIndex,  short fileIndex);
	const int NUMPIDS;
	const int DEFAULTREADLENGTH;
	std::unique_ptr<std::ofstream> mergedBpsOutput;
	std::vector<std::vector<MrefEntry>> mrefDb;
};

}
/* namespace sophiaMref */

#endif /* MASTERREFPROCESSOR_H_ */

