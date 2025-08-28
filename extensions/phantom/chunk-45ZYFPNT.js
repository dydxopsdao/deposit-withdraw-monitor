import{a as b}from"./chunk-KDEX35NE.js";import{a as u,b as x,e as m}from"./chunk-RTRPEFQC.js";import{ib as f,l as g,p as r}from"./chunk-MUQF2AZ6.js";import{H as t,M as d}from"./chunk-NVJ3LP7I.js";import{a as C}from"./chunk-7GE6SGSX.js";import{f as w,h as p,n as s}from"./chunk-3KENBVE7.js";p();s();var e=w(C());var I=r.div`
  display: flex;
  height: 49px;
  padding: 0 16px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  &:last-of-type {
    margin-bottom: 0;
  }
  background-color: ${o=>o.customBackground??t.colors.legacy.bgRow};
  ${o=>o.onClick?g`
          :hover {
            background-color: ${t.colors.legacy.bgButton};
          }
          cursor: pointer;
        `:""}
`,v=r.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`,L=r.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`,P=r.div`
  display: flex;
  margin: 2px 4px 0 0;
`,W=r(f).attrs(o=>({color:o.color||t.colors.legacy.textSecondary,size:14,lineHeight:17,weight:400,noWrap:!0,paddingLeft:8}))`
  cursor: ${o=>o.onClick?"pointer":"default"};
  text-decoration: none;
`,A=({children:o,icon:n,fontWeight:i,label:y,lineHeight:h,customBackground:k,color:R,tooltipContent:l,isLoading:c=!1,error:a,onClick:T})=>e.default.createElement(I,{customBackground:k,onClick:c?void 0:T},e.default.createElement(L,null,e.default.createElement(v,null,n?e.default.createElement(P,null,n):null,e.default.createElement(m,{tooltipAlignment:"topLeft",iconSize:12,lineHeight:h??17,fontWeight:i??400,info:l?e.default.createElement(N,{tooltipContent:l}):null,textColor:R||t.colors.legacy.textPrimary},y)),a?e.default.createElement(d,{color:"accentAlert",font:"label",children:a}):null),c?e.default.createElement(b,{width:"75px",height:"15px",borderRadius:"50px",backgroundColor:t.colors.legacy.borderSecondary}):o),N=({tooltipContent:o})=>e.default.createElement(x,null,typeof o=="string"?e.default.createElement(u,null,o):o),j=({children:o,color:n,onClick:i})=>e.default.createElement(W,{onClick:i,color:n||t.colors.legacy.textSecondary},o||"-");export{A as a,N as b,j as c};
//# sourceMappingURL=chunk-45ZYFPNT.js.map
