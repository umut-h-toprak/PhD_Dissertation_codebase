if (!require("ggplot2")) install.packages("ggplot2")
library(ggplot2)
if (!require("viridis")) install.packages("viridis")
library(viridis)
if (!require("scales")) install.packages("scales")
library(scales)

grandDf=read.delim("abridgedProcessedReport.tsv",stringsAsFactors = FALSE)
grandDf$group=as.factor(grandDf$group)
grandPlot=ggplot(grandDf,aes(x=group,y=elapsedTime))+
  geom_jitter(size=0.3)+
  geom_violin(position = "dodge",colour="red",fill=NA)+
  scale_y_continuous(name="CPU Time (minutes)")+
  scale_x_discrete(name="")+ 
  coord_flip()+
  theme_classic()

ggsave("timing.pdf",grandPlot)
ggsave("ch2_timing_step2.png",grandPlot)

grandPlot=ggplot(grandDf,aes(x=group,y=elapsedTime))+
  geom_jitter(size=0.3)+
  geom_violin(position = "dodge",colour="red",fill=NA)+
  scale_y_continuous(name="CPU Time (minutes)",limits = c(0,15),oob = squish)+
  scale_x_discrete(name="")+
  coord_flip()+
  theme_classic()

ggsave("timing_noOutlier.pdf",grandPlot)
ggsave("ch2_timing_step2_noOutlier.png",grandPlot)

grandPlot=ggplot(grandDf,aes(x=group,y=maxMem))+
  geom_jitter(size=0.3)+
  geom_violin(position = "dodge",colour="red",fill=NA)+
  scale_y_continuous(name="Peak RAM usage (gigabytes)")+
  scale_x_discrete(name="")+ 
  coord_flip()+
  theme_classic()
ggsave("peakRAM.pdf",grandPlot)
ggsave("ch2_peakRam.png",grandPlot)

grandPlot=ggplot(grandDf,aes(x=group,y=maxMem))+
  geom_jitter(size=0.3)+
  geom_violin(position = "dodge",colour="red",fill=NA)+
  scale_y_continuous(name="Peak RAM usage (gigabytes)",limits = c(0,15),oob = squish)+
  scale_x_discrete(name="")+ 
  coord_flip()+
  theme_classic()
ggsave("peakRAM_noOutlier.pdf",grandPlot)
ggsave("ch2_peakRam_noOutlier.png",grandPlot)


grandPlot=ggplot(grandDf,aes(x=elapsedTime,y=maxMem,color=group))+
  geom_point()+
  scale_x_continuous(name="CPU Time (minutes)")+
  scale_y_continuous(name="Peak RAM usage (gigabytes)")+
  scale_color_viridis_d()+
  geom_density_2d(aes(x=elapsedTime,y=maxMem)) +
  theme_classic()
ggsave("RAMvsTime.pdf",grandPlot)
ggsave("ch2_peakRAMvsTime.png",grandPlot)
