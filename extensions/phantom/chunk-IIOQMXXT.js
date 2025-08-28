import{c as C}from"./chunk-QNVVE6V5.js";import{B as b,E as f,ib as d,ka as h,p as t}from"./chunk-MUQF2AZ6.js";import{H as r,d as p}from"./chunk-NVJ3LP7I.js";import{a as m}from"./chunk-7GE6SGSX.js";import{f as u,h as e,n as a}from"./chunk-3KENBVE7.js";e();a();var i=u(m());var $=t.div`
  width: 94px;
  height: 94px;
  margin: auto;
  position: relative;
  border-radius: ${o=>o.borderRadius};
  background: ${o=>o.background};
`,O=t.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`,B=t.div`
  @keyframes rotate {
    0% {
      transform: rotateZ(0deg);
    }
    100% {
      transform: rotateZ(360deg);
    }
  }
  animation: rotate 0.5s linear infinite;
  position: absolute;
  margin: 0 auto;
  width: 94px;
  height: 94px;
  border-radius: 100%;
  box-shadow: 0 0 0 7px rgba(from ${r.colors.legacy.accentWarning} r g b / 10%);
  & > svg {
    position: absolute;
    bottom: -8px;
    right: -9px;
  }
`,I=({children:o,color:s=r.colors.brand.yellowMoon})=>i.createElement($,null,i.createElement(B,null,i.createElement("svg",{width:38,height:60,viewBox:"0 0 38 60",fill:"none",xmlns:"http://www.w3.org/2000/svg"},i.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M31.897 5.75301C33.5532 5.70601 34.9339 7.01051 34.9809 8.6667C35.2548 18.3187 32.5493 27.8208 27.2322 35.8808C21.9151 43.9408 14.2446 50.1676 5.26377 53.7144C3.72274 54.323 1.98013 53.5671 1.37153 52.0261C0.762941 50.485 1.51883 48.7424 3.05986 48.1338C10.8942 45.0398 17.5855 39.6079 22.2238 32.5769C26.8621 25.5458 29.2223 17.2567 28.9833 8.8369C28.9363 7.18071 30.2408 5.80001 31.897 5.75301Z",fill:s}))),o&&i.createElement(O,null,o));e();a();var n=u(m());var U=({icon:o,title:s,onClose:w,iconSize:y="normal",showButton:g=!0,buttonText:v=p.t("commandClose"),children:k,onIgnore:T,ignoreText:l})=>{let c=y==="large"?44:32;return n.default.createElement(F,null,n.default.createElement("section",null,o==="loading"?n.default.createElement(I,null,n.default.createElement(h,{width:c})):o==="error"?n.default.createElement(L,{iconSize:c}):n.default.createElement(P,{iconSize:c}),n.default.createElement(M,null,s),k),l!==void 0&&n.default.createElement(A,{onClick:T},l),n.default.createElement(j,{hasMarginBottom:!g},g?n.default.createElement(C,{onClick:w},v):n.default.createElement(n.default.Fragment,null,"\xA0")))},L=({iconSize:o})=>n.default.createElement(x,{borderRadius:"100%",background:`rgba(from ${r.colors.legacy.accentAlert} r g b / 10%)`},n.default.createElement(S,null,n.default.createElement(b,{width:o}))),P=({iconSize:o})=>n.default.createElement(x,{borderRadius:"100%",background:`rgba(from ${r.colors.legacy.accentSuccess} r g b / 10%)`},n.default.createElement(S,null,n.default.createElement(f,{width:o,fill:r.colors.legacy.accentSuccess}))),F=t.section`
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100%;
  & > section:first-child {
    display: grid;
    gap: 8.5px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: auto;
  }
`,M=t(d).attrs({size:28,lineHeight:33.89,weight:500})`
  word-wrap: break-word;
  overflow: hidden;
  margin-top: 15px;
`,x=t.div`
  width: 94px;
  height: 94px;
  margin: auto;
  position: relative;
  border-radius: ${o=>o.borderRadius};
  background: ${o=>o.background};
`,S=t.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`,j=t.div`
  margin-bottom: ${o=>o.hasMarginBottom&&"60px"};
  width: 100%;
`,A=t(d)`
  margin: auto;
  font-size: 14px;
  padding-bottom: 35px;
  color: ${r.colors.legacy.textSecondary};
  font-weight: 500;
  &:hover {
    color: ${r.colors.legacy.accentAlert};
  }
`;export{I as a,U as b};
//# sourceMappingURL=chunk-IIOQMXXT.js.map
