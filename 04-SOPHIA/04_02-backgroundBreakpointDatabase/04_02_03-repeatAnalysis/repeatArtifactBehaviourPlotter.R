library(ggplot2)
GeomSplitViolin <- ggproto("GeomSplitViolin", GeomViolin, draw_group = function(self, data, ..., draw_quantiles = NULL){
  data <- transform(data, xminv = x - violinwidth * (x - xmin), xmaxv = x + violinwidth * (xmax - x))
  grp <- data[1,'group']
  newdata <- plyr::arrange(transform(data, x = if(grp%%2==1) xminv else xmaxv), if(grp%%2==1) y else -y)
  newdata <- rbind(newdata[1, ], newdata, newdata[nrow(newdata), ], newdata[1, ])
  newdata[c(1,nrow(newdata)-1,nrow(newdata)), 'x'] <- round(newdata[1, 'x']) 
  if (length(draw_quantiles) > 0 & !scales::zero_range(range(data$y))) {
    stopifnot(all(draw_quantiles >= 0), all(draw_quantiles <= 
                                              1))
    quantiles <- create_quantile_segment_frame(data, draw_quantiles)
    aesthetics <- data[rep(1, nrow(quantiles)), setdiff(names(data), c("x", "y")), drop = FALSE]
    aesthetics$alpha <- rep(1, nrow(quantiles))
    both <- cbind(quantiles, aesthetics)
    quantile_grob <- GeomPath$draw_panel(both, ...)
    ggplot2:::ggname("geom_split_violin", grobTree(GeomPolygon$draw_panel(newdata, ...), quantile_grob))
  }
  else {
    ggplot2:::ggname("geom_split_violin", GeomPolygon$draw_panel(newdata, ...))
  }
})

geom_split_violin <- function (mapping = NULL, data = NULL, stat = "ydensity", position = "identity", ..., draw_quantiles = NULL, trim = TRUE, scale = "area", na.rm = FALSE, show.legend = NA, inherit.aes = TRUE) {
  layer(data = data, mapping = mapping, stat = stat, geom = GeomSplitViolin, position = position, show.legend = show.legend, inherit.aes = inherit.aes, params = list(trim = trim, scale = scale, draw_quantiles = draw_quantiles, na.rm = na.rm, ...))
}
repeatCountInput="bpCountsCombined"

bpCounts=read.delim(repeatCountInput,header = FALSE)
colnames(bpCounts)=c("Family","Bps","UniqueBps","Sequencer")
bpCounts$id=paste(bpCounts$Family,bpCounts$Sequencer,sep = "_")
hiseqBps=bpCounts[bpCounts$Sequencer=="101bp(2694)",]
x10Bps=bpCounts[bpCounts$Sequencer=="151bp(x10)(723)",]
meanBps=(hiseqBps$Bps+x10Bps$Bps)/2
bpCounts$meanBps=rep(meanBps,2)
bpCounts=bpCounts[with(bpCounts,order(-meanBps)),]
bpCounts$Family=factor(bpCounts$Family,levels=as.vector(unique(bpCounts$Family)))
bpCounts=bpCounts[1:30,]
bpCounts$Family=factor(bpCounts$Family,levels=as.vector(unique(bpCounts$Family)))


repeatArtifactDataInput="mergedBpArtifactRatios"
repeatArtifactDataOutputBox="mergedBpArtifactRatiosBox.pdf"
bpArtifactRatios=read.delim(repeatArtifactDataInput,header = FALSE,colClasses = c('factor','numeric','factor'))
colnames(bpArtifactRatios)=c("Family","MeanArtifactRatio","Sequencer")
bpArtifactRatios=bpArtifactRatios[bpArtifactRatios$Family %in% as.vector(unique(bpCounts$Family)),]

plotAllFamiliesBox=ggplot(bpArtifactRatios,
                       aes(x=Family,
                           y=MeanArtifactRatio,
                           fill=Sequencer))+
  geom_boxplot(position = "dodge",outlier.shape = NA)+
  theme(axis.title.x=element_blank(),
        axis.title.y=element_blank(),
        axis.line.x=element_blank(),
        axis.ticks.x=element_blank(),
        panel.grid.major = element_blank(), 
        panel.grid.minor = element_blank(),
        panel.background = element_blank(), 
        axis.line = element_line(colour = "black"),
        # legend.position = c(1, 1),
        # legend.justification = c(1, 1),
        axis.text.x=element_text(angle=90,hjust=1,vjust=1,lineheight = 0.1),
        strip.background = element_rect(colour="black", fill="transparent"))
ggsave(repeatArtifactDataOutputBox,plotAllFamiliesBox)

#~ repeatArtifactDataOutputViolin="mergedBpArtifactRatiosViolin.pdf"
#~ plotAllFamiliesViolin=ggplot(bpArtifactRatios,
#~                        aes(x=Family,
#~                            y=MeanArtifactRatio,
#~                            fill=Sequencer))+
#~   geom_split_violin(scale="width")+
#~   theme(axis.title.x=element_blank(),
#~         axis.title.y=element_blank(),
#~         axis.line.x=element_blank(),
#~         axis.ticks.x=element_blank(),
#~         panel.grid.major = element_blank(), 
#~         panel.grid.minor = element_blank(),
#~         panel.background = element_blank(), 
#~         axis.line = element_line(colour = "black"),
#~         # legend.position = c(1, 1),
#~         # legend.justification = c(1, 1),
#~         axis.text.x=element_text(angle=90,hjust=1,vjust=1,lineheight = 0.1),
#~         strip.background = element_rect(colour="black", fill="transparent"))
#~ ggsave(repeatArtifactDataOutputViolin,plotAllFamiliesViolin)
