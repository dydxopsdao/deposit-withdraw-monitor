import{m as V,r as B}from"./chunk-WWNRRCZL.js";import{Da as O}from"./chunk-EHJD6RHG.js";import{f as _,h as M}from"./chunk-U3MJCGUQ.js";import{c as H}from"./chunk-GASB3NXO.js";import{b as x}from"./chunk-RP4HT6XN.js";import{c as w,ha as L,ia as N,l as h,p as o}from"./chunk-MUQF2AZ6.js";import{H as D}from"./chunk-NVJ3LP7I.js";import{N as I}from"./chunk-7MK34BUQ.js";import{a as v}from"./chunk-7GE6SGSX.js";import{f as k,h as l,n as m}from"./chunk-3KENBVE7.js";l();m();var n=k(v());l();m();var d=k(v());var E=5,S=5,u=2,G=S+2*u,A=14,q=A+2*u,W=S+2*u,z=o.div`
  display: flex;
  justify-content: ${t=>t.shouldCenter?"center":"flex-start"};
  align-items: center;
  position: relative;
  overflow: hidden;
  width: ${t=>(t.maxVisible-1)*G+q}px;
`,J=o.div`
  align-items: center;
  display: flex;
  ${t=>t.shouldShift&&h`
      transform: translateX(calc(-${W}px * ${t.shiftAmount}));
      transition: transform 0.3s ease-in-out;
    `}
`,K=o.div`
  align-items: center;
  background-color: ${D.colors.legacy.textSecondary};
  border-radius: 95px;
  display: flex;
  height: ${E}px;
  justify-content: center;
  margin: 0 ${u}px;
  min-width: ${S}px;
  transition: all 0.3s ease-in-out;
  ${t=>t.isActive&&h`
      min-width: ${A}px;
    `}
  ${t=>t.isSmall&&h`
      min-width: 3px;
      margin: 0 ${u}px;
      height: 3px;
    `}
`,Q=o.div`
  width: ${A}px;
  height: ${E}px;
  border-radius: 95px;
  position: absolute;
  margin: 0 ${u}px;
  background-color: ${D.colors.legacy.accentPrimary};
  transition: transform 0.3s ease-in-out;
  ${t=>t.position&&h`
      transform: translateX(${t.position*W}px);
    `}
`,Y=({numOfItems:t,currentIndex:i,maxVisible:a=5})=>{let e=t>a?i>a-3:!1,c=e?i-(a-3):0;return d.default.createElement(z,{shouldCenter:a>t,maxVisible:a},d.default.createElement(J,{shouldShift:e,shiftAmount:c},Array.from({length:t}).map((f,r)=>{let b=(r===i-2||r===i+2)&&e;return d.default.createElement(K,{key:`pagination-dot-${r}`,isActive:i===r,isSmall:b})}),d.default.createElement(Q,{position:i})))},j=Y;var Z=o.div`
  height: 0;
  transition: height 0.2s ease-in-out;
  width: 100%;
  ${t=>t.animate?`height: ${t.shouldCollapse?t.itemHeight+26:t.itemHeight+46}px`:""}
`,R=o.div`
  transition: transform 0.5s ease;
  width: 100%;
`,F=o(H)``,U=o.div`
  visibility: ${t=>t.isVisible?"visible":"hidden"};
`,tt=o.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`,et=o.ul`
  align-items: center;
  display: flex;
  margin-bottom: 8px;
  transition: transform 0.5s ease;
  transform: ${t=>`translateX(${t.currentIndex*-100}%)`};
`,nt=o.li`
  align-items: center;
  display: flex;
  flex: 0 0 100%;
  padding: ${t=>t.isActive?"0":t.isNext||t.isPrevious?"0 6px":"0"};
  height: ${t=>t.isActive?t.itemHeight:.9*t.itemHeight}px; /* 0.9 is taken from parallaxAdjacentItemScale from the carousel on mobile */
`,ht=({items:t,onIndexChange:i,itemHeight:a})=>{let[e,c]=(0,n.useState)(0),f=(0,n.useCallback)(()=>{c(s=>s+1)},[]),r=(0,n.useCallback)(()=>{c(s=>s-1)},[]),b=e<t.length-1,y=e>0;(0,n.useEffect)(()=>{!t.length||e>t.length-1||i(e)},[t,i,e]),(0,n.useEffect)(()=>{t.length>0&&e>=t.length&&c(t.length-1)},[e,t]);let C=t.length<=1;return n.default.createElement(Z,{animate:t.length>0,shouldCollapse:C,itemHeight:a},n.default.createElement(R,null,n.default.createElement(et,{currentIndex:e},t.map((s,p)=>n.default.createElement(nt,{key:s.key,isActive:e===p,isNext:e+1===p,isPrevious:e-1===p,itemHeight:a},s.node))),!C&&n.default.createElement(tt,null,n.default.createElement(U,{isVisible:y},n.default.createElement(F,{onClick:r},n.default.createElement(L,null))),n.default.createElement(j,{numOfItems:t.length,currentIndex:e,maxVisible:5}),n.default.createElement(U,{isVisible:b},n.default.createElement(F,{onClick:f},n.default.createElement(N,null))))))};l();m();var g=k(v());l();m();var X=t=>{if(t==="Settings: Security & Privacy")return B;if(t==="Settings: Currency")return V};var ot=g.default.lazy(()=>import("./FungibleDetailPage-WNLPE4DM.js")),_t=()=>{let{showSettingsMenu:t}=M(),{handleShowModalVisibility:i}=O(),{pushDetailView:a}=_(),e=w(),{data:[c,f]}=I(["enable-merge-collectibles","enable-unlimited-fungibles"]),r=c||f;return(0,g.useCallback)((y,C)=>{let{destinationType:s,url:p,caip19:T}=C;switch(s){case"External Link":x({url:p});break;case"Buy":i("onramp");break;case"Collectibles":r?e("/",{state:{defaultTab:"collectibles",nonce:Date.now()}}):e("/collectibles");break;case"Explore":e("/explore");break;case"Swapper":e("/swap");break;case"Settings: Claim Username":i("quickClaimUsername");break;case"Settings: Import Seed Phrase":x({url:"onboarding.html?append=true"});break;case"Connect Hardware Wallet":x({url:"connect_hardware.html"});break;case"Convert to Jito":i("mintPSOLInfo",{presentNext:!0});break;case"Token":{if(!T)return;a(g.default.createElement(ot,{caip19:T,title:void 0,entryPoint:"actionBanner"}));break}default:{let $=X(s);if(!$)return;t(y,g.default.createElement($,null))}}},[e,t,i,a,r])};export{_t as a,ht as b};
//# sourceMappingURL=chunk-BQ3LTGLI.js.map
