import{a as s,c as f}from"./chunk-45ZYFPNT.js";import{a as T}from"./chunk-NHZM4B2Z.js";import{Da as b,I}from"./chunk-EHJD6RHG.js";import"./chunk-UTDDCYTF.js";import"./chunk-MDZMKEZM.js";import"./chunk-KDEX35NE.js";import"./chunk-B4FJ72TG.js";import"./chunk-SA7BN6AR.js";import"./chunk-RTRPEFQC.js";import"./chunk-W5ZYYKQQ.js";import"./chunk-Q5KEEIPM.js";import"./chunk-SDRLROBZ.js";import"./chunk-EN6VQUOM.js";import"./chunk-EBURP5TU.js";import"./chunk-4KGATTWQ.js";import"./chunk-742BQ7F7.js";import"./chunk-ALLDIDKQ.js";import"./chunk-WPRAFVC6.js";import"./chunk-F3S5JWY2.js";import"./chunk-GO7HYR6O.js";import"./chunk-NIYDCB62.js";import"./chunk-U3MJCGUQ.js";import"./chunk-3J6D343S.js";import"./chunk-NUARI7SW.js";import"./chunk-Z3CCH6BX.js";import"./chunk-ZJ33SLYK.js";import"./chunk-GASB3NXO.js";import"./chunk-RP4HT6XN.js";import"./chunk-TKTYENT7.js";import"./chunk-FHFAALJ2.js";import"./chunk-5OZAXCD4.js";import"./chunk-IIOQMXXT.js";import"./chunk-4Z7SMQUN.js";import"./chunk-UQG7JMAN.js";import{c as C,d as h}from"./chunk-QNVVE6V5.js";import{ib as l,p as o}from"./chunk-MUQF2AZ6.js";import"./chunk-M4A3OS5Y.js";import"./chunk-UCBZOSRF.js";import"./chunk-CO4KYCC7.js";import"./chunk-S2IPDOR6.js";import"./chunk-HPL6A5BE.js";import"./chunk-WWBVHQYQ.js";import"./chunk-UT4QDC7N.js";import"./chunk-2NFFZKWZ.js";import"./chunk-WITM4KDS.js";import"./chunk-M5NOGDCG.js";import"./chunk-XGAZBAFU.js";import"./chunk-F7PG7UT7.js";import"./chunk-HYOCMEEG.js";import"./chunk-SLYIHOOX.js";import"./chunk-6JDSADCT.js";import{Za as c,fb as y,ub as x}from"./chunk-5JP6BIAB.js";import"./chunk-HHUNORJ5.js";import"./chunk-BIXLYDGB.js";import{H as a,L as B,x as g}from"./chunk-NVJ3LP7I.js";import"./chunk-7MK34BUQ.js";import"./chunk-7KFKYD5L.js";import"./chunk-KZCIEVG2.js";import"./chunk-RFTHTXRF.js";import"./chunk-X3THIE5D.js";import{a as M}from"./chunk-7GE6SGSX.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-O2N6PUOM.js";import"./chunk-UNDMYLJW.js";import{f as v,h as u,n as d}from"./chunk-3KENBVE7.js";u();d();var n=v(M());var P=o.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: scroll;
`,D=o.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 90px;
`,S=o(l).attrs({size:28,weight:500,color:a.colors.legacy.textPrimary})`
  margin: 16px;
`,V=o(l).attrs({size:14,weight:400,lineHeight:17,color:a.colors.legacy.textSecondary})`
  max-width: 275px;

  span {
    color: white;
  }
`,$=({networkId:t,token:r})=>{let{t:i}=g(),{handleHideModalVisibility:m}=b(),p=(0,n.useCallback)(()=>{m("insufficientBalance")},[m]),w=t&&y(x(c.getChainID(t))),{canBuy:k,openBuy:F}=I({caip19:w||"",context:"modal",analyticsEvent:"fiatOnrampFromInsufficientBalance"}),e=t?c.getTokenSymbol(t):i("tokens");return n.default.createElement(P,null,n.default.createElement("div",null,n.default.createElement(D,null,n.default.createElement(T,{type:"failure",backgroundWidth:75}),n.default.createElement(S,null,i("insufficientBalancePrimaryText",{tokenSymbol:e})),n.default.createElement(V,null,i("insufficientBalanceSecondaryText",{tokenSymbol:e})),r?n.default.createElement(B,{borderRadius:8,gap:1,marginTop:32,width:"100%"},n.default.createElement(s,{label:i("insufficientBalanceRemaining")},n.default.createElement(f,{color:a.colors.legacy.accentAlert},`${r.balance} ${e}`)),n.default.createElement(s,{label:i("insufficientBalanceRequired")},n.default.createElement(f,null,`${r.required} ${e}`))):null)),k?n.default.createElement(h,{primaryText:i("buyAssetInterpolated",{tokenSymbol:e}),onPrimaryClicked:F,secondaryText:i("commandCancel"),onSecondaryClicked:p}):n.default.createElement(C,{onClick:p},i("commandCancel")))},L=$;export{$ as InsufficientBalance,L as default};
//# sourceMappingURL=InsufficientBalance-JE6GWNI5.js.map
