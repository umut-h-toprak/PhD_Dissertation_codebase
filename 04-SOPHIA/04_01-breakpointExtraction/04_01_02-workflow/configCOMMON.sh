version="v35"

PIPELINE_BASE="./"
SAMTOOLS_BINARY="samtools"
MBUFFER_BINARY="mbuffer"
SOPHIA_BINARY=${PIPELINE_BASE}/sophia_${version}
GZIP_BINARY="gzip"
resources="-W 36:00 -n 2 -R \"span[ptile=2]\" -M 8192 -R \"rusage[mem=3072]\""

mapqThreshold=13
clipThreshold=10
qualThreshold=23
qualThresholdLow=12
lowQualOverhangThreshold=5
isizeSigmaThreshold=5
bpSupportThreshold=3
