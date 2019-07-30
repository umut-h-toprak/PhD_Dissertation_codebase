/*
 * CigarChunk.h
 *
 *  Created on: 16 Apr 2016
 *      Author: umuttoprak
 */

#ifndef CIGARCHUNK_H_
#define CIGARCHUNK_H_

namespace sophia {
struct CigarChunk {
	char chunkType;
	bool encounteredM;
	int startPosOnRead;
	int length;
	int indelAdjustment;
	CigarChunk(char chunkTypeIn, bool encounteredMIn, int startPosOnReadIn, int lengthIn) :
					chunkType { chunkTypeIn },
					encounteredM { encounteredMIn },
					startPosOnRead { startPosOnReadIn },
					length { lengthIn },
					indelAdjustment { 0 } {
	}
	CigarChunk(char chunkTypeIn, bool encounteredMIn, int startPosOnReadIn, int lengthIn, int indelAdjustmentIn) :
					chunkType { chunkTypeIn },
					encounteredM { encounteredMIn },
					startPosOnRead { startPosOnReadIn },
					length { lengthIn },
					indelAdjustment { indelAdjustmentIn } {
	}
	~CigarChunk() = default;
};
}
#endif /* CIGARCHUNK_H_ */
