import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-8">
      <h1 className="text-5xl font-bold text-white mb-4">
        Claude Surf
      </h1>
      <p className="text-xl text-purple-100 mb-8">
        React + TS + Vite => Code-First UI
      </p>
      <p className="text-sm text-purple-200 mb-8">
        Ligatures: != === &lt;= &gt;= =&gt; -&gt; &lt;&gt;
      </p>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Phase 2 Complete!</CardTitle>
          <CardDescription>
            Fira Code + Ligatures => Dev-First Typography
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Click the button below to test the shadcn Button component:
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setCount((count) => count + 1)}>
              Default: {count}
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2">
          <p className="text-xs text-muted-foreground">
            Tailwind utilities: bg-purple-500, text-white, rounded-lg
          </p>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-red-500 rounded"></div>
            <div className="w-8 h-8 bg-purple-500 rounded"></div>
            <div className="w-8 h-8 bg-green-500 rounded"></div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default App;
