import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Map, Target, ShieldAlert, Sparkles, CheckSquare, Square } from 'lucide-react';
import MentorImage from '../components/MentorImage';
import { useAppStore, BlueprintContent } from '../store/useAppStore';
import { mentors } from '../lib/mentors';
import { getMentorResponse } from '../lib/gemini';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';

export default function BlueprintDashboard() {
  const { blueprintId } = useParams<{ blueprintId: string }>();
  const navigate = useNavigate();
  const { blueprints, updateBlueprint, updateBlueprintTaskStatus } = useAppStore();
  
  const blueprint = blueprints.find(b => b.id === blueprintId);
  const [isGenerating, setIsGenerating] = useState(blueprint?.status === 'generating');
  const [reviewResult, setReviewResult] = useState<string | null>(null);

  useEffect(() => {
    if (!blueprint) return;
    if (blueprint.status !== 'generating') {
      setIsGenerating(false);
      return;
    }

    const generateBlueprint = async () => {
      try {
        const participantMentors = blueprint.participants.map(id => mentors.find(m => m.id === id)).filter(Boolean);
        
        const systemPrompt = `Council Strategy: "${blueprint.goal}" (${blueprint.timeframe}).
        Strategists: ${participantMentors.map(m => m?.name).join(', ')}.

        Respond ONLY with a valid JSON object matching this schema exactly:
        {
          "mission": "Profound 1-sentence mission.",
          "roadmap": [
            {
              "phase": "Phase name (e.g. 'Foundations')",
              "tasks": [{ "title": "Actionable task" }]
            }
          ],
          "habits": [{ "title": "Habit Name", "description": "Why/How" }],
          "obstacles": ["Potential obstacle"],
          "advice": [{ "mentorId": "one of: ${participantMentors.map(m => m?.id).join(', ')}", "advice": "Brief quote" }],
          "milestones": [{ "title": "Milestone name", "description": "Success sign" }]
        }
        Be realistic and authoritative.`;

        const responseText = await getMentorResponse(systemPrompt, 'JSON Blueprint.', [], true, true);
        const parsedContent = JSON.parse(responseText.replace(/^```json/, '').replace(/```$/, '').trim()) as BlueprintContent;
        
        parsedContent.roadmap.forEach(phase => {
          phase.tasks.forEach(task => { task.id = task.id || uuidv4(); task.completed = false; });
        });

        updateBlueprint(blueprint.id, {
          content: parsedContent,
          status: 'active'
        });
        setIsGenerating(false);

      } catch (error) {
        console.error("Failed to generate blueprint:", error);
        const fallbackContent: BlueprintContent = {
          mission: "Seek wisdom within to overcome the shadows of doubt.",
          roadmap: [{ phase: "Adjustment", tasks: [{ id: uuidv4(), title: "Retry protocol later", completed: false }] }],
          habits: [{ title: "Reflective Silence", description: "Wait for the network to stabilize." }],
          obstacles: ["Spiritual dissonance and temporal lags."],
          advice: [{ mentorId: blueprint.participants[0] || "", advice: "Wait for the light to return." }],
          milestones: []
        };

        updateBlueprint(blueprint.id, {
          content: fallbackContent,
          status: 'active'
        });
        setIsGenerating(false);
      }
    };

    generateBlueprint();
  }, [blueprint?.id]);

  if (!blueprint) return null;

  const content = blueprint.content;
  
  let totalTasks = 0;
  let completedTasks = 0;
  if (content) {
    content.roadmap.forEach(phase => {
      phase.tasks.forEach(task => {
        totalTasks++;
        if (task.completed) completedTasks++;
      });
    });
  }
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col relative w-full h-full bg-black overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary-gold/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary-gold/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-30 flex px-8 pt-16 pb-6 bg-black/40 backdrop-blur-xl border-b border-white/5 items-start gap-6 shadow-2xl">
        <button onClick={() => navigate(-1)} className="p-3 rounded-2xl border border-white/10 bg-white/5 text-white/40 hover:text-primary-gold transition-all">
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.6em] text-primary-gold/60 mb-2 flex items-center gap-2">
            <Map size={12} className="animate-pulse" /> Strategic Blueprint
          </span>
          <h2 className="font-serif text-xl text-white leading-tight tracking-tight line-clamp-1 italic">"{blueprint.goal}"</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto z-10 custom-scrollbar pb-40">
        {isGenerating || !content ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center">
            <motion.div 
               animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }} 
               transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
               className="w-40 h-40 rounded-full border border-primary-gold/20 bg-primary-gold/5 flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(201,168,76,0.1)]"
            >
              <div className="absolute inset-0 border-2 border-primary-gold animate-pulse opacity-10 rounded-full" />
              <Map size={48} className="text-primary-gold animate-pulse" />
            </motion.div>
            <h3 className="font-serif text-3xl text-white mb-6 uppercase tracking-[0.2em]">Inscribing Strategy</h3>
            <p className="text-[11px] font-sans font-bold text-primary-gold/60 uppercase tracking-[0.5em] animate-pulse">Consulting the council for your {blueprint.timeframe.toLowerCase()} trajectory...</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 space-y-24 max-w-4xl mx-auto"
          >
            
            {/* Mission Statement */}
            <div className="text-center relative pt-10">
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.5em] text-white/20 block mb-6">{blueprint.timeframe} Master Objective</span>
              <h1 className="font-serif text-3xl md:text-5xl text-white italic leading-relaxed mb-12 border-b-2 border-white/5 pb-16 px-4">
                "{content.mission}"
              </h1>
              
              {/* Progress Container */}
              <div className="max-w-md mx-auto relative group">
                <div className="absolute -inset-4 bg-primary-gold/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-full bg-white/5 rounded-full h-2 border border-white/5 overflow-hidden mb-4 shadow-inner relative z-10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 2.5, ease: "circOut" }}
                    className="h-full bg-gradient-to-r from-primary-gold/40 to-primary-gold shadow-[0_0_20px_rgba(201,168,76,0.6)]" 
                  />
                </div>
                <div className="flex justify-between items-center px-2 relative z-10">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-white/30 italic">Realization Mastery</span>
                  <span className="text-[11px] font-sans text-primary-gold font-bold tracking-widest">{progressPercent}%</span>
                </div>
              </div>
            </div>

            {/* Counsel Council Directives */}
            <div>
              <div className="flex items-center gap-6 mb-12">
                <Sparkles size={18} className="text-primary-gold animate-pulse" />
                <h3 className="text-[12px] font-sans font-bold uppercase tracking-[0.8em] text-primary-gold/80">Masters' Directives</h3>
                <div className="flex-1 border-t-2 border-white/5" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {content.advice.map((adv, i) => {
                  const m = mentors.find(mnt => mnt.id === adv.mentorId);
                  return (
                    <div key={i} className="bg-premium-card border border-white/5 rounded-[48px] p-10 flex flex-col gap-8 relative overflow-hidden group shadow-2xl">
                      <div className="flex items-center gap-6">
                        <MentorImage 
                          src={m?.imageUrl}
                          fallback={m?.imageFallback || ''}
                          alt={m?.name || ''}
                          size="md"
                          containerClassName="border-2 border-primary-gold/40 bg-black rounded-[24px] p-1 shadow-2xl"
                        />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-sans text-primary-gold/40 font-bold uppercase tracking-[0.4em] mb-1">Mentor</span>
                          <p className="font-serif text-lg text-white tracking-widest uppercase">{m?.name}</p>
                        </div>
                      </div>
                      <p className="font-serif text-xl text-white/80 leading-relaxed italic border-l-2 border-primary-gold/20 pl-8">
                        "{adv.advice}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategic Roadmap */}
            <div>
              <div className="flex items-center gap-6 mb-16">
                <Target size={18} className="text-primary-gold" />
                <h3 className="text-[12px] font-sans font-bold uppercase tracking-[0.8em] text-primary-gold/80">Strategic Roadmap</h3>
                <div className="flex-1 border-t-2 border-white/5" />
              </div>
              <div className="relative border-l-2 border-white/10 ml-6 pl-12 space-y-20">
                {content.roadmap.map((phase, pIndex) => (
                  <div key={pIndex} className="relative">
                    <div className="absolute w-4 h-4 bg-black border-2 border-primary-gold rounded-full -left-[57px] top-2 shadow-[0_0_15px_#C9A84C]" />
                    <div className="flex items-center gap-5 mb-10">
                       <span className="text-[10px] font-sans text-primary-gold font-bold px-3 py-1 bg-primary-gold/10 border border-primary-gold/30 rounded-xl uppercase tracking-widest">Phase {pIndex + 1}</span>
                       <h4 className="font-serif text-white text-2xl md:text-3xl tracking-tight leading-tight italic">{phase.phase}</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      {phase.tasks.map((task) => (
                        <motion.div 
                          key={task.id} 
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateBlueprintTaskStatus(blueprint.id, pIndex, task.id, !task.completed)}
                          className={clsx(
                            "flex items-start gap-6 p-8 rounded-[40px] border cursor-pointer transition-all relative overflow-hidden group shadow-xl",
                            task.completed ? "bg-primary-gold/5 border-primary-gold/30 opacity-60" : "bg-premium-card border-white/5 hover:border-white/10"
                          )}
                        >
                          <div className="shrink-0 mt-1">
                            {task.completed ? 
                              <CheckSquare size={22} className="text-primary-gold" /> : 
                              <Square size={22} className="text-white/10 group-hover:text-white/30 transition-colors" />
                            }
                          </div>
                          <span className={clsx("font-serif text-xl leading-relaxed tracking-tight", task.completed ? "text-white/40 line-through italic" : "text-white/90 font-medium")}>
                            {task.title}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Intellectual Habits */}
            <div>
               <div className="flex items-center gap-6 mb-12">
                <Map size={18} className="text-primary-gold" />
                <h3 className="text-[12px] font-sans font-bold uppercase tracking-[0.8em] text-primary-gold/80">Master Rituals</h3>
                <div className="flex-1 border-t-2 border-white/5" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {content.habits.map((habit, i) => (
                  <div key={i} className="bg-premium-card border border-white/5 rounded-[40px] p-10 relative overflow-hidden group shadow-2xl">
                    <h4 className="font-serif text-white text-2xl mb-4 tracking-tight italic group-hover:text-primary-gold transition-colors">{habit.title}</h4>
                    <p className="font-serif text-lg text-white/60 leading-relaxed italic">{habit.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Perils (Obstacles) */}
            <div>
               <div className="flex items-center gap-6 mb-12">
                <ShieldAlert size={18} className="text-primary-gold" />
                <h3 className="text-[12px] font-sans font-bold uppercase tracking-[0.8em] text-primary-gold/80">Anticipated Deviations</h3>
                <div className="flex-1 border-t-2 border-white/5" />
              </div>
              <div className="space-y-4">
                {content.obstacles.map((obs, i) => (
                  <div key={i} className="flex gap-6 p-8 bg-white/5 border border-white/10 rounded-[40px] relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-primary-gold/30" />
                    <ShieldAlert size={18} className="text-primary-gold/40 shrink-0 mt-1" />
                    <p className="font-serif text-lg text-white/70 italic leading-relaxed">{obs}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Council Progress Review */}
            <div className="pt-20 border-t-2 border-white/5">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
                <div className="flex items-center gap-4">
                   <Sparkles size={20} className="text-primary-gold" />
                   <h3 className="text-[14px] font-sans font-bold uppercase tracking-[0.7em] text-primary-gold/80">Consult the Council</h3>
                </div>
                <button 
                  onClick={async () => {
                     setIsGenerating(true);
                     const pMentors = blueprint.participants.map(id => mentors.find(m => m.id === id)).filter(Boolean);
                     const systemPrompt = `You are a strategic examiner reviewing a disciple's progress.
                     Ambition: "${blueprint.goal}"
                     Completion Level: ${progressPercent}% 
                     Strategists involved: ${pMentors.map(m=>m?.name).join(', ')}

                     Provide a "Council Review":
                     Analyze their progress trajectory and offer a brief, encouraging yet authoritative 2-sentence perspective on their current state of realization.`;
                     
                     let response = "The Council cannot reflect at this moment.";
                     try {
                        response = await getMentorResponse(systemPrompt, 'Master, review my path.');
                     } catch(e) {
                        console.error(e);
                     }
                     setReviewResult(response);
                     setIsGenerating(false);
                  }}
                  disabled={isGenerating || progressPercent === 0}
                  className="px-10 py-5 bg-primary-gold text-black rounded-3xl text-[12px] font-sans font-bold uppercase tracking-widest hover:shadow-[0_15px_40px_rgba(201,168,76,0.3)] disabled:opacity-30 transition-all shadow-xl"
                >
                  Request Master Logic
                </button>
              </div>
              
              <AnimatePresence>
                {reviewResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-premium-card border-2 border-primary-gold/30 rounded-[64px] p-16 md:p-24 relative overflow-hidden shadow-[0_0_60px_rgba(201,168,76,0.1)]"
                  >
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-primary-gold"><Sparkles size={80} /></div>
                    <p className="font-serif text-white text-2xl md:text-4xl leading-relaxed italic text-center px-4 relative z-10">
                      "{reviewResult}"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
          </motion.div>
        )}
      </div>
    </div>
  );
}
