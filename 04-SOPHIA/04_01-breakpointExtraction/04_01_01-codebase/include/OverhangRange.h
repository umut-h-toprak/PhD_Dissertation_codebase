/*
 * Overhang.h
 *
 *  Created on: 18 Apr 2016
 *      Author: umuttoprak
 */

#ifndef OVERHANGRANGE_H_
#define OVERHANGRANGE_H_

namespace sophia {
class OverhangRange {
	friend class Alignment;
public:
	OverhangRange(bool encounteredMIn, int bpPosIn, int startPosOnReadIn, int lengthIn) :
					encounteredM { encounteredMIn },
					bpPos { bpPosIn },
					startPosOnRead { startPosOnReadIn },
					length { lengthIn } {
	}
	~OverhangRange() = default;
private:
	bool encounteredM;
	int bpPos;
	int startPosOnRead;
	int length;
};
}

#endif /* OVERHANGRANGE_H_ */
