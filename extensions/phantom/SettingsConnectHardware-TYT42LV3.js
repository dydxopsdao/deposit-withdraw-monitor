import{a as N,c as D,d as F,g as G}from"./chunk-IJ6NZS5G.js";import{a as S}from"./chunk-CET5PZ5B.js";import"./chunk-NHZM4B2Z.js";import{a as T}from"./chunk-LJRZDQ6V.js";import"./chunk-B5UGWQBW.js";import"./chunk-WG3SJMX7.js";import"./chunk-WD6CRZ7D.js";import"./chunk-BHC33FHX.js";import"./chunk-EHJD6RHG.js";import"./chunk-UTDDCYTF.js";import"./chunk-MDZMKEZM.js";import"./chunk-KDEX35NE.js";import"./chunk-B4FJ72TG.js";import{a as L}from"./chunk-SA7BN6AR.js";import"./chunk-RTRPEFQC.js";import"./chunk-W5ZYYKQQ.js";import"./chunk-Q5KEEIPM.js";import"./chunk-SDRLROBZ.js";import"./chunk-EN6VQUOM.js";import"./chunk-EBURP5TU.js";import"./chunk-4KGATTWQ.js";import"./chunk-742BQ7F7.js";import"./chunk-ALLDIDKQ.js";import"./chunk-WPRAFVC6.js";import"./chunk-F3S5JWY2.js";import"./chunk-GO7HYR6O.js";import"./chunk-NIYDCB62.js";import{c as _}from"./chunk-U3MJCGUQ.js";import{a as u}from"./chunk-3J6D343S.js";import"./chunk-NUARI7SW.js";import"./chunk-Y572MH4H.js";import{a as f}from"./chunk-H4H42XEU.js";import"./chunk-Z3CCH6BX.js";import"./chunk-ZJ33SLYK.js";import"./chunk-GASB3NXO.js";import"./chunk-MPSTJLXZ.js";import"./chunk-RP4HT6XN.js";import"./chunk-TKTYENT7.js";import"./chunk-FHFAALJ2.js";import"./chunk-5OZAXCD4.js";import"./chunk-IIOQMXXT.js";import"./chunk-4Z7SMQUN.js";import"./chunk-UQG7JMAN.js";import"./chunk-QNVVE6V5.js";import{p as s,w as O}from"./chunk-MUQF2AZ6.js";import"./chunk-M4A3OS5Y.js";import"./chunk-UCBZOSRF.js";import"./chunk-CO4KYCC7.js";import"./chunk-S2IPDOR6.js";import"./chunk-HPL6A5BE.js";import"./chunk-WWBVHQYQ.js";import"./chunk-UT4QDC7N.js";import"./chunk-2NFFZKWZ.js";import"./chunk-WITM4KDS.js";import"./chunk-M5NOGDCG.js";import"./chunk-XGAZBAFU.js";import"./chunk-F7PG7UT7.js";import"./chunk-HYOCMEEG.js";import"./chunk-SLYIHOOX.js";import"./chunk-6JDSADCT.js";import{Ed as B,Ld as E}from"./chunk-5JP6BIAB.js";import"./chunk-HHUNORJ5.js";import"./chunk-BIXLYDGB.js";import{H as e,Q as P,S as $}from"./chunk-NVJ3LP7I.js";import"./chunk-7MK34BUQ.js";import"./chunk-7KFKYD5L.js";import"./chunk-KZCIEVG2.js";import"./chunk-RFTHTXRF.js";import{g as v}from"./chunk-X3THIE5D.js";import{a as H}from"./chunk-7GE6SGSX.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-O2N6PUOM.js";import"./chunk-UNDMYLJW.js";import{f as A,h as n,n as i}from"./chunk-3KENBVE7.js";n();i();var t=A(H());n();i();var a=A(H());n();i();var I=s(u)`
  cursor: pointer;
  width: 24px;
  height: 24px;
  transition: background-color 200ms ease;
  background-color: ${o=>o.$isExpanded?e.colors.legacy.black:e.colors.legacy.bgButton} !important;
  :hover {
    background-color: ${e.colors.legacy.gray};
    svg {
      fill: white;
    }
  }
  svg {
    fill: ${o=>o.$isExpanded?"white":e.colors.legacy.textSecondary};
    transition: fill 200ms ease;
    position: relative;
    ${o=>o.top?`top: ${o.top}px;`:""}
    ${o=>o.right?`right: ${o.right}px;`:""}
  }
`;var V=s(L).attrs({justify:"space-between"})`
  background-color: ${e.colors.legacy.bgWallet};
  padding: 10px 16px;
  border-bottom: 1px solid ${e.colors.legacy.borderSecondary};
  height: 46px;
  opacity: ${o=>o.opacity??"1"};
`,q=s.div`
  display: flex;
  margin-left: 10px;
  > * {
    margin-right: 10px;
  }
`,M=s.div`
  width: 24px;
  height: 24px;
`,W=({onBackClick:o,totalSteps:c,currentStepIndex:l,isHidden:d,showBackButtonOnFirstStep:r,showBackButton:g=!0})=>a.default.createElement(V,{opacity:d?0:1},g&&(r||l!==0)?a.default.createElement(I,{right:1,onClick:o},a.default.createElement(O,null)):a.default.createElement(M,null),a.default.createElement(q,null,v(c).map(p=>{let m=p<=l?e.colors.legacy.accentPrimary:e.colors.legacy.bgButton;return a.default.createElement(u,{key:p,diameter:12,color:m})})),a.default.createElement(M,null));n();i();var K=()=>{let{mutateAsync:o}=E(),{hardwareStepStack:c,pushStep:l,popStep:d,currentStep:r,setOnConnectHardwareAccounts:g,setOnConnectHardwareDone:y,setExistingAccounts:p}=N(),{data:m=[],isFetched:x,isError:k}=B(),C=_(c,(h,U)=>h?.length===U.length),X=c.length>(C??[]).length,b=C?.length===0,j={initial:{x:b?0:X?150:-150,opacity:b?1:0},animate:{x:0,opacity:1},exit:{opacity:0},transition:{duration:.2}},J=(0,t.useCallback)(()=>{r()?.props.preventBack||(r()?.props.onBackCallback&&r()?.props.onBackCallback?.(),d())},[r,d]);return T(()=>{g(async h=>{await o(h),await f.set(S,!await f.get(S))}),y(()=>self.close()),l(t.default.createElement(G,null))},c.length===0),(0,t.useEffect)(()=>{p({data:m,isFetched:x,isError:k})},[m,x,k,p]),t.default.createElement(D,null,t.default.createElement(W,{totalSteps:3,onBackClick:J,showBackButton:!r()?.props.preventBack,currentStepIndex:c.length-1}),t.default.createElement(P,{mode:"wait"},t.default.createElement($.div,{style:{display:"flex",flexGrow:1},key:`${c.length}_${C?.length}`,...j},t.default.createElement(F,null,r()))))},Po=K;export{Po as default};
//# sourceMappingURL=SettingsConnectHardware-TYT42LV3.js.map
