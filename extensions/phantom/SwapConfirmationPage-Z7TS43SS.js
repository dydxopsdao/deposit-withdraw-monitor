import{a as tt}from"./chunk-NHZM4B2Z.js";import{Da as ot}from"./chunk-EHJD6RHG.js";import"./chunk-UTDDCYTF.js";import"./chunk-MDZMKEZM.js";import"./chunk-KDEX35NE.js";import"./chunk-B4FJ72TG.js";import"./chunk-SA7BN6AR.js";import"./chunk-RTRPEFQC.js";import"./chunk-W5ZYYKQQ.js";import{e as X,f as Y,g as R}from"./chunk-Q5KEEIPM.js";import"./chunk-SDRLROBZ.js";import"./chunk-EN6VQUOM.js";import"./chunk-EBURP5TU.js";import"./chunk-4KGATTWQ.js";import"./chunk-742BQ7F7.js";import"./chunk-ALLDIDKQ.js";import"./chunk-WPRAFVC6.js";import"./chunk-F3S5JWY2.js";import"./chunk-GO7HYR6O.js";import"./chunk-NIYDCB62.js";import"./chunk-U3MJCGUQ.js";import"./chunk-3J6D343S.js";import"./chunk-NUARI7SW.js";import"./chunk-Z3CCH6BX.js";import"./chunk-ZJ33SLYK.js";import"./chunk-GASB3NXO.js";import"./chunk-RP4HT6XN.js";import"./chunk-TKTYENT7.js";import"./chunk-FHFAALJ2.js";import"./chunk-5OZAXCD4.js";import"./chunk-IIOQMXXT.js";import"./chunk-4Z7SMQUN.js";import"./chunk-UQG7JMAN.js";import{c as Q}from"./chunk-QNVVE6V5.js";import{W as q,c as K,ib as k,l as Z,p,qa as J}from"./chunk-MUQF2AZ6.js";import{Sb as G}from"./chunk-M4A3OS5Y.js";import"./chunk-UCBZOSRF.js";import"./chunk-CO4KYCC7.js";import{p as U}from"./chunk-S2IPDOR6.js";import"./chunk-HPL6A5BE.js";import"./chunk-WWBVHQYQ.js";import"./chunk-UT4QDC7N.js";import"./chunk-2NFFZKWZ.js";import"./chunk-WITM4KDS.js";import"./chunk-M5NOGDCG.js";import"./chunk-XGAZBAFU.js";import"./chunk-F7PG7UT7.js";import"./chunk-HYOCMEEG.js";import"./chunk-SLYIHOOX.js";import"./chunk-6JDSADCT.js";import{Vd as j,Za as C}from"./chunk-5JP6BIAB.js";import"./chunk-HHUNORJ5.js";import"./chunk-BIXLYDGB.js";import{H as g,L as z,Q as L,Ra as E,S as B,Sa as _,la as W,x as b}from"./chunk-NVJ3LP7I.js";import"./chunk-7MK34BUQ.js";import"./chunk-7KFKYD5L.js";import"./chunk-KZCIEVG2.js";import"./chunk-RFTHTXRF.js";import"./chunk-X3THIE5D.js";import{a as O}from"./chunk-7GE6SGSX.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-O2N6PUOM.js";import"./chunk-UNDMYLJW.js";import{f as M,h as T,n as y}from"./chunk-3KENBVE7.js";T();y();var e=M(O());T();y();var i=M(O());var it=p.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 100%;
  padding: ${t=>t.addScreenPadding?"16px":"0"};
`,Tt=p.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`,yt=p.div`
  width: 100%;
  > * {
    margin-top: 10px;
  }
  padding: 16px;
`,Ct=p.div`
  display: flex;
  justify-content: flex-end;
  position: absolute;
  width: 100%;
  padding: 16px;
`,bt=p.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`,qt=p.div`
  position: relative;
`,Jt=p.div`
  position: absolute;
  top: 0;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    fill: ${g.colors.legacy.accentSuccess};
  }
`,kt=p(k).attrs({size:28,weight:500,color:g.colors.legacy.textPrimary})`
  margin-top: 24px;
  margin-left: 12px;
  margin-right: 12px;
`,et=p(k).attrs({size:16,weight:400,color:g.colors.legacy.textSecondary})`
  margin-top: 9px;
  margin-left: 12px;
  margin-right: 12px;
  span {
    color: ${g.colors.legacy.textSecondary};
    font-weight: bold;
  }
`,ht=p(k).attrs({size:16,weight:500,color:g.colors.legacy.accentPrimary})`
  margin-top: 18px;
  text-decoration: none;
  ${t=>t.opacity!==0&&Z`
      &:hover {
        cursor: pointer;
        color: ${g.colors.legacy.accentPrimaryLight};
      }
    `}
`,Lt=({description:t,header:n,icon:o,onClose:r,title:c,txLink:s,isClosable:l,disclaimer:m})=>{let{t:a}=b(),f=()=>{s&&self.open(s)};return i.default.createElement(it,null,n,i.default.createElement(Tt,null,i.default.createElement(L,{mode:"wait",initial:!0},i.default.createElement(B.div,{key:c,initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},transition:{duration:.2}},o)),i.default.createElement(kt,null,c),i.default.createElement(et,null,t),s&&i.default.createElement(L,{mode:"wait",initial:!1},i.default.createElement(B.div,{key:s,initial:{opacity:0,y:16},animate:{opacity:1,y:0},exit:{opacity:0},transition:{duration:.2}},i.default.createElement(ht,{opacity:1,onClick:f},a("swapTxConfirmationViewTransaction"))))),l&&r?i.default.createElement(yt,null,i.default.createElement(et,null,m),l&&r?i.default.createElement(Q,{onClick:r},a("commandClose")):null):null)};var nt=({ledgerAction:t,numberOfTransactions:n,cancel:o,ledgerApp:r})=>i.default.createElement(it,{addScreenPadding:!0},i.default.createElement(Y,{ledgerAction:t,numberOfTransactions:n,cancel:o,ledgerApp:r}));var Bt=t=>self.open(t,"_blank"),rt=({txErrorTitle:t,txErrorMessage:n,txErrorHelpButtonLink:o,txLink:r,onClose:c})=>i.default.createElement(Lt,{header:i.default.createElement(Ct,null,i.default.createElement(bt,{onClick:()=>Bt(o)},i.default.createElement(q,{fill:"white"}))),icon:i.default.createElement(tt,{type:"failure"}),description:n,onClose:c,title:t,txLink:r,isClosable:!0});var Et=t=>self.open(t,"_blank"),At=()=>{let{handleHideModalVisibility:t}=ot(),n=K(),{data:o}=j(),c=o?.type==="ledger",s="swapConfirmation",l=(0,e.useCallback)(()=>{t(s)},[t,s]),m=(0,e.useCallback)(()=>{l(),n("/notifications")},[l,n]);return G({isLedger:c,goToSwapTab:l,goToActivityTab:m})},Pt=({txError:t,txErrorTitle:n,txErrorMessage:o,txErrorHelpButtonLink:r,txLink:c,executeSwap:s,numberOfTransactions:l,addressType:m,onClose:a})=>X(t)?e.default.createElement(R,{ledgerActionError:t,onRetryClick:s,onCancelClick:a}):t?e.default.createElement(rt,{txErrorTitle:n,txErrorMessage:o,txLink:c,onClose:a,txErrorHelpButtonLink:r}):e.default.createElement(nt,{ledgerAction:s,numberOfTransactions:l,cancel:a,ledgerApp:U(m)}),Nt=e.default.memo(t=>{let n=(0,e.useRef)(null),{t:o}=b(),r=o("swapTxConfirmationViewTransaction"),{addressType:c,executeSwap:s,isLedger:l,isBridge:m,sellAsset:a,buyAsset:f,estimatedTime:st,isFailure:at,isSuccess:A,isClosable:pt,notEnoughSol:ct,numberOfTransactions:lt,txError:mt,txErrorTitle:P,txErrorMessage:N,txLink:h,txErrorHelpButtonLink:v,isReadyToExecute:dt,onClose:I,onSwapSuccess:ut}=t,[D,gt]=(0,e.useState)(!1),d,u,V,w,$=o("commandClose"),H,S,x=pt||!1;if((0,e.useEffect)(()=>{!S&&setTimeout(()=>{!D&&n.current?.start(),gt(!0)},200)},[D,S]),l&&!h&&dt)return e.default.createElement(Pt,{isBridge:m,txError:mt,txErrorTitle:P,txErrorMessage:N,txErrorHelpButtonLink:v,txLink:h,numberOfTransactions:lt,addressType:c,executeSwap:s,onClose:I});if(m&&a){let F=`${a.amount} ${a.symbol}`,ft=C.getNetworkName(a.networkID),wt=`${f.amount} ${f.symbol}`,St=C.getNetworkName(f.networkID);d=o("swapTxBridgeSubmitting"),u=o("swapTxBridgeSubmittingDescription",{sellAmount:F,sellNetwork:ft,buyAmount:wt,buyNetwork:St})}else u=`${f.symbol||o("swapTxConfirmationTokens")} ${o("swapTxConfirmationTokensWillBeDeposited")} `,d=o("swapTxConfirmationSwappingTokens");return ct&&(d=o("notEnoughSolPrimaryText"),u=o("notEnoughSolSecondaryText"),S=e.default.createElement(J,{width:E,height:E}),w={theme:"primary"},x=!0),A&&(m?(d=o("swapTxBridgeSubmitted"),u=o("swapTxBridgeSubmittedDescription",{estimatedTime:st}),V=o("swapTxBridgeSubmittedDisclaimer")):(d=o("swapTxConfirmationTokensDepositedTitle"),u=o("swapTxConfirmationTokensDepositedBody")),w={theme:"primary"},x=!0,n.current?.success()),at&&(d=P,u=N,w={theme:"secondary"},$=o("commandClose"),x=!0,H=e.default.createElement(z,{alignItems:"flex-end"},e.default.createElement(W,{icon:"HelpCircle",size:32,onClick:()=>Et(v),backgroundColor:[null,"bgButton"],color:["textSecondary","textPrimary"],label:o("commandHelp")})),n.current?.fail()),e.default.createElement(_,{ref:n,title:d,txLink:h,txTitle:r,description:u,disclaimer:V,isClosable:x,buttonVariant:w,buttonText:$,onClose:A?ut:I,header:H,customIcon:S})}),vt=()=>{let t=At();return(0,e.useEffect)(()=>{!t.isReadyToExecute||t.isLedger||t.executeSwap()},[t.isReadyToExecute,t.isLedger]),e.default.createElement(Nt,{...t})},fo=vt;export{vt as SwapConfirmationPage,fo as default};
//# sourceMappingURL=SwapConfirmationPage-Z7TS43SS.js.map
