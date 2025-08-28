import{k as y}from"./chunk-U3MJCGUQ.js";import{c as x}from"./chunk-QNVVE6V5.js";import{ib as p,p as s}from"./chunk-MUQF2AZ6.js";import{Hc as f}from"./chunk-SLYIHOOX.js";import{H as n,x as S}from"./chunk-NVJ3LP7I.js";import{a as b}from"./chunk-7GE6SGSX.js";import{f as h,h as d,n as m}from"./chunk-3KENBVE7.js";d();m();var t=h(b());var k=s.div`
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: ${e=>e.settingsContainerHeight??"100%"};
`,w=s.div``,v=s.div`
  border-radius: 6px;
  overflow: hidden;
  padding-bottom: 32px;
`,H=s.div`
  display: flex;
  background-color: ${e=>e.selected?n.colors.legacy.accentPrimary:n.colors.legacy.bgRow};
  padding: 16px;
  align-items: center;
  cursor: pointer;

  & + & {
    border-top: 1px solid ${n.colors.legacy.bgWallet};
  }
`,A=s.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`,U=({selected:e,title:o,description:r,onClick:a})=>t.default.createElement(H,{onClick:a,selected:e},t.default.createElement(A,null,t.default.createElement(p,{margin:"0 0 7px",lineHeight:16,textAlign:"left",weight:500,size:16,color:e?n.colors.legacy.bgWallet:n.colors.legacy.textPrimary},o),t.default.createElement(p,{textAlign:"left",weight:500,size:12,lineHeight:12,color:e?n.colors.legacy.bgRow:n.colors.legacy.textSecondary},r||t.default.createElement("span",null,"\xA0")))),D=({onSelectTransactionSpeed:e,selectedTransactionSpeed:o,networkID:r,transactionUnitAmount:a,closeModal:c,settingsContainerHeight:i})=>{let{t:l}=S(),{presets:C,transactionSpeed:g}=f(r,o,a),u=(0,t.useCallback)(()=>{e(g),c()},[c,g,e]),P=l("settingsTransactions"),T=l("commandSave");return{headerText:P,primaryText:T,onPress:u,presetViewStates:C,settingsContainerHeight:i}},j=e=>{let o=D(e);return t.default.createElement(I,{...o})},I=t.default.memo(({headerText:e,primaryText:o,onPress:r,settingsContainerHeight:a,presetViewStates:c})=>t.default.createElement(t.default.Fragment,null,t.default.createElement(w,null,t.default.createElement(y,null,e)),t.default.createElement(k,{settingsContainerHeight:a},t.default.createElement(v,null,c.map((i,l)=>t.default.createElement(U,{key:l,onClick:i.onClick,title:i.title,description:i.description,selected:i.selected}))),t.default.createElement(x,{theme:"primary",onClick:r},o))));export{j as a};
//# sourceMappingURL=chunk-EZ3FREWK.js.map
