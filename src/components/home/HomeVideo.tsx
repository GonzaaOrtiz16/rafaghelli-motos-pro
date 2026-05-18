import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

const HomeVideo = ({ url }: { url: string }) => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleToggleSound = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted) videoRef.current.play().catch(() => {});
    }
  }, [isMuted]);

  return (
    <section className="pb-24 px-2 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative group rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-zinc-700 shadow-2xl border-4 border-muted aspect-[9/16] md:aspect-video max-h-[85vh]"
      >
        <video
          key={url}
          ref={videoRef}
          src={url}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted={isMuted}
          playsInline
          preload="none"
        />
        <div className="absolute top-6 left-6 md:top-12 md:left-12 z-20 pointer-events-none">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.8 }}>
            <h4 className="text-white text-2xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2 drop-shadow-lg">
              SENTÍ LA <span className="text-primary">POTENCIA</span>
            </h4>
            <p className="text-zinc-200 text-[10px] md:text-sm font-bold uppercase tracking-[0.2em] drop-shadow-md">
              Equipamiento premium para pilotos exigentes
            </p>
            <div className="w-12 h-1 bg-primary mt-4 rounded-full" />
          </motion.div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-zinc-800/80 via-transparent to-zinc-700/20 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-between p-4 md:p-10">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md h-10 w-10 md:h-12 md:w-12"
              onClick={handleToggleSound}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </Button>
          </div>
          <Link to="/productos">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter rounded-full px-5 md:px-8 h-10 md:h-12 text-xs md:text-sm shadow-xl">
              Explorar <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

export default HomeVideo;
