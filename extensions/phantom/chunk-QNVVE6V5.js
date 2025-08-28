import{c as k,l as d,p as c}from"./chunk-MUQF2AZ6.js";import{H as o,Q as b,S as B}from"./chunk-NVJ3LP7I.js";import{a as x}from"./chunk-7GE6SGSX.js";import{f,h as u,n as y}from"./chunk-3KENBVE7.js";u();y();var i=f(x());var v=({width:e,trackColor:a=o.colors.legacy.bgArea,spinnerColor:n=o.colors.legacy.accentPrimary})=>i.default.createElement("svg",{width:e,height:e,viewBox:"0 0 26 26"},i.default.createElement("g",null,i.default.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M13 23.413c5.751 0 10.413-4.662 10.413-10.413S18.751 2.587 13 2.587 2.587 7.249 2.587 13 7.249 23.413 13 23.413zm0 2.315c7.03 0 12.727-5.699 12.727-12.728S20.03.273 13 .273C5.97.273.273 5.97.273 13 .273 20.03 5.97 25.728 13 25.728z",fill:a})),i.default.createElement("g",null,i.default.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M16.382 24.125a1.157 1.157 0 01.623-1.513 10.412 10.412 0 005.607-13.617 1.157 1.157 0 112.136-.89 12.726 12.726 0 01-6.853 16.643 1.157 1.157 0 01-1.513-.623z",fill:n})));v.defaultProps={width:44};var L=c.div`
  position: ${e=>e.position};
  height: ${e=>e.diameter}px;
  width: ${e=>e.diameter}px;
  animation: rotate 0.5s linear infinite;
  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }
`,p=({diameter:e,color:a,trackColor:n,position:l})=>i.default.createElement(L,{diameter:e,position:l},i.default.createElement(v,{width:e,spinnerColor:a,trackColor:n}));p.defaultProps={diameter:44};var W=c.div`
  display: flex;
  align-items: center;
  justify-content: center;
`,G=()=>i.default.createElement(W,null,i.default.createElement(p,null));u();y();var r=f(x());var P=c.button`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: ${e=>e.paddingY}px 0px;
  width: ${e=>e.width};
  height: ${e=>e.height};
  border-radius: ${e=>e.borderRadius};
  font-size: ${e=>e.fontSize}px;
  font-weight: ${e=>e.fontWeight};
  line-height: ${e=>e.lineHeight}px;
  color: ${o.colors.legacy.textPrimary};
  pointer-events: auto;
  border: none;
  outline-color: transparent;
  outline-style: none;
  cursor: ${e=>e.disabled?"auto":"pointer"};
  &:disabled {
    opacity: 0.4;
  }
  ${e=>e.noWrap&&d`
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `}
  ${e=>e.theme==="primary"?d`
          background: ${o.colors.legacy.accentPrimary};
          color: ${o.colors.legacy.bgWallet};
          &:hover:enabled {
            background: ${o.colors.legacy.accentPrimaryLight};
          }
        `:e.theme==="warning"?d`
            background: ${o.colors.legacy.accentAlert};
            color: ${o.colors.legacy.bgWallet};
            &:hover:enabled {
              background: ${o.colors.legacy.accentAlert};
            }
          `:e.theme==="dark"?d`
              background: ${o.colors.legacy.bgArea};
            `:e.theme==="metamask"?d`
                /* metamask brand color */
                background: #f5841f;
                &:hover:enabled {
                  /* metamask brand color */
                  background: #d0701a;
                }
              `:e.theme==="link"?d`
                  background: transparent;
                  color: ${o.colors.legacy.accentPrimary};
                  justify-content: flex-start;
                  &:hover:enabled {
                    color: ${o.colors.legacy.accentPrimary};
                  }
                `:e.theme==="text"?d`
                    background: transparent;
                    padding-left: 4px;
                    padding-right: 4px;
                    justify-content: flex-start;
                    &:hover:enabled {
                      background: ${o.colors.legacy.gray};
                    }
                  `:d`
                    background: ${o.colors.legacy.bgButton};
                    &:hover:enabled {
                      background: ${o.colors.legacy.gray};
                    }
                  `}
`,m=({children:e,loading:a,to:n,onClick:l,...s})=>n?r.default.createElement(z,{loading:a,to:n,...s},e):r.default.createElement(P,{...s,onClick:l},a?r.default.createElement(p,{diameter:24,position:"absolute"}):e);var z=({children:e,loading:a,to:n,...l})=>{let s=k();if(!n)throw new Error("ButtonWithNavigation requires a 'to' prop");return r.default.createElement(P,{...l,onClick:()=>s(n)},a?r.default.createElement(p,{diameter:24,position:"absolute"}):e)};m.defaultProps={fontSize:16,fontWeight:600,lineHeight:19,paddingY:14,width:"100%",borderRadius:"16px",theme:"default",type:"button",noWrap:!0};var S=c.div`
  display: flex;
  flex-direction: ${e=>e.vertical?"column-reverse":"row"};
  width: 100%;
  gap: 10px;
`;var C={fontSize:14,lineHeight:17,paddingY:10},A=({className:e,primaryText:a,secondaryText:n,onPrimaryClicked:l,onPrimaryHover:s,onSecondaryClicked:t,primaryTheme:g,secondaryTheme:$,primaryDisabled:w,primaryLoading:N,secondaryDisabled:T,buttonPairStyle:D})=>{let h=D==="normal"?{}:C;return r.default.createElement(S,{className:e},r.default.createElement(m,{theme:$,onClick:t,disabled:T,...h,"data-testid":"secondary-button"},n),r.default.createElement(m,{type:"submit",theme:g,disabled:w,loading:N,onClick:l,onMouseEnter:s,...h,"data-testid":"primary-button"},a))};A.defaultProps={primaryTheme:"primary",secondaryTheme:"default",primaryDisabled:!1,buttonPairStyle:"normal"};var Q=({buttons:e,buttonStyle:a,className:n,vertical:l})=>{let s=a==="small"?C:{};return r.default.createElement(S,{className:n,vertical:l},r.default.createElement(b,null,e.map((t,g)=>typeof t.hideButton>"u"?r.default.createElement(m,{key:t.key??(typeof t.text=="string"&&t.text?t.text:g),type:t.type??"button",theme:t.theme,onClick:t.onClick,disabled:t.disabled,loading:t.loading,className:t.className,"data-testid":t.testID,...s},t.text):t.hideButton?null:r.default.createElement(B.div,{key:t.key??(typeof t.text=="string"&&t.text?t.text:g),initial:{opacity:0,scale:.8,width:0},exit:{opacity:0,width:0},animate:{height:"auto",opacity:1,scale:1,width:"100%"},transition:{ease:"easeInOut",duration:.3}},r.default.createElement(m,{type:t.type??"button",theme:t.theme,onClick:t.onClick,disabled:t.disabled,loading:t.loading,className:t.className,"data-testid":t.testID,...s},t.text)))))};export{p as a,G as b,m as c,A as d,Q as e};
//# sourceMappingURL=chunk-QNVVE6V5.js.map
