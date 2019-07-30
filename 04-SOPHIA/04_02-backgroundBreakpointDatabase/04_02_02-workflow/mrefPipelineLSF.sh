bsub -n <1*1> -R "span[ptile=<1>]" -W <48:00> -M <P> -R “rusage[mem=<921600>]” /icgc/dkfzlsdf/analysis/B080/SOPHIA/v35/controls/generalRun.sh $1 $2 $3
