/*
 * ChrConverter.h
 *
 *  Created on: 28 Dec 2017
 *      Author: umuttoprak
 */

#ifndef CHRCONVERTER_H_
#define CHRCONVERTER_H_
#include <string>
#include <array>

#include <iterator>
namespace sophia {

class ChrConverter {
public:
	static inline int readChromosomeIndex(std::string::const_iterator startIt, char stopChar) {
		int chrIndex { 0 };
		if (std::isdigit(*startIt)) {
			for (auto chr_cit = startIt; *chr_cit != stopChar; ++chr_cit) {
				chrIndex = chrIndex * 10 + (*chr_cit - '0');
			}
			return chrIndex;
		} else {
			switch (*startIt) {
			case 'h':
				return 999;
			case 'T':
				return 36;
			case 'X':
				return 40;
			case 'G':
				for (auto cit = std::next(startIt, 2); *cit != '.'; ++cit) {
					chrIndex = 10 * chrIndex + *cit - '0';
				}
				return chrIndex;
			case 'Y':
				return 41;
			case 'M':
				++startIt;
				if (*startIt == 'T') {
					return 1001;
				} else {
					return 1003;
				}
			case 'N':
				return 1000;
			case 'p':
				return 1002;
			default:
				return 1003;
			}
		}
		return 0;
	}
	static const std::array<std::string, 1004> indexToChr;
	static const std::array<int, 1004> indexConverter;
	static const std::array<std::string, 85> indexToChrCompressedMref;

};

} /* namespace sophia */

#endif /* CHRCONVERTER_H_ */
