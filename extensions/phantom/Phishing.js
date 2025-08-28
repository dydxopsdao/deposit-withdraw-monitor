import{a as C}from"./chunk-TKTYENT7.js";import{a as N}from"./chunk-O4VNAIYM.js";import"./chunk-FHFAALJ2.js";import{a as P}from"./chunk-5OZAXCD4.js";import"./chunk-IIOQMXXT.js";import"./chunk-4Z7SMQUN.js";import{a as U}from"./chunk-UQG7JMAN.js";import"./chunk-QNVVE6V5.js";import{d as T,ib as l,m as v,p as a,t as I}from"./chunk-MUQF2AZ6.js";import{a as z}from"./chunk-JMXFWMPT.js";import{c as L}from"./chunk-PYZSVA3F.js";import{V as w,Y as y}from"./chunk-M4A3OS5Y.js";import"./chunk-UCBZOSRF.js";import"./chunk-CO4KYCC7.js";import"./chunk-S2IPDOR6.js";import"./chunk-HPL6A5BE.js";import"./chunk-WWBVHQYQ.js";import"./chunk-UT4QDC7N.js";import"./chunk-2NFFZKWZ.js";import"./chunk-WITM4KDS.js";import"./chunk-M5NOGDCG.js";import{a as B}from"./chunk-XGAZBAFU.js";import{a as W}from"./chunk-F7PG7UT7.js";import"./chunk-HYOCMEEG.js";import"./chunk-SLYIHOOX.js";import"./chunk-6JDSADCT.js";import"./chunk-5JP6BIAB.js";import"./chunk-HHUNORJ5.js";import"./chunk-BIXLYDGB.js";import{H as p,x}from"./chunk-NVJ3LP7I.js";import"./chunk-7MK34BUQ.js";import"./chunk-7KFKYD5L.js";import{x as S}from"./chunk-KZCIEVG2.js";import"./chunk-RFTHTXRF.js";import"./chunk-X3THIE5D.js";import{a as k}from"./chunk-7GE6SGSX.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-O2N6PUOM.js";import"./chunk-UNDMYLJW.js";import{f as c,h as n,n as s}from"./chunk-3KENBVE7.js";n();s();var O=c(k());var J=c(z());n();s();var e=c(k());n();s();var r=c(k());var m=p.colors.legacy.accentAlert,A=a.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background-color: ${p.colors.brand.white};
  padding: clamp(24px, 16vh, 256px) 24px;
  box-sizing: border-box;
`,K=a.div`
  margin-bottom: 24px;
  padding-bottom: 8vh;
`,G=a.div`
  max-width: 100ch;
  margin: auto;

  * {
    text-align: left;
  }
`,F=a.a`
  text-decoration: underline;
  color: ${m};
`,d=new B,_=({origin:o,subdomain:t})=>{let{t:g}=x(),f=o?y(o):"",M=o??"",u=new URL(M).hostname,h=t==="true"?u:f,$=async()=>{if(t==="true"){let b=await d.get("userWhitelistedSubdomains"),i=JSON.parse(`${b}`);i?i.push(u):i=[u],i=[...new Set(i)],d.set("userWhitelistedSubdomains",JSON.stringify(i))}else{let b=await d.get("userWhitelistedOrigins"),i=JSON.parse(`${b}`);i?i.push(f):i=[f],i=[...new Set(i)],d.set("userWhitelistedOrigins",JSON.stringify(i))}self.location.href=o};return r.default.createElement(A,null,r.default.createElement(G,null,r.default.createElement(K,null,r.default.createElement(I,{width:128,fill:p.colors.brand.white})),r.default.createElement(l,{size:30,color:m,weight:"600"},g("blocklistOriginDomainIsBlocked",{domainName:h||g("blocklistOriginThisDomain")})),r.default.createElement(l,{color:m},g("blocklistOriginSiteIsMalicious")),r.default.createElement(l,{color:m},r.default.createElement(C,{i18nKey:"blocklistOriginCommunityDatabaseInterpolated"},"This site has been flagged as part of a",r.default.createElement(F,{href:w,rel:"noopener",target:"_blank"},"community-maintained database"),"of known phishing websites and scams. If you believe the site has been flagged in error,",r.default.createElement(F,{href:w,rel:"noopener",target:"_blank"},"please file an issue"),".")),h?r.default.createElement(l,{color:m,onClick:$,hoverUnderline:!0},g("blocklistOriginIgnoreWarning",{domainName:o})):r.default.createElement(r.default.Fragment,null)))};var H=()=>{let o;try{o=new URLSearchParams(self.location.search).get("origin")||"",new URL(o)}catch{o=""}return o},j=()=>new URLSearchParams(self.location.search).get("subdomain")||"",E=()=>{let o=(0,e.useMemo)(H,[]),t=(0,e.useMemo)(j,[]);return e.default.createElement(T,{future:{v7_startTransition:!0}},e.default.createElement(P,null,e.default.createElement(_,{origin:o,subdomain:t})))};W();S.init({provider:N});L("frontend");var q=document.getElementById("root"),Q=(0,J.createRoot)(q);Q.render(O.default.createElement(v,{theme:U},O.default.createElement(E,null)));
//# sourceMappingURL=Phishing.js.map
