import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Users, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container max-w-4xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center px-3 py-1 mb-6 rounded-full bg-secondary/50 border border-secondary text-secondary-foreground text-xs font-medium uppercase tracking-wider">
            <Sparkles className="w-3 h-3 mr-2" />
            Team Sync Reimagined
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            Meeting Facilitator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Gather answers from your team in real-time and reveal them together. 
            Perfect for retrospectives, brainstorming, and honest feedback.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto"
        >
          <Link to="/create" className="group">
            <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="p-8 flex flex-col items-center text-center h-full justify-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Create a Meeting</h3>
                  <p className="text-sm text-muted-foreground">Start a new session and invite your team to join.</p>
                </div>
                <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/join" className="group">
            <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/5">
              <CardContent className="p-8 flex flex-col items-center text-center h-full justify-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Join a Meeting</h3>
                  <p className="text-sm text-muted-foreground">Enter a code to join an existing session.</p>
                </div>
                <Button variant="secondary" className="w-full mt-4">
                  Join Session <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-muted-foreground/50">
            Designed for modern teams. Built for speed.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
