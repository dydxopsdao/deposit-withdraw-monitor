import{p as r}from"./chunk-MUQF2AZ6.js";import{H as o,x as a}from"./chunk-NVJ3LP7I.js";import{a as w}from"./chunk-7GE6SGSX.js";import{f as y,h as l,n as g}from"./chunk-3KENBVE7.js";l();g();var t=y(w());var f=r.div`
  position: relative;
  width: ${e=>`${e.width}px`};
  height: ${e=>`${e.height}px`};
  opacity: ${e=>e.disabled?e.disabledToggleOpacity:1};

  input[type="checkbox"] {
    width: ${e=>`${e.width}px`};
    height: ${e=>`${e.height}px`};
    margin: 0;
    &:hover {
      cursor: pointer;
    }
  }

  label {
    width: ${e=>`${e.width}px`};
    height: ${e=>`${e.height}px`};
    background: ${e=>e.disabled?e.disabledBackgroundColor:e.inactiveBackgroundColor};
    border-radius: ${e=>`${(e.height||0)/2}px`};
    cursor: pointer;
    text-indent: -9999px;
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  label:after {
    content: "";
    position: absolute;
    top: ${e=>`${((e.height||0)-(e.toggleHeight||0))/2}px`};
    left: ${e=>`${((e.width||0)-(e.toggleWidth||0)*2)/2}px`};
    width: ${e=>`${e.toggleWidth}px`};
    height: ${e=>`${e.toggleHeight}px`};
    background: ${e=>e.inactiveToggleColor};
    border-radius: 100px;
    transition: 0.3s;
  }

  input:checked + label {
    background: ${e=>e.disabled?e.disabledBackgroundColor:e.activeBackgroundColor};
    &:after {
      background: ${e=>e.disabled?e.disabledToggleColor:e.activeToggleColor};
    }
  }

  input:checked + label:after {
    left: calc(100% - ${e=>`${((e.width||0)-(e.toggleWidth||0)*2)/2}px`});
    transform: translateX(-100%);
  }

  label:active:after {
    width: 14px;
    background: ${o.colors.legacy.textPrimary};
  }
`,B=t.default.memo(({id:e,width:d,height:c,toggleWidth:n,toggleHeight:h,activeBackgroundColor:s,activeToggleColor:b,inactiveBackgroundColor:u,inactiveToggleColor:p,disabledBackgroundColor:$,disabledToggleColor:C,disabledToggleOpacity:k,checked:T,disabled:i,onChange:m,label:x})=>{let{t:v}=a();return t.default.createElement(f,{width:d,height:c,toggleWidth:n,toggleHeight:h,activeBackgroundColor:s,inactiveBackgroundColor:u,disabledBackgroundColor:$,activeToggleColor:b,inactiveToggleColor:p,disabledToggleColor:C,disabledToggleOpacity:k,disabled:i},t.default.createElement("input",{type:"checkbox","aria-label":x??"checkbox",id:e,checked:i||T,onChange:m,disabled:i,"data-testid":e}),t.default.createElement("label",{htmlFor:e},v("switchToggle")))});B.defaultProps={width:34,height:20,toggleWidth:14,toggleHeight:14,activeBackgroundColor:o.colors.legacy.accentPrimary,inactiveBackgroundColor:o.colors.legacy.bgArea,disabledBackgroundColor:o.colors.legacy.accentPrimary,activeToggleColor:o.colors.legacy.textPrimary,inactiveToggleColor:o.colors.legacy.borderAccent,disabledToggleColor:o.colors.legacy.textPrimary,disabledToggleOpacity:.4,disabled:!1,checked:!1};export{B as a};
//# sourceMappingURL=chunk-ILYFVD5Z.js.map
