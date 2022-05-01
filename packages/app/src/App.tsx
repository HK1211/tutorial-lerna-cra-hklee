import React from 'react';
import { Button } from '@leehankue/monorepo-test-components';
import './App.css';

function App() {
  const [state, setState] = React.useState(0);
  return (
    <div className="App">
      test
     {state}
     <Button onClick={()=>setState(s=>s+1)}>Click me!</Button>
    </div>
  );
}

export default App;