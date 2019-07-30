import {CytobandEntry} from "./CytobandEntry";
import {ChromosomeEntry} from "./ChromosomeEntry";
import {ChromosomeArmEntry} from "./ChromosomeArmEntry";
import {VariantVizTypeEntry} from "./VariantVizTypeEntry";
import {TadEntry} from "./TadEntry";
import {RppaAntibodyEntry} from "./RppaAntibodyEntry";
import {GeneEntry} from "./GeneEntry";
import {GeneTypeEntry} from "./GeneTypeEntry";
import {queue as d3Xqueue} from 'd3-queue';
import {padENSG} from "../Utils";
import 'awesomplete';
import 'awesomplete/awesomplete.css';
import {FragileSiteEntry} from "./FragileSiteEntry";
import {ReactomeEntry} from "./ReactomeEntry";
import {VariantTypeEntry} from "./VariantTypeEntry";

export class References {
    constructor(){
        this.baseUrl = window.location.protocol + "//" + window.location.host + "/" + window.location.pathname.split('/')[1];
        this.genes=new Map();
        this.geneBatchInfo=new Map();
        this.reactomePathways=new Map();
        this.tads=[];
        this.cytobands=[];
        this.chromosomes=[];
        this.chromosomeArms=[];
        this.fragileSites=[];
        this.cumulativeSizesWithGapsCytobands=[];
        this.totalGenomeSizeWithGapsCytobands=0;
        this.geneTypes=[];
        this.variantTypes=[];
        this.variantVizTypes=[];
        this.colours=[];
        this.comparisonTypes=[];
        this.comparisonTypesReverse=new Map();
        this.rppaAntibodies=[];
        this.currentCohort=null;
        this.chrosomeArmInputAwesomplete = new Awesomplete(document.getElementById("chromosomeArmSelector"));
        this.cytobandInputAwesomplete = new Awesomplete(document.getElementById("cytobandSelector"));
        this.geneInputAwesomplete = new Awesomplete(document.getElementById("geneSelector"));
        this.rppaInputAwesomplete = new Awesomplete(document.getElementById("antibodySelector"));
        // this.reactomeInputAwesomplete = new Awesomplete(document.getElementById("reactomeSelector"));
        this.rppaInputAwesompleteCurrentRppa=-1;
        this.chromosomeArmInputAwesompleteCurrentChromosomeArm=-1;
        this.cytobandInputAwesompleteCurrentCytoband=-1;
        this.geneInputAwesompleteCurrentGene=-1;
        this.offsetRadians=0;
        let q = d3Xqueue();
        q.defer((callback)=>{this.fetchChromosomeData(callback);});
        q.defer((callback)=>{this.fetchChromosomeArmData(callback);});
        q.defer((callback)=>{this.fetchFragileSiteData(callback);});
        q.defer((callback)=>{this.fetchReactomePathwayData(callback);});
        q.defer((callback)=>{this.fetchColourData(callback);});
        q.defer((callback)=>{this.fetchComparisonTypeData(callback);});
        q.defer((callback)=>{this.fetchCytobandData(callback);});
        q.defer((callback)=>{this.fetchGeneData(callback);});
        q.defer((callback)=>{this.fetchGeneTypeData(callback);});
        q.defer((callback)=>{this.fetchRppaAntibodyData(callback);});
        q.defer((callback)=>{this.fetchTadData(callback);});
        q.defer((callback)=>{this.fetchVariantTypeData(callback);});
        q.defer((callback)=>{this.fetchVariantVizTypeData(callback);});
        q.awaitAll(()=>{
            $("#cohortTitle").html("<p>&darr; Select Cohort &darr;</p>");
            $("#cohortSelectorGroup").css("display","inline");
        });
        this.superVdjTargets=new Set([
            136997,
            137265,
            110092,
            109685,
            113916,
            180953,
            171791,
            166407,
            135363,
            162367,
            187621,
            100721,
            213231,
            182512,
            120217,
            134323,
            188428]);
        this.knownVdjTargetMapping = new Map([
            [225559,182158],
            [223727,113851],
            [246363,139318],
            [165805,198707],
            [133641,198707],
            [197872,134323],
            [128563,161036],
            [212993,136997],
            [253573,136997],
            [249859,136997],
            [249375,136997],
            [250400,136997],
            [112685,137265],
            [112679,137265],
            [172927,110092],
            [162341,110092],
            [149716,110092],
            [259854,110092],
            [284713,110092],
            [168924,109685],
            [156853,156860],
            [145012,113916],
            [196683,136244],
            [217372,112029],
            [230773,138081],
            [213132,113916],
            [234238,113916],
            [223401,113916],
            [224187,113916],
            [236864,113916],
            [256433,139193],
            [136197,106588],
            [81913,171791],
            [204717,172005],
            [135837,143322],
            [182831,183454],
            [215946,101152],
            [216141,101152],
            [216195,101152],
            [166405,166407],
            [214265,114062],
        ]);
    }
    assessCurrentCumulativeSizes(){
        this.totalGenomeSizeWithGapsCytobands=0;
        this.cytobands.forEach((x)=>{
            this.totalGenomeSizeWithGapsCytobands+=x.getFullSize();
            this.cumulativeSizesWithGapsCytobands[x.cytobandIndex]=this.totalGenomeSizeWithGapsCytobands;
        });
    }
    fetchCytobandData(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: "references",
                suffix: "refCytobands",
                columnsToSelect: "*",
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                let awesompleteDump=[];
                data.forEach((x)=>{
                    let tmpCytoband=new CytobandEntry(x);
                    thisRef.cytobands[tmpCytoband.cytobandIndex]=tmpCytoband;
                    if(tmpCytoband.chromosomeIndex>0){
                        awesompleteDump.push({label: `${tmpCytoband.cytobandName} | ${tmpCytoband.getIndex()}`, value:tmpCytoband.cytobandIndex})
                    }
                });
                awesompleteDump.sort();
                thisRef.cytobandInputAwesomplete.list = awesompleteDump;
                thisRef.cytobandInputAwesomplete.maxItems = 20;
                thisRef.cytobandInputAwesomplete.filter = Awesomplete.FILTER_STARTSWITH;
                thisRef.assessCurrentCumulativeSizes();
                callback(null,null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    fetchChromosomeData(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: "references",
                suffix: "refChromosomes",
                columnsToSelect: "*",
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                data.forEach((x)=>{
                    let tmpChromosome=new ChromosomeEntry(x);
                    thisRef.chromosomes[tmpChromosome.chromosomeIndex]=tmpChromosome;
                });
                callback(null,null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    fetchChromosomeArmData(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: "references",
                suffix: "refChromosomeArms",
                columnsToSelect: "*",
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                let awesompleteDump=[];
                data.forEach((x)=>{
                    let tmpChromosomeArm=new ChromosomeArmEntry(x);
                    thisRef.chromosomeArms[tmpChromosomeArm.chromosomeArmIndex]=tmpChromosomeArm;
                    if(tmpChromosomeArm.chromosomeIndex>0&&tmpChromosomeArm.chromosomeIndex<25){
                        awesompleteDump.push({label: `${tmpChromosomeArm.chromosomeArmName} | ${tmpChromosomeArm.getIndex()}`, value:tmpChromosomeArm.chromosomeArmIndex})
                    }
                });
                awesompleteDump.sort();
                thisRef.chrosomeArmInputAwesomplete.list = awesompleteDump;
                thisRef.chrosomeArmInputAwesomplete.maxItems = 20;
                thisRef.chrosomeArmInputAwesomplete.filter = Awesomplete.FILTER_STARTSWITH;
                for (let i = 47; i >=1; --i){
                    let pq=i%2===1?"p":"q";
                    let chrName=thisRef.chromosomeArms[i].chromosomeIndex;
                    $('#chromosomeArmSizeControls').prepend(`<div class="input-group"><label for="armcoeff${i}" class="col-form-label" id="armcoeff${i}Label">${chrName}${pq}: </label> <input type="number" id="armcoeff${i}" name="armcoeff${i}" data-provide="slider" data-slider-min="0" data-slider-max="27" data-slider-step="1" data-slider-value="7" data-slider-tooltip="hide" data-slider-orientation="horizontal"></div><br/>`);
                }
                callback(null,null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    fetchFragileSiteData(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: "references",
                suffix: "refFragileSites",
                columnsToSelect: "*",
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                data.forEach((x)=>{
                    let tmpFragileSite = new FragileSiteEntry(x);
                    thisRef.fragileSites[tmpFragileSite.fragileSiteIndex]=tmpFragileSite;
                });
                callback(null,null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    fetchReactomePathwayData(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: "references",
                suffix: "refReactomePathways",
                columnsToSelect: "*",
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                data.forEach((x)=>{
                    let tmpReactomePathway = new ReactomeEntry(x);
                    thisRef.reactomePathways.set(tmpReactomePathway.reactomePathwayId,tmpReactomePathway);
                });
                callback(null,null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    fetchVariantVizTypeData(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: "references",
                suffix: "refVariantVizTypes",
                columnsToSelect: "*",
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                data.forEach((x)=>{
                    let tmpVariantVizTypeEntry = new VariantVizTypeEntry(x);
                    thisRef.variantVizTypes[tmpVariantVizTypeEntry.variantVizTypeIndex]=tmpVariantVizTypeEntry;
                });
                callback(null,null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    fetchVariantTypeData(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: "references",
                suffix: "refVariantTypes",
                columnsToSelect: "*",
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                data.forEach((x)=>{
                    thisRef.variantTypes[x.variantTypeIndex]=new VariantTypeEntry(x);
                });
                callback(null,null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    fetchTadData(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: "references",
                suffix: "refTads",
                columnsToSelect: "*",
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                data.forEach((x)=>{
                    let tmpTadEntry=new TadEntry(x);
                    thisRef.tads[tmpTadEntry.tadIndex]=tmpTadEntry;
                });
                callback(null,null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    fetchGeneData(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: "references",
                suffix: "refGenes",
                columnsToSelect: "*",
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                let awesompleteDump=[];
                data.forEach((x)=>{
                    let tmpGene=new GeneEntry(x);
                    let batch=tmpGene.batch;
                    if(!thisRef.geneBatchInfo.has(batch)){
                        thisRef.geneBatchInfo.set(batch,[]);
                    }
                    thisRef.geneBatchInfo.get(batch).push(tmpGene.geneId);
                    thisRef.genes.set(tmpGene.geneId,tmpGene);
                    awesompleteDump.push({label:`${tmpGene.geneName} | ${padENSG(tmpGene.geneId)}`,value:tmpGene.geneId})
                });
                awesompleteDump.sort();
                thisRef.geneInputAwesomplete.list = awesompleteDump;
                thisRef.geneInputAwesomplete.maxItems = 80;
                thisRef.geneInputAwesomplete.filter = Awesomplete.FILTER_STARTSWITH;
                callback(null,null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    fetchRppaAntibodyData(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: "references",
                suffix: "refRppaAntibodies",
                columnsToSelect: "*",
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                let awesompleteDump=[];
                data.forEach((x)=>{
                    let tmpRppaAntibodyEntry=new RppaAntibodyEntry(x);
                    thisRef.rppaAntibodies[tmpRppaAntibodyEntry.rppaId]=tmpRppaAntibodyEntry;
                    awesompleteDump.push({label:`${tmpRppaAntibodyEntry.rppaName}`,value:tmpRppaAntibodyEntry.rppaId})
                });
                awesompleteDump.sort();
                thisRef.rppaInputAwesomplete.list = awesompleteDump;
                thisRef.rppaInputAwesomplete.maxItems = 80;
                thisRef.rppaInputAwesomplete.filter = Awesomplete.FILTER_STARTSWITH;
                callback(null,null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    fetchGeneTypeData(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: "references",
                suffix: "refGeneTypes",
                columnsToSelect: "*",
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                data.forEach((x)=>{
                    let tmpGeneTypeEntry = new GeneTypeEntry(x);
                    thisRef.geneTypes[tmpGeneTypeEntry.geneTypeIndex]=tmpGeneTypeEntry;
                });
                callback(null,null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    fetchColourData(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: "references",
                suffix: "refColours",
                columnsToSelect: "*",
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                data.forEach((x)=>{
                    thisRef.colours[x.colourIndex]=x.colour;
                });
                callback(null,null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    fetchComparisonTypeData(callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: "references",
                suffix: "refComparisonTypes",
                columnsToSelect: "*",
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                data.forEach((x)=>{
                    thisRef.comparisonTypes[parseInt(x.comparisonTypeIndex)]=x.comparisonType;
                    thisRef.comparisonTypesReverse.set(x.comparisonType,parseInt(x.comparisonTypeIndex));
                });
                callback(null,null);
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    registerCohort(newCohort){
        this.currentCohort=newCohort;
    }
    resetCohortContributions(){
        this.currentCohort=null;
        this.offsetRadians=0;
        this.chromosomeArms.forEach((c)=>{
            c.resetCohortContributions();
        });
        this.tads.forEach((t)=>{
            t.resetCohortContributions();
        });
        this.cytobands.forEach((c)=>{
            c.resetCohortContributions();
        });
        Array.from(this.genes.keys()).forEach((g)=>{
            this.genes.get(g).resetCohortContributions();
        })
    }
    emitCytobandClick(cytobandIndex){
        this.currentCohort.selectCytoband(cytobandIndex);
    }
    emitTadClick(tadIndex,tadVariantClass){
        this.currentCohort.selectTad(tadIndex,tadVariantClass);
    }
    emitGeneClick(geneId,allowedMutTypes){
        this.currentCohort.selectGeneRecurrence(geneId,allowedMutTypes);
    }
    emitGeneLabel(geneId){
        this.currentCohort.wheelManager.addGeneLabel(geneId);
    }
    genomicTheta(chrIndex, position){
        if(chrIndex===0){
            return 0.5 * Math.PI;
        }
        let i = this.chromosomes[chrIndex].firstCytobandIndex;
        while(position>this.cytobands[i].endPos){
            i+=1;
        }
        const elapsedSize = this.cumulativeSizesWithGapsCytobands[i-1] + this.cytobands[i].coefficient * (position-this.cytobands[i].startPos);
        return (0.5 + (elapsedSize / this.totalGenomeSizeWithGapsCytobands) * 2) * Math.PI + this.offsetRadians;
    }
    mapKnownVdjTargets(vdjTargets){
        if(vdjTargets===undefined){
            return [];
        }
        let mappedVdjTargets=new Set();
        for (let i = 0; i < vdjTargets.length; ++i) {
            let vdjTarget=vdjTargets[i];
            if(this.superVdjTargets.has(vdjTarget)){
                return [vdjTarget];
            }
            if(this.knownVdjTargetMapping.has(vdjTarget)){
                mappedVdjTargets.add(this.knownVdjTargetMapping.get(vdjTarget));
            }else{
                mappedVdjTargets.add(vdjTarget);
            }
        }
        return Array.from(mappedVdjTargets);
    }
    tracerMultiCleanup(){
        this.currentCohort.vizManager.tracerCleanup();
    }
}