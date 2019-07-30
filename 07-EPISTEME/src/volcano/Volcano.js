import {
    scaleLinear as d3XscaleLinear,
    axisBottom as d3XaxisBottom,
    axisLeft as d3XaxisLeft,
    path as d3Xpath,
    select as d3Xselect,
    event as d3Xevent,
    drag as d3Xdrag,
    symbol as d3Xsymbol,
    symbols as d3Xsymbols,
    mouse as d3Xmouse,
} from "d3";
import {queue as d3Xqueue} from "d3-queue";
import {VolcanoEntry} from "./VolcanoEntry";
import {switchElements, saveSvg, getTestFullName, selectTextFromDivAndCopy, generalizedSliderEvents} from "../Utils";
import {SinglePhenotypeExpression} from "../singlePhenotypeExpression/SinglePhenotypeExpression";
import {meanFc, pearsonCorrelation, spearmanCorrelation, trimeanFc} from "./VolcanoStats";
import {StatsTests} from "../statsTests/StatsTests";
import {GeneEntry} from "../references/GeneEntry";
import {SingleDonorVariantContribution} from "../singlePhenotypeExpression/SingleDonorVariantContribution";
import {VariantRecurrenceEntryGene} from "../variantRecurrenceEntries/VariantRecurrenceEntryGene";
import {VolcanoMutexEntry} from "./VolcanoMutexEntry";
let venn=require('venn.js/venn');

export class Volcano {
    constructor(commonSettings,references,cohortMetadata,selectionManager,volcanoPhenotype,volcanoTypePrefix,fontManager,textExportManager){
        this.commonSettings=commonSettings;
        this.selectionManager=selectionManager;
        this.references=references;
        this.cohortMetadata=cohortMetadata;
        this.volcanoPhenotype=volcanoPhenotype;
        this.mutexMode=this.volcanoPhenotype==="Mutex";
        if(this.mutexMode){
            this.truePhenotype="gene"
        }else{
            this.truePhenotype=this.volcanoPhenotype.replace('Expression','');
            this.truePhenotype=this.truePhenotype.replace(this.truePhenotype[0], this.truePhenotype[0].toLowerCase());
        }
        this.volcanoTypePrefix=volcanoTypePrefix;
        this.correlationMode=this.volcanoTypePrefix==="correlation";
        this.fontManager=fontManager;
        this.textExportManager=textExportManager;
        this.volcanoId=`${this.volcanoTypePrefix}${this.volcanoPhenotype}Volcano`;
        this.volcanoSVG=null;
        this.addHtml();
        this.currentSubcohortIndex=0;
        this.tmpExpressions=new Map();
        this.anchorGeneId=null;
        this.anchorExpressions=[];
        this.displaySettings={
            maxX:0,
            maxXForced:0,
            minY:1e10,
            maxY:0,
            maxYForced:0,
            modifiedVolcanoAxisX:false,
            modifiedVolcanoAxisY:false,
            markedVolcanoItems:new Set(),
            hiddenVolcanoItems:new Set(),
            lastVolcanoItemIndex:-1,
            volcanoVbox:null,
            minDonors:0,
        };
        this.displayAndControlElements={
            VolcanoPatientLimit:this.volcanoId+"PatientLimit",
            VolcanoCircleClass:this.volcanoId+"CircleClass",
            VolcanoRadius:this.volcanoId+"Radius",
            VolcanoFrame:this.volcanoId+"Frame",
            VolcanoTitle:this.volcanoId+"Title",
            VolcanoTitleFrame:this.volcanoId+"TitleFrame",
            VolcanoContent:this.volcanoId+"Content",
            VolcanoSvg:this.volcanoId+"Svg",
            VolcanoGeneMarkerClass:this.volcanoId+"GeneMarkerClass",
            VolcanoGeneMarkerHelperClass:this.volcanoId+"GeneMarkerHelperClass",
            VolcanoXRadioButton:this.volcanoId+"XRadioButton",
            VolcanoXRadioButtonAlt1:this.volcanoId+"XRadioButtonAlt1",
            VolcanoXRadioButtonAlt2:this.volcanoId+"XRadioButtonAlt2",
            VolcanoYRadioButton:this.volcanoId+"YRadioButton",
            VolcanoYRadioButtonAlt1:this.volcanoId+"YRadioButtonAlt1",
            VolcanoYRadioButtonAlt2:this.volcanoId+"YRadioButtonAlt2",
            VolcanoYRadioButtonAlt3:this.volcanoId+"YRadioButtonAlt3",
            VolcanoYRadioButtonAlt4:this.volcanoId+"YRadioButtonAlt4",
            VolcanoClearMarkedGenes:this.volcanoId+"ClearMarkedGenes",
            VolcanoResetAxis:this.volcanoId+"ResetAxis",
            VolcanoRecoverHiddenData:this.volcanoId+"RecoverHiddenData",
            VolcanoGoToGeneTad:this.volcanoId+"GoToGeneTad",
            VolcanoFoldChangeType:this.volcanoId+"FoldChangeType",
            VolcanoComparisonClassSelectionSubmit: this.volcanoId+"ComparisonClassSelectionSubmit",
            VolcanoIndices: this.volcanoId+"Indices",
        };
        this.volcanoTitle="";
        this.currentVolcanoIndex=-1;
        this.xFieldName="";
        this.yFieldName="";
        this.testName="";
        [this.xFieldName,this.yFieldName,this.testName]=this.setFieldNamesXY();
        this.currentComparisonClasses=[new Set(),new Set()];
        this.volcanoIndexToDataIndex=new Map();
        this.data=[];
        this.circleGroup=null;
        this.singleGeneExpression=null;
        this.singleRppaExpression=null;
        this.group1Index=0;
        this.group2Index=0;
        this.currentSubcohortIndex=0;
        this.currentSubcohortDonors=new Set();
        this.uniqueGroup1Donors=new Set();
        this.uniqueGroup2Donors=new Set();
        this.subcohort12commonDonors=new Set();
        this.rectStart={};
        this.rectEnd={};
        this.constructed=false;
        this.minMaxExpression=1;
        this.validDonorsForComparison=new Set();
        this.enableControls();
    }
    checkboxTemplateGenerator(key, longName, checked){
        return `
                <label class="custom-control custom-checkbox ${checked?"active":""}">
                    <input id="allow_${this.volcanoId}${key}" type="checkbox" class="custom-control-input" ${checked?"checked":""}>
                    <span class="custom-control-indicator"></span>
                    <span class="custom-control-description">${longName}</span>
                </label>`;
    }
    addHtml(){
        let htmlTemplateGeneTypesList=[];
        htmlTemplateGeneTypesList.push(`<div class="input-group panel panel-default" id="${this.volcanoId}GeneClassSelectionGroup">`);
        htmlTemplateGeneTypesList.push(this.checkboxTemplateGenerator("Coding","Coding",true));
        htmlTemplateGeneTypesList.push(this.checkboxTemplateGenerator("LincRNA","lincRNA",true));
        htmlTemplateGeneTypesList.push(this.checkboxTemplateGenerator("MiRNA","miRNA",true));
        htmlTemplateGeneTypesList.push(this.checkboxTemplateGenerator("Pseudo","Pseudo",false));
        htmlTemplateGeneTypesList.push(this.checkboxTemplateGenerator("IgtrGene","IG or T-Cell receptor Genes",false));
        htmlTemplateGeneTypesList.push(this.checkboxTemplateGenerator("IgtrPseudoGene","IG or T-Cell receptor PseudoGenes",false));
        htmlTemplateGeneTypesList.push(this.checkboxTemplateGenerator("Others","Others",false));
        htmlTemplateGeneTypesList.push("</div>");
        const htmlTemplateGeneTypes=htmlTemplateGeneTypesList.join('');
        const htmlTemplateRadii=`
            <div class="card card-block panel panel-default">
                <div class="input-group"><label for="${this.volcanoId}Radius" 
                    class="col-form-label"
                    id="${this.volcanoId}RadiusLabel">Gene Radius : 1 </label>
                    <input type="number"
                        id="${this.volcanoId}Radius"
                        name="${this.volcanoId}Radius"
                        data-provide="slider"
                        data-slider-min="0.5"
                        data-slider-max="10"
                        data-slider-step="0.5"
                        data-slider-value="1"
                        data-slider-tooltip="hide"
                        data-slider-orientation="horizontal">
                </div>
            </div>`;
        const htmlTemplate2Variant=`
            <div class="input-group"><label for="${this.volcanoId}PatientLimit"
                                            class="col-form-label"
                                            id="${this.volcanoId}PatientLimitLabel">Min #Patients in either group : 1 </label>
                <input type="number"
                       id="${this.volcanoId}PatientLimit"
                       name="${this.volcanoId}PatientLimit"
                       data-provide="slider"
                       data-slider-min="1"
                       data-slider-max="25"
                       data-slider-step="1"
                       data-slider-value="1"
                       data-slider-tooltip="hide"
                       data-slider-orientation="horizontal">
            </div>
            <div class="input-group panel panel-default" id="${this.volcanoId}ComparisonClassSelectionGroup">
                <button id="${this.volcanoId}ComparisonClassSelectionSubmit" type="button" class="btn btn-success">Launch Variant Analysis</button>
                <br>
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("DirectSv","Gene-body SV hits",true):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("Sv0","SVs 0-TadOffset",true):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("Sv1","SVs 1-TadOffset",true):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("Sv2","SVs 2-TadOffset",false):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("Sv3","SVs 3-TadOffset",false):""}
                <br>
                ${this.checkboxTemplateGenerator("Amp","cnAmplifications",true)}
                ${this.checkboxTemplateGenerator("Homdel","Homozygous Deletions",true)}
                <br>
                ${this.checkboxTemplateGenerator("CnvGain","Low-order cnGain",false)}
                ${this.checkboxTemplateGenerator("CnvLoss","Low-order cnLoss",false)}
                <br>
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("OffIndel0","Small-MidSized Indels 0-TadOffset",false):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("OffIndel1","Small-MidSized Indels 1-TadOffset",false):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("OffIndel2","Small-MidSized Indels 2-TadOffset",false):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("OffIndel3","Small-MidSized Indels 3-TadOffset",false):""}
                <br>
                ${this.checkboxTemplateGenerator("Splicing","Splicing Small Variants",false)}
                ${this.checkboxTemplateGenerator("FunctionalSmallVar","Functional Small Variants",false)}
                ${this.checkboxTemplateGenerator("Synonymous","Synonymous SNV",false)}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("Upstream","Upstream Small Variants",false):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("Downstream","Downstream Small Variants",false):""}
                ${this.checkboxTemplateGenerator("UTR5","5'UTR",false)}
                ${this.checkboxTemplateGenerator("UTR3","3'UTR",false)}
            </div>
            <br>
            <div class="row-fluid input-group panel panel-default">
                <div class="row-fluid input-group panel panel-default">
                    <p>Fold change</p> 
                    <input type="radio" id="${this.volcanoId}XRadioButtonAlt1" name="${this.volcanoId}XRadioButton" value="log2FcTrimean">
                    <label for="${this.volcanoId}XRadioButtonAlt1">Trimeans</label>
                    <input type="radio" id="${this.volcanoId}XRadioButtonAlt2" name="${this.volcanoId}XRadioButton" value="log2FcMean" checked>
                    <label for="${this.volcanoId}XRadioButtonAlt2">Means</label>
                </div>
                <br>
                <div class="row-fluid input-group panel panel-default">
                    <p>Statistical Significance</p>
                    <input type="radio" id="${this.volcanoId}YRadioButtonAlt1" name="${this.volcanoId}YRadioButton" value="Ks">
                    <label for="${this.volcanoId}YRadioButtonAlt1">Kolmogorov-Smirnov Test</label><br>
                    <input type="radio" id="${this.volcanoId}YRadioButtonAlt2" name="${this.volcanoId}YRadioButton" value="Kw" checked>
                    <label for="${this.volcanoId}YRadioButtonAlt2">Kruskal-Wallis Test</label><br>
                    <input type="radio" id="${this.volcanoId}YRadioButtonAlt3" name="${this.volcanoId}YRadioButton" value="T">
                    <label for="${this.volcanoId}YRadioButtonAlt3">T-test</label><br>
                    <input type="radio" id="${this.volcanoId}YRadioButtonAlt4" name="${this.volcanoId}YRadioButton" value="Jf">
                    <label for="${this.volcanoId}YRadioButtonAlt4">Fisher's Exact Test on Jenks-Optimized Breaks</label>
                </div>
            </div>`;
        const htmlTemplate2Mutex=`
            <div class="input-group panel panel-default" id="${this.volcanoId}VariantClassSelectionGroup">
                <button id="${this.volcanoId}MutexSubmit" type="button" class="btn btn-success" style="display: none;">Launch Mutex Analysis</button>
                <br>
                <p>Gene-Level (will be combined per gene with an OR relation)</p>
                ${this.checkboxTemplateGenerator("FunctionalSmallVar","Functional Small Variants",true)}
                ${this.checkboxTemplateGenerator("Amp","cnAmplifications",true)}
                ${this.checkboxTemplateGenerator("Homdel","Homozygous Deletions",true)}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("DirectSv","Gene-body SV hits",false):""} 
                ${this.checkboxTemplateGenerator("Synonymous","Synonymous SNV",false)}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("Upstream","Upstream Small Variants",false):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("Downstream","Downstream Small Variants",false):""}
                ${this.checkboxTemplateGenerator("UTR5","5'UTR",false)}
                ${this.checkboxTemplateGenerator("UTR3","3'UTR",false)}
                ${this.checkboxTemplateGenerator("DoubleHitAlt1","DoubleHit (CNV/LOH+Functional SmallVar)",false)}
                ${this.checkboxTemplateGenerator("DoubleHitAlt2","DoubleHit (CNV/LOH+Functional SmallVar/Direct SV)",false)}
                ${this.checkboxTemplateGenerator("DoubleHitAlt3","DoubleHit (SmallVar+Direct SV)",false)}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("FusionCorrect","GeneFusion (correct orientation)",false):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("FusionIncorrect","GeneFusion (incorrect orientation)",false):""}
                <br>
                ${!this.commonSettings.wesMode ? "<p>TAD-Level</p>" :""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("Sv0","SVs 0-TadOffset",true):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("Sv1","SVs 1-TadOffset",true):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("Sv2","SVs 2-TadOffset",false):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("Sv3","SVs 3-TadOffset",false):""}
                ${!this.commonSettings.wesMode ? "<br>":""}
                <p>Cytoband-Level</p>
                ${this.checkboxTemplateGenerator("GainCyto","CN Gain",true)}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("LOHLossCyto","CN Loss or LOH",true):""}
                ${this.checkboxTemplateGenerator("LossCyto","CN Loss",false)}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("LOHCyto","LOH",false):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("cnnLOHCyto","Copy-Neutral LOH",false):""}
                <br>
                <p>Chromosome Arm-Level</p>
                ${this.checkboxTemplateGenerator("GainArm","CN Gain",true)}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("LOHLossArm","CN Loss or LOH",true):""}          
                ${this.checkboxTemplateGenerator("LossArm","CN Loss",false)}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("LOHArm","LOH",false):""}
                ${!this.commonSettings.wesMode ? this.checkboxTemplateGenerator("cnnLOHArm","Copy-Neutral LOH",false):""}
                <br>
            </div>
            <div class="row-fluid" id="${this.volcanoId}SubcohortSelectorGroup1">
                    <div class="col-md-12" style="background-color: #ffe6e6">
                        <select class="form-control" title="${this.volcanoId}SubcohortSelection1" id="${this.volcanoId}SubcohortSelector1">
                        </select>
                    </div>
                </div>
                <br>
                <div class="row-fluid" id="${this.volcanoId}SubcohortSelectorGroup2">
                    <div class="col-md-12" style="background-color: #cce6ff">
                        <select class="form-control" title="${this.volcanoId}SubcohortSelection2" id="${this.volcanoId}SubcohortSelector2">
                        </select>
                    </div>
                </div>
                <br>
            </div>`;
        const htmlTemplate2Correlation=`
            <div class="input-group">
                <p>Select Gene from 'Operations on Genes, Cytobands and RPPA Antibodies' for Correlation Analysis or a numerical metadata column from below</p>
                <button id="${this.volcanoId}MetadataColumnSelectionSubmit" type="button" class="btn btn-success" style="display: none;">Launch Correlation Analysis from Metadata Entry</button>
                <div class="row-fluid">
                    <div class="col-md-12">
                        <select class="form-control" title="${this.volcanoId}MetadataColumnSelection" id="${this.volcanoId}MetadataColumnSelector">
                        </select>
                    </div>
                </div>
                <br>
                <br>
                <div class="row-fluid">
                    <div class="col-md-12">
                        <select class="form-control" title="${this.volcanoId}SubcohortSelection1" id="${this.volcanoId}SubcohortSelector1">
                        </select>
                    </div>
                </div>
                <br>
                <div class="row-fluid input-group panel panel-default">
                    <p>X-Axis</p>
                    <input type="radio" id="${this.volcanoId}XRadioButtonAlt1" name="${this.volcanoId}XRadioButton" value="pearson" checked>
                    <label for="${this.volcanoId}XRadioButtonAlt1">Pearson Correlation</label>
                    <input type="radio" id="${this.volcanoId}XRadioButtonAlt2" name="${this.volcanoId}XRadioButton" value="spearman">
                    <label for="${this.volcanoId}XRadioButtonAlt2">Spearman Correlation</label>
                </div>
                <div class="card card-block panel panel-default">
                    <div class="input-group"><label for="${this.volcanoId}MinMaxExpression" 
                        class="col-form-label"
                        id="${this.volcanoId}MinMaxExpressionLabel">Min. Displayed Max. Expression : 1 </label>
                        <input type="number"
                            id="${this.volcanoId}MinMaxExpression"
                            name="${this.volcanoId}MinMaxExpression"
                            data-provide="slider"
                            data-slider-min="1"
                            data-slider-max="20"
                            data-slider-step="0.1"
                            data-slider-value="1"
                            data-slider-tooltip="hide"
                            data-slider-orientation="horizontal">
                    </div>
                </div>
            </div>`;

        const htmlTemplate2Subcohort=`
            <div class="input-group">
                <button id="${this.volcanoId}SubcohortSelectionSubmit" type="button" class="btn btn-success" style="display: none;">Launch Subcohort Analysis</button>
                <br>
                <div class="row-fluid" id="${this.volcanoId}SubcohortSelectorGroup1">
                    <div class="col-md-12" style="background-color: #ffe6e6">
                        <select class="form-control" title="${this.volcanoId}SubcohortSelection1" id="${this.volcanoId}SubcohortSelector1">
                        </select>
                    </div>
                </div>
                <br>
                <div class="row-fluid" id="${this.volcanoId}SubcohortSelectorGroup2">
                    <div class="col-md-12" style="background-color: #cce6ff">
                        <select class="form-control" title="${this.volcanoId}SubcohortSelection2" id="${this.volcanoId}SubcohortSelector2">
                        </select>
                    </div>
                </div>
                <br> 
                <div class="row-fluid input-group panel panel-default">
                    <p>Fold change</p>
                    <input type="radio" id="${this.volcanoId}XRadioButtonAlt1" name="${this.volcanoId}XRadioButton" value="log2FcTrimean">
                    <label for="${this.volcanoId}XRadioButtonAlt1">Trimeans</label>
                    <input type="radio" id="${this.volcanoId}XRadioButtonAlt2" name="${this.volcanoId}XRadioButton" value="log2FcMean" checked>
                    <label for="${this.volcanoId}XRadioButtonAlt2">Means</label>
                </div>
                <br>
                <div class="row-fluid input-group panel panel-default">
                    <p>Statistical Significance</p>
                    <input type="radio" id="${this.volcanoId}YRadioButtonAlt1" name="${this.volcanoId}YRadioButton" value="Ks">
                    <label for="${this.volcanoId}YRadioButtonAlt1">Kolmogorov-Smirnov Test</label>
                    <a href="https://github.com/pieterprovoost/jerzy" target="_blank">Github</a>
                    <br>
                    <input type="radio" id="${this.volcanoId}YRadioButtonAlt2" name="${this.volcanoId}YRadioButton" value="Kw" checked>
                    <label for="${this.volcanoId}YRadioButtonAlt2">Kruskal-Wallis Test</label><br>
                    <input type="radio" id="${this.volcanoId}YRadioButtonAlt3" name="${this.volcanoId}YRadioButton" value="T">
                    <label for="${this.volcanoId}YRadioButtonAlt3">T-test</label>
                    <a href="https://github.com/pieterprovoost/jerzy" target="_blank">Github</a>
                </div>
            </div>`;

        let htmlTemplate2="";
        if(this.volcanoTypePrefix==="variant"){
            htmlTemplate2=htmlTemplate2Variant;
        }else if(this.volcanoTypePrefix==="subcohort"){
            if(this.volcanoPhenotype==="Mutex"){
                htmlTemplate2=htmlTemplate2Mutex;
            }else{
                htmlTemplate2=htmlTemplate2Subcohort;
            }
        }else if(this.volcanoTypePrefix==="correlation"){
            htmlTemplate2=htmlTemplate2Correlation;
        }
        const htmlTemplate3=
            `<div class="row-fluid" id="${this.volcanoId}ProgressBarGroup" style="display:none">
                <div class="progress">
                    <div class="progress-bar" role="progressbar" id="${this.volcanoId}ProgressBar" 
                        aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0%">
                    </div>
                </div>
            </div>
            <button id="${this.volcanoId}RecoverHiddenData" type="button" class="btn btn-secondary btn" style="display:none">Recover Hidden Data Points</button>
            <button id="${this.volcanoId}ResetAxis" type="button" class="btn btn-secondary btn" style="display:none">Reset Axis</button>`;
        const htmlTemplateMarkedGenes=
            `<div class="row-fluid" id="${this.volcanoId}MarkedEntriesListGroup" style="display:none">
                <p>
                    <a class="btn btn-primary" data-toggle="collapse" href="#${this.volcanoId}MarkedEntriesListCollapse" aria-expanded="false" aria-controls="${this.volcanoId}MarkedEntriesListCollapse" id="${this.volcanoId}MarkedEntriesListCollapseControl">
                        Marked Entries
                    </a>
                </p>
                <div class="collapse" id="${this.volcanoId}MarkedEntriesListCollapse">
                    <button id="${this.volcanoId}LaunchConsensusPathDb" type="button" class="btn btn-secondary btn">ConsensusPathDB</button>
                    <button id="${this.volcanoId}LaunchGsea" type="button" class="btn btn-secondary btn">GSEA/MSigDB</button>
                    <button id="${this.volcanoId}LaunchReactome" type="button" class="btn btn-secondary btn">REACTOME</button>
                    <button id="${this.volcanoId}LaunchDavid" type="button" class="btn btn-secondary btn">DAVID</button>
                    <div id="${this.volcanoId}MarkedEntriesList">
                    </div>                            
                </div>
            </div>`;

        const htmlTemplateOpener=`<div class="input-group" id="${this.volcanoId}Controls" style="display: none"></div>`;
        $('#volcanoControls').append(htmlTemplateOpener);
        const currentControlsHandle=$(`#${this.volcanoId}Controls`);
        if(this.volcanoPhenotype!=="Mutex"){
            currentControlsHandle
                .append(htmlTemplateGeneTypes);
        }
        currentControlsHandle
            .append(htmlTemplateRadii)
            .append("<br>")
            .append(htmlTemplate3)
            .append("<br>")
            .append(htmlTemplate2)
            .append("<br>")
            .append(htmlTemplateMarkedGenes);
    }

    enableControls(){
        let thisRef = this;
        generalizedSliderEvents(
            this.displayAndControlElements.VolcanoRadius,
            (x)=>{return x},
            "Gene Radius :",
            (x)=>{
                this.adjustRadius(x*12);
            });
        ["Coding","LincRNA","MiRNA","Pseudo","IgtrGene","IgtrPseudoGene","Others"].forEach((t)=>{
            $(`#allow_${this.volcanoId}${t}`).off("change").on('change', ()=>{
                setTimeout(()=>{thisRef.adjustVisibility();},0);
            });
        });
        $(`#${this.displayAndControlElements.VolcanoResetAxis}`).off("click").on("click", ()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            thisRef.resetAxis();
            setTimeout(()=>{thisRef.plotVolcano();},0);
            this.commonSettings.releaseLock();
        });
        $(`#${this.volcanoId}RecoverHiddenData`).off("click").on("click", ()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.lock();
            thisRef.displaySettings.hiddenVolcanoItems.clear();
            $(`#${this.volcanoId}RecoverHiddenData`).css("display","none");
            setTimeout(()=>{thisRef.adjustVisibility();},0);
        });

        $(`input[name=${this.displayAndControlElements.VolcanoXRadioButton}]`).change(()=> {
            [this.xFieldName,this.yFieldName,this.testName]=this.setFieldNamesXY();
            if(this.constructed){
                setTimeout(()=>{
                    this.updateMaximums();
                    this.plotVolcano();
                },0);
            }
        });
        $(`input[name=${this.displayAndControlElements.VolcanoYRadioButton}]`).change(()=> {
            [this.xFieldName,this.yFieldName,this.testName]=this.setFieldNamesXY();
            if(this.constructed){
                if(this.volcanoTypePrefix==="variant"){
                    setTimeout(()=>{this.launchVariantAnalysis();},0);
                }else if(this.volcanoTypePrefix==="subcohort"){
                    setTimeout(()=>{this.launchSubcohortAnalysis();},0);
                }else if(this.volcanoTypePrefix==="correlation"){
                    setTimeout(()=>{
                        this.updateMaximums();
                        this.plotVolcano();
                    },0);
                }
            }
        });
        if(this.volcanoTypePrefix==="variant"){
            if(!this.commonSettings.wesMode){
                const varTypes=["Sv","OffIndel"];
                for(let k=0;k<varTypes.length;++k){
                    const varType=varTypes[k];
                    for(let i=1;i<4;++i){
                        $(`#allow_${this.volcanoId}${varType}${i}`).on('change.bootstrapSwitch', function(e) {
                            if($(`#allow_${thisRef.volcanoId}${varType}${i}`).is(':checked')){
                                for(let j=0;j<i;++j){
                                    let currentHandle=$(`#allow_${thisRef.volcanoId}${varType}${j}`);
                                    if(!currentHandle.is(':checked')){
                                        currentHandle.prop('checked', true).parent().addClass('active');
                                    }
                                }
                                if(k===0){
                                    let currentHandle=$(`#allow_${thisRef.volcanoId}DirectSv`);
                                    if(!currentHandle.is(':checked')){
                                        currentHandle.prop('checked', true).parent().addClass('active');
                                    }
                                }
                            }
                        });
                    }
                    for(let i=0;i<3;++i){
                        $(`#allow_${this.volcanoId}${varType}${i}`).on('change.bootstrapSwitch', function(e) {
                            if(!$(`#allow_${thisRef.volcanoId}${varType}${i}`).is(':checked')){
                                for(let j=i;j<4;++j){
                                    let currentHandle=$(`#allow_${thisRef.volcanoId}${varType}${j}`);
                                    if(currentHandle.is(':checked')){
                                        currentHandle.prop('checked', false).parent().removeClass('active');
                                    }
                                }
                            }
                        });
                    }
                    if(k===0){
                        $(`#allow_${this.volcanoId}DirectSv`).on('change.bootstrapSwitch', function(e) {
                            if(!$(`#allow_${thisRef.volcanoId}DirectSv`).is(':checked')){
                                for(let j=0;j<4;++j){
                                    let currentHandle=$(`#allow_${thisRef.volcanoId}${varType}${j}`);
                                    if(currentHandle.is(':checked')){
                                        currentHandle.prop('checked', false).parent().removeClass('active');
                                    }
                                }
                            }
                        });
                    }
                }
            }
            $(`#allow_${this.volcanoId}CnvGain`).on('change.bootstrapSwitch', function(e) {
                if($(`#allow_${thisRef.volcanoId}CnvGain`).is(':checked')){
                    const currentHandle=$(`#allow_${thisRef.volcanoId}Amp`);
                    if(!currentHandle.is(':checked')){
                        currentHandle.prop('checked', true).parent().addClass('active');
                    }
                }
            });
            $(`#allow_${this.volcanoId}CnvLoss`).on('change.bootstrapSwitch', function(e) {
                if($(`#allow_${thisRef.volcanoId}CnvLoss`).is(':checked')){
                    const currentHandle=$(`#allow_${thisRef.volcanoId}Homdel`);
                    if(!currentHandle.is(':checked')){
                        currentHandle.prop('checked', true).parent().addClass('active');
                    }
                }
            });

            generalizedSliderEvents(
                this.displayAndControlElements.VolcanoPatientLimit,
                (x)=>{return x},
                "Min #Patients in either group :",
                (x)=>{
                    this.displaySettings.minDonors=x;
                    this.adjustVisibility();
                });

            $(`#${this.displayAndControlElements.VolcanoComparisonClassSelectionSubmit}`).off("click").on("click", ()=>{
                if(this.commonSettings.interactionLock){
                    return;
                }
                this.commonSettings.lock();
                setTimeout(()=>{thisRef.launchVariantAnalysis();},0);
            });
        }
        $(`#${this.volcanoId}LaunchConsensusPathDb`).off("click").on("click", ()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            selectTextFromDivAndCopy(`${this.volcanoId}MarkedEntriesList`);
            window.open("http://cpdb.molgen.mpg.de/CPDB/fct_annot", '_blank');
            this.commonSettings.fastRelease();
        });
        $(`#${this.volcanoId}LaunchGsea`).off("click").on("click", ()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            selectTextFromDivAndCopy(`${this.volcanoId}MarkedEntriesList`);
            window.open("http://software.broadinstitute.org/gsea/msigdb/annotate.jsp", '_blank');
            this.commonSettings.fastRelease();
        });
        $(`#${this.volcanoId}LaunchReactome`).off("click").on("click", ()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            selectTextFromDivAndCopy(`${this.volcanoId}MarkedEntriesList`);
            window.open("https://reactome.org/PathwayBrowser/#TOOL=AT", '_blank');
            this.commonSettings.fastRelease();
        });
        $(`#${this.volcanoId}LaunchDavid`).off("click").on("click", ()=>{
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            selectTextFromDivAndCopy(`${this.volcanoId}MarkedEntriesList`);
            window.open("https://david.ncifcrf.gov/gene2gene.jsp", '_blank');
            this.commonSettings.fastRelease();
        });
        if(this.volcanoTypePrefix==="subcohort"){
            $(`#${this.volcanoId}SubcohortSelector1`).off('change').on('change',function () {
                const val1=parseInt(this.value);
                const val2=parseInt($(`#${thisRef.volcanoId}SubcohortSelector2`).val());
                if(val1===-1 || val1===val2){
                    $(`#${thisRef.volcanoId}VolcanoSubcohortSelectionSubmit`).css('display','none');
                    $(`#${thisRef.volcanoId}MutexSubmit`).css('display','none');
                }else{
                    if(val2!==-1){
                        $(`#${thisRef.volcanoId}SubcohortSelectionSubmit`).css('display','inline');
                        $(`#${thisRef.volcanoId}MutexSubmit`).css('display','inline');
                    }
                }
            });
            $(`#${this.volcanoId}SubcohortSelector2`).off('change').on('change',function () {
                const val1=parseInt($(`#${thisRef.volcanoId}SubcohortSelector1`).val());
                const val2=parseInt(this.value);
                if(val2===-1 || val1===val2){
                    $(`#${thisRef.volcanoId}VolcanoSubcohortSelectionSubmit`).css('display','none');
                    $(`#${thisRef.volcanoId}MutexSubmit`).css('display','none');
                }else{
                    if(val1!==-1){
                        $(`#${thisRef.volcanoId}SubcohortSelectionSubmit`).css('display','inline');
                        $(`#${thisRef.volcanoId}MutexSubmit`).css('display','inline');
                    }
                }
            });
            if(this.volcanoPhenotype==="Mutex"){
                for(let i=1;i<4;++i){
                    $(`#allow_${this.volcanoId}Sv${i}`).on('change.bootstrapSwitch', function(e) {
                        if($(`#allow_${thisRef.volcanoId}Sv${i}`).is(':checked')){
                            for(let j=0;j<i;++j){
                                const currentHandle=$(`#allow_${thisRef.volcanoId}Sv${j}`);
                                if(!currentHandle.is(':checked')){
                                    currentHandle.prop('checked', true).parent().addClass('active');
                                }
                            }
                        }
                    });
                }
                for(let i=0;i<3;++i){
                    $(`#allow_${this.volcanoId}Sv${i}`).on('change.bootstrapSwitch', function(e) {
                        if(!$(`#allow_${thisRef.volcanoId}Sv${i}`).is(':checked')){
                            for(let j=i;j<4;++j){
                                let currentHandle=$(`#allow_${thisRef.volcanoId}Sv${j}`);
                                if(currentHandle.is(':checked')){
                                    currentHandle.prop('checked', false).parent().removeClass('active');
                                }
                            }
                        }
                    });
                }
                $(`#${this.volcanoId}MutexSubmit`).off("click").on("click", ()=>{
                    if(this.commonSettings.interactionLock){
                        return;
                    }
                    this.commonSettings.lock();
                    setTimeout(()=>{thisRef.launchMutexAnalysis()},0);
                });
            }else{
                $(`#${this.volcanoId}SubcohortSelectionSubmit`).off("click").on("click", ()=>{
                    if(this.commonSettings.interactionLock){
                        return;
                    }
                    this.commonSettings.lock();
                    setTimeout(()=>{thisRef.launchSubcohortAnalysis()},0);
                });
            }
        }else if(this.volcanoTypePrefix==="correlation"){
            $(`#${this.volcanoId}MetadataColumnSelector`).off('change').on('change',function () {
                if(this.value==="-1"){
                    $(`#${thisRef.volcanoId}MetadataColumnSelectionSubmit`).css('display','none');
                }else{
                    const val2=parseInt($(`#${thisRef.volcanoId}SubcohortSelector1`).val());
                    if(val2===-1){
                        $(`#${thisRef.volcanoId}MetadataColumnSelectionSubmit`).css('display','none');
                    }else{
                        $(`#${thisRef.volcanoId}MetadataColumnSelectionSubmit`).css('display','inline');
                    }
                }
            });
            $(`#${this.volcanoId}SubcohortSelector1`).off('change').on('change',function () {
                if(this.value==="-1"){
                    $(`#${thisRef.volcanoId}MetadataColumnSelectionSubmit`).css('display','none');
                }else{
                    const val2=$(`#${thisRef.volcanoId}MetadataColumnSelector`).val();
                    if(val2==="-1"){
                        $(`#${thisRef.volcanoId}MetadataColumnSelectionSubmit`).css('display','none');
                    }else{
                        $(`#${thisRef.volcanoId}MetadataColumnSelectionSubmit`).css('display','inline');
                    }
                }
            });
            $(`#${this.volcanoId}MetadataColumnSelectionSubmit`).off("click").on("click", ()=>{
                if(this.commonSettings.interactionLock){
                    return;
                }
                this.commonSettings.fastLock();
                const columnName = $(`#${this.volcanoId}MetadataColumnSelector`).val().replace(/;/g, " ");
                setTimeout(()=>{this.launchCorrelationAnalysisFromMetadataColumn(columnName)},0);
            });
            generalizedSliderEvents(
                `${this.volcanoId}MinMaxExpression`,
                (x)=>{return x},
                "Min. Displayed Max. Expression :",
                (x)=>{
                    this.minMaxExpression=x;
                    this.adjustVisibility();
                });
        }

        let displayElements=[
            "volcanoControls",
            `${this.volcanoId}Controls`,
            "selectorControlsCollapseControl",
            "volcanoSpecificGeneSelectorControls",
            "geneSelectorMarkers",
            "cytobandSelectorMarkers",
            "gotoGeneVariants",
            "gotoCytoband",
            "geneSelectorControlsForMarkedGenesVolcanoSpecific",
            "volcanoSpecificCytobandSelectorControls",
            "cytobandSelectorMarkersOuter",
            "geneSelectorMarkersOuter",
            "svgDownloader",
        ];
        if(this.volcanoTypePrefix==="correlation"){
            displayElements.push("correlationVolcanoSpecificGeneSelectorControls");
        }
        $(`#${this.volcanoId}ContentPane`)
            .off('hide.bs.tab')
            .on('hide.bs.tab',()=>{
                switchElements(
                    displayElements,
                    []);
            })
            .off('hidden.bs.tab')
            .on('hidden.bs.tab',()=>{
                switchElements(
                    displayElements,
                    []);
            })
            .off('shown.bs.tab')
            .on('shown.bs.tab', ()=> {
                $('.nav-tabs a[href="#controlsPane"]').tab("show");
                switchElements(
                    [
                    ],
                    displayElements);
                if(this.displaySettings.markedVolcanoItems.size>0){
                    $('#geneSelectorControlsForMarkedGenes').css('display','inline');
                    if($('#cytobandSelector').val()!=""){
                        $('#clearMarkedGenesOnCytoband').css('display','inline');
                    }
                    $('#volcanoClearGene').css('display','inline');
                }
                if(this.volcanoTypePrefix==="subcohort"){
                    $(`#${this.volcanoId}SubcohortSelector1`).empty().append('<option value="-1" style="background-color: #ffe6e6">Select Subcohort 1</option>');
                    $(`#${this.volcanoId}SubcohortSelector2`).empty().append('<option value="-1" style="background-color: #cce6ff">Select Subcohort 2</option>');
                    const cohortFullSize=this.selectionManager.cohortFullDonors.size;
                    this.selectionManager.registeredSubcohortNames.forEach((subcohortName,subcohortIndex,map)=>{
                        const subcohortSize=this.selectionManager.registeredSubcohorts.get(subcohortIndex).size;
                        $(`#${this.volcanoId}SubcohortSelector1`).append(`<option value=${subcohortIndex} style="background-color: #ffe6e6">${subcohortName} (${subcohortSize}/${this.selectionManager.cohortFullDonors.size})</option>`);
                        $(`#${this.volcanoId}SubcohortSelector2`).append(`<option value=${subcohortIndex} style="background-color: #cce6ff">${subcohortName} (${subcohortSize}/${this.selectionManager.cohortFullDonors.size})</option>`);
                    });
                }else if(this.volcanoTypePrefix==="correlation"){
                    const cohortFullSize=this.selectionManager.cohortFullDonors.size;
                    $(`#${this.volcanoId}SubcohortSelector1`).empty().append('<option value="-1">Select Subcohort</option>');
                    this.selectionManager.registeredSubcohortNames.forEach((subcohortName,subcohortIndex,map)=>{
                        const subcohortSize=this.selectionManager.registeredSubcohorts.get(subcohortIndex).size;
                        $(`#${this.volcanoId}SubcohortSelector1`).append(`<option value=${subcohortIndex}>${subcohortName} (${subcohortSize}/${cohortFullSize})</option>`);
                    });
                    $(`#${this.volcanoId}MetadataColumnSelector`).empty().append('<option value="-1">Select Numerical Metadata Column</option>');
                    this.cohortMetadata.metadataDataTypes.forEach((columnType,columnName,x)=>{
                        if(columnType==="numeric"){
                            let anyNegative=false;
                            for(let i=0;i<this.cohortMetadata.metadata.length;++i){
                                let currentVal=this.cohortMetadata.metadata[i][columnName];
                                if(!this.commonSettings.undefinedValues.has(currentVal)){
                                    if(currentVal<0){
                                        anyNegative=true;
                                    }
                                }
                            }
                            if(!anyNegative){
                                $(`#${this.volcanoId}MetadataColumnSelector`).append(`<option value=${columnName.replace(/ /g, ";")}>${columnName}</option>`);
                            }
                        }
                    });
                }
                this.fontManager.setAvailableFontSettings("volcano");
                this.textExportManager.setAvailableExportSettings("volcano");
                //$('#helpInfo').html(tutorials.Tutorials.volcanoTutorial());
            });
    }
    cleanup(){
        for(let i = 0; i<this.data.length; ++i){
            let item=this.data[i];
            item.getGeneIndices(this.references).forEach((geneId)=>{
                this.references.genes.get(geneId).currentVolcanoContributions.get(this.displayAndControlElements.VolcanoIndices).delete(item.volcanoItemIndex);
            });
        }
        this.data.length=0;
        this.currentComparisonClasses=[new Set(),new Set()];
        this.displaySettings.maxX=0;
        this.displaySettings.maxXForced=0;
        this.displaySettings.maxY=0;
        this.displaySettings.maxYForced=0;
        this.displaySettings.modifiedVolcanoAxisX=false;
        this.displaySettings.modifiedVolcanoAxisY=false;
        this.displaySettings.hiddenVolcanoItems=new Set();
        this.displaySettings.lastVolcanoItemIndex=-1;
        this.displaySettings.volcanoVbox=null;
        this.displaySettings.minDonors=0;
        this.displaySettings.hiddenVolcanoItems.clear();
        this.anchorExpressions.length=0;
        $(`#${this.volcanoId}RecoverHiddenData`).css("display","none");
        $(`#${this.displayAndControlElements.VolcanoResetAxis}`).css("display","none");
    }
    launchMutexAnalysis(){
        this.cleanup();
        this.clearMarkedGenes();
        $(`#${this.volcanoId}SubcohortMutexSelectionSubmit`).css("display","none");
        this.group1Index = parseInt($(`#${this.volcanoId}SubcohortSelector1`).val());
        this.group2Index = parseInt($(`#${this.volcanoId}SubcohortSelector2`).val());
        this.uniqueGroup1Donors=new Set([...this.selectionManager.registeredSubcohorts.get(this.group1Index)].filter(x => !this.selectionManager.registeredSubcohorts.get(this.group2Index).has(x)));
        this.uniqueGroup2Donors=new Set([...this.selectionManager.registeredSubcohorts.get(this.group2Index)].filter(x => !this.selectionManager.registeredSubcohorts.get(this.group1Index).has(x)));
        if(this.uniqueGroup1Donors.size===0 && this.uniqueGroup2Donors.size!==0){
            this.uniqueGroup1Donors=this.selectionManager.registeredSubcohorts.get(this.group1Index);
        }else if(this.uniqueGroup1Donors.size!==0 && this.uniqueGroup2Donors.size===0){
            this.uniqueGroup2Donors=this.selectionManager.registeredSubcohorts.get(this.group2Index);
        }else if(this.uniqueGroup1Donors.size===0 && this.uniqueGroup2Donors.size===0){
            this.commonSettings.releaseLock();
            return;
        }
        this.uniqueGroup1Donors=this.selectionManager.registeredSubcohorts.get(this.group1Index);
        this.uniqueGroup2Donors=this.selectionManager.registeredSubcohorts.get(this.group2Index);
        this.subcohort12commonDonors=new Set([...this.selectionManager.registeredSubcohorts.get(this.group1Index)].filter(x => this.selectionManager.registeredSubcohorts.get(this.group2Index).has(x)));
        this.validDonorsForComparison=new Set([...this.uniqueGroup1Donors, ...this.uniqueGroup2Donors]);
        let chromosomeArmLevelStatistics=this.fetchChromosomeArmLevelMutexData();
        this.fetchCytobandLevelMutexData(chromosomeArmLevelStatistics);
        this.fetchTadLevelMutexData();
        this.fetchGeneLevelMutexData();
    }
    fetchChromosomeArmLevelMutexData(){
        const chromosomeArmLevelStatistics=new Map();
        if($(`#allow_${this.volcanoId}GainArm`).is(':checked')){
            const mutexEntrySecondaryType=1;
            for(let i=1;i<this.references.chromosomeArms.length;++i){
                const chromosomeArm=this.references.chromosomeArms[i];
                if(chromosomeArm.chromosomeIndex>24){
                    break;
                }
                const donorIndicesPre=chromosomeArm.cnvGainDonorContributorIndices;
                const donorIndices=new Set([...donorIndicesPre].filter(x => this.validDonorsForComparison.has(x)));
                if(donorIndices.size>0){
                    const tmp = VolcanoMutexEntry.createVolcanoMutexEntryChromosomeArm(chromosomeArm.chromosomeArmIndex,donorIndicesPre,donorIndices,this.uniqueGroup1Donors,this.uniqueGroup2Donors,mutexEntrySecondaryType);
                    if(tmp.pValLog10!==-1){
                        this.data.push(tmp);
                        if(!chromosomeArmLevelStatistics.has(chromosomeArm.chromosomeArmIndex)){
                            chromosomeArmLevelStatistics.set(chromosomeArm.chromosomeArmIndex,new Map());
                        }
                        chromosomeArmLevelStatistics.get(chromosomeArm.chromosomeArmIndex).set(mutexEntrySecondaryType,tmp.pValLog10);
                    }
                }
            }
        }
        if($(`#allow_${this.volcanoId}LOHLossArm`).is(':checked')){
            let mutexEntrySecondaryType=5;
            for(let i=1;i<this.references.chromosomeArms.length;++i){
                let chromosomeArm=this.references.chromosomeArms[i];
                if(chromosomeArm.chromosomeIndex>24){
                    break;
                }
                let donorIndicesPre=new Set([...chromosomeArm.cnvLossDonorContributorIndices, ...chromosomeArm.lohDonorContributorIndices]);
                let donorIndices=new Set([...donorIndicesPre].filter(x => this.validDonorsForComparison.has(x)));
                if(donorIndices.size>0){
                    let tmp = VolcanoMutexEntry.createVolcanoMutexEntryChromosomeArm(chromosomeArm.chromosomeArmIndex,donorIndicesPre,donorIndices,this.uniqueGroup1Donors,this.uniqueGroup2Donors,mutexEntrySecondaryType);
                    if(tmp.pValLog10!==-1){
                        this.data.push(tmp);
                        if(!chromosomeArmLevelStatistics.has(chromosomeArm.chromosomeArmIndex)){
                            chromosomeArmLevelStatistics.set(chromosomeArm.chromosomeArmIndex,new Map());
                        }
                        chromosomeArmLevelStatistics.get(chromosomeArm.chromosomeArmIndex).set(mutexEntrySecondaryType,tmp.pValLog10);
                    }
                }
            }
        }
        if($(`#allow_${this.volcanoId}LOHArm`).is(':checked')){
            let mutexEntrySecondaryType=3;
            for(let i=1;i<this.references.chromosomeArms.length;++i){
                let chromosomeArm=this.references.chromosomeArms[i];
                if(chromosomeArm.chromosomeIndex>24){
                    break;
                }
                let donorIndicesPre=chromosomeArm.lohDonorContributorIndices;
                let donorIndices=new Set([...donorIndicesPre].filter(x => this.validDonorsForComparison.has(x)));
                if(donorIndices.size>0){
                    let tmp = VolcanoMutexEntry.createVolcanoMutexEntryChromosomeArm(chromosomeArm.chromosomeArmIndex,donorIndices,this.uniqueGroup1Donors,this.uniqueGroup2Donors,mutexEntrySecondaryType);
                    if(tmp.pValLog10!==-1){
                        this.data.push(tmp);
                        if(!chromosomeArmLevelStatistics.has(chromosomeArm.chromosomeArmIndex)){
                            chromosomeArmLevelStatistics.set(chromosomeArm.chromosomeArmIndex,new Map());
                        }
                        chromosomeArmLevelStatistics.get(chromosomeArm.chromosomeArmIndex).set(mutexEntrySecondaryType,tmp.pValLog10);
                    }
                }
            }
        }
        if($(`#allow_${this.volcanoId}LossArm`).is(':checked')){
            let mutexEntrySecondaryType=2;
            for(let i=1;i<this.references.chromosomeArms.length;++i){
                let chromosomeArm=this.references.chromosomeArms[i].chromosomeArmIndex;
                if(chromosomeArm.chromosomeIndex>24){
                    break;
                }
                let donorIndicesPre = chromosomeArm.cnvLossDonorContributorIndices;
                let donorIndices=new Set([...donorIndicesPre].filter(x => this.validDonorsForComparison.has(x)));
                if(donorIndices.size>0){
                    let tmp = VolcanoMutexEntry.createVolcanoMutexEntryChromosomeArm(chromosomeArm.chromosomeArmIndex,donorIndicesPre,donorIndices,this.uniqueGroup1Donors,this.uniqueGroup2Donors,mutexEntrySecondaryType);
                    if(tmp.pValLog10!==-1){
                        this.data.push(tmp);
                        if(!chromosomeArmLevelStatistics.has(chromosomeArm.chromosomeArmIndex)){
                            chromosomeArmLevelStatistics.set(chromosomeArm.chromosomeArmIndex,new Map());
                        }
                        chromosomeArmLevelStatistics.get(chromosomeArm.chromosomeArmIndex).set(mutexEntrySecondaryType,tmp.pValLog10);
                    }
                }
            }
        }
        if($(`#allow_${this.volcanoId}cnnLOHArm`).is(':checked')){
            let mutexEntrySecondaryType=4;
            for(let i=1;i<this.references.chromosomeArms.length;++i){
                let chromosomeArm=this.references.chromosomeArms[i];
                if(chromosomeArm.chromosomeIndex>24){
                    break;
                }
                let donorIndicesPre = chromosomeArm.cnnLohDonorContributorIndices;
                let donorIndices=new Set([...donorIndicesPre].filter(x => this.validDonorsForComparison.has(x)));
                if(donorIndices.size>0){
                    let tmp = VolcanoMutexEntry.createVolcanoMutexEntryChromosomeArm(chromosomeArm.chromosomeArmIndex,donorIndices,this.uniqueGroup1Donors,this.uniqueGroup2Donors,mutexEntrySecondaryType);
                    if(tmp.pValLog10!==-1){
                        this.data.push(tmp);
                        if(!chromosomeArmLevelStatistics.has(chromosomeArm.chromosomeArmIndex)){
                            chromosomeArmLevelStatistics.set(chromosomeArm.chromosomeArmIndex,new Map());
                        }
                        chromosomeArmLevelStatistics.get(chromosomeArm.chromosomeArmIndex).set(mutexEntrySecondaryType,tmp.pValLog10);
                    }
                }
            }
        }
        return chromosomeArmLevelStatistics;
    }
    fetchCytobandLevelMutexData(chromosomeArmLevelStatistics){
        if($(`#allow_${this.volcanoId}GainCyto`).is(':checked')){
            const mutexEntrySecondaryType=1;
            for(let i=1;i<this.references.cytobands.length;++i){
                const cytoband=this.references.cytobands[i];
                if(cytoband.chromosomeIndex>24){
                    break;
                }
                const donorIndicesPre=cytoband.cnvGainDonorContributorIndices;
                const donorIndices=new Set([...donorIndicesPre].filter(x => this.validDonorsForComparison.has(x)));
                if(donorIndices.size>0){
                    const tmp = VolcanoMutexEntry.createVolcanoMutexEntryCytoband(cytoband.cytobandIndex,donorIndicesPre,donorIndices,this.uniqueGroup1Donors,this.uniqueGroup2Donors,mutexEntrySecondaryType);
                    if(tmp.pValLog10!==-1){
                        if(chromosomeArmLevelStatistics.has(cytoband.chromosomeIndex)){
                            if(chromosomeArmLevelStatistics.get(cytoband.chromosomeIndex).has(mutexEntrySecondaryType)){
                                if(chromosomeArmLevelStatistics.get(cytoband.chromosomeIndex).get(mutexEntrySecondaryType)>tmp.pValLog10){
                                    continue;
                                }
                            }
                        }
                        this.data.push(tmp);
                    }
                }
            }
        }
        if($(`#allow_${this.volcanoId}LOHLossCyto`).is(':checked')){
            const mutexEntrySecondaryType=5;
            for(let i=1;i<this.references.cytobands.length;++i){
                const cytoband=this.references.cytobands[i];
                if(cytoband.chromosomeIndex>24){
                    break;
                }
                const donorIndicesPre=new Set([...cytoband.cnvLossDonorContributorIndices, ...cytoband.lohDonorContributorIndices]);
                const donorIndices=new Set([...donorIndicesPre].filter(x => this.validDonorsForComparison.has(x)));
                if(donorIndices.size>0){
                    const tmp = VolcanoMutexEntry.createVolcanoMutexEntryCytoband(cytoband.cytobandIndex,donorIndicesPre,donorIndices,this.uniqueGroup1Donors,this.uniqueGroup2Donors,mutexEntrySecondaryType);
                    if(tmp.pValLog10!==-1){
                        if(chromosomeArmLevelStatistics.has(cytoband.chromosomeIndex)){
                            if(chromosomeArmLevelStatistics.get(cytoband.chromosomeIndex).has(mutexEntrySecondaryType)){
                                if(chromosomeArmLevelStatistics.get(cytoband.chromosomeIndex).get(mutexEntrySecondaryType)>tmp.pValLog10){
                                    continue;
                                }
                            }
                        }
                        this.data.push(tmp);
                    }
                }
            }
        }
        if($(`#allow_${this.volcanoId}LossCyto`).is(':checked')){
            const mutexEntrySecondaryType=2;
            for(let i=1;i<this.references.cytobands.length;++i){
                let cytoband=this.references.cytobands[i];
                if(cytoband.chromosomeIndex>24){
                    break;
                }
                const donorIndicesPre=cytoband.cnvLossDonorContributorIndices;
                const donorIndices=new Set([...donorIndicesPre].filter(x => this.validDonorsForComparison.has(x)));
                if(donorIndices.size>0){
                    const tmp = VolcanoMutexEntry.createVolcanoMutexEntryCytoband(cytoband.cytobandIndex,donorIndicesPre,donorIndices,this.uniqueGroup1Donors,this.uniqueGroup2Donors,mutexEntrySecondaryType);
                    if(tmp.pValLog10!==-1){
                        if(chromosomeArmLevelStatistics.has(cytoband.chromosomeIndex)){
                            if(chromosomeArmLevelStatistics.get(cytoband.chromosomeIndex).has(mutexEntrySecondaryType)){
                                if(chromosomeArmLevelStatistics.get(cytoband.chromosomeIndex).get(mutexEntrySecondaryType)>tmp.pValLog10){
                                    continue;
                                }
                            }
                        }
                        this.data.push(tmp);
                    }
                }
            }
        }
        if($(`#allow_${this.volcanoId}LOHCyto`).is(':checked')){
            const mutexEntrySecondaryType=3;
            for(let i=1;i<this.references.cytobands.length;++i){
                let cytoband=this.references.cytobands[i];
                if(cytoband.chromosomeIndex>24){
                    break;
                }
                let donorIndicesPre=cytoband.lohDonorContributorIndices;
                let donorIndices=new Set([...donorIndicesPre].filter(x => this.validDonorsForComparison.has(x)));
                if(donorIndices.size>0){
                    const tmp = VolcanoMutexEntry.createVolcanoMutexEntryCytoband(cytoband.cytobandIndex,donorIndicesPre,donorIndices,this.uniqueGroup1Donors,this.uniqueGroup2Donors,mutexEntrySecondaryType);
                    if(tmp.pValLog10!==-1){
                        if(chromosomeArmLevelStatistics.has(cytoband.chromosomeIndex)){
                            if(chromosomeArmLevelStatistics.get(cytoband.chromosomeIndex).has(mutexEntrySecondaryType)){
                                if(chromosomeArmLevelStatistics.get(cytoband.chromosomeIndex).get(mutexEntrySecondaryType)>tmp.pValLog10){
                                    continue;
                                }
                            }
                        }
                        this.data.push(tmp);
                    }
                }
            }
        }
        if($(`#allow_${this.volcanoId}cnnLOHCyto`).is(':checked')){
            let mutexEntrySecondaryType=4;
            for(let i=1;i<this.references.cytobands.length;++i){
                let cytoband=this.references.cytobands[i];
                if(cytoband.chromosomeIndex>24){
                    break;
                }
                const donorIndicesPre=cytoband.cnnLohDonorContributorIndices;
                const donorIndices=new Set([...donorIndicesPre].filter(x => this.validDonorsForComparison.has(x)));
                if(donorIndices.size>0){
                    const tmp = VolcanoMutexEntry.createVolcanoMutexEntryCytoband(cytoband.cytobandIndex,donorIndicesPre,donorIndices,this.uniqueGroup1Donors,this.uniqueGroup2Donors,mutexEntrySecondaryType);
                    if(tmp.pValLog10!==-1){
                        if(chromosomeArmLevelStatistics.has(cytoband.chromosomeIndex)){
                            if(chromosomeArmLevelStatistics.get(cytoband.chromosomeIndex).has(mutexEntrySecondaryType)){
                                if(chromosomeArmLevelStatistics.get(cytoband.chromosomeIndex).get(mutexEntrySecondaryType)>tmp.pValLog10){
                                    continue;
                                }
                            }
                        }
                        this.data.push(tmp);
                    }
                }
            }
        }
    }
    fetchTadLevelMutexData(){
        let maxTadOffset=0;
        if(!$(`#allow_${this.volcanoId}Sv0`).is(':checked')){
            return;
        }
        if($(`#allow_${this.volcanoId}Sv3`).is(':checked')){
            maxTadOffset=3;
        }else{
            if($(`#allow_${this.volcanoId}Sv2`).is(':checked')){
                maxTadOffset=2;
            }else{
                if($(`#allow_${this.volcanoId}Sv1`).is(':checked')){
                    maxTadOffset=1;
                }
            }
        }
        for(let i=1;i<this.references.tads.length;++i){
            let tad=this.references.tads[i];
            if(tad.chromosomeIndex>24){
                break;
            }
            let donorIndicesPre=tad.svDonorContributorIndicesOffset0;
            if(maxTadOffset>0){
                donorIndicesPre=new Set([...donorIndicesPre, ...tad.svDonorContributorIndicesOffset1]);
            }if(maxTadOffset>1){
                donorIndicesPre=new Set([...donorIndicesPre, ...tad.svDonorContributorIndicesOffset2]);
            }if(maxTadOffset>2){
                donorIndicesPre=new Set([...donorIndicesPre, ...tad.svDonorContributorIndicesOffset3]);
            }
            let donorIndices=new Set([...donorIndicesPre].filter(x => this.validDonorsForComparison.has(x)));
            if(donorIndices.size>0){
                const tmp = VolcanoMutexEntry.createVolcanoMutexEntryTad(tad.tadIndex,donorIndicesPre,donorIndices,this.uniqueGroup1Donors,this.uniqueGroup2Donors,6);
                if(tmp.pValLog10!==-1){
                    this.data.push(tmp);
                }
            }
        }
    }
    determineCurrentGeneMutTypes(){
        let res=new Set();
        if($(`#allow_${this.volcanoId}FunctionalSmallVar`).is(':checked')){
            [12,13,32,33,34,35,36,37,38,39,40,41,42,43,24,25,26,29,30,31].forEach((m)=>{
                res.add(m);
            });
        }
        if($(`#allow_${this.volcanoId}UTR5`).is(':checked')){
            [4,5,6,23].forEach((m)=>{
                res.add(m);
            });
        }
        if($(`#allow_${this.volcanoId}UTR3`).is(':checked')){
            [1,2,3].forEach((m)=>{
                res.add(m);
            });
        }
        if($(`#allow_${this.volcanoId}Amp`).is(':checked')){
            res.add(7);
        }
        if($(`#allow_${this.volcanoId}Homdel`).is(':checked')){
            res.add(15);
        }
        if($(`#allow_${this.volcanoId}Synonymous`).is(':checked')){
            res.add(48);
        }
        if($(`#allow_${this.volcanoId}DoubleHitAlt1`).is(':checked')){
            res.add(57);
        }
        if(!this.commonSettings.wesMode){
            if($(`#allow_${this.volcanoId}Upstream`).is(':checked')){
                [52,53,54].forEach((m)=>{
                    res.add(m);
                });
            }
            if($(`#allow_${this.volcanoId}Downstream`).is(':checked')){
                [9,10,11].forEach((m)=>{
                    res.add(m);
                });
            }
            if($(`#allow_${this.volcanoId}DirectSv`).is(':checked')){
                res.add(8);
            }
            if($(`#allow_${this.volcanoId}DoubleHitAlt2`).is(':checked')){
                res.add(58);
            }
            if($(`#allow_${this.volcanoId}DoubleHitAlt3`).is(':checked')){
                res.add(59);
            }
            if($(`#allow_${this.volcanoId}FusionCorrect`).is(':checked')){
                res.add(60);
            }
            if($(`#allow_${this.volcanoId}FusionIncorrect`).is(':checked')){
                res.add(61);
            }
        }
        return res;
    }
    fetchGeneLevelMutexData(){
        const currentGeneMutTypes=this.determineCurrentGeneMutTypes();
        const searchColPre=["\`Gene"].concat(Array.from(currentGeneMutTypes).sort().map(String));
        const searchCol=searchColPre.join('\`, \`')+"\`";
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: thisRef.cohortMetadata.cohortName,
                suffix: "geneRecurrence",
                columnsToSelect: searchCol,
                keyColumn: "",
                keysToSearchRaw:"*",
            }),
            success: function(data){
                data.forEach((x)=>{
                    let geneId=parseInt(x.Gene);
                    if(thisRef.references.genes.has(geneId)){
                        const tmpRec = new VariantRecurrenceEntryGene(x,currentGeneMutTypes);
                        if(tmpRec.isValid){
                            const geneId=tmpRec.geneId;
                            let donorIndicesPre=new Set();
                            tmpRec.contributions.forEach((donorIndices,key,map)=>{
                                donorIndices.forEach((donorIndex)=>{
                                    donorIndicesPre.add(donorIndex);
                                });
                            });
                            let currentDonorIndices=new Set([...donorIndicesPre].filter(x => thisRef.validDonorsForComparison.has(x)));
                            if(currentDonorIndices.size>0){
                                const tmp = VolcanoMutexEntry.createVolcanoMutexEntryGene(geneId,donorIndicesPre,currentDonorIndices,thisRef.uniqueGroup1Donors,thisRef.uniqueGroup2Donors);
                                if(tmp.pValLog10!==-1){
                                    thisRef.data.push(tmp);
                                }
                            }
                        }
                    }
                });
                thisRef.addVolcanoIndices();
                thisRef.setDataXfield();
                thisRef.setDataYfield();
                thisRef.updateMaximums();
                thisRef.plotVolcano();
            },
            error: function (err) {
                console.error(err);
            }
        });
    }
    launchSubcohortAnalysis(){
        this.cleanup();
        this.clearMarkedGenes();
        $(`#${this.volcanoId}SubcohortSelectionSubmit`).css("display","none");
        this.group1Index = parseInt($(`#${this.volcanoId}SubcohortSelector1`).val());
        this.group2Index = parseInt($(`#${this.volcanoId}SubcohortSelector2`).val());
        this.uniqueGroup1Donors=new Set([...this.selectionManager.registeredSubcohorts.get(this.group1Index)].filter(x => !this.selectionManager.registeredSubcohorts.get(this.group2Index).has(x)));
        this.uniqueGroup2Donors=new Set([...this.selectionManager.registeredSubcohorts.get(this.group2Index)].filter(x => !this.selectionManager.registeredSubcohorts.get(this.group1Index).has(x)));
        if(this.uniqueGroup1Donors.size===0 && this.uniqueGroup2Donors.size!==0){
            this.uniqueGroup1Donors=this.selectionManager.registeredSubcohorts.get(this.group1Index);
        }else if(this.uniqueGroup1Donors.size!==0 && this.uniqueGroup2Donors.size===0){
            this.uniqueGroup2Donors=this.selectionManager.registeredSubcohorts.get(this.group2Index);
        }else if(this.uniqueGroup1Donors.size===0 && this.uniqueGroup2Donors.size===0){
            this.commonSettings.releaseLock();
            return;
        }
        this.subcohort12commonDonors=new Set([...this.selectionManager.registeredSubcohorts.get(this.group1Index)].filter(x => this.selectionManager.registeredSubcohorts.get(this.group2Index).has(x)));
        this.validDonorsForComparison=new Set([...this.uniqueGroup1Donors, ...this.uniqueGroup2Donors]);
        if(this.volcanoPhenotype==="GeneExpression"){
            $(`#${this.volcanoId}ProgressBarGroup`).css("display","inline");
            $(`#${this.volcanoId}ProgressBar`).css("width","0%");
            const maxBatch=99;
            this.callNextSubcohortBatch(0,maxBatch);
        }else if(this.volcanoPhenotype==="RppaExpression"){
            this.callNextSubcohortBatch(-1,-1);
        }else if(this.volcanoPhenotype==="MethylomeBeta"){
            $(`#${this.volcanoId}ProgressBarGroup`).css("display","inline");
            $(`#${this.volcanoId}ProgressBar`).css("width","0%");
        }
    }
    callNextSubcohortBatch(batchIndex,maxBatch){
        if(batchIndex!==-1){
            $(`#${this.volcanoId}ProgressBar`).css('width',`${100*batchIndex/(maxBatch+5)}%`);
        }
        this.getBatchForSubcohortAnalysis(batchIndex,maxBatch);
    }
    getBatchForSubcohortAnalysis(batchIndex,maxBatch){
        let keysToSearchRaw="*";
        if(batchIndex!==-1){
            if(!this.references.geneBatchInfo.has(batchIndex)){
                if(batchIndex===maxBatch){
                    this.addVolcanoIndices();
                    this.setDataXfield(this.xFieldName);
                    this.setDataYfield(this.yFieldName);
                    this.updateMaximums();
                    this.plotVolcano();
                    this.commonSettings.releaseLock();
                }else{
                    this.callNextSubcohortBatch(batchIndex+1,maxBatch);
                }
            }
            let genes = this.references.geneBatchInfo.get(batchIndex);
            keysToSearchRaw=genes.join(',');
        }
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDbPOST.php`,
            type: 'POST',
            dataType:'json',
            data: ({
                cohort: thisRef.cohortMetadata.cohortName,
                suffix: `${thisRef.truePhenotype}Expressions`,
                columnsToSelect: "*",
                keyColumn: thisRef.truePhenotype,
                keysToSearchRaw: keysToSearchRaw
            }),
            error: function(err){
                thisRef.commonSettings.releaseLock();
                console.error(err);
            },
            success: function(rawData){
                thisRef.processSubcohortBatch(rawData);
                if(batchIndex<maxBatch){
                    thisRef.callNextSubcohortBatch(batchIndex+1,maxBatch);
                }else{
                    thisRef.addVolcanoIndices();
                    thisRef.setDataXfield(thisRef.xFieldName);
                    thisRef.setDataYfield(thisRef.yFieldName);
                    thisRef.updateMaximums();
                    thisRef.plotVolcano();
                    thisRef.commonSettings.releaseLock();
                }
            }
        });
    }
    processSubcohortBatch(rawData){
        let bioIdColumn = this.truePhenotype;
        const rawDataLength=rawData.length;
        const testName=this.testName+"Test";
        if(rawDataLength===0){
            return;
        }
        let expressions1Donors=[];
        this.uniqueGroup1Donors.forEach((donorIndex)=>{
            if(rawData[0].hasOwnProperty(donorIndex.toString())){
                expressions1Donors.push(donorIndex.toString());
            }
        });
        let expressions2Donors=[];
        this.uniqueGroup2Donors.forEach((donorIndex)=>{
            if(rawData[0].hasOwnProperty(donorIndex.toString())){
                expressions2Donors.push(donorIndex.toString());
            }
        });
        const expressions1Length=expressions1Donors.length;
        const expressions2Length=expressions2Donors.length;
        let expressions1=new Array(expressions1Length);
        let expressions1NonLog=new Array(expressions1Length);
        let expressions2=new Array(expressions2Length);
        let expressions2NonLog=new Array(expressions2Length);
        for(let i=0;i<rawDataLength;++i){
            let anyGreater2=false;
            for(let j=0;j<expressions1Length;++j){
                expressions1[j]=+rawData[i][expressions1Donors[j]];
                expressions1NonLog[j]=Math.pow(2 ,expressions1[j]);
                if(!anyGreater2){
                    if(expressions1NonLog[j]>=2){
                        anyGreater2=true;
                    }
                }
            }
            for(let j=0;j<expressions2Length;++j){
                expressions2[j]=+rawData[i][expressions2Donors[j]];
                expressions2NonLog[j]=Math.pow(2 ,expressions2[j]);
                if(!anyGreater2){
                    if(expressions2NonLog[j]>=2){
                        anyGreater2=true;
                    }
                }
            }
            const bioId=+rawData[i][bioIdColumn];
            if(anyGreater2){
                let pVal=0;
                for(let j=0;j<10;++j){
                    pVal=StatsTests[testName](expressions1,expressions2,Math.pow(2,j)*100,Math.pow(2,j)*1000);
                    if(!this.commonSettings.undefinedValues.has(pVal)){
                        break;
                    }else{
                        if(j===9){
                            pVal=0;
                        }
                    }
                }
                if(pVal!==0){
                    let tmpData={
                        log2FcTrimean:trimeanFc(expressions1NonLog,expressions2NonLog),
                        log2FcMean:meanFc(expressions1NonLog,expressions2NonLog),
                        pValLog10:pVal,
                    };
                    tmpData[bioIdColumn]=bioId;
                    this.data.push(new VolcanoEntry(tmpData,0));
                }
            }
        }
    }
    processSubcohortBatchBck(rawData){
        let bioIdColumn = this.truePhenotype;
        for(let i=0;i<rawData.length;++i){
            let expressions1=[];
            let expressions2=[];
            this.uniqueGroup1Donors.forEach((donorIndex)=>{
                if(rawData[i].hasOwnProperty(donorIndex.toString())){
                    const expression = +rawData[i][donorIndex.toString()];
                    expressions1.push(Math.pow(2,expression));
                }
            });
            this.uniqueGroup2Donors.forEach((donorIndex)=>{
                if(rawData[i].hasOwnProperty(donorIndex.toString())){
                    const expression = +rawData[i][donorIndex.toString()];
                    expressions2.push(Math.pow(2,expression));
                }
            });
            if(Math.max(...expressions1)>=2||Math.max(...expressions2)>=2){
                let bioId=+rawData[i][bioIdColumn];
                let pVal=0;
                for(let j=0;j<10;++j){
                    pVal=StatsTests[this.testName+"Test"](expressions1,expressions2,Math.pow(2,j)*100,Math.pow(2,j)*1000);
                    if(!this.commonSettings.undefinedValues.has(pVal)){
                        break;
                    }else{
                        if(j===9){
                            pVal=0;
                        }
                    }
                }
                let tmpData={
                    log2FcTrimean:trimeanFc(expressions1,expressions2),
                    log2FcMean:meanFc(expressions1,expressions2),
                    pValLog10:pVal,
                };
                tmpData[bioIdColumn]=bioId;
                if(tmpData.pValLog10!==0){
                    this.data.push(new VolcanoEntry(tmpData,0));
                }
            }
        }
    }
    addVolcanoIndices(){
        for(let i=0; i<this.data.length;++i){
            this.data[i].volcanoItemIndex=i;
            this.data[i].getGeneIndices(this.references).forEach((gene)=>{
                if(!this.references.genes.get(gene).currentVolcanoContributions.has(this.displayAndControlElements.VolcanoIndices)){
                    this.references.genes.get(gene).currentVolcanoContributions.set(this.displayAndControlElements.VolcanoIndices,new Set());
                }
                this.references.genes.get(gene).currentVolcanoContributions.get(this.displayAndControlElements.VolcanoIndices).add(i);
            });
        }
    }

    launchVariantAnalysis(){
        $(`#${this.volcanoId}ProgressBarGroup`).css("display","inline");
        $(`#${this.volcanoId}ProgressBar`).css("width","0%");
        $(`#${this.displayAndControlElements.VolcanoComparisonClassSelectionSubmit}`).css("display","none");
        const newComparisonClasses=this.inferComparisonClasses();
        if (newComparisonClasses!==this.currentComparisonClasses) {
            this.cleanup();
            const newBlacklistedClasses = new Set([...newComparisonClasses[0]].filter(x => !this.currentComparisonClasses[0].has(x)));
            const newMandatoryClasses = new Set([...newComparisonClasses[1]].filter(x => !this.currentComparisonClasses[1].has(x)));
            if (newBlacklistedClasses.size > 0) {
                this.markObsoleteVolcanoData(Array.from(newBlacklistedClasses));
            }
            this.currentComparisonClasses = newComparisonClasses;
            setTimeout(()=>{this.addNewVariantVolcanoData(newMandatoryClasses)},0);
        }
    }
    inferComparisonClasses(){
        let blacklistedComparisonClasses=new Set();
        let allowedComparisonClasses=new Set();
        Array.from(this.references.comparisonTypesReverse.keys()).forEach((comparisonClass)=>{
            if($(`#allow_${this.volcanoId}${comparisonClass}`).is(':checked')){
                allowedComparisonClasses.add(this.references.comparisonTypesReverse.get(comparisonClass));
            }else{
                blacklistedComparisonClasses.add(this.references.comparisonTypesReverse.get(comparisonClass));
            }
        });
        return [blacklistedComparisonClasses,allowedComparisonClasses];
    }
    markObsoleteVolcanoData(newBlacklistedClasses){
        let newData=[];
        for(let i = 0; i<this.data.length; ++i){
            let obsoleteFound=false;
            for(let j=0; j<newBlacklistedClasses.length;++j){
                if(this.data[i].includedComparisons.has(newBlacklistedClasses[j])){
                    obsoleteFound=true;
                    break;
                }
            }
            if(obsoleteFound){
                this.references.genes.get(this.data[i].gene).currentVolcanoContributions.get(this.displayAndControlElements.VolcanoIndices).delete(this.data[i].volcanoItemIndex);
            }else{
                newData.push(this.data[i]);
            }
        }
        this.data=newData;
    }

    addNewVariantVolcanoData(newClasses){
        let thisRef=this;
        const blacklistedClassesStr=Array.from(thisRef.currentComparisonClasses[0]).map((x)=>`\`${x}\``).join(',');
        const mandatoryClassesStr=Array.from(newClasses).map((x)=>`\`${x}\``).join(',');
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromVolcanoDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: thisRef.cohortMetadata.cohortName,
                suffix: `${thisRef.truePhenotype}ExpressionSummary${this.testName}`,
                blacklistedClasses: blacklistedClassesStr,
                mandatoryClasses: mandatoryClassesStr
            }),
            error: function(err){
                thisRef.commonSettings.releaseLock();
                console.error(err);
            },
            success: function(data){
                setTimeout(()=>{thisRef.processNewVariantData(data);},0);
            }
        });
    }
    processNewVariantData(data){
        this.callNextVariantDataBatch(0,0,0,data);
        this.setDataXfield(this.xFieldName);
        this.setDataYfield(this.yFieldName);
        this.markDuplicateVolcanoData();
        this.updateMaximums();
        this.plotVolcano();
        this.commonSettings.releaseLock();
        $(`#${this.displayAndControlElements.VolcanoComparisonClassSelectionSubmit}`).css("display","inline");
    }
    callNextVariantDataBatch(currentProgress,i,j,data){
        setTimeout(()=>{
            $(`#${this.volcanoId}ProgressBar`).css('width',`${parseInt(currentProgress)}%`);
            // let tmp = document.getElementById(`${this.volcanoId}ProgressBar`).offsetHeight;
            },0);
        this.processNewVariantDataBatch(i,j,data);
    }
    processNewVariantDataBatch(iStart,jStart,data){
        let adjustedLength=data.length*1.2;
        let numPossibleComparisonClasses = this.references.comparisonTypes.length;
        let j=jStart;
        let i=iStart;
        let currentProgress=0;
        while(i<data.length){
            let newEntry=new VolcanoEntry(data[i],numPossibleComparisonClasses);
            if(newEntry.isPromising()){
                let anyMatch=false;
                newEntry.getGeneIndices(this.references).forEach((gene)=>{
                    if(this.references.genes.has(gene)){
                        anyMatch=true;
                        if(!this.references.genes.get(gene).currentVolcanoContributions.has(this.displayAndControlElements.VolcanoIndices)){
                            this.references.genes.get(gene).currentVolcanoContributions.set(this.displayAndControlElements.VolcanoIndices,new Set([]));
                        }
                        this.references.genes.get(gene).currentVolcanoContributions.get(this.displayAndControlElements.VolcanoIndices).add(newEntry.volcanoItemIndex)
                    }
                });
                if(anyMatch){
                    this.data.push(newEntry);
                }
            }
            currentProgress=100*i/(adjustedLength);
            ++i;
            if(currentProgress>j*5){
                j+=1;
                break;
            }
        }
        if(i<data.length){
            this.callNextVariantDataBatch(currentProgress,i,j,data);
        }
    }
    markDuplicateVolcanoData(){
        let thisRef=this;
        this.data.sort(function(a, b) {
            if (a.getBioIndex() < b.getBioIndex()) {
                return -1;
            }
            if (a.getBioIndex() > b.getBioIndex()) {
                return 1;
            }
            const aMag=a.getMag();
            const bMag=b.getMag();
            if(aMag > bMag){
                return -1;
            }
            if(aMag < bMag){
                return 1;
            }
            if(a.includedComparisons.size < b.includedComparisons.size){
                return -1;
            }
            if(a.includedComparisons.size > b.includedComparisons.size){
                return 1;
            }
            return -1;
        });
        let currentBioIndex=-1;
        //TODO: investigate if deep clone is needed
        let newData=[];
        for(let i = 0; i<this.data.length; ++i){
            let bioIndex=this.data[i].getBioIndex();
            if(bioIndex!==currentBioIndex){
                newData.push(this.data[i]);
                currentBioIndex=bioIndex;
            }else{
                this.data[i].getGeneIndices(this.references).forEach((g)=>{
                    this.references.genes.get(g).currentVolcanoContributions.get(this.displayAndControlElements.VolcanoIndices).delete(this.data[i].volcanoItemIndex);
                });
            }
        }
        this.data=newData;
    }
    updateMaximums(){
        this.volcanoIndexToDataIndex.clear();
        this.displaySettings.maxX=0;
        this.displaySettings.maxY=0;
        this.displaySettings.minY=1e10;
        const dataLength=this.data.length;
        for(let i=0;i<dataLength;++i){
            const currentAbsX=Math.abs(this.data[i].x);
            const currentY=this.data[i].y;
            if(currentAbsX>this.displaySettings.maxX){
                this.displaySettings.maxX=currentAbsX;
            }
            if(currentY>this.displaySettings.maxY){
                this.displaySettings.maxY=currentY;
            }
            if(currentY<this.displaySettings.minY){
                this.displaySettings.minY=currentY;
            }
            this.volcanoIndexToDataIndex.set(this.data[i].volcanoItemIndex,i);
        }
        let markedItemsToDelete=new Set();
        this.displaySettings.markedVolcanoItems.forEach((markedItem)=> {
            if(!this.volcanoIndexToDataIndex.has(markedItem)){
                markedItemsToDelete.add(markedItem);
            }
        });
        markedItemsToDelete.forEach((markedItem)=> {
            this.displaySettings.markedVolcanoItems.delete(markedItem);
        });
        this.displaySettings.maxXForced = this.displaySettings.maxX;
        this.displaySettings.maxYForced = this.displaySettings.maxY;
    }
    adjustRadius(newRadius){
        [].forEach.call(document.getElementsByClassName(this.displayAndControlElements.VolcanoCircleClass),(el)=>{
            let symbolIndex=parseInt(el.getAttribute('si'));
            let newPath=d3Xsymbol()
                .type(()=> {return d3Xsymbols[symbolIndex];})
                .size(()=> {return newRadius;})();
            el.setAttribute('d',newPath);
        });
    }
    adjustVisibility(){
        const xLimit = +(document.getElementById(this.displayAndControlElements.VolcanoFrame).getAttribute("width"));
        let thisRef=this;
        this.circleGroup.selectAll(`.${this.displayAndControlElements.VolcanoCircleClass}`)
            .style("display",function(){
                if(d3Xselect(this).attr("id").endsWith("dummy")){
                    return "none";
                }
                let d = d3Xselect(this).datum();
                if(thisRef.displaySettings.hiddenVolcanoItems.has(d.volcanoItemIndex)){
                    if($(`#${thisRef.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${d.volcanoItemIndex}`).length){
                        thisRef.hideVolcanoItem(d.volcanoItemIndex)
                    }
                    return "none";
                }
                let displayResult = "none";
                let correlationCriterion=true;
                if(thisRef.volcanoTypePrefix==="correlation"){
                    if(d.maxExpression<thisRef.minMaxExpression){
                        correlationCriterion=false;
                    }
                }
                let recurrenceCriterion =true;
                if(thisRef.volcanoTypePrefix==="variant"){
                    recurrenceCriterion = d.numSelected >= thisRef.displaySettings.minDonors && d.numInverted >= thisRef.displaySettings.minDonors;
                }
                if(recurrenceCriterion && correlationCriterion){
                    let borderCriterionX=true;
                    if(thisRef.displaySettings.modifiedVolcanoAxisX){
                        let xCoord = +this.getAttribute('cx');
                        borderCriterionX=(0<=xCoord && Math.abs(xCoord)<=xLimit);
                    }
                    if(borderCriterionX){
                        let borderCriterionY=true;
                        if(thisRef.displaySettings.modifiedVolcanoAxisY){
                            let yCoord = +this.getAttribute('cy');
                            borderCriterionY=(yCoord>=0);
                        }
                        if(borderCriterionY){
                            displayResult="inline";
                        }
                    }
                }
                if(displayResult==="inline" && thisRef.volcanoPhenotype!=="Mutex"){
                    let geneIndices = d.getGeneIndices(thisRef.references);
                    let anyOk=false;
                    for(let i=0;i<geneIndices.length;++i){
                        let geneTypeIndex=thisRef.references.genes.get(geneIndices[i]).geneTypeIndex;
                        let geneSuperType=thisRef.references.geneTypes[geneTypeIndex].geneSupertype;
                        if($(`#allow_${thisRef.volcanoId}${geneSuperType}`).is(':checked')){
                            anyOk=true;
                            break;
                        }
                    }
                    if(!anyOk){
                        displayResult="none";
                    }
                }
                const marker=$(`#${thisRef.displayAndControlElements.VolcanoGeneMarkerClass}_${d.volcanoItemIndex}`);
                if(marker.length){
                    marker.css("display",displayResult);
                    const marker2=$(`#${thisRef.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${d.volcanoItemIndex}_dragbridge`);
                    if(marker2.length){
                        marker2.css("display",displayResult);
                    }
                }
                return displayResult;
            });
        this.commonSettings.releaseLock();
    }
    markAllGenesOnCytobandsContainingGene(geneIndex){
        let genesToMark=new Set();
        this.references.genes.get(geneIndex).cytobandIndices.forEach((cytobandIndex)=>{
            this.references.cytobands[cytobandIndex].getGeneIndices(this.references).forEach((geneIndex2)=>{
                genesToMark.add(geneIndex2);
            });
        });
        genesToMark.forEach((geneIndex2)=>{
            this.markGene(geneIndex2,-1,true);
        });
        this.updateMarkedVolcanoItemDisplay();
    }

    markAllGenesOnCytoband(cytobandIndex){
        this.references.cytobands[cytobandIndex].getGeneIndices(this.references).forEach((geneIndex)=>{
            if(this.references.genes.get(geneIndex).currentVolcanoContributions.has(this.displayAndControlElements.VolcanoIndices)){
                let volcanoIndices=this.references.genes.get(geneIndex).currentVolcanoContributions.get(this.displayAndControlElements.VolcanoIndices);
                volcanoIndices.forEach((volcanoItemIndex)=>{
                    if(volcanoItemIndex!==this.displaySettings.lastVolcanoItemIndex){
                        this.markVolcanoItem(volcanoItemIndex,true);
                    }
                });
            }
        });
        this.updateMarkedVolcanoItemDisplay();
    }
    hideAllGenesOnCytobandsContainingGene(geneIndex){
        let genesToHide=new Set();
        this.references.genes.get(geneIndex).cytobandIndices.forEach((cytobandIndex)=>{
            this.references.cytobands[cytobandIndex].getGeneIndices(this.references).forEach((geneIndex2)=>{
                genesToHide.add(geneIndex2);
            });
        });
        let anyHidden=false;
        genesToHide.forEach((geneIndex2)=>{
            if(this.references.genes.get(geneIndex2).currentVolcanoContributions.has(this.displayAndControlElements.VolcanoIndices)){
                let volcanoIndices=this.references.genes.get(geneIndex2).currentVolcanoContributions.get(this.displayAndControlElements.VolcanoIndices);
                if(volcanoIndices.size>0){
                    anyHidden=true;
                }
                volcanoIndices.forEach((volcanoIndex)=>{
                    this.displaySettings.hiddenVolcanoItems.add(volcanoIndex);
                });
            }
        });
        if(anyHidden){
            setTimeout(()=>{this.adjustVisibility();},0);
            $(`#${this.displayAndControlElements.VolcanoRecoverHiddenData}`).css("display","inline");
        }
    }
    hideAllGenesOnCytoband(cytobandIndex){
        let anyHidden=false;
        this.references.cytobands[cytobandIndex].getGeneIndices(this.references).forEach((geneIndex)=>{
            if(this.references.genes.get(geneIndex).currentVolcanoContributions.has(this.displayAndControlElements.VolcanoIndices)){
                let volcanoIndices=this.references.genes.get(geneIndex).currentVolcanoContributions.get(this.displayAndControlElements.VolcanoIndices);
                if(volcanoIndices.size>0){
                    anyHidden=true;
                }
                volcanoIndices.forEach((volcanoIndex)=>{
                    this.displaySettings.hiddenVolcanoItems.add(volcanoIndex);
                });
            }
        });
        if(anyHidden){
            setTimeout(()=>{this.adjustVisibility();},0);
            $(`#${this.displayAndControlElements.VolcanoRecoverHiddenData}`).css("display","inline");
        }
    }
    hideVolcanoItem(volcanoIndex){
        this.displaySettings.hiddenVolcanoItems.add(volcanoIndex);
        $(`#${this.displayAndControlElements.VolcanoCircleClass}_${volcanoIndex}`).css("display","none");
        const marker = $(`#${this.displayAndControlElements.VolcanoGeneMarkerClass}_${volcanoIndex}`);
        if(marker.length){
            this.markVolcanoItem(volcanoIndex,false);
        }
    }
    premarkVolcanoItem(volcanoIndex){
        const el = document.getElementById(this.displayAndControlElements.VolcanoSvg);
        const rect = el.getBoundingClientRect();
        const targetWidth = rect.width;
        const [xScale,yScale]=this.generateScalesXY(targetWidth);
        const baseRadius = +$(`#${this.displayAndControlElements.VolcanoRadius}`).val()*3;
        const circ = $(`#${this.displayAndControlElements.VolcanoCircleClass}_${volcanoIndex}`);
        const newX=+circ.attr('cx');
        const newY=+circ.attr('cy')-baseRadius;
        this.circleGroup.append("path")
            .attr("class", this.displayAndControlElements.VolcanoGeneMarkerHelperClass)
            .attr("id",`${this.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}_premarker`)
            .attr('cx',newX)
            .attr('cy',newY)
            .attr('si',0)
            .attr("transform",(d)=>{
                if(this.volcanoPhenotype!=="Mutex"){
                    return `translate(${newX},${newY}) rotate(45)`;
                }else{
                    return `translate(${newX},${newY})`;
                }
            })
            .style("display","none");
        const circ2 = $(`#${this.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}_premarker`);
        const xInit = +circ2.attr('cx');
        const helperY = +circ2.attr('cy');
        const helperX = xInit + baseRadius;
        let helperPath=d3Xpath();
        helperPath.moveTo(helperX, helperY);
        helperPath.lineTo(xScale(this.displaySettings.maxXForced*1.25), helperY);
        helperPath.closePath();
        this.volcanoSVG.append("path")
            .attr("class", this.displayAndControlElements.VolcanoGeneMarkerHelperClass)
            .attr("id", `${this.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}`)
            .attr("d", helperPath)
            .style("display","none");
        let markedElementLabelFont=this.fontManager.fontTree.get("volcanoFontTargetSelector").get("markedElementLabels").generateFontCssText();
        this.volcanoSVG.append("text")
            .style("dominant-baseline", "middle")
            .attr("id", `${this.displayAndControlElements.VolcanoGeneMarkerClass}_${volcanoIndex}`)
            .attr("class",`markerText ${this.displayAndControlElements.VolcanoGeneMarkerClass}`)
            .style("alignment-baseline", "middle")
            .append("textPath")
            .attr("xlink:href", `#${this.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}`)
            .style("dominant-baseline", "middle")
            .style("alignment-baseline", "middle")
            .style("text-anchor", "start")
            .attr("startOffset", "0%")
            .style("font",markedElementLabelFont)
            .html(this.data[this.volcanoIndexToDataIndex.get(volcanoIndex)].getLabel(this.references));
        const bboxPre=document.getElementById(`${this.displayAndControlElements.VolcanoGeneMarkerClass}_${volcanoIndex}`).getBBox();
        const labelWidth=+(bboxPre.width)*1.05;
        const bbox={
            labelWidth:labelWidth,
            labelStartX:helperX,
            labelStartY:helperY
        };
        $(`#${this.displayAndControlElements.VolcanoGeneMarkerClass}_${volcanoIndex}`).remove();
        $(`#${this.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}`).remove();
        circ2.remove();
        return bbox;
    }
    plotVolcanoMark(volcanoIndex,bbox){
        let thisRef=this;
        const labelWidth=bbox.labelWidth;
        const labelStartX=bbox.labelStartX;
        const labelStartY=bbox.labelStartY;
        const baseRadius = +$(`#${this.displayAndControlElements.VolcanoRadius}`).val()*3;
        const circ = $(`#${this.displayAndControlElements.VolcanoCircleClass}_${volcanoIndex}`);
        const newX=+circ.attr('cx');
        const newY=+circ.attr('cy')-baseRadius;
        this.circleGroup.append("path")
            .attr("class", this.displayAndControlElements.VolcanoGeneMarkerHelperClass)
            .attr("id",`${this.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}_premarker`)
            .attr('cx',newX)
            .attr('cy',newY)
            .attr('si',0)
            .attr("transform",(d)=>{
                if(this.volcanoPhenotype!=="Mutex"){
                    return `translate(${newX},${newY}) rotate(45)`;
                }else{
                    return `translate(${newX},${newY})`;
                }
            })
            .style("display","none");
        const midLine=+($(`#${this.displayAndControlElements.VolcanoCircleClass}_dummy`).attr('cx'));
        let helperPath=d3Xpath();
        if(labelStartX >= midLine){
            helperPath.moveTo(labelStartX+baseRadius, labelStartY);
            helperPath.lineTo(labelStartX+baseRadius+labelWidth,labelStartY);
        }else{
            helperPath.moveTo(labelStartX-baseRadius-labelWidth, labelStartY);
            helperPath.lineTo(labelStartX-baseRadius,labelStartY);
        }
        helperPath.closePath();
        this.volcanoSVG.append("path")
            .attr("class", this.displayAndControlElements.VolcanoGeneMarkerHelperClass)
            .attr("id", `${this.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}`)
            .attr("d", helperPath)
            .style("display","none");
        const markedElementLabelFont=this.fontManager.fontTree.get("volcanoFontTargetSelector").get("markedElementLabels").generateFontCssText();
        this.volcanoSVG.append("text")
            .style("dominant-baseline", "middle")
            .style("alignment-baseline", "middle")
            .attr("class",`markerText ${this.displayAndControlElements.VolcanoGeneMarkerClass}`)
            .attr("id", `${this.displayAndControlElements.VolcanoGeneMarkerClass}_${volcanoIndex}`)
            .attr("textWidth", labelWidth)
            .append("textPath")
            .attr("xlink:href", `#${this.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}`)
            .style("dominant-baseline", "middle")
            .style("alignment-baseline", "middle")
            .style("display",circ.css("display"))
            .style("font",markedElementLabelFont)
            .html(this.data[this.volcanoIndexToDataIndex.get(volcanoIndex)].getLabel(this.references))
            .call(d3Xdrag()
                .on("start", function(){
                    $(`#${thisRef.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}_dragbridge`).remove()
                })
                .on("drag", ()=>{
                    const xInit = d3Xevent.x;
                    const yInit = d3Xevent.y;
                    d3Xselect(`#${thisRef.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}_premarker`)
                        .attr("cx", xInit)
                        .attr("cy", yInit);
                    const midLine = +($(`#${thisRef.displayAndControlElements.VolcanoCircleClass}_dummy`).attr('cx'));
                    let helperPath = d3Xpath();
                    const textWidth=+($(`#${this.displayAndControlElements.VolcanoGeneMarkerClass}_${volcanoIndex}`).attr("textWidth"));
                    if(xInit >= midLine){
                        helperPath.moveTo(xInit+baseRadius, yInit);
                        helperPath.lineTo(xInit+baseRadius+textWidth,yInit);
                    }else{
                        helperPath.moveTo(xInit-baseRadius-textWidth, yInit);
                        helperPath.lineTo(xInit-baseRadius,yInit);
                    }
                    helperPath.closePath();
                    d3Xselect(`#${thisRef.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}`)
                        .attr("d", helperPath);
                    const elq = $(`#${thisRef.displayAndControlElements.VolcanoGeneMarkerClass}_${volcanoIndex}`);
                    elq.hide();
                    setTimeout(()=>{
                        elq.show();
                    },10);
                })
                .on("end", function(){
                    const circ = $(`#${thisRef.displayAndControlElements.VolcanoCircleClass}_${volcanoIndex}`);
                    const xInit = +circ.attr('cx');
                    let xInitAdjusted = (xInit>=midLine) ? xInit + baseRadius : xInit - baseRadius;
                    let yInit = +circ.attr('cy');
                    const circ2 = $(`#${thisRef.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}_premarker`);
                    let xTarget = +circ2.attr('cx');
                    let yTarget = +circ2.attr('cy');
                    let xTargetAdjusted = (xTarget >= midLine) ? xTarget + baseRadius : xTarget - baseRadius;
                    if(yTarget>yInit){
                        yTarget-=baseRadius;
                    }else if(yTarget<yInit){
                        yTarget+=2*baseRadius;
                    }
                    let textWidth = +$(`#${thisRef.displayAndControlElements.VolcanoGeneMarkerClass}_${volcanoIndex}`).attr("textWidth");
                    if(xTarget>=midLine){
                        if(xTarget<xInitAdjusted){
                            if(xTarget+textWidth<xInitAdjusted){
                                xTargetAdjusted+=textWidth;
                                xInitAdjusted-=2*baseRadius;
                            }else{
                                xTargetAdjusted+=0.5*textWidth;
                                xInitAdjusted-=baseRadius;
                                if(yTarget>yInit){
                                    yInit+=baseRadius
                                }else{
                                    yInit-=baseRadius
                                }
                            }

                        }
                    }else{
                        if(xTarget>xInitAdjusted){
                            if(xTarget-textWidth>xInitAdjusted){
                                xTargetAdjusted-=textWidth;
                                xInitAdjusted+=2*baseRadius;
                            }else{
                                xTargetAdjusted-=0.5*textWidth;
                                xInitAdjusted+=baseRadius;
                                if(yTarget>yInit){
                                    yInit+=baseRadius
                                }else{
                                    yInit-=baseRadius
                                }
                            }
                        }
                    }
                    let helperPath=d3Xpath();
                    helperPath.moveTo(xInitAdjusted,yInit);
                    helperPath.lineTo(xTargetAdjusted,yTarget);
                    helperPath.closePath();
                    thisRef.volcanoSVG.append("path")
                        .attr("class", thisRef.displayAndControlElements.VolcanoGeneMarkerHelperClass)
                        .attr("id", `${thisRef.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}_dragbridge`)
                        .attr("d", helperPath)
                        .style("stroke","Black")
                        .style("display","inline");
                }));
    }
    markVolcanoItem(volcanoIndex,drawPhenotype){
        let marker = $(`#${this.displayAndControlElements.VolcanoGeneMarkerClass}_${volcanoIndex}`);
        if(marker.length){
            marker.remove();
            $(`#${this.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}_dragbridge`).remove();
            $(`#${this.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}_premarker`).remove();
            $(`#${this.displayAndControlElements.VolcanoGeneMarkerHelperClass}_${volcanoIndex}`).remove();
            $("#vennContentVolcano").empty();
            $("#geneExpressionContentVolcano").empty();
            $('#rppaExpressionSelectorVolcano').empty();
            $("#rppaExpressionContentVolcano").empty();
            $('#volcanoGeneDescription').html("");
            $("#volcanoGeneDescriptionPaneControl").css("display","none");
            $('#volcanoClearGene').css('display','none');
            $('.nav-tabs a[href="#controlsPane"]').tab("show");
            this.displaySettings.markedVolcanoItems.delete(volcanoIndex);
            this.displaySettings.lastVolcanoItemIndex=-1;
            if(this.displaySettings.markedVolcanoItems.size===0){
                $('#geneSelectorControlsForMarkedGenes').css('display','none');
                $('#clearMarkedGenesOnCytoband').css('display','none');
            }
            return false;
        }
        else{
            $('#geneSelectorControlsForMarkedGenes').css('display','inline');
            $('#volcanoClearGene').css('display','inline');
            if($('#cytobandSelector').val()!=""){
                $('#clearMarkedGenesOnCytoband').css('display','inline');
            }
            this.displaySettings.markedVolcanoItems.add(volcanoIndex);
            this.displaySettings.lastVolcanoIndex=volcanoIndex;
            const bbox = this.premarkVolcanoItem(volcanoIndex);
            this.plotVolcanoMark(volcanoIndex,bbox);
            if(drawPhenotype){
                this.currentVolcanoIndex=volcanoIndex;
                const tmpTadOffsets = this.readTadOffsetsForPhenotypePlots();
                this.drawSinglePhenotypePlots(volcanoIndex,tmpTadOffsets[0],tmpTadOffsets[1]);
            }
            return true;
        }
    }

    readTadOffsetsForPhenotypePlots(){
        let svTadOffset=-1;
        let offIndelTadOffset=-1;
        if(this.volcanoTypePrefix==="variant"){
            for(let i=0;i<4;++i){
                if($(`#allow_${this.volcanoId}OffIndel${i}`).is(':checked')){
                    offIndelTadOffset=i;
                }
                if($(`#allow_${this.volcanoId}Sv${i}`).is(':checked')){
                    svTadOffset=i;
                }
            }
        }else{
            svTadOffset=1;
            offIndelTadOffset=-1;
        }
        $('#svTadOffsetSelectorVolcano').val(`${svTadOffset}`);
        $('#offIndelTadOffsetSelectorVolcano').val(`${offIndelTadOffset}`);
        return[svTadOffset,offIndelTadOffset];
    }
    drawVennDiagram(volcanoIndex){
        let volcanoItem=this.data[this.volcanoIndexToDataIndex.get(volcanoIndex)];
        let chart = venn.VennDiagram();
        let subcohort1Name=this.selectionManager.registeredSubcohortNames.get(this.group1Index);
        let subcohort2Name=this.selectionManager.registeredSubcohortNames.get(this.group2Index);
        d3Xselect("#vennContentVolcano")
            .datum(volcanoItem.generateVennSets(
                this.references,subcohort1Name,subcohort2Name,this.subcohort12commonDonors))
            .call(chart);
    }
    drawSinglePhenotypePlots(volcanoIndex,svTadOffset,offIndelTadOffset){
        let thisRef=this;
        $('#svTadOffsetSelectorVolcano').off("change").on("change",function(){
            let svTadOffset=parseInt(this.value);
            let offIndelTadOffset=parseInt($('#offIndelTadOffsetSelectorVolcano').val());
            thisRef.drawSinglePhenotypePlots(thisRef.currentVolcanoIndex,svTadOffset,offIndelTadOffset);
        });
        $('#offIndelTadOffsetSelectorVolcano').off("change").on("change",function(){
            const svTadOffset=parseInt($('#svTadOffsetSelectorVolcano').val());
            const offIndelTadOffset=parseInt(this.value);
            thisRef.drawSinglePhenotypePlots(thisRef.currentVolcanoIndex,svTadOffset,offIndelTadOffset);
        });
        $("#vennContentVolcano").empty();
        $('#geneExpressionSelectorVolcano').empty();
        $("#geneExpressionContentVolcano").empty();
        $('#rppaExpressionSelectorVolcano').empty();
        $("#rppaExpressionContentVolcano").empty();
        $('#geneExpressionSelectorVolcanoGroup').css('display','none');
        $('#rppaExpressionSelectorVolcanoGroup').css('display','none');
        if(this.truePhenotype==="gene" && !this.mutexMode){
            let mainGeneIndex=this.data[this.volcanoIndexToDataIndex.get(volcanoIndex)].gene;
            if(!this.correlationMode || (this.anchorGeneId===mainGeneIndex)){
                this.singleGeneExpression = new SinglePhenotypeExpression(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,true,"gene",mainGeneIndex,null,svTadOffset,offIndelTadOffset,this.group1Index,this.group2Index,thisRef.fontManager);
            }else{
                this.singleGeneExpression = new SinglePhenotypeExpression(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,true,"gene",this.anchorGeneId,mainGeneIndex,svTadOffset,offIndelTadOffset,this.group1Index,this.group2Index,thisRef.fontManager);
            }
            if(this.cohortMetadata.rppaExpressionAvailable && !this.correlationMode){
                let antibodies=this.references.genes.get(mainGeneIndex).rppaIds;
                if(antibodies.length>0){
                    $('#rppaExpressionSelectorVolcano').append(`<option value=${-1}>Select RPPA Rppa</option>`);
                    let geneIndices=[];
                    antibodies.forEach((rppa)=>{
                        this.references.rppaAntibodies[rppa].geneIds.forEach((geneId)=>{
                            geneIndices.push(geneId);
                        });
                    });
                    geneIndices=Array.from(new Set(geneIndices)).sort();
                    if(geneIndices.length>1){
                        $('#geneExpressionSelectorVolcanoGroup').css('display','inline');
                        $('#geneExpressionSelectorVolcano').append(`<option value=${mainGeneIndex}>${this.references.genes.get(mainGeneIndex).geneName}</option>`);
                        geneIndices.forEach((geneIndex)=>{
                            $('#geneExpressionSelectorVolcano').append(`<option value=${geneIndex}>${this.references.genes.get(geneIndex).geneName}</option>`);
                        });
                        $('#geneExpressionSelectorVolcano').off('change').on('change',function(){
                            thisRef.singleGeneExpression = new SinglePhenotypeExpression(thisRef.commonSettings,thisRef.references,thisRef.cohortMetadata,thisRef.selectionManager,true,"gene",parseInt(this.value),null,svTadOffset,offIndelTadOffset,thisRef.group1Index,thisRef.group2Index,thisRef.fontManager);
                        });
                    }
                    antibodies.forEach((rppa)=>{
                        $('#rppaExpressionSelectorVolcano').append(`<option value=${rppa}>${this.references.rppaAntibodies[rppa].rppaName}</option>`);
                    });
                    $('#rppaExpressionSelectorVolcano').off('change').on('change',function(){
                        if(parseInt(this.value)!==-1){
                            thisRef.singleRppaExpression = new SinglePhenotypeExpression(thisRef.commonSettings,thisRef.references,thisRef.cohortMetadata,thisRef.selectionManager,true,"rppa",parseInt(this.value),null,svTadOffset,offIndelTadOffset,thisRef.group1Index,thisRef.group2Index,thisRef.fontManager);
                        }
                    });
                }
            }
        }else if(this.mutexMode){
            let volcanoItem=this.data[this.volcanoIndexToDataIndex.get(volcanoIndex)];
            this.drawVennDiagram(volcanoIndex);
            if(volcanoItem.mutexEntryType===3){
                let mainGeneIndex=volcanoItem.identifier;
                this.singleGeneExpression = new SinglePhenotypeExpression(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,true,"gene",mainGeneIndex,null,svTadOffset,offIndelTadOffset,this.group1Index,this.group2Index,thisRef.fontManager);
                if(this.cohortMetadata.rppaExpressionAvailable){
                    let antibodies=this.references.genes.get(mainGeneIndex).rppaIds;
                    if(antibodies.length>0){
                        $('#rppaExpressionSelectorVolcano').append(`<option value=${-1}>Select RPPA Rppa</option>`);
                        let geneIndices=[];
                        antibodies.forEach((rppa)=>{
                            this.references.rppaAntibodies[rppa].geneIds.forEach((geneId)=>{
                                geneIndices.push(geneId);
                            });
                        });
                        geneIndices=Array.from(new Set(geneIndices)).sort();
                        if(geneIndices.length>1){
                            $('#geneExpressionSelectorVolcanoGroup').css('display','inline');
                            $('#geneExpressionSelectorVolcano').append(`<option value=${mainGeneIndex}>${this.references.genes.get(mainGeneIndex).geneName}</option>`);
                            geneIndices.forEach((geneIndex)=>{
                                $('#geneExpressionSelectorVolcano').append(`<option value=${geneIndex}>${this.references.genes.get(geneIndex).geneName}</option>`);
                            });
                            $('#geneExpressionSelectorVolcano').off('change').on('change',function(){
                                thisRef.singleGeneExpression = new SinglePhenotypeExpression(thisRef.commonSettings,thisRef.references,thisRef.cohortMetadata,thisRef.selectionManager,true,"gene",parseInt(this.value),null,svTadOffset,offIndelTadOffset,thisRef.group1Index,thisRef.group2Index,thisRef.fontManager);
                            });
                        }
                        antibodies.forEach((rppa)=>{
                            $('#rppaExpressionSelectorVolcano').append(`<option value=${rppa}>${this.references.rppaAntibodies[rppa].rppaName}</option>`);
                        });
                        $('#rppaExpressionSelectorVolcano').off('change').on('change',function(){
                            if(parseInt(this.value)!==-1){
                                thisRef.singleRppaExpression = new SinglePhenotypeExpression(thisRef.commonSettings,thisRef.references,thisRef.cohortMetadata,thisRef.selectionManager,true,"rppa",parseInt(this.value),null,svTadOffset,offIndelTadOffset,thisRef.group1Index,thisRef.group2Index,thisRef.fontManager);
                            }
                        });
                    }
                }
            }
        }else if(this.truePhenotype==="rppa" && !this.correlationMode){
            const mainRppa=this.data[this.volcanoIndexToDataIndex.get(volcanoIndex)].rppa;
            this.singleRppaExpression = new SinglePhenotypeExpression(this.commonSettings,this.references,this.cohortMetadata,this.selectionManager,true,"rppa",mainRppa,null,svTadOffset,offIndelTadOffset,this.group1Index,this.group2Index,thisRef.fontManager);
            let antibodies=[];
            let geneIndices = this.data[this.volcanoIndexToDataIndex.get(volcanoIndex)].getGeneIndices(this.references);
            geneIndices.forEach((geneIndex)=>{
                this.references.genes.get(geneIndex).rppaIds.forEach((rppa)=>{
                    antibodies.push(rppa);
                })
            });
            antibodies=Array.from(new Set(antibodies)).sort();
            if(antibodies.length>0){
                antibodies.forEach((rppa)=>{
                    this.references.rppaAntibodies[rppa].geneIds.forEach((geneId)=>{
                        geneIndices.push(geneId);
                    });
                });
                geneIndices=Array.from(new Set(geneIndices)).sort();
                $('#geneExpressionSelectorVolcanoGroup').css('display','inline');
                $('#geneExpressionSelectorVolcano').append(`<option value=${-1}>Select Gene</option>`);
                geneIndices.forEach((geneIndex)=>{
                    $('#geneExpressionSelectorVolcano').append(`<option value=${geneIndex}>${this.references.genes.get(geneIndex).geneName}</option>`);
                });
                $('#geneExpressionSelectorVolcano').off('change').on('change',function(){
                    if(parseInt(this.value)!==-1){
                        thisRef.singleGeneExpression = new SinglePhenotypeExpression(thisRef.commonSettings,thisRef.references,thisRef.cohortMetadata,thisRef.selectionManager,true,"gene",parseInt(this.value),null,svTadOffset,offIndelTadOffset,thisRef.group1Index,thisRef.group2Index,thisRef.fontManager);
                    }
                });
                if(antibodies.length>1){
                    $('#rppaExpressionSelectorVolcanoGroup').css('display','inline');
                    antibodies.forEach((rppa)=>{
                        $('#rppaExpressionSelectorVolcano').append(`<option value=${rppa}>${this.references.rppaAntibodies[rppa].rppaName}</option>`);
                    });
                    $('#rppaExpressionSelectorVolcano').off('change').on('change',function(){
                        thisRef.singleRppaExpression = new SinglePhenotypeExpression(thisRef.commonSettings,thisRef.references,thisRef.cohortMetadata,thisRef.selectionManager,true,"rppa",parseInt(this.value),null,svTadOffset,offIndelTadOffset,thisRef.group1Index,thisRef.group2Index,thisRef.fontManager);
                    });
                }
            }
        }
    }
    markGene(geneIndex,initialVolcanoIndex,multiMarkMode){
        const volcanoIndices=this.references.genes.get(geneIndex).currentVolcanoContributions.get(this.displayAndControlElements.VolcanoIndices);
        if(volcanoIndices===undefined||volcanoIndices.size===0){
            return;
        }
        let thisRef = this;
        let lastMark = false;
        if(initialVolcanoIndex===-1){
            initialVolcanoIndex=Array.from(volcanoIndices)[0];
        }
        this.displaySettings.lastVolcanoItemIndex=initialVolcanoIndex;
        lastMark=thisRef.markVolcanoItem(initialVolcanoIndex,!multiMarkMode);
        volcanoIndices.forEach((volcanoIndex)=>{
            if(volcanoIndex!==initialVolcanoIndex){
                lastMark=thisRef.markVolcanoItem(volcanoIndex,false);
            }
        });
        if(!lastMark){
            volcanoIndices.forEach((volcanoIndex)=>{
                this.displaySettings.markedVolcanoItems.delete(volcanoIndex);
            });
            $('#geneSelectorControlsForMarkedGenes').css('display','none');
            $('#clearMarkedGenesOnCytoband').css('display','none');
            this.displaySettings.lastVolcanoItemIndex=-1;
        }
        if(!multiMarkMode){
            $("#volcanoGeneDescriptionPaneControl").css("display","inline");
            $('.nav-tabs a[href="#volcanoGeneDescriptionPane"]').tab("show");
            $('#volcanoAddGeneExpressionToMetadata').css('display','inline');
            $('#volcanoAddGeneVariantsToMetadata').css('display','inline');
            this.updateMarkedVolcanoItemDisplay();
        }
    }
    updateMarkedVolcanoItemDisplay(){
        if(this.displaySettings.markedVolcanoItems.size===0){
            $(`#${this.volcanoId}MarkedEntriesListGroup`).css("display","none");
            $(`#${this.volcanoId}MarkedEntriesList`).empty();
        }else{
            let markedVolcanoItemExportList=[];
            this.displaySettings.markedVolcanoItems.forEach((volcanoItemIndex)=>{
               let dataIndex = this.volcanoIndexToDataIndex.get(volcanoItemIndex);
                markedVolcanoItemExportList.push(this.data[dataIndex].getName(this.references));
            });
            $(`#${this.volcanoId}MarkedEntriesListGroup`).css("display","inline");
            $(`#${this.volcanoId}MarkedEntriesList`).html(markedVolcanoItemExportList.join('<br>'));
        }
    }
    removeLastMarkedGene(){
        if(this.displaySettings.lastVolcanoItemIndex!==-1){
            this.markVolcanoItem(this.displaySettings.lastVolcanoItemIndex,false);
        }
    }
    hideLastMarkedGene(){
        if(this.displaySettings.lastVolcanoItemIndex!==-1){
            this.hideVolcanoItem(this.displaySettings.lastVolcanoItemIndex);
        }
    }
    clearMarkedGenes(){
        let itemsToRemove=[];
        this.displaySettings.markedVolcanoItems.forEach((volcanoIndex)=>{
            itemsToRemove.push(volcanoIndex);
        });
        itemsToRemove.forEach((volcanoIndex)=>{
            this.markVolcanoItem(volcanoIndex,false);
        });
        this.displaySettings.markedVolcanoItems.clear();
        $('#geneSelectorControlsForMarkedGenes').css('display','none');
        $('#volcanoClearGene').css('display','none');
        $('#clearMarkedGenesOnCytoband').css('display','none');
        this.updateMarkedVolcanoItemDisplay();
    }
    setCurrentGeneAsTopY(){
        if(this.currentVolcanoIndex!==-1){
            this.displaySettings.maxYForced=Math.abs(this.data[this.volcanoIndexToDataIndex.get(this.currentVolcanoIndex)].y);
            this.displaySettings.modifiedVolcanoAxisY=true;
            $(`#${this.displayAndControlElements.VolcanoResetAxis}`).css("display","inline");
            setTimeout(()=>{this.plotVolcano();},0);
        }
    }

    setCurrentGeneAsTopX(){
        if(this.currentVolcanoIndex!==-1){
            let currentFc=Math.abs(this.data[this.volcanoIndexToDataIndex.get(this.currentVolcanoIndex)].x);
            this.displaySettings.maxXForced=currentFc*(1.05/1.1);
            this.displaySettings.modifiedVolcanoAxisX=true;
            $(`#${this.displayAndControlElements.VolcanoResetAxis}`).css("display","inline");
            setTimeout(()=>{this.plotVolcano();},0);
        }
    }
    pubmedCurrentGene(){
        this.data[this.volcanoIndexToDataIndex.get(this.currentVolcanoIndex)].getGeneIndices().forEach((geneId)=>{
            this.references.genes.get(geneId).searchInPubMed(this.cohortMetadata.diseaseNameAlternatives);
        });
    }
    addCurrentGeneExpressionToMetadata(){
        if(this.currentVolcanoIndex!==-1){
            $('#volcanoAddGeneExpressionToMetadata').css('display','none');
            this.data[this.volcanoIndexToDataIndex.get(this.currentVolcanoIndex)].getGeneIndices().forEach((geneIndex)=>{
                this.cohortMetadata.addGeneExpressionToMetadata(geneIndex);
            });
        }
    }
    addCurrentGeneVariantsToMetadata(){
        if(this.currentVolcanoIndex!==-1){
            $('#volcanoAddGeneVariantsToMetadata').css('display','none');
            this.data[this.volcanoIndexToDataIndex.get(this.currentVolcanoIndex)].getGeneIndices().forEach((geneIndex)=>{
                this.cohortMetadata.addGeneVariantsToMetadata(geneIndex);
            });
        }
    }
    resetAxis(){
        this.displaySettings.maxXForced=this.displaySettings.maxX;
        this.displaySettings.maxYForced=this.displaySettings.maxY;
        $(`#${this.displayAndControlElements.VolcanoResetAxis}`).css("display","none");
        setTimeout(()=>{this.plotVolcano();},0);
    }

    cleanupPlot(){
        d3Xselect(`#${this.displayAndControlElements.VolcanoSvg}`).selectAll("*").remove();
        $(`#${this.displayAndControlElements.VolcanoSvg}`).remove();
        $(`#${this.displayAndControlElements.VolcanoContent}`).empty();
        $(`#${this.volcanoId}ProgressBarGroup`).css("display","none");
        $(`#${this.volcanoId}ProgressBar`).css("width","0%");
        this.constructed=false;
    }


    plotTitle(){
        $(`#${this.displayAndControlElements.VolcanoTitle}`).remove();
        $(`#${this.displayAndControlElements.VolcanoTitleFrame}`).remove();
        let currentWidth = $(`#${this.displayAndControlElements.VolcanoContent}Pre`).width();
        let targetWidth = currentWidth*0.7;
        let helperPath=d3Xpath();
        helperPath.moveTo(0, -3);
        helperPath.lineTo(targetWidth,-3);
        helperPath.closePath();
        this.volcanoSVG.append("path")
            .attr("id", this.displayAndControlElements.VolcanoTitleFrame)
            .attr("d", helperPath);
        this.volcanoTitle="";
        if(this.volcanoTypePrefix==="subcohort"){
            if(this.volcanoPhenotype!=="Mutex"){
                this.volcanoTitle=this.cohortMetadata.getCohortTitleSubcohortExpressionMode(
                    this.volcanoPhenotype,
                    this.selectionManager.registeredSubcohorts.get(this.group1Index),
                    this.selectionManager.registeredSubcohorts.get(this.group2Index),
                    this.selectionManager.registeredSubcohortNames.get(this.group1Index),
                    this.selectionManager.registeredSubcohortNames.get(this.group2Index));
            }else{
                this.volcanoTitle=this.cohortMetadata.getCohortTitleSubcohortMutexMode(
                    this.selectionManager.registeredSubcohorts.get(this.group1Index),
                    this.selectionManager.registeredSubcohorts.get(this.group2Index),
                    this.selectionManager.registeredSubcohortNames.get(this.group1Index),
                    this.selectionManager.registeredSubcohortNames.get(this.group2Index));
            }
        }else if(this.volcanoTypePrefix==="variant"){
            this.volcanoTitle=`${this.cohortMetadata.getCohortTitleExpressionMode(this.volcanoPhenotype)} ${Array.from(this.currentComparisonClasses[1]).map((x)=>this.references.comparisonTypes[x]).join(' & ')}`;
        }else if(this.volcanoTypePrefix==="correlation"){
            this.volcanoTitle=this.cohortMetadata.getCohortTitleCorrelationMode(
                this.volcanoPhenotype,
                this.selectionManager.registeredSubcohorts.get(this.currentSubcohortIndex),
                this.selectionManager.registeredSubcohortNames.get(this.currentSubcohortIndex),
                this.anchorGeneId);
        }
        let titleFont=this.fontManager.fontTree.get("volcanoFontTargetSelector").get("title").generateFontCssText();
        this.volcanoSVG.append("text")
            .append("textPath")
            .attr("class","markerTextCohort")
            .attr("xlink:href", `#${this.displayAndControlElements.VolcanoTitleFrame}`)
            .attr("id",this.displayAndControlElements.VolcanoTitle)
            .style("text-anchor", "start")
            .attr("startOffset", "0%")
            .style("display","inline")
            .style("font",titleFont)
            .html(this.volcanoTitle);
    }
    plotAxis(){
        $(`#${this.volcanoId}YAxis`).remove();
        $(`#${this.volcanoId}YAxisTitle`).remove();
        $(`#${this.volcanoId}XAxis`).remove();
        $(`#${this.volcanoId}XAxisTitle`).remove();
        const baseLineY=+($(`#${this.displayAndControlElements.VolcanoCircleClass}_dummy`).attr('cy'));
        const xAxisLabelFont=this.fontManager.fontTree.get("volcanoFontTargetSelector").get("xAxisLabels").generateFontCssText();
        const yAxisLabelFont=this.fontManager.fontTree.get("volcanoFontTargetSelector").get("yAxisLabels").generateFontCssText();
        const xAxisTitleFont=this.fontManager.fontTree.get("volcanoFontTargetSelector").get("xAxisTitle").generateFontCssText();
        const yAxisTitleFont=this.fontManager.fontTree.get("volcanoFontTargetSelector").get("yAxisTitle").generateFontCssText();

        const currentWidth = $(`#${this.displayAndControlElements.VolcanoContent}Pre`).width();
        const targetWidth = currentWidth*0.7;
        const [xScale,yScale]=this.generateScalesXY(targetWidth);
        this.volcanoSVG.append("g")
            .attr("id",`${this.volcanoId}YAxis`)
            .attr("class", "axis axis--y")
            .call(d3XaxisLeft(yScale).tickFormat((x)=>{
                if(this.volcanoTypePrefix==="variant"){
                    return Math.pow(10,-x).toExponential(3);
                }else if(this.volcanoTypePrefix==="subcohort"){
                    return Math.exp(-x).toExponential(3);
                }else if(this.volcanoTypePrefix==="correlation"){
                    return x;
                }
            }))
            .selectAll("text")
            .style("font", yAxisLabelFont);
        let yAxisTitle=this.yFieldName;
        const testFullName=getTestFullName(this.testName);
        if(testFullName.length>0){
            yAxisTitle=`${yAxisTitle} (${testFullName})`;
        }else{
            yAxisTitle=`&#124;${yAxisTitle}&#124;`;
        }
        this.volcanoSVG.append("text")
            .attr("class", "markerText")
            .attr("id", `${this.volcanoId}YAxisTitle`)
            .attr("transform", "rotate(-90)")
            .attr("y",0 - (baseLineY / 10))
            .attr("x",0 - (baseLineY / 2))
            .attr("dy", "1em")
            .style("font", yAxisTitleFont)
            .style("text-anchor", "middle")
            .html(yAxisTitle);
        this.volcanoSVG.append("g")
            .attr("id",`${this.volcanoId}XAxis`)
            .attr("class", "axis axis--x")
            .call(d3XaxisBottom(xScale))
            .attr("transform","translate(0,"+baseLineY+")")
            .style("font", xAxisLabelFont);

        let xAxisTitle = this.xFieldName;
        if(this.volcanoTypePrefix!=="correlation"){
            xAxisTitle = "Fold Change by Difference of " + xAxisTitle;
        }

        this.volcanoSVG.append("text")
            .attr("class", "markerText")
            .attr("id",`${this.volcanoId}XAxisTitle`)
            .attr("y", baseLineY*1.03)
            .attr("x",baseLineY/2)
            .attr("dy", "1em")
            .style("font", xAxisTitleFont)
            .style("text-anchor", "middle")
            .text(xAxisTitle);
    }
    resetSelectionRect(){
        this.rectStart={};
        this.rectEnd={};
        $(`#${this.volcanoTypePrefix}${this.volcanoPhenotype}VolcanoSelectBox`).remove();
    }
    plotVolcano(){
        let thisRef=this;
        this.cleanupPlot();
        const currentWidth = $(`#${this.displayAndControlElements.VolcanoContent}Pre`).width();
        this.displaySettings.volcanoVbox=`${-currentWidth*0.1} ${-currentWidth*0.02} ${currentWidth*0.8} ${currentWidth*0.8}`;
        this.volcanoSVG = d3Xselect(`#${this.displayAndControlElements.VolcanoContent}`)
            .classed("svg-container", true)
            .append("svg")
            .classed("svg-content-responsive", true)
            .attr("viewBox", this.displaySettings.volcanoVbox)
            .attr("id",this.displayAndControlElements.VolcanoSvg)
            .attr("preserveAspectRatio", "xMaxYMin meet")
            .attr("width", "95%")
            .attr("height", "95%");
        this.volcanoSVG
            .on("mousedown", function() {
                thisRef.rectStart = d3Xmouse(this);
                if(thisRef.rectStart.x>thisRef.svgWidth||thisRef.rectStart.y>thisRef.targetHeight){
                    thisRef.resetSelectionRect();
                    return;
                }
                if(thisRef.rectStart.x<0||thisRef.rectStart.y<0){
                    thisRef.resetSelectionRect();
                    return;
                }
                thisRef.volcanoSVG.append("rect")
                    .attr("id",`${thisRef.volcanoId}SelectBox`)
                    .attr("x",thisRef.rectStart[0])
                    .attr("y",thisRef.rectStart[1])
                    .attr("width",0)
                    .attr("height",0)
                    .style("fill","none")
                    .style("stroke","Black")
                    .style("stroke-width",0.6);
            })
            .on("mousemove", function() {
                let s = thisRef.volcanoSVG.select(`#${thisRef.volcanoId}SelectBox`);
                if(!s.empty()) {
                    let p = d3Xmouse(this);
                    let d = {
                            x       : +s.attr("x"),
                            y       : +s.attr("y"),
                            width   : +s.attr("width"),
                            height  : +s.attr("height")
                        };
                    let move = {
                            x : p[0] - d.x,
                            y : p[1] - d.y
                        };
                    if(move.x < 1 || (move.x*2<d.width)) {
                        d.x = p[0];
                        d.width -= move.x;
                    } else {
                        d.width = move.x;
                    }

                    if(move.y < 1 || (move.y*2<d.height)) {
                        d.y = p[1];
                        d.height -= move.y;
                    } else {
                        d.height = move.y;
                    }
                    s.attr("x",d.x)
                        .attr("y",d.y)
                        .attr("width",d.width)
                        .attr("height",d.height);
                }
            })
            .on("mouseup", function() {
                thisRef.volcanoSVG.select(`#${thisRef.volcanoId}SelectBox`).remove();
                if(thisRef.commonSettings.interactionLock){
                    return;
                }
                thisRef.commonSettings.lock();
                thisRef.rectEnd = d3Xmouse(this);
                if(thisRef.rectEnd.x>thisRef.svgWidth||thisRef.rectEnd.y>thisRef.targetHeight){
                    thisRef.resetSelectionRect();
                    return;
                }
                if(thisRef.rectEnd.x<0||thisRef.rectEnd.y<0){
                    thisRef.resetSelectionRect();
                    return;
                }
                const currentWidth = $(`#${thisRef.displayAndControlElements.VolcanoContent}Pre`).width();
                const targetWidth = currentWidth*0.7;
                const [xScale,yScale]=thisRef.generateScalesXY(targetWidth);
                const xs=[xScale.invert(thisRef.rectStart[0]),xScale.invert(thisRef.rectEnd[0])].sort(function(a, b) {
                    if (a < b) {return -1;}
                    if (a > b) {return 1;}
                    return -1
                });
                const ys=[yScale.invert(thisRef.rectStart[1]),yScale.invert(thisRef.rectEnd[1])].sort(function(a, b) {
                    if (a < b) {return -1;}
                    if (a > b) {return 1;}
                    return -1
                });
                if(thisRef.volcanoTypePrefix!=="correlation"){
                    for(let i=0;i<thisRef.data.length;++i){
                        const index=thisRef.data[i].volcanoItemIndex;
                        const xData=thisRef.data[i].x;
                        const yData=thisRef.data[i].y;
                        if(!thisRef.displaySettings.markedVolcanoItems.has(index)){
                            if(!thisRef.displaySettings.hiddenVolcanoItems.has(index)){
                                if(ys[0]<yData&&yData<ys[1]){
                                    if(xs[0]<xData&&xData<xs[1]){
                                        thisRef.markVolcanoItem(index,false);
                                    }
                                }
                            }
                        }
                    }
                }else{
                    for(let i=0;i<thisRef.data.length;++i){
                        const index=thisRef.data[i].volcanoItemIndex;
                        const xData=thisRef.data[i].x;
                        const yData=Math.abs(thisRef.data[i].y);
                        if(!thisRef.displaySettings.markedVolcanoItems.has(index)){
                            if(!thisRef.displaySettings.hiddenVolcanoItems.has(index)){
                                if(ys[0]<yData&&yData<ys[1]){
                                    if(xs[0]<xData&&xData<xs[1]){
                                        thisRef.markVolcanoItem(index,false);
                                    }
                                }
                            }
                        }
                    }
                }

                thisRef.updateMarkedVolcanoItemDisplay();
                thisRef.rectStart={};
                thisRef.rectEnd={};
                thisRef.commonSettings.releaseLock();
            });
        const targetWidth = currentWidth*0.7;
        const [xScale,yScale]=thisRef.generateScalesXY(targetWidth);
        this.volcanoSVG.append("rect")
            .attr("id",this.displayAndControlElements.VolcanoFrame)
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", targetWidth)
            .attr("width", targetWidth)
            .style("stroke", "Black")
            .style("fill", "none")
            .style("stroke-width", 1)
            .on("click",function(){
                if(thisRef.commonSettings.interactionLock){
                    return;
                }
                thisRef.commonSettings.fastLock();
                this.setAttribute("display","none");
                thisRef.commonSettings.fastRelease();
            });
        this.plotTitle();
        setTimeout(()=>{},0);
        this.circleGroup=this.volcanoSVG.append("g");
        this.circleGroup
            .append("path")
            .attr("class", this.displayAndControlElements.VolcanoCircleClass)
            .attr("id",`${this.displayAndControlElements.VolcanoCircleClass}_dummy`)
            .attr('cx',xScale(0))
            .attr('cy',yScale(0))
            .attr('si',0)
            .attr("transform",`translate(${xScale(0)},${yScale(0)}) rotate(45)`)
            .style("display","none");
        this.circleGroup.selectAll(`.${this.displayAndControlElements.VolcanoCircleClass}`)
            .data(this.data)
            .enter().append("path")
            .attr("class", this.displayAndControlElements.VolcanoCircleClass)
            .attr("id",(d)=>{
                return `${this.displayAndControlElements.VolcanoCircleClass}_${d.volcanoItemIndex}`;
            })
            .attr("cx",(d)=>{
                return xScale(d.x);
            })
            .attr("cy",(d)=>{
                return yScale(Math.abs(d.y));
            })
            .attr('si',(d)=>{
                if(this.volcanoPhenotype!=="Mutex"){
                    return 3;
                }else{
                    return d.mutexEntryType;
                }
            })
            .attr("transform",(d)=>{
                if(this.volcanoPhenotype!=="Mutex"){
                    return `translate(${xScale(d.x)},${yScale(Math.abs(d.y))}) rotate(45)`;
                }else{
                    return `translate(${xScale(d.x)},${yScale(Math.abs(d.y))})`;
                }
            })
            .style('fill', (d)=>{
                const geneIndices=d.getGeneIndices(this.references);
                for(let i = 0; i<geneIndices.length; ++i) {
                    if (this.references.genes.get(geneIndices[i]).cancerGene) {
                        return "#e41a1c";
                    }
                }
                return "#377eb8";
            })
            .append("svg:title")
            .text((d)=>{
                return d.getHoverLabel(this.references);
            });
        this.circleGroup.on("click", ()=> {
            if(this.commonSettings.interactionLock){
                return;
            }
            this.commonSettings.fastLock();
            $('#vennContentVolcano').empty();
            $('#geneExpressionContentVolcano').empty();
            $('#rppaExpressionContentVolcano').empty();
            let target=d3Xselect(d3Xevent.target).datum();
            let targetGenes=null;
            try{
                targetGenes=target.getGeneIndices(this.references);
            }catch(e){

            }
            if(targetGenes!==null){
                if(targetGenes.length>0){
                    $('#tadOffsetSelectorVolcanoGroup').css("display","inline");
                    targetGenes.forEach((geneIndex)=>{
                        this.markGene(geneIndex,target.volcanoItemIndex,false);
                    });
                }else{
                    $('#tadOffsetSelectorVolcanoGroup').css("display","none");
                    $('.nav-tabs a[href="#volcanoGeneDescriptionPane"]').tab("show");
                    this.drawVennDiagram(target.volcanoItemIndex);
                    this.markVolcanoItem(target.volcanoItemIndex,false);
                }

            }
            this.commonSettings.fastRelease();
        });

        this.replotAllMarked();
        this.adjustRadius(+$(`#${this.displayAndControlElements.VolcanoRadius}`).val()*12);
        this.plotAxis();
        this.constructed=true;
        setTimeout(()=>{this.adjustVisibility();},0);
    }
    replotAllMarked(){
        let itemsToMark=[];
        this.displaySettings.markedVolcanoItems.forEach((volcanoIndex)=>{
            itemsToMark.push(volcanoIndex);
        });
        this.clearMarkedGenes();
        this.displaySettings.markedVolcanoItems.clear();
        itemsToMark.forEach((volcanoIndex) => {
            this.markVolcanoItem(volcanoIndex,false);
        });
    }
    getMarkedGeneList(){
        let geneIndices=new Set();
        this.displaySettings.markedVolcanoItems.forEach((volcanoItemIndex)=>{
            if($(`#${this.displayAndControlElements.VolcanoCircleClass}_${volcanoItemIndex}`).css("display")!=="none"){
                this.data[this.volcanoIndexToDataIndex.get(volcanoItemIndex)].getGeneIndices().forEach((geneIndex)=>{
                    geneIndices.add(geneIndex)
                });
            }
        });

        let geneList=[];
        geneIndices.forEach((geneIndex)=>{
            // reactomeInput.push(padENSG(geneIndex));
            geneList.push(this.references.genes.get(geneIndex).geneName);
        });
        return geneList;
    }
    saveVolcanoSvg(){
        saveSvg(this.displayAndControlElements.VolcanoSvg,`${this.volcanoTitle.replace(/ /g,"_")}_${this.volcanoId}.svg`);
    }
    setDataXfield(newXField){
        for(let i=0; i<this.data.length;++i){
            this.data[i].setX(newXField);
        }
    }
    setDataYfield(newYField){
        for(let i=0; i<this.data.length;++i){
            this.data[i].setY(newYField);
        }
    }
    generateScalesXY(targetWidth){
        const xScale = d3XscaleLinear().domain([-this.displaySettings.maxXForced*1.1,this.displaySettings.maxXForced*1.1]).range([0, targetWidth]);
        const yScale = d3XscaleLinear().domain([0, this.displaySettings.maxYForced*1.05]).range([targetWidth, 0]);
        return [xScale,yScale];
        // if(this.correlationMode){
        //     const xScale = d3XscaleLinear().domain([-1.05,1.05]).range([0, targetWidth]);
        //     const yScale = d3XscaleLinear().domain([0,1.05]).range([targetWidth, 0]);
        //     return [xScale,yScale];
        // }else{
        //     const xScale = d3XscaleLinear().domain([-this.displaySettings.maxXForced*1.1,this.displaySettings.maxXForced*1.1]).range([0, targetWidth]);
        //     const yScale = d3XscaleLinear().domain([0, this.displaySettings.maxYForced*1.05]).range([targetWidth, 0]);
        //     return [xScale,yScale];
        // }
    }
    setFieldNamesXY(){
        let xFieldName=$(`input[name=${this.displayAndControlElements.VolcanoXRadioButton}]:checked`).val();
        let yFieldName="pValLog10";
        let testName = $(`input[name=${this.displayAndControlElements.VolcanoYRadioButton}]:checked`).val();
        if(this.volcanoTypePrefix==="correlation"){
            let currentAlt1Val=$(`#${this.displayAndControlElements.VolcanoXRadioButtonAlt1}`).val();
            let currentAlt2Val=$(`#${this.displayAndControlElements.VolcanoXRadioButtonAlt2}`).val();
            if(xFieldName===currentAlt1Val){
                yFieldName=currentAlt2Val;
            }else{
                yFieldName=currentAlt1Val;
            }
            testName="";
        }
        return [xFieldName,yFieldName,testName];
    }
    launchCorrelationAnalysisFromMetadataColumn(columnName){
        this.commonSettings.lock();
        this.cleanup();
        this.clearMarkedGenes();
        let expressions=new Map();
        let singleDonorVariantContributions=[];
        let currentSubcohortDonorsRaw=new Set();
        $(`#${this.volcanoId}MetadataColumnSelectionSubmit`).css("display","none");
        this.currentSubcohortIndex=+$(`#${this.volcanoId}SubcohortSelector1`).val();
        this.selectionManager.registeredSubcohorts.get(this.currentSubcohortIndex).forEach((donorIndex)=>{
            if(this.cohortMetadata.metadata[donorIndex]["RNA"]==="+"){
                let currentVal=this.cohortMetadata.metadata[donorIndex][columnName];
                if(!this.commonSettings.undefinedValues.has(currentVal)){
                    currentSubcohortDonorsRaw.add(donorIndex);
                    this.currentSubcohortDonors.add(donorIndex.toString());
                    this.anchorExpressions.push({expression:currentVal,donorIndex:donorIndex});
                    expressions.set(donorIndex,currentVal);
                    singleDonorVariantContributions.push(new SingleDonorVariantContribution(donorIndex,62,currentVal));
                }
            }
        });
        this.anchorExpressions = this.anchorExpressions.sort(function(a,b){
            if (a.donorIndex < b.donorIndex) {
                return -1;
            }else if(a.donorIndex > b.donorIndex){
                return 1;
            }
            return -1;
        });
        let minExpression=Number.MAX_VALUE;
        let maxExpression=Number.MIN_VALUE;
        for(let i=0;i<this.anchorExpressions.length;++i){
            const expression=this.anchorExpressions[i].expression;
            if(expression<minExpression){
                minExpression=expression;
            }
            if(expression>maxExpression){
                maxExpression=expression;
            }
        }
        if(minExpression<0){
            for(let i=0;i<this.anchorExpressions.length;++i){
                this.anchorExpressions[i].expression-=minExpression;
            }
            maxExpression-=minExpression;
        }
        if(maxExpression>10){
            for(let i=0;i<this.anchorExpressions.length;++i){
                this.anchorExpressions[i].expression=Math.log2(this.anchorExpressions[i].expression+1);
            }
        }
        this.anchorGeneId=-1;
        let tmpData={
            geneId:-1,
            chromosomeIndex:0,
            startPos:0,
            endPos:0,
            geneTypeIndex:0,
            cytobandIndices:"0",
            tadIndices:"0",
            rppaIds:".",
            geneName:columnName,
            cancerGene:false,
            batch:-1,
            reactomePathwayIds:".",
            expressions:expressions,
            singleDonorVariantContributions:singleDonorVariantContributions,
        };
        if(this.references.genes.has(-1)){
            this.references.genes.delete(-1);
        }
        this.references.genes.set(-1,new GeneEntry(tmpData));
        this.callNextBatchForCorrelationAnalysis(0,99);
    }
    launchCorrelationAnalysis(bioId){
        this.commonSettings.lock();
        this.anchorGeneId=bioId;
        this.currentSubcohortIndex=+$(`#${this.volcanoId}SubcohortSelector1`).val();
        if(this.currentSubcohortIndex===-1){
            $(`#${this.volcanoId}SubcohortSelector1`).val("0");
            this.currentSubcohortIndex=0;
        }
        this.selectionManager.registeredSubcohorts.get(this.currentSubcohortIndex).forEach((donorIndex)=>{
            this.currentSubcohortDonors.add(donorIndex.toString());
        });
        this.cleanup();
        this.clearMarkedGenes();
        let q=d3Xqueue();
        q.defer((callback)=>{this.getExpressionsForCorrelationAnalysis(bioId,callback)});
        q.awaitAll(()=>{
            $(`#${this.truePhenotype}CorrelationAnalysisSubmit`).css("display","none");
            this.anchorExpressions=this.tmpExpressions.get(bioId);
            if(this.anchorExpressions===undefined){
                this.anchorExpressions=[];
                this.cleanup();
                this.commonSettings.releaseLock();
                return;
            }
            this.anchorExpressions = this.anchorExpressions.sort(function(a,b){
                if (a.donorIndex < b.donorIndex) {
                    return -1;
                }else if(a.donorIndex > b.donorIndex){
                    return 1;
                }
                return -1;
            });
            this.callNextBatchForCorrelationAnalysis(0,99);
        });
    }
    getExpressionsForCorrelationAnalysis(bioIds,callback){
        let thisRef=this;
        $.ajax({
            url: `${thisRef.commonSettings.baseUrl}/php/getDataFromDb.php`,
            type: 'GET',
            dataType:'json',
            data: ({
                cohort: thisRef.cohortMetadata.cohortName,
                suffix: `${thisRef.truePhenotype}Expressions`,
                columnsToSelect: "*",
                keyColumn: thisRef.truePhenotype,
                keysToSearchRaw: bioIds,
            }),
            error: function(err){
                console.error(err);
            },
            success: function(rawData){
                thisRef.tmpExpressions.clear();
                if(rawData.length>0){
                    for(let i=0;i<rawData.length;++i){
                        let data=rawData[i];
                        let expressions=[];
                        let maxExpression=0;
                        Object.keys(data).forEach(function(key,index) {
                            if(key!==thisRef.truePhenotype && key!=="varianceRank"){
                                if(thisRef.currentSubcohortDonors.has(key)){
                                    let expression=+data[key];
                                    if(expression>maxExpression){
                                        maxExpression=expression;
                                    }
                                    expressions.push({expression:expression,donorIndex:+key});
                                }
                            }
                        });
                        if(maxExpression>=1||thisRef.anchorExpressions.length===0){
                            thisRef.tmpExpressions.set(data[thisRef.truePhenotype],expressions);
                        }
                    }
                }
                callback()
            }
        });
    }
    finalizeCorrelationAnalysis(){
        this.addVolcanoIndices();
        this.setDataXfield(this.xFieldName);
        this.setDataYfield(this.yFieldName);
        this.updateMaximums();
        this.plotVolcano();
        this.commonSettings.releaseLock();
    }
    callNextBatchForCorrelationAnalysis(batchIndex,maxBatch){
        this.getBatchForCorrelationAnalysis(batchIndex,maxBatch);
    }
    getBatchForCorrelationAnalysis(batchIndex,maxBatch){
        let keysToSearchRaw="*";
        if(batchIndex!==-1){
            if(!this.references.geneBatchInfo.has(batchIndex)){
                if(batchIndex<=maxBatch){
                    this.callNextBatchForCorrelationAnalysis(batchIndex+1,maxBatch);
                }
            }
            if(batchIndex>maxBatch){
                this.finalizeCorrelationAnalysis();
                return;
            }
            let genes = this.references.geneBatchInfo.get(batchIndex);
            keysToSearchRaw=genes.join(',');
        }
        let q=d3Xqueue();
        q.defer((callback)=>{
            this.getExpressionsForCorrelationAnalysis(keysToSearchRaw,callback)
        });
        q.awaitAll(()=>{
            this.processCurrentBatchForCorrelationAnalysis();
            this.callNextBatchForCorrelationAnalysis(batchIndex+1,maxBatch);
        });
    }
    processCurrentBatchForCorrelationAnalysis(){
        this.tmpExpressions.forEach((targetExpressions, bioId, map)=>{
            let maxExpression=0;
            targetExpressions.forEach((obj)=>{
                if(obj.expression>maxExpression){
                    maxExpression=obj.expression;
                }
            });
            const truePhenotype= this.truePhenotype;
            const currentData={
                // pearsonZ:Math.atanh(pearsonCorrelation(this.anchorExpressions,targetExpressions,"expression")),
                // spearmanZ:Math.atanh(spearmanCorrelation(this.anchorExpressions,targetExpressions,25)),
                pearson:pearsonCorrelation(this.anchorExpressions,targetExpressions,"expression"),
                spearman:spearmanCorrelation(this.anchorExpressions,targetExpressions,25),
                maxExpression:maxExpression
            };
            currentData[truePhenotype]=bioId;
            this.data.push(new VolcanoEntry(currentData,0));
        });
    }
    textExport(){
        let textBlocks=[];
        textBlocks.push(VolcanoEntry.generalHeaderExport(this.volcanoTypePrefix));
        const textExportFunctionName=`textExport_${this.volcanoTypePrefix}`;
        for(let i=0;i<this.data.length;++i){
            const volcanoIndex=this.data[i].volcanoItemIndex;
            const el=document.getElementById(`${this.displayAndControlElements.VolcanoCircleClass}_${volcanoIndex}`);
            if(el!==null){
                if(el.style.display==="inline"){
                    textBlocks.push(this.data[i][textExportFunctionName](this.references));
                }
            }
        }
        return textBlocks;
    }
}