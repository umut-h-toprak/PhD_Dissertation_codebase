/*
 * CoverageAtBase.h
 *
 *  Created on: 18 Apr 2016
 *      Author: umuttoprak
 */

#ifndef COVERAGEATBASE_H_
#define COVERAGEATBASE_H_
#include <memory>
namespace sophia {

class CoverageAtBase {
public:
	CoverageAtBase() :
					coverage { 0 },
					normalBpsSoft { 0 },
					normalBpsHard { 0 },
					normalBpsShortIndel { 0 },
					normalSpans { 0 },
					lowQualSpansSoft { 0 },
					lowQualSpansHard { 0 },
					lowQualBpsSoft { 0 },
					lowQualBpsHard { 0 },
					decoyBlacklisted { false } {
	}
	~CoverageAtBase() = default;
	int getCoverage() const {
		return coverage;
	}
	int getLowQualBpsSoft() const {
		return lowQualBpsSoft;
	}
	int getLowQualBpsHard() const {
		return lowQualBpsHard;
	}
	int getLowQualSpansSoft() const {
		return lowQualSpansSoft;
	}
	int getLowQualSpansHard() const {
		return lowQualSpansHard;
	}
	int getNormalBpsHard() const {
		return normalBpsHard;
	}
	int getNormalBpsSoft() const {
		return normalBpsSoft;
	}
	int getNormalSpans() const {
		return normalSpans;
	}
	void incrementCoverage() {
		++coverage;
	}
	void incrementLowQualBpsSoft() {
		++lowQualBpsSoft;
	}
	void incrementLowQualBpsHard() {
		++lowQualBpsHard;
	}
	void incrementLowQualSpansSoft() {
		++lowQualSpansSoft;
	}
	void incrementLowQualSpansHard() {
		++lowQualSpansHard;
	}
	void incrementNormalBpsHard() {
		++normalBpsHard;
	}
	void incrementNormalBpsSoft() {
		++normalBpsSoft;
	}
	void incrementNormalBpsShortIndel() {
		++normalBpsShortIndel;
	}
	void incrementNormalSpans() {
		++normalSpans;
	}
	void decrementLowQualSpansHard() {
		--lowQualSpansHard;
	}
	void decrementLowQualSpansSoft() {
		--lowQualSpansSoft;
	}
	void decrementNormalSpans() {
		--normalSpans;
	}
	int getNormalBpsShortIndel() const {
		return normalBpsShortIndel;
	}
	bool isDecoyBlacklisted() const {
		return decoyBlacklisted;
	}
	void setDecoyBlacklisted(bool decoyBlacklisted) {
		this->decoyBlacklisted = decoyBlacklisted;
	}

private:
	int coverage;
	int normalBpsSoft;
	int normalBpsHard;
	int normalBpsShortIndel;
	int normalSpans;
	int lowQualSpansSoft;
	int lowQualSpansHard;
	int lowQualBpsSoft;
	int lowQualBpsHard;
	bool decoyBlacklisted;
};

} /* namespace sophia */

#endif /* COVERAGEATBASE_H_ */
