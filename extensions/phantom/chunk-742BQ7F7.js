import{F as x,ib as c,o as d,p as a,sa as p}from"./chunk-MUQF2AZ6.js";import{H as t}from"./chunk-NVJ3LP7I.js";import{a as _}from"./chunk-7GE6SGSX.js";import{f as O,h as r,n as i}from"./chunk-3KENBVE7.js";r();i();var e=O(_());r();i();var z=t.colors.legacy.accentWarning,$=t.colors.legacy.accentAlert,g=t.colors.legacy.accentAlert;var N=a.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`,P=d`
  0% {
    top: 15px;
    opacity: 0;
  };
  100% {
    top: 0px;
    opacity: 1;
  };
`,k=a.div`
  animation-name: ${o=>o.animateText?P:"none"};
  animation-duration: ${o=>o.animateText?".5s":"0s"};
  position: relative;
`,T=a(c)`
  margin: ${o=>o.margin};
`;T.defaultProps={margin:"20px auto 0 auto"};var y=a(c)`
  margin: ${o=>o.margin};
`;y.defaultProps={margin:"15px 0px 0px 0px"};var A=a.div`
  position: relative;
  left: 38px;
  bottom: 22px;
`;var b={large:30,medium:28,small:24},v={large:34,medium:34,small:29},w={large:18,medium:16,small:14},W=({className:o,icon:I,primaryText:l,secondaryText:m,headerStyle:n,showWarning:H=!1,showError:S=!1,animateText:f=!1})=>{n=n??"medium";let u=b[n],E=v[n],M=w[n],R={large:22,medium:19,small:17}[n],s=n==="small"?"16px 0 0 0":void 0,L=S?g:t.colors.legacy.textSecondary;return e.default.createElement(N,{className:o},I??e.default.createElement(x,null),H?e.default.createElement(A,null,e.default.createElement(p,null)):e.default.createElement(e.default.Fragment,null),e.default.createElement(k,{animateText:f},l&&e.default.createElement(T,{margin:s,weight:500,size:u,lineHeight:E,maxWidth:"320px"},l),m&&e.default.createElement(y,{margin:s,wordBreak:"break-word",size:M,lineHeight:R,color:L},m)))};W.defaultProps={headerStyle:"medium"};export{z as a,$ as b,g as c,W as d};
//# sourceMappingURL=chunk-742BQ7F7.js.map
