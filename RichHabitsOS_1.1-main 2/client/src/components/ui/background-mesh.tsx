import { motion } from "framer-motion";

export function BackgroundMesh() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))]" />
      
      {/* Static Mesh Gradients - Optimized for Performance */}
      <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-neon-purple/10 rounded-full blur-[120px] opacity-30" />
      <div className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] bg-neon-blue/10 rounded-full blur-[120px] opacity-30" />
      <div className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] bg-neon-pink/5 rounded-full blur-[120px] opacity-30" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}
