import{z as $}from"./chunk-ZJ33SLYK.js";import{c as U}from"./chunk-GASB3NXO.js";import{V as H,fa as W,ha as E,ib as R,p as x}from"./chunk-MUQF2AZ6.js";import{d as k}from"./chunk-M5NOGDCG.js";import{Jc as M,Ud as F}from"./chunk-5JP6BIAB.js";import{H as D,Na as le,Q as N,S as O}from"./chunk-NVJ3LP7I.js";import{e as I,la as w}from"./chunk-X3THIE5D.js";import{a as h}from"./chunk-7GE6SGSX.js";import{f as c,h as s,n as u}from"./chunk-3KENBVE7.js";s();u();var B=c(h());s();u();var z=c(h());function G(){var e=(0,z.useRef)(!0);return e.current?(e.current=!1,!0):e.current}var de=function(e,t){return e===t};function y(e,t){t===void 0&&(t=de);var o=(0,B.useRef)(),r=(0,B.useRef)(e),d=G();return!d&&!t(r.current,e)&&(o.current=r.current,r.current=e),o.current}s();u();s();u();var K=function(){};function j(e){for(var t=[],o=1;o<arguments.length;o++)t[o-1]=arguments[o];e&&e.addEventListener&&e.addEventListener.apply(e,t)}function q(e){for(var t=[],o=1;o<arguments.length;o++)t[o-1]=arguments[o];e&&e.removeEventListener&&e.removeEventListener.apply(e,t)}var V=typeof self<"u";s();u();var v=c(h());var pe=["mousedown","touchstart"],me=function(e,t,o){o===void 0&&(o=pe);var r=(0,v.useRef)(t);(0,v.useEffect)(function(){r.current=t},[t]),(0,v.useEffect)(function(){for(var d=function(a){var m=e.current;m&&!m.contains(a.target)&&r.current(a)},f=0,l=o;f<l.length;f++){var p=l[f];j(document,p,d)}return function(){for(var a=0,m=o;a<m.length;a++){var L=m[a];q(document,L,d)}}},[o,e])},ce=me;s();u();var C=c(h());var xe=V?C.useLayoutEffect:C.useEffect,J=xe;s();u();var b=c(h());function Q(e){var t=(0,b.useRef)();return(0,b.useEffect)(function(){t.current=e}),t.current}s();u();var S=c(h());var X={x:0,y:0,width:0,height:0,top:0,left:0,bottom:0,right:0};function ge(){var e=(0,S.useState)(null),t=e[0],o=e[1],r=(0,S.useState)(X),d=r[0],f=r[1],l=(0,S.useMemo)(function(){return new self.ResizeObserver(function(p){if(p[0]){var a=p[0].contentRect,m=a.x,L=a.y,ae=a.width,se=a.height,ue=a.top,ie=a.left,ne=a.bottom,fe=a.right;f({x:m,y:L,width:ae,height:se,top:ue,left:ie,bottom:ne,right:fe})}})},[]);return J(function(){if(t)return l.observe(t),function(){l.disconnect()}},[t]),[o,d]}var he=V&&typeof self.ResizeObserver<"u"?ge:function(){return[K,X]};s();u();var Z=c(le());var i=c(h());var Y=(0,i.createContext)({pushDetailViewCallback:()=>w,pushDetailView:w,popDetailView:w,resetDetailView:w,detailViewStackLength:0}),we=x(O.div)`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: ${e=>e.theme?.detailViewMaxHeight??"100%"};
  min-height: ${e=>e.theme?.detailViewMinHeight??"initial"};
`,ct=i.default.memo(({children:e,shouldResetOnAccountChange:t,shouldPushDetailView:o})=>{let{detailViewStack:r,setDetailViewStack:d,pushDetailView:f,...l}=Se(),{data:p}=F();return(0,i.useEffect)(()=>{t&&d([])},[p,d,t]),(0,i.useEffect)(()=>{o&&f(e)},[e,o,f]),i.default.createElement(Y.Provider,{value:{...l,pushDetailView:f,detailViewStackLength:r.length}},i.default.createElement(ye,{stack:r},e))}),ve=navigator.webdriver?0:500,Se=()=>{let[e,t]=(0,i.useState)([]),o=(0,i.useMemo)(()=>(0,Z.default)(l=>{t(p=>M(p,a=>{a.push(l)}))},ve,{leading:!0,trailing:!1}),[t]),r=(0,i.useCallback)(()=>{t(l=>M(l,p=>{p.pop()}))},[t]),d=(0,i.useCallback)(l=>()=>{o(l)},[o]),f=(0,i.useCallback)(()=>()=>{t([])},[t]);return(0,i.useMemo)(()=>({detailViewStack:e,setDetailViewStack:t,pushDetailView:o,popDetailView:r,resetDetailView:f,pushDetailViewCallback:d}),[e,r,o,f,d])},De=.15,ye=({children:e,stack:t})=>{let o=y(t,(a,m)=>a?.length===m.length),r=I(t),d=t.length>(o??[]).length,f=o===void 0,l=f?0:d?10:-10,p=f?1:0;return i.default.createElement(N,{mode:"wait"},i.default.createElement(we,{key:`${t.length}_${o?.length}`,initial:{x:l,opacity:p},animate:{x:0,opacity:1},exit:{opacity:0},transition:{duration:De},ref:Ve},r||e))},A=()=>{let e=(0,i.useContext)(Y);if(!e)throw new Error("Missing detail view context");return e},Ve=e=>{e&&e.parentElement&&(e.parentElement.scrollTop=0)};s();u();var P=c(h()),Ce=(0,P.createContext)({isOpen:!1,showSettingsMenu:w,hideSettingsMenu:w}),_=()=>(0,P.useContext)(Ce);s();u();var n=c(h());var ee=x.section`
  z-index: 1;
  background-color: ${D.colors.legacy.bgWallet};
  padding: 10px 16px;
  display: flex;
  flex-shrink: 0;
  flex-direction: row;
  align-items: center;
  justify-content: ${e=>e.justifyContent};
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${D.colors.legacy.borderSecondary};
  height: ${e=>e.height}px;
  width: 100%;
`;ee.defaultProps={justifyContent:"center",height:k};var te=x(R).attrs({size:16,weight:500,lineHeight:25})``;te.defaultProps={maxWidth:"280px",noWrap:!0};var be=x.div`
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  padding-bottom: 17px;
  position: relative;
  width: 100%;
`,oe=x($)`
  position: absolute;
  right: 0;
`,T=x(U)`
  position: absolute;
  left: 0;
`,Et=({children:e,items:t,sections:o,icon:r,shouldWrap:d,onIconClick:f,onLeftButtonClick:l,useCloseButton:p})=>{let a=Le({withCloseButton:p??!1,onLeftButtonClick:l}),m=o&&o.length>0||t&&t.length>0;return n.default.createElement(be,null,a,n.default.createElement(R,{weight:500,size:22,noWrap:!d,maxWidth:"280px"},e),m||f?n.default.createElement(oe,{sections:o,items:t,icon:r||n.default.createElement(W,null),onIconClick:f}):n.default.createElement("div",null))},re=x(ee)`
  position: relative;
  border-bottom: none;

  &:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: -20px;
    width: calc(100% + 40px);
    border-bottom: 1px solid ${D.colors.legacy.borderSecondary};
  }
`,Pe=x.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
`,Rt=({children:e,sections:t,items:o,icon:r,shouldWrap:d,onIconClick:f,onLeftButtonClick:l,disableIconBackground:p})=>{let a=Me(l),m=t&&t.length>0||o&&o.length>0;return n.default.createElement(re,null,a,n.default.createElement(Pe,null,typeof e=="string"?n.default.createElement(te,{noWrap:!d},e):e),m||f?n.default.createElement(oe,{sections:t,items:o,icon:r,onIconClick:f,disableIconBackground:p}):n.default.createElement("div",null))};re.defaultProps={justifyContent:"center",height:k};var Le=({withCloseButton:e,onLeftButtonClick:t})=>{let{popDetailView:o,detailViewStackLength:r}=A();return(0,n.useMemo)(()=>r===0?n.default.createElement("div",null):n.default.createElement(T,{onClick:()=>{t?.(),o()},"data-testid":"header--back"},e?n.default.createElement(H,null):n.default.createElement(E,null)),[e])},Me=e=>{let{hideSettingsMenu:t}=_(),{popDetailView:o,detailViewStackLength:r}=A();return(0,n.useMemo)(()=>r>0?n.default.createElement(T,{onClick:()=>{o()},"data-testid":"header--back"},n.default.createElement(E,null)):n.default.createElement(T,{"data-testid":"settings-menu-close-button",onClick:e??t},n.default.createElement(H,null)),[])};export{ce as a,Q as b,y as c,he as d,ct as e,A as f,Ce as g,_ as h,ee as i,Et as j,Rt as k};
//# sourceMappingURL=chunk-U3MJCGUQ.js.map
