import{a as d,b as E,c as f}from"./chunk-45ZYFPNT.js";import{G as z,j as K,o as _}from"./chunk-EHJD6RHG.js";import{a as T,e as D}from"./chunk-RTRPEFQC.js";import{a as V}from"./chunk-NUARI7SW.js";import{a}from"./chunk-TKTYENT7.js";import{a as U}from"./chunk-UQG7JMAN.js";import{hb as q,ib as x,p as i}from"./chunk-MUQF2AZ6.js";import{h as O,i as N}from"./chunk-UT4QDC7N.js";import{hc as v}from"./chunk-5JP6BIAB.js";import{F as l,H as m,L as C,M as F,ba as I}from"./chunk-NVJ3LP7I.js";import{a as L}from"./chunk-7GE6SGSX.js";import{f as P,h as p,n as u}from"./chunk-3KENBVE7.js";p();u();var o=P(L());p();u();var n=P(L());var oo=i.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 83px;
  padding: 16px;
`,eo=i.div`
  margin-left: 12px;
  width: 100%;
`,to=i(x).attrs({size:14,weight:400,color:m.colors.legacy.textSecondary,textAlign:"left"})``,io=i.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`,no=i(x).attrs({size:28,lineHeight:32,weight:600,color:m.colors.legacy.textPrimary,textAlign:"left"})`
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`,S=({title:r,network:k,tokenType:g,symbol:h,logoUri:y,tokenAddress:t,amount:e,amountUsd:b})=>n.default.createElement(oo,null,n.default.createElement(_,{image:{type:"fungible",src:y,fallback:h||t},size:44,tokenType:g,chainMeta:k}),n.default.createElement(eo,null,n.default.createElement(io,null,n.default.createElement(to,null,r),n.default.createElement(z,{value:b,font:"caption",color:"textSecondary"})),n.default.createElement(no,null,e)));var s={screen:l({overflow:"auto"}),body:l({display:"flex",flexDirection:"column",justifyContent:"space-between"}),content:l({display:"flex",flexDirection:"column",width:"100%"}),assets:l({backgroundColor:"bgRow",borderRadius:6,width:"100%"}),line:l({backgroundColor:"bgWallet",width:"100%",height:1}),button:l({width:"100%",height:48})},w=i(q).attrs({color:U.grayLight,size:14})`
  text-align: left;
  line-height: normal;
  max-width: 100%;
  margin: 16px 0;
`,J=i.a.attrs({target:"_blank",rel:"noopener noreferrer"})`
  color: ${r=>r.theme.purple};
  text-decoration: none;
  cursor: pointer;
`,ro=({isJitoSOL:r})=>r?o.default.createElement(w,null,o.default.createElement(a,{i18nKey:"liquidStakeReviewConversionFootnote"},"When you stake Solana tokens in exchange for JitoSOL you'll receive a slightly lesser amount of JitoSOL.",o.default.createElement(J,{href:O},"Learn more"))):o.default.createElement(o.default.Fragment,null,o.default.createElement(w,null,o.default.createElement(D,{tooltipAlignment:"topLeft",iconSize:12,lineHeight:17,fontWeight:400,info:o.default.createElement(E,{tooltipContent:o.default.createElement(T,null,o.default.createElement(a,{i18nKey:"liquidStakeReviewPhantomFeeFootnoteTooltip"},"A fee of 8% is automatically factored into this quote. While staked, a percentage of earned rewards is taken as a fee"))}),textColor:m.colors.legacy.textSecondary},o.default.createElement(a,{i18nKey:"liquidStakeReviewPhantomFeeFootnote"},"Est. APY includes an 8% Phantom fee"))),o.default.createElement(w,null,o.default.createElement(a,{i18nKey:"liquidStakeReviewPhantomFeeFootnoteDescription"},"When you stake Solana tokens in exchange for PSOL you'll receive a slightly lesser amount of PSOL. A 0.1% fee is charged for withdrawals."))),lo=()=>o.default.createElement(w,null,o.default.createElement(a,{i18nKey:"liquidStakeDepositStakeDisclaimer"},"You'll receive JitoSOL in 10 hours.",o.default.createElement(J,{href:N},"Learn more"))),Io=o.default.memo(({process:r,headerTitle:k,onBack:g,onPrimaryButtonPress:h,canSubmit:y,payAsset:t,receiveAsset:e,accountLabelText:b,account:H,providerLabelText:W,providerName:A,apyLabelText:B,apyLabelTextTooltip:j,apy:M,networkFeeLabelText:Y,networkFee:$,isLoading:c,networkFeeErrorMsg:G,primaryButtonText:Q,isJitoSOL:X})=>{let Z=[e?o.default.createElement(d,{key:"account-row",label:b},o.default.createElement(f,null,o.default.createElement(F,{font:"body",children:v(H,4)}))):null,o.default.createElement(d,{key:"provider-row",label:W},o.default.createElement(f,null,A)),o.default.createElement(d,{key:"apy-row",label:B,tooltipContent:o.default.createElement(T,null,j)},o.default.createElement(f,null,M)),o.default.createElement(d,{key:"network-fee-row",label:Y,isLoading:c,error:G},o.default.createElement(f,null,$))];return o.default.createElement("div",{className:s.screen},o.default.createElement(K,{leftButton:{type:"back",onClick:g},titleSize:"regular"},k),o.default.createElement("div",{className:s.body},o.default.createElement("div",{className:s.content},o.default.createElement("div",{className:s.assets},t?o.default.createElement(S,{title:t.title,amount:t.amount+" "+t.symbol,amountUsd:t.amountUsd,logoUri:t.logoUri,symbol:t.symbol,tokenType:t.tokenType,tokenAddress:t.tokenAddress,network:t.network}):null,o.default.createElement("div",{className:s.line}),e?o.default.createElement(S,{title:e.title,amount:e.amount+" "+e.symbol,amountUsd:e.amountUsd,logoUri:e.logoUri,symbol:e.symbol,tokenType:e.tokenType,tokenAddress:e.tokenAddress,network:e.network}):null),o.default.createElement(C,{borderRadius:8,gap:1,overflow:"hidden",marginTop:"base"},Z),r==="mint"?o.default.createElement(ro,{isJitoSOL:X}):o.default.createElement(lo,null)),o.default.createElement(V,null,o.default.createElement(I,{className:s.button,theme:"primary",disabled:!y||c,onClick:h},Q))))});export{Io as a};
//# sourceMappingURL=chunk-E3LDVBLU.js.map
