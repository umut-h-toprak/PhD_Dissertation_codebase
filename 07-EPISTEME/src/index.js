import 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-slider';
import 'bootstrap-slider/dist/css/bootstrap-slider.css';
import {cleanup, transitionToVariantScreen} from "./Utils";
import {Cohort} from "./Cohort";
import {References} from "./references/References";

import './css/main.css';
import {DistanceMeasures} from "./distanceMeasures/DistanceMeasures";


cleanup();
$.ajax({
    url: `${window.location.protocol + "//" + window.location.host + "/" + window.location.pathname.split('/')[1]}/php/queryAvailableCohorts.php`,
    type: 'GET',
    dataType:'json',
    success: function(data){
        data.forEach(x=>{
            if(x!=="references"){
                $('#cohortSelector').append(`<option value=${x}>${x}</option>`);
            }
        });
    }
});

let references=new References();
let distanceMeasures=new DistanceMeasures();
distanceMeasures.realValidMetrics.forEach((dist)=>{
    $('#heatmapDistanceSelector').append(`<option value=${dist}>${dist}</option>`);
    $('#UMAPDistanceSelector').append(`<option value=${dist}>${dist}</option>`);
    $('#FlexibleClusteringDistanceSelector').append(`<option value=${dist}>${dist}</option>`);
});
for (let i = 6; i < 53; ++i){
    if(i!==12){
        $('#fontSizeSelector').append(`<option value=${i}>${i}</option>`);
    }else{
        $('#fontSizeSelector').append(`<option value=${i} selected>${i}</option>`);
    }
}


for (let i = 23; i >=1; --i){
    $('#chromosomalSizeControls').prepend(`<div class="input-group"><label for="coeff${i}" class="col-form-label" id="coeff${i}Label">${i}: </label> <input type="number" id="coeff${i}" name="coeff${i}" data-provide="slider" data-slider-min="0" data-slider-max="27" data-slider-step="1" data-slider-value="7" data-slider-tooltip="hide" data-slider-orientation="horizontal"></div><br/>`);
}

window.cohortDump=[];
$('#vdjTraModeGroup').css('display','none');
$('#cohortSelector').on("change",function(){
    if (this.value !== "Select Cohort"){
        if(window.cohortDump.length>0){
            transitionToVariantScreen(window.cohortDump[0].commonSettings);
            window.cohortDump[0].cleanupCohort();
            window.cohortDump.pop();
        }
        window.cohortDump.push(new Cohort(references, this.value, this.value.includes("_WES")));
    }
});
