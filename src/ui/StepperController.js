export class StepperController{
    constructor(){
        this.currentStep=1,
        this.totalSteps=0,
        this.stepperSteps=[],
        this.stepContents=[],
        this.completedSteps=new Set,
        console.log("🎯 StepperController initialisiert")
    }
    initialisieren(){
        this.stepperSteps=Array.from(document.querySelectorAll(".stepper-step")),
        this.stepContents=Array.from(document.querySelectorAll(".step-content")),
        this.totalSteps=this.stepperSteps.length,
        console.log("🔍 Gefundene Stepper Steps:", this.stepperSteps.length),
        console.log("🔍 Gefundene Step Contents:", this.stepContents.length),
        0!==this.stepperSteps.length?(this.stepperSteps.forEach((t, e)=>{
            const s=e+1;
            console.log(`📌 Registriere Click-Handler für Schritt ${s}`), t.addEventListener("click", t=>{
                console.log(`🖱️ Klick auf Schritt ${s}`), t.preventDefault(), t.stopPropagation(), this.navigiereZuSchritt(s)
            });
            const r=t.querySelector(".stepper-label");
            r&&r.addEventListener("click", t=>{
                t.stopPropagation()
            })
        }), this.navigiereZuSchritt(1), console.log(`✅ Stepper initialisiert mit ${this.totalSteps} Schritten`)):console.warn("⚠️ Keine Stepper-Steps gefunden")
    }
    navigiereZuSchritt(t){
        if(t<1||t>this.totalSteps)console.warn(`⚠️ Ungültige Schrittnummer: ${t}`);
        else{
            if(this.currentStep<t)for(let e=this.currentStep;
            e<t;
            e++)this.completedSteps.add(e);
            this.currentStep=t,
            this.aktualisiereUI(),
            this.dispatchStepChangeEvent(t),
            console.log(`📍 Navigiere zu Schritt ${t}`)
        }
    }
    aktualisiereUI(){
        console.log(`🔄 Aktualisiere UI für Schritt ${this.currentStep}`),
        this.stepperSteps.forEach((t, e)=>{
            const s=e+1;
            t.classList.remove("active", "completed"), s===this.currentStep&&(t.classList.add("active"), console.log(`✓ Schritt ${s} als ACTIVE markiert`)), this.completedSteps.has(s)&&(t.classList.add("completed"), console.log(`✓ Schritt ${s} als COMPLETED markiert`))
        }),
        this.stepContents.forEach((t, e)=>{
            const s=e+1;
            s===this.currentStep?(t.classList.add("active"), console.log(`👁️ Content ${s} angezeigt`)):t.classList.remove("active")
        }),
        console.log("✅ UI aktualisiert")
    }
    naechsterSchritt(){
        this.currentStep<this.totalSteps&&this.navigiereZuSchritt(this.currentStep+1)
    }
    vorherigerSchritt(){
        this.currentStep>1&&this.navigiereZuSchritt(this.currentStep-1)
    }
    markiereSchrittAlsAbgeschlossen(t){
        this.completedSteps.add(t),
        this.aktualisiereUI()
    }
    entferneAbgeschlossen(t){
        this.completedSteps.delete(t),
        this.aktualisiereUI()
    }
    gibAktuellenSchritt(){
        return this.currentStep
    }
    dispatchStepChangeEvent(t){
        const e=new CustomEvent("stepperChanged", {
            detail:{
                currentStep:t, totalSteps:this.totalSteps, completedSteps:Array.from(this.completedSteps)
            }
        });
        document.dispatchEvent(e)
    }
    zuruecksetzen(){
        this.currentStep=1,
        this.completedSteps.clear(),
        this.aktualisiereUI(),
        console.log("🔄 Stepper zurückgesetzt")
    }
    debug(){
        console.group("🎯 STEPPER CONTROLLER DEBUG"),
        console.log("Aktueller Schritt:", this.currentStep),
        console.log("Gesamt Schritte:", this.totalSteps),
        console.log("Abgeschlossene Schritte:", Array.from(this.completedSteps)),
        console.log("Stepper Steps:", this.stepperSteps.length),
        console.log("Step Contents:", this.stepContents.length),
        console.groupEnd()
    }
}