import{Da as v,j as T}from"./chunk-EHJD6RHG.js";import"./chunk-UTDDCYTF.js";import"./chunk-MDZMKEZM.js";import"./chunk-KDEX35NE.js";import"./chunk-B4FJ72TG.js";import"./chunk-SA7BN6AR.js";import"./chunk-RTRPEFQC.js";import"./chunk-W5ZYYKQQ.js";import"./chunk-Q5KEEIPM.js";import"./chunk-SDRLROBZ.js";import"./chunk-EN6VQUOM.js";import"./chunk-EBURP5TU.js";import"./chunk-4KGATTWQ.js";import"./chunk-742BQ7F7.js";import"./chunk-ALLDIDKQ.js";import"./chunk-WPRAFVC6.js";import"./chunk-F3S5JWY2.js";import"./chunk-GO7HYR6O.js";import"./chunk-NIYDCB62.js";import"./chunk-U3MJCGUQ.js";import{a as A}from"./chunk-3J6D343S.js";import{a as B}from"./chunk-NUARI7SW.js";import"./chunk-Z3CCH6BX.js";import"./chunk-ZJ33SLYK.js";import"./chunk-GASB3NXO.js";import"./chunk-RP4HT6XN.js";import"./chunk-TKTYENT7.js";import"./chunk-FHFAALJ2.js";import"./chunk-5OZAXCD4.js";import"./chunk-IIOQMXXT.js";import"./chunk-4Z7SMQUN.js";import"./chunk-UQG7JMAN.js";import{c as U}from"./chunk-QNVVE6V5.js";import{ib as F,l as E,na as V,p as u}from"./chunk-MUQF2AZ6.js";import{Tb as W,hb as C,ib as H,jb as L}from"./chunk-M4A3OS5Y.js";import"./chunk-UCBZOSRF.js";import"./chunk-CO4KYCC7.js";import"./chunk-S2IPDOR6.js";import"./chunk-HPL6A5BE.js";import"./chunk-WWBVHQYQ.js";import"./chunk-UT4QDC7N.js";import"./chunk-2NFFZKWZ.js";import"./chunk-WITM4KDS.js";import"./chunk-M5NOGDCG.js";import"./chunk-XGAZBAFU.js";import"./chunk-F7PG7UT7.js";import"./chunk-HYOCMEEG.js";import"./chunk-SLYIHOOX.js";import"./chunk-6JDSADCT.js";import"./chunk-5JP6BIAB.js";import"./chunk-HHUNORJ5.js";import"./chunk-BIXLYDGB.js";import{H as r,L as a,M as s,O as b,Ta as w,ba as O,qa as $,x as P}from"./chunk-NVJ3LP7I.js";import"./chunk-7MK34BUQ.js";import"./chunk-7KFKYD5L.js";import"./chunk-KZCIEVG2.js";import"./chunk-RFTHTXRF.js";import"./chunk-X3THIE5D.js";import{a as I}from"./chunk-7GE6SGSX.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-O2N6PUOM.js";import"./chunk-UNDMYLJW.js";import{f as k,h,n as S}from"./chunk-3KENBVE7.js";h();S();var D=k(I());h();S();var p=k(I());var G=u.div`
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
`,J=u.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  margin: 20px 0 16px;
  width: 100%;
`,K=u(F).attrs({size:28,lineHeight:32,weight:600,color:r.colors.legacy.textPrimary})`
  margin: 20px 0 12px;
`,N=u(F).attrs({size:16,lineHeight:18,weight:400,color:r.colors.legacy.textSecondary})`
  margin-bottom: 32px;
`,Q=u.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 2px;
  width: 100%;
  background-color: ${t=>t.theme.backgroundDark};
`,Z=u.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  padding: 10px 8px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: ${t=>t.selected?r.colors.legacy.accentPrimary:"transparent"};
  cursor: pointer;
`,j=u(F).attrs(t=>({size:14,lineHeight:18,weight:t.selected?600:500,color:t.selected?r.colors.legacy.bgWallet:r.colors.legacy.textPrimary}))`
  text-align: center;
`,R=u(F).attrs(t=>({size:14,lineHeight:18,weight:500,color:t.severity==="critical"?r.colors.legacy.accentAlert:r.colors.legacy.accentWarning}))`
  align-self: stretch;
  margin-top: 8px;
  text-align: left;
`,tt=u.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`,et=u.input`
  background: transparent;
  color: ${r.colors.legacy.bgWallet};
  ::placeholder {
    color: ${r.colors.legacy.textTertiary};
  }
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 18px;
  text-align: right;
  border: none;
  padding: 0;
`,ot=()=>{let{handleHideModalVisibility:t}=v(),n=(0,p.useCallback)(()=>{t("swapSettings")},[t]);return C({onDismiss:n})},nt=({options:t,selectedIndex:n,customSlippageValue:o,i18nStrings:i,error:d,submitDisabled:f,onConfirm:m,onSelectOption:c,onChangeCustomSlippage:g,onDismiss:y})=>p.default.createElement(G,null,p.default.createElement(T,{leftButton:{type:"close",onClick:y},titleSize:"small"},i.title),p.default.createElement(J,null,p.default.createElement(A,{diameter:96,color:r.colors.legacy.bgArea},p.default.createElement(V,{width:38,fill:r.colors.legacy.bgArea})),p.default.createElement(K,null,i.title),p.default.createElement(N,null,i.subtitle),p.default.createElement(lt,{options:t,selectedIndex:n,customOptionLabel:i.custom,customOptionValue:o,onSelectOption:c,onCustomOptionChange:g}),d?p.default.createElement(R,{severity:d.severity},d.message):null),p.default.createElement(U,{disabled:f,theme:"primary",onClick:m},i.button)),it=()=>{let t=ot();return p.default.createElement(nt,{...t})},z=it,rt=({value:t,onChangeText:n})=>{let o=i=>{i.target.validity.valid?n(i.target.value):i.preventDefault()};return p.default.createElement(tt,null,p.default.createElement(et,{autoFocus:!t,placeholder:"0.00%",value:t??"",style:t?{width:`${t.length*10}px`,textAlign:"right"}:{width:"100%",textAlign:"center"},onChange:o}),p.default.createElement(j,{selected:!0},t?"%":""))},lt=({options:t,selectedIndex:n,customOptionLabel:o,customOptionValue:i,onSelectOption:d,onCustomOptionChange:f})=>p.default.createElement(Q,null,t.map((m,c)=>{let g=c===n,y=c===t.length-1&&g,x=()=>d(c);return p.default.createElement(Z,{key:`segment-control-option-${c}`,selected:g,onClick:x},y?p.default.createElement(rt,{value:i,onChangeText:f}):p.default.createElement(j,{selected:g},m==="custom"?o:m))}));h();S();var l=k(I());var st=u.input`
  background: transparent;
  text-align: center;
  border: none;
  padding: 0;
  font-style: ${r.typography.font.bodySemibold.letterSpacing};
  font-size: ${r.typography.font.bodySemibold.fontSize};
  font-weight: ${r.typography.font.bodySemibold.fontWeight};
  line-height: ${r.typography.font.bodySemibold.lineHeight};
  color: ${r.colors.legacy.textPrimary};
  ::placeholder {
    color: ${r.colors.legacy.textTertiary};
  }
`,at=({value:t,onChangeText:n})=>{let o=i=>{i.target.validity.valid?n(i.target.value):i.preventDefault()};return l.default.createElement(a,{display:"flex",direction:"row",alignItems:"center",justifyContent:"center",width:"100%"},l.default.createElement(st,{autoFocus:!t,placeholder:"0.00%",value:t??"",style:t?{width:`${t.length*10}px`,textAlign:"right"}:{width:"100%",textAlign:"center",minWidth:r.space.positive[48]},onChange:o}),t&&l.default.createElement(s,{font:"bodySemibold",color:"textPrimary"},"%"))},ct=({options:t,selectedIndex:n,customOptionLabel:o,customOptionValue:i,onSelectOption:d,onCustomOptionChange:f})=>l.default.createElement(a,{display:"flex",direction:"row",alignItems:"center",justifyContent:"center",borderRadius:"row",width:"100%"},t.map((m,c)=>{let g=c===n,y=c===t.length-1&&g,x=()=>d(c);return l.default.createElement(a,{key:`segment-control-option-${c}`,display:"flex",flex:1,direction:"row",paddingX:20,paddingY:14,alignItems:"center",justifyContent:"center",borderRadius:"row",backgroundColor:g?"bgRow":void 0,onPress:x,minWidth:24},y?l.default.createElement(at,{value:i,onChangeText:f}):l.default.createElement(s,{font:"bodySemibold",color:g?"textPrimary":"textSecondary",align:"center"},m==="custom"?o:m))})),dt=({customSlippageValue:t,error:n,i18nStrings:o,options:i,selectedIndex:d,submitDisabled:f,isAutoEnabled:m,autoLearnMoreUrl:c,onSelectOption:g,onChangeCustomSlippage:y,onConfirm:x,onToggleAutoSlippage:_,onDismiss:q})=>l.default.createElement(a,{height:"100%",overflowY:"auto",display:"flex",direction:"column",justifyContent:"space-between",padding:"screen"},l.default.createElement("div",null,l.default.createElement(T,{leftButton:{type:"close",onClick:q},titleSize:"small"},o.title),l.default.createElement(a,{display:"flex",gap:24,direction:"column",alignItems:"center",width:"100%"},l.default.createElement(a,{display:"flex",direction:"column",alignItems:"center"},l.default.createElement(A,{diameter:96,color:r.colors.legacy.bgArea},l.default.createElement(V,{width:38,fill:r.colors.legacy.bgArea})),l.default.createElement(s,{font:"heading2Semibold",color:"textPrimary",marginTop:20},o.title)),l.default.createElement(a,{width:"100%"},l.default.createElement(b,{rounded:!0,topLeft:o.auto,end:l.default.createElement(w,{id:"auto-slippage-switch",checked:m,onChange:_})}),l.default.createElement(s,{marginTop:8,font:"caption",color:"textSecondary"},o.autoSubtitle," ",l.default.createElement(s,{font:"caption",color:"accentPrimary",onPress:()=>self.open(c,"_blank")},o.learnMore))),!m&&l.default.createElement(a,{gap:8,display:"flex",direction:"column",alignItems:"center"},l.default.createElement(ct,{options:i,selectedIndex:d,customOptionLabel:o.custom,customOptionValue:t,onSelectOption:g,onCustomOptionChange:y}),l.default.createElement(s,{font:"caption",color:"textSecondary"},o.subtitle),n&&l.default.createElement(s,{font:"caption",color:n.severity==="critical"?"accentAlert":"accentWarning",alignSelf:"stretch"},n.message)))),l.default.createElement(O,{disabled:f,theme:"primary",onClick:x},o.button)),pt=()=>{let{handleHideModalVisibility:t}=v(),n=(0,l.useCallback)(()=>{t("swapSettings")},[t]);return C({onDismiss:n})},Y=()=>{let t=pt();return l.default.createElement(dt,{...t})};h();S();var e=k(I());var mt=u.input`
  background: transparent;
  text-align: center;
  border: none;
  padding: 0;
  font-style: ${r.typography.font.bodySemibold.letterSpacing};
  font-size: ${r.typography.font.bodySemibold.fontSize};
  font-weight: ${r.typography.font.bodySemibold.fontWeight};
  line-height: ${r.typography.font.bodySemibold.lineHeight};
  color: ${r.colors.legacy.textPrimary};
  ::placeholder {
    color: ${r.colors.legacy.textTertiary};
  }
`,gt=({value:t,onChangeText:n})=>{let o=i=>{i.target.validity.valid?n(i.target.value):i.preventDefault()};return e.default.createElement(a,{display:"flex",direction:"row",alignItems:"center",justifyContent:"center",width:"100%"},e.default.createElement(mt,{autoFocus:!t,placeholder:"0.00%",value:t??"",style:t?{width:`${t.length*10}px`,textAlign:"right"}:{width:"100%",textAlign:"center",minWidth:r.space.positive[48]},onChange:o}),t&&e.default.createElement(s,{font:"bodySemibold",color:"textPrimary"},"%"))},ut=({options:t,selectedIndex:n,customOptionLabel:o,customOptionValue:i,onSelectOption:d,onCustomOptionChange:f})=>e.default.createElement(a,{display:"flex",direction:"row",alignItems:"center",justifyContent:"center",borderRadius:"row",width:"100%"},t.map((m,c)=>{let g=c===n,y=c===t.length-1&&g,x=()=>d(c);return e.default.createElement(a,{key:`segment-control-option-${c}`,display:"flex",flex:1,direction:"row",paddingX:20,paddingY:14,alignItems:"center",justifyContent:"center",borderRadius:"row",backgroundColor:g?"bgRow":void 0,onPress:x,minWidth:24},y?e.default.createElement(gt,{value:i,onChangeText:f}):e.default.createElement(s,{font:"body",color:g?"textPrimary":"textSecondary",align:"center"},m==="custom"?o:m))})),ft=({slippageSettingsProps:t,priorityFeeSettingsProps:n,tipSettingsProps:o,onConfirm:i,onDismiss:d,submitDisabled:f,swapSettingsMode:m})=>{let{t:c}=P();return e.default.createElement(a,{height:"100%",display:"flex",direction:"column",justifyContent:"space-between"},e.default.createElement(a,{flex:1,overflowY:"auto",padding:"screen"},e.default.createElement("div",null,e.default.createElement(T,{leftButton:{type:"close",onClick:d},titleSize:"small"},c("swapSettingsTitle")),e.default.createElement(a,{display:"flex",gap:24,direction:"column",width:"100%"},e.default.createElement(a,{width:"100%"},e.default.createElement(s,{font:"title3",align:"left",color:"textSecondary",marginBottom:12},t.i18nStrings.title),e.default.createElement(b,{rounded:!0,topLeft:t.i18nStrings.auto,end:e.default.createElement(w,{id:"auto-slippage-switch",checked:t.isAutoEnabled,onChange:t.onToggleAutoSlippage})}),e.default.createElement(s,{marginTop:8,font:"caption",color:"textSecondary"},t.i18nStrings.autoSubtitle," ",e.default.createElement(s,{font:"caption",color:"accentPrimary",onPress:()=>self.open(t.autoLearnMoreUrl,"_blank")},t.i18nStrings.learnMore))),!t.isAutoEnabled&&e.default.createElement(a,{gap:8,display:"flex",direction:"column",alignItems:"center"},e.default.createElement(ut,{options:t.options,selectedIndex:t.selectedIndex,customOptionLabel:t.i18nStrings.custom,customOptionValue:t.customSlippageValue,onSelectOption:t.onSelectOption,onCustomOptionChange:t.onChangeCustomSlippage}),e.default.createElement(s,{font:"caption",color:"textSecondary"},t.i18nStrings.subtitle),t.error&&e.default.createElement(s,{font:"caption",color:t.error.severity==="critical"?"accentAlert":"accentWarning",alignSelf:"stretch"},t.error.message)),e.default.createElement(a,{width:"100%"},e.default.createElement(s,{font:"title3",align:"left",color:"textSecondary",marginBottom:12},n.i18nStrings.title),e.default.createElement(b,{rounded:!0,topLeft:n.i18nStrings.auto,end:e.default.createElement(w,{id:"auto-priority-fee-switch",checked:n.isAutoEnabled,onChange:n.onToggleAutoPriorityFee})}),e.default.createElement(s,{marginTop:8,font:"caption",color:"textSecondary"},n.i18nStrings.autoSubtitle)),!n.isAutoEnabled&&e.default.createElement(a,{gap:8,display:"flex",direction:"column"},e.default.createElement($,{id:"priority-fee-input",label:"priority-fee-input","data-testid":"priority-fee-input",showLabel:!1,placeholder:"0.00",selectOnFocus:!0,value:n.customPriorityFeeValue??"",setValue:n.onChangeCustomPriorityFee,end:"SOL"}),e.default.createElement(s,{font:"caption",color:"textSecondary",align:"left",marginTop:8},n.customPriorityFeeValueInDollars),n.i18nStrings.subtitle&&e.default.createElement(s,{font:"caption",color:"textSecondary",align:"left",marginTop:8},n.i18nStrings.subtitle),e.default.createElement(a,{minHeight:32},n.error&&e.default.createElement(s,{font:"caption",color:n.error.severity==="critical"?"accentAlert":"accentWarning",alignSelf:"stretch"},n.error.message))),m==="autoWithPriorityFeesAndTips"&&e.default.createElement(e.default.Fragment,null,e.default.createElement(a,{width:"100%"},e.default.createElement(s,{font:"title3",align:"left",color:"textSecondary",marginBottom:12},o.i18nStrings.title),e.default.createElement(b,{rounded:!0,topLeft:o.i18nStrings.auto,end:e.default.createElement(w,{id:"auto-tip-switch",checked:o.isAutoEnabled,onChange:o.onToggleAutoTip})}),e.default.createElement(s,{marginTop:8,font:"caption",color:"textSecondary"},o.i18nStrings.autoSubtitle)),!o.isAutoEnabled&&e.default.createElement(a,{gap:8,display:"flex",direction:"column"},e.default.createElement($,{id:"tip-input",label:"tip-input","data-testid":"tip-input",showLabel:!1,placeholder:"0.00",selectOnFocus:!0,value:o.customTipValue??"",setValue:o.onChangeCustomTip,end:"SOL"}),e.default.createElement(s,{font:"caption",color:"textSecondary",align:"left",marginTop:8},o.customTipValueInDollars),o.i18nStrings.subtitle&&e.default.createElement(s,{font:"caption",color:"textSecondary",align:"left",marginTop:8},o.i18nStrings.subtitle),e.default.createElement(a,{minHeight:32},o.error&&e.default.createElement(s,{font:"caption",color:o.error.severity==="critical"?"accentAlert":"accentWarning",alignSelf:"stretch"},o.error.message))))))),e.default.createElement(B,{removeFooterExpansion:!1,cssOverride:E`
          background: ${r.colors.legacy.bgRow};
          display: flex;
          justify-content: center;
        `},e.default.createElement(a,{paddingX:16,paddingBottom:12,width:"100%"},e.default.createElement(O,{disabled:f,theme:"primary",onClick:i},t.i18nStrings.button))))},yt=()=>{let{handleHideModalVisibility:t}=v(),n=(0,e.useCallback)(()=>{t("swapSettings")},[t]),o=C({onDismiss:n}),i=H({onDismiss:n}),d=L({onDismiss:n}),f=(0,e.useCallback)(()=>{o.onConfirm(),i.onConfirm(),d.onConfirm()},[o,i,d]),m=(0,e.useCallback)(()=>{o.onDismiss(),i.onDismiss(),d.onDismiss()},[o,i,d]),c=(0,e.useMemo)(()=>o.submitDisabled||i.submitDisabled||d.submitDisabled,[o.submitDisabled,i.submitDisabled,d.submitDisabled]);return{slippageSettingsProps:o,priorityFeeSettingsProps:i,tipSettingsProps:d,onConfirm:f,onDismiss:m,submitDisabled:c}},X=({swapSettingsMode:t})=>{let n=yt();return e.default.createElement(ft,{...n,swapSettingsMode:t})};var ht=()=>{let t=W();switch(t){case"autoWithPriorityFees":case"autoWithPriorityFeesAndTips":return D.default.createElement(X,{swapSettingsMode:t});case"auto":return D.default.createElement(Y,null);default:return D.default.createElement(z,null)}},te=ht;export{ht as SwapSettings,te as default};
//# sourceMappingURL=SwapSettings-HL7LU4EP.js.map
