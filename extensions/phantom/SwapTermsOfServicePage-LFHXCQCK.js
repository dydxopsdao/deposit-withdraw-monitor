import{Da as g}from"./chunk-EHJD6RHG.js";import"./chunk-UTDDCYTF.js";import"./chunk-MDZMKEZM.js";import"./chunk-KDEX35NE.js";import"./chunk-B4FJ72TG.js";import"./chunk-SA7BN6AR.js";import"./chunk-RTRPEFQC.js";import"./chunk-W5ZYYKQQ.js";import"./chunk-Q5KEEIPM.js";import"./chunk-SDRLROBZ.js";import"./chunk-EN6VQUOM.js";import"./chunk-EBURP5TU.js";import"./chunk-4KGATTWQ.js";import"./chunk-742BQ7F7.js";import"./chunk-ALLDIDKQ.js";import"./chunk-WPRAFVC6.js";import"./chunk-F3S5JWY2.js";import"./chunk-GO7HYR6O.js";import"./chunk-NIYDCB62.js";import"./chunk-U3MJCGUQ.js";import"./chunk-3J6D343S.js";import"./chunk-NUARI7SW.js";import"./chunk-Z3CCH6BX.js";import"./chunk-ZJ33SLYK.js";import"./chunk-GASB3NXO.js";import"./chunk-RP4HT6XN.js";import{a as w}from"./chunk-TKTYENT7.js";import"./chunk-FHFAALJ2.js";import"./chunk-5OZAXCD4.js";import"./chunk-IIOQMXXT.js";import"./chunk-4Z7SMQUN.js";import"./chunk-UQG7JMAN.js";import{d as T}from"./chunk-QNVVE6V5.js";import{ib as a,ja as u,p as o}from"./chunk-MUQF2AZ6.js";import{Db as y,eb as S}from"./chunk-M4A3OS5Y.js";import"./chunk-UCBZOSRF.js";import"./chunk-CO4KYCC7.js";import"./chunk-S2IPDOR6.js";import"./chunk-HPL6A5BE.js";import"./chunk-WWBVHQYQ.js";import"./chunk-UT4QDC7N.js";import"./chunk-2NFFZKWZ.js";import"./chunk-WITM4KDS.js";import"./chunk-M5NOGDCG.js";import"./chunk-XGAZBAFU.js";import"./chunk-F7PG7UT7.js";import"./chunk-HYOCMEEG.js";import"./chunk-SLYIHOOX.js";import"./chunk-6JDSADCT.js";import"./chunk-5JP6BIAB.js";import"./chunk-HHUNORJ5.js";import"./chunk-BIXLYDGB.js";import{H as i,x as f}from"./chunk-NVJ3LP7I.js";import"./chunk-7MK34BUQ.js";import"./chunk-7KFKYD5L.js";import"./chunk-KZCIEVG2.js";import"./chunk-RFTHTXRF.js";import"./chunk-X3THIE5D.js";import{a as x,u as p,v as d}from"./chunk-7GE6SGSX.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-O2N6PUOM.js";import"./chunk-UNDMYLJW.js";import{f as C,h as l,n as m}from"./chunk-3KENBVE7.js";l();m();var e=C(x());var O=o.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  height: 100%;
  width: 100%;
  overflow-y: scroll;
  padding: 16px;
`,k=o.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: -20px;
`,h=o(a).attrs({size:28,weight:500,color:i.colors.legacy.textPrimary})`
  margin-top: 24px;
`,P=o(a).attrs({size:16,weight:500,color:i.colors.legacy.textSecondary})`
  padding: 0px 5px;
  margin-top: 9px;
  span {
    color: ${i.colors.legacy.textPrimary};
  }
  label {
    color: ${i.colors.legacy.accentPrimary};
    cursor: pointer;
  }
`,b=o.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: fit-content;
`,A=o.div`
  margin-top: auto;
  width: 100%;
`,B=()=>{let{t:n}=f(),{mutateAsync:t}=y(),{handleHideModalVisibility:r,handleShowModalVisibility:s}=g(),v=(0,e.useCallback)(()=>{s("swapConfirmation",void 0,{event:"showSwapModal",payload:{data:{uiContext:"SwapConfirmation"}}}),r("swapTermsOfService")},[s,r]),c=S({goToConfirmation:v});return{onAgreeClick:(0,e.useCallback)(()=>{t(!0),c()},[t,c]),onCancelClick:()=>{r("swapTermsOfService")},t:n}},M=()=>{self.open(p,"_blank")},F=()=>{self.open(d,"_blank")},L=e.default.memo(({onAgreeClick:n,onCancelClick:t,t:r})=>e.default.createElement(O,null,e.default.createElement(k,null,e.default.createElement(b,null,e.default.createElement(u,null),e.default.createElement(h,null,r("termsOfServicePrimaryText")),e.default.createElement(P,null,e.default.createElement(w,{i18nKey:"termsOfServiceDiscliamerFeesEnabledInterpolated"},"We have revised our Terms of Service. By clicking ",e.default.createElement("span",null,'"I Agree"')," you agree to our new",e.default.createElement("label",{onClick:M},"Terms of Service"),".",e.default.createElement("br",null),e.default.createElement("br",null),"Our new Terms of Service include a new ",e.default.createElement("label",{onClick:F},"fee structure")," for certain products.")))),e.default.createElement(A,null,e.default.createElement(T,{primaryText:r("termsOfServiceActionButtonAgree"),secondaryText:r("commandCancel"),onPrimaryClicked:n,onSecondaryClicked:t})))),_=()=>{let n=B();return e.default.createElement(L,{...n})},X=_;export{_ as SwapTermsOfServicePage,X as default};
//# sourceMappingURL=SwapTermsOfServicePage-LFHXCQCK.js.map
