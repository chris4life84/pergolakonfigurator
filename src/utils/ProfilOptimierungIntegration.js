import ProfilOptimierung from"./ProfilOptimierung.js";
export class ProfilOptimierungIntegration{
    constructor(){
        this.optimierer=new ProfilOptimierung,
        this.aktuelleProfile=null,
        this.letzteOptimierung=null
    }
    optimiereProfile(e, t){
        console.log(`🔍 Starte Profil-Optimierung für ${e}×${t}m`);
        const i=this.optimierer.optimiereProfile(e, t);
        return i.erfolg?(this.aktuelleProfile=i.konfiguration, this.letzteOptimierung={
            breite:e, tiefe:t, timestamp:Date.now()
        }, i.warnungen.length>0&&(console.group("⚠️ Profil-Warnungen"), i.warnungen.forEach(e=>console.warn(e)), console.groupEnd()), console.log("✅ Profile optimiert:", this.aktuelleProfile), i):(console.error("❌ Profil-Optimierung fehlgeschlagen"), null)
    }
    gibAktuelleProfile(){
        return this.aktuelleProfile
    }
    profilNameZuId(e){
        return`profil-${e.replace("x","x")}`
    }
    gibFormatierteProfilInfo(){
        return this.aktuelleProfile?{
            pfosten:{
                aussen:this.aktuelleProfile.aussenpfosten,
                mitte:this.aktuelleProfile.mittelpfosten
            },
            traeger:{
                rahmen:this.aktuelleProfile.rahmentraeger,
                mittelLaengs:this.aktuelleProfile.mitteltraegerLaengs,
                mittelQuer:this.aktuelleProfile.mitteltraegerQuer
            },
            statik:{
                status:this.aktuelleProfile.statikStatus,
                auslastung:this.aktuelleProfile.auslastung,
                hinweis:this.aktuelleProfile.hinweis
            }
        }
        :null
    }
}
let globaleInstanz=null;
export function gibProfilOptimierungInstanz(){
    return globaleInstanz||(globaleInstanz=new ProfilOptimierungIntegration),
    globaleInstanz
}