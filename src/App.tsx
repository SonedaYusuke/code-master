import { useEffect, useState } from 'react';
import { formatRoute } from './lib/route';
import type { QuizResult } from './lib/quiz';
import { navigate, useHashRoute } from './router';
import Home from './pages/Home';
import Study from './pages/Study';
import Quiz from './pages/Quiz';
import Result from './pages/Result';

export default function App() {
  const route = useHashRoute();
  const canonical = formatRoute(route);
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (window.location.hash !== canonical) navigate(route, true);
  }, [canonical]);

  function handleFinish(result: QuizResult) {
    setLastResult(result);
    navigate({ page: 'result', level: result.level });
  }

  switch (route.page) {
    case 'study':
      return <Study key={route.level} level={route.level} />;
    case 'quiz':
      // key でレベルが変わったときに問題を作り直す
      return <Quiz key={route.level} level={route.level} onFinish={handleFinish} />;
    case 'result':
      return <Result level={route.level} result={lastResult} />;
    default:
      return <Home />;
  }
}
