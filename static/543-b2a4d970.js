"use strict";(self.webpackChunkseqr=self.webpackChunkseqr||[]).push([[543],{1300:function(t,e,r){r.d(e,{Z:function(){return o}});var n=r(5130),a=r(42274);r(47306);class o{constructor(t,e=!1,r=30,n=-40,a=100){this.id=t,this.verbose=e,this.offsetX=r,this.offsetY=n,this.duration=a}show(t){this.verbose&&console.log(t),this.edit(t),this.move(),(0,n.Z)("#"+this.id).style("display","inline").transition().duration(this.duration).style("opacity",1)}hide(){(0,n.Z)("#"+this.id).transition().duration(this.duration).style("opacity",0),this.edit("")}move(t=a.B.pageX,e=a.B.pageY){this.verbose&&(console.log(t),console.log(e)),t+=this.offsetX,e=e+this.offsetY<0?10:e+this.offsetY;(0,n.Z)("#"+this.id).style("left",`${t}px`).style("top",`${e}px`)}edit(t){(0,n.Z)("#"+this.id).html(t)}}},88239:function(t,e,r){r.d(e,{v:function(){return g}});var n=r(92437),a=r(66318),o=r.n(a),i=r(53417),l=r(90503);function s(t){return s="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},s(t)}function u(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function c(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function p(t,e){if(e&&("object"===s(e)||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return function(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}(t)}function d(t){return d=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)},d(t)}function f(t,e){return f=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t},f(t,e)}var h,b,y,g="https://gtexportal.org/rest/v1/",x=function(t){function e(){return u(this,e),p(this,d(e).apply(this,arguments))}var r,a,o;return function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&f(t,e)}(e,t),r=e,(a=[{key:"componentDidMount",value:function(){var t=this.props,e=t.geneId,r=t.launchGtex;new l.c("".concat(g,"reference/gene"),(function(t){r(t.gene[0].gencodeId)}),(function(){r(e)})).get({format:"json",geneId:e})}},{key:"render",value:function(){var t=this.props.containerId;return n.createElement(i.Z,{id:t})}}])&&c(r.prototype,a),o&&c(r,o),e}(n.PureComponent);h=x,b="propTypes",y={geneId:o().string.isRequired,containerId:o().string.isRequired,launchGtex:o().func.isRequired},b in h?Object.defineProperty(h,b,{value:y,enumerable:!0,configurable:!0,writable:!0}):h[b]=y,e.Z=x},49543:function(t,e,r){r.r(e),r.d(e,{default:function(){return q}});var n=r(92437),a=r(66318),o=r.n(a),i=r(65351),l=r(5130),s=r(64361),u=r(50352),c=r(1300),p=r(6939);class d{constructor(t,e=!0,r=10,n="boxplot-tooltip"){this.boxplotData=t.sort((function(t,e){return t.label<e.label?-1:t.label>e.label?1:0})),this.allVals=[],this.boxplotData.forEach((t=>{t.data.sort(i.j2),this.allVals=this.allVals.concat(t.data),t.q1=(0,i.VR)(t.data,.25),t.median=(0,i.C2)(t.data),t.q3=(0,i.VR)(t.data,.75),t.iqr=t.q3-t.q1,t.upperBound=(0,i.Fp)(t.data.filter((e=>e<=t.q3+1.5*t.iqr))),t.lowerBound=(0,i.VV)(t.data.filter((e=>e>=t.q1-1.5*t.iqr))),t.outliers=t.data.filter((e=>e<t.lowerBound||e>t.upperBound))})),this.useLog=e,this.logBase=r,this.allVals.sort(i.j2),this.tooltip=void 0,this.createTooltip(n)}render(t,e={}){let r=e.width||1200,n=e.height||800,a=e.marginTop||10,o=e.marginRight||70,i=e.marginBottom||150,s=e.marginLeft||40,c=e.padding||.15,p=e.xAxisFontSize||11,d=e.xAxisLabel||"",f=e.xAxisLabelFontSize||11,h=e.yAxisFontSize||10,b=(this.useLog?`log${this.logBase}(${e.yAxisUnit})`:e.yAxisUnit)||"",y=e.yAxisLabelFontSize||11;const g=this._getLogAdjustment(),x=this._createSvg(t,r,n).append("g").attr("id","gtex-viz-boxplot");let m=this._setScales(r-(s+o),n-(a+i),c),w=(0,u.LL)(m.x),v=(0,u.y4)(m.y);x.append("g").attr("class","boxplot-x-axis").attr("transform",`translate(${s+m.x.bandwidth()/2}, ${n-i})`).call(w).attr("text-anchor","start").selectAll("text").attr("transform","translate(5,1) rotate(45)").attr("font-size",p),x.append("text").attr("transform",`translate(${s+r/2+m.x.bandwidth()/2}, ${n-f/2})`).attr("text-anchor","middle").style("font-size",f).text(d),x.append("g").attr("class","boxplot-y-axis").attr("transform",`translate(${s}, ${a})`).call(v).attr("font-size",h),x.append("text").attr("transform",`translate(${y}, ${(n-i)/2}) rotate(270)`).attr("text-anchor","middle").style("font-size",y).text(b),x.append("g").attr("class","boxplot-iqr").attr("transform",`translate(${s+m.x.bandwidth()}, ${a})`).selectAll("rect").data(this.boxplotData).enter().append("rect").attr("x",(t=>m.x(t.label)-m.x.bandwidth()/2)).attr("y",(t=>this.useLog?m.y(t.q3+g):m.y(t.q3))).attr("width",(t=>m.x.bandwidth())).attr("height",(t=>this.useLog?m.y(t.q1+g)-m.y(t.q3+g):m.y(t.q1)-m.y(t.q3))).attr("fill",(t=>`#${t.color}`)).attr("stroke","#aaa").on("mouseover",((t,e,r)=>{let n=(0,l.Z)(r[e]);this.boxplotMouseover(t,n)})).on("mouseout",((t,e,r)=>{let n=(0,l.Z)(r[e]);this.boxplotMouseout(t,n)})),x.append("g").attr("class","boxplot-median").attr("transform",`translate(${s+m.x.bandwidth()}, ${a})`).selectAll("line").data(this.boxplotData).enter().append("line").attr("x1",(t=>m.x(t.label)-m.x.bandwidth()/2)).attr("y1",(t=>this.useLog?m.y(t.median+g):m.y(t.median))).attr("x2",(t=>m.x(t.label)+m.x.bandwidth()/2)).attr("y2",(t=>this.useLog?m.y(t.median+g):m.y(t.median))).attr("stroke","#000").attr("stroke-width",2);let j=x.append("g").attr("class","boxplot-whisker");j.append("g").attr("transform",`translate(${s+m.x.bandwidth()}, ${a})`).selectAll("line").data(this.boxplotData).enter().append("line").attr("x1",(t=>m.x(t.label))).attr("y1",(t=>this.useLog?m.y(t.q3+g):m.y(t.q3))).attr("x2",(t=>m.x(t.label))).attr("y2",(t=>this.useLog?m.y(t.upperBound+g):m.y(t.upperBound))).attr("stroke","#aaa"),j.append("g").attr("transform",`translate(${s+m.x.bandwidth()}, ${a})`).selectAll("line").data(this.boxplotData).enter().append("line").attr("x1",(t=>m.x(t.label)-m.x.bandwidth()/4)).attr("y1",(t=>this.useLog?m.y(t.upperBound+g):m.y(t.upperBound))).attr("x2",(t=>m.x(t.label)+m.x.bandwidth()/4)).attr("y2",(t=>this.useLog?m.y(t.upperBound+g):m.y(t.upperBound))).attr("stroke","#aaa"),j.append("g").attr("transform",`translate(${s+m.x.bandwidth()}, ${a})`).selectAll("line").data(this.boxplotData).enter().append("line").attr("x1",(t=>m.x(t.label))).attr("y1",(t=>this.useLog?m.y(t.q1+g):m.y(t.q1))).attr("x2",(t=>m.x(t.label))).attr("y2",(t=>this.useLog?m.y(t.lowerBound+g):m.y(t.lowerBound))).attr("stroke","#aaa"),j.append("g").attr("transform",`translate(${s+m.x.bandwidth()}, ${a})`).selectAll("line").data(this.boxplotData).enter().append("line").attr("x1",(t=>m.x(t.label)-m.x.bandwidth()/4)).attr("y1",(t=>this.useLog?m.y(t.lowerBound+g):m.y(t.lowerBound))).attr("x2",(t=>m.x(t.label)+m.x.bandwidth()/4)).attr("y2",(t=>this.useLog?m.y(t.lowerBound+g):m.y(t.lowerBound))).attr("stroke","#aaa"),x.append("g").attr("class","boxplot-outliers").attr("transform",`translate(${s+m.x.bandwidth()}, ${a})`).selectAll("g").data(this.boxplotData).enter().append("g").selectAll("circle").data((t=>t.outliers.map((e=>({label:t.label,val:e}))))).enter().append("circle").attr("cx",(t=>m.x(t.label))).attr("cy",(t=>this.useLog?m.y(t.val+g):m.y(t.val))).attr("r","2").attr("stroke","#aaa").attr("fill","none")}createTooltip(t){0==p(`#${t}`).length&&p("<div/>").attr("id",t).appendTo(p("body")),this.tooltip=new c.Z(t),(0,l.Z)(`#${t}`).attr("class","boxplot-tooltip")}boxplotMouseover(t,e){void 0!==this.tooltip&&this.tooltip.show(`${t.label}<br/>\n            ${this.useLog?"Log10(Median TPM)":"Median TPM"}: ${t.median.toPrecision(3)}<br/>\n            Number of Samples: ${t.data.length}`),e.classed("highlighted",!0)}boxplotMouseout(t,e){void 0!==this.tooltip&&this.tooltip.hide(),e.classed("highlighted",!1)}_createSvg(t,e,r){return(0,l.Z)(`#${t}`).append("svg").attr("width",e).attr("height",r)}_setScales(t,e,r=0){let n,a=(0,s.ti)().domain(this.boxplotData.map((t=>t.label))).range([0,t]).paddingInner(r);if(this.useLog){const t=this._getLogAdjustment();n=(0,s.p2)().domain((0,i.We)(this.allVals).map((e=>e+t))).range([e,0]).base(this.logBase)}else n=(0,s.BY)().domain((0,i.We)(this.allVals)).range([e,0]);return{x:a,y:n}}_getLogAdjustment(){return 1}}var f=r(90503),h=r(88239);function b(t){return function(t){if(Array.isArray(t))return v(t)}(t)||function(t){if("undefined"!=typeof Symbol&&null!=t[Symbol.iterator]||null!=t["@@iterator"])return Array.from(t)}(t)||w(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function y(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function g(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?y(Object(r),!0).forEach((function(e){x(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):y(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function x(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function m(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var r=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null==r)return;var n,a,o=[],i=!0,l=!1;try{for(r=r.call(t);!(i=(n=r.next()).done)&&(o.push(n.value),!e||o.length!==e);i=!0);}catch(t){l=!0,a=t}finally{try{i||null==r.return||r.return()}finally{if(l)throw a}}return o}(t,e)||w(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function w(t,e){if(t){if("string"==typeof t)return v(t,e);var r=Object.prototype.toString.call(t).slice(8,-1);return"Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?v(t,e):void 0}}function v(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}var j="gene-tissue-tpm-plot",O={WB:"Whole_Blood",F:"Cells_Cultured_fibroblasts",M:"Muscle_Skeletal",L:"Cells_EBV-transformed_lymphocytes"},$=Object.entries(O).reduce((function(t,e){var r=m(e,2),n=r[0];return g({},t,x({},r[1],n))}),{}),L={WB:"Whole Blood",F:"Fibroblast",M:"Muscle",L:"Lymphocyte"},A={width:600,height:450,padding:.35,marginLeft:40,marginTop:0,marginBottom:100,xAxisFontSize:12,yAxisLabelFontSize:14,yAxisUnit:"TPM"},S=function(t,e){return function(r){var n=b(new Set(Object.values(e).map((function(t){return t.sampleTissueType})))),a=Object.entries(e).map((function(t){var e=m(t,2);return{label:e[0],data:[e[1].tpm]}})),o=560-80*(2*n.length+a.length);Promise.all([new f.c("".concat(h.v,"expression/geneExpression"),(function(t){a.push.apply(a,b(t.geneExpression.map((function(t){var e=t.data,r=t.tissueSiteDetailId;return{data:e,label:"*GTEx - ".concat(L[$[r]]),color:"efefef"}}))))}),(function(){})).get({tissueSiteDetailId:n.map((function(t){return O[t]})).join(","),gencodeId:r}),new f.c("/api/rna_seq_expression/gene/".concat(t,"/tissues/").concat(n.join(",")),(function(t){a.push.apply(a,b(Object.entries(t).map((function(t){var e=m(t,2),r=e[0];return{data:e[1],label:"*RDG - ".concat(L[r]),color:"efefef"}}))))}),(function(){})).get()]).then((function(){new d(a,!1).render(j,g({},A,{marginRight:o}))}))}},B=function(t){var e=t.geneId,r=t.tpms;return n.createElement(h.Z,{geneId:e,containerId:j,launchGtex:S(e,r)})};B.propTypes={geneId:o().string.isRequired,tpms:o().object};var q=B}}]);