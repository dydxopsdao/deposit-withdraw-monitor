import{a as B}from"./chunk-NHZM4B2Z.js";import{a as st}from"./chunk-LJRZDQ6V.js";import{b as he}from"./chunk-B5UGWQBW.js";import{b as dt,c as pt,d as xe}from"./chunk-Q5KEEIPM.js";import{d as Y}from"./chunk-742BQ7F7.js";import{a as it}from"./chunk-WPRAFVC6.js";import{a as Oe}from"./chunk-MPSTJLXZ.js";import{l as rt,m as ct}from"./chunk-RP4HT6XN.js";import{b as ie,c as L}from"./chunk-QNVVE6V5.js";import{ib as j,p as s,za as at}from"./chunk-MUQF2AZ6.js";import{b as Je}from"./chunk-M4A3OS5Y.js";import{a as tt,l as ot,x as ae}from"./chunk-S2IPDOR6.js";import{a as se}from"./chunk-WITM4KDS.js";import{b as nt}from"./chunk-XGAZBAFU.js";import{Jc as ye,O as Ue,P as Ve,Q as qe,Ra as Ke,Za as F,bc as Ce,hc as Ze,td as Qe,ud as we,vd as Re,we as et,xd as be}from"./chunk-5JP6BIAB.js";import{H as P,x as v}from"./chunk-NVJ3LP7I.js";import{N as Ye,P as Xe}from"./chunk-7MK34BUQ.js";import{D as je,e as De,fa as $e,la as ze}from"./chunk-X3THIE5D.js";import{a as te}from"./chunk-7GE6SGSX.js";import{f as ee,h as g,n as A}from"./chunk-3KENBVE7.js";g();A();var kt={existingAccounts:{data:[],isFetched:!1,isError:!1},hardwareStepStack:[],hardwareStepSubStack:{},selectedChains:[],selectedChainsMap:new Map,chainImportStep:1,derivedAccountGroups:[],discoveredAccounts:[],activeAccountsFound:!1,selectedAccounts:{},onConnectHardwareAccounts:e=>Promise.resolve(),onConnectHardwareDone:()=>{}},k=et((e,o)=>({...kt,pushStep:t=>{let r=o().hardwareStepStack;e({hardwareStepStack:r.concat(t)})},popStep:()=>{let r=o().hardwareStepStack.length-1;if((o().hardwareStepSubStack[r]??[]).length)return e(ye(d=>{d.hardwareStepSubStack[r]=d.hardwareStepSubStack[r].slice(0,-1)}));e(ye(d=>{d.hardwareStepStack=d.hardwareStepStack.slice(0,-1)}))},pushSubStep:t=>{let c=o().hardwareStepStack.length-1,d=o().hardwareStepSubStack[c]??[];e(ye(C=>{C.hardwareStepSubStack[c]=d.concat([t])}))},currentStep:()=>{let t=o().hardwareStepStack,r=o().hardwareStepSubStack,c=t.length>0?t.length-1:t.length;return r[c]?.length?De(r[c]):De(t)},setExistingAccounts:t=>{e({existingAccounts:t})},setSelectedChains:(t,r)=>{e({selectedChains:t,selectedChainsMap:r})},setDecrementChainImportStep:()=>{let t=o().chainImportStep;e({chainImportStep:t-1})},setIncrementChainImportStep:()=>{let t=o().chainImportStep;e({chainImportStep:t+1})},setDerivedAccountGroups:t=>{e({derivedAccountGroups:t})},setDiscoveredAccounts:(t,r)=>{e({discoveredAccounts:t,activeAccountsFound:r})},selectAccount:t=>{let c={...o().selectedAccounts};c[t]=!0,e({selectedAccounts:c})},deselectAccount:t=>{let c={...o().selectedAccounts};delete c[t],e({selectedAccounts:c})},setSelectedAccounts:t=>{e({selectedAccounts:t})},setOnConnectHardwareAccounts:t=>{e({onConnectHardwareAccounts:t})},setOnConnectHardwareDone:t=>{e({onConnectHardwareDone:t})}}));g();A();g();A();g();A();var ut=s.main`
  box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.4);
  width: ${420}px;
  min-height: ${480}px;
  position: relative;
  overflow: hidden;
  background-color: ${P.colors.legacy.bgWallet};
  border: 1px solid ${P.colors.legacy.borderPrimary};
  border-radius: 16px;
`;var go=s(ut)`
  display: flex;
  flex-direction: column;
`,Ao=s.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  padding: 20px 20px;
`,X=s.div`
  padding-top: 44px;
`,M=s.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  width: 100%;
  overflow: auto;
`;g();A();var H=ee(te());g();A();var a=ee(te());g();A();var I=ee(te());g();A();var W=ee(te());var Te=()=>{let{t:e}=v(),{discoveredAccounts:o,selectedAccounts:t,onConnectHardwareAccounts:r,onConnectHardwareDone:c}=k(),{mutateAsync:d}=Qe(),[C,S]=(0,W.useState)(!1),f=(0,W.useMemo)(()=>o.filter(n=>!!t[n.discoveryIdentifier]),[o,t]);return(0,W.useEffect)(()=>{if(f.length){let n=[],y=new Set;for(let p of f){let{accounts:w,seedIndex:T,accountIndex:x}=p,N=[],D=[];for(let l of w)Ue(l.derivationPathType)?(D.push({pathType:l.derivationPathType,value:l.publicKey}),(!("amount"in l)||parseFloat(l.amount)!==0)&&y.add(l.chainType)):(Ve(l.derivationPathType)||qe(l.derivationPathType))&&N.push({pathType:l.derivationPathType,value:l.address});n.push({derivationIndex:T,addresses:N,publicKeys:D,accountIndex:x})}r({accounts:n}).then(()=>{y.size>0&&d({addressTypes:Array.from(y)})}).finally(()=>S(!0))}else S(!0)},[f,r,d]),W.default.createElement(M,null,W.default.createElement(X,null,W.default.createElement(Y,{icon:W.default.createElement(B,{type:"success"}),primaryText:e("connectHardwareAccountsAddedInterpolated",{numOfAccounts:f.length}),headerStyle:"large",secondaryText:e("connectHardwareFinishSecondaryText")})),W.default.createElement(L,{onClick:c,theme:"primary",disabled:!C},e("pastParticipleDone")))};g();A();var E=ee(te());g();A();var h=ee(te());var Ot=(e,o,t)=>{switch(o){case"seed":return e("onboardingImportAccountsAccountName",{walletIndex:t});case"ledger":return e("onboardingImportAccountsLedgerAccountName",{walletIndex:t})}},Pt=({account:e})=>{let{t:o}=v();return h.default.createElement(Wt,null,h.default.createElement(Bt,null,h.default.createElement(se,{networkID:e.chain.id,size:40,borderColor:"bgRow"})),h.default.createElement(Nt,null,h.default.createElement(Lt,null,h.default.createElement(it,{networkID:e.chain.id,walletAddress:e.address},h.default.createElement(ve,null,e.chain.name)),h.default.createElement(ve,null,Ze(e.address,4))),h.default.createElement(He,null,"amount"in e&&"chain"in e?h.default.createElement(lt,null,$e(e.amount)," ",e.chain.symbol):null,"amount"in e&&e.lastActivityTimestamp?h.default.createElement(lt,null,o("onboardingImportAccountsLastActive",{formattedTimestamp:je(e.lastActivityTimestamp*1e3,!0)})):null)))},mt=h.default.memo(({accountType:e,accounts:o,checked:t,accountIndex:r,onPress:c})=>{let{t:d}=v(),C=r+1;return h.default.createElement(ht,null,h.default.createElement(Ft,null,h.default.createElement(ve,null,Ot(d,e,C)),h.default.createElement(he,{checked:t,onChange:c,"data-testid":"account-select-address-row-checkbox"})),o.map((S,f)=>h.default.createElement(Pt,{key:`${S.address}-${f}`,account:S})))}),jo=h.default.memo(({totalAccounts:e,selectedAccounts:o,onPress:t})=>{let{t:r}=v();return h.default.createElement(ht,null,h.default.createElement(Et,null,h.default.createElement(ve,null,r("onboardingSelectAccountsNoOfAccountsSelected",{numOfAccounts:o}))," ",h.default.createElement(Mt,null,r("onboardingSelectAccountSelectAllText")," ",h.default.createElement(he,{checked:o===e,onChange:t,"data-testid":"account-select-all-checkbox"}))))}),ht=s.div`
  margin-bottom: 24px;
  width: 100%;
`,Bt=s.div`
  flex-shrink: 0;
  margin-right: 10px;
`,Nt=s.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`,He=s.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`,Lt=s(He)`
  margin-bottom: 2px;
`,Et=s(He)`
  background: ${P.colors.legacy.bgRow};
  margin-bottom: 1px;
  padding: 12px 10px 12px 14px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`,Mt=s.div`
  display: flex;
  align-items: center;
  gap: 10px;
`,Ft=s(He)`
  background: ${P.colors.legacy.bgRow};
  margin-bottom: 1px;
  padding: 12px 16px 12px 14px;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;

  & > span {
    margin-right: 0;
  }
`,Wt=s.div`
  background: ${P.colors.legacy.bgRow};
  margin-top: 1px;
  padding: 17px 16px 17px 14px;
  width: 100%;
  display: flex;
  align-items: center;

  &:last-of-type {
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
  }
`,ve=s(j).attrs({size:16,lineHeight:19,weight:600})``,lt=s(j).attrs({size:14,lineHeight:17,weight:400,color:P.colors.legacy.textSecondary})``;var ft=({activeAccounts:e})=>{let{t:o}=v(),{selectedAccounts:t,selectAccount:r,deselectAccount:c,pushSubStep:d}=k(),C=(0,E.useMemo)(()=>Object.values(t).filter(n=>!!n).length===0,[t]),S=(0,E.useCallback)(()=>{d(E.default.createElement(Te,{preventBack:!0}))},[d]);return E.default.createElement(M,null,E.default.createElement("div",{style:{marginBottom:15}},E.default.createElement("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:30}},E.default.createElement(j,{weight:500,size:30,lineHeight:34,maxWidth:"320px"},o("connectHardwareSelectAccounts")),E.default.createElement(_t,{wordBreak:"break-word",size:18,lineHeight:22,color:P.colors.legacy.textSecondary},o("connectHardwareChooseAccountsToConnect"))),E.default.createElement("div",{style:{maxHeight:420,overflowY:"scroll"}},e.map(({accounts:f,discoveryIdentifier:n,accountIndex:y})=>{let _=!!t[n];return E.default.createElement(mt,{key:n,accountType:"ledger",accounts:f,accountIndex:y,checked:_,onPress:()=>{_?c(n):r(n)}})}))),E.default.createElement(L,{onClick:S,theme:"primary",disabled:C},o("commandContinue")))},_t=s(j)`
  margin-top: 15px;
`;var gt=()=>{let{t:e}=v(),{discoveredAccounts:o,activeAccountsFound:t,setSelectedAccounts:r,pushSubStep:c}=k(),d=(0,I.useMemo)(()=>{let f;if(t){let n=o.filter(y=>y.status==="undiscovered"||y.isSelectedByDefault);f=e(n.length===1?"connectHardwareFoundAccountsWithActivitySingular":"connectHardwareFoundAccountsWithActivity",{numOfAccounts:n.length})}else f=e("connectHardwareFoundSomeAccounts");return f},[t,e,o]),C=(0,I.useCallback)(()=>{c(I.default.createElement(ft,{activeAccounts:o}))},[c,o]),S=(0,I.useCallback)(()=>{c(I.default.createElement(Te,{preventBack:!0}))},[c]);return(0,I.useEffect)(()=>{let f=o.reduce((n,y,_)=>((y.status==="discovered"&&y.isSelectedByDefault||_===0)&&(n[y.discoveryIdentifier]=!0),n),{});r(f)},[o,r,t,e]),I.default.createElement(M,null,I.default.createElement(Gt,null,I.default.createElement(Y,{icon:I.default.createElement(B,{type:"success"}),primaryText:e("connectHardwareConnectAccounts"),headerStyle:"large",secondaryText:d})),I.default.createElement(jt,{onClick:C,theme:"default"},e("connectHardwareSelectAccounts")),I.default.createElement(L,{onClick:S,theme:"primary"},e("commandContinue")))},Gt=s(X)`
  margin-bottom: 35px;
`,jt=s(L)`
  margin-bottom: 10px;
`;var $t=19,zt=e=>{let o=new Set;for(let t of e)for(let{address:r}of t.addresses)o.add(r);return o},fe=()=>{let{chainImportStep:e,setIncrementChainImportStep:o,selectedChains:t,selectedChainsMap:r,pushStep:c,pushSubStep:d,setDiscoveredAccounts:C,setDerivedAccountGroups:S}=k(),f=(0,a.useRef)(k.getState().derivedAccountGroups),{t:n,i18n:y}=v(),_=e-1,p=t[_],{data:w=[],isFetched:T,isError:x}=k(u=>u.existingAccounts),[N,D]=(0,a.useState)(!1),l=(0,a.useMemo)(()=>{let u=[],m=r.get(p)||{};for(let[G,J]of Object.entries(m))J&&u.push(G);return[u[0]]},[p,r]),{chainNameTextOr:$,chainNameTextAnd:Z}=(0,a.useMemo)(()=>{let u=l.map(J=>F.getChainName(ae.get(J).ledgerAppOverride??J)),m=new Intl.ListFormat(y.resolvedLanguage,{style:"long",type:"disjunction"}),G=new Intl.ListFormat(y.resolvedLanguage,{style:"long",type:"conjunction"});return{chainNameTextOr:m.format(u),chainNameTextAnd:G.format(u)}},[l,y]),oe=(0,a.useMemo)(()=>l.map(u=>{let m=ae.get(u).ledgerAppOverride??u;return a.default.createElement(se,{key:F.getMainnetNetworkID(ae.get(m).ledgerAppOverride??m),networkID:m,size:72,borderColor:"bgWallet"})}),[l]);(0,a.useEffect)(()=>{let u=k.subscribe(m=>f.current=m.derivedAccountGroups);return()=>u()},[]);let K=(0,a.useMemo)(()=>{let u=[];switch(p){case"solana":{u.push({pathType:"bip44Root"});break}case"eip155":{u.push({pathType:"bip44RootEthereum"});break}case"bip122_p2tr":case"bip122_p2wpkh":case"bip122_p2sh":case"bip122_p2pkh":case"sui":break}for(let m=0;m<$t;++m)switch(p){case"solana":{u.push({index:m,pathType:"bip44Change"}),u.push({index:m,pathType:"bip44"});break}case"eip155":{u.push({index:m,pathType:"bip44Ethereum"}),u.push({index:m,pathType:"bip44EthereumSecondary"});break}case"bip122_p2tr":case"bip122_p2wpkh":case"bip122_p2sh":case"bip122_p2pkh":{u.push({index:m,pathType:"bitcoinTaproot"},{index:m,pathType:"bitcoinNativeSegwit"});break}case"sui":throw new Ke("connect hardware")}return u},[p]),[de,pe]=(0,a.useState)(!0),{data:ne=tt}=pt(de,!0),{data:[ke]}=Ye(["kill-ledger-xpub-derivation"]),{data:Q,error:Ne,fetchStatus:St,refetch:Le}=dt(ne,K,!0,!ke),Ct=St==="fetching",Ie=!ne.isConnected&&ne.status!=="reconnecting",[yt,wt]=(0,a.useState)(!1),{data:ge,refetch:Ee}=xe(yt,!0);(0,a.useEffect)(()=>{Ie&&pe(!1)},[Ie]),(0,a.useEffect)(()=>{ge?.type==="granted"&&(pe(!0),wt(!1))},[ge]);let Me=Re(),Fe=(0,a.useCallback)(async()=>{if(Q&&Object.keys(Q).length){let u=[...f.current],m=0;for(let G of Object.values(Q)){let ue={accounts:{...(u[m]??{accounts:{}}).accounts},derivationIndex:K[m].index},Ae=F.getChainIDs(G.addressType).filter(Se=>Me.includes(Se));for(let Se of Ae){let le=F.getNetworkIDs(Se);for(let ce of le)l.includes(ce)&&(ue.accounts[`${ce}-${G.address}`]={chainType:G.addressType,chainId:ce,address:G.address,publicKey:G.publicKey,pathParams:K[m]})}u[m]=ue,m++}if(S(u),T&&t.length===e){D(!0);let G=zt(w),J=u.reduce((i,O)=>{let me=!1;for(let{address:_e}of Object.values(O.accounts))me=me||G.has(_e);return me||i.push(O),i},[]),ue=[],Ae=[];for(let i=0;i<J.length;i+=Oe.extension){let O=J.slice(i,i+Oe.extension).map(me=>Object.entries(me.accounts).reduce((Ge,[vt,Ht])=>(Ge[vt]={account:Ht},Ge),{}));Ae.push(O)}for(let i of Ae)ue.push(Je(i));let le=(await Promise.all(ue)).flat().map(i=>{switch(i.status){case"discovered":return{...i,accounts:i.accounts.filter(O=>O.hasAccountActivity||Ce(O.derivationPathType))};case"undiscovered":return{...i,accounts:i.accounts.filter(O=>Ce(O.derivationPathType))}}}).filter(i=>i.accounts.length>0).map(i=>{let O=nt();return{...i,discoveryIdentifier:O}}),ce=le.filter(i=>i.status==="undiscovered"||i.isSelectedByDefault),bt=le.filter(i=>!(i.status==="undiscovered"||i.isSelectedByDefault)).slice(0,2),We=ce.length>0,xt=w.filter(i=>i.type==="ledger").length,Tt=(We?[...ce,...bt]:le.filter(i=>!i.accounts.some(O=>!Ce(O.derivationPathType))).slice(0,3)).map((i,O)=>({...i,accountIndex:xt+O}));C(Tt,We),c(a.default.createElement(gt,{preventBack:!0}))}}},[Q,S,T,t.length,e,K,Me,l,w,C,c]);(0,a.useEffect)(()=>{Q&&Object.keys(Q).length===K.length&&(Fe(),t.length!==e&&(o(),d(a.default.createElement(fe,{preventBack:!0}))))},[Q,K,c,d,e,t,Fe,o]);let z,U,V,R,re=()=>{};return x?(z=a.default.createElement(B,{type:"failure"}),U=n("connectHardwareErrorLedgerGeneric"),V=n("connectHardwareErrorLedgerPhantomLocked"),re=async()=>{let u=await rt();u.id!==void 0&&ct(u.id)},R=n("commandClose")):ge&&ge.type!=="granted"?(z=a.default.createElement(B,{type:"warning"}),U=n("connectHardwarePermissionDeniedPrimary"),V=n("connectHardwarePermissionDeniedSecondary"),R=n("homeErrorButtonText"),re=Ee):Ie?(z=a.default.createElement(B,{type:"warning"}),U=n("connectHardwarePermissionUnableToConnect"),V=n("connectHardwarePermissionUnableToConnectDescription"),R=n("commandConnect"),re=Ee):Ne instanceof ot?(z=a.default.createElement(B,{type:"failure"}),U=n("connectHardwareErrorLedgerLocked"),V=n("connectHardwareErrorLedgerLockedDescription"),R=n("homeErrorButtonText"),re=Le):Ne?(z=a.default.createElement(B,{type:"failure"}),U=n("connectHardwareErrorLedgerGeneric"),V=n("connectHardwareErrorLedgerGenericDescription"),R=n("homeErrorButtonText"),re=Le):ne.status=="reconnecting"?(z=a.default.createElement(B,{defaultIcon:a.default.createElement(ie,null),type:"default"}),U=n("connectHardwareConnecting"),V=n("connectHardwareConnectingDescription")):N?(z=a.default.createElement(B,{defaultIcon:a.default.createElement(ie,null),type:"default"}),U=n("connectHardwareDiscoveringAccounts"),V=n("connectHardwareDiscoveringAccountsDescription")):Ct?(z=a.default.createElement(B,{defaultIcon:a.default.createElement(ie,null),type:"default"}),U=n("connectHardwareConnectingAccounts"),V=n("connectHardwareFindingAccountsWithActivity",{chainName:Z})):(z=a.default.createElement(Vt,null,oe),U=n("connectHardwareMobileOpenAppSingleChain",{chainName:$}),V=n("connectHardwareOpenAppDescription")),a.default.createElement(M,null,a.default.createElement(X,null,a.default.createElement(Y,{icon:z,primaryText:U,headerStyle:"large",secondaryText:V})),R?a.default.createElement(L,{onClick:re,theme:"primary"},R):a.default.createElement(Ut,null,a.default.createElement(j,{color:P.colors.legacy.textSecondary,size:14},n("connectHardwareAccountsStepOfSteps",{stepNum:e,totalSteps:t.length}))))},Ut=s.div`
  align-self: center;
  background-color: ${P.colors.legacy.borderSecondary};
  border-radius: 80px;
  padding: 8px 16px;
  max-width: 150px;
`,Vt=s.div`
  display: flex;
  align-items: center;

  & > *:not(:last-child) {
    margin-right: -12.5px;
  }
`;g();A();var b=ee(te());var At=()=>{let{t:e}=v(),{pushSubStep:o,selectedChains:t,setSelectedChains:r,selectedChainsMap:c}=k(),d=be(),C=(0,b.useMemo)(()=>d.filter(p=>ae.get(p).isLedgerEnabled),[d]),S=we(),f=(0,b.useCallback)(p=>{let w=new Map(c),T=F.getAddressTypes(p);for(let N of T){let D=c.get(N),l=D?.[p];w.set(N,{...D,[p]:!l})}let x=S.filter(N=>{let D=w.get(N)||{};return Object.values(D).reduce(($,Z)=>Z?++$:$,0)>0});r(x,w)},[S,r,c]),n=()=>{o(b.default.createElement(fe,{preventBack:!0}))};st(()=>{let p=new Map;for(let w of S)p.set(w,{});for(let w of C){let T=F.getAddressTypes(w);for(let x of T){let N=p.get(x);p.set(x,{...N,[w]:!1})}}r(t,p)},S.length>0&&C.length>0);let y=(0,b.useMemo)(()=>C.map(p=>{let w=F.getAddressTypes(p),T=!1;for(let x of w)T=c.get(x)?.[p]||T;return b.default.createElement(qt,{key:p,icon:b.default.createElement(se,{networkID:p,size:40}),networkID:p,onPressChain:f,isChecked:T})}),[C,c,f]),_=(0,b.useMemo)(()=>{let p=0;for(let w of c.values())p+=Object.values(w).reduce((T,x)=>x?++T:T,0);return p===0},[c]);return b.default.createElement(M,null,b.default.createElement(j,{weight:500,size:28,lineHeight:34},e("connectHardwareSelectChains")),b.default.createElement(Xt,null,y),b.default.createElement(L,{onClick:n,theme:"primary",disabled:_},e("commandContinue")))},qt=({networkID:e,icon:o,onPressChain:t,isChecked:r})=>b.default.createElement(Kt,{onClick:()=>{t(e)}},b.default.createElement(Zt,null,b.default.createElement(Yt,null,o),b.default.createElement(j,{size:16,weight:600},F.getNetworkName(e))),b.default.createElement(he,{checked:r})),Kt=s.div`
  align-items: center;
  background-color: ${P.colors.legacy.bgRow};
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 16px 24px 16px 12px;

  :last-child {
    margin-bottom: 28px;
  }

  > span {
    margin-right: 0px;
  }
`,Yt=s.div`
  margin-right: 12px;
`,Xt=s.div`
  margin-top: 20px;
`,Zt=s.div`
  display: flex;
  align-items: center;
`;var Jt=()=>{Xe();let{t:e}=v(),{pushStep:o,setSelectedChains:t}=k(),r=be(),c=we(),{data:d,isFetching:C,refetch:S}=xe(!0,!0),{buttonDisabled:f,defaultIcon:n,primaryText:y,secondaryText:_,buttonText:p,iconType:w,onClick:T}=(0,H.useMemo)(()=>{let x=!1,N=H.default.createElement(ie,null),D,l,$,Z="default",oe=ze;if(C)D=e("connectHardwareSearching"),l=e("connectHardwareMakeSureConnected"),$=e("commandContinue"),x=!0;else if(d?.type==="granted"){let K=d.transport.deviceModel?.productName??"Ledger";Z="success",D=e("connectHardwarePairSuccessPrimary",{productName:K}),l=e("connectHardwarePairSuccessSecondary",{productName:K}),$=e("commandContinue"),x=!1,oe=()=>{if(c.length===1){let de=new Map;de.set(c[0],{});for(let pe of r){let ne=F.getAddressTypes(pe);for(let ke of ne)de.set(ke,{[pe]:!0})}t(c,de),o(H.default.createElement(fe,{preventBack:!0}))}else o(H.default.createElement(At,{onBackCallback:()=>{t([],new Map)}}))}}else d?.type==="denied"?(Z="failure",D=e("connectHardwarePermissionDeniedPrimary"),l=e("connectHardwarePermissionDeniedSecondary"),$=e("commandTryAgain"),x=!1,oe=S):(!d||d.type==="unable-to-connect")&&(Z="failure",D=e("connectHardwarePermissionUnableToConnect"),l=e("connectHardwareWaitingForApplicationSecondaryText"),$=e("commandTryAgain"),x=!1,oe=S);return{buttonDisabled:x,defaultIcon:N,primaryText:D,secondaryText:l,buttonText:$,iconType:Z,onClick:oe}},[r,c,d,o,S,C,t,e]);return H.default.createElement(M,null,H.default.createElement(X,null,H.default.createElement(Y,{icon:H.default.createElement(B,{defaultIcon:n,type:w}),primaryText:y,headerStyle:"large",secondaryText:_})),H.default.createElement(L,{onClick:T,theme:"primary",disabled:f},p))},xr=()=>{let{t:e}=v(),{pushSubStep:o}=k(),t=()=>o(H.default.createElement(Jt,null));return H.default.createElement(M,null,H.default.createElement(X,null,H.default.createElement(Y,{icon:H.default.createElement(at,null),primaryText:e("connectHardwareLedger"),headerStyle:"large",secondaryText:e("connectHardwareStartConnection"),animateText:!0})),H.default.createElement(L,{onClick:t,theme:"primary"},e("commandConnect")))};export{k as a,ut as b,go as c,Ao as d,mt as e,jo as f,xr as g};
//# sourceMappingURL=chunk-IJ6NZS5G.js.map
