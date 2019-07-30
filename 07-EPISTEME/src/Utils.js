const SvgSaver = require('svgsaver');

export function polarToCartesian(radius, theta){
    theta -= Math.PI * 0.5;
    let x=radius*Math.cos(theta);
    let y=radius*Math.sin(theta);
    return [x, y];
}
export function cartesianToPolar(x1,y1,x2,y2){
    let res=[Math.sqrt(Math.pow(y2-y1,2)+Math.pow(x2-x1,2)), Math.atan((y2-y1)/(x2-x1))+Math.PI*0.5];
    if(x2<x1){
        res[1]+=Math.PI;
    }
    return res;
}

export function range(start, edge, step){
    let ret = [];
    for (; (edge - start) * step > 0; start += step) {
        ret.push(start);
    }
    return ret;
}
export function discreteColourGrayRed(){
    return ['#808080', '#e41a1c'];
}
export function discreteColour(i) {
    switch (i) {
        case 1:
            return ['#0000ff'];
        case 2:
            return ['#0000ff','#e41a1c'];
        case 3:
            return ['#e41a1c','#0000ff','#000000'];
        case 4:
            return ['#e41a1c','#0000ff','#4daf4a','#000000'];
        case 5:
            return ['#e41a1c','#0000ff','#4daf4a','#984ea3','#000000'];
        case 6:
            return ['#e41a1c','#0000ff','#4daf4a','#984ea3','#ff7f00','#000000'];
        case 7:
            return ['#e41a1c','#0000ff','#4daf4a','#984ea3','#ff7f00','#a65628','#000000'];
        case 8:
            return ['#e41a1c','#0000ff','#4daf4a','#984ea3','#ff7f00','#a65628','#f781bf','#000000'];
        case 9:
            return ['#e41a1c','#0000ff','#4daf4a','#984ea3','#ff7f00','#a65628','#f781bf', '#999999','#000000'];
        case 10:
            return ['#e41a1c','#0000ff','#4daf4a','#984ea3','#ff7f00','#a65628','#f781bf', '#999999','#ffff33', '#000000'];
        case 11:
            return ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', "#000000"];
        case 12:
            return ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', "#000000",];
        case 13:
            return ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928', "#000000",];
        case 14:
            return ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#8c564b", "#e377c2", "#f7b6d2", "#7f7f7f", "#17becf", "#000000"];
        case 15:
            return ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#8c564b", "#e377c2", "#f7b6d2", "#7f7f7f", "#bcbd22", "#17becf", "#000000"];
        case 16:
            return ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#bcbd22", "#17becf", "#000000"];
        case 17:
            return ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#17becf", "#000000"];
        case 18:
            return ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#17becf", "#000000"];
        case 19:
            return ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#17becf", "#9edae5", "#000000"];
        case 20:
            return ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#17becf", "#9edae5", "#000000"];
        case 21:
            return ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5", "#000000"];
        default:
            let res=[];
            for(let j=0;j<i;++j){
                res.push(rainbow(i,j))
            }
            return res;
    }
}

export function clearAnnotations(){
    $('#smallVariantCounter').empty();
    $('#midSizedSvCounter').empty();
    $('#vdjSvCounter').empty();
    $('#svCounter').empty();
    $('#svDescription').empty();
    $('#vdjSvDescription').empty();
    $('#midSizedSvDescription').empty();
    $('#smallVariantDescription').empty();
    $(`.nav-tabs a[href="#controlsPane"]`).tab("show");
    $("#tmpDonorTracer").remove();
}

export function cleanup(){
    switchElements(["cohortSelectorGroup",
        "subcohortSelectorGroup",
        "mainContentControl",
        "cohortMetadataContentControl",
        "phenotypeExpressionContentPaneControl",
        "survivalContentPaneControl",
        "flexiblePlotsContentPaneControl",
        "heatmapContentPaneControl",
        "heatmapSubmit",

        "cytobandDescriptionPaneControl",
        "svDescriptionPaneControl",
        "midSizedSvDescriptionPaneControl",
        "vdjSvDescriptionPaneControl",
        "smallVariantDescriptionPaneControl",
        "tadDescriptionPaneControl",
        "geneRecDescriptionPaneControl",

        "helpPaneControl",
        "cohortDescriptionPaneControl",

        "variantGeneExpressionVolcanoControls",
        "correlationGeneExpressionVolcanoControls",
        "subcohortGeneExpressionVolcanoControls",
        "variantGeneExpressionVolcanoContentPaneControl",
        "correlationGeneExpressionVolcanoContentPaneControl",
        "subcohortGeneExpressionVolcanoContentPaneControl",

        "variantRppaExpressionVolcanoControls",
        "correlationRppaExpressionVolcanoControls",
        "subcohortRppaExpressionVolcanoControls",
        "variantRppaExpressionVolcanoContentPaneControl",
        "correlationRppaExpressionVolcanoContentPaneControl",
        "subcohortRppaExpressionVolcanoContentPaneControl",

        "subcohortMutexVolcanoControls",
        "subcohortMutexVolcanoContentPaneControl",

        "volcanoGeneDescriptionPaneControl",
        "volcanoControls",

        "selectorControlsCollapseControl",
        "fontControlsCollapseControl",
        "antibodySelectorGroup",
        "volcanoSpecificGeneSelectorControls",
        "geneSelectorControlsForMarkedGenes",
        "geneSelectorControlsForMarkedGenesVolcanoSpecific",
        "clearMarkedCytobands",
        "expressionControls",
        "metadataControls",
        "complexSelectionCollapseControl",
        "selectionToCategoricalCollapseControl",
        "categoricalToSelectionCollapseControl",
        "complexSelectionQueryBuilderGet",
        "flexiblePlotControls",
        "heatmapControls",
        "survivalControls",
        "resetFocus",
        "variantDisplayControls",
        "svgDownloader",
        "heatmapClusteringChoicesCollapseControl",
        "heatmapSubcohortMarkerGroup",
        "subcohortSelectionFromHeatmapGroup",
    ],[]);
    $('#geneExpressionContentVolcano').empty();
    $('#rppaExpressionContentVolcano').empty();
    $('#geneSelector').val("");
    $('#chromosomeArmSelector').val("");
    $('#cytobandSelector').val("");
    $('#geneMarker').val("");
    $('#cytobandMarker').val("");
    $('#igTraMode').prop('checked', false);
    $('#fontControlsCollapse').collapse('hide');
    $('#selectionToCategoricalCollapse').collapse('hide');
    $('#complexSelectionCollapse').collapse('hide');
    $('#miniSelectionCollapse').collapse('hide');
    $('#selectorControlsCollapse').collapse('hide');
    $('#chromosomalSizeControlsCollapse').collapse('hide');
    $('#aestheticsCollapse').collapse('hide');
    $('#helpPaneControl').css("display","inline");
    $('#cohortDescriptionPaneControl').css("display","inline");
    $('#survivalContent').empty();
    $('#expressionContent').empty();
    $('#correlationGeneExpressionVolcanoGeneExpressionContentAux').empty();
    $('#subcohortGeneExpressionVolcanoGeneExpressionContentAux').empty();
    $('#subcohortMutexVolcanoGeneExpressionContentAux').empty();
    $('#correlationRppaExpressionVolcanoGeneExpressionContentAux').empty();
    $('#subcohortRppaExpressionVolcanoGeneExpressionContentAux').empty();
    $('#variantGeneExpressionVolcanoGeneExpressionContentAux').empty();
    $('#subcohortSelector').empty();
    $('#subcohortSelectorFlexiblePlotGrid').empty();
    $('#subcohortSelectorFlexiblePlotGridDefault').empty();
    $('#flexibleSubcohortSelector').empty();
    $('#flexibleSubcohortSelectorManifold').empty();
    $('#groupSelectorSinglePhenotypeSelector1').empty();
    $('#groupSelectorSinglePhenotypeSelector2').empty();
    $('#heatmapSubcohortMarkerSelector').empty();
    $('#miniSelectionBuilderSubgroupSelector').empty();
    $('#subcohortDiffSelector').empty().append('<option value="-1">as-is</option>');
    $('#singleDonorSelector').empty().append('<option value="-1">Select Donor</option>');
    $('#mainContent').empty();
    $('#wheelControls').empty();
    $('#cohortMetadataTable').empty();
    $('#volcanoControls').empty();
    $('#flexiblePlotsContentMain').empty();
    $('#heatmapContent').empty();
    $('#heatmapDistanceSelector').val("-1");
    $('#heatmapLinkageSelector').val("-1");
    $('#geneExpressionContent').empty();
    $('#rppaExpressionContent').empty();
    $('#variantGeneExpressionVolcanoContent').empty();
    $('#variantRppaExpressionVolcanoContent').empty();
    $('#correlationGeneExpressionVolcanoContent').empty();
    $('#subcohortGeneExpressionVolcanoContent').empty();
    $('#subcohortMutexVolcanoContent').empty();
    $('#subcohortRppaExpressionVolcanoContent').empty();
    $("#antibodySelectorGroup").css("display","none");
    $('#vdjTraModeGroup').css('display','none');
    $('#vdjTraMode').prop('checked', false);
    $('#numGridCellsXController').slider().slider('setValue',1).slider('refresh');
    $('#numGridCellsYController').slider().slider('setValue',1).slider('refresh');
}
export function eqSet(as, bs) {
    if (as.size !== bs.size) return false;
    for (let a of as) if (!bs.has(a)) return false;
    return true;
}
export function countCharacters(inputString,characterToSearch){
    let count = -1;
    for (let index = 0; index !== -1; index = inputString.indexOf(characterToSearch, index + 1)){
        count++;
    }
    return count;
}
export function shuff(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
}

export function padENSG(strippedGeneId){
    let strippedGeneIdStr=strippedGeneId.toString();
    return `ENSG${"0".repeat(11-strippedGeneIdStr.length)}${strippedGeneIdStr}`;
}

export function padSE(dbSuperEntry) {
    let dbSuperEntryStr=dbSuperEntry.toString();
    return `SE_${"0".repeat(5-dbSuperEntryStr.length)}${dbSuperEntry}`;
}

export function searchInPubMed(toSearch, diseaseNameAlternatives){
    return `<a href="https://www.ncbi.nlm.nih.gov/pubmed?term=(${diseaseNameAlternatives.join(' OR ')}) AND ${toSearch}" target="_blank">${toSearch}</a>`;
}

export function getGenomeBrowserLink(span){
    return `<a href="https://genome.ucsc.edu/cgi-bin/hgTracks?org=human&db=hg19&position=chr${span}" target="_blank">${span}</a>`;
}
export function getReactomeLink(reactomePathwayId,reactomePathwayName){
    return `<a href="https://reactome.org/PathwayBrowser/#/R-HSA-${reactomePathwayId}" target="_blank">${reactomePathwayName}</a>`;
}

export function switchElements(elementsToHide,elementsToShow){
    for(let i=0; i<elementsToHide.length;++i){
        $(`#${elementsToHide[i]}`).css("display","none");
    }
    for(let i=0; i<elementsToShow.length;++i){
        $(`#${elementsToShow[i]}`).css("display","inline");
    }
}
export function transpose(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j <i; j++) {
            let temp = arr[i][j];
            arr[i][j] = arr[j][i];
            arr[j][i] = temp;
        }
    }
}

export function transitionToVariantScreen(commonSettings) {
    $('#mainContentPane').parent().addClass('active').siblings().removeClass('active');
    $('#mainContent').addClass('active').siblings().removeClass('active');
    $('.nav-tabs a[href="#controlsPane"]').tab("show");
    $('#volcanoGeneDescriptionPaneControl').css("display","none");
    if(commonSettings.markedGenes.size>0 || commonSettings.hyperzoomMarkedGenes.size>0 || commonSettings.volcanoMarkedGenes.size>0){
        $('#geneSelectorControlsForMarkedGenes').css('display','inline');
    }else{
        $('#geneSelectorControlsForMarkedGenes').css('display','none');
    }
}
export function saveSvg(sourceSvgId,targetFileName) {
    targetFileName=targetFileName.replace(/\//g,"of");
    let svgHandle=$(`#${sourceSvgId}`);
    let prevViewBox=svgHandle.attr("viewBox");
    let prevHeight=svgHandle.attr("height");
    let prevWidth=svgHandle.attr("width");
    svgHandle.attr("width",screen.height*0.85.toString());
    svgHandle.attr("height",screen.height*0.85.toString());
    try{
        let svgHandleClassic=document.querySelector(`#${sourceSvgId}`);
        let svgsaver = new SvgSaver();
        setTimeout(()=>{
            svgsaver.asSvg(svgHandleClassic,targetFileName);
            svgHandle.attr("viewBox",prevViewBox);
            svgHandle.attr("width",prevWidth);
            svgHandle.attr("height",prevHeight);
        },0);
    }catch (err) {
        console.error(err);
    }
}
export function variance(arr) {
    let res=0;
    for(let i=0;i<arr.length;++i){

    }
}

let testFullNames=new Map();
testFullNames.set("Jf","Fisher's Exact Test on Jenk-Optimized Breaks");
testFullNames.set("Kw","Kruskal-Wallis Test");
testFullNames.set("Ks","Kolmogorov-Smirnov Test");
testFullNames.set("T","T-test");
export function getTestFullName(testName) {
    if(testFullNames.has(testName)){
        return testFullNames.get(testName);
    }else{
        return "";
    }
}

export function binary_to_std(tree) {
    if ((tree.left) && (tree.right)) {
        tree.children = [binary_to_std(tree.left), binary_to_std(tree.right)];
    } else if (tree.left) {
        tree.children = [binary_to_std(tree.left)];
    } else if (tree.right) {
        tree.children = [binary_to_std(tree.right)];
    }
    return tree;
}

export function recursive_sort(t, cmp, keygen) {
    let children = (t.children ? t.children : []);
    for (let i = 0; i < children.length; ++i) {
        recursive_sort(children[i], cmp, keygen);
    }
    if (keygen) {
        keygen(t);
    }
    return children.sort(cmp);
}

export  function tcmp(a, b) {
    let children_a = a.children != null ? a.children : [];
    let children_b = b.children != null ? b.children : [];
    let ref = zip(children_a, children_b);
    for (let i = 0; i < ref.length; ++i) {
        let ci = tcmp(ref[i][0], ref[i][1]);
        if (ci !== 0) {
            return ci;
        }
    }
    return children_b.length - children_a.length;
}

export function canonical_sort(tree) {
    return recursive_sort(tree, tcmp);
}

export function zip() {
    let args = [].slice.call(arguments);
    let shortest = args.length === 0 ? [] : args.reduce((function(a, b) {
        if (a.length < b.length) {
            return a;
        } else {
            return b;
        }
    }));
    return shortest.map((function(_, i) {
        return args.map(function(array) {
            return array[i];
        });
    }));
}
export function depadTree(tree) {
    if(tree.right) {
        depadTree(tree.right);
    }
    if(tree.left){
        depadTree(tree.left);
    }else if(!tree.right){
        tree.identifier = tree.value.pop();
    }
}

export function getTreeLeaves(tree) {
    let seq = [];
    let parseLeaves = function(node) {
        if (node.left || node.right) {
            let results = [];
            if(node.left){
                parseLeaves(node.left);
            }
            if(node.right){
                parseLeaves(node.right);
            }
            return results;
        }else{
            seq.push(node.identifier);
        }
    };
    parseLeaves(tree);
    return seq;
}
// export function pearsonCorrelationRawInverse(exp1s,exp2s){
//     let shortestArrayLength = exp1s.length;
//     let xy = [];
//     let x2 = [];
//     let y2 = [];
//
//     for(let i=0; i<shortestArrayLength; i++) {
//         xy.push(exp1s[i] * exp2s[i]);
//         x2.push(exp1s[i] * exp1s[i]);
//         y2.push(exp2s[i] * exp2s[i]);
//     }
//
//     let sum_x = 0;
//     let sum_y = 0;
//     let sum_xy = 0;
//     let sum_x2 = 0;
//     let sum_y2 = 0;
//
//     for(let i=0; i< shortestArrayLength; i++) {
//         sum_x += exp1s[i];
//         sum_y += exp2s[i];
//         sum_xy += xy[i];
//         sum_x2 += x2[i];
//         sum_y2 += y2[i];
//     }
//
//     let step1 = (shortestArrayLength * sum_xy) - (sum_x * sum_y);
//     let step2 = (shortestArrayLength * sum_x2) - (sum_x * sum_x);
//     let step3 = (shortestArrayLength * sum_y2) - (sum_y * sum_y);
//     let step4 = Math.sqrt(step2 * step3);
//     return step1 / step4;
// }

export function selectTextFromDivAndCopy(containerId) {
    const node = document.getElementById(containerId);
    const docRange = document.createRange();
    docRange.selectNodeContents(node);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(docRange);
    document.execCommand("copy");
}

export function getAngles(x,references){
    const startAngle = references.genomicTheta(x.chromosomeIndex,x.startPos);
    const endAngle = references.genomicTheta(x.chromosomeIndex,x.endPos);
    return [startAngle,endAngle];
}
export function linspace(startValue, stopValue, steps) {
    let arr = [];
    const currValue = startValue;
    const step = (stopValue - startValue) / (steps - 1);
    for (let i = 0; i < steps; ++i) {
        arr.push(currValue + (step * i));
    }
    return arr;
}
export function rainbow(numOfSteps, step) {
    // https://stackoverflow.com/a/7419630
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    let r, g, b;
    const h = step / numOfSteps;
    const i = ~~(h * 6);
    const f = h * 6 - i;
    const q = 1 - f;
    switch(i % 6){
        case 0: r = 1; g = f; b = 0; break;
        case 1: r = q; g = 1; b = 0; break;
        case 2: r = 0; g = 1; b = f; break;
        case 3: r = 0; g = q; b = 1; break;
        case 4: r = f; g = 0; b = 1; break;
        case 5: r = 1; g = 0; b = q; break;
    }
    const c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
    return (c);
}

export function currentTime(){
    const today = new Date();
    return today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
}

export function generalizedSliderEvents(sliderId,valLabelAdjustmentFunc,labelText,finalFunc) {
    $(`#${sliderId}`).slider()
        .off("change").on("change", function() {
            $(`#${sliderId}Label`).html(`${labelText} ${valLabelAdjustmentFunc(+$(this).val())}`);
        })
        .off("slideStop")
        .on("slideStop",function(){
            setTimeout(()=>{finalFunc(+$(this).val());},0);
        });
}

// export function arrayClone(arr) {
//     if(Array.isArray(arr)) {
//         let copy = arr.slice( 0 );
//         for(let  i = 0; i < copy.length; i++ ) {
//             copy[i] = arrayClone(copy[i]);
//         }
//         return copy;
//     } else if( typeof arr === 'object' ) {
//         throw 'Cannot clone array containing an object!';
//     } else {
//         return arr;
//     }
// }
