import{a as f}from"./chunk-QNVVE6V5.js";import{L as x,p as n,wa as b}from"./chunk-MUQF2AZ6.js";import{H as r}from"./chunk-NVJ3LP7I.js";import{a as $}from"./chunk-7GE6SGSX.js";import{f as M,h as g,n as h}from"./chunk-3KENBVE7.js";g();h();var t=M($());var c=e=>{let s=(0,t.forwardRef)(({warningMessage:o,...i},a)=>t.default.createElement(T,null,t.default.createElement(e,{...i,ref:a}),o&&t.default.createElement(A,null,o))),l=(0,t.forwardRef)(({label:o,...i},a)=>t.default.createElement(E,{label:o},t.default.createElement(e,{...i,ref:a})));return e.WithWarning=s,e.WithLabel=l,e},T=n.div`
  width: 100%;
`,k=n.input`
  width: 100%;
  padding: ${e=>e.padding?e.padding:"14px"};
  background: ${e=>e.backgroundColor?e.backgroundColor:r.colors.legacy.bgArea};
  border-width: ${e=>e.borderWidth?e.borderWidth:"1px"};
  border-style: solid;
  border-color: ${e=>e.warning?r.colors.legacy.accentAlert:r.colors.legacy.borderSecondary};
  border-radius: ${e=>e.borderRadius?e.borderRadius:"6px"};
  color: white;
  font-size: ${e=>e.fontSize};
  line-height: 19px;
  &::placeholder {
    color: ${e=>e.placeholderColor?e.placeholderColor:r.colors.legacy.textTertiary};
  }
  &:focus {
    outline: 0;
  }
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &[type="number"] {
    -moz-appearance: textfield;
  }
  ::selection {
    background: ${r.colors.legacy.accentPrimary};
  }
  ::-moz-selection {
    background: ${r.colors.legacy.accentPrimary};
  }
`,A=n.div`
  color: ${r.colors.legacy.accentAlert};
  font-size: 16px;
  line-height: 1.2;
  margin-top: 10px;
  text-align: left;
`,E=n.div`
  position: relative;
  &:after {
    ${e=>e.label?`content: "${e.label}"`:""};
    color: ${r.colors.legacy.textTertiary};
    position: absolute;
    right: 20px;
    bottom: 17px;
    font-size: 16px;
  }
`,p=c(k);p.defaultProps={fontSize:"16px"};var H=n(p.withComponent("textarea"))`
  resize: none;
  padding: 25px;
  line-height: 150%;
  word-spacing: 10px;
  text-align: left;
  white-space: normal;
  &:placeholder-shown {
    word-spacing: 3px;
  }
`,N=c(H);N.defaultProps={fontSize:"16px"};var R=n(p.withComponent("textarea"))`
  height: 68px;
  text-align: start;
  resize: none;
`,V=c(R);V.defaultProps={fontSize:"16px"};var K=n(p.withComponent("textarea"))`
  height: 68px;
  text-align: start;
  resize: none;
`,F=c(K);F.defaultProps={fontSize:"16px"};var q=n(p.withComponent("textarea"))`
  overflow: auto;
  height: 50px;
  text-align: start;
  resize: none;
  padding-right: ${e=>e.paddingRight||"60px"};

  ::placeholder {
    text-overflow: ellipsis;
    white-space: pre;
    overflow: hidden;
  }
`,D=c(q);D.defaultProps={fontSize:"16px"};var O=n(p)`
  padding-left: 43px;
  padding-right: 43px;
`,U=n.div`
  width: 100%;
  position: relative;
`,j=n.div`
  position: absolute;
  top: 16px;
  left: 15px;
`,B=n.div`
  position: absolute;
  top: 16px;
  right: 15px;
  cursor: pointer;
`,_=(0,t.forwardRef)((e,s)=>{let{showClearIcon:l,onClear:o,showLoadingIcon:i=!1,...a}=e;return t.default.createElement(U,null,t.default.createElement(j,null,i?t.default.createElement(f,{diameter:17}):t.default.createElement(x,null)),t.default.createElement(O,{...a,ref:s,type:"text"}),l&&t.default.createElement(B,{onClick:o},t.default.createElement(b,null)))}),G=n(p).attrs({fontSize:"16px"})`
  border: ${({border:e})=>e};
  color: ${({color:e})=>e};
  &:disabled {
    cursor: not-allowed;
  }
`,ee=t.default.memo(function({value:s,placeholder:l,fontSize:o,required:i,warning:a,minLength:y=1,maxLength:I=79,decimalLimit:m=9,border:W,borderRadius:S,disabled:w,"aria-labelledby":P,"aria-label":C,onKeyPress:u,onUserInput:v,name:L}){return t.default.createElement(G,{value:s,required:i,warning:a,border:W,borderRadius:S,color:a?r.colors.legacy.accentAlert:r.colors.legacy.textPrimary,type:"text",inputMode:"decimal",pattern:`^\\d*(\\.\\d{0,${m}})?$`,autoComplete:"off",autoCorrect:"off",spellCheck:"false",fontSize:o,placeholder:l,step:"any",minLength:y,maxLength:I,disabled:w,name:L,"aria-labelledby":P,"aria-label":C,onKeyPress:d=>u&&u(d),onInput:d=>{if(!d.target.validity.valid)d.preventDefault();else{let z=d.target.value.replace(/,/g,".");v(z)}}})});export{c as a,p as b,N as c,V as d,F as e,D as f,_ as g,ee as h};
//# sourceMappingURL=chunk-NIYDCB62.js.map
