import fs from 'node:fs';
import path from 'node:path';
export function fixture(root) {
  fs.mkdirSync(root, { recursive: true });
  const state = { schemaVersion: 2, selectedVariant: 'A', designSystem: { confirmed: true, fonts: ['Georgia'] }, variants: {}, recommendation: {variant:'A',reason:'Triage is the primary task.'} };
  for (const id of ['A','B','C']) {
    const entry = `Variant${id}.tsx`;
    fs.writeFileSync(path.join(root, entry), `import {useState} from 'react';
export default function Variant${id}(){const [count,setCount]=useState(0);return <main style={{fontFamily:'Georgia'}}><nav>Shared navigation</nav>{/* zone:hero:start */}<section data-zone="hero"><h1>Direction ${id}</h1><button onClick={()=>setCount(count+1)}>Inspect {count}</button></section>{/* zone:hero:end */}<footer>Evidence retained</footer></main>}`);
    state.variants[id] = { entry, files: [entry], tokens: {fonts:['Georgia']}, version:1, history:[],undo:[], comparison:{optimizes:`Task strategy ${id}`,tradeoff:'Less space for secondary details',bestFor:'Job investigation'} };
  }
  fs.writeFileSync(path.join(root, '.variant-context.json'), JSON.stringify(state));
  return state;
}
