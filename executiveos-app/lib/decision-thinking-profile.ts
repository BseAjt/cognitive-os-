import type { DiscStyle } from "./disc-decision-profile.ts";

export type ThinkingDimension = "speed"|"evidence"|"risk"|"stakeholders"|"execution"|"opportunityCost"|"reversibility"|"longTerm"|"dissent";
export type ProfileConfidence = "initial"|"emerging"|"supported"|"established";
export type AssessmentAnswer = { questionId:string; optionId:string };
export type DimensionScores = Record<ThinkingDimension,number>;

export interface DecisionThinkingProfile {
  discPrimary:DiscStyle;
  discSecondary:DiscStyle;
  discScores:Record<DiscStyle,number>;
  dimensions:DimensionScores;
  confidence:ProfileConfidence;
  evidenceCount:number;
  source:"assessment"|"observed"|"corrected";
}

type Signal = { disc:Partial<Record<DiscStyle,number>>; dimensions:Partial<DimensionScores> };
export interface AssessmentOption { id:string; label:string; signal:Signal }
export interface AssessmentQuestion { id:string; prompt:string; options:AssessmentOption[] }

const option=(id:string,label:string,disc:DiscStyle,dimension:ThinkingDimension,secondary?:ThinkingDimension):AssessmentOption=>({id,label,signal:{disc:{[disc]:3},dimensions:{[dimension]:3,...(secondary?{[secondary]:1}:{})}}});

export const decisionAssessmentQuestions:AssessmentQuestion[]=[
  {id:"uncertainty",prompt:"Une opportunité importante apparaît, mais les informations sont incomplètes. Votre premier réflexe ?",options:[option("act","Décider selon le gain potentiel et avancer.","D","speed","risk"),option("rally","Mobiliser les personnes capables de la faire réussir.","I","stakeholders","speed"),option("protect","Mesurer les conséquences sur les engagements existants.","S","longTerm","stakeholders"),option("verify","Rechercher les données manquantes avant de trancher.","C","evidence","risk")]},
  {id:"disagreement",prompt:"Deux responsables défendent des options opposées. Que faites-vous d’abord ?",options:[option("decide","Fixer le résultat attendu et arbitrer.","D","speed","execution"),option("debate","Faire émerger une solution par la discussion.","I","dissent","stakeholders"),option("align","Chercher un compromis soutenable pour l’équipe.","S","stakeholders","longTerm"),option("compare","Comparer les hypothèses et les preuves.","C","evidence","dissent")]},
  {id:"deadline",prompt:"Une échéance approche et le dossier reste imparfait. Votre tendance naturelle ?",options:[option("ship","Décider avec les éléments disponibles.","D","speed","execution"),option("activate","Créer une dynamique pour débloquer la situation.","I","stakeholders","speed"),option("secure","Préserver la continuité et limiter les perturbations.","S","risk","longTerm"),option("delay","Obtenir une information supplémentaire critique.","C","evidence","risk")]},
  {id:"failure",prompt:"Une décision récente produit un résultat décevant. Quelle est votre première réaction ?",options:[option("correct","Corriger rapidement la trajectoire.","D","execution","speed"),option("debrief","Échanger avec les acteurs pour comprendre.","I","stakeholders","dissent"),option("stabilize","Sécuriser les personnes et opérations touchées.","S","longTerm","stakeholders"),option("audit","Reconstituer les faits et hypothèses erronées.","C","evidence","risk")]},
  {id:"investment",prompt:"Face à un investissement prometteur, qu’est-ce qui compte d’abord ?",options:[option("return","L’impact et le rendement potentiel.","D","opportunityCost","speed"),option("traction","L’adhésion qu’il peut susciter.","I","stakeholders","longTerm"),option("fit","Sa compatibilité avec les engagements actuels.","S","execution","longTerm"),option("case","La solidité du dossier chiffré.","C","evidence","risk")]},
  {id:"change",prompt:"Une transformation importante devient nécessaire. Comment l’abordez-vous ?",options:[option("target","Annoncer la cible et accélérer l’exécution.","D","execution","speed"),option("story","Donner envie et embarquer largement.","I","stakeholders","longTerm"),option("pace","Construire une transition progressive.","S","longTerm","risk"),option("plan","Cartographier dépendances, risques et étapes.","C","risk","reversibility")]},
  {id:"choice",prompt:"Deux options semblent également valables. Comment les départagez-vous ?",options:[option("leverage","Choisir celle qui crée le plus de levier.","D","opportunityCost","speed"),option("support","Choisir celle qui mobilise le mieux.","I","stakeholders","execution"),option("durable","Choisir la plus soutenable dans le temps.","S","longTerm","risk"),option("criteria","Créer une grille de critères comparables.","C","evidence","reversibility")]},
  {id:"team",prompt:"Votre équipe hésite à exécuter une décision. Votre premier mouvement ?",options:[option("clarify","Clarifier les responsabilités et résultats.","D","execution","speed"),option("convince","Reformuler la vision et convaincre.","I","stakeholders","dissent"),option("listen","Écouter les inquiétudes et ajuster le rythme.","S","stakeholders","longTerm"),option("document","Répondre précisément aux objections.","C","evidence","risk")]},
  {id:"missing",prompt:"Quel risque vous préoccupe le plus dans une décision ?",options:[option("inaction","Perdre du temps ou laisser passer l’occasion.","D","opportunityCost","speed"),option("rejection","Ne pas obtenir l’adhésion nécessaire.","I","stakeholders","execution"),option("disruption","Déstabiliser l’organisation ou les relations.","S","longTerm","risk"),option("error","Décider sur une hypothèse incorrecte.","C","evidence","risk")]},
  {id:"review",prompt:"Avant de finaliser une décision importante, vous préférez…",options:[option("commit","Définir l’action immédiate et le responsable.","D","execution","speed"),option("socialize","Tester la décision auprès d’interlocuteurs clés.","I","stakeholders","dissent"),option("sequence","Préparer une mise en œuvre progressive.","S","longTerm","reversibility"),option("stress","Tester les hypothèses et scénarios contraires.","C","dissent","evidence")]},
];

const dimensions:ThinkingDimension[]=["speed","evidence","risk","stakeholders","execution","opportunityCost","reversibility","longTerm","dissent"];
const styles:DiscStyle[]=["D","I","S","C"];

export function scoreDecisionAssessment(answers:AssessmentAnswer[]):DecisionThinkingProfile{
  const discScores={D:0,I:0,S:0,C:0};
  const raw=Object.fromEntries(dimensions.map((key)=>[key,0])) as DimensionScores;
  for(const answer of answers){const question=decisionAssessmentQuestions.find((item)=>item.id===answer.questionId);const selected=question?.options.find((item)=>item.id===answer.optionId);if(!selected)continue;for(const [key,value] of Object.entries(selected.signal.disc))discScores[key as DiscStyle]+=value??0;for(const [key,value] of Object.entries(selected.signal.dimensions))raw[key as ThinkingDimension]+=value??0;}
  const ordered=[...styles].sort((a,b)=>discScores[b]-discScores[a]);
  const max=Math.max(1,...Object.values(raw));
  const normalized=Object.fromEntries(dimensions.map((key)=>[key,Math.round((raw[key]/max)*100)])) as DimensionScores;
  return {discPrimary:ordered[0],discSecondary:ordered[1],discScores,dimensions:normalized,confidence:answers.length===decisionAssessmentQuestions.length?"initial":"initial",evidenceCount:answers.length,source:"assessment"};
}

export function validateAssessmentAnswers(answers:AssessmentAnswer[]):boolean{
  return answers.length===decisionAssessmentQuestions.length&&decisionAssessmentQuestions.every((question)=>answers.filter((answer)=>answer.questionId===question.id&&question.options.some((option)=>option.id===answer.optionId)).length===1);
}
