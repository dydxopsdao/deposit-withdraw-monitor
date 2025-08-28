import{a as T}from"./chunk-NHZM4B2Z.js";import{a as J}from"./chunk-W5ZYYKQQ.js";import{e as q,f as I,g as K}from"./chunk-Q5KEEIPM.js";import{a as O}from"./chunk-GO7HYR6O.js";import{a as S}from"./chunk-TKTYENT7.js";import{a as H,c as f,e as B}from"./chunk-QNVVE6V5.js";import{ib as F,p as l}from"./chunk-MUQF2AZ6.js";import{p as v}from"./chunk-S2IPDOR6.js";import{i as V}from"./chunk-UT4QDC7N.js";import{H as c,L as b,M as y,Q as x,S as P}from"./chunk-NVJ3LP7I.js";import{R as k}from"./chunk-X3THIE5D.js";import{a as A}from"./chunk-7GE6SGSX.js";import{f as E,h as m,n as u}from"./chunk-3KENBVE7.js";m();u();var n=E(A());m();u();var e=E(A());var M=l.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: ${r=>r.addScreenPadding?"16px":"0"};
`,G=l.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`,W=l.div`
  width: 100%;
  > * {
    margin-top: 10px;
  }
  padding: 16px;
`,X=l(O).attrs({align:"center",justify:"center",margin:"0 0 15px 0"})`
  position: relative;
  border-radius: 50%;
  background-color: ${k(c.colors.legacy.accentPrimary,.2)};
  box-shadow: 0 0 0 20px ${k(c.colors.legacy.accentPrimary,.2)};
`,z=l(F).attrs({size:28,weight:500,color:c.colors.legacy.textPrimary})`
  margin-top: 24px;
  margin-left: 12px;
  margin-right: 12px;
`,U=()=>e.default.createElement(X,null,e.default.createElement(H,{diameter:54,color:c.colors.legacy.accentPrimary,trackColor:c.colors.legacy.bgArea})),Y=({message:r})=>e.default.createElement(b,{marginX:12,alignItems:"center"},Array.isArray(r)?r.map((i,o)=>e.default.createElement(y,{key:`message-${o}`,font:"body",color:"textSecondary",align:"center",marginX:12,marginTop:16},i)):e.default.createElement(y,{font:"body",marginTop:16,color:"textSecondary",align:"center"},r)),L=({header:r,icon:i,title:o,message:a,txHash:t,txHashTitle:d,isClosable:g,primaryButton:p,secondaryButton:s})=>e.default.createElement(M,null,r,e.default.createElement(G,null,e.default.createElement(x,{mode:"wait",initial:!0},e.default.createElement(P.div,{key:o,initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:.2}},i)),e.default.createElement(z,null,o),e.default.createElement(Y,{message:a}),t&&e.default.createElement(x,{mode:"wait",initial:!1},e.default.createElement(P.div,{key:t,initial:{opacity:0,y:16},animate:{opacity:1,y:0},exit:{opacity:0},transition:{duration:.2}},e.default.createElement(J,{txHash:t},d)))),g?e.default.createElement(W,null,s&&p?e.default.createElement(B,{buttons:[{text:s.title,onClick:s.onPress},{theme:"primary",text:p.title,onClick:p.onPress}]}):p?e.default.createElement(f,{theme:"primary",onClick:p.onPress},p.title):s?e.default.createElement(f,{onClick:s.onPress},s.title):null):null),$=({ledgerAction:r,numberOfTransactions:i,cancel:o,ledgerApp:a})=>e.default.createElement(M,{addScreenPadding:!0},e.default.createElement(I,{ledgerAction:r,numberOfTransactions:i,cancel:o,ledgerApp:a})),N=({title:r,message:i,txHash:o,txHashTitle:a,primaryButton:t})=>e.default.createElement(L,{icon:e.default.createElement(U,null),message:i,title:r,txHash:o,txHashTitle:a,primaryButton:t,isClosable:!!o}),h=({title:r,message:i,txHash:o,txHashTitle:a,primaryButton:t})=>e.default.createElement(L,{icon:e.default.createElement(T,{type:"failure"}),message:i,title:r,txHash:o,txHashTitle:a,primaryButton:t,isClosable:!0}),_=({title:r,message:i,txHash:o,txHashTitle:a,primaryButton:t,secondaryButton:d})=>e.default.createElement(L,{icon:e.default.createElement(T,{type:"success"}),title:r,message:i,txHash:o,txHashTitle:a,isClosable:!0,primaryButton:t,secondaryButton:d});var C=l.a.attrs({target:"_blank",rel:"noopener noreferrer"})`
  color: ${r=>r.theme.purple};
  text-decoration: none;
  cursor: pointer;
`,Q=({txError:r,addressType:i,statusPageProps:o,executeConvertStake:a,onClose:t})=>q(r)?n.default.createElement(K,{ledgerActionError:r,onRetryClick:a,onCancelClick:t}):o.type==="error"?n.default.createElement(h,{...o}):n.default.createElement($,{ledgerAction:a,numberOfTransactions:1,cancel:t,ledgerApp:v(i)}),Pe=n.default.memo(r=>{let{process:i,addressType:o,isLedger:a,statusPageProps:t,txError:d,onClose:g,executeLiquidStake:p,learnMoreLink:s,isJitoSOL:D}=r;if(a&&!t.txHash)return n.default.createElement(Q,{txError:d,addressType:o,statusPageProps:t,executeConvertStake:p,onClose:g});switch(t.type){case"loading":return n.default.createElement(N,{...t});case"error":return n.default.createElement(h,{...t});case"success":{let w=null;return D&&(w=i==="convert"?[n.default.createElement(S,{i18nKey:"liquidStakeDepositStakeDisclaimer"},"You'll receive JitoSOL in 10 hours. ",n.default.createElement(C,{href:V},"Learn more")),n.default.createElement(S,{i18nKey:"convertStakeStatusSuccessMessage"},"Earn additional rewards with your JitoSOL ",n.default.createElement(C,{href:s},"here."))]:n.default.createElement(S,{i18nKey:"convertStakeStatusSuccessMessage"},"Earn additional rewards with your JitoSOL ",n.default.createElement(C,{href:s},"here."))),n.default.createElement(_,{title:t.title,txHash:t.txHash,txHashTitle:t.txHashTitle,primaryButton:t.primaryButton,secondaryButton:t.secondaryButton,message:w})}default:throw new Error("Unsupported status page type")}});export{Pe as a};
//# sourceMappingURL=chunk-RSZE35V4.js.map
