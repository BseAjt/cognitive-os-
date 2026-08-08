export type ActivationInput={cases:number;sources:number;orionCycles:number;decisions:number;actions:number;members:number;cloudConnected:boolean};
export type ActivationStep={id:"workspace"|"case"|"context"|"orion"|"decision"|"execution"|"team";label:string;complete:boolean;weight:number};
export type ValueProof={activation:number;completedSteps:number;totalSteps:number;timeToValueReady:boolean;decisionCoverage:number;executionCoverage:number;collaborationReady:boolean};

export function buildActivation(input:ActivationInput):{steps:ActivationStep[];proof:ValueProof}{
  const steps:ActivationStep[]=[
    {id:"workspace",label:"Espace cloud configuré",complete:input.cloudConnected,weight:10},
    {id:"case",label:"Premier dossier créé",complete:input.cases>0,weight:15},
    {id:"context",label:"Première source ajoutée",complete:input.sources>0,weight:15},
    {id:"orion",label:"Premier cycle ORION exécuté",complete:input.orionCycles>0,weight:20},
    {id:"decision",label:"Première décision tracée",complete:input.decisions>0,weight:20},
    {id:"execution",label:"Première action créée",complete:input.actions>0,weight:15},
    {id:"team",label:"Premier collaborateur ajouté",complete:input.members>1,weight:5}
  ];
  const activation=steps.reduce((sum,step)=>sum+(step.complete?step.weight:0),0);
  const completedSteps=steps.filter((step)=>step.complete).length;
  return {steps,proof:{activation,completedSteps,totalSteps:steps.length,timeToValueReady:input.orionCycles>0&&input.decisions>0,decisionCoverage:input.cases?Math.min(100,Math.round(input.decisions/input.cases*100)):0,executionCoverage:input.decisions?Math.min(100,Math.round(input.actions/input.decisions*100)):0,collaborationReady:input.members>1}};
}
