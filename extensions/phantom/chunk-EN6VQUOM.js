import{a as w}from"./chunk-3J6D343S.js";import{K as q,p as l}from"./chunk-MUQF2AZ6.js";import{H as k,L as N}from"./chunk-5JP6BIAB.js";import{H as y,_ as S}from"./chunk-NVJ3LP7I.js";import{fa as x}from"./chunk-X3THIE5D.js";import{a as I}from"./chunk-7GE6SGSX.js";import{f as b,h as n,n as a}from"./chunk-3KENBVE7.js";n();a();var e=b(I());var M=l.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${r=>r.color};
  height: ${r=>r.width}px;
  min-width: ${r=>r.width}px;
  border-radius: 6px;
`,j=l.img`
  border-radius: ${r=>r.shape==="square"?"0":"50%"};
  height: ${r=>r.width}px;
  width: ${r=>r.width}px;
`,O=e.default.memo(({alt:r,backgroundColor:i=y.colors.legacy.bgWallet,className:m,defaultIcon:P,iconUrl:s,localImageSource:d,questionMarkWidth:W,shape:u="circle",width:o})=>{let[$,C]=(0,e.useState)(!1),[p,E]=(0,e.useState)(!1),L=()=>{C(!0)},T=()=>{E(!0)},t=s;s&&o?t=S(s,o,o):d&&(t=d);let g=$?"clear":i,f=t?e.default.createElement(j,{src:t,alt:r,width:o,shape:u,loading:"lazy",onLoad:L,onError:T}):null,h=P||e.default.createElement(q,{width:W});return u==="square"?e.default.createElement(M,{className:m,color:g,width:o},t&&!p?f:h):e.default.createElement(w,{className:m,color:g,diameter:o},t&&!p?f:h)});n();a();var c=b(I()),v=(r,i)=>x(k(typeof r=="string"?Number(r):r),i),K=r=>typeof r.children>"u"?null:c.default.createElement(c.default.Fragment,null,v(r.children,r.format)," SOL");export{O as a,K as b};
//# sourceMappingURL=chunk-EN6VQUOM.js.map
