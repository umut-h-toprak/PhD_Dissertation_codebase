library(ggplot2)
repeatCountInput="bpCountsCombined"
repeatCountPlotOutputAllFamilies="bpCountsCombinedCompositionALL.pdf"
repeatCountPlotOutputReducedRange="bpCountsCombinedComposition.pdf"
uniqueRepeatCountPlotOutputAllFamilies="bpCountsCombinedCompositionALL_UniqueBps.pdf"
uniqueRepeatCountPlotOutputReducedRange="bpCountsCombinedComposition_UniqueBps.pdf"

bpCounts=read.delim(repeatCountInput,header = FALSE)
colnames(bpCounts)=c("Family","Bps","UniqueBps","Sequencer")
bpCounts$id=paste(bpCounts$Family,bpCounts$Sequencer,sep = "_")
hiseqBps=bpCounts[bpCounts$Sequencer=="101bp(2694)",]
x10Bps=bpCounts[bpCounts$Sequencer=="151bp(x10)(723)",]
meanBps=(hiseqBps$Bps+x10Bps$Bps)/2
bpCounts$meanBps=rep(meanBps,2)
bpCounts=bpCounts[with(bpCounts,order(-meanBps)),]
bpCounts$Family=factor(bpCounts$Family,levels=as.vector(unique(bpCounts$Family)))
plotAllFamilies=ggplot(bpCounts,aes(x=Family,
                        y=Bps,
                        fill=Sequencer))+
  geom_bar(stat = "identity",position = "dodge")+
  theme(axis.title.x=element_blank(),
        axis.title.y=element_blank(),
        axis.line.x=element_blank(),
        axis.ticks.x=element_blank(),
        panel.grid.major = element_blank(), 
        panel.grid.minor = element_blank(),
        panel.background = element_blank(), 
        axis.line = element_line(colour = "black"),
        legend.position = c(1, 1),
        legend.justification = c(1, 1),
        axis.text.x=element_text(angle=90,hjust=1,vjust=1,lineheight = 0.1),
        strip.background = element_rect(colour="black", fill="transparent"))
ggsave(repeatCountPlotOutputAllFamilies,plotAllFamilies)
plotAllFamiliesUniqueBps=ggplot(bpCounts,aes(x=Family,
                                    y=UniqueBps,
                                    fill=Sequencer))+
  geom_bar(stat = "identity",position = "dodge")+
  theme(axis.title.x=element_blank(),
        axis.title.y=element_blank(),
        axis.line.x=element_blank(),
        axis.ticks.x=element_blank(),
        panel.grid.major = element_blank(), 
        panel.grid.minor = element_blank(),
        panel.background = element_blank(), 
        axis.line = element_line(colour = "black"),
        legend.position = c(1, 1),
        legend.justification = c(1, 1),
        axis.text.x=element_text(angle=90,hjust=1,vjust=1,lineheight = 0.1),
        strip.background = element_rect(colour="black", fill="transparent"))
ggsave(uniqueRepeatCountPlotOutputAllFamilies,plotAllFamiliesUniqueBps)




bpCounts=bpCounts[1:30,]
bpCounts$Family=factor(bpCounts$Family,levels=as.vector(unique(bpCounts$Family)))
plotReducedRange=ggplot(bpCounts,aes(x=Family,
                        y=Bps,
                        fill=Sequencer))+
  geom_bar(stat = "identity",position = "dodge")+
  theme(axis.title.x=element_blank(),
        axis.title.y=element_blank(),
        axis.line.x=element_blank(),
        axis.ticks.x=element_blank(),
        panel.grid.major = element_blank(), 
        panel.grid.minor = element_blank(),
        panel.background = element_blank(), 
        axis.line = element_line(colour = "black"),
        legend.position = c(1, 1),
        legend.justification = c(1, 1),
        axis.text.x=element_text(angle=90,hjust=1,vjust=1,lineheight = 0.1),
        strip.background = element_rect(colour="black", fill="transparent"))
ggsave(repeatCountPlotOutputReducedRange,plotReducedRange)

plotReducedRangeUniqueBps=ggplot(bpCounts,aes(x=Family,
                                     y=UniqueBps,
                                     fill=Sequencer))+
  geom_bar(stat = "identity",position = "dodge")+
  theme(axis.title.x=element_blank(),
        axis.title.y=element_blank(),
        axis.line.x=element_blank(),
        axis.ticks.x=element_blank(),
        panel.grid.major = element_blank(), 
        panel.grid.minor = element_blank(),
        panel.background = element_blank(), 
        axis.line = element_line(colour = "black"),
        legend.position = c(1, 1),
        legend.justification = c(1, 1),
        axis.text.x=element_text(angle=90,hjust=1,vjust=1,lineheight = 0.1),
        strip.background = element_rect(colour="black", fill="transparent"))
ggsave(uniqueRepeatCountPlotOutputReducedRange,plotReducedRangeUniqueBps)
