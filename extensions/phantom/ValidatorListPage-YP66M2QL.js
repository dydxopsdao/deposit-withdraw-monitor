import{a as U}from"./chunk-PTCRS5OS.js";import{c as I,d as b,e as F,i as W,n as z}from"./chunk-UTDDCYTF.js";import"./chunk-KDEX35NE.js";import"./chunk-SA7BN6AR.js";import{a as p,b as f,e as H}from"./chunk-RTRPEFQC.js";import"./chunk-SDRLROBZ.js";import{a as L,b as P}from"./chunk-EN6VQUOM.js";import{a as V}from"./chunk-EBURP5TU.js";import{b as S}from"./chunk-4KGATTWQ.js";import"./chunk-ALLDIDKQ.js";import"./chunk-GO7HYR6O.js";import{g as k}from"./chunk-NIYDCB62.js";import{f as T}from"./chunk-U3MJCGUQ.js";import"./chunk-3J6D343S.js";import{a as x}from"./chunk-NUARI7SW.js";import"./chunk-ZJ33SLYK.js";import"./chunk-GASB3NXO.js";import"./chunk-TKTYENT7.js";import"./chunk-5OZAXCD4.js";import"./chunk-IIOQMXXT.js";import"./chunk-4Z7SMQUN.js";import{c as w}from"./chunk-QNVVE6V5.js";import{ib as l,p as i}from"./chunk-MUQF2AZ6.js";import"./chunk-HPL6A5BE.js";import"./chunk-WWBVHQYQ.js";import"./chunk-UT4QDC7N.js";import"./chunk-2NFFZKWZ.js";import"./chunk-M5NOGDCG.js";import"./chunk-XGAZBAFU.js";import"./chunk-F7PG7UT7.js";import"./chunk-HYOCMEEG.js";import"./chunk-SLYIHOOX.js";import"./chunk-6JDSADCT.js";import{hc as A}from"./chunk-5JP6BIAB.js";import"./chunk-HHUNORJ5.js";import"./chunk-BIXLYDGB.js";import{Da as v,H as d,L as C,x as s}from"./chunk-NVJ3LP7I.js";import"./chunk-7MK34BUQ.js";import"./chunk-7KFKYD5L.js";import"./chunk-KZCIEVG2.js";import"./chunk-RFTHTXRF.js";import{Z as y,w as h}from"./chunk-X3THIE5D.js";import{a as O}from"./chunk-7GE6SGSX.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-UNDMYLJW.js";import{f as j,h as u,n as g}from"./chunk-3KENBVE7.js";u();g();var t=j(O());var G=o=>{let{t:e}=s(),{searchResults:r,isLoading:n,hasError:a,isSuccess:m,showApy:D,onRefetch:B,setSearchTerm:M}=V(),c=(0,t.useRef)();return(0,t.useEffect)(()=>{setTimeout(()=>c.current?.focus(),200)},[]),t.default.createElement(b,{isLoading:n},a?t.default.createElement(I,{title:e("errorAndOfflineSomethingWentWrong"),description:e("validatorListErrorFetching"),refetch:B}):t.default.createElement(Q,null,t.default.createElement(X,null,t.default.createElement(k,{ref:c,tabIndex:0,placeholder:e("commandSearch"),onChange:_=>M(_.currentTarget.value),maxLength:50})),m&&r.length?t.default.createElement(q,{data:r,showApy:D}):t.default.createElement(K,null)),t.default.createElement(x,null,t.default.createElement(w,{onClick:o.onClose},e("commandCancel"))))},Lt=G,K=()=>{let{t:o}=s();return t.default.createElement(C,{padding:"screen"},t.default.createElement(l,{size:16,color:d.colors.legacy.textSecondary},o("validatorListNoResults")))},N=84,q=o=>{let{data:e,showApy:r}=o;return t.default.createElement(t.default.Fragment,null,t.default.createElement(Z,{showApy:r}),t.default.createElement(z,null,t.default.createElement(v,null,({height:n,width:a})=>t.default.createElement(W,{height:n,itemCount:e.length,itemData:e,itemSize:N,width:a},J))))},J=({index:o,style:e,data:r})=>{let n=r[o];return t.default.createElement("div",{key:n.identityPubkey,style:e},t.default.createElement($,{voteAccountPubkey:n.voteAccountPubkey,formattedPercentValue:n.totalApy?y(n.totalApy/100,{format:"0.00%"}):"",activatedStake:n.activatedStake,name:n.info?.name,keybaseUsername:n.info?.keybaseUsername,iconUrl:n.info?.iconUrl}))},Q=i.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
`,X=i.div`
  position: relative;
`,Y=i.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
`,E=i(H).attrs(()=>({iconSize:12,lineHeight:19,fontWeight:500,fontSize:16}))``,Z=({showApy:o})=>{let{t:e}=s();return t.default.createElement(Y,null,t.default.createElement(E,{tooltipAlignment:"bottomLeft",info:t.default.createElement(f,null,t.default.createElement(p,null,e("validatorInfoDescription")))},e("validatorInfoTooltip")),o?t.default.createElement(E,{tooltipAlignment:"bottomRight",info:t.default.createElement(f,null,t.default.createElement(p,null,e("validatorApyInfoDescription")))},e("validatorApyInfoTooltip")):null)},$=o=>{let{pushDetailView:e,popDetailView:r}=T(),n=(0,t.useRef)(null),{data:a}=S(o.keybaseUsername),m=o.name??o.keybaseUsername??A(o.voteAccountPubkey);return t.default.createElement(R,{ref:n,onClick:()=>{e(t.default.createElement(U,{voteAccountPubkey:o.voteAccountPubkey,onClose:r}))}},t.default.createElement(tt,{iconUrl:o.iconUrl??a}),t.default.createElement(ot,null,t.default.createElement(et,null,t.default.createElement(l,{size:16,weight:600,lineHeight:19,textAlign:"left",noWrap:!0},h(m,20)),t.default.createElement(l,{size:14,color:d.colors.legacy.textSecondary,lineHeight:19,textAlign:"left",noWrap:!0},t.default.createElement(P,{format:"0,0"},o.activatedStake))),t.default.createElement(l,{size:14,weight:400,lineHeight:19,textAlign:"left",noWrap:!0},o.formattedPercentValue)))},R=i(F)`
  display: grid;
  grid-template-columns: 44px auto;
  column-gap: 10px;
`,tt=i(L).attrs({width:44})``,ot=i.div`
  overflow: hidden;
  width: 100%;
  display: flex;
  justify-content: space-between;
`,et=i.div`
  display: flex;
  flex-direction: column;
`;export{G as ValidatorListPage,Lt as default};
//# sourceMappingURL=ValidatorListPage-YP66M2QL.js.map
